import type {
  CardDef,
  SkillDef,
  AITeamDef,
  StageDef,
  AssetManifestEntry,
  Position,
} from '../data/schemas.ts';

// ---------------------------------------------------------------------------
// 内嵌测试数据（32 张卡、12 技能、5 支 AI 队、5 关卡、10 条平衡参数）
// ---------------------------------------------------------------------------

const CARDS: CardDef[] = [
  // 玩家初始 (7)
  { id: 'gk_001', name: '李守门', position: 'GK',  star: 3, attack: 20, defense: 85, speed: 50, technique: 55, skill1: 'skill_save',    skill2: '',              artAsset: 'card_gk_001', description: '少林守门僧，铜皮铁骨守龙门', dribble: 20, passing: 30, shooting: 10, tackling: 30, intercept: 25, blocking: 65, goalkeeping: 85 },
  { id: 'df_001', name: '张铁壁', position: 'DEF', star: 3, attack: 35, defense: 80, speed: 55, technique: 50, skill1: 'skill_tackle',  skill2: 'skill_iron_wall', artAsset: 'card_df_001', description: '铁布衫传人，防守固若金汤', dribble: 35, passing: 40, shooting: 30, tackling: 80, intercept: 75, blocking: 78, goalkeeping: 0 },
  { id: 'df_002', name: '王坚盾', position: 'DEF', star: 2, attack: 30, defense: 72, speed: 62, technique: 45, skill1: 'skill_tackle',  skill2: '',              artAsset: 'card_df_002', description: '金钟罩弟子，速度型后卫', dribble: 40, passing: 45, shooting: 28, tackling: 70, intercept: 68, blocking: 62, goalkeeping: 0 },
  { id: 'mf_001', name: '陈中场', position: 'MID', star: 3, attack: 60, defense: 60, speed: 70, technique: 75, skill1: 'skill_through', skill2: '',              artAsset: 'card_mf_001', description: '太极拳新秀，攻守兼备', dribble: 65, passing: 72, shooting: 55, tackling: 58, intercept: 55, blocking: 40, goalkeeping: 0 },
  { id: 'mf_002', name: '林快腿', position: 'MID', star: 2, attack: 50, defense: 48, speed: 78, technique: 62, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_mf_002', description: '迷踪步小子，速度见长', dribble: 70, passing: 58, shooting: 48, tackling: 48, intercept: 45, blocking: 32, goalkeeping: 0 },
  { id: 'fw_001', name: '赵射手', position: 'FWD', star: 3, attack: 78, defense: 25, speed: 75, technique: 70, skill1: 'skill_shot',    skill2: '',              artAsset: 'card_fw_001', description: '佛山无影脚，射门精准', dribble: 72, passing: 55, shooting: 78, tackling: 25, intercept: 20, blocking: 18, goalkeeping: 0 },
  { id: 'fw_002', name: '孙飞翼', position: 'FWD', star: 2, attack: 62, defense: 28, speed: 85, technique: 58, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_fw_002', description: '燕青拳新星，极速边路', dribble: 78, passing: 50, shooting: 62, tackling: 22, intercept: 18, blocking: 15, goalkeeping: 0 },
  // 玩家奖励 (7)
  { id: 'gk_002', name: '钱国门', position: 'GK',  star: 4, attack: 22, defense: 90, speed: 55, technique: 62, skill1: 'skill_save',    skill2: 'skill_dragon',   artAsset: 'card_gk_002', description: '铁门罗汉，扑救如有神助', dribble: 22, passing: 35, shooting: 12, tackling: 35, intercept: 30, blocking: 75, goalkeeping: 90 },
  { id: 'df_003', name: '马铜墙', position: 'DEF', star: 3, attack: 40, defense: 78, speed: 58, technique: 55, skill1: 'skill_iron_wall', skill2: 'skill_tiger', artAsset: 'card_df_003', description: '排山倒海掌，攻守兼备后卫', dribble: 42, passing: 50, shooting: 35, tackling: 78, intercept: 72, blocking: 75, goalkeeping: 0 },
  { id: 'mf_003', name: '杨旋风', position: 'MID', star: 3, attack: 62, defense: 55, speed: 72, technique: 70, skill1: 'skill_shadow',  skill2: '',              artAsset: 'card_mf_003', description: '醉拳少年，飘忽不定', dribble: 72, passing: 65, shooting: 58, tackling: 55, intercept: 52, blocking: 38, goalkeeping: 0 },
  { id: 'mf_004', name: '刘组织', position: 'MID', star: 4, attack: 58, defense: 60, speed: 68, technique: 88, skill1: 'skill_through', skill2: 'skill_eagle',   artAsset: 'card_mf_004', description: '八卦掌宗师，传球出神入化', dribble: 62, passing: 88, shooting: 52, tackling: 58, intercept: 60, blocking: 42, goalkeeping: 0 },
  { id: 'fw_003', name: '周重炮', position: 'FWD', star: 4, attack: 88, defense: 22, speed: 72, technique: 82, skill1: 'skill_shot',    skill2: 'skill_thunder',  artAsset: 'card_fw_003', description: '降龙十八脚，射门势大力沉', dribble: 75, passing: 60, shooting: 88, tackling: 20, intercept: 18, blocking: 15, goalkeeping: 0 },
  { id: 'fw_004', name: '吴闪电', position: 'FWD', star: 4, attack: 82, defense: 28, speed: 92, technique: 78, skill1: 'skill_dribble', skill2: 'skill_shadow',   artAsset: 'card_fw_004', description: '闪电连环腿，速度即正义', dribble: 88, passing: 62, shooting: 82, tackling: 25, intercept: 22, blocking: 16, goalkeeping: 0 },
  { id: 'fw_005', name: '郑武神', position: 'FWD', star: 5, attack: 95, defense: 25, speed: 88, technique: 92, skill1: 'skill_thunder', skill2: 'skill_freekick', artAsset: 'card_fw_005', description: '功夫足球之王，无人能挡', dribble: 90, passing: 72, shooting: 95, tackling: 22, intercept: 20, blocking: 18, goalkeeping: 0 },
  // AI 球员 (18)
  { id: 'ai_gk_01', name: '何小门', position: 'GK',  star: 1, attack: 10, defense: 45, speed: 30, technique: 28, skill1: 'skill_save',      skill2: '',              artAsset: 'card_gk_001', description: '菜鸟守门员，有待成长', dribble: 10, passing: 15, shooting: 5,  tackling: 15, intercept: 12, blocking: 30, goalkeeping: 45 },
  { id: 'ai_df_01', name: '胡矮墙', position: 'DEF', star: 1, attack: 18, defense: 42, speed: 32, technique: 25, skill1: 'skill_tackle',    skill2: '',              artAsset: 'card_df_001', description: '新手后卫，勉强能防', dribble: 18, passing: 22, shooting: 15, tackling: 42, intercept: 38, blocking: 35, goalkeeping: 0 },
  { id: 'ai_mf_01', name: '曹学徒', position: 'MID', star: 1, attack: 28, defense: 25, speed: 35, technique: 32, skill1: '',                 skill2: '',              artAsset: 'card_mf_001', description: '初入江湖的学徒', dribble: 30, passing: 32, shooting: 25, tackling: 25, intercept: 22, blocking: 18, goalkeeping: 0 },
  { id: 'ai_mf_02', name: '韩旋风', position: 'MID', star: 1, attack: 30, defense: 22, speed: 40, technique: 35, skill1: 'skill_dribble',   skill2: '',              artAsset: 'card_mf_002', description: '爱好旋转的少年', dribble: 38, passing: 28, shooting: 28, tackling: 22, intercept: 20, blocking: 15, goalkeeping: 0 },
  { id: 'ai_fw_01', name: '黄毛头', position: 'FWD', star: 1, attack: 38, defense: 12, speed: 42, technique: 30, skill1: 'skill_shot',      skill2: '',              artAsset: 'card_fw_001', description: '冲劲十足的愣头青', dribble: 35, passing: 22, shooting: 38, tackling: 12, intercept: 10, blocking: 8,  goalkeeping: 0 },
  { id: 'ai_df_02', name: '许蛮力', position: 'DEF', star: 2, attack: 28, defense: 58, speed: 42, technique: 35, skill1: 'skill_tackle',    skill2: '',              artAsset: 'card_df_002', description: '力大无穷的蛮力后卫', dribble: 28, passing: 32, shooting: 22, tackling: 58, intercept: 52, blocking: 50, goalkeeping: 0 },
  { id: 'ai_mf_03', name: '秦快手', position: 'MID', star: 2, attack: 42, defense: 38, speed: 55, technique: 48, skill1: 'skill_through',   skill2: '',              artAsset: 'card_mf_001', description: '手脚麻利的中场球员', dribble: 48, passing: 50, shooting: 38, tackling: 38, intercept: 35, blocking: 25, goalkeeping: 0 },
  { id: 'ai_fw_02', name: '魏快刀', position: 'FWD', star: 2, attack: 55, defense: 18, speed: 60, technique: 45, skill1: 'skill_shot',      skill2: '',              artAsset: 'card_fw_002', description: '快刀斩乱麻的前锋', dribble: 52, passing: 35, shooting: 55, tackling: 18, intercept: 15, blocking: 12, goalkeeping: 0 },
  { id: 'ai_gk_02', name: '郭铁拳', position: 'GK',  star: 3, attack: 18, defense: 75, speed: 48, technique: 50, skill1: 'skill_save',      skill2: '',              artAsset: 'card_gk_001', description: '铁拳门将，扑救稳健', dribble: 18, passing: 28, shooting: 10, tackling: 28, intercept: 22, blocking: 58, goalkeeping: 75 },
  { id: 'ai_df_03', name: '蒋硬壳', position: 'DEF', star: 3, attack: 35, defense: 75, speed: 52, technique: 48, skill1: 'skill_tackle',    skill2: 'skill_iron_wall', artAsset: 'card_df_001', description: '硬如龟壳的铁血后卫', dribble: 35, passing: 42, shooting: 28, tackling: 75, intercept: 70, blocking: 72, goalkeeping: 0 },
  { id: 'ai_mf_04', name: '谢剑气', position: 'MID', star: 3, attack: 58, defense: 55, speed: 65, technique: 72, skill1: 'skill_through',   skill2: 'skill_eagle',   artAsset: 'card_mf_002', description: '剑气纵横的中场指挥官', dribble: 62, passing: 72, shooting: 52, tackling: 55, intercept: 50, blocking: 38, goalkeeping: 0 },
  { id: 'ai_fw_03', name: '施烈火', position: 'FWD', star: 3, attack: 72, defense: 22, speed: 70, technique: 65, skill1: 'skill_shot',      skill2: 'skill_dribble', artAsset: 'card_fw_001', description: '烈火焚城的暴力前锋', dribble: 68, passing: 50, shooting: 72, tackling: 20, intercept: 18, blocking: 15, goalkeeping: 0 },
  { id: 'ai_df_04', name: '沈盾牌', position: 'DEF', star: 4, attack: 42, defense: 85, speed: 58, technique: 55, skill1: 'skill_iron_wall', skill2: 'skill_tiger',   artAsset: 'card_df_002', description: '无懈可击的盾牌后卫', dribble: 42, passing: 48, shooting: 35, tackling: 85, intercept: 80, blocking: 82, goalkeeping: 0 },
  { id: 'ai_mf_05', name: '邹无双', position: 'MID', star: 4, attack: 68, defense: 62, speed: 75, technique: 85, skill1: 'skill_eagle',    skill2: 'skill_shadow',   artAsset: 'card_mf_001', description: '无双中场大师', dribble: 72, passing: 85, shooting: 62, tackling: 62, intercept: 58, blocking: 45, goalkeeping: 0 },
  { id: 'ai_fw_04', name: '方破军', position: 'FWD', star: 4, attack: 85, defense: 25, speed: 82, technique: 80, skill1: 'skill_thunder',   skill2: 'skill_dribble', artAsset: 'card_fw_002', description: '破军杀招的恐怖射手', dribble: 82, passing: 60, shooting: 85, tackling: 22, intercept: 20, blocking: 15, goalkeeping: 0 },
  { id: 'ai_gk_03', name: '段铁壁', position: 'GK',  star: 5, attack: 25, defense: 95, speed: 58, technique: 68, skill1: 'skill_save',      skill2: 'skill_dragon',  artAsset: 'card_gk_001', description: '绝世门神，固若金汤', dribble: 25, passing: 38, shooting: 15, tackling: 38, intercept: 32, blocking: 80, goalkeeping: 95 },
  { id: 'ai_df_05', name: '褚金刚', position: 'DEF', star: 5, attack: 48, defense: 95, speed: 62, technique: 65, skill1: 'skill_iron_wall', skill2: 'skill_tiger',   artAsset: 'card_df_001', description: '金刚不坏之体', dribble: 48, passing: 55, shooting: 40, tackling: 95, intercept: 90, blocking: 92, goalkeeping: 0 },
  { id: 'ai_fw_05', name: '龙啸天', position: 'FWD', star: 5, attack: 95, defense: 28, speed: 90, technique: 92, skill1: 'skill_thunder',   skill2: 'skill_freekick', artAsset: 'card_fw_001', description: '龙啸九天，天下无敌', dribble: 92, passing: 70, shooting: 95, tackling: 25, intercept: 22, blocking: 18, goalkeeping: 0 },
];

const SKILLS: SkillDef[] = [
  { id: 'skill_save',      name: '神扑',       description: '关键时刻扑出必进球',       type: 'passive', target: 'self', effectType: 'buff_defense',   effectValue: 15, duration: 0, triggerCondition: 'on_shot',   animKey: 'anim_save',       cooldown: 0 },
  { id: 'skill_tackle',    name: '飞铲',       description: '凶猛的铲断技术',           type: 'passive', target: 'self', effectType: 'buff_defense',   effectValue: 12, duration: 0, triggerCondition: 'on_tackle', animKey: 'anim_tackle',     cooldown: 0 },
  { id: 'skill_shot',      name: '暴力射门',   description: '蓄力射出势大力沉的射门',   type: 'active',  target: 'self', effectType: 'buff_attack',    effectValue: 20, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_power_shot', cooldown: 3 },
  { id: 'skill_dribble',   name: '灵巧过人',   description: '闪转腾挪突破防线',         type: 'active',  target: 'self', effectType: 'buff_speed',     effectValue: 18, duration: 1, triggerCondition: 'on_pass',   animKey: 'anim_dribble',    cooldown: 2 },
  { id: 'skill_through',   name: '致命直塞',   description: '一脚精准直塞撕裂防线',     type: 'active',  target: 'team', effectType: 'buff_technique', effectValue: 15, duration: 2, triggerCondition: 'on_pass',   animKey: 'anim_through',    cooldown: 3 },
  { id: 'skill_freekick',  name: '任意球大师', description: '定位球直挂死角',           type: 'active',  target: 'self', effectType: 'buff_technique', effectValue: 25, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_freekick',   cooldown: 5 },
  { id: 'skill_iron_wall', name: '铁壁防守',   description: '铜墙铁壁固若金汤',         type: 'passive', target: 'self', effectType: 'buff_defense',   effectValue: 18, duration: 0, triggerCondition: 'on_tackle', animKey: 'anim_iron_wall',  cooldown: 0 },
  { id: 'skill_thunder',   name: '雷霆射门',   description: '如雷霆般的暴力远射',       type: 'active',  target: 'self', effectType: 'buff_attack',    effectValue: 25, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_thunder',    cooldown: 4 },
  { id: 'skill_shadow',    name: '鬼影步法',   description: '身法诡异让对手无法捕捉',   type: 'active',  target: 'self', effectType: 'buff_speed',     effectValue: 22, duration: 1, triggerCondition: 'on_pass',   animKey: 'anim_shadow',     cooldown: 3 },
  { id: 'skill_eagle',     name: '鹰眼长传',   description: '精准的长距离传球找到队友', type: 'active',  target: 'team', effectType: 'buff_technique', effectValue: 18, duration: 2, triggerCondition: 'on_pass',   animKey: 'anim_eagle',      cooldown: 3 },
  { id: 'skill_dragon',    name: '龙门飞渡',   description: '化身蛟龙飞扑封堵一切射门', type: 'active',  target: 'self', effectType: 'buff_defense',   effectValue: 30, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_dragon',     cooldown: 5 },
  { id: 'skill_tiger',     name: '猛虎断球',   description: '如猛虎下山般凶猛断球',     type: 'active',  target: 'self', effectType: 'buff_defense',   effectValue: 20, duration: 1, triggerCondition: 'on_tackle', animKey: 'anim_tiger',      cooldown: 3 },
];

const AI_TEAMS: AITeamDef[] = [
  {
    teamId: 'ai_team_001', teamName: '菜鸟练习队', difficulty: 1,
    slots: [
      { cardId: 'ai_gk_01', x: 0.05, y: 0.50 },
      { cardId: 'ai_df_01', x: 0.20, y: 0.50 },
      { cardId: 'ai_mf_01', x: 0.42, y: 0.35 },
      { cardId: 'ai_mf_02', x: 0.42, y: 0.65 },
      { cardId: 'ai_fw_01', x: 0.68, y: 0.50 },
    ],
  },
  {
    teamId: 'ai_team_002', teamName: '街头霸王队', difficulty: 2,
    slots: [
      { cardId: 'ai_gk_01', x: 0.05, y: 0.50 },
      { cardId: 'ai_df_01', x: 0.20, y: 0.30 },
      { cardId: 'ai_df_02', x: 0.20, y: 0.70 },
      { cardId: 'ai_mf_02', x: 0.42, y: 0.35 },
      { cardId: 'ai_mf_03', x: 0.42, y: 0.65 },
      { cardId: 'ai_fw_02', x: 0.68, y: 0.50 },
    ],
  },
  {
    teamId: 'ai_team_003', teamName: '武当少年队', difficulty: 3,
    slots: [
      { cardId: 'ai_gk_02', x: 0.05, y: 0.50 },
      { cardId: 'ai_df_02', x: 0.20, y: 0.30 },
      { cardId: 'ai_df_03', x: 0.20, y: 0.70 },
      { cardId: 'ai_mf_03', x: 0.42, y: 0.30 },
      { cardId: 'ai_mf_04', x: 0.42, y: 0.70 },
      { cardId: 'ai_fw_02', x: 0.68, y: 0.35 },
      { cardId: 'ai_fw_03', x: 0.68, y: 0.65 },
    ],
  },
  {
    teamId: 'ai_team_004', teamName: '少林精英队', difficulty: 4,
    slots: [
      { cardId: 'ai_gk_02', x: 0.05, y: 0.50 },
      { cardId: 'ai_df_03', x: 0.20, y: 0.30 },
      { cardId: 'ai_df_04', x: 0.20, y: 0.70 },
      { cardId: 'ai_mf_04', x: 0.42, y: 0.30 },
      { cardId: 'ai_mf_05', x: 0.42, y: 0.70 },
      { cardId: 'ai_fw_03', x: 0.68, y: 0.35 },
      { cardId: 'ai_fw_04', x: 0.68, y: 0.65 },
    ],
  },
  {
    teamId: 'ai_team_005', teamName: '天下第一队', difficulty: 5,
    slots: [
      { cardId: 'ai_gk_03', x: 0.05, y: 0.50 },
      { cardId: 'ai_df_04', x: 0.20, y: 0.30 },
      { cardId: 'ai_df_05', x: 0.20, y: 0.70 },
      { cardId: 'ai_mf_05', x: 0.42, y: 0.30 },
      { cardId: 'ai_mf_04', x: 0.42, y: 0.70 },
      { cardId: 'ai_fw_04', x: 0.68, y: 0.35 },
      { cardId: 'ai_fw_05', x: 0.68, y: 0.65 },
    ],
  },
];

const STAGES: StageDef[] = [
  { stageId: 'stage_001', name: '新手试炼', aiTeamId: 'ai_team_001', unlockAfterStage: '',          rewardCardId: 'mf_003', rewardCoins: 100,  description: '你的第一场比赛，击败菜鸟队证明实力' },
  { stageId: 'stage_002', name: '街头争霸', aiTeamId: 'ai_team_002', unlockAfterStage: 'stage_001', rewardCardId: 'df_003', rewardCoins: 200,  description: '街头混混来势汹汹，小心应对' },
  { stageId: 'stage_003', name: '武林大会', aiTeamId: 'ai_team_003', unlockAfterStage: 'stage_002', rewardCardId: 'fw_003', rewardCoins: 350,  description: '武当少年队功力深厚，硬仗开始' },
  { stageId: 'stage_004', name: '少林争锋', aiTeamId: 'ai_team_004', unlockAfterStage: 'stage_003', rewardCardId: 'gk_002', rewardCoins: 500,  description: '少林精英全员出击，生死一战' },
  { stageId: 'stage_005', name: '天下第一', aiTeamId: 'ai_team_005', unlockAfterStage: 'stage_004', rewardCardId: 'fw_005', rewardCoins: 1000, description: '终极挑战！击败天下第一队登顶巅峰' },
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
    console.log('[MockDataManager] init() — 使用内嵌 Mock 数据');
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
