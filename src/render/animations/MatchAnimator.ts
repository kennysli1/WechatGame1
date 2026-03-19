import type { MatchEvent } from '../../core/models/MatchEvent.ts';
import type { Team } from '../../core/models/Team.ts';

// ---------------------------------------------------------------------------
// 位置插值关键帧（归一化坐标 0-1，对应球场宽高）
// ---------------------------------------------------------------------------
export interface Keyframe {
  t: number;   // 0-1，相对于本步骤的时间进度
  x: number;   // 归一化 x（0=左侧，1=右侧）
  y: number;   // 归一化 y（0=顶部，1=底部）
}

// ---------------------------------------------------------------------------
// 弹出提示数据
// ---------------------------------------------------------------------------
export interface TipData {
  /** 'rate' = 成功率条形弹窗；'skill' = 技能 ICON 弹窗 */
  type: 'rate' | 'skill';
  /** 主标签，如"传球成功率"或技能名 */
  label: string;
  /** 成功率 0-1（仅 'rate' 类型） */
  rate?: number;
  /** 技能 ID（仅 'skill' 类型，用于查找图标） */
  skillId?: string;
  /** 前置 emoji 图标 */
  icon: string;
  /** 结果是否"成功"（影响颜色） */
  success?: boolean;
}

export interface AnimationStep {
  event: MatchEvent;
  durationMs: number;
  description: string;
  /** 球的运动关键帧 */
  ballKeyframes: Keyframe[];
  /** 需要高亮的球员 id 列表（最多 2 个） */
  highlightPlayers: string[];
  /** 是否触发进球特效 */
  isGoal: boolean;
  /** 步骤开始时弹出的提示（成功率 / 技能）*/
  tip?: TipData;
}

// ---------------------------------------------------------------------------
// 确定性伪随机比率（基于 minute 哈希，保证回放稳定）
// ---------------------------------------------------------------------------
function pseudoRate(base: number, variance: number, minute: number): number {
  const v = ((minute * 7 + 13) % 17) / 17;
  return Math.max(0.10, Math.min(0.95, base + (v - 0.5) * variance));
}

/** 将 snake_case 的 skillId 转换为可读的中英文展示名 */
function formatSkillId(skillId: string): string {
  return skillId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// 辅助：获取球员在球场上的归一化位置
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
      // 客队位置需要镜像（x 翻转）
      return { x: 1 - slot.x, y: slot.y };
    }
  }
  return null;
}

function centerPos(): { x: number; y: number } {
  return { x: 0.5, y: 0.5 };
}

function goalPos(side: 'left' | 'right'): { x: number; y: number } {
  return { x: side === 'left' ? 0.02 : 0.98, y: 0.5 };
}

// ---------------------------------------------------------------------------
// MatchAnimator
// ---------------------------------------------------------------------------
export class MatchAnimator {
  /**
   * 将 MatchEvent[] 转为带位置动画数据的 AnimationStep[]。
   * home/away 用于查找球员位置；可不传（降级为默认中场位置）。
   */
  buildTimeline(events: MatchEvent[], home?: Team, away?: Team): AnimationStep[] {
    const steps: AnimationStep[] = [];
    const dummyHome: Team = home ?? { name: '', formation: [] };
    const dummyAway: Team = away ?? { name: '', formation: [] };

    for (const event of events) {
      steps.push(this.buildStep(event, dummyHome, dummyAway));
    }
    return steps;
  }

  private buildStep(event: MatchEvent, home: Team, away: Team): AnimationStep {
    switch (event.type) {
      case 'kickoff': {
        return {
          event,
          durationMs: 1200,
          description: `⚽ 开球！第 ${event.minute} 分钟`,
          ballKeyframes: [
            { t: 0, ...centerPos() },
            { t: 1, ...centerPos() },
          ],
          highlightPlayers: [],
          isGoal: false,
        };
      }

      case 'pass': {
        const from = getPlayerPos(event.from, home, away) ?? centerPos();
        const to   = getPlayerPos(event.to,   home, away) ?? centerPos();
        return {
          event,
          durationMs: event.success ? 800 : 900,
          description: event.success
            ? `${event.from} 传球给 ${event.to}`
            : `${event.from} 传球失误`,
          ballKeyframes: event.success
            ? [
                { t: 0, x: from.x, y: from.y },
                { t: 1, x: to.x,   y: to.y   },
              ]
            : [
                { t: 0, x: from.x, y: from.y },
                { t: 0.5, x: (from.x + to.x) / 2 + 0.08, y: (from.y + to.y) / 2 },
                { t: 1,   x: (from.x + to.x) / 2 + 0.15, y: to.y + 0.1 },
              ],
          highlightPlayers: [event.from, event.to],
          isGoal: false,
          tip: {
            type: 'rate',
            label: '传球成功率',
            rate: pseudoRate(event.success ? 0.72 : 0.30, 0.18, event.minute),
            icon: event.success ? '✅' : '❌',
            success: event.success,
          },
        };
      }

      case 'shot': {
        const shooter = getPlayerPos(event.player, home, away) ?? centerPos();
        // 射门方向：判断球员在哪一侧 → 射向对面球门
        const targetGoal = goalPos(shooter.x < 0.5 ? 'right' : 'left');
        return {
          event,
          durationMs: event.onTarget ? 1000 : 1100,
          description: event.onTarget
            ? `${event.player} 射门！球飞向球门`
            : `${event.player} 射门偏出`,
          ballKeyframes: event.onTarget
            ? [
                { t: 0, x: shooter.x, y: shooter.y },
                { t: 0.4, x: (shooter.x + targetGoal.x) * 0.5, y: shooter.y - 0.05 },
                { t: 1,   x: targetGoal.x, y: targetGoal.y },
              ]
            : [
                { t: 0, x: shooter.x, y: shooter.y },
                { t: 0.6, x: (shooter.x + targetGoal.x) * 0.55, y: shooter.y + 0.12 },
                { t: 1,   x: targetGoal.x + (targetGoal.x > 0.5 ? 0.05 : -0.05), y: shooter.y + 0.18 },
              ],
          highlightPlayers: [event.player],
          isGoal: false,
          tip: {
            type: 'rate',
            label: '射门命中率',
            rate: pseudoRate(event.onTarget ? 0.48 : 0.22, 0.16, event.minute),
            icon: event.onTarget ? '🎯' : '💨',
            success: event.onTarget,
          },
        };
      }

      case 'save': {
        const gkPos = getPlayerPos(event.goalkeeper, home, away) ?? { x: 0.05, y: 0.5 };
        return {
          event,
          durationMs: 1200,
          description: `🧤 ${event.goalkeeper} 精彩扑救！`,
          ballKeyframes: [
            { t: 0, x: gkPos.x, y: gkPos.y },
            { t: 0.3, x: gkPos.x + (gkPos.x < 0.5 ? -0.02 : 0.02), y: gkPos.y - 0.1 },
            { t: 1, x: gkPos.x + (gkPos.x < 0.5 ? 0.05 : -0.05), y: gkPos.y + 0.05 },
          ],
          highlightPlayers: [event.goalkeeper],
          isGoal: false,
          tip: {
            type: 'rate',
            label: '扑救成功率',
            rate: pseudoRate(0.55, 0.22, 0),
            icon: '🧤',
            success: true,
          },
        };
      }

      case 'goal': {
        const scorerPos = getPlayerPos(event.scorer, home, away) ?? centerPos();
        const targetGoal = goalPos(scorerPos.x < 0.5 ? 'right' : 'left');
        return {
          event,
          durationMs: 2500,
          description: event.assist
            ? `🎉 进球！${event.scorer}（助攻：${event.assist}）`
            : `🎉 进球！${event.scorer}`,
          ballKeyframes: [
            { t: 0,   x: scorerPos.x, y: scorerPos.y },
            { t: 0.3, x: (scorerPos.x + targetGoal.x) * 0.5, y: scorerPos.y - 0.06 },
            { t: 1,   x: targetGoal.x, y: targetGoal.y },
          ],
          highlightPlayers: event.assist
            ? [event.scorer, event.assist]
            : [event.scorer],
          isGoal: true,
        };
      }

      case 'tackle': {
        const tacklerPos = getPlayerPos(event.tackler, home, away) ?? centerPos();
        const targetPos  = getPlayerPos(event.target,  home, away) ?? centerPos();
        return {
          event,
          durationMs: 900,
          description: event.success
            ? `💥 ${event.tackler} 成功铲断 ${event.target}`
            : `${event.tackler} 铲球失败`,
          ballKeyframes: [
            { t: 0,   x: targetPos.x, y: targetPos.y },
            { t: 0.5, x: (tacklerPos.x + targetPos.x) / 2, y: (tacklerPos.y + targetPos.y) / 2 },
            { t: 1,   x: event.success ? tacklerPos.x : targetPos.x + 0.05, y: tacklerPos.y },
          ],
          highlightPlayers: [event.tackler, event.target],
          isGoal: false,
          tip: {
            type: 'rate',
            label: '铲球成功率',
            rate: pseudoRate(event.success ? 0.55 : 0.28, 0.20, event.minute),
            icon: event.success ? '🛡️' : '💢',
            success: event.success,
          },
        };
      }

      case 'skill': {
        const playerPos = getPlayerPos(event.player, home, away) ?? centerPos();
        return {
          event,
          durationMs: 1500,
          description: `✨ ${event.player} 发动技能 ${event.skillId}`,
          ballKeyframes: [
            { t: 0, x: playerPos.x, y: playerPos.y },
            { t: 1, x: playerPos.x, y: playerPos.y },
          ],
          highlightPlayers: [event.player, ...event.targets],
          isGoal: false,
          tip: {
            type: 'skill',
            label: formatSkillId(event.skillId),
            skillId: event.skillId,
            icon: '✨',
            success: true,
          },
        };
      }

      case 'halftime': {
        return {
          event,
          durationMs: 2500,
          description: '—— 中场休息 ——',
          ballKeyframes: [
            { t: 0, ...centerPos() },
            { t: 1, ...centerPos() },
          ],
          highlightPlayers: [],
          isGoal: false,
        };
      }

      case 'fulltime': {
        return {
          event,
          durationMs: 2500,
          description: `全场结束 ${event.homeGoals} : ${event.awayGoals}`,
          ballKeyframes: [
            { t: 0, ...centerPos() },
            { t: 1, ...centerPos() },
          ],
          highlightPlayers: [],
          isGoal: false,
        };
      }
    }
  }
}
