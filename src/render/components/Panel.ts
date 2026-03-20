import { Container, Graphics } from 'pixi.js';
import { Colors, OUTLINE_WIDTH, BORDER_RADIUS_LG } from '../theme.ts';

export interface PanelOptions {
  width: number;
  height: number;
  color?: number;
  alpha?: number;
  borderRadius?: number;
  borderColor?: number;
  borderWidth?: number;
  /** Set false to disable the default black outline (default: true) */
  outline?: boolean;
}

export class Panel extends Container {
  private bg: Graphics;
  private opts: Required<Pick<PanelOptions, 'color' | 'alpha' | 'borderRadius'>>;

  constructor(opts: PanelOptions) {
    super();

    const color = opts.color ?? Colors.bgDark;
    const alpha = opts.alpha ?? 0.9;
    const borderRadius = opts.borderRadius ?? BORDER_RADIUS_LG;
    this.opts = { color, alpha, borderRadius };

    this.bg = new Graphics();
    this.drawBg(opts.width, opts.height, borderRadius, color, alpha, opts.borderColor, opts.borderWidth, opts.outline);
    this.addChild(this.bg);
  }

  private drawBg(
    w: number, h: number, radius: number,
    color: number, alpha: number,
    borderColor?: number, borderWidth?: number,
    outline?: boolean,
  ): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, w, h, radius);
    this.bg.fill({ color, alpha });

    if (borderColor !== undefined) {
      this.bg.roundRect(0, 0, w, h, radius);
      this.bg.stroke({ color: borderColor, width: borderWidth ?? 2 });
    } else if (outline !== false) {
      this.bg.roundRect(0, 0, w, h, radius);
      this.bg.stroke({ color: Colors.outline, width: OUTLINE_WIDTH, alpha: 0.35 });
    }
  }

  resize(width: number, height: number, borderRadius?: number): void {
    const r = borderRadius ?? this.opts.borderRadius;
    this.drawBg(width, height, r, this.opts.color, this.opts.alpha);
  }
}
