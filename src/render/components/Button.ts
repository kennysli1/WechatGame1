import { Container, Graphics, Text } from 'pixi.js';
import { Colors, OUTLINE_WIDTH, BORDER_RADIUS, makeTextStyle } from '../theme.ts';

export interface ButtonOptions {
  label: string;
  width?: number;
  height?: number;
  color?: number;
  hoverColor?: number;
  textColor?: number;
  fontSize?: number;
  onClick?: () => void;
}

export class Button extends Container {
  private bg: Graphics;
  private labelText: Text;
  private baseColor: number;
  private hoverColor: number;
  private w: number;
  private h: number;

  constructor(opts: ButtonOptions) {
    super();

    this.w = opts.width ?? 200;
    this.h = opts.height ?? 56;
    this.baseColor = opts.color ?? Colors.btnPrimary;
    this.hoverColor = opts.hoverColor ?? Colors.btnPrimaryHover;

    this.bg = new Graphics();
    this.drawBg(this.baseColor);
    this.addChild(this.bg);

    this.labelText = new Text({
      text: opts.label,
      style: makeTextStyle({
        fontSize: opts.fontSize ?? 22,
        fontWeight: 'bold',
        fill: opts.textColor ?? Colors.white,
        align: 'center',
      }),
    });
    this.labelText.anchor.set(0.5);
    this.labelText.position.set(this.w / 2, this.h / 2);
    this.addChild(this.labelText);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => this.drawBg(this.hoverColor));
    this.on('pointerout',  () => { this.drawBg(this.baseColor); this.scale.set(1); });
    this.on('pointerdown', () => this.scale.set(0.96));
    this.on('pointerup',   () => this.scale.set(1));
    if (opts.onClick) {
      this.on('pointertap', opts.onClick);
    }
  }

  private drawBg(color: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, this.w, this.h, BORDER_RADIUS);
    this.bg.fill({ color });
    this.bg.roundRect(0, 0, this.w, this.h, BORDER_RADIUS);
    this.bg.stroke({ color: Colors.outline, width: OUTLINE_WIDTH });
  }

  setLabel(text: string): void {
    this.labelText.text = text;
  }
}
