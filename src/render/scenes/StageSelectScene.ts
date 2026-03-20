import { Container, Text, Graphics } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { Button } from '../components/Button.ts';
import { Panel } from '../components/Panel.ts';
import { Colors, OUTLINE_WIDTH, BORDER_RADIUS, TextStyles, makeTextStyle } from '../theme.ts';

export interface StageInfo {
  stageId: string;
  name: string;
  description: string;
  rewardCoins: number;
  difficulty: number;
  unlocked: boolean;
  completed: boolean;
}

export class StageSelectScene implements IScene {
  readonly name = 'stageSelect';
  readonly container = new Container();

  private listContainer = new Container();
  private w: number;
  private h: number;
  private onSelectStage: (stageId: string) => void;
  private onBack: () => void;

  constructor(opts: {
    width: number;
    height: number;
    onSelectStage: (stageId: string) => void;
    onBack: () => void;
  }) {
    this.w = opts.width;
    this.h = opts.height;
    this.onSelectStage = opts.onSelectStage;
    this.onBack = opts.onBack;
    this.build();
  }

  private build(): void {
    const bg = new Panel({ width: this.w, height: this.h, color: Colors.deepBlue, outline: false });
    this.container.addChild(bg);

    const title = new Text({ text: '选择关卡', style: TextStyles.heading() });
    title.anchor.set(0.5, 0);
    title.position.set(this.w / 2, 25);
    this.container.addChild(title);

    this.container.addChild(this.listContainer);

    const backBtn = new Button({
      label: '返回',
      width: 160,
      height: 44,
      color: Colors.btnNeutral,
      hoverColor: Colors.btnNeutralHover,
      onClick: () => this.onBack(),
    });
    backBtn.position.set(this.w / 2 - 80, this.h - 65);
    this.container.addChild(backBtn);
  }

  onEnter(data?: unknown): void {
    const d = data as { stages: StageInfo[] } | undefined;
    if (!d?.stages) return;
    this.rebuildList(d.stages);
  }

  onExit(): void {
    this.listContainer.removeChildren();
  }

  private rebuildList(stages: StageInfo[]): void {
    this.listContainer.removeChildren();

    const cardW = 720;
    const cardH = 110;
    const gap = 14;
    const totalH = stages.length * (cardH + gap) - gap;
    const startY = Math.max(85, (this.h - totalH - 40) / 2);
    const startX = (this.w - cardW) / 2;

    stages.forEach((stage, i) => {
      const y = startY + i * (cardH + gap);
      const card = this.createStageCard(stage, cardW, cardH);
      card.position.set(startX, y);
      this.listContainer.addChild(card);
    });
  }

  private createStageCard(stage: StageInfo, w: number, h: number): Container {
    const card = new Container();

    const bgColor = stage.completed ? 0x1b4332 : stage.unlocked ? 0x1f2937 : 0x2a2a3a;
    const borderColor = stage.completed ? Colors.success : stage.unlocked ? 0x4a6fa5 : 0x3a3a4a;

    const bg = new Graphics();
    this.drawCardBg(bg, w, h, bgColor, borderColor);
    card.addChild(bg);

    const strip = new Graphics();
    strip.roundRect(0, 0, 6, h, 3);
    strip.fill({ color: stage.completed ? Colors.success : stage.unlocked ? 0x4a6fa5 : 0x555555 });
    card.addChild(strip);

    const nameText = new Text({
      text: stage.name,
      style: makeTextStyle({
        fontSize: 24,
        fontWeight: 'bold',
        fill: stage.unlocked ? Colors.textPrimary : 0x777777,
      }),
    });
    nameText.position.set(24, 14);
    card.addChild(nameText);

    const stars = '\u2605'.repeat(stage.difficulty) + '\u2606'.repeat(5 - stage.difficulty);
    const diffText = new Text({
      text: stars,
      style: makeTextStyle({ fontSize: 16, fill: stage.unlocked ? Colors.gold : Colors.textDim }),
    });
    diffText.position.set(24, 46);
    card.addChild(diffText);

    const descText = new Text({
      text: stage.description,
      style: makeTextStyle({ fontSize: 14, fill: stage.unlocked ? Colors.textSecondary : Colors.textDim }),
    });
    descText.position.set(24, 72);
    card.addChild(descText);

    const rewardText = new Text({
      text: `${stage.rewardCoins} 金币`,
      style: makeTextStyle({ fontSize: 15, fill: stage.unlocked ? Colors.gold : Colors.textDim }),
    });
    rewardText.anchor.set(1, 0);
    rewardText.position.set(w - 20, 18);
    card.addChild(rewardText);

    if (stage.completed) {
      const statusText = new Text({
        text: '\u2714 已完成',
        style: makeTextStyle({ fontSize: 15, fontWeight: 'bold', fill: Colors.success }),
      });
      statusText.anchor.set(1, 0);
      statusText.position.set(w - 20, 70);
      card.addChild(statusText);
    } else if (!stage.unlocked) {
      const lockedText = new Text({
        text: '未解锁',
        style: makeTextStyle({ fontSize: 15, fill: Colors.textDim }),
      });
      lockedText.anchor.set(1, 0);
      lockedText.position.set(w - 20, 70);
      card.addChild(lockedText);
    }

    if (stage.unlocked) {
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointerover', () => {
        this.drawCardBg(bg, w, h, stage.completed ? 0x264e36 : 0x2a3547, Colors.gold);
      });
      card.on('pointerout', () => {
        this.drawCardBg(bg, w, h, bgColor, borderColor);
      });
      card.on('pointertap', () => {
        this.onSelectStage(stage.stageId);
      });
    }

    return card;
  }

  private drawCardBg(bg: Graphics, w: number, h: number, fill: number, stroke: number): void {
    bg.clear();
    bg.roundRect(0, 0, w, h, BORDER_RADIUS);
    bg.fill({ color: fill, alpha: 0.95 });
    bg.roundRect(0, 0, w, h, BORDER_RADIUS);
    bg.stroke({ color: stroke, width: OUTLINE_WIDTH });
  }
}
