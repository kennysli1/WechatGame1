import type { IPlatform } from '../platform/IPlatform.ts';

/** 新玩家初始拥有的 7 张球员卡（1GK + 2DEF + 2MID + 2FWD） */
export const INITIAL_OWNED_CARD_IDS = [
  'gk_001', 'df_001', 'df_002', 'mf_001', 'mf_002', 'fw_001', 'fw_002',
];

interface SaveData {
  version: number;
  ownedCardIds: string[];
  completedStageIds: string[];
  coins: number;
  lastFormation: { cardId: string; x: number; y: number }[] | null;
  selectedFormationId: string;
}

const SAVE_KEY = 'kungfu_football_save';
const CURRENT_VERSION = 2;

function defaultSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    ownedCardIds: [...INITIAL_OWNED_CARD_IDS],
    completedStageIds: [],
    coins: 0,
    lastFormation: null,
    selectedFormationId: 'f_2_2_2',
  };
}

export class SaveManager {
  private data: SaveData;

  constructor(private platform: IPlatform) {
    this.data = defaultSave();
  }

  load(): void {
    const raw = this.platform.storageGet(SAVE_KEY);
    if (!raw) {
      this.data = defaultSave();
      this.save();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SaveData;
      this.data = { ...defaultSave(), ...parsed };
      this.migrate();
    } catch {
      console.warn('[SaveManager] corrupt save data, resetting');
      this.data = defaultSave();
      this.save();
    }
  }

  private migrate(): void {
    const oldVersion = this.data.version ?? 1;
    if (oldVersion < 2) {
      if (this.data.ownedCardIds.length === 0) {
        this.data.ownedCardIds = [...INITIAL_OWNED_CARD_IDS];
      }
      this.data.version = CURRENT_VERSION;
      this.save();
    }
  }

  save(): void {
    this.platform.storageSet(SAVE_KEY, JSON.stringify(this.data));
  }

  reset(): void {
    this.data = defaultSave();
    this.platform.storageRemove(SAVE_KEY);
  }

  get ownedCardIds(): string[] {
    return this.data.ownedCardIds;
  }

  addCard(id: string): void {
    if (!this.data.ownedCardIds.includes(id)) {
      this.data.ownedCardIds.push(id);
      this.save();
    }
  }

  get completedStageIds(): string[] {
    return this.data.completedStageIds;
  }

  completeStage(id: string): void {
    if (!this.data.completedStageIds.includes(id)) {
      this.data.completedStageIds.push(id);
      this.save();
    }
  }

  get coins(): number {
    return this.data.coins;
  }

  addCoins(amount: number): void {
    this.data.coins += amount;
    this.save();
  }

  get lastFormation() {
    return this.data.lastFormation;
  }

  setLastFormation(formation: { cardId: string; x: number; y: number }[]): void {
    this.data.lastFormation = formation;
    this.save();
  }

  get selectedFormationId(): string {
    return this.data.selectedFormationId ?? 'f_2_2_2';
  }

  setSelectedFormationId(id: string): void {
    this.data.selectedFormationId = id;
    this.save();
  }
}
