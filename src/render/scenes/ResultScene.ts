import { Container, Text, Graphics } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { Panel } from '../components/Panel.ts';
import { Button } from '../components/Button.ts';
import type { MatchResult } from '../../core/models/MatchResult.ts';
import { Colors, makeTextStyle } from '../theme.ts';

export interface ResultSceneData {
  result: MatchResult;
  stageId?: string;
  rewards?: {
    coins: number;
    cardName?: string;
  };
  hasNextStage?: boolean;
  cardNames?: Record<string, string>;
}

export class ResultScene implements IScene {
  readonly name = 'result';
  readonly container = new Container();

  private contentContainer = new Container();
  private w: number;
  private h: number;
  private onBack: () => void;
  private onNextStage?: () => void;

  constructor(opts: {
    width: number;
    height: number;
    onBack: () => void;
    onNextStage?: () => void;
  }) {
    this.w = opts.width;
    this.h = opts.height;
    this.onBack = opts.onBack;
    this.onNextStage = opts.onNextStage;

    const bg = new Panel({ width: this.w, height: this.h, color: Colors.bgDark, outline: false });
    this.container.addChild(bg);
    this.container.addChild(this.contentContainer);
  }

  onEnter(data?: unknown): void {
    this.contentContainer.removeChildren();
    if (!data) return;

    let result: MatchResult;
    let rewards: ResultSceneData['rewards'];
    let hasNextStage = false;
    let cardNames: Record<string, string> = {};

    if (this.isResultSceneData(data)) {
      result = data.result;
      rewards = data.rewards;
      hasNextStage = data.hasNextStage ?? false;
      cardNames = data.cardNames ?? {};
    } else {
      result = data as MatchResult;
    }

    const resolveName = (id: string) => cardNames[id] ?? id;
    const won = result.homeGoals > result.awayGoals;
    const draw = result.homeGoals === result.awayGoals;

    this.buildTitle(won, draw);
    this.buildScore(result);
    this.buildDivider(150);

    let yPos = 168;
    yPos = this.buildGoalSummary(result, resolveName, yPos);
    yPos = this.buildMVP(result, resolveName, yPos);
    yPos = this.buildRewards(won, rewards, yPos);
    this.buildButtons(won, hasNextStage, yPos);
  }

  private isResultSceneData(data: unknown): data is ResultSceneData {
    return typeof data === 'object' && data !== null && 'result' in data;
  }

  private buildTitle(won: boolean, draw: boolean): void {
    const titleText = new Text({
      text: won ? '胜利！' : draw ? '平局' : '失败',
      style: makeTextStyle({
        fontSize: 44,
        fontWeight: 'bold',
        fill: won ? Colors.gold : draw ? Colors.textSecondary : Colors.actionRed,
        dropShadow: true,
      }),
    });
    titleText.anchor.set(0.5);
    titleText.position.set(this.w / 2, 55);
    this.contentContainer.addChild(titleText);
  }

  private buildScore(result: MatchResult): void {
    const scoreText = new Text({
      text: `${result.homeName}  ${result.homeGoals} : ${result.awayGoals}  ${result.awayName}`,
      style: makeTextStyle({ fontSize: 30, fontWeight: 'bold' }),
    });
    scoreText.anchor.set(0.5);
    scoreText.position.set(this.w / 2, 115);
    this.contentContainer.addChild(scoreText);
  }

  private buildDivider(y: number, widthFrac = 0.6): void {
    const line = new Graphics();
    const halfW = this.w * widthFrac / 2;
    line.moveTo(this.w / 2 - halfW, y);
    line.lineTo(this.w / 2 + halfW, y);
    line.stroke({ color: Colors.divider, width: 1 });
    this.contentContainer.addChild(line);
  }

  private buildGoalSummary(
    result: MatchResult,
    resolveName: (id: string) => string,
    yPos: number,
  ): number {
    const goals = result.events.filter(e => e.type === 'goal');

    if (goals.length > 0) {
      const header = this.txt('进球记录', 18, Colors.textSecondary, true);
      header.anchor.set(0.5, 0);
      header.position.set(this.w / 2, yPos);
      this.contentContainer.addChild(header);
      yPos += 28;

      const maxShown = 5;
      for (const g of goals.slice(0, maxShown)) {
        if (g.type === 'goal') {
          const assist = g.assist ? `  (助攻: ${resolveName(g.assist)})` : '';
          const line = this.txt(
            `\u26bd ${g.minute}' ${resolveName(g.scorer)}${assist}`,
            16, Colors.textPrimary,
          );
          line.anchor.set(0.5, 0);
          line.position.set(this.w / 2, yPos);
          this.contentContainer.addChild(line);
          yPos += 24;
        }
      }
      if (goals.length > maxShown) {
        const more = this.txt(`... 还有 ${goals.length - maxShown} 个进球`, 14, Colors.textMuted);
        more.anchor.set(0.5, 0);
        more.position.set(this.w / 2, yPos);
        this.contentContainer.addChild(more);
        yPos += 22;
      }
    } else {
      const noGoals = this.txt('0:0 白卷一场', 16, Colors.textMuted);
      noGoals.anchor.set(0.5, 0);
      noGoals.position.set(this.w / 2, yPos);
      this.contentContainer.addChild(noGoals);
      yPos += 24;
    }

    return yPos + 8;
  }

  private buildMVP(
    result: MatchResult,
    resolveName: (id: string) => string,
    yPos: number,
  ): number {
    const mvp = this.txt(`MVP: ${resolveName(result.mvpPlayerId)}`, 20, Colors.gold, true);
    mvp.anchor.set(0.5, 0);
    mvp.position.set(this.w / 2, yPos);
    this.contentContainer.addChild(mvp);
    return yPos + 36;
  }

  private buildRewards(
    won: boolean,
    rewards: ResultSceneData['rewards'],
    yPos: number,
  ): number {
    if (!won || !rewards) return yPos;

    this.buildDivider(yPos, 0.4);
    yPos += 14;

    const title = this.txt('关卡奖励', 20, Colors.gold, true);
    title.anchor.set(0.5, 0);
    title.position.set(this.w / 2, yPos);
    this.contentContainer.addChild(title);
    yPos += 28;

    const coins = this.txt(`+${rewards.coins} 金币`, 18, Colors.textPrimary);
    coins.anchor.set(0.5, 0);
    coins.position.set(this.w / 2, yPos);
    this.contentContainer.addChild(coins);
    yPos += 26;

    if (rewards.cardName) {
      const cardReward = this.txt(`获得球员: ${rewards.cardName}`, 18, Colors.success);
      cardReward.anchor.set(0.5, 0);
      cardReward.position.set(this.w / 2, yPos);
      this.contentContainer.addChild(cardReward);
      yPos += 26;
    }

    return yPos;
  }

  private buildButtons(won: boolean, hasNextStage: boolean, yPos: number): void {
    const btnY = Math.max(yPos + 25, this.h - 75);

    if (hasNextStage && won && this.onNextStage) {
      const backBtn = new Button({
        label: '返回菜单',
        width: 180,
        height: 48,
        color: Colors.btnNeutral,
        hoverColor: Colors.btnNeutralHover,
        onClick: () => this.onBack(),
      });
      backBtn.position.set(this.w / 2 - 200, btnY);
      this.contentContainer.addChild(backBtn);

      const nextBtn = new Button({
        label: '下一关',
        width: 180,
        height: 48,
        color: Colors.btnPrimary,
        hoverColor: Colors.btnPrimaryHover,
        onClick: () => this.onNextStage!(),
      });
      nextBtn.position.set(this.w / 2 + 20, btnY);
      this.contentContainer.addChild(nextBtn);
    } else {
      const backBtn = new Button({
        label: '返回菜单',
        width: 200,
        height: 48,
        color: Colors.btnPrimary,
        hoverColor: Colors.btnPrimaryHover,
        onClick: () => this.onBack(),
      });
      backBtn.position.set(this.w / 2 - 100, btnY);
      this.contentContainer.addChild(backBtn);
    }
  }

  private txt(content: string, size: number, color: number, bold = false): Text {
    return new Text({
      text: content,
      style: makeTextStyle({ fontSize: size, fontWeight: bold ? 'bold' : 'normal', fill: color }),
    });
  }
}
