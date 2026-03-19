import { Container, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { Button } from '../components/Button.ts';
import { Panel } from '../components/Panel.ts';

export class MenuScene implements IScene {
  readonly name = 'menu';
  readonly container = new Container();
  private onStartGame: () => void;
  private onClub: () => void;
  private onRecruit: () => void;

  constructor(opts: {
    width: number;
    height: number;
    onStartGame: () => void;
    onClub?: () => void;
    onRecruit?: () => void;
  }) {
    this.onStartGame = opts.onStartGame;
    this.onClub      = opts.onClub    ?? (() => {});
    this.onRecruit   = opts.onRecruit ?? (() => {});
    this.build(opts.width, opts.height);
  }

  private build(w: number, h: number): void {
    const panel = new Panel({ width: w, height: h, color: 0x16213e });
    this.container.addChild(panel);

    const title = new Text({
      text: '功夫足球',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 48,
        fontWeight: 'bold',
        fill: 0xf8f9fa,
        dropShadow: {
          color: 0x000000,
          blur: 6,
          distance: 3,
          angle: Math.PI / 4,
        },
      }),
    });
    title.anchor.set(0.5);
    title.position.set(w / 2, h * 0.28);
    this.container.addChild(title);

    const subtitle = new Text({
      text: '单机足球卡牌小游戏',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 18,
        fill: 0xadb5bd,
      }),
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(w / 2, h * 0.28 + 48);
    this.container.addChild(subtitle);

    // ── Three main buttons ────────────────────────────────────────────────────
    const BTN_W = 200;
    const BTN_H = 52;
    const BTN_GAP = 18;
    const totalH = BTN_H * 3 + BTN_GAP * 2;
    const startY = h * 0.52;

    const startBtn = new Button({
      label: '开始游戏',
      width: BTN_W,
      height: BTN_H,
      color: 0x2d6a4f,
      hoverColor: 0x40916c,
      fontSize: 20,
      onClick: () => this.onStartGame(),
    });
    startBtn.position.set(w / 2 - BTN_W / 2, startY);
    this.container.addChild(startBtn);

    const clubBtn = new Button({
      label: '俱乐部',
      width: BTN_W,
      height: BTN_H,
      color: 0x1d3557,
      hoverColor: 0x2a4d7a,
      fontSize: 20,
      onClick: () => this.onClub(),
    });
    clubBtn.position.set(w / 2 - BTN_W / 2, startY + BTN_H + BTN_GAP);
    this.container.addChild(clubBtn);

    const recruitBtn = new Button({
      label: '招募',
      width: BTN_W,
      height: BTN_H,
      color: 0x6d3b47,
      hoverColor: 0x8b4d5e,
      fontSize: 20,
      onClick: () => this.onRecruit(),
    });
    recruitBtn.position.set(w / 2 - BTN_W / 2, startY + (BTN_H + BTN_GAP) * 2);
    this.container.addChild(recruitBtn);

    void totalH;
  }

  onEnter(): void {
    this.container.alpha = 1;
  }

  onExit(): void {
    this.container.alpha = 0;
  }
}
