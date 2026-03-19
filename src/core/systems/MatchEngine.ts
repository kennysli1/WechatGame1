import type { Team } from '../models/Team.ts';
import type { MatchEvent } from '../models/MatchEvent.ts';
import type { MatchResult } from '../models/MatchResult.ts';
import type { DataManager } from '../data/DataManager.ts';
import { SeededRandom } from '../../utils/random.ts';

export interface IMatchEngine {
  simulate(home: Team, away: Team, seed?: number): MatchResult;
}

export class MatchEngine implements IMatchEngine {
  constructor(private data: DataManager) {}

  simulate(home: Team, away: Team, seed?: number): MatchResult {
    const rng = new SeededRandom(seed ?? Date.now());
    const events: MatchEvent[] = [];
    let homeGoals = 0;
    let awayGoals = 0;

    const matchMinutes = this.data.getBalance<number>('matchMinutes');
    const eventsPerMinute = this.data.getBalance<number>('eventsPerMinute');
    const passSuccessBase = this.data.getBalance<number>('passSuccessBase');
    const shotPowerWeight = this.data.getBalance<number>('shotPowerWeight');

    events.push({ type: 'kickoff', minute: 0 });

    for (let minute = 1; minute <= matchMinutes; minute++) {
      if (minute === Math.floor(matchMinutes / 2)) {
        events.push({ type: 'halftime' });
        continue;
      }

      if (rng.next() > eventsPerMinute) continue;

      const isHome = rng.next() > 0.5;
      const team = isHome ? home : away;
      const opponent = isHome ? away : home;

      const attacker = team.formation[Math.floor(rng.next() * team.formation.length)];
      const receiver = team.formation[Math.floor(rng.next() * team.formation.length)];

      const passSuccess = rng.next() < passSuccessBase + attacker.card.technique * 0.002;
      events.push({
        type: 'pass',
        minute,
        from: attacker.card.id,
        to: receiver.card.id,
        success: passSuccess,
      });

      if (!passSuccess) continue;

      if (rng.next() < 0.3) {
        const defender =
          opponent.formation[Math.floor(rng.next() * opponent.formation.length)];
        const tackleSuccess = rng.next() < defender.card.defense * 0.008;
        events.push({
          type: 'tackle',
          minute,
          tackler: defender.card.id,
          target: receiver.card.id,
          success: tackleSuccess,
        });
        if (tackleSuccess) continue;
      }

      if (rng.next() < 0.4) {
        const shooter = receiver;
        const shotPower = shooter.card.attack * shotPowerWeight + shooter.card.technique * (1 - shotPowerWeight);
        const onTarget = rng.next() < shotPower * 0.008;
        events.push({
          type: 'shot',
          minute,
          player: shooter.card.id,
          onTarget,
        });

        if (onTarget) {
          const gk = opponent.formation.find((s) => s.card.position === 'GK');
          if (gk) {
            const saveChance = gk.card.defense * 0.006;
            if (rng.next() < saveChance) {
              events.push({ type: 'save', minute, goalkeeper: gk.card.id });
              continue;
            }
          }
          if (isHome) homeGoals++;
          else awayGoals++;
          events.push({
            type: 'goal',
            minute,
            scorer: shooter.card.id,
            assist: attacker.card.id !== shooter.card.id ? attacker.card.id : undefined,
          });
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

  private findMVP(events: MatchEvent[], home: Team, away: Team): string {
    const scores = new Map<string, number>();
    for (const e of events) {
      if (e.type === 'goal') {
        scores.set(e.scorer, (scores.get(e.scorer) ?? 0) + 3);
        if (e.assist) scores.set(e.assist, (scores.get(e.assist) ?? 0) + 1);
      } else if (e.type === 'save') {
        scores.set(e.goalkeeper, (scores.get(e.goalkeeper) ?? 0) + 2);
      } else if (e.type === 'tackle' && e.success) {
        scores.set(e.tackler, (scores.get(e.tackler) ?? 0) + 1);
      }
    }

    let mvp = home.formation[0]?.card.id ?? away.formation[0]?.card.id ?? '';
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
