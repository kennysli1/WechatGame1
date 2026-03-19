import { Application } from 'pixi.js';
import { DataManager } from './core/data/DataManager.ts';
import { AssetManager } from './render/AssetManager.ts';
import { SceneManager } from './render/SceneManager.ts';
import { MenuScene } from './render/scenes/MenuScene.ts';
import { StageSelectScene, type StageInfo } from './render/scenes/StageSelectScene.ts';
import { FormationScene } from './render/scenes/FormationScene.ts';
import { ClubScene } from './render/scenes/ClubScene.ts';
import { MatchScene } from './render/scenes/MatchScene.ts';
import { ResultScene, type ResultSceneData } from './render/scenes/ResultScene.ts';
import { MatchEngine } from './core/systems/MatchEngine.ts';
import { AIOpponent } from './core/systems/AIOpponent.ts';
import { WebPlatform } from './platform/WebPlatform.ts';
import { SaveManager } from './storage/SaveManager.ts';
import type { Team, TeamSlot } from './core/models/Team.ts';

const GAME_WIDTH  = 960;
const GAME_HEIGHT = 640;

async function main() {
  const app = new Application();
  await app.init({
    width:           GAME_WIDTH,
    height:          GAME_HEIGHT,
    backgroundColor: 0x1a1a2e,
    antialias:       true,
    resolution:      window.devicePixelRatio || 1,
    autoDensity:     true,
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.canvas);

  const platform    = new WebPlatform();
  const saveManager = new SaveManager(platform);
  saveManager.load();

  const dataManager = new DataManager();
  await dataManager.init();

  const assetManager = new AssetManager();
  assetManager.setRenderer(app.renderer);

  const matchEngine = new MatchEngine(dataManager);
  const aiOpponent  = new AIOpponent(dataManager);

  const sceneManager = new SceneManager(app);

  let currentStageId: string | null = null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function buildStageInfoList(): StageInfo[] {
    const stages    = dataManager.getAllStages();
    const completed = saveManager.completedStageIds;
    return stages.map((stage) => {
      const aiTeam   = dataManager.getAITeam(stage.aiTeamId);
      const unlocked = !stage.unlockAfterStage || completed.includes(stage.unlockAfterStage);
      return {
        stageId:      stage.stageId,
        name:         stage.name,
        description:  stage.description,
        rewardCoins:  stage.rewardCoins,
        difficulty:   aiTeam.difficulty,
        unlocked,
        completed:    completed.includes(stage.stageId),
      };
    });
  }

  function findNextStageId(afterStageId: string): string | null {
    const stages = dataManager.getAllStages();
    const next   = stages.find((s) => s.unlockAfterStage === afterStageId);
    return next?.stageId ?? null;
  }

  function buildCardNamesMap(): Record<string, string> {
    const names: Record<string, string> = {};
    for (const card of dataManager.getAllCards()) {
      names[card.id] = card.name;
    }
    return names;
  }

  /**
   * Build a Team from the ClubScene-saved lineup.
   * Falls back to FormationScene slots if ClubScene has nothing,
   * and finally to all-cards default lineup.
   */
  function buildPlayerTeam(clubSlots?: TeamSlot[]): Team {
    // Prefer ClubScene's saved slots
    if (clubSlots && clubSlots.length === 7) {
      return { name: '我的球队', formation: clubSlots };
    }

    // Try saved lineup from SaveManager
    const saved = saveManager.lastFormation;
    if (saved && saved.length === 7) {
      const slots: TeamSlot[] = saved.flatMap((sf) => {
        try {
          const card = dataManager.getCard(sf.cardId);
          return [{ card, x: sf.x, y: sf.y }];
        } catch {
          return [];
        }
      });
      if (slots.length === 7) {
        return { name: '我的球队', formation: slots };
      }
    }

    // Default: use all cards in default positions
    const allCards = dataManager.getAllCards();
    const defSlots: TeamSlot[] = [
      { card: allCards.find((c) => c.position === 'GK')  ?? allCards[0], x: 0.07, y: 0.50 },
      { card: allCards.filter((c) => c.position === 'DEF')[0] ?? allCards[1], x: 0.22, y: 0.28 },
      { card: allCards.filter((c) => c.position === 'DEF')[1] ?? allCards[2], x: 0.22, y: 0.72 },
      { card: allCards.filter((c) => c.position === 'MID')[0] ?? allCards[3], x: 0.45, y: 0.28 },
      { card: allCards.filter((c) => c.position === 'MID')[1] ?? allCards[4], x: 0.45, y: 0.72 },
      { card: allCards.filter((c) => c.position === 'FWD')[0] ?? allCards[5], x: 0.68, y: 0.33 },
      { card: allCards.filter((c) => c.position === 'FWD')[1] ?? allCards[6], x: 0.68, y: 0.67 },
    ];
    return { name: '我的球队', formation: defSlots };
  }

  // ── Scenes ────────────────────────────────────────────────────────────────

  const menuScene = new MenuScene({
    width:       GAME_WIDTH,
    height:      GAME_HEIGHT,
    onStartGame: () => {
      sceneManager.switchTo('stageSelect', { stages: buildStageInfoList() });
    },
    onClub: () => {
      sceneManager.switchTo('club');
    },
    onRecruit: () => {
      console.log('[KungFuFootball] 招募功能即将上线');
    },
  });

  const stageSelectScene = new StageSelectScene({
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
    onSelectStage: (stageId: string) => {
      currentStageId = stageId;
      // Use ClubScene's saved lineup directly — skip FormationScene
      const playerTeam = buildPlayerTeam(clubScene.getFormationSlots());
      const aiTeam = aiOpponent.generateTeam(stageId);
      const result = matchEngine.simulate(playerTeam, aiTeam);
      sceneManager.switchTo('match', { result, homeTeam: playerTeam, awayTeam: aiTeam });
    },
    onBack: () => {
      sceneManager.switchTo('menu');
    },
  });

  const clubScene = new ClubScene({
    dataManager,
    saveManager,
    onBack: () => sceneManager.switchTo('menu'),
  });

  // FormationScene kept for standalone debug access (not in main game flow)
  const formationScene = new FormationScene({
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
    onConfirm: (slots: TeamSlot[]) => {
      const playerTeam: Team = { name: '我的球队', formation: slots };
      const aiTeam = currentStageId
        ? aiOpponent.generateTeam(currentStageId)
        : aiOpponent.generateTeamById('ai_team_001');
      const result = matchEngine.simulate(playerTeam, aiTeam);
      sceneManager.switchTo('match', { result, homeTeam: playerTeam, awayTeam: aiTeam });
    },
    onBack: () => sceneManager.switchTo('stageSelect', { stages: buildStageInfoList() }),
    dataManager,
  });

  const matchScene = new MatchScene({
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
    onMatchEnd: (matchResult) => {
      const won       = matchResult.homeGoals > matchResult.awayGoals;
      let rewards: ResultSceneData['rewards'];
      let hasNextStage = false;

      if (currentStageId) {
        const stage = dataManager.getStage(currentStageId);

        if (won) {
          saveManager.completeStage(currentStageId);
          saveManager.addCoins(stage.rewardCoins);
          if (stage.rewardCardId) {
            saveManager.addCard(stage.rewardCardId);
          }

          let rewardCardName: string | undefined;
          if (stage.rewardCardId) {
            try {
              rewardCardName = dataManager.getCard(stage.rewardCardId).name;
            } catch {
              rewardCardName = stage.rewardCardId;
            }
          }
          rewards      = { coins: stage.rewardCoins, cardName: rewardCardName };
          hasNextStage = findNextStageId(currentStageId) !== null;
        }
      }

      const resultData: ResultSceneData = {
        result:       matchResult,
        stageId:      currentStageId ?? undefined,
        rewards,
        hasNextStage,
        cardNames:    buildCardNamesMap(),
      };

      sceneManager.switchTo('result', resultData);
    },
  });

  const resultScene = new ResultScene({
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
    onBack: () => {
      currentStageId = null;
      sceneManager.switchTo('menu');
    },
    onNextStage: () => {
      sceneManager.switchTo('stageSelect', { stages: buildStageInfoList() });
    },
  });

  // ── Register & launch ─────────────────────────────────────────────────────

  sceneManager.register(menuScene);
  sceneManager.register(stageSelectScene);
  sceneManager.register(clubScene);
  sceneManager.register(formationScene);
  sceneManager.register(matchScene);
  sceneManager.register(resultScene);

  app.ticker.add((ticker) => {
    sceneManager.update(ticker.deltaTime);
  });

  await sceneManager.switchTo('menu');

  console.log('[KungFuFootball] Game initialized successfully');
}

main().catch((err) => {
  console.error('[KungFuFootball] Failed to start:', err);
  const container = document.getElementById('game-container');
  if (container) {
    container.innerHTML = `<div style="color:#e63946;padding:20px;font-family:sans-serif;">
      <h2>启动失败</h2><p>${err.message}</p>
    </div>`;
  }
});
