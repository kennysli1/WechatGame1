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
import type { FormationConfig } from '../../core/data/schemas.ts';
import type { TeamSlot } from '../../core/models/Team.ts';
import { FORMATION_CONFIGS, getFormationById, DEFAULT_FORMATION_ID } from '../../core/data/formations.ts';
import { INITIAL_OWNED_CARD_IDS } from '../../storage/SaveManager.ts';
import { Colors, OUTLINE_WIDTH, makeTextStyle } from '../theme.ts';

const SCENE_W  = 960;
const SCENE_H  = 640;
const HEADER_H = 42;
const LEFT_W   = 168;

const PITCH_X  = LEFT_W + 8;
const PITCH_Y  = HEADER_H + 8;
const PITCH_W  = 556;
const PITCH_H  = 340;

const BENCH_Y  = PITCH_Y + PITCH_H + 8;
const BENCH_H  = SCENE_H - BENCH_Y;

const CARD_SCALE   = 0.58;
const CARD_W_S     = Math.round(CARD_WIDTH  * CARD_SCALE);
const CARD_H_S     = Math.round(CARD_HEIGHT * CARD_SCALE);
const CARD_GAP     = 10;
const SNAP_THRESHOLD = 60;

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

interface CardProvider {
  getAllCards(): CardDef[];
  getCard(id: string): CardDef;
}

interface SaveProvider {
  selectedFormationId: string;
  setSelectedFormationId(id: string): void;
  lastFormation: { cardId: string; x: number; y: number }[] | null;
  setLastFormation(f: { cardId: string; x: number; y: number }[]): void;
  ownedCardIds: string[];
}

export class ClubScene implements IScene {
  readonly name = 'club';
  readonly container = new Container();

  private dataManager: CardProvider;
  private saveManager: SaveProvider;
  private onBack: () => void;

  private selectedFormation: FormationConfig;
  private formationBtns: { btn: Button; config: FormationConfig }[] = [];
  private formationLabel: Text;

  private pitchWrapper: Container;
  private pitch: PitchView | null = null;

  private allCards: CardDef[] = [];
  private cardViews: CardView[] = [];
  private cardViewMap = new Map<string, CardView>();
  private cardSlotMap = new Map<string, PositionSlot>();
  private placedSlots: TeamSlot[] = [];

  private benchPanel: Graphics;
  private benchContainer: Container;

  private isDragging = false;
  private ghost: Container | null = null;

  private statusText: Text;

  constructor(opts: {
    dataManager: CardProvider;
    saveManager: SaveProvider;
    onBack: () => void;
  }) {
    this.dataManager    = opts.dataManager;
    this.saveManager    = opts.saveManager;
    this.onBack         = opts.onBack;
    this.selectedFormation = getFormationById(DEFAULT_FORMATION_ID);

    this.buildBackground();
    this.buildHeader();
    this.buildFormationPanel();

    this.pitchWrapper = new Container();
    this.pitchWrapper.position.set(PITCH_X, PITCH_Y);
    this.container.addChild(this.pitchWrapper);

    this.benchPanel = new Graphics();
    this.benchContainer = new Container();
    this.container.addChild(this.benchPanel);
    this.container.addChild(this.benchContainer);

    this.statusText = new Text({
      text: '',
      style: makeTextStyle({ fontSize: 12, fill: Colors.error }),
    });
    this.statusText.anchor.set(0.5, 0);
    this.statusText.position.set(PITCH_X + PITCH_W / 2, PITCH_Y + PITCH_H + 2);
    this.container.addChild(this.statusText);

    this.formationLabel = new Text({
      text: '',
      style: makeTextStyle({ fontSize: 12, fill: 0x74b9ff }),
    });
    this.formationLabel.anchor.set(0.5, 0);
    this.formationLabel.position.set(LEFT_W / 2, SCENE_H - 38);
    this.container.addChild(this.formationLabel);
  }

  onEnter(): void {
    this.selectedFormation = getFormationById(this.saveManager.selectedFormationId);
    this.highlightFormationBtn(this.selectedFormation.id);
    this.allCards = this.loadAvailableCards();
    this.rebuildPitch();
    this.loadSavedLineup();
    this.updateStatus();
    this.container.alpha = 1;
  }

  onExit(): void {
    this.cancelDrag();
    this.container.alpha = 0;
  }

  private buildBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, SCENE_W, SCENE_H);
    bg.fill({ color: Colors.bgDarker });
    this.container.addChild(bg);
  }

  private buildHeader(): void {
    const bar = new Graphics();
    bar.rect(0, 0, SCENE_W, HEADER_H);
    bar.fill({ color: Colors.headerBg, alpha: 0.95 });
    bar.rect(0, HEADER_H - 1, SCENE_W, 1);
    bar.fill({ color: Colors.divider, alpha: 0.8 });
    this.container.addChild(bar);

    const title = new Text({
      text: '⚽  俱乐部',
      style: makeTextStyle({ fontSize: 20, fontWeight: 'bold' }),
    });
    title.anchor.set(0.5, 0.5);
    title.position.set(SCENE_W / 2, HEADER_H / 2);
    this.container.addChild(title);

    const backBtn = new Button({
      label: '← 返回',
      width: 100,
      height: 30,
      color: 0x2c3e50,
      hoverColor: 0x3d5166,
      fontSize: 14,
      onClick: () => this.onBack(),
    });
    backBtn.position.set(8, (HEADER_H - 30) / 2);
    this.container.addChild(backBtn);

    const tip = new Text({
      text: '拖动球员到球场上阵  •  点击已上场球员可撤回',
      style: makeTextStyle({ fontSize: 11, fill: 0x8899aa }),
    });
    tip.anchor.set(1, 0.5);
    tip.position.set(SCENE_W - 8, HEADER_H / 2);
    this.container.addChild(tip);
  }

  private buildFormationPanel(): void {
    const panel = new Graphics();
    panel.rect(0, HEADER_H, LEFT_W, SCENE_H - HEADER_H);
    panel.fill({ color: Colors.headerBg, alpha: 0.90 });
    panel.rect(LEFT_W - 1, HEADER_H, 1, SCENE_H - HEADER_H);
    panel.fill({ color: Colors.divider, alpha: 0.5 });
    this.container.addChild(panel);

    const panelTitle = new Text({
      text: '选择阵型',
      style: makeTextStyle({ fontSize: 14, fontWeight: 'bold', fill: 0xd0e8ff }),
    });
    panelTitle.anchor.set(0.5, 0);
    panelTitle.position.set(LEFT_W / 2, HEADER_H + 10);
    this.container.addChild(panelTitle);

    const subTitle = new Text({
      text: '后卫+中场+前锋 = 6',
      style: makeTextStyle({ fontSize: 9, fill: 0x6688aa }),
    });
    subTitle.anchor.set(0.5, 0);
    subTitle.position.set(LEFT_W / 2, HEADER_H + 28);
    this.container.addChild(subTitle);

    const div = new Graphics();
    div.rect(8, HEADER_H + 48, LEFT_W - 16, 1);
    div.fill({ color: Colors.divider, alpha: 0.6 });
    this.container.addChild(div);

    const BTN_W = LEFT_W - 20;
    const BTN_H = 50;
    const BTN_GAP = 6;
    const startY = HEADER_H + 56;

    FORMATION_CONFIGS.forEach((fc, i) => {
      const btn = new Button({
        label: `${fc.name}\n${fc.def}后-${fc.mid}中-${fc.fwd}前`,
        width: BTN_W,
        height: BTN_H,
        color: 0x1a3050,
        hoverColor: 0x25466e,
        fontSize: 13,
        onClick: () => this.selectFormation(fc.id),
      });
      btn.position.set(10, startY + i * (BTN_H + BTN_GAP));
      this.container.addChild(btn);
      this.formationBtns.push({ btn, config: fc });
    });
  }

  private highlightFormationBtn(id: string): void {
    for (const { btn, config } of this.formationBtns) {
      btn.alpha = config.id === id ? 1 : 0.65;
    }
  }

  private selectFormation(id: string): void {
    if (this.selectedFormation.id === id) return;
    this.selectedFormation = getFormationById(id);
    this.saveManager.setSelectedFormationId(id);
    this.highlightFormationBtn(id);
    this.clearAllPlacements();
    this.saveManager.setLastFormation([]);
    this.rebuildPitch();
    this.updateStatus();
  }

  private rebuildPitch(): void {
    if (this.pitch) {
      this.pitchWrapper.removeChild(this.pitch);
      this.pitch.destroy({ children: true });
      this.pitch = null;
    }

    this.pitch = new PitchView(PITCH_W, PITCH_H, false, this.selectedFormation.slots);

    for (const slot of this.pitch.slots) {
      slot.on('pointerdown', () => {
        if (!this.isDragging && slot.placedCard) {
          this.removeCardFromSlot(slot);
          this.autoSave();
          this.updateStatus();
        }
      });
    }

    this.pitchWrapper.addChild(this.pitch);
    this.rebuildBench();
  }

  private rebuildBench(): void {
    for (const cv of this.cardViews) {
      this.benchContainer.removeChild(cv);
      cv.destroy({ children: true });
    }
    this.cardViews = [];
    this.cardViewMap.clear();
    this.cardSlotMap.clear();

    this.benchPanel.clear();
    this.benchPanel.rect(LEFT_W, BENCH_Y, SCENE_W - LEFT_W, BENCH_H);
    this.benchPanel.fill({ color: 0x081320, alpha: 0.88 });
    this.benchPanel.rect(LEFT_W, BENCH_Y, SCENE_W - LEFT_W, 1.5);
    this.benchPanel.fill({ color: Colors.divider, alpha: 0.6 });

    this.benchPanel.rect(LEFT_W + 6, BENCH_Y + 4, 64, 18);
    this.benchPanel.fill({ color: Colors.btnSecondary, alpha: 0.7 });

    this.benchContainer.removeChildren();
    const benchLabel = new Text({
      text: '球员替补席',
      style: makeTextStyle({ fontSize: 11, fill: 0x8899aa }),
    });
    benchLabel.position.set(LEFT_W + 8, BENCH_Y + 5);
    this.benchContainer.addChild(benchLabel);

    const startX = LEFT_W + 8;
    const cardY   = BENCH_Y + 26 + (BENCH_H - 26 - CARD_H_S) / 2;

    this.allCards.forEach((card, i) => {
      const cv = new CardView(card, true);
      cv.scale.set(CARD_SCALE);
      cv.position.set(startX + i * (CARD_W_S + CARD_GAP), cardY);

      this.benchContainer.addChild(cv);
      this.cardViews.push(cv);
      this.cardViewMap.set(card.id, cv);

      this.attachDragEvents(cv, card);
    });
  }

  private loadAvailableCards(): CardDef[] {
    let ids = this.saveManager.ownedCardIds;
    if (ids.length === 0) {
      ids = INITIAL_OWNED_CARD_IDS;
    }
    return ids.map((id) => {
      try { return this.dataManager.getCard(id); }
      catch { return null; }
    }).filter((c): c is CardDef => c !== null);
  }

  private loadSavedLineup(): void {
    this.placedSlots = [];
    const saved = this.saveManager.lastFormation;
    if (!saved || saved.length === 0 || !this.pitch) return;

    for (const sf of saved) {
      const card = this.allCards.find((c) => c.id === sf.cardId);
      if (!card) continue;

      const targetSlot = this.pitch.slots.find(
        (s) => !s.placedCard && Math.abs(s.slotDef.nx - sf.x) < 0.15 && Math.abs(s.slotDef.ny - sf.y) < 0.15,
      ) ?? this.pitch.slots.find((s) => !s.placedCard);

      if (targetSlot) {
        this.placeCardInSlot(card, targetSlot);
      }
    }
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
      const over = localX >= 0 && localX <= PITCH_W && localY >= 0 && localY <= PITCH_H;
      if (over && this.pitch) {
        this.pitch.updateHoverHighlight(localX, localY, SNAP_THRESHOLD + 10);
      } else {
        this.pitch?.clearHighlights();
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
    this.pitch?.clearHighlights();

    if (this.ghost) {
      this.container.removeChild(this.ghost);
      this.ghost.destroy({ children: true });
      this.ghost = null;
    }

    const localX = e.global.x - PITCH_X;
    const localY = e.global.y - PITCH_Y;
    const overPitch = localX >= 0 && localX <= PITCH_W && localY >= 0 && localY <= PITCH_H;

    if (overPitch && this.pitch) {
      const slot = this.pitch.getNearestSlot(localX, localY, SNAP_THRESHOLD);
      if (slot) {
        this.placeCardInSlot(card, slot);
        cv.alpha = 1;
        this.autoSave();
        this.updateStatus();
        return;
      }
    }

    this.removeCardFromSlotById(card.id);
    cv.setPlaced(false);
    cv.alpha = 1;
    this.autoSave();
    this.updateStatus();
  }

  private cancelDrag(): void {
    if (this.ghost) {
      this.container.removeChild(this.ghost);
      this.ghost.destroy({ children: true });
      this.ghost = null;
    }
    this.isDragging = false;
    this.pitch?.clearHighlights();
  }

  private placeCardInSlot(card: CardDef, slot: PositionSlot): void {
    const displaced = slot.removeCard();
    if (displaced && displaced.id !== card.id) {
      this.removeCardFromSlotById(displaced.id);
      const dispCv = this.cardViewMap.get(displaced.id);
      if (dispCv) dispCv.setPlaced(false);
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

  private clearAllPlacements(): void {
    if (this.pitch) {
      for (const slot of this.pitch.slots) slot.removeCard();
    }
    this.cardSlotMap.clear();
    this.placedSlots = [];
    for (const cv of this.cardViews) {
      cv.setPlaced(false);
      cv.alpha = 1;
    }
  }

  private updateStatus(): void {
    const placed = this.placedSlots.length;
    const total  = this.selectedFormation.slots.length;

    const gk  = this.placedSlots.filter((s) => s.card.position === 'GK').length;
    const def = this.placedSlots.filter((s) => s.card.position === 'DEF').length;
    const mid = this.placedSlots.filter((s) => s.card.position === 'MID').length;
    const fwd = this.placedSlots.filter((s) => s.card.position === 'FWD').length;

    const fc = this.selectedFormation;

    if (placed === 0) {
      this.statusText.text = '请将球员拖到球场上排兵布阵';
      this.statusText.style.fill = 0x8899aa;
      return;
    }

    const errors: string[] = [];
    if (gk !== 1)        errors.push(`门将: 需1人(当前${gk})`);
    if (def !== fc.def)  errors.push(`后卫: 需${fc.def}人(当前${def})`);
    if (mid !== fc.mid)  errors.push(`中场: 需${fc.mid}人(当前${mid})`);
    if (fwd !== fc.fwd)  errors.push(`前锋: 需${fc.fwd}人(当前${fwd})`);

    if (errors.length === 0 && placed === total) {
      this.statusText.text = `✓ 阵容就绪  ${fc.name}  已保存`;
      this.statusText.style.fill = Colors.success;
    } else if (errors.length > 0) {
      this.statusText.text = errors.join('  ');
      this.statusText.style.fill = Colors.error;
    } else {
      this.statusText.text = `已上阵 ${placed}/${total} 人`;
      this.statusText.style.fill = Colors.warning;
    }

    this.formationLabel.text = `阵型: ${fc.name}  (${fc.def}-${fc.mid}-${fc.fwd})`;
  }

  private autoSave(): void {
    const lineup = this.placedSlots.map((s) => ({
      cardId: s.card.id,
      x: s.x,
      y: s.y,
    }));
    this.saveManager.setLastFormation(lineup);
  }

  getFormationSlots(): TeamSlot[] {
    return [...this.placedSlots];
  }

  getSelectedFormation(): FormationConfig {
    return this.selectedFormation;
  }
}
