import type { MatchEvent } from '../../core/models/MatchEvent.ts';
import type { Team } from '../../core/models/Team.ts';

export interface Keyframe {
  t: number;
  x: number;
  y: number;
}

export interface TipData {
  type: 'rate' | 'skill';
  icon: string;
  label: string;
  rate?: number;
  success?: boolean;
}

export interface AnimationStep {
  event: MatchEvent;
  durationMs: number;
  description: string;
  ballKeyframes: Keyframe[];
  highlightPlayers: string[];
  isGoal: boolean;
  tip?: TipData;
  possession: 'home' | 'away' | null;
  carrierId: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPlayerPos(
  playerId: string,
  home: Team,
  away: Team,
): { x: number; y: number } | null {
  for (const slot of home.formation) {
    if (slot.card.id === playerId) return { x: slot.x, y: slot.y };
  }
  for (const slot of away.formation) {
    if (slot.card.id === playerId) {
      return { x: 1 - slot.x, y: slot.y };
    }
  }
  return null;
}

function center(): { x: number; y: number } {
  return { x: 0.5, y: 0.5 };
}

function goalPos(side: 'left' | 'right'): { x: number; y: number } {
  return { x: side === 'left' ? 0.02 : 0.98, y: 0.5 };
}

// ---------------------------------------------------------------------------
// MatchAnimator — stateful builder that tracks ball across steps
// ---------------------------------------------------------------------------

export class MatchAnimator {
  private nameMap = new Map<string, string>();

  buildTimeline(events: MatchEvent[], home?: Team, away?: Team): AnimationStep[] {
    const h: Team = home ?? { name: '', formation: [] };
    const a: Team = away ?? { name: '', formation: [] };

    this.nameMap.clear();
    for (const slot of h.formation) this.nameMap.set(slot.card.id, slot.card.name);
    for (const slot of a.formation) this.nameMap.set(slot.card.id, slot.card.name);

    const homeIds = new Set(h.formation.map(s => s.card.id));
    const getPossession = (playerId: string): 'home' | 'away' =>
      homeIds.has(playerId) ? 'home' : 'away';

    const steps: AnimationStep[] = [];
    let lastBall = center();

    for (const event of events) {
      const step = this.buildStep(event, h, a, lastBall, getPossession);
      steps.push(step);
      const endKf = step.ballKeyframes[step.ballKeyframes.length - 1];
      if (endKf) {
        lastBall = { x: endKf.x, y: endKf.y };
      }
    }
    return steps;
  }

  private n(id: string): string {
    return this.nameMap.get(id) ?? id;
  }

  private buildStep(
    event: MatchEvent,
    home: Team,
    away: Team,
    lastBall: { x: number; y: number },
    getPossession: (id: string) => 'home' | 'away',
  ): AnimationStep {
    switch (event.type) {
      case 'kickoff': {
        const bp = event.ballPos ?? center();
        return {
          event,
          durationMs: 1200,
          description: `⚽ 开球！第 ${event.minute} 分钟`,
          ballKeyframes: [
            { t: 0, ...lastBall },
            { t: 1, ...bp },
          ],
          highlightPlayers: [],
          isGoal: false,
          possession: null,
          carrierId: null,
        };
      }

      case 'pass': {
        const from = event.fromPos ?? lastBall;
        const to = event.toPos ?? getPlayerPos(event.to, home, away) ?? center();
        const possession = getPossession(event.from);
        return {
          event,
          durationMs: event.success ? 800 : 900,
          description: event.success
            ? `${this.n(event.from)} 传球给 ${this.n(event.to)}`
            : `${this.n(event.from)} 传球失误`,
          ballKeyframes: event.success
            ? [
                { t: 0, x: from.x, y: from.y },
                { t: 1, x: to.x, y: to.y },
              ]
            : [
                { t: 0, x: from.x, y: from.y },
                { t: 0.6, x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 },
                { t: 1, x: to.x, y: to.y },
              ],
          highlightPlayers: [event.from, event.to],
          isGoal: false,
          possession,
          carrierId: event.from,
        };
      }

      case 'dribble': {
        const { fromPos, toPos } = event;
        const possession = getPossession(event.player);
        return {
          event,
          durationMs: event.success ? 900 : 700,
          description: event.success
            ? `${this.n(event.player)} 带球推进`
            : `${this.n(event.player)} 带球被断`,
          ballKeyframes: event.success
            ? [
                { t: 0, x: fromPos.x, y: fromPos.y },
                { t: 0.4, x: (fromPos.x + toPos.x) / 2, y: (fromPos.y + toPos.y) / 2 - 0.02 },
                { t: 1, x: toPos.x, y: toPos.y },
              ]
            : [
                { t: 0, x: fromPos.x, y: fromPos.y },
                { t: 1, x: fromPos.x, y: fromPos.y },
              ],
          highlightPlayers: [event.player],
          isGoal: false,
          possession,
          carrierId: event.player,
        };
      }

      case 'intercept': {
        const from = event.fromPos ?? lastBall;
        const interceptorPos = event.interceptPos
          ?? getPlayerPos(event.interceptor, home, away)
          ?? center();
        const mid = { x: (from.x + interceptorPos.x) / 2, y: (from.y + interceptorPos.y) / 2 };
        const newPossession = getPossession(event.interceptor);
        return {
          event,
          durationMs: event.success ? 1000 : 600,
          description: event.success
            ? `💥 ${this.n(event.interceptor)} 成功拦截 ${this.n(event.passer)} 的传球`
            : `${this.n(event.interceptor)} 尝试拦截失败`,
          ballKeyframes: event.success
            ? [
                { t: 0, x: from.x, y: from.y },
                { t: 0.5, x: mid.x, y: mid.y },
                { t: 1, x: interceptorPos.x, y: interceptorPos.y },
              ]
            : [
                { t: 0, x: from.x, y: from.y },
                { t: 1, x: from.x, y: from.y },
              ],
          highlightPlayers: event.success
            ? [event.interceptor, event.passer]
            : [event.interceptor],
          isGoal: false,
          possession: event.success ? newPossession : getPossession(event.passer),
          carrierId: event.success ? event.interceptor : event.passer,
        };
      }

      case 'shot': {
        const from = event.fromPos ?? lastBall;
        const target = event.targetPos ?? goalPos(from.x < 0.5 ? 'right' : 'left');
        const possession = getPossession(event.player);
        return {
          event,
          durationMs: event.onTarget ? 1000 : 1100,
          description: event.onTarget
            ? `${this.n(event.player)} 射门！球飞向球门`
            : `${this.n(event.player)} 射门偏出`,
          ballKeyframes: event.onTarget
            ? [
                { t: 0, x: from.x, y: from.y },
                { t: 0.4, x: (from.x + target.x) * 0.5, y: from.y - 0.04 },
                { t: 1, x: target.x, y: target.y },
              ]
            : [
                { t: 0, x: from.x, y: from.y },
                { t: 0.6, x: (from.x + target.x) * 0.55, y: from.y + 0.10 },
                { t: 1, x: target.x + (target.x > 0.5 ? 0.04 : -0.04), y: from.y + 0.15 },
              ],
          highlightPlayers: [event.player],
          isGoal: false,
          possession,
          carrierId: event.player,
          tip: {
            type: 'rate',
            icon: '🎯',
            label: event.onTarget ? '射门命中' : '射门偏出',
            rate: event.onTarget ? 0.7 : 0.3,
            success: event.onTarget,
          },
        };
      }

      case 'block': {
        const from = event.fromPos ?? lastBall;
        const blockerPos = event.blockerPos
          ?? getPlayerPos(event.blocker, home, away)
          ?? center();
        const target = goalPos(from.x < 0.5 ? 'right' : 'left');
        const mid = { x: (from.x + target.x) / 2, y: (from.y + target.y) / 2 };
        const possession = getPossession(event.blocker);
        return {
          event,
          durationMs: 900,
          description: `🛡️ ${this.n(event.blocker)} 封堵了 ${this.n(event.shooter)} 的射门`,
          ballKeyframes: [
            { t: 0, x: from.x, y: from.y },
            { t: 0.4, x: mid.x, y: mid.y - 0.03 },
            { t: 0.6, x: blockerPos.x, y: blockerPos.y },
            { t: 1, x: blockerPos.x + (blockerPos.x < 0.5 ? -0.04 : 0.04), y: blockerPos.y + 0.04 },
          ],
          highlightPlayers: [event.blocker, event.shooter],
          isGoal: false,
          possession,
          carrierId: event.blocker,
        };
      }

      case 'save': {
        const bp = event.ballPos ?? lastBall;
        const gkPos = getPlayerPos(event.goalkeeper, home, away) ?? { x: bp.x, y: 0.5 };
        const possession = getPossession(event.goalkeeper);
        return {
          event,
          durationMs: 1200,
          description: `🧤 ${this.n(event.goalkeeper)} 精彩扑救！`,
          ballKeyframes: [
            { t: 0, x: bp.x, y: bp.y },
            { t: 0.3, x: gkPos.x + (gkPos.x < 0.5 ? -0.02 : 0.02), y: gkPos.y - 0.08 },
            { t: 1, x: gkPos.x + (gkPos.x < 0.5 ? 0.04 : -0.04), y: gkPos.y + 0.03 },
          ],
          highlightPlayers: [event.goalkeeper],
          isGoal: false,
          possession,
          carrierId: event.goalkeeper,
        };
      }

      case 'goal': {
        const from = event.fromPos ?? lastBall;
        const target = event.goalPos ?? goalPos(from.x < 0.5 ? 'right' : 'left');
        const possession = getPossession(event.scorer);
        return {
          event,
          durationMs: 2500,
          description: event.assist
            ? `🎉 进球！${this.n(event.scorer)}（助攻：${this.n(event.assist)}）`
            : `🎉 进球！${this.n(event.scorer)}`,
          ballKeyframes: [
            { t: 0, x: from.x, y: from.y },
            { t: 0.3, x: (from.x + target.x) * 0.5, y: from.y - 0.05 },
            { t: 1, x: target.x, y: target.y },
          ],
          highlightPlayers: event.assist
            ? [event.scorer, event.assist]
            : [event.scorer],
          isGoal: true,
          possession,
          carrierId: event.scorer,
        };
      }

      case 'tackle': {
        const bp = event.ballPos ?? lastBall;
        const tacklerPos = getPlayerPos(event.tackler, home, away) ?? bp;
        const targetPos = getPlayerPos(event.target, home, away) ?? bp;
        return {
          event,
          durationMs: 900,
          description: event.success
            ? `💥 ${this.n(event.tackler)} 成功铲断 ${this.n(event.target)}`
            : `${this.n(event.tackler)} 铲球失败`,
          ballKeyframes: [
            { t: 0, x: bp.x, y: bp.y },
            { t: 0.5, x: (tacklerPos.x + bp.x) / 2, y: (tacklerPos.y + bp.y) / 2 },
            { t: 1, x: event.success ? tacklerPos.x : bp.x + 0.03, y: event.success ? tacklerPos.y : bp.y },
          ],
          highlightPlayers: [event.tackler, event.target],
          isGoal: false,
          possession: event.success ? getPossession(event.tackler) : getPossession(event.target),
          carrierId: event.success ? event.tackler : event.target,
        };
      }

      case 'skill': {
        const bp = event.ballPos ?? lastBall;
        const playerPos = getPlayerPos(event.player, home, away) ?? bp;
        const possession = getPossession(event.player);
        return {
          event,
          durationMs: 1500,
          description: `✨ ${this.n(event.player)} 发动技能 ${event.skillId}`,
          ballKeyframes: [
            { t: 0, x: bp.x, y: bp.y },
            { t: 1, x: bp.x, y: bp.y },
          ],
          highlightPlayers: [event.player, ...event.targets],
          isGoal: false,
          possession,
          carrierId: event.player,
          tip: {
            type: 'skill',
            icon: '✨',
            label: event.skillId,
          },
        };
      }

      case 'halftime': {
        return {
          event,
          durationMs: 2500,
          description: '—— 中场休息 ——',
          ballKeyframes: [
            { t: 0, ...lastBall },
            { t: 1, ...center() },
          ],
          highlightPlayers: [],
          isGoal: false,
          possession: null,
          carrierId: null,
        };
      }

      case 'fulltime': {
        return {
          event,
          durationMs: 2500,
          description: `全场结束 ${event.homeGoals} : ${event.awayGoals}`,
          ballKeyframes: [
            { t: 0, ...lastBall },
            { t: 1, ...center() },
          ],
          highlightPlayers: [],
          isGoal: false,
          possession: null,
          carrierId: null,
        };
      }
    }
  }
}
