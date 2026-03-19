import type { DataManager } from '../data/DataManager.ts';
import type { Team, TeamSlot } from '../models/Team.ts';
import type { AITeamDef } from '../data/schemas.ts';

export class AIOpponent {
  constructor(private data: DataManager) {}

  generateTeam(stageId: string): Team {
    const stage = this.data.getStage(stageId);
    const aiTeamDef = this.data.getAITeam(stage.aiTeamId);
    return this.buildTeam(aiTeamDef);
  }

  generateTeamById(teamId: string): Team {
    const aiTeamDef = this.data.getAITeam(teamId);
    return this.buildTeam(aiTeamDef);
  }

  private buildTeam(def: AITeamDef): Team {
    const formation: TeamSlot[] = def.slots.map((slot) => ({
      card: this.data.getCard(slot.cardId),
      x: slot.x,
      y: slot.y,
    }));

    return {
      name: def.teamName,
      formation,
    };
  }
}
