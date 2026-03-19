import type {
  CardDef,
  SkillDef,
  AITeamDef,
  StageDef,
  AssetManifestEntry,
  Position,
} from './schemas.ts';

export interface IDataManager {
  getCard(id: string): CardDef;
  getCardsByPosition(pos: Position): CardDef[];
  getAllCards(): CardDef[];
  getSkill(id: string): SkillDef;
  getAllSkills(): SkillDef[];
  getAITeam(teamId: string): AITeamDef;
  getStage(stageId: string): StageDef;
  getAllStages(): StageDef[];
  getBalance<T extends number | string | boolean>(key: string): T;
  getAssetManifest(): AssetManifestEntry[];
  getAssetEntry(key: string): AssetManifestEntry | undefined;
}
