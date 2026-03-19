import type {
  CardDef,
  SkillDef,
  AITeamDef,
  StageDef,
  BalanceEntry,
  AssetManifestEntry,
  Position,
} from './schemas.ts';

export class DataManager {
  private cards = new Map<string, CardDef>();
  private skills = new Map<string, SkillDef>();
  private aiTeams = new Map<string, AITeamDef>();
  private stages = new Map<string, StageDef>();
  private balance = new Map<string, number | string | boolean>();
  private assetManifest = new Map<string, AssetManifestEntry>();

  async init(): Promise<void> {
    const [cardsData, skillsData, aiTeamsData, stagesData, balanceData, manifestData] =
      await Promise.all([
        this.loadJSON<CardDef[]>('cards'),
        this.loadJSON<SkillDef[]>('skills'),
        this.loadJSON<AITeamDef[]>('ai_teams'),
        this.loadJSON<StageDef[]>('stages'),
        this.loadJSON<BalanceEntry[]>('balance'),
        this.loadJSON<AssetManifestEntry[]>('asset_manifest'),
      ]);

    for (const c of cardsData) this.cards.set(c.id, c);
    for (const s of skillsData) this.skills.set(s.id, s);
    for (const t of aiTeamsData) this.aiTeams.set(t.teamId, t);
    for (const s of stagesData) this.stages.set(s.stageId, s);
    for (const b of balanceData) this.balance.set(b.key, b.value);
    for (const m of manifestData) this.assetManifest.set(m.key, m);

    console.log(
      `[DataManager] loaded: ${this.cards.size} cards, ${this.skills.size} skills, ` +
        `${this.aiTeams.size} AI teams, ${this.stages.size} stages, ` +
        `${this.balance.size} balance params, ${this.assetManifest.size} assets`
    );
  }

  private async loadJSON<T>(name: string): Promise<T> {
    const resp = await fetch(`/src/core/data/generated/${name}.json`);
    if (!resp.ok) throw new Error(`Failed to load ${name}.json: ${resp.status}`);
    return resp.json() as Promise<T>;
  }

  getCard(id: string): CardDef {
    const card = this.cards.get(id);
    if (!card) throw new Error(`Card not found: ${id}`);
    return card;
  }

  getCardsByPosition(pos: Position): CardDef[] {
    return [...this.cards.values()].filter((c) => c.position === pos);
  }

  getAllCards(): CardDef[] {
    return [...this.cards.values()];
  }

  getSkill(id: string): SkillDef {
    const skill = this.skills.get(id);
    if (!skill) throw new Error(`Skill not found: ${id}`);
    return skill;
  }

  getAllSkills(): SkillDef[] {
    return [...this.skills.values()];
  }

  getAITeam(teamId: string): AITeamDef {
    const team = this.aiTeams.get(teamId);
    if (!team) throw new Error(`AI team not found: ${teamId}`);
    return team;
  }

  getStage(stageId: string): StageDef {
    const stage = this.stages.get(stageId);
    if (!stage) throw new Error(`Stage not found: ${stageId}`);
    return stage;
  }

  getAllStages(): StageDef[] {
    return [...this.stages.values()];
  }

  getBalance<T extends number | string | boolean>(key: string): T {
    const val = this.balance.get(key);
    if (val === undefined) throw new Error(`Balance key not found: ${key}`);
    return val as T;
  }

  getAssetManifest(): AssetManifestEntry[] {
    return [...this.assetManifest.values()];
  }

  getAssetEntry(key: string): AssetManifestEntry | undefined {
    return this.assetManifest.get(key);
  }
}
