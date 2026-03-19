import { Container, Graphics } from 'pixi.js';

const PITCH_W = 800;
const PITCH_H = 500;
const LINE_COLOR = 0xffffff;
const GRASS_COLOR = 0x2d8a4e;

export class PitchView extends Container {
  readonly pitchWidth = PITCH_W;
  readonly pitchHeight = PITCH_H;

  constructor() {
    super();
    this.draw();
  }

  private draw(): void {
    const g = new Graphics();

    g.rect(0, 0, PITCH_W, PITCH_H);
    g.fill({ color: GRASS_COLOR });

    g.rect(0, 0, PITCH_W, PITCH_H);
    g.stroke({ color: LINE_COLOR, width: 3 });

    g.moveTo(PITCH_W / 2, 0);
    g.lineTo(PITCH_W / 2, PITCH_H);
    g.stroke({ color: LINE_COLOR, width: 2 });

    g.circle(PITCH_W / 2, PITCH_H / 2, 60);
    g.stroke({ color: LINE_COLOR, width: 2 });
    g.circle(PITCH_W / 2, PITCH_H / 2, 4);
    g.fill({ color: LINE_COLOR });

    const penW = 130;
    const penH = 280;
    g.rect(0, (PITCH_H - penH) / 2, penW, penH);
    g.stroke({ color: LINE_COLOR, width: 2 });
    g.rect(PITCH_W - penW, (PITCH_H - penH) / 2, penW, penH);
    g.stroke({ color: LINE_COLOR, width: 2 });

    const goalW = 40;
    const goalH = 140;
    g.rect(0, (PITCH_H - goalH) / 2, goalW, goalH);
    g.stroke({ color: LINE_COLOR, width: 2 });
    g.rect(PITCH_W - goalW, (PITCH_H - goalH) / 2, goalW, goalH);
    g.stroke({ color: LINE_COLOR, width: 2 });

    this.addChild(g);
  }

  /** Convert normalized (0-1) coordinates to pitch pixel coordinates */
  normalizedToPixel(nx: number, ny: number): { x: number; y: number } {
    return { x: nx * PITCH_W, y: ny * PITCH_H };
  }

  /** Convert pitch pixel coordinates to normalized (0-1) */
  pixelToNormalized(px: number, py: number): { x: number; y: number } {
    return { x: px / PITCH_W, y: py / PITCH_H };
  }
}
