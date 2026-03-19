import { Container, Graphics, Text, TextStyle } from 'pixi.js';

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
  private label: Text;
  private baseColor: number;
  private hoverColor: number;

  constructor(opts: ButtonOptions) {
    super();

    const w = opts.width ?? 200;
    const h = opts.height ?? 56;
    this.baseColor = opts.color ?? 0x2d6a4f;
    this.hoverColor = opts.hoverColor ?? 0x40916c;

    this.bg = new Graphics();
    this.drawBg(this.baseColor, w, h);
    this.addChild(this.bg);

    this.label = new Text({
      text: opts.label,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: opts.fontSize ?? 22,
        fontWeight: 'bold',
        fill: opts.textColor ?? 0xffffff,
        align: 'center',
      }),
    });
    this.label.anchor.set(0.5);
    this.label.position.set(w / 2, h / 2);
    this.addChild(this.label);

    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerover', () => {
      this.drawBg(this.hoverColor, w, h);
    });
    this.on('pointerout', () => {
      this.drawBg(this.baseColor, w, h);
    });
    if (opts.onClick) {
      this.on('pointertap', opts.onClick);
    }
  }

  private drawBg(color: number, w: number, h: number): void {
    this.bg.clear();
    this.bg.roundRect(0, 0, w, h, 12);
    this.bg.fill({ color });
  }

  setLabel(text: string): void {
    this.label.text = text;
  }
}
