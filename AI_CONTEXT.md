# 功夫足球 — AI 上下文引导文件

> **用途：** 新开 AI 对话时优先阅读本文件，快速恢复项目记忆，节约上下文消耗。
> **维护规则：** 每次功能提交同步更新本文件对应章节。

---

## 1. AI 角色定位

你是「功夫足球」项目的**全栈游戏开发助手**。当前核心任务：

- **框架确定** — 维护和演进分层架构（core/render/platform/storage），确保模块解耦、职责清晰
- **功能代码实现** — 高质量交付各模块功能，TypeScript strict 模式，遵循项目已有的设计模式和编码规范
- **数据驱动** — 所有游戏数值来自 Excel 配置，代码中零硬编码数值
- **测试保障** — 新增逻辑附带对应测试，提交前确认构建通过

当前处于 **A·核心切片** 阶段（布阵→对战→结算），详见第 7 节进度。

---

## 2. 技术栈速查

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

## 3. 项目结构（关键路径）

```
WechatGame1/
├── data/*.xlsx              # 策划配置表（6个）→ npm run data 转 JSON
├── scripts/
│   ├── build-data.ts        # Excel → JSON 转换 + 跨文件校验
│   └── init-xlsx.ts         # 初始化空 Excel 模板
├── src/
│   ├── main.ts              # 入口：6 场景流转编排
│   ├── core/                # 纯逻辑层（零渲染依赖）
│   │   ├── data/            # IDataManager 接口 + DataManager + schemas + generated/*.json
│   │   ├── models/          # Card, Team, MatchEvent, MatchResult
│   │   ├── systems/         # MatchEngine(技能+位置+主场), AIOpponent, FormationValidator
│   │   ├── events/          # EventBus (pub/sub)
│   │   └── mocks/           # MockDataManager, MockAssetManager, MockPlatform, MockMatchEngine, mockData
│   ├── render/              # PixiJS 渲染层
│   │   ├── scenes/          # MenuScene, StageSelectScene, FormationScene, MatchScene, ResultScene
│   │   ├── components/      # CardView, PitchView(位置槽), Button, Panel
│   │   ├── animations/      # MatchAnimator（事件→球路径关键帧→动画时间线）
│   │   ├── SceneManager.ts  # 场景切换生命周期
│   │   └── AssetManager.ts  # 纹理加载 + fallback 生成
│   ├── platform/            # IPlatform → WebPlatform(localStorage) / WxPlatform(占位)
│   ├── storage/             # SaveManager（存档：拥有卡/关卡进度/金币/阵型）
│   └── utils/               # SeededRandom(Mulberry32), math(clamp/lerp/distance)
├── assets/                  # 24 个 AI 生成资源（cards/pitch/ui/effects）
├── docs/                    # PROJECT.md, ART_STYLE_GUIDE.md
└── .claude/                 # MVP_AXIS_LOCK.md, settings.local.json
```

---

## 4. 核心数据流

```
策划编辑 data/*.xlsx
    ↓ npm run data (build-data.ts: 校验+转换)
src/core/data/generated/*.json
    ↓ DataManager.init() 加载到内存 Map
    ↓
FormationScene → 展示可用卡牌 → 玩家拖拽布阵 → 生成 Team
    ↓
MatchEngine.simulate(homeTeam, awayTeam, seed) → MatchEvent[] + MatchResult
    ↓
MatchAnimator.buildTimeline() → 球路径关键帧 + 球员高亮
    ↓
MatchScene → 播放动画（比分栏/球员点/金色球/进球特效）
    ↓
ResultScene → 比分/进球记录/MVP/奖励 → SaveManager 存档
```

**场景流转：** Menu → StageSelect → Formation → Match → Result → (Menu | StageSelect)

---

## 5. 常用命令

```bash
npm run dev          # 构建数据 + 启动 Vite 开发服务器 (localhost:3000)
npm run data         # 手动 Excel → JSON
npm run data:watch   # 监听 Excel 变更自动重建
npm test             # Vitest 运行 38 项单元测试
npm run build        # 生产构建 → dist/
npx tsx scripts/test-match-engine.ts  # 比赛引擎控制台测试（6项）
```

---

## 6. 架构约定与编码规范

### 分层规则
- `core/` 禁止 import `pixi.js` 或任何渲染库
- `render/` 通过 `IDataManager` 接口获取数据，不直接 import `DataManager`
- `platform/` 通过 `IPlatform` 接口抽象，便于 Web↔微信切换
- 新系统必须先定义接口，再写实现 + Mock

### 命名约定
- 文件：PascalCase（类/组件）、camelCase（工具函数）
- 接口前缀 `I`：`IDataManager`, `IPlatform`, `IScene`
- Mock 前缀 `Mock`：`MockDataManager`, `MockPlatform`
- 生成数据在 `core/data/generated/`，不手动编辑

### 数据配置
- 所有游戏数值在 Excel 中配置（cards/skills/ai_teams/stages/balance）
- build-data.ts 执行跨文件外键校验 + 枚举校验
- Position 枚举：`GK | DEF | MID | FWD`
- Star 枚举：`1 | 2 | 3 | 4 | 5`

### MatchEngine 关键参数（均从 balance.xlsx 读取）
- 确定性模拟：SeededRandom (Mulberry32)，同 seed 同结果
- 位置权重选人（FWD 主射门、DEF 主铲断、MID 主传球）
- 技能系统：passive 常驻 / active 冷却触发
- 主场优势：homeAdvantage 控球加成

### 测试规范
- 单元测试用 Vitest，文件在 `src/__tests__/`
- 使用 Mock 系列（MockDataManager/MockPlatform/MockMatchEngine）隔离测试
- 新增核心逻辑必须附带测试

---

## 7. 当前进度与状态

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
- ✅ 主菜单改为三按钮：开始游戏 / 俱乐部 / 招募（MenuScene）
- ✅ 俱乐部界面（ClubScene）：左侧阵型选择器 + 中间球场布阵 + 下方替补席拖拽替换，自动存档
- ✅ 阵型配置表（formations.ts）：6 种阵型（2-2-2 / 1-3-2 / 2-1-3 / 3-2-1 / 2-3-1 / 3-1-2）可扩展
- ✅ 球员新属性（带球/传球/射门/抢断/拦截/封堵/守门）写入 schemas.ts + cards.json + 所有 Mock
- ✅ CardView 新增 clubMode，按位置展示对应属性条形图（GK→守门，DEF→抢断/拦截/封堵，MID→带球/传球/抢断，FWD→带球/传球/射门）
- ✅ PitchView 支持 slotDefs 自定义参数，供阵型切换动态重建
- ✅ SaveManager 新增 selectedFormationId 字段
- ✅ 开始游戏流程：StageSelect → 直接用 ClubScene 存档阵容 → 比赛（不再经过 FormationScene）

### 当前阶段：P2 集成与联调（剩余）
- 平衡参数调优（修改 balance.xlsx）
- 微信小游戏适配（WxPlatform.ts 实现）
- 填充更多球员卡和技能数据
- 招募功能实现（当前为占位符）

### 后续规划
- Phase 2：养成系统（抽卡、球员升级、每日场次限制）
- 微信小游戏发布：weapp-adapter 适配 + 审核上线

---

## 8. 异常处理规范

遇到**命令卡住、构建报错、运行时异常、数据校验失败、接口不匹配**等阻塞时，必须立即上报：

```
[阻塞] 模块: Mod-X | 阶段: PX
问题: 一句话描述
详情: 错误信息
影响: 是否阻塞其他模块
建议: 解决方案
```

---

## 9. 关键文件速查表

| 需求 | 文件 |
|------|------|
| 所有类型定义 | `src/core/data/schemas.ts` |
| 数据查询接口 | `src/core/data/IDataManager.ts` |
| 比赛模拟逻辑 | `src/core/systems/MatchEngine.ts` |
| 布阵拖拽交互 | `src/render/scenes/FormationScene.ts` |
| 俱乐部界面 | `src/render/scenes/ClubScene.ts` |
| 阵型配置表 | `src/core/data/formations.ts` |
| 比赛动画播放 | `src/render/scenes/MatchScene.ts` + `src/render/animations/MatchAnimator.ts` |
| 场景流转编排 | `src/main.ts` |
| 存档读写 | `src/storage/SaveManager.ts` |
| 数据构建脚本 | `scripts/build-data.ts` |
| 游戏平衡参数 | `data/balance.xlsx` → `src/core/data/generated/balance.json` |
| MVP 范围锁定 | `.claude/MVP_AXIS_LOCK.md` |
| 美术风格指南 | `docs/ART_STYLE_GUIDE.md` |
| Excel 字段说明 | `data/README.md` |

---

## 10. 提交规范

每次代码提交需同步：
1. **功能代码** — 实现或修改
2. **测试** — 新增/更新对应测试
3. **数据** — 如涉及 Excel 变更，需运行 `npm run data` 重新生成 JSON 并一并提交
4. **文档** — 更新 `docs/PROJECT.md` 功能映射表状态
5. **本文件** — 更新 `AI_CONTEXT.md` 第 7 节「当前进度」及相关章节

提交信息格式：`[Mod-X] 简要描述` 或 `[P2] 简要描述`

---

## 11. 工作流规范（每次必须严格执行，禁止跳过）

**完成代码修改后，必须按以下步骤操作，不得乱序、不得省略：**

1. 执行 `npm run preview:static`，生成最新的 `功夫足球_preview.html` 快照文件
2. 告知用户：「快照已更新，请双击 `功夫足球_preview.html` 在浏览器中验收」
3. **等待用户明确回复验收通过**，再进行下一步
4. 用户确认后，执行 `git add` / `git commit` / `git push`

> ⚠️ **严禁**在用户验收前执行任何 git 操作（add / commit / push）
