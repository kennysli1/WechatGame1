import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { Button } from '../components/Button.ts';
import { Panel } from '../components/Panel.ts';

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
    const bg = new Panel({ width: this.w, height: this.h, color: 0x16213e });
    this.container.addChild(bg);

    const title = new Text({
      text: '选择关卡',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 36,
        fontWeight: 'bold',
        fill: 0xf8f9fa,
        dropShadow: {
          color: 0x000000,
          blur: 4,
          distance: 2,
          angle: Math.PI / 4,
        },
      }),
    });
    title.anchor.set(0.5, 0);
    title.position.set(this.w / 2, 25);
    this.container.addChild(title);

    this.container.addChild(this.listContainer);

    const backBtn = new Button({
      label: '返回',
      width: 160,
      height: 44,
      color: 0x495057,
      hoverColor: 0x6c757d,
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
    const borderColor = stage.completed ? 0x40916c : stage.unlocked ? 0x4a6fa5 : 0x3a3a4a;

    const bg = new Graphics();
    this.drawCardBg(bg, w, h, bgColor, borderColor);
    card.addChild(bg);

    const strip = new Graphics();
    strip.roundRect(0, 0, 6, h, 3);
    strip.fill({ color: stage.completed ? 0x40916c : stage.unlocked ? 0x4a6fa5 : 0x555555 });
    card.addChild(strip);

    const nameText = new Text({
      text: stage.name,
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 24,
        fontWeight: 'bold',
        fill: stage.unlocked ? 0xf8f9fa : 0x777777,
      }),
    });
    nameText.position.set(24, 14);
    card.addChild(nameText);

    const stars = '\u2605'.repeat(stage.difficulty) + '\u2606'.repeat(5 - stage.difficulty);
    const diffText = new Text({
      text: stars,
      style: new TextStyle({
        fontSize: 16,
        fill: stage.unlocked ? 0xffd700 : 0x666666,
      }),
    });
    diffText.position.set(24, 46);
    card.addChild(diffText);

    const descText = new Text({
      text: stage.description,
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 14,
        fill: stage.unlocked ? 0xadb5bd : 0x666666,
      }),
    });
    descText.position.set(24, 72);
    card.addChild(descText);

    const rewardText = new Text({
      text: `${stage.rewardCoins} 金币`,
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 15,
        fill: stage.unlocked ? 0xffd700 : 0x666666,
      }),
    });
    rewardText.anchor.set(1, 0);
    rewardText.position.set(w - 20, 18);
    card.addChild(rewardText);

    if (stage.completed) {
      const statusText = new Text({
        text: '\u2714 已完成',
        style: new TextStyle({
          fontSize: 15,
          fill: 0x40916c,
          fontWeight: 'bold',
        }),
      });
      statusText.anchor.set(1, 0);
      statusText.position.set(w - 20, 70);
      card.addChild(statusText);
    } else if (!stage.unlocked) {
      const lockedText = new Text({
        text: '未解锁',
        style: new TextStyle({
          fontSize: 15,
          fill: 0x666666,
        }),
      });
      lockedText.anchor.set(1, 0);
      lockedText.position.set(w - 20, 70);
      card.addChild(lockedText);
    }

    if (stage.unlocked) {
      card.eventMode = 'static';
      card.cursor = 'pointer';
      card.on('pointerover', () => {
        this.drawCardBg(bg, w, h, stage.completed ? 0x264e36 : 0x2a3547, 0xffd700);
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
    bg.roundRect(0, 0, w, h, 10);
    bg.fill({ color: fill, alpha: 0.95 });
    bg.roundRect(0, 0, w, h, 10);
    bg.stroke({ color: stroke, width: 2 });
  }
}
