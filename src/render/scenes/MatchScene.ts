import { Container, Graphics, Text, TextStyle, Sprite, Assets, Texture } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import type { AssetManager } from '../AssetManager.ts';
import { MatchAnimator, type AnimationStep, type Keyframe, type TipData } from '../animations/MatchAnimator.ts';
import type { MatchResult } from '../../core/models/MatchResult.ts';
import type { Team } from '../../core/models/Team.ts';
import type { Position } from '../../core/data/schemas.ts';
import { Colors, OUTLINE_WIDTH, BORDER_RADIUS_SM, Fonts, makeTextStyle } from '../theme.ts';

// ── Perspective pitch corners (must match the SVG background) ────────────────
// These define the trapezoid of the playing field in screen pixels.
// Top = far side (narrower), Bottom = near side (wider).
const PITCH_TL = { x: 190, y: 85 };   // top-left
const PITCH_TR = { x: 770, y: 85 };   // top-right
const PITCH_BL = { x: 30,  y: 555 };  // bottom-left
const PITCH_BR = { x: 930, y: 555 };  // bottom-right

const COLOR_HOME       = 0x3a86ff;
const COLOR_AWAY       = Colors.actionRed;
const COLOR_BALL       = 0xffffff;
const COLOR_GOAL_FLASH = Colors.gold;

// ── Perspective coordinate mapping ───────────────────────────────────────────

function perspectiveMap(nx: number, ny: number): { x: number; y: number } {
  const topX = PITCH_TL.x + (PITCH_TR.x - PITCH_TL.x) * nx;
  const topY = PITCH_TL.y + (PITCH_TR.y - PITCH_TL.y) * nx;
  const botX = PITCH_BL.x + (PITCH_BR.x - PITCH_BL.x) * nx;
  const botY = PITCH_BL.y + (PITCH_BR.y - PITCH_BL.y) * nx;
  return {
    x: topX + (botX - topX) * ny,
    y: topY + (botY - topY) * ny,
  };
}

function depthScale(ny: number): number {
  return 0.55 + 0.45 * ny;
}

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

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

// ── Player movement tuning per position ──────────────────────────────────────

interface MoveFactor { followX: number; pushX: number; followY: number }

const ATK: Record<Position, MoveFactor> = {
  GK:  { followX: 0.04, pushX: 0.02, followY: 0.05 },
  DEF: { followX: 0.12, pushX: 0.06, followY: 0.10 },
  MID: { followX: 0.20, pushX: 0.08, followY: 0.16 },
  FWD: { followX: 0.28, pushX: 0.10, followY: 0.20 },
};

const DEF_F: Record<Position, MoveFactor> = {
  GK:  { followX: 0.03, pushX: 0.01, followY: 0.04 },
  DEF: { followX: 0.08, pushX: 0.04, followY: 0.08 },
  MID: { followX: 0.14, pushX: 0.05, followY: 0.12 },
  FWD: { followX: 0.10, pushX: 0.03, followY: 0.10 },
};

// ── Player tracking ──────────────────────────────────────────────────────────

interface PlayerInfo {
  id: string;
  baseX: number;
  baseY: number;
  position: Position;
  isHome: boolean;
  curX: number;
  curY: number;
  sprite: Container;
  shadow: Graphics;
  body: Graphics;
}

// ── Drawing helpers for player & ball sprites ────────────────────────────────

function drawPlayerSprite(color: number, name: string): { sprite: Container; shadow: Graphics; body: Graphics } {
  const sprite = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0, 14, 10, 4);
  shadow.fill({ color: 0x000000, alpha: 0.35 });
  sprite.addChild(shadow);

  const body = new Graphics();
  // Legs
  body.rect(-4, 6, 3, 8);
  body.fill({ color: 0x222244 });
  body.rect(1, 6, 3, 8);
  body.fill({ color: 0x222244 });
  // Jersey body
  body.roundRect(-7, -6, 14, 14, 3);
  body.fill({ color });
  body.roundRect(-7, -6, 14, 14, 3);
  body.stroke({ color: 0xffffff, width: 1.2 });
  // Head
  body.circle(0, -12, 6);
  body.fill({ color: 0xf5d0a9 });
  body.circle(0, -12, 6);
  body.stroke({ color: 0xd4a574, width: 1 });
  // Hair
  body.arc(0, -14, 5, Math.PI, 0);
  body.fill({ color: 0x2a1a0a });
  sprite.addChild(body);

  const label = new Text({
    text: name.slice(0, 2),
    style: makeTextStyle({ fontSize: 9, fontWeight: 'bold' }),
  });
  label.anchor.set(0.5, 0);
  label.position.set(0, 16);
  sprite.addChild(label);

  return { sprite, shadow, body };
}

function drawBallSprite(): Graphics {
  const g = new Graphics();
  // Shadow
  g.ellipse(0, 6, 6, 2.5);
  g.fill({ color: 0x000000, alpha: 0.3 });
  // Ball body
  g.circle(0, 0, 6);
  g.fill({ color: 0xffffff });
  g.circle(0, 0, 6);
  g.stroke({ color: 0x333333, width: 1.5 });
  // Pentagon pattern
  g.circle(0, 0, 2.5);
  g.fill({ color: 0x333333 });
  g.circle(-4, -2, 1.2);
  g.fill({ color: 0x333333 });
  g.circle(4, -2, 1.2);
  g.fill({ color: 0x333333 });
  g.circle(-3, 3, 1.2);
  g.fill({ color: 0x333333 });
  g.circle(3, 3, 1.2);
  g.fill({ color: 0x333333 });
  return g;
}

// ── MatchScene ───────────────────────────────────────────────────────────────

export interface MatchSceneData {
  result: MatchResult;
  homeTeam?: Team;
  awayTeam?: Team;
}

export class MatchScene implements IScene {
  readonly name = 'match';
  readonly container = new Container();

  private bgSprite: Sprite | null = null;
  private assetManager: AssetManager | null;
  private scoreText: Text;
  private minuteText: Text;
  private eventText: Text;
  private eventBg: Graphics;

  private entityLayer: Container;
  private players: PlayerInfo[] = [];
  private ballSprite: Graphics;
  private goalFlash: Graphics;
  private goalLabel: Text;

  private timeline: AnimationStep[] = [];
  private stepIndex = 0;
  private elapsed = 0;
  private playing = false;
  private result: MatchResult | null = null;
  private homeScore = 0;
  private awayScore = 0;
  private homePlayerIds = new Set<string>();
  private onMatchEnd: (result: MatchResult) => void;

  private goalFlashTimer = 0;
  private readonly GOAL_FLASH_DURATION = 1200;

  private readonly W: number;
  private readonly H: number;

  private skipBtn: Container;

  private tipContainer: Container;
  private tipBg: Graphics;
  private tipIconText: Text;
  private tipLabelText: Text;
  private tipRateBar: Graphics;
  private tipRateText: Text;
  private tipSkillNameText: Text;
  private tipAlpha = 0;
  private tipFadeTarget = 0;

  private ballNormX = 0.5;
  private ballNormY = 0.5;
  private possession: 'home' | 'away' | null = null;
  private carrierId: string | null = null;

  constructor(opts: {
    width: number;
    height: number;
    onMatchEnd: (r: MatchResult) => void;
    assetManager?: AssetManager;
  }) {
    this.W = opts.width;
    this.H = opts.height;
    this.onMatchEnd = opts.onMatchEnd;
    this.assetManager = opts.assetManager ?? null;

    // Background: loaded async on first enter, fallback to solid color
    const bgPanel = new Graphics();
    bgPanel.rect(0, 0, opts.width, opts.height);
    bgPanel.fill({ color: 0x0f3460 });
    this.container.addChild(bgPanel);

    // Entity layer for players & ball (sits on top of background)
    this.entityLayer = new Container();
    this.entityLayer.sortableChildren = true;
    this.container.addChild(this.entityLayer);

    // Goal flash overlay
    this.goalFlash = new Graphics();
    this.goalFlash.rect(0, 0, opts.width, opts.height);
    this.goalFlash.fill({ color: COLOR_GOAL_FLASH });
    this.goalFlash.alpha = 0;
    this.container.addChild(this.goalFlash);

    this.goalLabel = new Text({
      text: '⚽ 进球！',
      style: new TextStyle({
        fontFamily: Fonts.primary,
        fontSize: 52,
        fontWeight: 'bold',
        fill: Colors.gold,
        stroke: { color: 0x222222, width: 6 },
        dropShadow: { color: Colors.black, blur: 8, distance: 4, angle: Math.PI / 4 },
      }),
    });
    this.goalLabel.anchor.set(0.5);
    this.goalLabel.position.set(opts.width / 2, opts.height / 2 - 30);
    this.goalLabel.alpha = 0;
    this.container.addChild(this.goalLabel);

    // HUD: score bar
    const scoreBg = new Graphics();
    scoreBg.roundRect(opts.width / 2 - 180, 6, 360, 44, 10);
    scoreBg.fill({ color: 0x0a1628, alpha: 0.88 });
    scoreBg.roundRect(opts.width / 2 - 180, 6, 360, 44, 10);
    scoreBg.stroke({ color: Colors.divider, width: 1.5, alpha: 0.5 });
    this.container.addChild(scoreBg);

    this.scoreText = new Text({
      text: '0 : 0',
      style: makeTextStyle({ fontSize: 24, fontWeight: 'bold' }),
    });
    this.scoreText.anchor.set(0.5);
    this.scoreText.position.set(opts.width / 2, 22);
    this.container.addChild(this.scoreText);

    this.minuteText = new Text({
      text: '',
      style: makeTextStyle({ fontSize: 12, fill: Colors.textSecondary }),
    });
    this.minuteText.anchor.set(0.5);
    this.minuteText.position.set(opts.width / 2, 40);
    this.container.addChild(this.minuteText);

    // HUD: event text at bottom
    this.eventBg = new Graphics();
    this.eventBg.roundRect(opts.width / 2 - 300, opts.height - 54, 600, 44, BORDER_RADIUS_SM);
    this.eventBg.fill({ color: 0x0a1628, alpha: 0.85 });
    this.eventBg.roundRect(opts.width / 2 - 300, opts.height - 54, 600, 44, BORDER_RADIUS_SM);
    this.eventBg.stroke({ color: Colors.divider, width: OUTLINE_WIDTH, alpha: 0.3 });
    this.container.addChild(this.eventBg);

    this.eventText = new Text({
      text: '比赛即将开始...',
      style: makeTextStyle({ fontSize: 16, align: 'center', wordWrap: true, wordWrapWidth: 560 }),
    });
    this.eventText.anchor.set(0.5, 0.5);
    this.eventText.position.set(opts.width / 2, opts.height - 32);
    this.container.addChild(this.eventText);

    // Ball sprite
    this.ballSprite = drawBallSprite();
    this.entityLayer.addChild(this.ballSprite);

    // Skip button
    this.skipBtn = this.buildSkipButton();
    this.container.addChild(this.skipBtn);

    // Tip overlay
    this.tipContainer = new Container();
    this.tipContainer.alpha = 0;

    this.tipBg = new Graphics();
    this.tipContainer.addChild(this.tipBg);

    this.tipIconText = new Text({
      text: '',
      style: new TextStyle({ fontFamily: Fonts.primary, fontSize: 22 }),
    });
    this.tipIconText.position.set(10, 8);
    this.tipContainer.addChild(this.tipIconText);

    this.tipLabelText = new Text({
      text: '',
      style: makeTextStyle({ fontSize: 13, fontWeight: 'bold', fill: 0xdde3ed }),
    });
    this.tipLabelText.position.set(38, 10);
    this.tipContainer.addChild(this.tipLabelText);

    this.tipRateBar = new Graphics();
    this.tipRateBar.position.set(10, 36);
    this.tipContainer.addChild(this.tipRateBar);

    this.tipRateText = new Text({
      text: '',
      style: makeTextStyle({ fontSize: 13, fontWeight: 'bold' }),
    });
    this.tipRateText.position.set(10, 56);
    this.tipContainer.addChild(this.tipRateText);

    this.tipSkillNameText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: Fonts.primary,
        fontSize: 15,
        fontWeight: 'bold',
        fill: 0xffe680,
        dropShadow: { color: Colors.black, blur: 3, distance: 1, angle: Math.PI / 4 },
      }),
    });
    this.tipSkillNameText.anchor.set(0.5, 0);
    this.tipContainer.addChild(this.tipSkillNameText);

    this.container.addChild(this.tipContainer);

    this.loadBackground();
  }

  // ── Background loading ─────────────────────────────────────────────────────

  private async loadBackground(): Promise<void> {
    try {
      const inlineAssets: Record<string, string> | undefined =
        (globalThis as any).__INLINE_ASSETS__;
      const src = inlineAssets?.['assets/match/match_stadium_bg.svg']
        ?? 'assets/match/match_stadium_bg.svg';
      const tex = await Assets.load<Texture>(src);
      if (tex && tex !== Texture.EMPTY) {
        this.bgSprite = new Sprite(tex);
        this.bgSprite.width = this.W;
        this.bgSprite.height = this.H;
        this.container.addChildAt(this.bgSprite, 1);
        return;
      }
    } catch {
      // SVG unavailable — draw programmatic pitch below
    }
    this.drawFallbackPitch();
  }

  private drawFallbackPitch(): void {
    const g = new Graphics();

    g.rect(0, 0, this.W, this.H);
    g.fill({ color: 0x0a1628 });

    const tl = PITCH_TL, tr = PITCH_TR, bl = PITCH_BL, br = PITCH_BR;

    g.moveTo(tl.x, tl.y);
    g.lineTo(tr.x, tr.y);
    g.lineTo(br.x, br.y);
    g.lineTo(bl.x, bl.y);
    g.closePath();
    g.fill({ color: 0x1e6b35 });

    g.moveTo(tl.x, tl.y);
    g.lineTo(tr.x, tr.y);
    g.lineTo(br.x, br.y);
    g.lineTo(bl.x, bl.y);
    g.closePath();
    g.stroke({ color: 0xffffff, width: 2, alpha: 0.7 });

    const midTop = perspectiveMap(0.5, 0);
    const midBot = perspectiveMap(0.5, 1);
    g.moveTo(midTop.x, midTop.y);
    g.lineTo(midBot.x, midBot.y);
    g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 });

    const cc = perspectiveMap(0.5, 0.5);
    const r = (br.x - bl.x) * 0.06;
    g.circle(cc.x, cc.y, r);
    g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 });
    g.circle(cc.x, cc.y, 3);
    g.fill({ color: 0xffffff, alpha: 0.6 });

    this.container.addChildAt(g, 1);
  }

  // ── Skip button ────────────────────────────────────────────────────────────

  private buildSkipButton(): Container {
    const btn = new Container();
    const BW = 90, BH = 32;
    const bx = this.W - BW - 14;
    const by = this.H - BH - 60;

    const bg = new Graphics();
    bg.roundRect(0, 0, BW, BH, BORDER_RADIUS_SM);
    bg.fill({ color: 0x0a1628, alpha: 0.88 });
    bg.roundRect(0, 0, BW, BH, BORDER_RADIUS_SM);
    bg.stroke({ color: 0x4a9eff, width: 1.5 });
    btn.addChild(bg);

    const label = new Text({
      text: '跳过 ›',
      style: makeTextStyle({ fontSize: 15, fontWeight: 'bold', fill: 0x7ec8ff }),
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

  // ── Scene lifecycle ────────────────────────────────────────────────────────

  onEnter(data?: unknown): void {
    const d = data as MatchSceneData | undefined;
    if (!d?.result) {
      this.playing = false;
      this.result = null;
      return;
    }

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
    this.tipContainer.alpha = 0;
    this.tipAlpha = 0;
    this.tipFadeTarget = 0;

    const animator = new MatchAnimator();
    this.timeline = animator.buildTimeline(d.result.events, d.homeTeam, d.awayTeam);
    this.stepIndex = 0;
    this.elapsed = 0;
    this.playing = true;

    this.ballNormX = 0.5;
    this.ballNormY = 0.5;
    this.possession = null;
    this.carrierId = null;

    // Clear old player sprites
    for (const p of this.players) {
      this.entityLayer.removeChild(p.sprite);
    }
    this.players = [];

    if (d.homeTeam) this.spawnTeam(d.homeTeam, COLOR_HOME, false);
    if (d.awayTeam) this.spawnTeam(d.awayTeam, COLOR_AWAY, true);

    const bp = perspectiveMap(0.5, 0.5);
    this.ballSprite.position.set(bp.x, bp.y);
    this.ballSprite.zIndex = 1000;

    // Ensure ball is on top
    this.entityLayer.removeChild(this.ballSprite);
    this.entityLayer.addChild(this.ballSprite);
  }

  onExit(): void {
    this.playing = false;
  }

  // ── Main update loop ───────────────────────────────────────────────────────

  update(dt: number): void {
    if (!this.playing || !this.result) return;

    const dtMs = dt * 16.67;

    // Goal flash
    if (this.goalFlashTimer > 0) {
      this.goalFlashTimer -= dtMs;
      const progress = 1 - Math.max(0, this.goalFlashTimer / this.GOAL_FLASH_DURATION);
      this.goalFlash.alpha = Math.max(0, 0.55 * (1 - progress * 2));
      this.goalLabel.alpha = Math.max(0, 1 - progress * 1.6);
    }

    this.updateTipFade(dtMs);

    if (this.stepIndex >= this.timeline.length) {
      this.playing = false;
      this.onMatchEnd(this.result);
      return;
    }

    const step = this.timeline[this.stepIndex];
    this.elapsed += dtMs;

    const t = Math.min(1, this.elapsed / step.durationMs);

    // Ball position
    const ballNorm = lerpKeyframes(step.ballKeyframes, t);
    this.ballNormX = ballNorm.x;
    this.ballNormY = ballNorm.y;
    const ballPx = perspectiveMap(ballNorm.x, ballNorm.y);
    const bScale = depthScale(ballNorm.y);
    this.ballSprite.position.set(ballPx.x, ballPx.y);
    this.ballSprite.scale.set(bScale);
    this.ballSprite.zIndex = Math.round(ballPx.y * 10);

    // Possession & carrier from current step
    this.possession = step.possession;
    this.carrierId = step.carrierId;

    // Move players dynamically
    this.updatePlayerPositions(dt);

    // Highlight active players
    this.updatePlayerHighlights(step.highlightPlayers);

    // Tip fade-out near end of step
    if (step.tip && t > 0.75) {
      this.tipFadeTarget = 0;
    }

    // Step complete
    if (this.elapsed >= step.durationMs) {
      this.elapsed = 0;
      this.eventText.text = step.description;

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

  // ── Player spawning ────────────────────────────────────────────────────────

  private spawnTeam(team: Team, color: number, mirror: boolean): void {
    for (const slot of team.formation) {
      const bx = mirror ? 1 - slot.x : slot.x;
      const by = slot.y;
      const px = perspectiveMap(bx, by);
      const scale = depthScale(by);

      const { sprite, shadow, body } = drawPlayerSprite(color, slot.card.name);
      sprite.position.set(px.x, px.y);
      sprite.scale.set(scale);
      sprite.zIndex = Math.round(px.y * 10);

      this.entityLayer.addChild(sprite);

      this.players.push({
        id: slot.card.id,
        baseX: bx,
        baseY: by,
        position: slot.card.position,
        isHome: !mirror,
        curX: bx,
        curY: by,
        sprite,
        shadow,
        body,
      });
    }
  }

  // ── Dynamic player positioning ─────────────────────────────────────────────

  private updatePlayerPositions(dt: number): void {
    const lerpT = Math.min(1, dt * 0.06);

    for (const p of this.players) {
      const target = this.calcTarget(p);
      p.curX += (target.x - p.curX) * lerpT;
      p.curY += (target.y - p.curY) * lerpT;

      const px = perspectiveMap(p.curX, p.curY);
      const scale = depthScale(p.curY);
      const highlighted = p.sprite.alpha >= 0.95;

      p.sprite.position.set(px.x, px.y);
      p.sprite.scale.set(highlighted ? scale * 1.2 : scale);
      p.sprite.zIndex = Math.round(px.y * 10);
    }
  }

  private calcTarget(p: PlayerInfo): { x: number; y: number } {
    const bx = this.ballNormX;
    const by = this.ballNormY;

    if (this.carrierId === p.id) {
      return {
        x: clamp(p.baseX + (bx - p.baseX) * 0.88, 0.03, 0.97),
        y: clamp(p.baseY + (by - p.baseY) * 0.82, 0.05, 0.95),
      };
    }

    if (!this.possession) {
      return { x: p.baseX, y: p.baseY };
    }

    const attacking =
      (p.isHome && this.possession === 'home') ||
      (!p.isHome && this.possession === 'away');

    const dir = p.isHome ? 1 : -1;
    const f = attacking ? ATK[p.position] : DEF_F[p.position];

    const pushDir = attacking ? dir : -dir;
    const tx = p.baseX
      + (bx - p.baseX) * f.followX
      + f.pushX * pushDir;
    const ty = p.baseY
      + (by - p.baseY) * f.followY;

    return {
      x: clamp(tx, 0.03, 0.97),
      y: clamp(ty, 0.05, 0.95),
    };
  }

  // ── Visual helpers ─────────────────────────────────────────────────────────

  private updatePlayerHighlights(ids: string[]): void {
    for (const p of this.players) {
      const highlighted = ids.includes(p.id);
      p.sprite.alpha = highlighted ? 1 : 0.75;
    }
  }

  private updateScoreText(): void {
    if (!this.result) return;
    this.scoreText.text = `${this.result.homeName}  ${this.homeScore} : ${this.awayScore}  ${this.result.awayName}`;
  }

  private triggerGoalEffect(scorerId: string, description: string): void {
    if (this.homePlayerIds.size > 0) {
      if (this.homePlayerIds.has(scorerId)) this.homeScore++;
      else this.awayScore++;
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

  private skipToEnd(): void {
    if (!this.result) return;
    this.playing = false;
    this.tipFadeTarget = 0;
    this.tipContainer.alpha = 0;
    this.onMatchEnd(this.result);
  }

  // ── Tip overlay ────────────────────────────────────────────────────────────

  private showTipForStep(step: AnimationStep): void {
    const tip = step.tip;
    if (!tip) return;

    this.tipFadeTarget = 1;

    const startKf = step.ballKeyframes[0] ?? { x: 0.5, y: 0.5 };
    const ballPx = perspectiveMap(startKf.x, startKf.y);

    const TIP_W = tip.type === 'skill' ? 168 : 158;
    const TIP_H = tip.type === 'skill' ? 72 : 80;

    let tx = ballPx.x + 18;
    let ty = ballPx.y - TIP_H - 14;
    tx = Math.max(8, Math.min(this.W - TIP_W - 8, tx));
    ty = Math.max(56, Math.min(this.H - TIP_H - 8, ty));

    this.tipContainer.position.set(tx, ty);
    this.buildTipContent(tip, TIP_W, TIP_H);
  }

  private buildTipContent(tip: TipData, w: number, h: number): void {
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

    this.tipIconText.text = tip.icon;
    this.tipIconText.visible = true;
    this.tipLabelText.text = tip.label;
    this.tipLabelText.visible = true;

    if (tip.type === 'rate' && tip.rate !== undefined) {
      const barW = w - 20;
      const rate = tip.rate;
      const barColor = rate >= 0.55 ? 0x44cc88 : rate >= 0.35 ? 0xf0b040 : 0xff5555;

      this.tipRateBar.clear();
      this.tipRateBar.roundRect(0, 0, barW, 10, 5);
      this.tipRateBar.fill({ color: 0x334466 });
      this.tipRateBar.roundRect(0, 0, Math.max(4, barW * rate), 10, 5);
      this.tipRateBar.fill({ color: barColor });
      this.tipRateBar.visible = true;

      this.tipRateText.text = `${Math.round(rate * 100)}%`;
      this.tipRateText.style.fill = barColor;
      this.tipRateText.visible = true;
      this.tipRateText.position.set(w - 42, 56);

      this.tipSkillNameText.visible = false;
    } else if (tip.type === 'skill') {
      this.tipSkillNameText.text = tip.label;
      this.tipSkillNameText.position.set(w / 2, 34);
      this.tipSkillNameText.visible = true;

      this.tipRateBar.clear();
      this.tipRateBar.visible = false;
      this.tipRateText.visible = false;
    }
  }

  private updateTipFade(dtMs: number): void {
    const FADE_SPEED = 0.006;
    if (this.tipFadeTarget > this.tipAlpha) {
      this.tipAlpha = Math.min(this.tipFadeTarget, this.tipAlpha + dtMs * FADE_SPEED);
    } else if (this.tipFadeTarget < this.tipAlpha) {
      this.tipAlpha = Math.max(this.tipFadeTarget, this.tipAlpha - dtMs * FADE_SPEED);
    }
    this.tipContainer.alpha = this.tipAlpha;
  }
}
