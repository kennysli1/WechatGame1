import { Container, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { Button } from '../components/Button.ts';
import { Panel } from '../components/Panel.ts';

export class MenuScene implements IScene {
  readonly name = 'menu';
  readonly container = new Container();
  private onStartGame: () => void;
  private onSettings: () => void;

  constructor(opts: {
    width: number;
    height: number;
    onStartGame: () => void;
    onSettings?: () => void;
  }) {
    this.onStartGame = opts.onStartGame;
    this.onSettings = opts.onSettings ?? (() => {});
    this.build(opts.width, opts.height);
  }

  private build(w: number, h: number): void {
    const panel = new Panel({ width: w, height: h, color: 0x16213e });
    this.container.addChild(panel);

    const title = new Text({
      text: '热血球球',
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

    const startBtn = new Button({
      label: '开始比赛',
      width: 220,
      height: 56,
      color: 0x2d6a4f,
      hoverColor: 0x40916c,
      onClick: () => this.onStartGame(),
    });
    startBtn.position.set(w / 2 - 110, h * 0.55);
    this.container.addChild(startBtn);

    const settingsBtn = new Button({
      label: '设置',
      width: 160,
      height: 44,
      color: 0x495057,
      hoverColor: 0x6c757d,
      fontSize: 18,
      onClick: () => this.onSettings(),
    });
    settingsBtn.position.set(w / 2 - 80, h * 0.55 + 76);
    this.container.addChild(settingsBtn);
  }

  onEnter(): void {
    this.container.alpha = 1;
  }

  onExit(): void {
    this.container.alpha = 0;
  }
}
