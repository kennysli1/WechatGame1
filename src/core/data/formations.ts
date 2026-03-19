import type { FormationConfig, SlotDef, Position } from './schemas.ts';

// ── 工具：根据位置和数量生成均匀分布的槽位 ──────────────────────────────────

type RowDef = { position: Position; nx: number; label: string; count: number };

function buildSlots(rows: RowDef[]): SlotDef[] {
  const slots: SlotDef[] = [];
  let slotIdx = 0;

  for (const row of rows) {
    const ys = evenY(row.count);
    for (let i = 0; i < row.count; i++) {
      slots.push({
        id: `slot_${slotIdx++}`,
        label: row.label,
        position: row.position,
        nx: row.nx,
        ny: ys[i],
      });
    }
  }
  return slots;
}

/** 生成 count 个均匀分布在 [0.18, 0.82] 范围内的 y 坐标 */
function evenY(count: number): number[] {
  if (count === 1) return [0.50];
  if (count === 2) return [0.28, 0.72];
  if (count === 3) return [0.18, 0.50, 0.82];
  // 4+：均匀分布
  return Array.from({ length: count }, (_, i) => 0.15 + i * (0.70 / (count - 1)));
}

// ── 阵型配置 ─────────────────────────────────────────────────────────────────

export const FORMATION_CONFIGS: FormationConfig[] = [
  {
    id: 'f_2_2_2',
    name: '2-2-2',
    def: 2, mid: 2, fwd: 2,
    slots: buildSlots([
      { position: 'GK',  nx: 0.07, label: 'GK',  count: 1 },
      { position: 'DEF', nx: 0.22, label: 'CB',  count: 2 },
      { position: 'MID', nx: 0.45, label: 'CM',  count: 2 },
      { position: 'FWD', nx: 0.70, label: 'FWD', count: 2 },
    ]),
  },
  {
    id: 'f_1_3_2',
    name: '1-3-2',
    def: 1, mid: 3, fwd: 2,
    slots: buildSlots([
      { position: 'GK',  nx: 0.07, label: 'GK',  count: 1 },
      { position: 'DEF', nx: 0.22, label: 'CB',  count: 1 },
      { position: 'MID', nx: 0.42, label: 'CM',  count: 3 },
      { position: 'FWD', nx: 0.70, label: 'FWD', count: 2 },
    ]),
  },
  {
    id: 'f_2_1_3',
    name: '2-1-3',
    def: 2, mid: 1, fwd: 3,
    slots: buildSlots([
      { position: 'GK',  nx: 0.07, label: 'GK',  count: 1 },
      { position: 'DEF', nx: 0.22, label: 'CB',  count: 2 },
      { position: 'MID', nx: 0.45, label: 'CM',  count: 1 },
      { position: 'FWD', nx: 0.68, label: 'FWD', count: 3 },
    ]),
  },
  {
    id: 'f_3_2_1',
    name: '3-2-1',
    def: 3, mid: 2, fwd: 1,
    slots: buildSlots([
      { position: 'GK',  nx: 0.07, label: 'GK',  count: 1 },
      { position: 'DEF', nx: 0.20, label: 'CB',  count: 3 },
      { position: 'MID', nx: 0.43, label: 'CM',  count: 2 },
      { position: 'FWD', nx: 0.70, label: 'FWD', count: 1 },
    ]),
  },
  {
    id: 'f_2_3_1',
    name: '2-3-1',
    def: 2, mid: 3, fwd: 1,
    slots: buildSlots([
      { position: 'GK',  nx: 0.07, label: 'GK',  count: 1 },
      { position: 'DEF', nx: 0.20, label: 'CB',  count: 2 },
      { position: 'MID', nx: 0.42, label: 'CM',  count: 3 },
      { position: 'FWD', nx: 0.70, label: 'FWD', count: 1 },
    ]),
  },
  {
    id: 'f_3_1_2',
    name: '3-1-2',
    def: 3, mid: 1, fwd: 2,
    slots: buildSlots([
      { position: 'GK',  nx: 0.07, label: 'GK',  count: 1 },
      { position: 'DEF', nx: 0.20, label: 'CB',  count: 3 },
      { position: 'MID', nx: 0.45, label: 'CM',  count: 1 },
      { position: 'FWD', nx: 0.70, label: 'FWD', count: 2 },
    ]),
  },
];

export const DEFAULT_FORMATION_ID = 'f_2_2_2';

export function getFormationById(id: string): FormationConfig {
  return FORMATION_CONFIGS.find((f) => f.id === id) ?? FORMATION_CONFIGS[0];
}
