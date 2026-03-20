# 功夫足球 — 项目上下文

> 新对话需要了解项目全貌时阅读本文件。编码规范见 `docs/CODING_RULES.md`，工作流见 `docs/WORKFLOW.md`。

---

## 技术栈

| 层 | 选型 | 版本 |
|---|---|---|
| 语言 | TypeScript (strict) | ^5.7 |
| 渲染 | PixiJS | v8.6 |
| 构建 | Vite | ^6.2 |
| 测试 | Vitest | ^4.1 |
| 数据配置 | Excel (.xlsx) → JSON | xlsx ^0.20 |
| 脚本运行 | tsx | ^4.19 |
| 平台目标 | 微信小游戏（开发期 Web 预览） | — |

---

## 项目结构

```
WechatGame1/
├── data/*.xlsx              # 策划配置表（6个）→ npm run data 转 JSON
├── scripts/
│   ├── build-data.ts        # Excel → JSON 转换 + 跨文件校验
│   └── init-xlsx.ts         # 初始化空 Excel 模板
├── src/
│   ├── main.ts              # 入口：6 场景流转编排
│   ├── core/                # 纯逻辑层（零渲染依赖）
│   │   ├── data/            # IDataManager + DataManager + schemas + generated/*.json
│   │   ├── models/          # Card, Team, MatchEvent, MatchResult
│   │   ├── systems/         # MatchEngine, AIOpponent, FormationValidator
│   │   ├── events/          # EventBus (pub/sub)
│   │   └── mocks/           # MockDataManager, MockAssetManager, MockPlatform, MockMatchEngine
│   ├── render/              # PixiJS 渲染层
│   │   ├── scenes/          # Menu, StageSelect, Formation, Club, Match, Result
│   │   ├── components/      # CardView, PitchView, Button, Panel
│   │   ├── animations/      # MatchAnimator
│   │   ├── SceneManager.ts
│   │   └── AssetManager.ts
│   ├── platform/            # IPlatform → WebPlatform / WxPlatform
│   ├── storage/             # SaveManager
│   └── utils/               # SeededRandom, math helpers
├── assets/                  # AI 生成美术资源
└── docs/                    # CODING_RULES, WORKFLOW, ART_STYLE_GUIDE, ART_ASSETS, PROJECT
```

---

## 数据流

```
data/*.xlsx → npm run data → generated/*.json → DataManager → 各场景/系统
```

**场景流转：** Menu → StageSelect → Formation/Club → Match → Result → (Menu | StageSelect)

---

## 关键文件速查

| 需求 | 文件 |
|------|------|
| 类型定义 | `src/core/data/schemas.ts` |
| 数据接口 | `src/core/data/IDataManager.ts` |
| 比赛模拟 | `src/core/systems/MatchEngine.ts` |
| 俱乐部界面 | `src/render/scenes/ClubScene.ts` |
| 阵型配置 | `src/core/data/formations.ts` |
| 比赛动画 | `src/render/animations/MatchAnimator.ts` |
| 场景编排 | `src/main.ts` |
| 存档 | `src/storage/SaveManager.ts` |
| 数据构建 | `scripts/build-data.ts` |
| 平衡参数 | `data/balance.xlsx` |

---

## 当前进度

### 已完成（P0 + P1 全部 7 模块）
- ✅ Mod-A 数据管线（Excel→JSON + DataManager + 强化校验）
- ✅ Mod-B 比赛引擎（MatchEngine 技能+位置+主场 + AIOpponent）
- ✅ Mod-C 布阵界面（PitchView 位置槽 + CardView + FormationScene 拖拽）
- ✅ Mod-D 比赛回放（MatchAnimator 球路径关键帧 + MatchScene 完整动画）
- ✅ Mod-E 结算+菜单（MenuScene + StageSelectScene + ResultScene 奖励/MVP）
- ✅ Mod-F 平台+存储（WebPlatform + SaveManager，38 项单元测试）
- ✅ Mod-G AI 美术（24 个 AI 生成图片资源）
- ✅ main.ts 完整 6 场景流转已可运行

### P2 已完成
- ✅ 主菜单三按钮：开始游戏 / 俱乐部 / 招募
- ✅ 俱乐部界面（ClubScene）：阵型选择 + 球场布阵 + 替补席拖拽
- ✅ 阵型配置表（formations.ts）：6 种阵型可扩展
- ✅ 球员新属性 + CardView clubMode 属性条形图
- ✅ PitchView 支持 slotDefs 自定义
- ✅ SaveManager 新增 selectedFormationId
- ✅ 开始游戏流程：StageSelect → ClubScene 存档阵容 → 比赛

### 待做
- 平衡参数调优（balance.xlsx）
- 微信小游戏适配（WxPlatform.ts）
- 填充更多球员卡和技能数据
- 招募功能实现

### 后续规划
- Phase 2：养成系统（抽卡、升级、每日场次限制）
- 微信小游戏发布
