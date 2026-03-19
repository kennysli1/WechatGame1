# 功夫足球 — 足球卡牌策略小游戏

> 布阵、对战、策略制胜的单机足球卡牌游戏。参考经典「功夫足球」玩法，目标发布**微信小游戏**，开发期通过**网页**实时预览迭代。

## 游戏是什么

玩家收集球员卡，排兵布阵（7 人制），与 AI 对手进行**自动比赛模拟**。比赛结果由阵型、球员属性、技能组合共同决定——不是拼手速，而是拼策略。

**核心循环：** 选卡组队 → 布阵 → 观看比赛模拟 → 结算胜负 → 调整策略再来

**不做的事：** 实时操控足球、MMO 社交、重度骨骼动画

## 快速开始

```bash
# 安装依赖
npm install

# 初始化 Excel 配置表（首次）
npx tsx scripts/init-xlsx.ts

# 启动开发服务器（自动构建数据 + Vite HMR）
npm run dev
```

打开浏览器访问 `http://localhost:3000`（端口被占用时自动递增）即可预览。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 构建数据 + 启动开发服务器 |
| `npm run data` | 手动执行 Excel → JSON 转换 |
| `npm run data:watch` | 监听 Excel 变更自动重建 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm test` | 运行单元测试（Vitest，38 项） |
| `npx tsx scripts/test-match-engine.ts` | 比赛引擎控制台测试（6 项） |

## 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 语言 | TypeScript (strict) | 类型安全，AI 辅助友好 |
| 渲染 | PixiJS v8 | 轻量 2D 渲染 |
| 构建 | Vite | 极快 HMR |
| 数据配置 | Excel (.xlsx) → JSON | 策划用 Excel 编辑，构建时转为类型安全 JSON |
| 平台适配 | weapp-adapter（后期） | 微信小游戏 Canvas/API 桥接 |

## 项目结构

```
WechatGame1/
├── data/                    # 策划配置表（Excel）        → 详见 data/README.md
│   ├── cards.xlsx           #   球员卡属性
│   ├── skills.xlsx          #   技能定义
│   ├── ai_teams.xlsx        #   AI 队伍
│   ├── stages.xlsx          #   关卡配置
│   ├── balance.xlsx         #   全局平衡参数
│   └── asset_manifest.xlsx  #   美术资源清单
├── scripts/                 # 构建工具
│   ├── build-data.ts        #   Excel → JSON 转换 + 校验
│   └── init-xlsx.ts         #   初始化空 Excel 模板
├── src/
│   ├── main.ts              # 入口（6 场景完整流转）
│   ├── core/                # 纯游戏逻辑（零渲染依赖）
│   │   ├── models/          #   数据模型 (Card, Team, MatchEvent, MatchResult)
│   │   ├── systems/         #   游戏系统 (MatchEngine + 技能, AIOpponent, FormationValidator)
│   │   ├── data/            #   IDataManager 接口 + DataManager + 类型定义 + generated JSON
│   │   ├── mocks/           #   开发期 Mock（MockDataManager / MockAssetManager / MockMatchEngine 等）
│   │   └── events/          #   事件总线
│   ├── render/              # PixiJS 渲染层
│   │   ├── scenes/          #   6 个场景 (Menu, StageSelect, Formation, Match, Result)
│   │   ├── components/      #   UI 组件 (CardView, PitchView + 位置槽, Button, Panel)
│   │   ├── animations/      #   比赛动画 (MatchAnimator + 球路径关键帧)
│   │   ├── AssetManager.ts  #   资源加载 + fallback + 热替换
│   │   └── SceneManager.ts  #   场景切换管理
│   ├── platform/            # 平台抽象 (IPlatform → WebPlatform / WxPlatform 占位)
│   ├── storage/             # 存档管理 (SaveManager，已通过单元测试)
│   └── utils/               # 工具 (SeededRandom 可种子随机、数学辅助)
├── assets/                  # 美术资源（90% AI 生成）    → 详见 assets/ASSET_MANIFEST.md
└── docs/                    # 项目文档                   → 详见下方「文档索引」
```

## 数据驱动：改 Excel，不改代码

所有游戏数值（球员属性、技能效果、AI 队伍、关卡、平衡参数）都在 Excel 中配置，**代码中不硬编码任何数值**。

**更新流程：** 编辑 `data/*.xlsx` → 运行 `npm run data` → JSON 自动更新 → 浏览器刷新即生效

支持跨文件外键校验——例如球员卡引用的技能 ID 必须在技能表中存在，否则构建报错并提示具体行号。

详见 → [data/README.md](data/README.md)

## 开发阶段

采用**三阶段开发模型**：契约先行，模块并行，轻量集成。

### P0: 契约层 + 基础设施 ✅

定义所有模块接口和 Mock 实现，搭建项目骨架，使后续模块可完全独立开发。

### P1: 并行模块开发 ✅ 全部完成

7 个模块均已实现，通过各自 Mock 依赖独立验证：

| 模块 | 范围 | 状态 |
|------|------|------|
| Mod-A 数据管线 | Excel→JSON 转换 + DataManager + 强化校验 | ✅ 完成 |
| Mod-B 比赛引擎 | MatchEngine（技能+位置+主场） + AIOpponent | ✅ 完成 |
| Mod-C 布阵界面 | PitchView（位置槽）+ CardView + FormationScene 拖拽 | ✅ 完成 |
| Mod-D 比赛回放 | MatchAnimator（球路径+高亮）+ MatchScene 动画播放 | ✅ 完成 |
| Mod-E 结算+菜单 | MenuScene + StageSelectScene + ResultScene（奖励/MVP）| ✅ 完成 |
| Mod-F 平台+存储 | WebPlatform + SaveManager（38 项单元测试） | ✅ 完成 |
| Mod-G AI 美术 | 24 个 AI 生成图片资源（卡面/球场/UI/特效） | ✅ 完成 |

### P2: 集成与联调（下一阶段）

当前已完成 `main.ts` 的完整 6 场景流转（菜单→关卡选择→布阵→比赛→结算→返回），核心路径已可运行。

下一步：全面替换 Mock → 真实实现，端到端压测，平衡参数调优，微信小游戏适配。

### 后续规划

- **Phase 2 — 养成系统：** 抽卡、球员升级、每日场次限制
- **微信小游戏发布：** weapp-adapter 适配 + 审核上线

详见 → [.claude/MVP_AXIS_LOCK.md](.claude/MVP_AXIS_LOCK.md)

## 文档索引

| 文档 | 说明 | 路径 |
|------|------|------|
| 项目总览 | 愿景、进展、架构图、功能映射表 | [docs/PROJECT.md](docs/PROJECT.md) |
| 美术风格指南 | 配色、规格、AI 生图 Prompt 模板 | [docs/ART_STYLE_GUIDE.md](docs/ART_STYLE_GUIDE.md) |
| 配置表说明 | Excel 字段定义、约束、更新流程 | [data/README.md](data/README.md) |
| 美术资源清单 | 所有需要的图片资源及生成状态 | [assets/ASSET_MANIFEST.md](assets/ASSET_MANIFEST.md) |
| MVP 范围锁定 | 首版做什么、不做什么 | [.claude/MVP_AXIS_LOCK.md](.claude/MVP_AXIS_LOCK.md) |

## 架构总览

```
  data/*.xlsx                    策划编辑（球员/技能/关卡/平衡参数）
       │
       ▼  npm run data
  scripts/build-data.ts          校验 + 转换
       │
       ▼
  src/core/data/generated/*.json 类型安全的运行时配置
       │
       ▼
  src/core/data/DataManager      统一查询接口
       │
  ┌────┴────────────────┐
  ▼                     ▼
  core/systems/         render/scenes/
  MatchEngine           FormationScene ──→ 玩家布阵
  AIOpponent            MatchScene    ──→ 比赛回放
       │                ResultScene   ──→ 胜负结算
       ▼
  MatchEvent[]  ───→  render/animations/MatchAnimator
                      （事件 → PixiJS 动画时间线）
```

## 异常处理约定

开发过程中遇到**命令卡住、构建报错、运行时异常、数据校验失败、接口不匹配**等任何阻塞情况时，必须立即上报，格式：

```
[阻塞] 模块: Mod-X | 阶段: P1
问题: 一句话描述
详情: 错误信息
影响: 是否阻塞其他模块
建议: 解决方案
```

禁止静默等待。详见计划文档中「异常处理规范」一节。
