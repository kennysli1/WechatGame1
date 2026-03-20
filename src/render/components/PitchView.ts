import { Container, Graphics, Text } from 'pixi.js';
import type { CardDef, Position, SlotDef } from '../../core/data/schemas.ts';
import { Colors, makeTextStyle } from '../theme.ts';

export type { SlotDef };

const ISO_TOP_SCALE = 0.62;
const ISO_H_COMPRESS = 0.72;
const ISO_TOP_MARGIN = 10;

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
  GK:  Colors.cardGK,
  DEF: Colors.cardDEF,
  MID: Colors.cardMID,
  FWD: Colors.cardFWD,
};

export const SLOT_RADIUS = 28;

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
      style: makeTextStyle({ fontSize: 13, fontWeight: 'bold', align: 'center' }),
    });
    this.mainLabel.anchor.set(0.5);
    this.addChild(this.mainLabel);

    this.nameLabel = new Text({
      text: '',
      style: makeTextStyle({ fontSize: 10, align: 'center' }),
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
      this.circle.stroke({ color: Colors.white, width: 2.5 });

      const short = this._placedCard.name.length > 3
        ? this._placedCard.name.slice(0, 3)
        : this._placedCard.name;
      this.mainLabel.text = short;
      this.mainLabel.alpha = 1;

      this.nameLabel.text = this._placedCard.name;
      this.nameLabel.visible = true;
    } else {
      const strokeColor = this._highlighted ? Colors.gold : Colors.white;
      const strokeWidth = this._highlighted ? 3 : 2;
      const fillAlpha = this._highlighted ? 0.35 : 0.15;

      this.circle.circle(0, 0, SLOT_RADIUS);
      this.circle.fill({ color: Colors.black, alpha: fillAlpha });
      this.circle.circle(0, 0, SLOT_RADIUS);
      this.circle.stroke({ color: strokeColor, width: strokeWidth, alpha: this._highlighted ? 1 : 0.7 });

      this.mainLabel.text = this.slotDef.label;
      this.mainLabel.alpha = this._highlighted ? 1 : 0.65;

      this.nameLabel.visible = false;
    }
  }
}

export class PitchView extends Container {
  readonly pitchWidth: number;
  readonly pitchHeight: number;
  readonly slots: PositionSlot[];

  private readonly _isometric: boolean;

  constructor(width = 700, height = 420, isometric = false, slotDefs: SlotDef[] = DEFAULT_SLOTS) {
    super();
    this.pitchWidth = width;
    this.pitchHeight = height;
    this._isometric = isometric;

    if (isometric) {
      this.drawIsometricPitch();
    } else {
      this.drawFlatPitch();
    }

    this.slots = slotDefs.map((def) => {
      const slot = new PositionSlot(def);
      slot.position.set(def.nx * width, def.ny * height);
      this.addChild(slot);
      return slot;
    });

    if (!isometric) {
      this.addDirectionLabels();
    }
  }

  private isoPoint(nx: number, ny: number): { x: number; y: number } {
    const scale = ISO_TOP_SCALE + (1 - ISO_TOP_SCALE) * ny;
    return {
      x: this.pitchWidth * 0.5 + (nx - 0.5) * this.pitchWidth * scale,
      y: ISO_TOP_MARGIN + ny * this.pitchHeight * ISO_H_COMPRESS,
    };
  }

  get effectiveHeight(): number {
    if (this._isometric) {
      return ISO_TOP_MARGIN + this.pitchHeight * ISO_H_COMPRESS;
    }
    return this.pitchHeight;
  }

  private drawFlatPitch(): void {
    const g = new Graphics();
    const W = this.pitchWidth;
    const H = this.pitchHeight;

    g.rect(0, 0, W, H);
    g.fill({ color: Colors.grassGreen });

    const stripeCount = 8;
    for (let i = 0; i < stripeCount; i++) {
      if (i % 2 === 0) {
        g.rect(i * (W / stripeCount), 0, W / stripeCount, H);
        g.fill({ color: 0x258042, alpha: 0.55 });
      }
    }

    g.rect(0, 0, W, H);
    g.stroke({ color: Colors.white, width: 3 });

    g.moveTo(W / 2, 0);
    g.lineTo(W / 2, H);
    g.stroke({ color: Colors.white, width: 2 });

    g.circle(W / 2, H / 2, 55);
    g.stroke({ color: Colors.white, width: 2 });

    g.circle(W / 2, H / 2, 4);
    g.fill({ color: Colors.white });

    const penW = Math.round(W * 0.15);
    const penH = Math.round(H * 0.55);
    const penY = (H - penH) / 2;

    g.rect(0, penY, penW, penH);
    g.stroke({ color: Colors.white, width: 2 });
    g.rect(W - penW, penY, penW, penH);
    g.stroke({ color: Colors.white, width: 2 });

    const goalBoxW = Math.round(W * 0.055);
    const goalBoxH = Math.round(H * 0.30);
    const goalBoxY = (H - goalBoxH) / 2;

    g.rect(0, goalBoxY, goalBoxW, goalBoxH);
    g.stroke({ color: Colors.white, width: 2 });
    g.rect(W - goalBoxW, goalBoxY, goalBoxW, goalBoxH);
    g.stroke({ color: Colors.white, width: 2 });

    const goalH = Math.round(H * 0.20);
    const goalY = (H - goalH) / 2;

    g.rect(-6, goalY, 6, goalH);
    g.fill({ color: 0xcccccc, alpha: 0.6 });
    g.rect(W, goalY, 6, goalH);
    g.fill({ color: 0xcccccc, alpha: 0.6 });

    g.circle(Math.round(W * 0.10), H / 2, 3);
    g.fill({ color: Colors.white });
    g.circle(Math.round(W * 0.90), H / 2, 3);
    g.fill({ color: Colors.white });

    this.addChild(g);
  }

  private drawIsometricPitch(): void {
    const g = new Graphics();
    const W = this.pitchWidth;
    const H = this.pitchHeight;
    const iso = (nx: number, ny: number) => this.isoPoint(nx, ny);

    const poly = (pts: { x: number; y: number }[]) => {
      if (pts.length < 2) return;
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.closePath();
    };

    poly([iso(0, 0), iso(1, 0), iso(1, 1), iso(0, 1)]);
    g.fill({ color: Colors.grassGreen });

    const SC = 8;
    for (let i = 0; i < SC; i++) {
      if (i % 2 === 0) {
        const y0 = i / SC, y1 = (i + 1) / SC;
        poly([iso(0, y0), iso(1, y0), iso(1, y1), iso(0, y1)]);
        g.fill({ color: 0x258042, alpha: 0.5 });
      }
    }

    poly([iso(0, 0), iso(1, 0), iso(1, 1), iso(0, 1)]);
    g.stroke({ color: Colors.white, width: 3 });

    const hf0 = iso(0.5, 0), hf1 = iso(0.5, 1);
    g.moveTo(hf0.x, hf0.y);
    g.lineTo(hf1.x, hf1.y);
    g.stroke({ color: Colors.white, width: 2 });

    const cRx = 55 / W, cRy = 55 / H;
    const circPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      circPts.push(iso(
        Math.max(0.01, Math.min(0.99, 0.5 + Math.cos(a) * cRx)),
        Math.max(0.01, Math.min(0.99, 0.5 + Math.sin(a) * cRy)),
      ));
    }
    g.moveTo(circPts[0].x, circPts[0].y);
    for (let i = 1; i < circPts.length; i++) g.lineTo(circPts[i].x, circPts[i].y);
    g.closePath();
    g.stroke({ color: Colors.white, width: 2 });

    const cs = iso(0.5, 0.5);
    g.circle(cs.x, cs.y, 4);
    g.fill({ color: Colors.white });

    const penWn = 0.15, penY0 = 0.225, penY1 = 0.775;
    poly([iso(0, penY0), iso(penWn, penY0), iso(penWn, penY1), iso(0, penY1)]);
    g.stroke({ color: Colors.white, width: 2 });
    poly([iso(1 - penWn, penY0), iso(1, penY0), iso(1, penY1), iso(1 - penWn, penY1)]);
    g.stroke({ color: Colors.white, width: 2 });

    const gbW = 0.055, gbY0 = 0.35, gbY1 = 0.65;
    poly([iso(0, gbY0), iso(gbW, gbY0), iso(gbW, gbY1), iso(0, gbY1)]);
    g.stroke({ color: Colors.white, width: 2 });
    poly([iso(1 - gbW, gbY0), iso(1, gbY0), iso(1, gbY1), iso(1 - gbW, gbY1)]);
    g.stroke({ color: Colors.white, width: 2 });

    const goalY0n = 0.40, goalY1n = 0.60;
    const gl0a = iso(0, goalY0n), gl0b = iso(0, goalY1n);
    const gl1a = iso(1, goalY0n), gl1b = iso(1, goalY1n);
    g.moveTo(gl0a.x, gl0a.y); g.lineTo(gl0b.x, gl0b.y);
    g.stroke({ color: 0xdddddd, width: 5, alpha: 0.85 });
    g.moveTo(gl1a.x, gl1a.y); g.lineTo(gl1b.x, gl1b.y);
    g.stroke({ color: 0xdddddd, width: 5, alpha: 0.85 });

    const ps1 = iso(0.10, 0.5), ps2 = iso(0.90, 0.5);
    g.circle(ps1.x, ps1.y, 3);
    g.fill({ color: Colors.white });
    g.circle(ps2.x, ps2.y, 3);
    g.fill({ color: Colors.white });

    for (let i = 0; i < 3; i++) {
      const y0 = i / 10, y1 = (i + 1) / 10;
      poly([iso(0, y0), iso(1, y0), iso(1, y1), iso(0, y1)]);
      g.fill({ color: Colors.black, alpha: 0.07 - i * 0.02 });
    }

    const defLbl = new Text({ text: '← 防守', style: makeTextStyle({ fontSize: 11 }) });
    const atkLbl = new Text({ text: '进攻 →', style: makeTextStyle({ fontSize: 11 }) });
    const nearLeft = iso(0, 1), nearRight = iso(1, 1);
    defLbl.anchor.set(0, 1);
    defLbl.position.set(nearLeft.x + 6, nearLeft.y - 4);
    defLbl.alpha = 0.55;
    atkLbl.anchor.set(1, 1);
    atkLbl.position.set(nearRight.x - 6, nearRight.y - 4);
    atkLbl.alpha = 0.55;

    void H;

    this.addChild(g);
    this.addChild(defLbl);
    this.addChild(atkLbl);
  }

  private addDirectionLabels(): void {
    const W = this.pitchWidth;
    const H = this.pitchHeight;

    const defend = new Text({ text: '← 防守', style: makeTextStyle({ fontSize: 11 }) });
    defend.anchor.set(0, 1);
    defend.position.set(6, H - 4);
    defend.alpha = 0.55;
    this.addChild(defend);

    const attack = new Text({ text: '进攻 →', style: makeTextStyle({ fontSize: 11 }) });
    attack.anchor.set(1, 1);
    attack.position.set(W - 6, H - 4);
    attack.alpha = 0.55;
    this.addChild(attack);
  }

  normalizedToPixel(nx: number, ny: number): { x: number; y: number } {
    if (this._isometric) return this.isoPoint(nx, ny);
    return { x: nx * this.pitchWidth, y: ny * this.pitchHeight };
  }

  pixelToNormalized(px: number, py: number): { x: number; y: number } {
    return { x: px / this.pitchWidth, y: py / this.pitchHeight };
  }

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
