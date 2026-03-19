import type { Team, TeamSlot } from '../models/Team.ts';
import type { MatchEvent, Vec2 } from '../models/MatchEvent.ts';
import type { MatchResult } from '../models/MatchResult.ts';
import type { IDataManager } from '../data/IDataManager.ts';
import { SeededRandom } from '../../utils/random.ts';

export interface IMatchEngine {
  simulate(home: Team, away: Team, seed?: number): MatchResult;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface BalanceParams {
  passSuccessBase: number;
  shotPowerWeight: number;
  homeAdvantage: number;
  matchMinutes: number;
  eventsPerMinute: number;
  tackleBaseChance: number;
  dribbleBaseSuccess: number;
  interceptBaseChance: number;
  blockBaseChance: number;
}

interface StatBonus {
  attack: number;
  defense: number;
  speed: number;
  technique: number;
}

const ZERO_BONUS: Readonly<StatBonus> = { attack: 0, defense: 0, speed: 0, technique: 0 };

/**
 * 持球状态：跟踪当前哪支队伍持球、谁是持球人、球的绝对场地坐标。
 * 主队从左向右进攻（x 增大），客队从右向左进攻（x 减小）。
 * 所有 x/y 均为归一化绝对坐标（0-1），主队球门在 x≈0.02，客队球门在 x≈0.98。
 */
interface BallState {
  team: 'home' | 'away';
  carrier: TeamSlot;
  x: number;
  y: number;
  /** 上一次传球者，用于记录助攻 */
  lastPasser?: TeamSlot;
}

type PlayerAction = 'pass' | 'dribble' | 'shoot';

interface ActionResult {
  goalScored: boolean;
  newBall: BallState;
}

/**
 * 接球位置权重：哪个位置的球员更倾向接球
 */
const RECEIVE_WEIGHTS: Record<string, number> = {
  GK: 0.1,
  DEF: 1.0,
  MID: 2.0,
  FWD: 3.0,
};

// ---------------------------------------------------------------------------
// MatchEngine
// ---------------------------------------------------------------------------

export class MatchEngine implements IMatchEngine {
  constructor(private data: IDataManager) {}

  simulate(home: Team, away: Team, seed?: number): MatchResult {
    const rng = new SeededRandom(seed ?? Date.now());
    const events: MatchEvent[] = [];
    let homeGoals = 0;
    let awayGoals = 0;

    const params = this.loadBalanceParams();
    const cooldowns = new Map<string, Map<string, number>>();
    for (const slot of [...home.formation, ...away.formation]) {
      cooldowns.set(slot.card.id, new Map());
    }

    // 开球：主场略占优势
    const firstKickoff: 'home' | 'away' =
      rng.next() < 0.5 + params.homeAdvantage * 0.02 ? 'home' : 'away';
    events.push({ type: 'kickoff', minute: 0 });
    let ball = this.initKickoff(firstKickoff, home, away, rng);

    let minute = 1;
    let halftimeDone = false;

    while (minute <= params.matchMinutes) {
      // 中场休息
      if (!halftimeDone && minute > Math.floor(params.matchMinutes / 2)) {
        events.push({ type: 'halftime' });
        halftimeDone = true;
        // 下半场由另一队开球
        ball = this.initKickoff(firstKickoff === 'home' ? 'away' : 'home', home, away, rng);
      }

      this.tickCooldowns(cooldowns);

      // 部分分钟无事发生（比赛节奏）
      if (rng.next() > params.eventsPerMinute) {
        minute++;
        continue;
      }

      const attackTeam = ball.team === 'home' ? home : away;
      const defendTeam = ball.team === 'home' ? away : home;
      const defSide: 'home' | 'away' = ball.team === 'home' ? 'away' : 'home';

      const result = this.executeAction(
        ball, attackTeam, defendTeam, defSide, params, rng, cooldowns, events, minute,
      );

      if (result.goalScored) {
        if (ball.team === 'home') homeGoals++;
        else awayGoals++;
        // 进球后对方从中圈开球
        ball = this.initKickoff(ball.team === 'home' ? 'away' : 'home', home, away, rng);
      } else {
        ball = result.newBall;
      }

      minute++;
    }

    events.push({ type: 'fulltime', homeGoals, awayGoals });
    const mvpPlayerId = this.findMVP(events, home, away);

    return {
      homeGoals,
      awayGoals,
      mvpPlayerId,
      events,
      homeName: home.name,
      awayName: away.name,
    };
  }

  // ---------------------------------------------------------------------------
  // 开球初始化
  // ---------------------------------------------------------------------------

  /**
   * 开球：球在中圈（0.5, 0.5），由开球队的中场（或前锋）持球。
   * 规则：双方球员都在己方半场，开球队从中圈开球。
   */
  private initKickoff(
    team: 'home' | 'away',
    home: Team,
    away: Team,
    rng: SeededRandom,
  ): BallState {
    const attackTeam = team === 'home' ? home : away;
    // 优先选中场，其次前锋，最后随机
    const mids = attackTeam.formation.filter(s => s.card.position === 'MID');
    const fwds = attackTeam.formation.filter(s => s.card.position === 'FWD');
    const carrier =
      mids.length > 0 ? rng.pick(mids) :
      fwds.length > 0 ? rng.pick(fwds) :
      rng.pick(attackTeam.formation);

    return { team, carrier, x: 0.5, y: 0.5, lastPasser: undefined };
  }

  // ---------------------------------------------------------------------------
  // 行动分发
  // ---------------------------------------------------------------------------

  private executeAction(
    ball: BallState,
    attackTeam: Team,
    defendTeam: Team,
    defSide: 'home' | 'away',
    params: BalanceParams,
    rng: SeededRandom,
    cooldowns: Map<string, Map<string, number>>,
    events: MatchEvent[],
    minute: number,
  ): ActionResult {
    const action = this.chooseAction(ball.carrier, ball, rng);
    switch (action) {
      case 'pass':
        return this.executePass(ball, attackTeam, defendTeam, defSide, params, rng, cooldowns, events, minute);
      case 'dribble':
        return this.executeDribble(ball, defendTeam, defSide, params, rng, cooldowns, events, minute);
      case 'shoot':
        return this.executeShoot(ball, defendTeam, defSide, params, rng, cooldowns, events, minute);
    }
  }

  // ---------------------------------------------------------------------------
  // 行动选择：根据球员位置与球场区域决定行动倾向
  // ---------------------------------------------------------------------------

  /**
   * attackProgress：0 = 本方球门附近，1 = 对方球门附近。
   * 各位置行动权重 [传球, 带球, 射门]：
   *   GK     → 几乎只传球（分球）
   *   DEF    → 本方半场以传球为主，压上后可射门
   *   MID    → 平衡传/带，进入对方禁区附近倾向射门
   *   FWD    → 在射门范围内以射门为主，否则带球推进
   */
  private chooseAction(carrier: TeamSlot, ball: BallState, rng: SeededRandom): PlayerAction {
    const progress = ball.team === 'home' ? ball.x : (1 - ball.x);
    const pos = carrier.card.position;

    let w: [number, number, number];

    switch (pos) {
      case 'GK':
        w = [0.96, 0.03, 0.01];
        break;
      case 'DEF':
        w = progress < 0.40
          ? [0.70, 0.26, 0.04]
          : [0.46, 0.36, 0.18];
        break;
      case 'MID':
        w = progress > 0.62
          ? [0.28, 0.29, 0.43]
          : [0.52, 0.38, 0.10];
        break;
      case 'FWD':
        w = progress > 0.58
          ? [0.14, 0.22, 0.64]
          : [0.35, 0.47, 0.18];
        break;
      default:
        w = [0.50, 0.30, 0.20];
    }

    const roll = rng.next() * (w[0] + w[1] + w[2]);
    if (roll < w[0]) return 'pass';
    if (roll < w[0] + w[1]) return 'dribble';
    return 'shoot';
  }

  // ---------------------------------------------------------------------------
  // 传球
  // ---------------------------------------------------------------------------

  /**
   * 传球流程：
   * 1. 选择接球目标（优先向前传，FWD 权重高）
   * 2. 检查传球路线上是否有防守方球员 → 拦截尝试
   * 3. 如果未被拦截，按技术值计算传球成功率
   * 4. 失败则就近防守方球员获球
   */
  private executePass(
    ball: BallState,
    attackTeam: Team,
    defendTeam: Team,
    defSide: 'home' | 'away',
    params: BalanceParams,
    rng: SeededRandom,
    cooldowns: Map<string, Map<string, number>>,
    events: MatchEvent[],
    minute: number,
  ): ActionResult {
    const carrier = ball.carrier;
    const target = this.selectPassTarget(carrier, attackTeam.formation, ball, rng);
    const targetPos = this.playerFieldPos(target, ball.team);
    const ballPos: Vec2 = { x: ball.x, y: ball.y };

    const passBonus = this.resolveSkills(rng, carrier, 'on_pass', cooldowns, events, minute);

    // 检查传球路线上的拦截者
    const interceptors = this.getInterceptors(ballPos, targetPos, defendTeam.formation, defSide);

    if (interceptors.length > 0 && rng.next() < params.interceptBaseChance) {
      const interceptor = this.pickBestDefender(rng, interceptors);
      const techBonus = this.resolveSkills(rng, interceptor, 'on_tackle', cooldowns, events, minute);
      const defVal = interceptor.card.defense + interceptor.card.technique * 0.3 + techBonus.defense;
      const passQuality = carrier.card.technique + passBonus.technique;
      // 拦截概率：防守值 vs 传球质量，区间 8%~60%
      const interceptChance = Math.max(0.08, Math.min(0.60,
        defVal / (defVal + passQuality + 50) * 1.8,
      ));
      const interceptSuccess = rng.next() < interceptChance;

      events.push({
        type: 'intercept',
        minute,
        interceptor: interceptor.card.id,
        passer: carrier.card.id,
        success: interceptSuccess,
      });

      if (interceptSuccess) {
        events.push({ type: 'pass', minute, from: carrier.card.id, to: target.card.id, success: false });
        const midX = (ballPos.x + targetPos.x) / 2;
        const midY = (ballPos.y + targetPos.y) / 2;
        return {
          goalScored: false,
          newBall: { team: defSide, carrier: interceptor, x: midX, y: midY },
        };
      }
    }

    // 传球成功率：基础值 + 技术加成，主场微加成
    const technique = carrier.card.technique + passBonus.technique;
    const passChance = (params.passSuccessBase + technique * 0.0015) *
      (ball.team === 'home' ? params.homeAdvantage : 1.0);
    const passSuccess = rng.next() < passChance;

    events.push({ type: 'pass', minute, from: carrier.card.id, to: target.card.id, success: passSuccess });

    if (!passSuccess) {
      const midX = ball.x * 0.6 + targetPos.x * 0.4;
      const midY = ball.y * 0.6 + targetPos.y * 0.4;
      const nearest = this.getNearestDefender({ x: midX, y: midY }, defendTeam.formation, defSide);
      return {
        goalScored: false,
        newBall: { team: defSide, carrier: nearest, x: midX, y: midY },
      };
    }

    // 传球成功：接球者持球
    return {
      goalScored: false,
      newBall: {
        team: ball.team,
        carrier: target,
        x: targetPos.x,
        y: targetPos.y,
        lastPasser: carrier,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // 带球
  // ---------------------------------------------------------------------------

  /**
   * 带球流程：
   * 1. 计算目标位置（向对方球门方向推进 0.07~0.16 单位，y 轻微随机）
   * 2. 检查持球人周围 0.22 范围内的防守球员 → 铲断尝试
   * 3. 铲断成功则失去控球；否则推进到新位置
   */
  private executeDribble(
    ball: BallState,
    defendTeam: Team,
    defSide: 'home' | 'away',
    params: BalanceParams,
    rng: SeededRandom,
    cooldowns: Map<string, Map<string, number>>,
    events: MatchEvent[],
    minute: number,
  ): ActionResult {
    const carrier = ball.carrier;
    const isHome = ball.team === 'home';
    const advanceX = 0.07 + rng.next() * 0.09;
    const toPos: Vec2 = {
      x: Math.max(0.03, Math.min(0.97, ball.x + (isHome ? advanceX : -advanceX))),
      y: Math.max(0.05, Math.min(0.95, ball.y + (rng.next() - 0.5) * 0.14)),
    };

    // 附近防守球员（铲断距离阈值 0.22）
    const nearbyTacklers = this.getNearbyDefendersAt(
      { x: ball.x, y: ball.y }, defendTeam.formation, defSide, 0.22,
    );

    let tackled = false;
    let tacklerSlot: TeamSlot | null = null;

    if (nearbyTacklers.length > 0) {
      const bestTackler = this.pickBestDefender(rng, nearbyTacklers);
      const tackleBonus = this.resolveSkills(rng, bestTackler, 'on_tackle', cooldowns, events, minute);
      const dribBonus = this.resolveSkills(rng, carrier, 'on_pass', cooldowns, events, minute);

      const defVal = bestTackler.card.defense + tackleBonus.defense;
      const atkVal = carrier.card.speed + carrier.card.technique * 0.3 + dribBonus.speed;
      // 带球成功率：基础值 + (速度/技术 - 防守) 差值修正
      const dribbleChance = params.dribbleBaseSuccess + (atkVal - defVal) * 0.003;
      const tChance = Math.max(0.10, Math.min(0.70, 1 - dribbleChance));
      tackled = rng.next() < tChance;
      tacklerSlot = bestTackler;

      events.push({
        type: 'tackle',
        minute,
        tackler: bestTackler.card.id,
        target: carrier.card.id,
        success: tackled,
      });
    }

    events.push({
      type: 'dribble',
      minute,
      player: carrier.card.id,
      success: !tackled,
      fromPos: { x: ball.x, y: ball.y },
      toPos: tackled ? { x: ball.x, y: ball.y } : toPos,
    });

    if (tackled && tacklerSlot) {
      return {
        goalScored: false,
        newBall: { team: defSide, carrier: tacklerSlot, x: ball.x, y: ball.y },
      };
    }

    return {
      goalScored: false,
      newBall: { team: ball.team, carrier, x: toPos.x, y: toPos.y, lastPasser: ball.lastPasser },
    };
  }

  // ---------------------------------------------------------------------------
  // 射门
  // ---------------------------------------------------------------------------

  /**
   * 射门流程：
   * 1. 检查射门路线上的封堵球员（非门将）→ 封堵尝试
   * 2. 计算射门质量（攻击+技术），判断是否射正
   * 3. 射正则门将扑救
   * 4. 扑救失败则进球
   */
  private executeShoot(
    ball: BallState,
    defendTeam: Team,
    defSide: 'home' | 'away',
    params: BalanceParams,
    rng: SeededRandom,
    cooldowns: Map<string, Map<string, number>>,
    events: MatchEvent[],
    minute: number,
  ): ActionResult {
    const carrier = ball.carrier;
    const isHome = ball.team === 'home';
    const goalPos: Vec2 = { x: isHome ? 0.98 : 0.02, y: 0.5 };
    const shooterPos: Vec2 = { x: ball.x, y: ball.y };

    // 检查射门路线上的封堵者（非门将）
    const blockers = this.getShotBlockers(shooterPos, goalPos, defendTeam.formation, defSide);
    if (blockers.length > 0 && rng.next() < params.blockBaseChance) {
      const blocker = this.pickBestDefender(rng, blockers);
      events.push({ type: 'block', minute, blocker: blocker.card.id, shooter: carrier.card.id });
      return {
        goalScored: false,
        newBall: { team: defSide, carrier: blocker, x: ball.x, y: ball.y },
      };
    }

    // 射门质量
    const shotBonus = this.resolveSkills(rng, carrier, 'on_shot', cooldowns, events, minute);
    const atk = carrier.card.attack + shotBonus.attack;
    const tech = carrier.card.technique + shotBonus.technique;
    const shotPower = atk * params.shotPowerWeight + tech * (1 - params.shotPowerWeight);
    const onTarget = rng.next() < Math.min(0.82, shotPower * 0.008);

    events.push({ type: 'shot', minute, player: carrier.card.id, onTarget });

    if (!onTarget) {
      // 偏出，门将拿球或角球（简化为门将持球）
      const gk = this.getGK(defendTeam);
      return {
        goalScored: false,
        newBall: { team: defSide, carrier: gk, x: goalPos.x, y: goalPos.y },
      };
    }

    // 门将扑救
    const gkSlot = defendTeam.formation.find(s => s.card.position === 'GK');
    if (gkSlot) {
      const saveBonus = this.resolveSkills(rng, gkSlot, 'on_shot', cooldowns, events, minute);
      const gkDef = gkSlot.card.defense + saveBonus.defense;
      const saveChance = Math.max(0.10, Math.min(0.82, gkDef * 0.006));
      const saved = rng.next() < saveChance;
      if (saved) {
        events.push({ type: 'save', minute, goalkeeper: gkSlot.card.id });
        return {
          goalScored: false,
          newBall: { team: defSide, carrier: gkSlot, x: goalPos.x, y: goalPos.y },
        };
      }
    }

    // 进球
    const assist =
      ball.lastPasser && ball.lastPasser.card.id !== carrier.card.id
        ? ball.lastPasser.card.id
        : undefined;
    events.push({ type: 'goal', minute, scorer: carrier.card.id, assist });
    return { goalScored: true, newBall: ball };
  }

  // ---------------------------------------------------------------------------
  // 空间辅助函数
  // ---------------------------------------------------------------------------

  /**
   * 获取球员的绝对场地坐标。
   * 主队：slot 坐标即绝对坐标（GK 在 x≈0.05，FWD 在 x≈0.70）
   * 客队：x 翻转（GK 在 x≈0.95，FWD 在 x≈0.30）
   */
  private playerFieldPos(slot: TeamSlot, team: 'home' | 'away'): Vec2 {
    return team === 'home'
      ? { x: slot.x, y: slot.y }
      : { x: 1 - slot.x, y: slot.y };
  }

  private dist(a: Vec2, b: Vec2): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  /** 点到线段的最短距离 */
  private ptSegDist(p: Vec2, a: Vec2, b: Vec2): number {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return this.dist(p, a);
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
    return this.dist(p, { x: a.x + t * dx, y: a.y + t * dy });
  }

  /** 指定位置附近（半径内）的防守方球员 */
  private getNearbyDefendersAt(
    pos: Vec2,
    defSlots: TeamSlot[],
    defTeam: 'home' | 'away',
    radius: number,
  ): TeamSlot[] {
    return defSlots.filter(s => this.dist(this.playerFieldPos(s, defTeam), pos) <= radius);
  }

  /** 传球路线上的潜在拦截者（距离传球路线 0.15 以内） */
  private getInterceptors(
    from: Vec2,
    to: Vec2,
    defSlots: TeamSlot[],
    defTeam: 'home' | 'away',
  ): TeamSlot[] {
    return defSlots.filter(s =>
      this.ptSegDist(this.playerFieldPos(s, defTeam), from, to) < 0.15,
    );
  }

  /** 射门路线上的封堵者（非门将，距射门路线 0.13 以内） */
  private getShotBlockers(
    shooter: Vec2,
    goal: Vec2,
    defSlots: TeamSlot[],
    defTeam: 'home' | 'away',
  ): TeamSlot[] {
    return defSlots.filter(s => {
      if (s.card.position === 'GK') return false;
      return this.ptSegDist(this.playerFieldPos(s, defTeam), shooter, goal) < 0.13;
    });
  }

  /** 距给定坐标最近的防守方球员 */
  private getNearestDefender(pos: Vec2, defSlots: TeamSlot[], defTeam: 'home' | 'away'): TeamSlot {
    let nearest = defSlots[0];
    let nearestDist = Infinity;
    for (const s of defSlots) {
      const d = this.dist(this.playerFieldPos(s, defTeam), pos);
      if (d < nearestDist) { nearestDist = d; nearest = s; }
    }
    return nearest;
  }

  /**
   * 从候选防守球员中选出最佳（防守值最高优先，带随机性）。
   * 65% 概率选防守值最高，35% 随机，避免每次都是同一球员。
   */
  private pickBestDefender(rng: SeededRandom, defenders: TeamSlot[]): TeamSlot {
    const sorted = [...defenders].sort((a, b) => b.card.defense - a.card.defense);
    return rng.next() < 0.65 ? sorted[0] : rng.pick(sorted);
  }

  private getGK(team: Team): TeamSlot {
    return team.formation.find(s => s.card.position === 'GK') ?? team.formation[0];
  }

  // ---------------------------------------------------------------------------
  // 传球目标选择
  // ---------------------------------------------------------------------------

  /**
   * 向前传球优先（1.6 倍权重），按位置接球倾向加权随机选取。
   */
  private selectPassTarget(
    carrier: TeamSlot,
    attackSlots: TeamSlot[],
    ball: BallState,
    rng: SeededRandom,
  ): TeamSlot {
    const candidates = attackSlots.filter(s => s.card.id !== carrier.card.id);
    if (candidates.length === 0) return carrier;

    const isHome = ball.team === 'home';
    const carrierFieldX = ball.x;

    const weighted = candidates.map(s => {
      const fieldX = this.playerFieldPos(s, ball.team).x;
      const forwardBonus = isHome
        ? (fieldX > carrierFieldX ? 1.6 : 0.7)
        : (fieldX < carrierFieldX ? 1.6 : 0.7);
      const posWeight = RECEIVE_WEIGHTS[s.card.position] ?? 1;
      return { slot: s, weight: posWeight * forwardBonus };
    });

    let total = weighted.reduce((sum, w) => sum + w.weight, 0);
    if (total <= 0) return rng.pick(candidates);

    let roll = rng.next() * total;
    for (const w of weighted) {
      roll -= w.weight;
      if (roll <= 0) return w.slot;
    }
    return weighted[weighted.length - 1].slot;
  }

  // ---------------------------------------------------------------------------
  // 平衡参数加载
  // ---------------------------------------------------------------------------

  private loadBalanceParams(): BalanceParams {
    return {
      passSuccessBase:     this.data.getBalance<number>('passSuccessBase'),
      shotPowerWeight:     this.data.getBalance<number>('shotPowerWeight'),
      homeAdvantage:       this.data.getBalance<number>('homeAdvantage'),
      matchMinutes:        this.data.getBalance<number>('matchMinutes'),
      eventsPerMinute:     this.data.getBalance<number>('eventsPerMinute'),
      tackleBaseChance:    this.data.getBalance<number>('tackleBaseChance'),
      dribbleBaseSuccess:  this.data.getBalance<number>('dribbleBaseSuccess'),
      interceptBaseChance: this.data.getBalance<number>('interceptBaseChance'),
      blockBaseChance:     this.data.getBalance<number>('blockBaseChance'),
    };
  }

  // ---------------------------------------------------------------------------
  // 技能系统（保持原有逻辑不变）
  // ---------------------------------------------------------------------------

  private resolveSkills(
    rng: SeededRandom,
    slot: TeamSlot,
    trigger: string,
    cooldowns: Map<string, Map<string, number>>,
    events: MatchEvent[],
    minute: number,
  ): StatBonus {
    const bonus: StatBonus = { ...ZERO_BONUS };
    const card = slot.card;
    const playerCd = cooldowns.get(card.id);
    if (!playerCd) return bonus;

    for (const skillId of [card.skill1, card.skill2]) {
      if (!skillId) continue;
      let skill;
      try { skill = this.data.getSkill(skillId); } catch { continue; }
      if (skill.triggerCondition !== trigger) continue;

      if (skill.type === 'passive') {
        this.applyBuff(bonus, skill.effectType, skill.effectValue);
        continue;
      }

      const remaining = playerCd.get(skillId) ?? 0;
      if (remaining > 0) {
        rng.next(); // 消耗 RNG 保持确定性
        continue;
      }

      if (rng.next() < 0.8) {
        playerCd.set(skillId, skill.cooldown);
        this.applyBuff(bonus, skill.effectType, skill.effectValue);
        events.push({
          type: 'skill',
          minute,
          player: card.id,
          skillId: skill.id,
          targets: [card.id],
        });
      }
    }

    return bonus;
  }

  private applyBuff(bonus: StatBonus, effectType: string, value: number): void {
    switch (effectType) {
      case 'buff_attack':    bonus.attack    += value; break;
      case 'buff_defense':   bonus.defense   += value; break;
      case 'buff_speed':     bonus.speed     += value; break;
      case 'buff_technique': bonus.technique += value; break;
    }
  }

  private tickCooldowns(cooldowns: Map<string, Map<string, number>>): void {
    for (const playerCds of cooldowns.values()) {
      for (const [skillId, cd] of playerCds) {
        if (cd > 0) playerCds.set(skillId, cd - 1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MVP 评分
  // ---------------------------------------------------------------------------

  private findMVP(events: MatchEvent[], home: Team, away: Team): string {
    const scores = new Map<string, number>();

    for (const e of events) {
      switch (e.type) {
        case 'goal':
          scores.set(e.scorer, (scores.get(e.scorer) ?? 0) + 3);
          if (e.assist) scores.set(e.assist, (scores.get(e.assist) ?? 0) + 1);
          break;
        case 'save':
          scores.set(e.goalkeeper, (scores.get(e.goalkeeper) ?? 0) + 2);
          break;
        case 'tackle':
          if (e.success) scores.set(e.tackler, (scores.get(e.tackler) ?? 0) + 1);
          break;
        case 'block':
          scores.set(e.blocker, (scores.get(e.blocker) ?? 0) + 1);
          break;
        case 'intercept':
          if (e.success) scores.set(e.interceptor, (scores.get(e.interceptor) ?? 0) + 1);
          break;
        case 'pass':
          if (e.success) scores.set(e.from, (scores.get(e.from) ?? 0) + 0.5);
          break;
        case 'dribble':
          if (e.success) scores.set(e.player, (scores.get(e.player) ?? 0) + 0.5);
          break;
        case 'skill':
          scores.set(e.player, (scores.get(e.player) ?? 0) + 0.5);
          break;
      }
    }

    let mvp = home.formation[0]?.card.id ?? away.formation[0]?.card.id ?? '';
    let best = -1;
    for (const [id, score] of scores) {
      if (score > best) { best = score; mvp = id; }
    }
    return mvp;
  }
}
