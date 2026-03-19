import type { IPlatform } from '../platform/IPlatform.ts';

interface SaveData {
  version: number;
  ownedCardIds: string[];
  completedStageIds: string[];
  coins: number;
  lastFormation: { cardId: string; x: number; y: number }[] | null;
}

const SAVE_KEY = 'kungfu_football_save';
const CURRENT_VERSION = 1;

function defaultSave(): SaveData {
  return {
    version: CURRENT_VERSION,
    ownedCardIds: [],
    completedStageIds: [],
    coins: 0,
    lastFormation: null,
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
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SaveData;
      this.data = { ...defaultSave(), ...parsed };
    } catch {
      console.warn('[SaveManager] corrupt save data, resetting');
      this.data = defaultSave();
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
}
