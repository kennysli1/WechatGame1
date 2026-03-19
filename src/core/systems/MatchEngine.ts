import type { Team, TeamSlot } from '../models/Team.ts';
import type { MatchEvent } from '../models/MatchEvent.ts';
import type { MatchResult } from '../models/MatchResult.ts';
import type { IDataManager } from '../data/IDataManager.ts';
import type { Position } from '../data/schemas.ts';
import { SeededRandom } from '../../utils/random.ts';

export interface IMatchEngine {
  simulate(home: Team, away: Team, seed?: number): MatchResult;
}

interface BalanceParams {
  passSuccessBase: number;
  shotPowerWeight: number;
  homeAdvantage: number;
  matchMinutes: number;
  eventsPerMinute: number;
  tackleBaseChance: number;
  shotChance: number;
}

interface StatBonus {
  attack: number;
  defense: number;
  speed: number;
  technique: number;
}

const ZERO_BONUS: Readonly<StatBonus> = { attack: 0, defense: 0, speed: 0, technique: 0 };

type RoleWeights = Record<Position, number>;

const ROLE_WEIGHTS = {
  pass:    { GK: 0.5, DEF: 2, MID: 3, FWD: 1 } as RoleWeights,
  receive: { GK: 0,   DEF: 0.5, MID: 2, FWD: 3 } as RoleWeights,
  tackle:  { GK: 0.5, DEF: 3, MID: 2, FWD: 0.5 } as RoleWeights,
  shoot:   { GK: 0,   DEF: 0.2, MID: 1, FWD: 4 } as RoleWeights,
};

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

    events.push({ type: 'kickoff', minute: 0 });

    for (let minute = 1; minute <= params.matchMinutes; minute++) {
      if (minute === Math.floor(params.matchMinutes / 2)) {
        events.push({ type: 'halftime' });
        continue;
      }

      this.tickCooldowns(cooldowns);

      if (rng.next() > params.eventsPerMinute) continue;

      const isHome = this.determineAttacker(rng, home, away, params);
      const attackTeam = isHome ? home : away;
      const defendTeam = isHome ? away : home;

      // === PASS PHASE ===
      const passer = this.weightedSelect(rng, attackTeam.formation, ROLE_WEIGHTS.pass);
      const receiveCandidates = attackTeam.formation.filter(
        (s) => s.card.id !== passer.card.id,
      );
      if (receiveCandidates.length === 0) continue;
      const receiver = this.weightedSelect(rng, receiveCandidates, ROLE_WEIGHTS.receive);

      const passBonus = this.resolveSkills(
        rng, passer, 'on_pass', cooldowns, events, minute,
      );
      const technique = passer.card.technique + passBonus.technique;
      const passChance = params.passSuccessBase + technique * 0.002;
      const passSuccess = rng.next() < passChance;

      events.push({
        type: 'pass',
        minute,
        from: passer.card.id,
        to: receiver.card.id,
        success: passSuccess,
      });

      if (!passSuccess) continue;

      // === TACKLE PHASE ===
      if (rng.next() < params.tackleBaseChance) {
        const defender = this.weightedSelect(
          rng, defendTeam.formation, ROLE_WEIGHTS.tackle,
        );
        const tackleBonus = this.resolveSkills(
          rng, defender, 'on_tackle', cooldowns, events, minute,
        );
        const defVal = defender.card.defense + tackleBonus.defense;
        const recSpeed = receiver.card.speed;
        const tackleChance = defVal * 0.007 - recSpeed * 0.002;
        const tackleSuccess = rng.next() < tackleChance;

        events.push({
          type: 'tackle',
          minute,
          tackler: defender.card.id,
          target: receiver.card.id,
          success: tackleSuccess,
        });
        if (tackleSuccess) continue;
      }

      // === SHOT PHASE ===
      if (rng.next() < params.shotChance) {
        const shooter = this.selectShooter(rng, attackTeam, receiver);
        const shotBonus = this.resolveSkills(
          rng, shooter, 'on_shot', cooldowns, events, minute,
        );
        const atk = shooter.card.attack + shotBonus.attack;
        const tech = shooter.card.technique + shotBonus.technique;
        const shotPower =
          atk * params.shotPowerWeight + tech * (1 - params.shotPowerWeight);
        const onTarget = rng.next() < shotPower * 0.008;

        events.push({
          type: 'shot',
          minute,
          player: shooter.card.id,
          onTarget,
        });

        if (onTarget) {
          // === SAVE PHASE ===
          const gk = defendTeam.formation.find(
            (s) => s.card.position === 'GK',
          );
          let saved = false;
          if (gk) {
            const saveBonus = this.resolveSkills(
              rng, gk, 'on_shot', cooldowns, events, minute,
            );
            const gkDef = gk.card.defense + saveBonus.defense;
            const saveChance = gkDef * 0.006;
            saved = rng.next() < saveChance;
            if (saved) {
              events.push({ type: 'save', minute, goalkeeper: gk.card.id });
            }
          }

          if (!saved) {
            if (isHome) homeGoals++;
            else awayGoals++;
            events.push({
              type: 'goal',
              minute,
              scorer: shooter.card.id,
              assist:
                passer.card.id !== shooter.card.id
                  ? passer.card.id
                  : undefined,
            });
          }
        }
      }
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
  // Balance
  // ---------------------------------------------------------------------------

  private loadBalanceParams(): BalanceParams {
    return {
      passSuccessBase: this.data.getBalance<number>('passSuccessBase'),
      shotPowerWeight: this.data.getBalance<number>('shotPowerWeight'),
      homeAdvantage: this.data.getBalance<number>('homeAdvantage'),
      matchMinutes: this.data.getBalance<number>('matchMinutes'),
      eventsPerMinute: this.data.getBalance<number>('eventsPerMinute'),
      tackleBaseChance: this.data.getBalance<number>('tackleBaseChance'),
      shotChance: this.data.getBalance<number>('shotChance'),
    };
  }

  // ---------------------------------------------------------------------------
  // Possession
  // ---------------------------------------------------------------------------

  private determineAttacker(
    rng: SeededRandom,
    home: Team,
    away: Team,
    params: BalanceParams,
  ): boolean {
    const homeSpeed = this.teamAvgSpeed(home);
    const awaySpeed = this.teamAvgSpeed(away);
    const speedRatio = homeSpeed / (homeSpeed + awaySpeed || 1);
    return rng.next() < speedRatio * params.homeAdvantage;
  }

  private teamAvgSpeed(team: Team): number {
    if (team.formation.length === 0) return 50;
    return (
      team.formation.reduce((s, slot) => s + slot.card.speed, 0) /
      team.formation.length
    );
  }

  // ---------------------------------------------------------------------------
  // Player selection
  // ---------------------------------------------------------------------------

  private weightedSelect(
    rng: SeededRandom,
    slots: TeamSlot[],
    weights: RoleWeights,
  ): TeamSlot {
    if (slots.length === 0) throw new Error('Cannot select from empty slots');
    if (slots.length === 1) return slots[0];

    let total = 0;
    for (const s of slots) total += weights[s.card.position] ?? 1;

    if (total <= 0) return rng.pick(slots);

    let roll = rng.next() * total;
    for (const s of slots) {
      roll -= weights[s.card.position] ?? 1;
      if (roll <= 0) return s;
    }
    return slots[slots.length - 1];
  }

  private selectShooter(
    rng: SeededRandom,
    team: Team,
    receiver: TeamSlot,
  ): TeamSlot {
    const forwards = team.formation.filter(
      (s) => s.card.position === 'FWD',
    );
    if (forwards.length > 0 && rng.next() < 0.7) {
      return rng.pick(forwards);
    }
    return receiver;
  }

  // ---------------------------------------------------------------------------
  // Skill system
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
      try {
        skill = this.data.getSkill(skillId);
      } catch {
        continue;
      }

      if (skill.triggerCondition !== trigger) continue;

      if (skill.type === 'passive') {
        this.applyBuff(bonus, skill.effectType, skill.effectValue);
        continue;
      }

      const remaining = playerCd.get(skillId) ?? 0;
      if (remaining > 0) {
        rng.next(); // consume RNG to keep determinism regardless of cooldown state
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
      case 'buff_attack':
        bonus.attack += value;
        break;
      case 'buff_defense':
        bonus.defense += value;
        break;
      case 'buff_speed':
        bonus.speed += value;
        break;
      case 'buff_technique':
        bonus.technique += value;
        break;
    }
  }

  private tickCooldowns(
    cooldowns: Map<string, Map<string, number>>,
  ): void {
    for (const playerCds of cooldowns.values()) {
      for (const [skillId, cd] of playerCds) {
        if (cd > 0) playerCds.set(skillId, cd - 1);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MVP calculation
  // ---------------------------------------------------------------------------

  private findMVP(
    events: MatchEvent[],
    home: Team,
    away: Team,
  ): string {
    const scores = new Map<string, number>();

    for (const e of events) {
      switch (e.type) {
        case 'goal':
          scores.set(e.scorer, (scores.get(e.scorer) ?? 0) + 3);
          if (e.assist)
            scores.set(e.assist, (scores.get(e.assist) ?? 0) + 1);
          break;
        case 'save':
          scores.set(e.goalkeeper, (scores.get(e.goalkeeper) ?? 0) + 2);
          break;
        case 'tackle':
          if (e.success)
            scores.set(e.tackler, (scores.get(e.tackler) ?? 0) + 1);
          break;
        case 'pass':
          if (e.success)
            scores.set(e.from, (scores.get(e.from) ?? 0) + 0.5);
          break;
        case 'skill':
          scores.set(e.player, (scores.get(e.player) ?? 0) + 0.5);
          break;
      }
    }

    let mvp =
      home.formation[0]?.card.id ?? away.formation[0]?.card.id ?? '';
    let best = -1;
    for (const [id, score] of scores) {
      if (score > best) {
        best = score;
        mvp = id;
      }
    }
    return mvp;
  }
}
