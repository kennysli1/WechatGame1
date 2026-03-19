import type {
  CardDef,
  SkillDef,
  AITeamDef,
  StageDef,
  AssetManifestEntry,
  Position,
} from '../data/schemas.ts';

// ---------------------------------------------------------------------------
// 内嵌测试数据（8 张卡、6 技能、3 支 AI 队 7 人各、3 关卡、7 条平衡参数）
// ---------------------------------------------------------------------------

const CARDS: CardDef[] = [
  { id: 'gk_001', name: '李守门', position: 'GK',  star: 3, attack: 20, defense: 85, speed: 50, technique: 55, skill1: 'skill_save',    skill2: '',              artAsset: 'card_gk_001', description: '稳健守门员', dribble: 20, passing: 30, shooting: 10, tackling: 30, intercept: 25, blocking: 65, goalkeeping: 85 },
  { id: 'df_001', name: '张铁壁', position: 'DEF', star: 3, attack: 35, defense: 80, speed: 55, technique: 50, skill1: 'skill_tackle',  skill2: '',              artAsset: 'card_df_001', description: '坚固后卫',   dribble: 35, passing: 40, shooting: 30, tackling: 80, intercept: 75, blocking: 78, goalkeeping: 0  },
  { id: 'df_002', name: '王坚盾', position: 'DEF', star: 2, attack: 30, defense: 75, speed: 60, technique: 45, skill1: 'skill_tackle',  skill2: '',              artAsset: 'card_df_002', description: '快速后卫',   dribble: 40, passing: 45, shooting: 28, tackling: 70, intercept: 72, blocking: 65, goalkeeping: 0  },
  { id: 'mf_001', name: '陈中场', position: 'MID', star: 3, attack: 60, defense: 60, speed: 70, technique: 75, skill1: 'skill_through', skill2: '',              artAsset: 'card_mf_001', description: '全能中场',   dribble: 65, passing: 72, shooting: 55, tackling: 60, intercept: 55, blocking: 40, goalkeeping: 0  },
  { id: 'mf_002', name: '刘组织', position: 'MID', star: 4, attack: 55, defense: 55, speed: 65, technique: 85, skill1: 'skill_through', skill2: 'skill_freekick', artAsset: 'card_mf_002', description: '组织核心',   dribble: 60, passing: 85, shooting: 50, tackling: 55, intercept: 60, blocking: 38, goalkeeping: 0  },
  { id: 'fw_001', name: '赵射手', position: 'FWD', star: 4, attack: 88, defense: 25, speed: 80, technique: 78, skill1: 'skill_shot',    skill2: 'skill_dribble', artAsset: 'card_fw_001', description: '锋线杀手',   dribble: 78, passing: 60, shooting: 88, tackling: 25, intercept: 20, blocking: 18, goalkeeping: 0  },
  { id: 'fw_002', name: '孙飞翼', position: 'FWD', star: 3, attack: 75, defense: 30, speed: 90, technique: 70, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_fw_002', description: '极速边锋',   dribble: 85, passing: 55, shooting: 72, tackling: 22, intercept: 18, blocking: 15, goalkeeping: 0  },
  { id: 'fw_003', name: '周重炮', position: 'FWD', star: 5, attack: 95, defense: 20, speed: 70, technique: 88, skill1: 'skill_shot',    skill2: 'skill_freekick', artAsset: 'card_fw_003', description: '传奇射手',   dribble: 75, passing: 65, shooting: 95, tackling: 20, intercept: 18, blocking: 14, goalkeeping: 0  },
];

const SKILLS: SkillDef[] = [
  { id: 'skill_save',     name: '神扑',       description: '提升扑救成功率',     type: 'passive', target: 'self', effectType: 'buff_defense',   effectValue: 15, duration: 0, triggerCondition: 'on_shot',   animKey: 'anim_save',       cooldown: 0 },
  { id: 'skill_tackle',   name: '飞铲',       description: '提升铲断能力',       type: 'passive', target: 'self', effectType: 'buff_defense',   effectValue: 12, duration: 0, triggerCondition: 'on_tackle', animKey: 'anim_tackle',     cooldown: 0 },
  { id: 'skill_shot',     name: '暴力射门',   description: '提升射门威力',       type: 'active',  target: 'self', effectType: 'buff_attack',    effectValue: 20, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_power_shot', cooldown: 3 },
  { id: 'skill_dribble',  name: '灵巧过人',   description: '提升突破成功率',     type: 'active',  target: 'self', effectType: 'buff_speed',     effectValue: 18, duration: 1, triggerCondition: 'on_pass',   animKey: 'anim_dribble',    cooldown: 2 },
  { id: 'skill_through',  name: '致命直塞',   description: '提升传球精准度',     type: 'active',  target: 'team', effectType: 'buff_technique', effectValue: 15, duration: 2, triggerCondition: 'on_pass',   animKey: 'anim_through',    cooldown: 3 },
  { id: 'skill_freekick', name: '任意球大师', description: '获得额外定位球机会', type: 'active',  target: 'self', effectType: 'buff_technique', effectValue: 25, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_freekick',   cooldown: 5 },
];

// 7v7 标准阵型坐标：GK(0.05,0.50) | DEF×2(0.20,0.25/0.75) | MID×2(0.45,0.25/0.75) | FWD×2(0.70,0.35/0.65)
const AI_TEAMS: AITeamDef[] = [
  {
    teamId: 'ai_team_001', teamName: '新手挑战队', difficulty: 1,
    slots: [
      { cardId: 'gk_001', x: 0.05, y: 0.50 },
      { cardId: 'df_002', x: 0.20, y: 0.25 },
      { cardId: 'df_001', x: 0.20, y: 0.75 },
      { cardId: 'mf_001', x: 0.45, y: 0.25 },
      { cardId: 'mf_002', x: 0.45, y: 0.75 },
      { cardId: 'fw_002', x: 0.70, y: 0.35 },
      { cardId: 'fw_001', x: 0.70, y: 0.65 },
    ],
  },
  {
    teamId: 'ai_team_002', teamName: '实力对手', difficulty: 2,
    slots: [
      { cardId: 'gk_001', x: 0.05, y: 0.50 },
      { cardId: 'df_001', x: 0.20, y: 0.25 },
      { cardId: 'df_002', x: 0.20, y: 0.75 },
      { cardId: 'mf_001', x: 0.45, y: 0.25 },
      { cardId: 'mf_002', x: 0.45, y: 0.75 },
      { cardId: 'fw_001', x: 0.70, y: 0.35 },
      { cardId: 'fw_002', x: 0.70, y: 0.65 },
    ],
  },
  {
    teamId: 'ai_team_003', teamName: '精英劲旅', difficulty: 3,
    slots: [
      { cardId: 'gk_001', x: 0.05, y: 0.50 },
      { cardId: 'df_001', x: 0.20, y: 0.25 },
      { cardId: 'df_002', x: 0.20, y: 0.75 },
      { cardId: 'mf_001', x: 0.45, y: 0.25 },
      { cardId: 'mf_002', x: 0.45, y: 0.75 },
      { cardId: 'fw_001', x: 0.70, y: 0.35 },
      { cardId: 'fw_003', x: 0.70, y: 0.65 },
    ],
  },
];

const STAGES: StageDef[] = [
  { stageId: 'stage_001', name: '新手试炼', aiTeamId: 'ai_team_001', unlockAfterStage: '',          rewardCardId: 'mf_001', rewardCoins: 100, description: '你的第一场比赛' },
  { stageId: 'stage_002', name: '城市联赛', aiTeamId: 'ai_team_002', unlockAfterStage: 'stage_001', rewardCardId: 'fw_001', rewardCoins: 200, description: '面对更强的对手' },
  { stageId: 'stage_003', name: '冠军之路', aiTeamId: 'ai_team_003', unlockAfterStage: 'stage_002', rewardCardId: 'fw_003', rewardCoins: 500, description: '终极挑战' },
];

const BALANCE: Record<string, number | string | boolean> = {
  passSuccessBase:     0.7,
  shotPowerWeight:     0.4,
  homeAdvantage:       1.05,
  matchMinutes:        90,
  eventsPerMinute:     0.8,
  tackleBaseChance:    0.3,
  shotChance:          0.4,
  dribbleBaseSuccess:  0.55,
  interceptBaseChance: 0.40,
  blockBaseChance:     0.25,
};

// ---------------------------------------------------------------------------
// MockDataManager — 开发/测试期注入，零网络依赖
// ---------------------------------------------------------------------------

export class MockDataManager {
  async init(): Promise<void> {
    console.log('[MockDataManager] init() — 使用内嵌 Mock 数据 (7v7)');
  }

  getCard(id: string): CardDef {
    const card = CARDS.find((c) => c.id === id);
    if (!card) throw new Error(`[MockDataManager] Card not found: ${id}`);
    return card;
  }

  getAllCards(): CardDef[] {
    return [...CARDS];
  }

  getCardsByPosition(pos: Position): CardDef[] {
    return CARDS.filter((c) => c.position === pos);
  }

  getSkill(id: string): SkillDef {
    const skill = SKILLS.find((s) => s.id === id);
    if (!skill) throw new Error(`[MockDataManager] Skill not found: ${id}`);
    return skill;
  }

  getAllSkills(): SkillDef[] {
    return [...SKILLS];
  }

  getAITeam(teamId: string): AITeamDef {
    const team = AI_TEAMS.find((t) => t.teamId === teamId);
    if (!team) throw new Error(`[MockDataManager] AI team not found: ${teamId}`);
    return team;
  }

  getStage(stageId: string): StageDef {
    const stage = STAGES.find((s) => s.stageId === stageId);
    if (!stage) throw new Error(`[MockDataManager] Stage not found: ${stageId}`);
    return stage;
  }

  getAllStages(): StageDef[] {
    return [...STAGES];
  }

  getBalance<T extends number | string | boolean>(key: string): T {
    if (key in BALANCE) return BALANCE[key] as T;
    throw new Error(`[MockDataManager] Balance key not found: ${key}`);
  }

  getAssetManifest(): AssetManifestEntry[] {
    return [];
  }

  getAssetEntry(_key: string): AssetManifestEntry | undefined {
    return undefined;
  }
}
