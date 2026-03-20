import {
  Container,
  Graphics,
  Text,
  type FederatedPointerEvent,
} from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { PitchView, type PositionSlot } from '../components/PitchView.ts';
import { CardView, CARD_WIDTH, CARD_HEIGHT } from '../components/CardView.ts';
import { Button } from '../components/Button.ts';
import type { CardDef } from '../../core/data/schemas.ts';
import type { TeamSlot } from '../../core/models/Team.ts';
import { FormationValidator } from '../../core/systems/FormationValidator.ts';
import { Colors, OUTLINE_WIDTH, makeTextStyle } from '../theme.ts';

const SCENE_W = 960;
const SCENE_H = 640;
const PITCH_W = 700;
const PITCH_H = 420;
const PITCH_X = (SCENE_W - PITCH_W) / 2;
const PITCH_Y = 46;
const TRAY_Y  = PITCH_Y + PITCH_H + 12;
const TRAY_H  = SCENE_H - TRAY_Y;

const CARD_SCALE   = 0.60;
const CARD_W_S     = Math.round(CARD_WIDTH  * CARD_SCALE);
const CARD_H_S     = Math.round(CARD_HEIGHT * CARD_SCALE);
const CARD_GAP     = 12;

const SNAP_THRESHOLD = 64;

interface CardProvider {
  getAllCards(): CardDef[];
}

const POS_COLORS: Record<string, number> = {
  GK: Colors.cardGK, DEF: Colors.cardDEF, MID: Colors.cardMID, FWD: Colors.cardFWD,
};

function makeGhost(card: CardDef): Container {
  const c = new Container();
  c.eventMode = 'none';

  const g = new Graphics();
  g.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
  g.fill({ color: POS_COLORS[card.position] ?? 0x666666, alpha: 0.88 });
  g.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
  g.stroke({ color: Colors.outline, width: OUTLINE_WIDTH });
  c.addChild(g);

  const t = new Text({
    text: card.name,
    style: makeTextStyle({ fontSize: 18, fontWeight: 'bold', align: 'center' }),
  });
  t.anchor.set(0.5);
  t.position.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
  c.addChild(t);

  c.pivot.set(CARD_WIDTH / 2, CARD_HEIGHT / 2);
  c.alpha = 0.82;
  return c;
}

export class FormationScene implements IScene {
  readonly name = 'formation';
  readonly container = new Container();

  private pitch: PitchView;
  private cardViews: CardView[] = [];
  private cardViewMap = new Map<string, CardView>();

  private cardSlotMap = new Map<string, PositionSlot>();

  private placedSlots: TeamSlot[] = [];
  private cards: CardDef[] = [];

  private dataManager: CardProvider | null;
  private onConfirm: (slots: TeamSlot[]) => void;
  private onBack: (() => void) | undefined;

  private validator = new FormationValidator();
  private validationText: Text;
  private confirmBtn: Button;

  private isDragging = false;
  private ghost: Container | null = null;

  private trayPanel: Graphics;
  private trayContainer: Container;

  constructor(opts: {
    width?: number;
    height?: number;
    onConfirm: (slots: TeamSlot[]) => void;
    onBack?: () => void;
    dataManager?: CardProvider;
  }) {
    this.onConfirm  = opts.onConfirm;
    this.onBack     = opts.onBack;
    this.dataManager = opts.dataManager ?? null;

    this.buildHeader();

    this.pitch = new PitchView(PITCH_W, PITCH_H);
    this.pitch.position.set(PITCH_X, PITCH_Y);
    this.container.addChild(this.pitch);

    for (const slot of this.pitch.slots) {
      slot.on('pointerdown', () => {
        if (!this.isDragging && slot.placedCard) {
          this.removeCardFromSlot(slot);
          this.updateValidation();
        }
      });
    }

    this.validationText = new Text({
      text: '',
      style: makeTextStyle({ fontSize: 13, fill: Colors.error }),
    });
    this.validationText.anchor.set(0.5, 0);
    this.validationText.position.set(SCENE_W / 2, PITCH_Y + PITCH_H + 4);
    this.container.addChild(this.validationText);

    this.trayPanel = new Graphics();
    this.trayPanel.rect(0, TRAY_Y, SCENE_W, TRAY_H);
    this.trayPanel.fill({ color: Colors.bgDarker, alpha: 0.85 });
    this.trayPanel.rect(0, TRAY_Y, SCENE_W, 1.5);
    this.trayPanel.fill({ color: Colors.divider, alpha: 0.8 });
    this.container.addChild(this.trayPanel);

    this.trayContainer = new Container();
    this.trayContainer.position.set(0, TRAY_Y);
    this.container.addChild(this.trayContainer);

    this.confirmBtn = new Button({
      label: '确认出战',
      width: 160,
      height: 44,
      color: Colors.btnPrimary,
      hoverColor: Colors.btnPrimaryHover,
      fontSize: 18,
      onClick: () => this.confirm(),
    });
    this.confirmBtn.position.set(SCENE_W - 176, TRAY_Y + (TRAY_H - 44) / 2);
    this.container.addChild(this.confirmBtn);
  }

  onEnter(data?: unknown): void {
    const d = data as { cards?: CardDef[] } | undefined;
    const cards = d?.cards ?? this.dataManager?.getAllCards() ?? [];
    this.reset(cards);
  }

  onExit(): void {
    this.cancelDrag();
  }

  private buildHeader(): void {
    const bar = new Graphics();
    bar.rect(0, 0, SCENE_W, PITCH_Y);
    bar.fill({ color: Colors.bgDarker, alpha: 0.9 });
    bar.rect(0, PITCH_Y - 1, SCENE_W, 1);
    bar.fill({ color: Colors.divider, alpha: 0.6 });
    this.container.addChild(bar);

    const title = new Text({
      text: '⚽  布阵界面',
      style: makeTextStyle({ fontSize: 20, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0.5);
    title.position.set(SCENE_W / 2, PITCH_Y / 2);
    this.container.addChild(title);

    const backBtn = new Button({
      label: '← 返回',
      width: 100,
      height: 34,
      color: 0x2c3e50,
      hoverColor: 0x3d5166,
      fontSize: 15,
      onClick: () => {
        if (this.onBack) this.onBack();
      },
    });
    backBtn.position.set(8, (PITCH_Y - 34) / 2);
    this.container.addChild(backBtn);

    const tip = new Text({
      text: '将卡牌拖至球场位置上阵  •  点击已上场位置可撤回',
      style: makeTextStyle({ fontSize: 11, fill: 0x8899aa }),
    });
    tip.anchor.set(1, 0.5);
    tip.position.set(SCENE_W - 8, PITCH_Y / 2);
    this.container.addChild(tip);
  }

  private reset(cards: CardDef[]): void {
    for (const cv of this.cardViews) {
      this.trayContainer.removeChild(cv);
      cv.destroy({ children: true });
    }
    this.cardViews = [];
    this.cardViewMap.clear();
    this.cardSlotMap.clear();
    this.placedSlots = [];

    for (const slot of this.pitch.slots) {
      slot.removeCard();
    }

    this.cards = cards;
    this.layoutTrayCards(cards);
    this.updateValidation();
  }

  private layoutTrayCards(cards: CardDef[]): void {
    const totalW = cards.length * CARD_W_S + Math.max(0, cards.length - 1) * CARD_GAP;
    const startX = Math.max(8, (SCENE_W - 180 - totalW) / 2);
    const cardY  = (TRAY_H - CARD_H_S) / 2;

    cards.forEach((card, i) => {
      const cv = new CardView(card);
      cv.scale.set(CARD_SCALE);
      cv.position.set(startX + i * (CARD_W_S + CARD_GAP), cardY);

      this.trayContainer.addChild(cv);
      this.cardViews.push(cv);
      this.cardViewMap.set(card.id, cv);

      this.attachDragEvents(cv, card);
    });
  }

  private attachDragEvents(cv: CardView, card: CardDef): void {
    cv.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      this.startDrag(cv, card, e);
    });
  }

  private startDrag(cv: CardView, card: CardDef, e: FederatedPointerEvent): void {
    this.isDragging = true;

    const ghost = makeGhost(card);
    ghost.position.set(e.global.x, e.global.y);
    this.container.addChild(ghost);
    this.ghost = ghost;

    cv.alpha = 0.4;

    const onMove = (ev: FederatedPointerEvent) => {
      ghost.position.set(ev.global.x, ev.global.y);

      const localX = ev.global.x - PITCH_X;
      const localY = ev.global.y - PITCH_Y;
      const isOverPitch = localX >= 0 && localX <= PITCH_W && localY >= 0 && localY <= PITCH_H;

      if (isOverPitch) {
        this.pitch.updateHoverHighlight(localX, localY, SNAP_THRESHOLD + 10);
      } else {
        this.pitch.clearHighlights();
      }
    };

    const onUp = (ev: FederatedPointerEvent) => {
      cv.off('globalpointermove', onMove);
      cv.off('pointerup',        onUp);
      cv.off('pointerupoutside', onUp);
      this.endDrag(cv, card, ev);
    };

    cv.on('globalpointermove', onMove);
    cv.on('pointerup',        onUp);
    cv.on('pointerupoutside', onUp);
  }

  private endDrag(cv: CardView, card: CardDef, e: FederatedPointerEvent): void {
    this.isDragging = false;
    this.pitch.clearHighlights();

    if (this.ghost) {
      this.container.removeChild(this.ghost);
      this.ghost.destroy({ children: true });
      this.ghost = null;
    }

    const localX = e.global.x - PITCH_X;
    const localY = e.global.y - PITCH_Y;
    const isOverPitch = localX >= 0 && localX <= PITCH_W && localY >= 0 && localY <= PITCH_H;

    if (isOverPitch) {
      const slot = this.pitch.getNearestSlot(localX, localY, SNAP_THRESHOLD);
      if (slot) {
        this.placeCardInSlot(card, slot);
        cv.alpha = 1;
        this.updateValidation();
        return;
      }
    }

    this.removeCardFromSlotById(card.id);
    cv.setPlaced(false);
    cv.alpha = 1;
    this.updateValidation();
  }

  private cancelDrag(): void {
    if (this.ghost) {
      this.container.removeChild(this.ghost);
      this.ghost.destroy({ children: true });
      this.ghost = null;
    }
    this.isDragging = false;
    this.pitch.clearHighlights();
  }

  private placeCardInSlot(card: CardDef, slot: PositionSlot): void {
    const displaced = slot.removeCard();
    if (displaced && displaced.id !== card.id) {
      this.removeCardFromSlotById(displaced.id);
      const displacedCv = this.cardViewMap.get(displaced.id);
      if (displacedCv) displacedCv.setPlaced(false);
    }

    this.removeCardFromSlotById(card.id);

    slot.placeCard(card);
    this.cardSlotMap.set(card.id, slot);

    this.placedSlots = this.placedSlots.filter((s) => s.card.id !== card.id);
    this.placedSlots.push({ card, x: slot.slotDef.nx, y: slot.slotDef.ny });

    const cv = this.cardViewMap.get(card.id);
    if (cv) cv.setPlaced(true);
  }

  private removeCardFromSlot(slot: PositionSlot): void {
    const card = slot.removeCard();
    if (!card) return;
    this.cardSlotMap.delete(card.id);
    this.placedSlots = this.placedSlots.filter((s) => s.card.id !== card.id);
    const cv = this.cardViewMap.get(card.id);
    if (cv) cv.setPlaced(false);
  }

  private removeCardFromSlotById(cardId: string): void {
    const existing = this.cardSlotMap.get(cardId);
    if (existing) {
      existing.removeCard();
      this.cardSlotMap.delete(cardId);
      this.placedSlots = this.placedSlots.filter((s) => s.card.id !== cardId);
    }
  }

  private updateValidation(): void {
    const team = { name: '我的球队', formation: this.placedSlots };
    const result = this.validator.validate(team);

    if (this.placedSlots.length === 0) {
      this.validationText.text = '请将球员卡拖到球场上，排好阵型';
      this.validationText.style.fill = 0x8899aa;
      this.setConfirmEnabled(false);
      return;
    }

    if (result.valid) {
      this.validationText.text = `✓ 阵容就绪  (${this.placedSlots.length} 人上场)`;
      this.validationText.style.fill = Colors.success;
      this.setConfirmEnabled(true);
    } else {
      this.validationText.text = result.errors[0] ?? '阵型有误';
      this.validationText.style.fill = Colors.error;
      this.setConfirmEnabled(false);
    }
  }

  private setConfirmEnabled(enabled: boolean): void {
    this.confirmBtn.alpha = enabled ? 1 : 0.45;
    this.confirmBtn.eventMode = enabled ? 'static' : 'none';
  }

  private confirm(): void {
    const team = { name: '我的球队', formation: this.placedSlots };
    const result = this.validator.validate(team);
    if (!result.valid) return;
    this.onConfirm([...this.placedSlots]);
  }

  getFormation(): TeamSlot[] {
    return [...this.placedSlots];
  }
}
