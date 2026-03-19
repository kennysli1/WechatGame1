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
