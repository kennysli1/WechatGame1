import { Container, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { Button } from '../components/Button.ts';
import { Panel } from '../components/Panel.ts';

export class MenuScene implements IScene {
  readonly name = 'menu';
  readonly container = new Container();
  private onStartGame: () => void;

  constructor(opts: { width: number; height: number; onStartGame: () => void }) {
    this.onStartGame = opts.onStartGame;
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
    title.position.set(w / 2, h * 0.3);
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
    subtitle.position.set(w / 2, h * 0.3 + 48);
    this.container.addChild(subtitle);

    const startBtn = new Button({
      label: '开始比赛',
      width: 220,
      height: 56,
      color: 0x2d6a4f,
      hoverColor: 0x40916c,
      onClick: () => this.onStartGame(),
    });
    startBtn.position.set(w / 2 - 110, h * 0.6);
    this.container.addChild(startBtn);
  }

  onEnter(): void {
    this.container.alpha = 1;
  }

  onExit(): void {
    this.container.alpha = 0;
  }
}
