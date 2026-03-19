import type { MatchEvent } from './MatchEvent.ts';

export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  mvpPlayerId: string;
  events: MatchEvent[];
  homeName: string;
  awayName: string;
}
