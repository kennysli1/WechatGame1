import { Container, Text, TextStyle } from 'pixi.js';
import type { IScene } from '../SceneManager.ts';
import { PitchView } from '../components/PitchView.ts';
import { Panel } from '../components/Panel.ts';
import { MatchAnimator, type AnimationStep } from '../animations/MatchAnimator.ts';
import type { MatchResult } from '../../core/models/MatchResult.ts';

export class MatchScene implements IScene {
  readonly name = 'match';
  readonly container = new Container();

  private pitch: PitchView;
  private scoreText: Text;
  private eventText: Text;
  private timeline: AnimationStep[] = [];
  private stepIndex = 0;
  private elapsed = 0;
  private playing = false;
  private result: MatchResult | null = null;
  private onMatchEnd: (result: MatchResult) => void;

  constructor(opts: { width: number; height: number; onMatchEnd: (r: MatchResult) => void }) {
    this.onMatchEnd = opts.onMatchEnd;

    const panel = new Panel({ width: opts.width, height: opts.height, color: 0x0f3460 });
    this.container.addChild(panel);

    this.pitch = new PitchView();
    this.pitch.position.set((opts.width - this.pitch.pitchWidth) / 2, 60);
    this.container.addChild(this.pitch);

    this.scoreText = new Text({
      text: '0 : 0',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 32,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    });
    this.scoreText.anchor.set(0.5);
    this.scoreText.position.set(opts.width / 2, 30);
    this.container.addChild(this.scoreText);

    this.eventText = new Text({
      text: '',
      style: new TextStyle({
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: 18,
        fill: 0xf0f0f0,
        wordWrap: true,
        wordWrapWidth: opts.width - 40,
        align: 'center',
      }),
    });
    this.eventText.anchor.set(0.5, 0);
    this.eventText.position.set(opts.width / 2, this.pitch.pitchHeight + 80);
    this.container.addChild(this.eventText);
  }

  onEnter(data?: unknown): void {
    const d = data as { result: MatchResult } | undefined;
    if (!d?.result) return;

    this.result = d.result;
    this.scoreText.text = `${d.result.homeName} 0 : 0 ${d.result.awayName}`;
    this.eventText.text = '比赛即将开始...';

    const animator = new MatchAnimator();
    this.timeline = animator.buildTimeline(d.result.events);
    this.stepIndex = 0;
    this.elapsed = 0;
    this.playing = true;
  }

  onExit(): void {
    this.playing = false;
  }

  update(dt: number): void {
    if (!this.playing || !this.result) return;
    if (this.stepIndex >= this.timeline.length) {
      this.playing = false;
      this.onMatchEnd(this.result);
      return;
    }

    const step = this.timeline[this.stepIndex];
    this.elapsed += dt * 16.67;

    if (this.elapsed >= step.durationMs) {
      this.elapsed = 0;
      this.eventText.text = step.description;

      if (step.event.type === 'goal' || step.event.type === 'fulltime') {
        const e = step.event;
        if (e.type === 'fulltime') {
          this.scoreText.text =
            `${this.result.homeName} ${e.homeGoals} : ${e.awayGoals} ${this.result.awayName}`;
        }
      }

      this.stepIndex++;
    }
  }
}
