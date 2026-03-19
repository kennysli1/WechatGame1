import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { PitchView } from '../components/PitchView.ts';
import { Panel } from '../components/Panel.ts';
import { MatchAnimator, type AnimationStep, type Keyframe, type TipData } from '../animations/MatchAnimator.ts';
import type { MatchResult } from '../../core/models/MatchResult.ts';
import type { Team } from '../../core/models/Team.ts';

// ---------------------------------------------------------------------------
// 颜色常量
// ---------------------------------------------------------------------------
const COLOR_HOME      = 0x3a86ff;
const COLOR_AWAY      = 0xff4757;
const COLOR_BALL      = 0xffd700;
const COLOR_GOAL_FLASH = 0xffd700;

// ---------------------------------------------------------------------------
// 内插函数（多段线性插值）
// ---------------------------------------------------------------------------
function lerpKeyframes(keyframes: Keyframe[], t: number): { x: number; y: number } {
  if (keyframes.length === 0) return { x: 0.5, y: 0.5 };
  if (keyframes.length === 1) return { x: keyframes[0].x, y: keyframes[0].y };

  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i];
    const k1 = keyframes[i + 1];
    if (t <= k1.t) {
      const seg = k1.t - k0.t;
      const local = seg > 0 ? (t - k0.t) / seg : 1;
      return {
        x: k0.x + (k1.x - k0.x) * local,
        y: k0.y + (k1.y - k0.y) * local,
      };
    }
  }
  const last = keyframes[keyframes.length - 1];
  return { x: last.x, y: last.y };
}

// ---------------------------------------------------------------------------
// MatchScene
// ---------------------------------------------------------------------------
export interface MatchSceneData {
  result: MatchResult;
  homeTeam?: Team;
  awayTeam?: Team;
}

export class MatchScene implements IScene {
  readonly name = 'match';
  readonly container = new Container();

  private pitch: PitchView;
  private scoreText: Text;
  private minuteText: Text;
  private eventText: Text;
  private eventBg: Graphics;

  // 动画层（在球场内部）
  private pitchLayer: Container;
  private playerDots = new Map<string, Graphics>(); // playerId → dot
  private ballDot: Graphics;
  private goalFlash: Graphics;
  private goalLabel: Text;

  // 播放状态
  private timeline: AnimationStep[] = [];
  private stepIndex = 0;
  private elapsed = 0;
  private playing = false;
  private result: MatchResult | null = null;
  private homeScore = 0;
  private awayScore = 0;
  private homePlayerIds = new Set<string>();
  private onMatchEnd: (result: MatchResult) => void;

  // 当前步骤缓存
  private currentStep: AnimationStep | null = null;
  private goalFlashTimer = 0;
  private readonly GOAL_FLASH_DURATION = 1200;

  // 尺寸
  private readonly W: number;
  private readonly H: number;
  private readonly pitchX: number;
  private readonly pitchY: number;

  // ── 跳过按钮 ──────────────────────────────────────────────────────────────
  private skipBtn: Container;

  // ── Tips 弹窗 ──────────────────────────────────────────────────────────────
  private tipContainer: Container;
  private tipBg: Graphics;
  private tipIconText: Text;
  private tipLabelText: Text;
  private tipRateBar: Graphics;
  private tipRateText: Text;
  private tipSkillNameText: Text;
  private tipAlpha = 0;
  private tipFadeTarget = 0;
  private tipStepDuration = 1000;
  private tipElapsed = 0;

  constructor(opts: { width: number; height: number; onMatchEnd: (r: MatchResult) => void }) {
    this.W = opts.width;
    this.H = opts.height;
    this.onMatchEnd = opts.onMatchEnd;

    // 背景
    const panel = new Panel({ width: opts.width, height: opts.height, color: 0x0f3460 });
    this.container.addChild(panel);

    // 顶部比分栏
    const scoreBg = new Graphics();
    scoreBg.rect(0, 0, opts.width, 50);
    scoreBg.fill({ color: 0x16213e });
    this.container.addChild(scoreBg);

    this.scoreText = new Text({
      text: '0 : 0',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 28,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    });
    this.scoreText.anchor.set(0.5);
    this.scoreText.position.set(opts.width / 2, 25);
    this.container.addChild(this.scoreText);

    this.minuteText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        fill: 0xadb5bd,
      }),
    });
    this.minuteText.anchor.set(0.5);
    this.minuteText.position.set(opts.width / 2, 44);
    this.container.addChild(this.minuteText);

    // 2.5D 斜视角球场（isometric = true）
    this.pitch = new PitchView(700, 420, true);
    this.pitchX = (opts.width - this.pitch.pitchWidth) / 2;
    this.pitchY = 58;
    this.pitch.position.set(this.pitchX, this.pitchY);
    this.container.addChild(this.pitch);

    // 球场内动画层
    this.pitchLayer = new Container();
    this.pitchLayer.position.set(this.pitchX, this.pitchY);
    this.container.addChild(this.pitchLayer);

    // 进球闪光全屏覆盖层
    this.goalFlash = new Graphics();
    this.goalFlash.rect(0, 0, opts.width, opts.height);
    this.goalFlash.fill({ color: COLOR_GOAL_FLASH });
    this.goalFlash.alpha = 0;
    this.container.addChild(this.goalFlash);

    // 进球文字
    this.goalLabel = new Text({
      text: '⚽ 进球！',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 52,
        fontWeight: 'bold',
        fill: 0xffd700,
        stroke: { color: 0x222222, width: 6 },
        dropShadow: { color: 0x000000, blur: 8, distance: 4, angle: Math.PI / 4 },
      }),
    });
    this.goalLabel.anchor.set(0.5);
    this.goalLabel.position.set(opts.width / 2, opts.height / 2);
    this.goalLabel.alpha = 0;
    this.container.addChild(this.goalLabel);

    // 球（在所有层之上）
    this.ballDot = new Graphics();
    this.pitchLayer.addChild(this.ballDot);
    this.drawBall();

    // 底部事件文字（位置紧贴等效球场高度下方）
    const effectivePitchBottom = this.pitchY + this.pitch.effectiveHeight;
    const eventBgY = effectivePitchBottom + 8;
    this.eventBg = new Graphics();
    this.eventBg.roundRect(20, eventBgY, opts.width - 40, 52, 10);
    this.eventBg.fill({ color: 0x16213e, alpha: 0.85 });
    this.container.addChild(this.eventBg);

    this.eventText = new Text({
      text: '比赛即将开始...',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 18,
        fill: 0xf0f0f0,
        wordWrap: true,
        wordWrapWidth: opts.width - 60,
        align: 'center',
      }),
    });
    this.eventText.anchor.set(0.5, 0.5);
    this.eventText.position.set(opts.width / 2, eventBgY + 26);
    this.container.addChild(this.eventText);

    // ── 跳过按钮（右下角）──────────────────────────────────────────────────
    this.skipBtn = this.buildSkipButton();
    this.container.addChild(this.skipBtn);

    // ── Tips 弹窗层（球员 / 球之上）────────────────────────────────────────
    this.tipContainer = new Container();
    this.tipContainer.alpha = 0;

    this.tipBg = new Graphics();
    this.tipContainer.addChild(this.tipBg);

    this.tipIconText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 22,
      }),
    });
    this.tipIconText.position.set(10, 8);
    this.tipContainer.addChild(this.tipIconText);

    this.tipLabelText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xdde3ed,
      }),
    });
    this.tipLabelText.position.set(38, 10);
    this.tipContainer.addChild(this.tipLabelText);

    this.tipRateBar = new Graphics();
    this.tipRateBar.position.set(10, 36);
    this.tipContainer.addChild(this.tipRateBar);

    this.tipRateText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    });
    this.tipRateText.position.set(10, 56);
    this.tipContainer.addChild(this.tipRateText);

    this.tipSkillNameText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0xffe680,
        dropShadow: { color: 0x000000, blur: 3, distance: 1, angle: Math.PI / 4 },
      }),
    });
    this.tipSkillNameText.anchor.set(0.5, 0);
    this.tipContainer.addChild(this.tipSkillNameText);

    this.container.addChild(this.tipContainer);
  }

  // ---------------------------------------------------------------------------
  // 跳过按钮构建
  // ---------------------------------------------------------------------------

  private buildSkipButton(): Container {
    const btn = new Container();
    const BW = 90, BH = 32;
    const bx = this.W - BW - 14;
    const by = this.H - BH - 14;

    const bg = new Graphics();
    bg.roundRect(0, 0, BW, BH, 8);
    bg.fill({ color: 0x16213e, alpha: 0.88 });
    bg.roundRect(0, 0, BW, BH, 8);
    bg.stroke({ color: 0x4a9eff, width: 1.5 });
    btn.addChild(bg);

    const label = new Text({
      text: '跳过 ›',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0x7ec8ff,
      }),
    });
    label.anchor.set(0.5);
    label.position.set(BW / 2, BH / 2);
    btn.addChild(label);

    btn.position.set(bx, by);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';

    btn.on('pointerdown', () => this.skipToEnd());
    btn.on('pointerover', () => { bg.tint = 0xaaddff; });
    btn.on('pointerout',  () => { bg.tint = 0xffffff; });

    return btn;
  }

  // ---------------------------------------------------------------------------
  // IScene 生命周期
  // ---------------------------------------------------------------------------

  onEnter(data?: unknown): void {
    const d = data as MatchSceneData | undefined;
    if (!d?.result) return;

    this.result = d.result;
    this.homeScore = 0;
    this.awayScore = 0;
    this.homePlayerIds.clear();
    if (d.homeTeam) {
      for (const slot of d.homeTeam.formation) {
        this.homePlayerIds.add(slot.card.id);
      }
    }
    this.updateScoreText();
    this.eventText.text = '比赛即将开始...';
    this.goalFlash.alpha = 0;
    this.goalLabel.alpha = 0;
    this.goalFlashTimer = 0;

    // 隐藏 tip
    this.tipContainer.alpha = 0;
    this.tipAlpha = 0;
    this.tipFadeTarget = 0;

    const animator = new MatchAnimator();
    this.timeline = animator.buildTimeline(d.result.events, d.homeTeam, d.awayTeam);
    this.stepIndex = 0;
    this.elapsed = 0;
    this.playing = true;

    // 初始化球员点
    this.playerDots.forEach((dot) => this.pitchLayer.removeChild(dot));
    this.playerDots.clear();

    if (d.homeTeam) this.spawnTeamDots(d.homeTeam, COLOR_HOME, false);
    if (d.awayTeam) this.spawnTeamDots(d.awayTeam, COLOR_AWAY, true);

    // 球放中场
    const center = this.pitch.normalizedToPixel(0.5, 0.5);
    this.ballDot.position.set(center.x, center.y);

    // 确保球在最顶层
    this.pitchLayer.removeChild(this.ballDot);
    this.pitchLayer.addChild(this.ballDot);
  }

  onExit(): void {
    this.playing = false;
  }

  update(dt: number): void {
    if (!this.playing || !this.result) return;

    // 进球闪光衰减
    if (this.goalFlashTimer > 0) {
      this.goalFlashTimer -= dt * 16.67;
      const progress = 1 - Math.max(0, this.goalFlashTimer / this.GOAL_FLASH_DURATION);
      this.goalFlash.alpha = Math.max(0, 0.55 * (1 - progress * 2));
      this.goalLabel.alpha = Math.max(0, 1 - progress * 1.6);
    }

    // Tips 透明度平滑插值
    this.updateTipFade(dt * 16.67);

    if (this.stepIndex >= this.timeline.length) {
      this.playing = false;
      this.onMatchEnd(this.result);
      return;
    }

    const step = this.timeline[this.stepIndex];
    this.elapsed += dt * 16.67;
    this.currentStep = step;

    const t = Math.min(1, this.elapsed / step.durationMs);

    // 更新球的位置
    const ballNorm = lerpKeyframes(step.ballKeyframes, t);
    const ballPx = this.pitch.normalizedToPixel(ballNorm.x, ballNorm.y);
    this.ballDot.position.set(ballPx.x, ballPx.y);

    // 高亮球员
    this.updatePlayerHighlights(step.highlightPlayers);

    // 控制 tip 淡出时机（步骤剩余时间 < 25% 开始淡出）
    if (step.tip && this.elapsed / step.durationMs > 0.75) {
      this.tipFadeTarget = 0;
    }

    if (this.elapsed >= step.durationMs) {
      this.elapsed = 0;
      this.eventText.text = step.description;

      // 更新比分
      if (step.event.type === 'goal') {
        this.triggerGoalEffect(step.event.scorer, step.description);
      }

      if (step.event.type === 'fulltime') {
        const e = step.event;
        this.homeScore = e.homeGoals;
        this.awayScore = e.awayGoals;
        this.updateScoreText();
      }

      if (step.event.type === 'halftime') {
        this.minuteText.text = '中场';
      } else if ('minute' in step.event) {
        this.minuteText.text = `第 ${(step.event as { minute: number }).minute} 分钟`;
      }

      this.stepIndex++;

      // 下一步骤开始时展示 tip
      if (this.stepIndex < this.timeline.length) {
        const nextStep = this.timeline[this.stepIndex];
        if (nextStep.tip) {
          this.showTipForStep(nextStep);
        } else {
          this.tipFadeTarget = 0;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 私有辅助方法
  // ---------------------------------------------------------------------------

  private skipToEnd(): void {
    if (!this.result) return;
    this.playing = false;
    this.tipFadeTarget = 0;
    this.tipContainer.alpha = 0;
    this.onMatchEnd(this.result);
  }

  private spawnTeamDots(team: Team, color: number, mirror: boolean): void {
    for (const slot of team.formation) {
      const nx = mirror ? 1 - slot.x : slot.x;
      const ny = slot.y;
      const px = this.pitch.normalizedToPixel(nx, ny);

      const dot = new Graphics();
      dot.circle(0, 0, 10);
      dot.fill({ color });
      dot.stroke({ color: 0xffffff, width: 2 });
      dot.position.set(px.x, px.y);

      // 深度缩放：远端球员略小
      const depthScale = 0.78 + 0.22 * ny;
      dot.scale.set(depthScale);

      const label = new Text({
        text: slot.card.name.slice(0, 2),
        style: new TextStyle({
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontSize: 10,
          fill: 0xffffff,
          fontWeight: 'bold',
        }),
      });
      label.anchor.set(0.5, 0.5);
      dot.addChild(label);

      this.pitchLayer.addChild(dot);
      this.playerDots.set(slot.card.id, dot);
    }
  }

  private drawBall(): void {
    this.ballDot.clear();
    this.ballDot.circle(0, 0, 8);
    this.ballDot.fill({ color: COLOR_BALL });
    this.ballDot.stroke({ color: 0x333333, width: 2 });
    this.ballDot.circle(0, 0, 3);
    this.ballDot.fill({ color: 0x333333 });
  }

  private updatePlayerHighlights(ids: string[]): void {
    for (const [id, dot] of this.playerDots) {
      const highlighted = ids.includes(id);
      if (highlighted) {
        dot.scale.set(1.35);
        dot.alpha = 1;
      } else {
        dot.scale.set(1);
        dot.alpha = 0.75;
      }
    }
  }

  private updateScoreText(): void {
    if (!this.result) return;
    this.scoreText.text = `${this.result.homeName}  ${this.homeScore} : ${this.awayScore}  ${this.result.awayName}`;
  }

  private triggerGoalEffect(scorerId: string, description: string): void {
    if (this.homePlayerIds.size > 0) {
      if (this.homePlayerIds.has(scorerId)) {
        this.homeScore++;
      } else {
        this.awayScore++;
      }
    } else {
      const finalHome = this.result?.homeGoals ?? 0;
      const finalAway = this.result?.awayGoals ?? 0;
      const totalGoals = this.homeScore + this.awayScore + 1;
      const totalFinal = finalHome + finalAway;
      if (totalGoals <= totalFinal) {
        const ratio = totalGoals / totalFinal;
        this.homeScore = Math.round(finalHome * ratio);
        this.awayScore = Math.round(finalAway * ratio);
      }
    }
    this.updateScoreText();

    this.goalFlashTimer = this.GOAL_FLASH_DURATION;
    this.goalFlash.alpha = 0.55;
    this.goalLabel.text = description;
    this.goalLabel.alpha = 1;
  }

  // ---------------------------------------------------------------------------
  // Tips 弹窗
  // ---------------------------------------------------------------------------

  private showTipForStep(step: AnimationStep): void {
    const tip = step.tip;
    if (!tip) return;

    this.tipStepDuration = step.durationMs;
    this.tipElapsed = 0;
    this.tipFadeTarget = 1;

    // 计算 tip 弹窗位置（基于球的起始位置）
    const startKf = step.ballKeyframes[0] ?? { x: 0.5, y: 0.5 };
    const ballPx = this.pitch.normalizedToPixel(startKf.x, startKf.y);
    const screenBallX = this.pitchX + ballPx.x;
    const screenBallY = this.pitchY + ballPx.y;

    const TIP_W = tip.type === 'skill' ? 168 : 158;
    const TIP_H = tip.type === 'skill' ? 72 : 80;

    // 优先显示在球的右上方，防止越界则自动调整
    let tx = screenBallX + 18;
    let ty = screenBallY - TIP_H - 14;
    tx = Math.max(8, Math.min(this.W - TIP_W - 8, tx));
    ty = Math.max(56, Math.min(this.H - TIP_H - 8, ty));

    this.tipContainer.position.set(tx, ty);
    this.buildTipContent(tip, TIP_W, TIP_H);
  }

  private buildTipContent(tip: TipData, w: number, h: number): void {
    // 背景
    this.tipBg.clear();
    this.tipBg.roundRect(0, 0, w, h, 10);
    this.tipBg.fill({ color: 0x0d1b3e, alpha: 0.92 });
    this.tipBg.roundRect(0, 0, w, h, 10);
    if (tip.type === 'skill') {
      this.tipBg.stroke({ color: 0xffe246, width: 2 });
    } else {
      const borderColor = tip.success ? 0x44cc88 : 0xff6655;
      this.tipBg.stroke({ color: borderColor, width: 1.5 });
    }

    // 图标
    this.tipIconText.text = tip.icon;
    this.tipIconText.visible = true;

    // 主标签
    this.tipLabelText.text = tip.label;
    this.tipLabelText.visible = true;

    if (tip.type === 'rate' && tip.rate !== undefined) {
      // 成功率进度条
      const barW = w - 20;
      const rate = tip.rate;
      const barColor = rate >= 0.55 ? 0x44cc88 : rate >= 0.35 ? 0xf0b040 : 0xff5555;

      this.tipRateBar.clear();
      // 底条
      this.tipRateBar.roundRect(0, 0, barW, 10, 5);
      this.tipRateBar.fill({ color: 0x334466 });
      // 填充条
      this.tipRateBar.roundRect(0, 0, Math.max(4, barW * rate), 10, 5);
      this.tipRateBar.fill({ color: barColor });
      this.tipRateBar.visible = true;

      this.tipRateText.text = `${Math.round(rate * 100)}%`;
      this.tipRateText.style.fill = barColor;
      this.tipRateText.visible = true;
      this.tipRateText.position.set(w - 42, 56);

      this.tipSkillNameText.visible = false;
    } else if (tip.type === 'skill') {
      // 技能名称居中展示
      this.tipSkillNameText.text = tip.label;
      this.tipSkillNameText.position.set(w / 2, 34);
      this.tipSkillNameText.visible = true;

      this.tipRateBar.clear();
      this.tipRateBar.visible = false;
      this.tipRateText.visible = false;
    }
  }

  private updateTipFade(dtMs: number): void {
    const FADE_SPEED = 0.006; // per ms → 0 to 1 in ~166ms
    if (this.tipFadeTarget > this.tipAlpha) {
      this.tipAlpha = Math.min(this.tipFadeTarget, this.tipAlpha + dtMs * FADE_SPEED);
    } else if (this.tipFadeTarget < this.tipAlpha) {
      this.tipAlpha = Math.max(this.tipFadeTarget, this.tipAlpha - dtMs * FADE_SPEED);
    }
    this.tipContainer.alpha = this.tipAlpha;
  }
}
