import type { Team, TeamSlot } from '../models/Team.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class FormationValidator {
  static readonly MIN_PLAYERS = 5;
  static readonly MAX_PLAYERS = 7;

  validate(team: Team): ValidationResult {
    const errors: string[] = [];

    if (team.formation.length < FormationValidator.MIN_PLAYERS) {
      errors.push(`需要至少 ${FormationValidator.MIN_PLAYERS} 名球员`);
    }
    if (team.formation.length > FormationValidator.MAX_PLAYERS) {
      errors.push(`最多 ${FormationValidator.MAX_PLAYERS} 名球员`);
    }

    const gkCount = team.formation.filter((s) => s.card.position === 'GK').length;
    if (gkCount !== 1) {
      errors.push(`必须有且仅有 1 名守门员，当前 ${gkCount} 名`);
    }

    const ids = team.formation.map((s) => s.card.id);
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      errors.push('不能重复使用同一球员');
    }

    if (this.hasOverlap(team.formation)) {
      errors.push('球员位置不能重叠');
    }

    return { valid: errors.length === 0, errors };
  }

  private hasOverlap(slots: TeamSlot[]): boolean {
    const threshold = 0.05;
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const dx = slots[i].x - slots[j].x;
        const dy = slots[i].y - slots[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return true;
      }
    }
    return false;
  }
}
