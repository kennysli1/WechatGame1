# 功夫足球 — 项目总览

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

### 已完成: M1-B — 比赛引擎增强 (2026-03-19)

| 状态 | 任务 |
|------|------|
| ✅ 完成 | MatchEngine 技能系统集成 (passive/active, cooldowns, trigger conditions) |
| ✅ 完成 | MatchEngine 位置权重选人 (FWD 射门, DEF 铲断, MID 传球) |
| ✅ 完成 | MatchEngine 主场优势 (homeAdvantage 参数) |
| ✅ 完成 | MatchEngine 全部 balance 参数从配置读取 (tackleBaseChance, shotChance 等) |
| ✅ 完成 | MatchEngine speed 属性影响控球权 |
| ✅ 完成 | IDataManager 接口抽取 (解耦具体实现) |
| ✅ 完成 | AIOpponent / MatchEngine 依赖 IDataManager 接口 |
| ✅ 完成 | MockDataManager + mockData (并行开发/测试用) |
| ✅ 完成 | FormationValidator 增加阵容建议警告 |
| ✅ 完成 | test-match-engine.ts 控制台测试脚本 (6 项测试, 全部通过) |

### 已完成: M1-E — 结算+菜单+关卡选择 (2026-03-19)

| 状态 | 任务 |
|------|------|
| ✅ 完成 | StageSelectScene 关卡选择界面 (难度星级/锁定状态/奖励显示/hover 高亮) |
| ✅ 完成 | ResultScene 增强 (进球记录/MVP 名称解析/关卡奖励展示/下一关按钮) |
| ✅ 完成 | MenuScene 增加设置按钮 (占位) |
| ✅ 完成 | main.ts 完整 6 场景流转: 菜单→关卡选择→布阵→比赛→结算→菜单/关卡选择 |
| ✅ 完成 | 胜利时自动存档: 完成关卡/获得金币/获得奖励球员卡 |
| ✅ 完成 | 关卡解锁逻辑 (通关前置关卡后解锁下一关) |
| ✅ 完成 | Button 组件修复 label 属性与 PixiJS Container 冲突 |

### 已完成: M1-G — AI美术资源生成 (2026-03-19)

| 状态 | 任务 |
|------|------|
| ✅ 完成 | 8 张球员卡面 (GK×1, DEF×2, MID×2, FWD×3) — assets/cards/ |
| ✅ 完成 | 球场全景背景 pitch_bg.png (1136×640) — assets/pitch/ |
| ✅ 完成 | 草地平铺纹理 pitch_grass_tile.png (128×128) — assets/pitch/ |
| ✅ 完成 | 主/次按钮背景 btn_primary/btn_secondary.png — assets/ui/ |
| ✅ 完成 | 面板背景 panel_bg.png — assets/ui/ |
| ✅ 完成 | 4 个属性图标 (attack/defense/speed/technique) — assets/ui/ |
| ✅ 完成 | 游戏Logo logo.png (512×256) — assets/ui/ |
| ✅ 完成 | 进球庆祝动画帧 ×3 — assets/effects/goal_celebration/ |
| ✅ 完成 | 射门轨迹动画帧 ×3 — assets/effects/shot_trail/ |
| ✅ 完成 | ASSET_MANIFEST.md 更新所有状态为已完成 |

### 已完成: M1-D — 比赛回放动画 (2026-03-19)

| 状态 | 任务 |
|------|------|
| ✅ 完成 | MockMatchEngine — 实现 IMatchEngine，simulate() 返回固定 MatchResult（3:1），不依赖任何外部系统 |
| ✅ 完成 | mockData.ts 扩展 — 28个固定 MatchEvent（传球/射门/扑救/进球/铲断/中场/终场），7张 Mock 球员卡，2支完整队伍 |
| ✅ 完成 | MockDataManager 所需集合导出补充（MOCK_CARDS/SKILLS/AI_TEAMS/STAGES/BALANCE） |
| ✅ 完成 | MatchAnimator 增强 — 新增 Keyframe 位置关键帧（归一化坐标）、ballKeyframes 球运动路径、highlightPlayers 高亮列表、isGoal 标志 |
| ✅ 完成 | MatchAnimator.buildTimeline() 接受可选 home/away Team，查找球员真实位置生成精准轨迹 |
| ✅ 完成 | 每种事件的球轨迹：传球走直线、失误偏出、射门飞弧线、射偏、扑救反弹、铲断拼抢 |
| ✅ 完成 | MatchScene 重构 — 顶部固定比分栏（含实时分钟显示） |
| ✅ 完成 | MatchScene — 球场内主队（蓝色）/客队（红色）球员圆点，含名字缩写标签 |
| ✅ 完成 | MatchScene — 金色球每帧在 Keyframe 间平滑插值移动 |
| ✅ 完成 | MatchScene — 参与当前事件的球员高亮放大（1.35×），其余淡化（0.75透明度） |
| ✅ 完成 | MatchScene — 进球触发全屏金色闪光覆盖 + 大字特效，1.2s 内平滑淡出 |
| ✅ 完成 | MatchScene — 实时比分更新（homePlayerIds 判断进球归属；无队伍信息时降级比例策略） |
| ✅ 完成 | MatchScene — 导出 MatchSceneData 接口，支持传入 homeTeam/awayTeam |
| ✅ 完成 | main.ts — FormationScene → MatchScene 时同时传入 homeTeam/awayTeam 驱动球员点渲染 |

### 已完成: M1-C — 布阵界面完整实现 (2026-03-19)

| 状态 | 任务 |
|------|------|
| ✅ 完成 | MockDataManager — 8 张硬编码球员卡 + 技能 + AI 队伍，无网络请求，开发期独立注入 |
| ✅ 完成 | MockAssetManager — 所有 getTexture() 返回空纹理，加载 / 替换接口均为 no-op |
| ✅ 完成 | PitchView 重写 — 支持自定义宽高（默认 700×420），横向球场坐标系 |
| ✅ 完成 | PitchView — PositionSlot 类：7 个位置槽（GK×1、CB×2、CM×2、FWD×2） |
| ✅ 完成 | PitchView — 槽状态：空/悬停金色高亮/已放置（彩色实心圆 + 球员名） |
| ✅ 完成 | PitchView — 方法：getNearestSlot()、updateHoverHighlight()、clearHighlights() |
| ✅ 完成 | PitchView — 视觉细节：条纹草地、禁区、球门区、点球点、"← 防守 / 进攻 →" 标签 |
| ✅ 完成 | CardView 增强 — 导出 CARD_WIDTH/CARD_HEIGHT 常量 |
| ✅ 完成 | CardView — setPlaced(bool)：已上场显示半透明遮罩 + 绿色 "✓ 上场" 徽章 |
| ✅ 完成 | CardView — 改进卡面：属性色标（攻=红/守=绿/速=蓝/技=黄）、位置中文徽章 |
| ✅ 完成 | FormationScene 重写 — 布局：标题栏(46px) + 球场(700×420) + 验证区 + 底部卡牌托盘(162px) |
| ✅ 完成 | FormationScene — 底部托盘：8 张卡以 0.6× 缩放横向排列，不与球场重叠 |
| ✅ 完成 | FormationScene — 拖拽：pointerdown 生成 ghost → globalpointermove 跟随鼠标 + 高亮最近槽 |
| ✅ 完成 | FormationScene — pointerup/pointerupoutside 完成放置（64px 吸附阈值）或取消拖拽 |
| ✅ 完成 | FormationScene — 点击已占槽可撤回球员；拖入已占槽自动顶出前者 |
| ✅ 完成 | FormationScene — 集成 FormationValidator：实时校验，未达标禁用"确认出战"按钮 |
| ✅ 完成 | FormationScene — 支持 dataManager 构造注入（MockDataManager 或 DataManager 均可） |
| ✅ 完成 | FormationScene — onBack 回调，顶部"← 返回"按钮 |
| ✅ 完成 | main.ts — FormationScene 注入 dataManager + onBack 参数 |

### 下一步: M1 — 其他模块完善

- 填充更多球员卡和技能数据
- P2 集成阶段：替换全部 Mock → 真实实现，端到端联调

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
6. `ResultScene` 展示比分/进球记录/MVP/关卡奖励
7. 胜利时 `SaveManager` 自动存档 (关卡进度/金币/奖励卡)

## 功能映射表

| 功能 | 文件路径 | 状态 |
|------|---------|------|
| 数据管线 | `scripts/build-data.ts` | ✅ |
| 数据管理 | `src/core/data/DataManager.ts` | ✅ |
| 类型定义 | `src/core/data/schemas.ts` | ✅ |
| 接口定义 | `src/core/data/IDataManager.ts` | ✅ |
| 比赛模拟 | `src/core/systems/MatchEngine.ts` | ✅ 技能+位置+主场 |
| AI 对手 | `src/core/systems/AIOpponent.ts` | ✅ IDataManager |
| 阵型校验 | `src/core/systems/FormationValidator.ts` | ✅ +警告 |
| MockDataManager | `src/core/mocks/MockDataManager.ts` | ✅ |
| Mock数据 | `src/core/mocks/mockData.ts` | ✅ |
| 引擎测试 | `scripts/test-match-engine.ts` | ✅ 6项测试 |
| 资源管理 | `src/render/AssetManager.ts` | ✅ |
| 场景管理 | `src/render/SceneManager.ts` | ✅ |
| 主菜单 | `src/render/scenes/MenuScene.ts` | ✅ +设置按钮 |
| 关卡选择 | `src/render/scenes/StageSelectScene.ts` | ✅ 完整 |
| 布阵界面 | `src/render/scenes/FormationScene.ts` | ✅ 完整拖拽布阵 |
| 比赛回放 | `src/render/scenes/MatchScene.ts` | ✅ 骨架 |
| 结算界面 | `src/render/scenes/ResultScene.ts` | ✅ 进球/MVP/奖励/下一关 |
| 比赛动画 | `src/render/animations/MatchAnimator.ts` | ✅ 骨架 |
| 球员卡视图 | `src/render/components/CardView.ts` | ✅ fallback + 已上场状态 |
| 球场视图 | `src/render/components/PitchView.ts` | ✅ 位置槽 + 高亮 |
| MockAssetManager | `src/core/mocks/MockAssetManager.ts` | ✅ |
| 平台抽象 | `src/platform/IPlatform.ts` | ✅ |
| Web平台 | `src/platform/WebPlatform.ts` | ✅ |
| 微信平台 | `src/platform/WxPlatform.ts` | 🔲 占位 |
| 存档管理 | `src/storage/SaveManager.ts` | ✅ 已测试 |
| MockPlatform | `src/core/mocks/MockPlatform.ts` | ✅ |
| 单元测试 | `src/__tests__/*.test.ts` | ✅ 38 tests |
| 可种子随机 | `src/utils/random.ts` | ✅ |
| 球员卡美术 | `assets/cards/*.png` (8张) | ✅ AI生成 |
| 球场美术 | `assets/pitch/*.png` (2张) | ✅ AI生成 |
| UI美术 | `assets/ui/*.png` (8张) | ✅ AI生成 |
| 特效帧序列 | `assets/effects/*/` (6帧) | ✅ AI生成 |
| 资源清单 | `assets/ASSET_MANIFEST.md` | ✅ 全部完成 |
