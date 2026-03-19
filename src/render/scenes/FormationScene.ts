import { Container, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { PitchView } from '../components/PitchView.ts';
import { CardView } from '../components/CardView.ts';
import { Button } from '../components/Button.ts';
import type { CardDef } from '../../core/data/schemas.ts';
import type { TeamSlot } from '../../core/models/Team.ts';

export class FormationScene implements IScene {
  readonly name = 'formation';
  readonly container = new Container();

  private pitch: PitchView;
  private cardViews: CardView[] = [];
  private placedSlots: TeamSlot[] = [];
  private cards: CardDef[] = [];
  private onConfirm: (slots: TeamSlot[]) => void;

  constructor(opts: {
    width: number;
    height: number;
    onConfirm: (slots: TeamSlot[]) => void;
  }) {
    this.onConfirm = opts.onConfirm;

    this.pitch = new PitchView();
    this.pitch.position.set(
      (opts.width - this.pitch.pitchWidth) / 2,
      20
    );
    this.container.addChild(this.pitch);

    const confirmBtn = new Button({
      label: '确认阵容',
      width: 180,
      height: 48,
      color: 0xd4a017,
      hoverColor: 0xf0c040,
      onClick: () => this.confirm(),
    });
    confirmBtn.position.set(opts.width / 2 - 90, this.pitch.pitchHeight + 40);
    this.container.addChild(confirmBtn);

    const hint = new Text({
      text: '拖拽球员到球场上布阵',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 14,
        fill: 0x888888,
      }),
    });
    hint.anchor.set(0.5, 0);
    hint.position.set(opts.width / 2, this.pitch.pitchHeight + 100);
    this.container.addChild(hint);
  }

  onEnter(data?: unknown): void {
    const d = data as { cards: CardDef[] } | undefined;
    if (d?.cards) {
      this.setCards(d.cards);
    }
  }

  setCards(cards: CardDef[]): void {
    for (const cv of this.cardViews) {
      this.container.removeChild(cv);
      cv.destroy();
    }
    this.cardViews = [];
    this.placedSlots = [];
    this.cards = cards;

    const startX = this.pitch.x;
    const startY = this.pitch.y;

    cards.forEach((card, i) => {
      const cv = new CardView(card);
      const col = i % 4;
      const row = Math.floor(i / 4);
      const defaultX = startX + 50 + col * 180;
      const defaultY = startY + 50 + row * 200;
      cv.position.set(defaultX, defaultY);

      cv.eventMode = 'static';
      cv.cursor = 'grab';

      let dragOffset = { x: 0, y: 0 };
      cv.on('pointerdown', (e) => {
        dragOffset = {
          x: e.global.x - cv.x,
          y: e.global.y - cv.y,
        };
        cv.alpha = 0.8;
        cv.zIndex = 100;
        this.container.sortableChildren = true;

        const onMove = (ev: { global: { x: number; y: number } }) => {
          cv.x = ev.global.x - dragOffset.x;
          cv.y = ev.global.y - dragOffset.y;
        };
        const onUp = () => {
          cv.alpha = 1;
          cv.zIndex = 0;
          cv.off('globalpointermove', onMove);
          cv.off('pointerup', onUp);
          cv.off('pointerupoutside', onUp);
          this.snapCard(cv, card);
        };
        cv.on('globalpointermove', onMove);
        cv.on('pointerup', onUp);
        cv.on('pointerupoutside', onUp);
      });

      this.container.addChild(cv);
      this.cardViews.push(cv);
    });
  }

  private snapCard(cv: CardView, card: CardDef): void {
    const localX = cv.x - this.pitch.x;
    const localY = cv.y - this.pitch.y;
    const norm = this.pitch.pixelToNormalized(localX + 64, localY + 90);

    const existing = this.placedSlots.findIndex((s) => s.card.id === card.id);
    if (existing >= 0) this.placedSlots.splice(existing, 1);

    if (norm.x >= 0 && norm.x <= 1 && norm.y >= 0 && norm.y <= 1) {
      this.placedSlots.push({ card, x: norm.x, y: norm.y });
    }
  }

  private confirm(): void {
    this.onConfirm(this.placedSlots);
  }

  getFormation(): TeamSlot[] {
    return [...this.placedSlots];
  }
}
