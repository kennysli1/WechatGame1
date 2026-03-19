import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CardDef, Position } from '../../core/data/schemas.ts';

export const CARD_WIDTH  = 128;
export const CARD_HEIGHT = 180;

const POSITION_COLORS: Record<Position, number> = {
  FWD: 0xe63946,
  MID: 0x457b9d,
  DEF: 0x2a9d8f,
  GK:  0xe9c46a,
};

const POSITION_LABELS: Record<Position, string> = {
  FWD: '前锋',
  MID: '中场',
  DEF: '后卫',
  GK:  '门将',
};

export class CardView extends Container {
  private readonly cardDef: CardDef;
  private bg: Graphics;
  private overlay: Graphics;

  constructor(def: CardDef) {
    super();
    this.cardDef = def;

    this.bg = new Graphics();
    this.addChild(this.bg);

    this.buildFallback();

    this.overlay = new Graphics();
    this.overlay.visible = false;
    this.addChild(this.overlay);

    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private buildFallback(): void {
    const col = POSITION_COLORS[this.cardDef.position];

    // Background with gradient feel via layered rects
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    this.bg.fill({ color: col });

    // Darker header strip
    this.bg.roundRect(0, 0, CARD_WIDTH, 32, 10);
    this.bg.fill({ color: 0x000000, alpha: 0.25 });

    // Border
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    this.bg.stroke({ color: 0xffffff, width: 2 });

    // ── Stars ──
    const stars = '★'.repeat(this.cardDef.star) + '☆'.repeat(5 - this.cardDef.star);
    const starText = new Text({
      text: stars,
      style: new TextStyle({ fontSize: 12, fill: 0xffd700, fontFamily: 'Arial' }),
    });
    starText.anchor.set(0.5, 0);
    starText.position.set(CARD_WIDTH / 2, 6);
    this.addChild(starText);

    // ── Position badge ──
    const badge = new Graphics();
    badge.roundRect(4, 34, 38, 18, 5);
    badge.fill({ color: 0x000000, alpha: 0.35 });
    this.addChild(badge);

    const posText = new Text({
      text: POSITION_LABELS[this.cardDef.position],
      style: new TextStyle({ fontSize: 10, fill: 0xffffff, fontFamily: 'Arial, "Microsoft YaHei", sans-serif' }),
    });
    posText.anchor.set(0, 0);
    posText.position.set(7, 36);
    this.addChild(posText);

    // ── Player name ──
    const nameText = new Text({
      text: this.cardDef.name,
      style: new TextStyle({
        fontSize: 17,
        fontWeight: 'bold',
        fill: 0xffffff,
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        align: 'center',
      }),
    });
    nameText.anchor.set(0.5);
    nameText.position.set(CARD_WIDTH / 2, CARD_HEIGHT * 0.42);
    this.addChild(nameText);

    // ── Stats grid ──
    const stats: { label: string; value: number; color: number }[] = [
      { label: '攻', value: this.cardDef.attack,    color: 0xff6b6b },
      { label: '守', value: this.cardDef.defense,   color: 0x74c69d },
      { label: '速', value: this.cardDef.speed,     color: 0x74b9ff },
      { label: '技', value: this.cardDef.technique, color: 0xffd93d },
    ];

    const statBg = new Graphics();
    statBg.roundRect(4, CARD_HEIGHT * 0.6, CARD_WIDTH - 8, CARD_HEIGHT * 0.34, 6);
    statBg.fill({ color: 0x000000, alpha: 0.2 });
    this.addChild(statBg);

    stats.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 10 + col * 58;
      const y = CARD_HEIGHT * 0.63 + row * 22;

      const lbl = new Text({
        text: s.label,
        style: new TextStyle({ fontSize: 10, fill: s.color, fontFamily: 'Arial, "Microsoft YaHei"' }),
      });
      lbl.position.set(x, y);
      this.addChild(lbl);

      const val = new Text({
        text: String(s.value),
        style: new TextStyle({ fontSize: 10, fill: 0xffffff, fontFamily: 'Arial', fontWeight: 'bold' }),
      });
      val.position.set(x + 18, y);
      this.addChild(val);
    });
  }

  /**
   * Mark the card as "placed" (already on the pitch).
   * Placed cards are dimmed in the tray with a lock icon.
   */
  setPlaced(placed: boolean): void {
    if (placed) {
      // Semi-transparent dark overlay
      this.overlay.clear();
      this.overlay.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
      this.overlay.fill({ color: 0x000000, alpha: 0.52 });

      // "✓ 已上场" label
      const badge = new Graphics();
      badge.roundRect(0, 0, 54, 20, 6);
      badge.fill({ color: 0x27ae60, alpha: 0.9 });
      this.overlay.addChild(badge);
      badge.position.set((CARD_WIDTH - 54) / 2, CARD_HEIGHT / 2 - 10);

      const label = new Text({
        text: '✓ 上场',
        style: new TextStyle({
          fontSize: 11,
          fill: 0xffffff,
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontWeight: 'bold',
        }),
      });
      label.anchor.set(0.5);
      label.position.set(27, 10);
      badge.addChild(label);

      this.overlay.visible = true;
      this.cursor = 'grab';
    } else {
      this.overlay.clear();
      this.overlay.visible = false;
      this.cursor = 'pointer';
    }
  }

  get def(): CardDef {
    return this.cardDef;
  }
}
