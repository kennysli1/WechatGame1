import { Application } from 'pixi.js';
import { DataManager } from './core/data/DataManager.ts';
import { AssetManager } from './render/AssetManager.ts';
import { SceneManager } from './render/SceneManager.ts';
import { MenuScene } from './render/scenes/MenuScene.ts';
import { StageSelectScene, type StageInfo } from './render/scenes/StageSelectScene.ts';
import { FormationScene } from './render/scenes/FormationScene.ts';
import { MatchScene } from './render/scenes/MatchScene.ts';
import { ResultScene, type ResultSceneData } from './render/scenes/ResultScene.ts';
import { MatchEngine } from './core/systems/MatchEngine.ts';
import { AIOpponent } from './core/systems/AIOpponent.ts';
import { WebPlatform } from './platform/WebPlatform.ts';
import { SaveManager } from './storage/SaveManager.ts';
import type { Team, TeamSlot } from './core/models/Team.ts';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 640;

async function main() {
  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x1a1a2e,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  const container = document.getElementById('game-container')!;
  container.appendChild(app.canvas);

  const platform = new WebPlatform();
  const saveManager = new SaveManager(platform);
  saveManager.load();

  const dataManager = new DataManager();
  await dataManager.init();

  const assetManager = new AssetManager();
  assetManager.setRenderer(app.renderer);

  const matchEngine = new MatchEngine(dataManager);
  const aiOpponent = new AIOpponent(dataManager);

  const sceneManager = new SceneManager(app);

  let currentStageId: string | null = null;

  function buildStageInfoList(): StageInfo[] {
    const stages = dataManager.getAllStages();
    const completed = saveManager.completedStageIds;
    return stages.map((stage) => {
      const aiTeam = dataManager.getAITeam(stage.aiTeamId);
      const unlocked =
        !stage.unlockAfterStage || completed.includes(stage.unlockAfterStage);
      return {
        stageId: stage.stageId,
        name: stage.name,
        description: stage.description,
        rewardCoins: stage.rewardCoins,
        difficulty: aiTeam.difficulty,
        unlocked,
        completed: completed.includes(stage.stageId),
      };
    });
  }

  function findNextStageId(afterStageId: string): string | null {
    const stages = dataManager.getAllStages();
    const next = stages.find((s) => s.unlockAfterStage === afterStageId);
    return next?.stageId ?? null;
  }

  function buildCardNamesMap(): Record<string, string> {
    const names: Record<string, string> = {};
    for (const card of dataManager.getAllCards()) {
      names[card.id] = card.name;
    }
    return names;
  }

  const menuScene = new MenuScene({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onStartGame: () => {
      sceneManager.switchTo('stageSelect', { stages: buildStageInfoList() });
    },
    onSettings: () => {
      console.log('[HotBall] Settings not yet implemented');
    },
  });

  const stageSelectScene = new StageSelectScene({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onSelectStage: (stageId: string) => {
      currentStageId = stageId;
      const allCards = dataManager.getAllCards();
      sceneManager.switchTo('formation', { cards: allCards });
    },
    onBack: () => {
      sceneManager.switchTo('menu');
    },
  });

  const formationScene = new FormationScene({
    width: GAME_WIDTH,
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
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onMatchEnd: (matchResult) => {
      const won = matchResult.homeGoals > matchResult.awayGoals;
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
          rewards = { coins: stage.rewardCoins, cardName: rewardCardName };
          hasNextStage = findNextStageId(currentStageId) !== null;
        }
      }

      const resultData: ResultSceneData = {
        result: matchResult,
        stageId: currentStageId ?? undefined,
        rewards,
        hasNextStage,
        cardNames: buildCardNamesMap(),
      };

      sceneManager.switchTo('result', resultData);
    },
  });

  const resultScene = new ResultScene({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onBack: () => {
      currentStageId = null;
      sceneManager.switchTo('menu');
    },
    onNextStage: () => {
      sceneManager.switchTo('stageSelect', { stages: buildStageInfoList() });
    },
  });

  sceneManager.register(menuScene);
  sceneManager.register(stageSelectScene);
  sceneManager.register(formationScene);
  sceneManager.register(matchScene);
  sceneManager.register(resultScene);

  app.ticker.add((ticker) => {
    sceneManager.update(ticker.deltaTime);
  });

  await sceneManager.switchTo('menu');

  console.log('[HotBall] Game initialized successfully');
}

main().catch((err) => {
  console.error('[HotBall] Failed to start:', err);
  const container = document.getElementById('game-container');
  if (container) {
    container.innerHTML = `<div style="color:#e63946;padding:20px;font-family:sans-serif;">
      <h2>启动失败</h2><p>${err.message}</p>
    </div>`;
  }
});
