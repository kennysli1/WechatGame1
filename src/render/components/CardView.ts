import { Container, Graphics, Text } from 'pixi.js';
import type { CardDef, Position } from '../../core/data/schemas.ts';
import { Colors, OUTLINE_WIDTH, makeTextStyle } from '../theme.ts';

export const CARD_WIDTH  = 128;
export const CARD_HEIGHT = 180;

const POSITION_COLORS: Record<Position, number> = {
  FWD: Colors.cardFWD,
  MID: Colors.cardMID,
  DEF: Colors.cardDEF,
  GK:  Colors.cardGK,
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

  constructor(def: CardDef, clubMode = false) {
    super();
    this.cardDef = def;

    this.bg = new Graphics();
    this.addChild(this.bg);

    if (clubMode) {
      this.buildClubCard();
    } else {
      this.buildFallback();
    }

    this.overlay = new Graphics();
    this.overlay.visible = false;
    this.addChild(this.overlay);

    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private buildFallback(): void {
    const col = POSITION_COLORS[this.cardDef.position];

    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    this.bg.fill({ color: col });
    this.bg.roundRect(0, 0, CARD_WIDTH, 32, 10);
    this.bg.fill({ color: Colors.black, alpha: 0.25 });
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    this.bg.stroke({ color: Colors.outline, width: OUTLINE_WIDTH });

    const stars = '★'.repeat(this.cardDef.star) + '☆'.repeat(5 - this.cardDef.star);
    const starText = new Text({
      text: stars,
      style: makeTextStyle({ fontSize: 12, fill: Colors.gold }),
    });
    starText.anchor.set(0.5, 0);
    starText.position.set(CARD_WIDTH / 2, 6);
    this.addChild(starText);

    const badge = new Graphics();
    badge.roundRect(4, 34, 38, 18, 5);
    badge.fill({ color: Colors.black, alpha: 0.35 });
    this.addChild(badge);

    const posText = new Text({
      text: POSITION_LABELS[this.cardDef.position],
      style: makeTextStyle({ fontSize: 10 }),
    });
    posText.position.set(7, 36);
    this.addChild(posText);

    const nameText = new Text({
      text: this.cardDef.name,
      style: makeTextStyle({ fontSize: 17, fontWeight: 'bold', align: 'center' }),
    });
    nameText.anchor.set(0.5);
    nameText.position.set(CARD_WIDTH / 2, CARD_HEIGHT * 0.42);
    this.addChild(nameText);

    const stats: { label: string; value: number; color: number }[] = [
      { label: '攻', value: this.cardDef.attack,    color: Colors.error },
      { label: '守', value: this.cardDef.defense,   color: 0x74c69d },
      { label: '速', value: this.cardDef.speed,     color: 0x74b9ff },
      { label: '技', value: this.cardDef.technique, color: Colors.warning },
    ];

    const statBg = new Graphics();
    statBg.roundRect(4, CARD_HEIGHT * 0.6, CARD_WIDTH - 8, CARD_HEIGHT * 0.34, 6);
    statBg.fill({ color: Colors.black, alpha: 0.2 });
    this.addChild(statBg);

    stats.forEach((s, i) => {
      const c = i % 2;
      const row = Math.floor(i / 2);
      const x = 10 + c * 58;
      const y = CARD_HEIGHT * 0.63 + row * 22;

      const lbl = new Text({
        text: s.label,
        style: makeTextStyle({ fontSize: 10, fill: s.color }),
      });
      lbl.position.set(x, y);
      this.addChild(lbl);

      const val = new Text({
        text: String(s.value),
        style: makeTextStyle({ fontSize: 10, fontWeight: 'bold' }),
      });
      val.position.set(x + 18, y);
      this.addChild(val);
    });
  }

  private buildClubCard(): void {
    const col = POSITION_COLORS[this.cardDef.position];

    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    this.bg.fill({ color: col });
    this.bg.roundRect(0, 0, CARD_WIDTH, 28, 10);
    this.bg.fill({ color: Colors.black, alpha: 0.30 });
    this.bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    this.bg.stroke({ color: Colors.outline, width: OUTLINE_WIDTH });

    const stars = '★'.repeat(this.cardDef.star) + '☆'.repeat(5 - this.cardDef.star);
    const starText = new Text({
      text: stars,
      style: makeTextStyle({ fontSize: 11, fill: Colors.gold }),
    });
    starText.anchor.set(0.5, 0);
    starText.position.set(CARD_WIDTH / 2, 4);
    this.addChild(starText);

    const badge = new Graphics();
    badge.roundRect(4, 30, 38, 16, 4);
    badge.fill({ color: Colors.black, alpha: 0.35 });
    this.addChild(badge);
    const posText = new Text({
      text: POSITION_LABELS[this.cardDef.position],
      style: makeTextStyle({ fontSize: 9 }),
    });
    posText.position.set(7, 32);
    this.addChild(posText);

    const nameText = new Text({
      text: this.cardDef.name,
      style: makeTextStyle({ fontSize: 16, fontWeight: 'bold', align: 'center' }),
    });
    nameText.anchor.set(0.5);
    nameText.position.set(CARD_WIDTH / 2, CARD_HEIGHT * 0.38);
    this.addChild(nameText);

    const statBg = new Graphics();
    statBg.roundRect(4, CARD_HEIGHT * 0.56, CARD_WIDTH - 8, CARD_HEIGHT * 0.40, 6);
    statBg.fill({ color: Colors.black, alpha: 0.22 });
    this.addChild(statBg);

    const stats = this.getClubStats();
    stats.forEach((s, i) => {
      const y = CARD_HEIGHT * 0.59 + i * 20;

      const lbl = new Text({
        text: s.label,
        style: makeTextStyle({ fontSize: 10, fill: s.color }),
      });
      lbl.position.set(8, y);
      this.addChild(lbl);

      const barBg = new Graphics();
      barBg.rect(44, y + 2, 64, 10);
      barBg.fill({ color: Colors.black, alpha: 0.30 });
      this.addChild(barBg);

      const barFill = new Graphics();
      barFill.rect(44, y + 2, Math.round((s.value / 100) * 64), 10);
      barFill.fill({ color: s.color, alpha: 0.85 });
      this.addChild(barFill);

      const val = new Text({
        text: String(s.value),
        style: makeTextStyle({ fontSize: 10, fontWeight: 'bold' }),
      });
      val.position.set(112, y);
      this.addChild(val);
    });
  }

  private getClubStats(): { label: string; value: number; color: number }[] {
    const d = this.cardDef;
    if (d.position === 'GK') {
      return [
        { label: '守门', value: d.goalkeeping, color: Colors.cardGK },
        { label: '封堵', value: d.blocking,    color: 0x74c69d },
        { label: '传球', value: d.passing,     color: 0x74b9ff },
      ];
    }
    if (d.position === 'DEF') {
      return [
        { label: '抢断', value: d.tackling,  color: 0x74c69d },
        { label: '拦截', value: d.intercept, color: 0x4cc9f0 },
        { label: '封堵', value: d.blocking,  color: 0x90e0ef },
      ];
    }
    if (d.position === 'MID') {
      return [
        { label: '带球', value: d.dribble,   color: Colors.warning },
        { label: '传球', value: d.passing,   color: 0x74b9ff },
        { label: '抢断', value: d.tackling,  color: 0x74c69d },
      ];
    }
    return [
      { label: '带球', value: d.dribble,   color: Colors.warning },
      { label: '传球', value: d.passing,   color: 0x74b9ff },
      { label: '射门', value: d.shooting,  color: Colors.error },
    ];
  }

  setPlaced(placed: boolean): void {
    if (placed) {
      this.overlay.clear();
      this.overlay.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
      this.overlay.fill({ color: Colors.black, alpha: 0.52 });

      const badgeG = new Graphics();
      badgeG.roundRect(0, 0, 54, 20, 6);
      badgeG.fill({ color: 0x27ae60, alpha: 0.9 });
      this.overlay.addChild(badgeG);
      badgeG.position.set((CARD_WIDTH - 54) / 2, CARD_HEIGHT / 2 - 10);

      const label = new Text({
        text: '✓ 上场',
        style: makeTextStyle({ fontSize: 11, fontWeight: 'bold' }),
      });
      label.anchor.set(0.5);
      label.position.set(27, 10);
      badgeG.addChild(label);

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
