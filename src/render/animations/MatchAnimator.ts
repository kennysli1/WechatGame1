import type { MatchEvent } from '../../core/models/MatchEvent.ts';

export interface AnimationStep {
  event: MatchEvent;
  durationMs: number;
  description: string;
}

export class MatchAnimator {
  buildTimeline(events: MatchEvent[]): AnimationStep[] {
    return events.map((event) => {
      switch (event.type) {
        case 'kickoff':
          return { event, durationMs: 1000, description: `开球！第 ${event.minute} 分钟` };
        case 'pass':
          return {
            event,
            durationMs: 800,
            description: event.success
              ? `${event.from} 传球给 ${event.to}`
              : `${event.from} 传球失误`,
          };
        case 'shot':
          return {
            event,
            durationMs: 1200,
            description: event.onTarget
              ? `${event.player} 射门！球飞向球门`
              : `${event.player} 射门偏出`,
          };
        case 'save':
          return {
            event,
            durationMs: 1000,
            description: `${event.goalkeeper} 精彩扑救！`,
          };
        case 'goal':
          return {
            event,
            durationMs: 2000,
            description: event.assist
              ? `⚽ 进球！${event.scorer}（助攻：${event.assist}）`
              : `⚽ 进球！${event.scorer}`,
          };
        case 'tackle':
          return {
            event,
            durationMs: 800,
            description: event.success
              ? `${event.tackler} 成功铲断 ${event.target}`
              : `${event.tackler} 铲球失败`,
          };
        case 'skill':
          return {
            event,
            durationMs: 1500,
            description: `${event.player} 发动技能 ${event.skillId}`,
          };
        case 'halftime':
          return { event, durationMs: 2000, description: '—— 中场休息 ——' };
        case 'fulltime':
          return {
            event,
            durationMs: 2000,
            description: `全场结束 ${event.homeGoals} : ${event.awayGoals}`,
          };
      }
    });
  }
}
