export type Vec2 = { x: number; y: number };

export type MatchEvent =
  | { type: 'kickoff'; minute: number }
  | { type: 'pass'; minute: number; from: string; to: string; success: boolean }
  /** 带球推进：fromPos/toPos 为绝对场地坐标（0-1） */
  | { type: 'dribble'; minute: number; player: string; success: boolean; fromPos: Vec2; toPos: Vec2 }
  /** 传球路线上的拦截尝试 */
  | { type: 'intercept'; minute: number; interceptor: string; passer: string; success: boolean }
  | { type: 'shot'; minute: number; player: string; onTarget: boolean }
  /** 射门封堵（outfield 球员站在射门路线上） */
  | { type: 'block'; minute: number; blocker: string; shooter: string }
  | { type: 'save'; minute: number; goalkeeper: string }
  | { type: 'goal'; minute: number; scorer: string; assist?: string }
  | { type: 'tackle'; minute: number; tackler: string; target: string; success: boolean }
  | { type: 'skill'; minute: number; player: string; skillId: string; targets: string[] }
  | { type: 'halftime' }
  | { type: 'fulltime'; homeGoals: number; awayGoals: number };
