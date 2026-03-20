import type { CardDef, SkillDef, AITeamDef, StageDef, BalanceEntry } from '../data/schemas.ts';
import type { MatchEvent } from '../models/MatchEvent.ts';
import type { MatchResult } from '../models/MatchResult.ts';
import type { Team } from '../models/Team.ts';

// ---------------------------------------------------------------------------
// 真实卡牌数据（与 generated/cards.json 中的玩家初始卡一致）
// ---------------------------------------------------------------------------

export const MOCK_CARDS: CardDef[] = [
  { id: 'gk_001', name: '李守门', position: 'GK',  star: 3, attack: 20, defense: 85, speed: 50, technique: 55, skill1: 'skill_save',    skill2: '',              artAsset: 'card_gk_001', description: '少林守门僧，铜皮铁骨守龙门', dribble: 20, passing: 30, shooting: 10, tackling: 30, intercept: 25, blocking: 65, goalkeeping: 85 },
  { id: 'df_001', name: '张铁壁', position: 'DEF', star: 3, attack: 35, defense: 80, speed: 55, technique: 50, skill1: 'skill_tackle',  skill2: 'skill_iron_wall', artAsset: 'card_df_001', description: '铁布衫传人，防守固若金汤', dribble: 35, passing: 40, shooting: 30, tackling: 80, intercept: 75, blocking: 78, goalkeeping: 0 },
  { id: 'df_002', name: '王坚盾', position: 'DEF', star: 2, attack: 30, defense: 72, speed: 62, technique: 45, skill1: 'skill_tackle',  skill2: '',              artAsset: 'card_df_002', description: '金钟罩弟子，速度型后卫', dribble: 40, passing: 45, shooting: 28, tackling: 70, intercept: 68, blocking: 62, goalkeeping: 0 },
  { id: 'mf_001', name: '陈中场', position: 'MID', star: 3, attack: 60, defense: 60, speed: 70, technique: 75, skill1: 'skill_through', skill2: '',              artAsset: 'card_mf_001', description: '太极拳新秀，攻守兼备', dribble: 65, passing: 72, shooting: 55, tackling: 58, intercept: 55, blocking: 40, goalkeeping: 0 },
  { id: 'mf_002', name: '林快腿', position: 'MID', star: 2, attack: 50, defense: 48, speed: 78, technique: 62, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_mf_002', description: '迷踪步小子，速度见长', dribble: 70, passing: 58, shooting: 48, tackling: 48, intercept: 45, blocking: 32, goalkeeping: 0 },
  { id: 'fw_001', name: '赵射手', position: 'FWD', star: 3, attack: 78, defense: 25, speed: 75, technique: 70, skill1: 'skill_shot',    skill2: '',              artAsset: 'card_fw_001', description: '佛山无影脚，射门精准', dribble: 72, passing: 55, shooting: 78, tackling: 25, intercept: 20, blocking: 18, goalkeeping: 0 },
  { id: 'fw_002', name: '孙飞翼', position: 'FWD', star: 2, attack: 62, defense: 28, speed: 85, technique: 58, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_fw_002', description: '燕青拳新星，极速边路', dribble: 78, passing: 50, shooting: 62, tackling: 22, intercept: 18, blocking: 15, goalkeeping: 0 },
  { id: 'fw_003', name: '周重炮', position: 'FWD', star: 4, attack: 88, defense: 22, speed: 72, technique: 82, skill1: 'skill_shot',    skill2: 'skill_thunder', artAsset: 'card_fw_003', description: '降龙十八脚，射门势大力沉', dribble: 75, passing: 60, shooting: 88, tackling: 20, intercept: 18, blocking: 15, goalkeeping: 0 },
];

export const MOCK_SKILLS: SkillDef[] = [
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

export const MOCK_AI_TEAMS: AITeamDef[] = [
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

export const MOCK_STAGES: StageDef[] = [
  { stageId: 'stage_001', name: '新手试炼', aiTeamId: 'ai_team_001', unlockAfterStage: '',          rewardCardId: 'mf_003', rewardCoins: 100,  description: '你的第一场比赛，击败菜鸟队证明实力' },
  { stageId: 'stage_002', name: '街头争霸', aiTeamId: 'ai_team_002', unlockAfterStage: 'stage_001', rewardCardId: 'df_003', rewardCoins: 200,  description: '街头混混来势汹汹，小心应对' },
  { stageId: 'stage_003', name: '武林大会', aiTeamId: 'ai_team_003', unlockAfterStage: 'stage_002', rewardCardId: 'fw_003', rewardCoins: 350,  description: '武当少年队功力深厚，硬仗开始' },
  { stageId: 'stage_004', name: '少林争锋', aiTeamId: 'ai_team_004', unlockAfterStage: 'stage_003', rewardCardId: 'gk_002', rewardCoins: 500,  description: '少林精英全员出击，生死一战' },
  { stageId: 'stage_005', name: '天下第一', aiTeamId: 'ai_team_005', unlockAfterStage: 'stage_004', rewardCardId: 'fw_005', rewardCoins: 1000, description: '终极挑战！击败天下第一队登顶巅峰' },
];

export const MOCK_BALANCE: BalanceEntry[] = [
  { key: 'passSuccessBase',     value: 0.7,  type: 'number', description: '基础传球成功率' },
  { key: 'shotPowerWeight',     value: 0.4,  type: 'number', description: '射门力量权重（vs技术）' },
  { key: 'homeAdvantage',       value: 1.05, type: 'number', description: '主场优势系数' },
  { key: 'matchMinutes',        value: 90,   type: 'number', description: '比赛时长（分钟）' },
  { key: 'eventsPerMinute',     value: 0.8,  type: 'number', description: '每分钟事件概率' },
  { key: 'tackleBaseChance',    value: 0.3,  type: 'number', description: '铲断成功率基础参数' },
  { key: 'shotChance',          value: 0.4,  type: 'number', description: '传球后射门概率' },
  { key: 'dribbleBaseSuccess',  value: 0.55, type: 'number', description: '带球过人基础成功率' },
  { key: 'interceptBaseChance', value: 0.40, type: 'number', description: '防守方尝试拦截传球的概率' },
  { key: 'blockBaseChance',     value: 0.25, type: 'number', description: '防守方尝试封堵射门的概率' },
];

// ---------------------------------------------------------------------------
// Mock 独立球员（供 MOCK_HOME_TEAM / MOCK_AWAY_TEAM 使用，前缀与真实卡牌分开）
// ---------------------------------------------------------------------------

const P_GK1: CardDef = { id: 'mock_gk_001', name: '李守门', position: 'GK',  star: 3, attack: 20, defense: 85, speed: 50, technique: 55, skill1: 'skill_save',    skill2: '',              artAsset: 'card_gk_001', description: '少林守门僧', dribble: 20, passing: 30, shooting: 10, tackling: 30, intercept: 25, blocking: 65, goalkeeping: 85 };
const P_DF1: CardDef = { id: 'mock_df_001', name: '张铁壁', position: 'DEF', star: 3, attack: 35, defense: 80, speed: 55, technique: 50, skill1: 'skill_tackle',  skill2: 'skill_iron_wall', artAsset: 'card_df_001', description: '铁布衫传人', dribble: 35, passing: 40, shooting: 30, tackling: 80, intercept: 75, blocking: 78, goalkeeping: 0 };
const P_DF2: CardDef = { id: 'mock_df_002', name: '王坚盾', position: 'DEF', star: 2, attack: 30, defense: 72, speed: 62, technique: 45, skill1: 'skill_tackle',  skill2: '',              artAsset: 'card_df_002', description: '金钟罩弟子', dribble: 40, passing: 45, shooting: 28, tackling: 70, intercept: 68, blocking: 62, goalkeeping: 0 };
const P_MF1: CardDef = { id: 'mock_mf_001', name: '陈中场', position: 'MID', star: 3, attack: 60, defense: 60, speed: 70, technique: 75, skill1: 'skill_through', skill2: '',              artAsset: 'card_mf_001', description: '太极拳新秀', dribble: 65, passing: 72, shooting: 55, tackling: 58, intercept: 55, blocking: 40, goalkeeping: 0 };
const P_MF2: CardDef = { id: 'mock_mf_002', name: '林快腿', position: 'MID', star: 2, attack: 50, defense: 48, speed: 78, technique: 62, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_mf_002', description: '迷踪步小子', dribble: 70, passing: 58, shooting: 48, tackling: 48, intercept: 45, blocking: 32, goalkeeping: 0 };
const P_FW1: CardDef = { id: 'mock_fw_001', name: '赵射手', position: 'FWD', star: 3, attack: 78, defense: 25, speed: 75, technique: 70, skill1: 'skill_shot',    skill2: '',              artAsset: 'card_fw_001', description: '佛山无影脚', dribble: 72, passing: 55, shooting: 78, tackling: 25, intercept: 20, blocking: 18, goalkeeping: 0 };
const P_FW2: CardDef = { id: 'mock_fw_002', name: '孙飞翼', position: 'FWD', star: 2, attack: 62, defense: 28, speed: 85, technique: 58, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_fw_002', description: '燕青拳新星', dribble: 78, passing: 50, shooting: 62, tackling: 22, intercept: 18, blocking: 15, goalkeeping: 0 };

const A_GK1: CardDef = { id: 'ai_gk_001',  name: '何小门',   position: 'GK',  star: 1, attack: 10, defense: 45, speed: 30, technique: 28, skill1: 'skill_save',    skill2: '',              artAsset: 'card_gk_001', description: '菜鸟守门员', dribble: 10, passing: 15, shooting: 5,  tackling: 15, intercept: 12, blocking: 30, goalkeeping: 45 };
const A_DF1: CardDef = { id: 'ai_df_001',  name: '胡矮墙',   position: 'DEF', star: 1, attack: 18, defense: 42, speed: 32, technique: 25, skill1: 'skill_tackle',  skill2: '',              artAsset: 'card_df_001', description: '新手后卫',   dribble: 18, passing: 22, shooting: 15, tackling: 42, intercept: 38, blocking: 35, goalkeeping: 0 };
const A_DF2: CardDef = { id: 'ai_df_002',  name: '许蛮力',   position: 'DEF', star: 2, attack: 28, defense: 58, speed: 42, technique: 35, skill1: 'skill_tackle',  skill2: '',              artAsset: 'card_df_002', description: '蛮力后卫',   dribble: 28, passing: 32, shooting: 22, tackling: 58, intercept: 52, blocking: 50, goalkeeping: 0 };
const A_MF1: CardDef = { id: 'ai_mf_001',  name: '曹学徒',   position: 'MID', star: 1, attack: 28, defense: 25, speed: 35, technique: 32, skill1: '',              skill2: '',              artAsset: 'card_mf_001', description: '初入江湖',   dribble: 30, passing: 32, shooting: 25, tackling: 25, intercept: 22, blocking: 18, goalkeeping: 0 };
const A_MF2: CardDef = { id: 'ai_mf_002',  name: '韩旋风',   position: 'MID', star: 1, attack: 30, defense: 22, speed: 40, technique: 35, skill1: 'skill_dribble', skill2: '',              artAsset: 'card_mf_002', description: '旋转少年',   dribble: 38, passing: 28, shooting: 28, tackling: 22, intercept: 20, blocking: 15, goalkeeping: 0 };
const A_FW1: CardDef = { id: 'ai_fw_001',  name: '黄毛头',   position: 'FWD', star: 1, attack: 38, defense: 12, speed: 42, technique: 30, skill1: 'skill_shot',    skill2: '',              artAsset: 'card_fw_001', description: '冲劲十足',   dribble: 35, passing: 22, shooting: 38, tackling: 12, intercept: 10, blocking: 8,  goalkeeping: 0 };
const A_FW2: CardDef = { id: 'ai_fw_002',  name: '魏快刀',   position: 'FWD', star: 2, attack: 55, defense: 18, speed: 60, technique: 45, skill1: 'skill_shot',    skill2: '',              artAsset: 'card_fw_002', description: '快刀前锋',   dribble: 52, passing: 35, shooting: 55, tackling: 18, intercept: 15, blocking: 12, goalkeeping: 0 };

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
  name: 'AI菜鸟队',
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
