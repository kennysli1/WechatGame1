import { Container, Sprite, Text, Texture } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import type { AssetManager } from '../AssetManager.ts';
import { Button } from '../components/Button.ts';
import { Panel } from '../components/Panel.ts';
import { Colors, TextStyles, makeTextStyle } from '../theme.ts';

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
    assetManager?: AssetManager;
  }) {
    this.onStartGame = opts.onStartGame;
    this.onClub      = opts.onClub    ?? (() => {});
    this.onRecruit   = opts.onRecruit ?? (() => {});
    this.build(opts.width, opts.height, opts.assetManager);
  }

  private build(w: number, h: number, assetManager?: AssetManager): void {
    const bgTexture = assetManager?.getTexture('menu_bg');
    if (bgTexture && bgTexture !== Texture.EMPTY) {
      const bg = new Sprite(bgTexture);
      bg.width = w;
      bg.height = h;
      bg.position.set(0, 0);
      this.container.addChild(bg);
    } else {
      const panel = new Panel({ width: w, height: h, color: Colors.deepBlue, outline: false });
      this.container.addChild(panel);
    }

    const title = new Text({ text: '功夫足球', style: TextStyles.title() });
    title.anchor.set(0.5);
    title.position.set(w / 2, h * 0.28);
    this.container.addChild(title);

    const subtitle = new Text({
      text: '单机足球卡牌小游戏',
      style: makeTextStyle({ fontSize: 18, fill: Colors.textSecondary }),
    });
    subtitle.anchor.set(0.5);
    subtitle.position.set(w / 2, h * 0.28 + 48);
    this.container.addChild(subtitle);

    const BTN_W = 220;
    const BTN_H = 54;
    const BTN_GAP = 16;
    const startY = h * 0.52;

    const startBtn = new Button({
      label: '开始游戏',
      width: BTN_W,
      height: BTN_H,
      color: Colors.btnPrimary,
      hoverColor: Colors.btnPrimaryHover,
      fontSize: 22,
      onClick: () => this.onStartGame(),
    });
    startBtn.position.set(w / 2 - BTN_W / 2, startY);
    this.container.addChild(startBtn);

    const clubBtn = new Button({
      label: '俱乐部',
      width: BTN_W,
      height: BTN_H,
      color: Colors.btnSecondary,
      hoverColor: Colors.btnSecondaryHover,
      fontSize: 22,
      onClick: () => this.onClub(),
    });
    clubBtn.position.set(w / 2 - BTN_W / 2, startY + BTN_H + BTN_GAP);
    this.container.addChild(clubBtn);

    const recruitBtn = new Button({
      label: '招募',
      width: BTN_W,
      height: BTN_H,
      color: Colors.btnDanger,
      hoverColor: Colors.btnDangerHover,
      fontSize: 22,
      onClick: () => this.onRecruit(),
    });
    recruitBtn.position.set(w / 2 - BTN_W / 2, startY + (BTN_H + BTN_GAP) * 2);
    this.container.addChild(recruitBtn);
  }

  onEnter(): void {
    this.container.alpha = 1;
  }

  onExit(): void {
    this.container.alpha = 0;
  }
}
