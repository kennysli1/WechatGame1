import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../storage/SaveManager.ts';
import { MockPlatform } from '../core/mocks/MockPlatform.ts';

describe('SaveManager', () => {
  let platform: MockPlatform;
  let mgr: SaveManager;

  beforeEach(() => {
    platform = new MockPlatform();
    mgr = new SaveManager(platform);
  });

  describe('initial state (before load)', () => {
    it('starts with empty owned cards', () => {
      expect(mgr.ownedCardIds).toEqual([]);
    });

    it('starts with empty completed stages', () => {
      expect(mgr.completedStageIds).toEqual([]);
    });

    it('starts with 0 coins', () => {
      expect(mgr.coins).toBe(0);
    });

    it('starts with null formation', () => {
      expect(mgr.lastFormation).toBeNull();
    });
  });

  describe('load()', () => {
    it('loads default data when storage is empty', () => {
      mgr.load();
      expect(mgr.ownedCardIds).toEqual([]);
      expect(mgr.coins).toBe(0);
    });

    it('restores previously saved data', () => {
      mgr.addCard('card_001');
      mgr.addCoins(500);
      mgr.completeStage('stage_01');

      const mgr2 = new SaveManager(platform);
      mgr2.load();
      expect(mgr2.ownedCardIds).toContain('card_001');
      expect(mgr2.coins).toBe(500);
      expect(mgr2.completedStageIds).toContain('stage_01');
    });

    it('handles corrupt JSON gracefully', () => {
      platform.storageSet('kungfu_football_save', '{not valid json!!!');
      mgr.load();
      expect(mgr.ownedCardIds).toEqual([]);
      expect(mgr.coins).toBe(0);
    });

    it('merges partial save data with defaults', () => {
      platform.storageSet('kungfu_football_save', JSON.stringify({ version: 1, coins: 42 }));
      mgr.load();
      expect(mgr.coins).toBe(42);
      expect(mgr.ownedCardIds).toEqual([]);
      expect(mgr.lastFormation).toBeNull();
    });
  });

  describe('addCard()', () => {
    it('adds a card id', () => {
      mgr.addCard('fw_001');
      expect(mgr.ownedCardIds).toContain('fw_001');
    });

    it('does not duplicate card ids', () => {
      mgr.addCard('fw_001');
      mgr.addCard('fw_001');
      expect(mgr.ownedCardIds.filter((id) => id === 'fw_001')).toHaveLength(1);
    });

    it('auto-saves after add', () => {
      mgr.addCard('fw_001');
      const mgr2 = new SaveManager(platform);
      mgr2.load();
      expect(mgr2.ownedCardIds).toContain('fw_001');
    });
  });

  describe('completeStage()', () => {
    it('marks a stage as completed', () => {
      mgr.completeStage('stage_01');
      expect(mgr.completedStageIds).toContain('stage_01');
    });

    it('does not duplicate stage ids', () => {
      mgr.completeStage('stage_01');
      mgr.completeStage('stage_01');
      expect(mgr.completedStageIds.filter((id) => id === 'stage_01')).toHaveLength(1);
    });

    it('auto-saves after completion', () => {
      mgr.completeStage('stage_02');
      const mgr2 = new SaveManager(platform);
      mgr2.load();
      expect(mgr2.completedStageIds).toContain('stage_02');
    });
  });

  describe('coins', () => {
    it('adds positive coins', () => {
      mgr.addCoins(100);
      expect(mgr.coins).toBe(100);
    });

    it('accumulates across multiple adds', () => {
      mgr.addCoins(100);
      mgr.addCoins(50);
      expect(mgr.coins).toBe(150);
    });

    it('auto-saves after add', () => {
      mgr.addCoins(200);
      const mgr2 = new SaveManager(platform);
      mgr2.load();
      expect(mgr2.coins).toBe(200);
    });
  });

  describe('lastFormation', () => {
    const formation = [
      { cardId: 'gk_001', x: 0.5, y: 0.9 },
      { cardId: 'df_001', x: 0.3, y: 0.7 },
      { cardId: 'fw_001', x: 0.5, y: 0.2 },
    ];

    it('stores and retrieves a formation', () => {
      mgr.setLastFormation(formation);
      expect(mgr.lastFormation).toEqual(formation);
    });

    it('auto-saves after set', () => {
      mgr.setLastFormation(formation);
      const mgr2 = new SaveManager(platform);
      mgr2.load();
      expect(mgr2.lastFormation).toEqual(formation);
    });

    it('can overwrite formation', () => {
      mgr.setLastFormation(formation);
      const newFormation = [{ cardId: 'mf_001', x: 0.5, y: 0.5 }];
      mgr.setLastFormation(newFormation);
      expect(mgr.lastFormation).toEqual(newFormation);
    });
  });

  describe('reset()', () => {
    it('clears all data to defaults', () => {
      mgr.addCard('fw_001');
      mgr.addCoins(999);
      mgr.completeStage('stage_01');
      mgr.setLastFormation([{ cardId: 'gk_001', x: 0.5, y: 0.9 }]);

      mgr.reset();

      expect(mgr.ownedCardIds).toEqual([]);
      expect(mgr.coins).toBe(0);
      expect(mgr.completedStageIds).toEqual([]);
      expect(mgr.lastFormation).toBeNull();
    });

    it('removes data from storage', () => {
      mgr.addCard('fw_001');
      mgr.reset();

      const mgr2 = new SaveManager(platform);
      mgr2.load();
      expect(mgr2.ownedCardIds).toEqual([]);
    });
  });

  describe('save() / load() round-trip', () => {
    it('preserves full state across save-load cycle', () => {
      mgr.addCard('fw_001');
      mgr.addCard('mf_002');
      mgr.addCoins(1234);
      mgr.completeStage('stage_01');
      mgr.completeStage('stage_02');
      mgr.setLastFormation([
        { cardId: 'gk_001', x: 0.5, y: 0.9 },
        { cardId: 'fw_001', x: 0.5, y: 0.1 },
      ]);

      const mgr2 = new SaveManager(platform);
      mgr2.load();

      expect(mgr2.ownedCardIds).toEqual(['fw_001', 'mf_002']);
      expect(mgr2.coins).toBe(1234);
      expect(mgr2.completedStageIds).toEqual(['stage_01', 'stage_02']);
      expect(mgr2.lastFormation).toEqual([
        { cardId: 'gk_001', x: 0.5, y: 0.9 },
        { cardId: 'fw_001', x: 0.5, y: 0.1 },
      ]);
    });
  });
});
