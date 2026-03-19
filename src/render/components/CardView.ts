import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CardDef, Position } from '../../core/data/schemas.ts';

const POSITION_COLORS: Record<Position, number> = {
  FWD: 0xe63946,
  MID: 0x457b9d,
  DEF: 0x2a9d8f,
  GK: 0xe9c46a,
};

const CARD_WIDTH = 128;
const CARD_HEIGHT = 180;

export class CardView extends Container {
  private cardDef: CardDef;

  constructor(def: CardDef) {
    super();
    this.cardDef = def;
    this.buildFallback();
    this.eventMode = 'static';
    this.cursor = 'pointer';
  }

  private buildFallback(): void {
    const bg = new Graphics();
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    bg.fill({ color: POSITION_COLORS[this.cardDef.position] });
    bg.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, 10);
    bg.stroke({ color: 0xffffff, width: 2 });
    this.addChild(bg);

    const stars = '★'.repeat(this.cardDef.star) + '☆'.repeat(5 - this.cardDef.star);
    const starText = new Text({
      text: stars,
      style: new TextStyle({ fontSize: 12, fill: 0xffd700, fontFamily: 'Arial' }),
    });
    starText.anchor.set(0.5, 0);
    starText.position.set(CARD_WIDTH / 2, 6);
    this.addChild(starText);

    const nameText = new Text({
      text: this.cardDef.name,
      style: new TextStyle({
        fontSize: 16,
        fontWeight: 'bold',
        fill: 0xffffff,
        fontFamily: 'Arial, sans-serif',
        align: 'center',
      }),
    });
    nameText.anchor.set(0.5);
    nameText.position.set(CARD_WIDTH / 2, CARD_HEIGHT * 0.4);
    this.addChild(nameText);

    const posText = new Text({
      text: this.cardDef.position,
      style: new TextStyle({ fontSize: 12, fill: 0xdddddd, fontFamily: 'Arial' }),
    });
    posText.anchor.set(0.5);
    posText.position.set(CARD_WIDTH / 2, CARD_HEIGHT * 0.55);
    this.addChild(posText);

    const stats = [
      { label: 'ATK', value: this.cardDef.attack },
      { label: 'DEF', value: this.cardDef.defense },
      { label: 'SPD', value: this.cardDef.speed },
      { label: 'TEC', value: this.cardDef.technique },
    ];
    const statStyle = new TextStyle({ fontSize: 10, fill: 0xeeeeee, fontFamily: 'Arial' });
    stats.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const t = new Text({
        text: `${s.label} ${s.value}`,
        style: statStyle,
      });
      t.position.set(10 + col * 60, CARD_HEIGHT * 0.68 + row * 18);
      this.addChild(t);
    });
  }

  get def(): CardDef {
    return this.cardDef;
  }
}
