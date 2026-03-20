export type Vec2 = { x: number; y: number };

export type MatchEvent =
  | { type: 'kickoff'; minute: number; ballPos?: Vec2 }
  | { type: 'pass'; minute: number; from: string; to: string; success: boolean; fromPos?: Vec2; toPos?: Vec2 }
  | { type: 'dribble'; minute: number; player: string; success: boolean; fromPos: Vec2; toPos: Vec2 }
  | { type: 'intercept'; minute: number; interceptor: string; passer: string; success: boolean; fromPos?: Vec2; interceptPos?: Vec2 }
  | { type: 'shot'; minute: number; player: string; onTarget: boolean; fromPos?: Vec2; targetPos?: Vec2 }
  | { type: 'block'; minute: number; blocker: string; shooter: string; fromPos?: Vec2; blockerPos?: Vec2 }
  | { type: 'save'; minute: number; goalkeeper: string; ballPos?: Vec2 }
  | { type: 'goal'; minute: number; scorer: string; assist?: string; fromPos?: Vec2; goalPos?: Vec2 }
  | { type: 'tackle'; minute: number; tackler: string; target: string; success: boolean; ballPos?: Vec2 }
  | { type: 'skill'; minute: number; player: string; skillId: string; targets: string[]; ballPos?: Vec2 }
  | { type: 'halftime' }
  | { type: 'fulltime'; homeGoals: number; awayGoals: number };
