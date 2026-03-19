# 热血球球 — 项目总览

> 最后更新: 2026-03-19

## 愿景

**「用你的球员卡组建阵容，与 AI 对手自动比赛，体验布阵策略与比赛模拟的乐趣」**

- **核心体验**：收集球员卡 → 布阵 → 观看比赛模拟 → 胜负结算 → 调整策略再来
- **目标玩家**：喜欢足球 + 卡牌收集 + 轻策略的休闲玩家
- **非目标**：不做实时操控足球、不做 MMO/社交、不做重度骨骼动画演出
- **差异化**：MVP 阶段聚焦「布阵决定论」——阵型、球员位置、属性克制决定比赛走向

## 进展

### 当前里程碑: M0 — 项目骨架 + 数据管线 + 资源管线

| 状态 | 任务 |
|------|------|
| ✅ 完成 | Vite + TypeScript + PixiJS 项目初始化 |
| ✅ 完成 | 目录结构 & 基础类型定义 (schemas.ts) |
| ✅ 完成 | SceneManager 场景切换管理 |
| ✅ 完成 | Excel → JSON 数据管线 (build-data.ts) |
| ✅ 完成 | DataManager 运行时数据查询 |
| ✅ 完成 | AssetManager 资源加载 + fallback + 热替换 |
| ✅ 完成 | 6 个 xlsx 初始数据文件 (cards/skills/ai_teams/stages/balance/asset_manifest) |
| ✅ 完成 | MatchEngine 比赛模拟（读取 balance 参数） |
| ✅ 完成 | AIOpponent（读取 AI 队伍配置） |
| ✅ 完成 | 基础场景骨架 (Menu/Formation/Match/Result) |
| ✅ 完成 | 平台抽象层 (IPlatform/WebPlatform) |
| ✅ 完成 | 存档管理 (SaveManager) |
| ✅ 完成 | PROJECT.md 文档初始化 |
| ✅ 完成 | Vitest 测试框架 + WebPlatform/SaveManager 单元测试 (38 tests) |
| ✅ 完成 | MockPlatform (测试/并行开发用) |

### 下一步: M1 — 核心逻辑完善

- MatchEngine 技能系统集成
- AIOpponent 难度分级
- 填充更多球员卡和技能数据

## 架构

```
分层架构:
  data/  ──(xlsx)──→  scripts/build-data.ts  ──→  generated/*.json
                                                        ↓
  core/  ←── DataManager ←── 读取 JSON 配置
    ├── models/ (Card, Team, MatchEvent, MatchResult)
    ├── systems/ (MatchEngine, AIOpponent, FormationValidator)
    └── events/ (EventBus)
                     ↓ MatchEvent[]
  render/ ←── AssetManager + SceneManager
    ├── scenes/ (Menu, Formation, Match, Result)
    ├── components/ (CardView, PitchView, Button, Panel)
    └── animations/ (MatchAnimator)

  platform/ (IPlatform → WebPlatform / WxPlatform)
  storage/ (SaveManager)
  utils/ (SeededRandom, math)
```

**关键数据流:**
1. 策划编辑 `data/*.xlsx` → `npm run data` → `generated/*.json`
2. `DataManager.init()` 加载 JSON 到内存
3. `FormationScene` 读取 DataManager 展示可用卡牌
4. 玩家布阵 → 生成 `Team` → `MatchEngine.simulate()` → `MatchEvent[]`
5. `MatchAnimator` 将事件转为动画时间线 → `MatchScene` 播放
6. `ResultScene` 展示比分和 MVP

## 功能映射表

| 功能 | 文件路径 | 状态 |
|------|---------|------|
| 数据管线 | `scripts/build-data.ts` | ✅ |
| 数据管理 | `src/core/data/DataManager.ts` | ✅ |
| 类型定义 | `src/core/data/schemas.ts` | ✅ |
| 比赛模拟 | `src/core/systems/MatchEngine.ts` | ✅ 基础 |
| AI 对手 | `src/core/systems/AIOpponent.ts` | ✅ 基础 |
| 阵型校验 | `src/core/systems/FormationValidator.ts` | ✅ |
| 资源管理 | `src/render/AssetManager.ts` | ✅ |
| 场景管理 | `src/render/SceneManager.ts` | ✅ |
| 主菜单 | `src/render/scenes/MenuScene.ts` | ✅ |
| 布阵界面 | `src/render/scenes/FormationScene.ts` | ✅ 骨架 |
| 比赛回放 | `src/render/scenes/MatchScene.ts` | ✅ 骨架 |
| 结算界面 | `src/render/scenes/ResultScene.ts` | ✅ 骨架 |
| 比赛动画 | `src/render/animations/MatchAnimator.ts` | ✅ 骨架 |
| 球员卡视图 | `src/render/components/CardView.ts` | ✅ fallback |
| 球场视图 | `src/render/components/PitchView.ts` | ✅ |
| 平台抽象 | `src/platform/IPlatform.ts` | ✅ |
| Web平台 | `src/platform/WebPlatform.ts` | ✅ |
| 微信平台 | `src/platform/WxPlatform.ts` | 🔲 占位 |
| 存档管理 | `src/storage/SaveManager.ts` | ✅ 已测试 |
| MockPlatform | `src/core/mocks/MockPlatform.ts` | ✅ |
| 单元测试 | `src/__tests__/*.test.ts` | ✅ 38 tests |
| 可种子随机 | `src/utils/random.ts` | ✅ |
