import { Application } from 'pixi.js';
import { DataManager } from './core/data/DataManager.ts';
import { AssetManager } from './render/AssetManager.ts';
import { SceneManager } from './render/SceneManager.ts';
import { MenuScene } from './render/scenes/MenuScene.ts';
import { FormationScene } from './render/scenes/FormationScene.ts';
import { MatchScene } from './render/scenes/MatchScene.ts';
import { ResultScene } from './render/scenes/ResultScene.ts';
import { MatchEngine } from './core/systems/MatchEngine.ts';
import { AIOpponent } from './core/systems/AIOpponent.ts';
import { WebPlatform } from './platform/WebPlatform.ts';
import { SaveManager } from './storage/SaveManager.ts';
import type { TeamSlot } from './core/models/Team.ts';

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

  const menuScene = new MenuScene({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onStartGame: () => {
      const allCards = dataManager.getAllCards();
      sceneManager.switchTo('formation', { cards: allCards });
    },
  });

  const formationScene = new FormationScene({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onConfirm: (slots: TeamSlot[]) => {
      const playerTeam = { name: '我的球队', formation: slots };
      const aiTeam = aiOpponent.generateTeamById('ai_team_001');
      const result = matchEngine.simulate(playerTeam, aiTeam);
      sceneManager.switchTo('match', { result });
    },
  });

  const matchScene = new MatchScene({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onMatchEnd: (result) => {
      sceneManager.switchTo('result', result);
    },
  });

  const resultScene = new ResultScene({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    onBack: () => {
      sceneManager.switchTo('menu');
    },
  });

  sceneManager.register(menuScene);
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
