import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { PitchView } from '../components/PitchView.ts';
import { Panel } from '../components/Panel.ts';
import { MatchAnimator, type AnimationStep, type Keyframe } from '../animations/MatchAnimator.ts';
import type { MatchResult } from '../../core/models/MatchResult.ts';
import type { Team } from '../../core/models/Team.ts';

// ---------------------------------------------------------------------------
// 颜色常量
// ---------------------------------------------------------------------------
const COLOR_HOME = 0x3a86ff;
const COLOR_AWAY = 0xff4757;
const COLOR_BALL = 0xffd700;
const COLOR_HIGHLIGHT = 0xffeaa7;
const COLOR_GOAL_FLASH = 0xffd700;

// ---------------------------------------------------------------------------
// 内插函数（多段贝塞尔线性插值）
// ---------------------------------------------------------------------------
function lerpKeyframes(keyframes: Keyframe[], t: number): { x: number; y: number } {
  if (keyframes.length === 0) return { x: 0.5, y: 0.5 };
  if (keyframes.length === 1) return { x: keyframes[0].x, y: keyframes[0].y };

  // 找到 t 所在的分段
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

    // 球场
    this.pitch = new PitchView();
    const pitchX = (opts.width - this.pitch.pitchWidth) / 2;
    const pitchY = 58;
    this.pitch.position.set(pitchX, pitchY);
    this.container.addChild(this.pitch);

    // 球场内动画层
    this.pitchLayer = new Container();
    this.pitchLayer.position.set(pitchX, pitchY);
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

    // 底部事件文字
    const eventBgY = pitchY + this.pitch.pitchHeight + 8;
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

    const animator = new MatchAnimator();
    this.timeline = animator.buildTimeline(d.result.events, d.homeTeam, d.awayTeam);
    this.stepIndex = 0;
    this.elapsed = 0;
    this.playing = true;

    // 初始化球员点（用 homeTeam/awayTeam 如果有；否则用 result 的名字作占位）
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
    }
  }

  // ---------------------------------------------------------------------------
  // 私有辅助方法
  // ---------------------------------------------------------------------------

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

      // 球员名字标签
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
    // 外圈
    this.ballDot.circle(0, 0, 8);
    this.ballDot.fill({ color: COLOR_BALL });
    this.ballDot.stroke({ color: 0x333333, width: 2 });
    // 中心点
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
    // 判断进球方：scorer 在 homePlayerIds 中则主队得分，否则客队得分
    if (this.homePlayerIds.size > 0) {
      if (this.homePlayerIds.has(scorerId)) {
        this.homeScore++;
      } else {
        this.awayScore++;
      }
    } else {
      // 无队伍信息时，按最终比分比例分配（降级策略）
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
}
