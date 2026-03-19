import { Container, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { Panel } from '../components/Panel.ts';
import { Button } from '../components/Button.ts';
import type { MatchResult } from '../../core/models/MatchResult.ts';

export class ResultScene implements IScene {
  readonly name = 'result';
  readonly container = new Container();

  private titleText: Text;
  private scoreText: Text;
  private mvpText: Text;
  private onBack: () => void;

  constructor(opts: { width: number; height: number; onBack: () => void }) {
    this.onBack = opts.onBack;

    const panel = new Panel({ width: opts.width, height: opts.height, color: 0x1a1a2e });
    this.container.addChild(panel);

    this.titleText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 40,
        fontWeight: 'bold',
        fill: 0xffd700,
      }),
    });
    this.titleText.anchor.set(0.5);
    this.titleText.position.set(opts.width / 2, opts.height * 0.25);
    this.container.addChild(this.titleText);

    this.scoreText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 28,
        fill: 0xffffff,
      }),
    });
    this.scoreText.anchor.set(0.5);
    this.scoreText.position.set(opts.width / 2, opts.height * 0.4);
    this.container.addChild(this.scoreText);

    this.mvpText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 20,
        fill: 0xadb5bd,
      }),
    });
    this.mvpText.anchor.set(0.5);
    this.mvpText.position.set(opts.width / 2, opts.height * 0.52);
    this.container.addChild(this.mvpText);

    const backBtn = new Button({
      label: '返回菜单',
      width: 200,
      height: 48,
      color: 0x2d6a4f,
      hoverColor: 0x40916c,
      onClick: () => this.onBack(),
    });
    backBtn.position.set(opts.width / 2 - 100, opts.height * 0.7);
    this.container.addChild(backBtn);
  }

  onEnter(data?: unknown): void {
    const result = data as MatchResult | undefined;
    if (!result) return;

    const won = result.homeGoals > result.awayGoals;
    const draw = result.homeGoals === result.awayGoals;
    this.titleText.text = won ? '胜利！' : draw ? '平局' : '失败';
    this.titleText.style.fill = won ? 0xffd700 : draw ? 0xadb5bd : 0xe63946;

    this.scoreText.text = `${result.homeName} ${result.homeGoals} : ${result.awayGoals} ${result.awayName}`;
    this.mvpText.text = `MVP: ${result.mvpPlayerId}`;
  }
}
