export type MatchEvent =
  | { type: 'kickoff'; minute: number }
  | { type: 'pass'; minute: number; from: string; to: string; success: boolean }
  | { type: 'shot'; minute: number; player: string; onTarget: boolean }
  | { type: 'save'; minute: number; goalkeeper: string }
  | { type: 'goal'; minute: number; scorer: string; assist?: string }
  | { type: 'tackle'; minute: number; tackler: string; target: string; success: boolean }
  | { type: 'skill'; minute: number; player: string; skillId: string; targets: string[] }
  | { type: 'halftime' }
  | { type: 'fulltime'; homeGoals: number; awayGoals: number };
