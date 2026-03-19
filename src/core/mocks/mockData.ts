import type { CardDef, SkillDef, AITeamDef, StageDef, BalanceEntry } from '../data/schemas.ts';
import type { MatchEvent } from '../models/MatchEvent.ts';
import type { MatchResult } from '../models/MatchResult.ts';
import type { Team } from '../models/Team.ts';

// ---------------------------------------------------------------------------
// 真实卡牌数据（ID 与 generated/cards.json 一致，供 MockDataManager 使用）
// ---------------------------------------------------------------------------

export const MOCK_CARDS: CardDef[] = [
  { id: 'gk_001',  name: '李守门', position: 'GK',  star: 3, attack: 20, defense: 85, speed: 50, technique: 55, skill1: 'skill_save',    skill2: '',             artAsset: 'card_gk_001', description: '稳健守门员' },
  { id: 'df_001',  name: '张铁壁', position: 'DEF', star: 3, attack: 35, defense: 80, speed: 55, technique: 50, skill1: 'skill_tackle',  skill2: '',             artAsset: 'card_df_001', description: '坚固后卫' },
  { id: 'df_002',  name: '王坚盾', position: 'DEF', star: 2, attack: 30, defense: 75, speed: 60, technique: 45, skill1: 'skill_tackle',  skill2: '',             artAsset: 'card_df_002', description: '快速后卫' },
  { id: 'mf_001',  name: '陈中场', position: 'MID', star: 3, attack: 60, defense: 60, speed: 70, technique: 75, skill1: 'skill_through', skill2: '',             artAsset: 'card_mf_001', description: '全能中场' },
  { id: 'mf_002',  name: '刘组织', position: 'MID', star: 4, attack: 55, defense: 55, speed: 65, technique: 85, skill1: 'skill_through', skill2: 'skill_freekick', artAsset: 'card_mf_002', description: '组织核心' },
  { id: 'fw_001',  name: '赵射手', position: 'FWD', star: 4, attack: 88, defense: 25, speed: 80, technique: 78, skill1: 'skill_shot',    skill2: 'skill_dribble', artAsset: 'card_fw_001', description: '锋线杀手' },
  { id: 'fw_002',  name: '孙飞翼', position: 'FWD', star: 3, attack: 75, defense: 30, speed: 90, technique: 70, skill1: 'skill_dribble', skill2: '',             artAsset: 'card_fw_002', description: '极速边锋' },
  { id: 'fw_003',  name: '周重炮', position: 'FWD', star: 5, attack: 95, defense: 20, speed: 70, technique: 88, skill1: 'skill_shot',    skill2: 'skill_freekick', artAsset: 'card_fw_003', description: '传奇射手' },
];

export const MOCK_SKILLS: SkillDef[] = [
  { id: 'skill_save',     name: '神扑',       description: '提升扑救成功率',     type: 'passive', target: 'self',  effectType: 'buff_defense',   effectValue: 15, duration: 0, triggerCondition: 'on_shot',   animKey: 'anim_save',       cooldown: 0 },
  { id: 'skill_tackle',   name: '飞铲',       description: '提升铲断能力',       type: 'passive', target: 'self',  effectType: 'buff_defense',   effectValue: 12, duration: 0, triggerCondition: 'on_tackle', animKey: 'anim_tackle',     cooldown: 0 },
  { id: 'skill_shot',     name: '暴力射门',   description: '提升射门威力',       type: 'active',  target: 'self',  effectType: 'buff_attack',    effectValue: 20, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_power_shot', cooldown: 3 },
  { id: 'skill_dribble',  name: '灵巧过人',   description: '提升突破成功率',     type: 'active',  target: 'self',  effectType: 'buff_speed',     effectValue: 18, duration: 1, triggerCondition: 'on_pass',   animKey: 'anim_dribble',    cooldown: 2 },
  { id: 'skill_through',  name: '致命直塞',   description: '提升传球精准度',     type: 'active',  target: 'team',  effectType: 'buff_technique', effectValue: 15, duration: 2, triggerCondition: 'on_pass',   animKey: 'anim_through',    cooldown: 3 },
  { id: 'skill_freekick', name: '任意球大师', description: '获得额外定位球机会', type: 'active',  target: 'self',  effectType: 'buff_technique', effectValue: 25, duration: 1, triggerCondition: 'on_shot',   animKey: 'anim_freekick',   cooldown: 5 },
];

// 7 人阵容标准坐标（归一化 0-1）：1 GK + 2 DEF + 2 MID + 2 FWD
//   GK  x=0.05  y=0.50
//   DEF x=0.20  y=0.25 / 0.75
//   MID x=0.45  y=0.25 / 0.75
//   FWD x=0.70  y=0.35 / 0.65

export const MOCK_AI_TEAMS: AITeamDef[] = [
  {
    teamId: 'ai_team_001', teamName: '新手挑战队', difficulty: 1,
    slots: [
      { cardId: 'gk_001',  x: 0.05, y: 0.50 },
      { cardId: 'df_002',  x: 0.20, y: 0.25 },
      { cardId: 'df_001',  x: 0.20, y: 0.75 },
      { cardId: 'mf_001',  x: 0.45, y: 0.25 },
      { cardId: 'mf_002',  x: 0.45, y: 0.75 },
      { cardId: 'fw_002',  x: 0.70, y: 0.35 },
      { cardId: 'fw_001',  x: 0.70, y: 0.65 },
    ],
  },
  {
    teamId: 'ai_team_002', teamName: '实力对手', difficulty: 2,
    slots: [
      { cardId: 'gk_001',  x: 0.05, y: 0.50 },
      { cardId: 'df_001',  x: 0.20, y: 0.25 },
      { cardId: 'df_002',  x: 0.20, y: 0.75 },
      { cardId: 'mf_001',  x: 0.45, y: 0.25 },
      { cardId: 'mf_002',  x: 0.45, y: 0.75 },
      { cardId: 'fw_001',  x: 0.70, y: 0.35 },
      { cardId: 'fw_002',  x: 0.70, y: 0.65 },
    ],
  },
  {
    teamId: 'ai_team_003', teamName: '精英劲旅', difficulty: 3,
    slots: [
      { cardId: 'gk_001',  x: 0.05, y: 0.50 },
      { cardId: 'df_001',  x: 0.20, y: 0.25 },
      { cardId: 'df_002',  x: 0.20, y: 0.75 },
      { cardId: 'mf_001',  x: 0.45, y: 0.25 },
      { cardId: 'mf_002',  x: 0.45, y: 0.75 },
      { cardId: 'fw_001',  x: 0.70, y: 0.35 },
      { cardId: 'fw_003',  x: 0.70, y: 0.65 },
    ],
  },
];

export const MOCK_STAGES: StageDef[] = [
  { stageId: 'stage_001', name: '新手试炼',  aiTeamId: 'ai_team_001', unlockAfterStage: '',          rewardCardId: 'mf_001', rewardCoins: 100, description: '你的第一场比赛' },
  { stageId: 'stage_002', name: '城市联赛',  aiTeamId: 'ai_team_002', unlockAfterStage: 'stage_001', rewardCardId: 'fw_001', rewardCoins: 200, description: '面对更强的对手' },
  { stageId: 'stage_003', name: '冠军之路',  aiTeamId: 'ai_team_003', unlockAfterStage: 'stage_002', rewardCardId: 'fw_003', rewardCoins: 500, description: '终极挑战' },
];

export const MOCK_BALANCE: BalanceEntry[] = [
  { key: 'passSuccessBase',  value: 0.7,  type: 'number', description: '基础传球成功率' },
  { key: 'shotPowerWeight',  value: 0.4,  type: 'number', description: '射门力量权重（vs技术）' },
  { key: 'homeAdvantage',    value: 1.05, type: 'number', description: '主场优势系数' },
  { key: 'matchMinutes',     value: 90,   type: 'number', description: '比赛时长（分钟）' },
  { key: 'eventsPerMinute',  value: 0.8,  type: 'number', description: '每分钟事件概率' },
  { key: 'tackleBaseChance', value: 0.3,  type: 'number', description: '基础铲断触发概率' },
  { key: 'shotChance',       value: 0.4,  type: 'number', description: '传球后射门概率' },
];

// ---------------------------------------------------------------------------
// Mock 独立球员（供 MOCK_HOME_TEAM / MOCK_AWAY_TEAM 使用，前缀与真实卡牌分开）
// ---------------------------------------------------------------------------

const P_GK1:  CardDef = { id: 'mock_gk_001', name: '张大保',   position: 'GK',  star: 3, attack: 20, defense: 75, speed: 50, technique: 55, skill1: 'skill_save',    skill2: '',             artAsset: 'card_gk_001', description: '可靠守门员' };
const P_DF1:  CardDef = { id: 'mock_df_001', name: '李铁柱',   position: 'DEF', star: 2, attack: 35, defense: 70, speed: 55, technique: 45, skill1: 'skill_tackle',  skill2: '',             artAsset: 'card_df_001', description: '稳固后卫' };
const P_DF2:  CardDef = { id: 'mock_df_002', name: '王盾牌',   position: 'DEF', star: 2, attack: 30, defense: 68, speed: 60, technique: 42, skill1: 'skill_tackle',  skill2: '',             artAsset: 'card_df_002', description: '快速后卫' };
const P_MF1:  CardDef = { id: 'mock_mf_001', name: '陈传球',   position: 'MID', star: 3, attack: 60, defense: 55, speed: 65, technique: 70, skill1: 'skill_through', skill2: '',             artAsset: 'card_mf_001', description: '创造型中场' };
const P_MF2:  CardDef = { id: 'mock_mf_002', name: '刘控场',   position: 'MID', star: 3, attack: 55, defense: 58, speed: 62, technique: 75, skill1: 'skill_through', skill2: '',             artAsset: 'card_mf_002', description: '防守型中场' };
const P_FW1:  CardDef = { id: 'mock_fw_001', name: '赵射手',   position: 'FWD', star: 4, attack: 85, defense: 25, speed: 80, technique: 75, skill1: 'skill_shot',    skill2: 'skill_dribble', artAsset: 'card_fw_001', description: '速度型前锋' };
const P_FW2:  CardDef = { id: 'mock_fw_002', name: '孙飞翼',   position: 'FWD', star: 3, attack: 78, defense: 20, speed: 88, technique: 65, skill1: 'skill_dribble', skill2: '',             artAsset: 'card_fw_002', description: '极速边锋' };

const A_GK1:  CardDef = { id: 'ai_gk_001',  name: '铁门神',   position: 'GK',  star: 3, attack: 15, defense: 78, speed: 45, technique: 50, skill1: 'skill_save',    skill2: '',             artAsset: 'card_gk_001', description: 'AI守门员' };
const A_DF1:  CardDef = { id: 'ai_df_001',  name: 'AI后卫甲', position: 'DEF', star: 2, attack: 32, defense: 72, speed: 52, technique: 44, skill1: 'skill_tackle',  skill2: '',             artAsset: 'card_df_001', description: 'AI后卫' };
const A_DF2:  CardDef = { id: 'ai_df_002',  name: 'AI后卫乙', position: 'DEF', star: 2, attack: 28, defense: 68, speed: 58, technique: 40, skill1: 'skill_tackle',  skill2: '',             artAsset: 'card_df_002', description: 'AI后卫' };
const A_MF1:  CardDef = { id: 'ai_mf_001',  name: 'AI中场甲', position: 'MID', star: 2, attack: 52, defense: 50, speed: 60, technique: 62, skill1: 'skill_through', skill2: '',             artAsset: 'card_mf_001', description: 'AI中场' };
const A_MF2:  CardDef = { id: 'ai_mf_002',  name: 'AI中场乙', position: 'MID', star: 2, attack: 48, defense: 52, speed: 58, technique: 60, skill1: 'skill_through', skill2: '',             artAsset: 'card_mf_002', description: 'AI中场' };
const A_FW1:  CardDef = { id: 'ai_fw_001',  name: '机器前锋', position: 'FWD', star: 3, attack: 72, defense: 28, speed: 70, technique: 60, skill1: 'skill_shot',    skill2: '',             artAsset: 'card_fw_001', description: 'AI前锋甲' };
const A_FW2:  CardDef = { id: 'ai_fw_002',  name: 'AI快马',   position: 'FWD', star: 2, attack: 65, defense: 22, speed: 82, technique: 55, skill1: 'skill_dribble', skill2: '',             artAsset: 'card_fw_002', description: 'AI前锋乙' };

// ---------------------------------------------------------------------------
// Mock 队伍对象（7v7，供 MockMatchEngine / MatchScene 开发使用）
// ---------------------------------------------------------------------------

export const MOCK_HOME_TEAM: Team = {
  name: '热血FC',
  formation: [
    { card: P_GK1, x: 0.05, y: 0.50 },
    { card: P_DF1, x: 0.20, y: 0.25 },
    { card: P_DF2, x: 0.20, y: 0.75 },
    { card: P_MF1, x: 0.45, y: 0.25 },
    { card: P_MF2, x: 0.45, y: 0.75 },
    { card: P_FW1, x: 0.70, y: 0.35 },
    { card: P_FW2, x: 0.70, y: 0.65 },
  ],
};

export const MOCK_AWAY_TEAM: Team = {
  name: 'AI钢铁队',
  formation: [
    { card: A_GK1, x: 0.95, y: 0.50 },
    { card: A_DF1, x: 0.80, y: 0.25 },
    { card: A_DF2, x: 0.80, y: 0.75 },
    { card: A_MF1, x: 0.55, y: 0.25 },
    { card: A_MF2, x: 0.55, y: 0.75 },
    { card: A_FW1, x: 0.30, y: 0.35 },
    { card: A_FW2, x: 0.30, y: 0.65 },
  ],
};

// ---------------------------------------------------------------------------
// 固定事件序列（供 MockMatchEngine / Mod-D 开发使用）
// ---------------------------------------------------------------------------

export const MOCK_MATCH_EVENTS: MatchEvent[] = [
  { type: 'kickoff', minute: 0 },

  { type: 'pass',   minute: 3,  from: 'mock_mf_001', to: 'mock_fw_001', success: true },
  { type: 'shot',   minute: 3,  player: 'mock_fw_001', onTarget: false },

  { type: 'pass',   minute: 8,  from: 'mock_mf_002', to: 'mock_fw_002', success: true },
  { type: 'shot',   minute: 8,  player: 'mock_fw_002', onTarget: true },
  { type: 'save',   minute: 8,  goalkeeper: 'ai_gk_001' },

  { type: 'pass',   minute: 14, from: 'ai_mf_001', to: 'ai_fw_001', success: true },
  { type: 'tackle', minute: 14, tackler: 'mock_df_001', target: 'ai_fw_001', success: true },

  { type: 'pass',   minute: 19, from: 'mock_mf_001', to: 'mock_fw_001', success: true },
  { type: 'shot',   minute: 19, player: 'mock_fw_001', onTarget: true },
  { type: 'goal',   minute: 19, scorer: 'mock_fw_001', assist: 'mock_mf_001' },

  { type: 'pass',   minute: 27, from: 'mock_mf_002', to: 'mock_fw_002', success: false },

  { type: 'pass',   minute: 33, from: 'ai_mf_002', to: 'ai_fw_001', success: true },
  { type: 'shot',   minute: 33, player: 'ai_fw_001', onTarget: true },
  { type: 'save',   minute: 33, goalkeeper: 'mock_gk_001' },

  { type: 'halftime' },

  { type: 'pass',   minute: 52, from: 'mock_fw_001', to: 'mock_fw_002', success: true },
  { type: 'shot',   minute: 52, player: 'mock_fw_002', onTarget: true },
  { type: 'goal',   minute: 52, scorer: 'mock_fw_002', assist: 'mock_fw_001' },

  { type: 'tackle', minute: 61, tackler: 'mock_df_002', target: 'ai_fw_002', success: false },
  { type: 'pass',   minute: 61, from: 'ai_fw_002', to: 'ai_fw_001', success: true },
  { type: 'shot',   minute: 61, player: 'ai_fw_001', onTarget: true },
  { type: 'goal',   minute: 61, scorer: 'ai_fw_001' },

  { type: 'pass',   minute: 74, from: 'mock_mf_001', to: 'mock_fw_001', success: true },
  { type: 'shot',   minute: 74, player: 'mock_fw_001', onTarget: false },

  { type: 'pass',   minute: 82, from: 'mock_mf_002', to: 'mock_fw_002', success: true },
  { type: 'shot',   minute: 82, player: 'mock_fw_002', onTarget: true },
  { type: 'goal',   minute: 82, scorer: 'mock_fw_002' },

  { type: 'fulltime', homeGoals: 3, awayGoals: 1 },
];

export const MOCK_MATCH_RESULT: MatchResult = {
  homeGoals: 3,
  awayGoals: 1,
  mvpPlayerId: 'mock_fw_002',
  events: MOCK_MATCH_EVENTS,
  homeName: MOCK_HOME_TEAM.name,
  awayName: MOCK_AWAY_TEAM.name,
};
