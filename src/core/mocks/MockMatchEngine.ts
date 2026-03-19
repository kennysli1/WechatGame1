import type { Team } from '../models/Team.ts';
import type { MatchResult } from '../models/MatchResult.ts';
import type { IMatchEngine } from '../systems/MatchEngine.ts';
import { MOCK_MATCH_RESULT } from './mockData.ts';

/**
 * MockMatchEngine — 返回一组固定的比赛结果，用于 Mod-D 开发期间独立测试比赛回放。
 * 不依赖 DataManager，simulate() 忽略传入的队伍，直接返回 MOCK_MATCH_RESULT。
 */
export class MockMatchEngine implements IMatchEngine {
  simulate(_home: Team, _away: Team, _seed?: number): MatchResult {
    return { ...MOCK_MATCH_RESULT };
  }
}
