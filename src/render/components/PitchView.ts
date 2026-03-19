import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { CardDef, Position } from '../../core/data/schemas.ts';

// ── Slot definitions ──────────────────────────────────────────────────────────
// Coordinate system: x=0 (left, our goal / defence) → x=1 (right, opponent goal / attack)
//                   y=0 (top) → y=1 (bottom)
export interface SlotDef {
  id: string;
  label: string;
  position: Position;
  nx: number;
  ny: number;
}

export const DEFAULT_SLOTS: SlotDef[] = [
  { id: 'slot_gk',  label: 'GK',  position: 'GK',  nx: 0.07, ny: 0.50 },
  { id: 'slot_df1', label: 'CB',  position: 'DEF', nx: 0.22, ny: 0.25 },
  { id: 'slot_df2', label: 'CB',  position: 'DEF', nx: 0.22, ny: 0.75 },
  { id: 'slot_mf1', label: 'CM',  position: 'MID', nx: 0.45, ny: 0.28 },
  { id: 'slot_mf2', label: 'CM',  position: 'MID', nx: 0.45, ny: 0.72 },
  { id: 'slot_fw1', label: 'FWD', position: 'FWD', nx: 0.68, ny: 0.33 },
  { id: 'slot_fw2', label: 'FWD', position: 'FWD', nx: 0.68, ny: 0.67 },
];

const POSITION_COLORS: Record<Position, number> = {
  GK:  0xe9c46a,
  DEF: 0x2a9d8f,
  MID: 0x457b9d,
  FWD: 0xe63946,
};

export const SLOT_RADIUS = 28;

// ── PositionSlot ──────────────────────────────────────────────────────────────

export class PositionSlot extends Container {
  readonly slotDef: SlotDef;

  private _placedCard: CardDef | null = null;
  private _highlighted = false;

  private circle: Graphics;
  private mainLabel: Text;
  private nameLabel: Text;

  constructor(def: SlotDef) {
    super();
    this.slotDef = def;

    this.circle = new Graphics();
    this.addChild(this.circle);

    this.mainLabel = new Text({
      text: def.label,
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xffffff,
        align: 'center',
      }),
    });
    this.mainLabel.anchor.set(0.5);
    this.addChild(this.mainLabel);

    this.nameLabel = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 10,
        fill: 0xffffff,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: SLOT_RADIUS * 1.8,
      }),
    });
    this.nameLabel.anchor.set(0.5, 0);
    this.nameLabel.position.set(0, SLOT_RADIUS + 3);
    this.nameLabel.visible = false;
    this.addChild(this.nameLabel);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.redraw();
  }

  get placedCard(): CardDef | null {
    return this._placedCard;
  }

  setHighlight(on: boolean): void {
    if (this._highlighted === on) return;
    this._highlighted = on;
    this.redraw();
  }

  placeCard(card: CardDef): void {
    this._placedCard = card;
    this.redraw();
  }

  removeCard(): CardDef | null {
    const card = this._placedCard;
    this._placedCard = null;
    this.redraw();
    return card;
  }

  private redraw(): void {
    this.circle.clear();

    if (this._placedCard) {
      const col = POSITION_COLORS[this._placedCard.position];

      this.circle.circle(0, 0, SLOT_RADIUS);
      this.circle.fill({ color: col });
      this.circle.circle(0, 0, SLOT_RADIUS);
      this.circle.stroke({ color: 0xffffff, width: 2.5 });

      // Shortened name to fit the circle
      const short = this._placedCard.name.length > 3
        ? this._placedCard.name.slice(0, 3)
        : this._placedCard.name;
      this.mainLabel.text = short;
      this.mainLabel.alpha = 1;

      this.nameLabel.text = this._placedCard.name;
      this.nameLabel.visible = true;
    } else {
      const strokeColor = this._highlighted ? 0xffd700 : 0xffffff;
      const strokeWidth = this._highlighted ? 3 : 2;
      const fillAlpha = this._highlighted ? 0.35 : 0.15;

      this.circle.circle(0, 0, SLOT_RADIUS);
      this.circle.fill({ color: 0x000000, alpha: fillAlpha });
      this.circle.circle(0, 0, SLOT_RADIUS);
      this.circle.stroke({ color: strokeColor, width: strokeWidth, alpha: this._highlighted ? 1 : 0.7 });

      this.mainLabel.text = this.slotDef.label;
      this.mainLabel.alpha = this._highlighted ? 1 : 0.65;

      this.nameLabel.visible = false;
    }
  }
}

// ── PitchView ─────────────────────────────────────────────────────────────────

export class PitchView extends Container {
  readonly pitchWidth: number;
  readonly pitchHeight: number;
  readonly slots: PositionSlot[];

  constructor(width = 700, height = 420) {
    super();
    this.pitchWidth = width;
    this.pitchHeight = height;

    this.drawPitch();

    this.slots = DEFAULT_SLOTS.map((def) => {
      const slot = new PositionSlot(def);
      slot.position.set(def.nx * width, def.ny * height);
      this.addChild(slot);
      return slot;
    });

    this.addDirectionLabels();
  }

  private drawPitch(): void {
    const g = new Graphics();
    const W = this.pitchWidth;
    const H = this.pitchHeight;

    // Base grass
    g.rect(0, 0, W, H);
    g.fill({ color: 0x2d8a4e });

    // Alternating stripe shading
    const stripeCount = 8;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        g.rect(i * (W / stripeCount), 0, W / stripeCount, H);
        g.fill({ color: 0x258042, alpha: 0.55 });
      }
    }

    // Outer border
    g.rect(0, 0, W, H);
    g.stroke({ color: 0xffffff, width: 3 });

    // Halfway line (vertical centre line)
    g.moveTo(W / 2, 0);
    g.lineTo(W / 2, H);
    g.stroke({ color: 0xffffff, width: 2 });

    // Centre circle
    g.circle(W / 2, H / 2, 55);
    g.stroke({ color: 0xffffff, width: 2 });

    // Centre spot
    g.circle(W / 2, H / 2, 4);
    g.fill({ color: 0xffffff });

    // Penalty areas (left & right)
    const penW = Math.round(W * 0.15);
    const penH = Math.round(H * 0.55);
    const penY = (H - penH) / 2;

    g.rect(0, penY, penW, penH);
    g.stroke({ color: 0xffffff, width: 2 });
    g.rect(W - penW, penY, penW, penH);
    g.stroke({ color: 0xffffff, width: 2 });

    // Goal areas (left & right) — smaller boxes
    const goalBoxW = Math.round(W * 0.055);
    const goalBoxH = Math.round(H * 0.30);
    const goalBoxY = (H - goalBoxH) / 2;

    g.rect(0, goalBoxY, goalBoxW, goalBoxH);
    g.stroke({ color: 0xffffff, width: 2 });
    g.rect(W - goalBoxW, goalBoxY, goalBoxW, goalBoxH);
    g.stroke({ color: 0xffffff, width: 2 });

    // Goal posts (left & right)
    const goalH = Math.round(H * 0.20);
    const goalY = (H - goalH) / 2;

    g.rect(-6, goalY, 6, goalH);
    g.fill({ color: 0xcccccc, alpha: 0.6 });
    g.rect(W, goalY, 6, goalH);
    g.fill({ color: 0xcccccc, alpha: 0.6 });

    // Penalty spots
    g.circle(Math.round(W * 0.10), H / 2, 3);
    g.fill({ color: 0xffffff });
    g.circle(Math.round(W * 0.90), H / 2, 3);
    g.fill({ color: 0xffffff });

    this.addChild(g);
  }

  private addDirectionLabels(): void {
    const W = this.pitchWidth;
    const H = this.pitchHeight;

    const style = new TextStyle({
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: 11,
      fill: 0xffffff,
    });

    const defend = new Text({ text: '← 防守', style });
    defend.anchor.set(0, 1);
    defend.position.set(6, H - 4);
    defend.alpha = 0.55;
    this.addChild(defend);

    const attack = new Text({ text: '进攻 →', style });
    attack.anchor.set(1, 1);
    attack.position.set(W - 6, H - 4);
    attack.alpha = 0.55;
    this.addChild(attack);
  }

  /** Normalized (0-1) → pitch pixel coordinates */
  normalizedToPixel(nx: number, ny: number): { x: number; y: number } {
    return { x: nx * this.pitchWidth, y: ny * this.pitchHeight };
  }

  /** Pitch pixel coordinates → normalized (0-1) */
  pixelToNormalized(px: number, py: number): { x: number; y: number } {
    return { x: px / this.pitchWidth, y: py / this.pitchHeight };
  }

  /**
   * Return the nearest slot whose centre is within `threshold` pixels of (px, py).
   * Returns null if no slot is within range.
   */
  getNearestSlot(px: number, py: number, threshold = 55): PositionSlot | null {
    let best: PositionSlot | null = null;
    let bestDist = threshold;

    for (const slot of this.slots) {
      const dx = slot.x - px;
      const dy = slot.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = slot;
      }
    }
    return best;
  }

  /**
   * Highlight the slot nearest to (px, py); clear all others.
   * Returns the highlighted slot or null.
   */
  updateHoverHighlight(px: number, py: number, threshold = 70): PositionSlot | null {
    const nearest = this.getNearestSlot(px, py, threshold);
    for (const slot of this.slots) {
      slot.setHighlight(slot === nearest);
    }
    return nearest;
  }

  clearHighlights(): void {
    for (const slot of this.slots) {
      slot.setHighlight(false);
    }
  }
}
