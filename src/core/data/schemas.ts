export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';
export type StarRating = 1 | 2 | 3 | 4 | 5;
export type SkillType = 'active' | 'passive';
export type SkillTarget = 'self' | 'enemy' | 'team';

export interface CardDef {
  id: string;
  name: string;
  position: Position;
  star: StarRating;
  attack: number;
  defense: number;
  speed: number;
  technique: number;
  skill1: string;
  skill2: string;
  artAsset: string;
  description: string;
  // ── 新增球员属性（UI 展示用） ──────────────────────────────────────────
  dribble: number;      // 带球
  passing: number;      // 传球
  shooting: number;     // 射门
  tackling: number;     // 抢断
  intercept: number;    // 拦截
  blocking: number;     // 封堵
  goalkeeping: number;  // 守门（门将专属有意义值，其余为 0）
}

/** 球场位置槽定义（归一化坐标 0-1） */
export interface SlotDef {
  id: string;
  label: string;
  position: Position;
  nx: number;
  ny: number;
}

/** 阵型配置 */
export interface FormationConfig {
  id: string;
  name: string;   // 显示名，如 "2-2-2"
  def: number;    // 后卫数
  mid: number;    // 中场数
  fwd: number;    // 前锋数（def + mid + fwd 必须 = 6）
  slots: SlotDef[];
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  target: SkillTarget;
  effectType: string;
  effectValue: number;
  duration: number;
  triggerCondition: string;
  animKey: string;
  cooldown: number;
}

export interface AITeamSlotDef {
  cardId: string;
  x: number;
  y: number;
}

export interface AITeamDef {
  teamId: string;
  teamName: string;
  difficulty: StarRating;
  slots: AITeamSlotDef[];
}

export interface StageDef {
  stageId: string;
  name: string;
  aiTeamId: string;
  unlockAfterStage: string;
  rewardCardId: string;
  rewardCoins: number;
  description: string;
}

export interface BalanceEntry {
  key: string;
  value: number | string | boolean;
  type: 'number' | 'string' | 'boolean';
  description: string;
}

export interface AssetManifestEntry {
  key: string;
  path: string;
  width: number;
  height: number;
  category: 'card' | 'pitch' | 'ui' | 'effect';
  required: boolean;
  description: string;
}
