import { Container, Graphics } from 'pixi.js';

export interface PanelOptions {
  width: number;
  height: number;
  color?: number;
  alpha?: number;
  borderRadius?: number;
  borderColor?: number;
  borderWidth?: number;
}

export class Panel extends Container {
  private bg: Graphics;

  constructor(opts: PanelOptions) {
    super();

    this.bg = new Graphics();
    this.bg.roundRect(0, 0, opts.width, opts.height, opts.borderRadius ?? 16);
    this.bg.fill({ color: opts.color ?? 0x1a1a2e, alpha: opts.alpha ?? 0.9 });

    if (opts.borderColor !== undefined) {
      this.bg.roundRect(0, 0, opts.width, opts.height, opts.borderRadius ?? 16);
      this.bg.stroke({ color: opts.borderColor, width: opts.borderWidth ?? 2 });
    }

    this.addChild(this.bg);
  }

  resize(width: number, height: number, borderRadius?: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, width, height, borderRadius ?? 16);
    this.bg.fill({ color: 0x1a1a2e, alpha: 0.9 });
  }
}
