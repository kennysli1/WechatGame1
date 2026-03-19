import type { Team, TeamSlot } from '../models/Team.ts';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class FormationValidator {
  static readonly TEAM_SIZE = 7;
  static readonly GK_COUNT = 1;
  static readonly OUTFIELD_COUNT = 6;

  validate(team: Team): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (team.formation.length !== FormationValidator.TEAM_SIZE) {
      errors.push(
        `阵容必须恰好 ${FormationValidator.TEAM_SIZE} 人（当前 ${team.formation.length} 人）`,
      );
    }

    const gkCount = team.formation.filter(
      (s) => s.card.position === 'GK',
    ).length;
    if (gkCount !== FormationValidator.GK_COUNT) {
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

    const defCount = team.formation.filter(
      (s) => s.card.position === 'DEF',
    ).length;
    const midCount = team.formation.filter(
      (s) => s.card.position === 'MID',
    ).length;
    const fwdCount = team.formation.filter(
      (s) => s.card.position === 'FWD',
    ).length;

    if (defCount === 0) warnings.push('建议至少 1 名后卫');
    if (midCount === 0) warnings.push('建议至少 1 名中场');
    if (fwdCount === 0) warnings.push('建议至少 1 名前锋');

    return { valid: errors.length === 0, errors, warnings };
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
