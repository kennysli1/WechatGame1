# 编码规范

> 写代码前参考本文件。项目概况见 `AI_CONTEXT.md`。

---

## 分层规则

- `core/` 不得 import `pixi.js` 或任何渲染库
- `render/` 通过 `IDataManager` 接口获取数据，不直接 import `DataManager`
- `platform/` 通过 `IPlatform` 接口抽象，便于 Web↔微信切换
- 新系统先定义接口，再写实现 + Mock

## 命名约定

- 文件名：PascalCase（类/组件）、camelCase（工具函数）
- 接口前缀 `I`：`IDataManager`, `IPlatform`, `IScene`
- Mock 前缀 `Mock`：`MockDataManager`, `MockPlatform`
- 生成数据在 `core/data/generated/`，不手动编辑

## 数据配置

- 所有游戏数值在 Excel 中配置（cards/skills/ai_teams/stages/balance）
- `build-data.ts` 执行跨文件外键校验 + 枚举校验
- Position 枚举：`GK | DEF | MID | FWD`
- Star 枚举：`1 | 2 | 3 | 4 | 5`

## MatchEngine 关键参数

均从 `balance.xlsx` 读取：

- 确定性模拟：SeededRandom (Mulberry32)，同 seed 同结果
- 位置权重选人（FWD 主射门、DEF 主铲断、MID 主传球）
- 技能系统：passive 常驻 / active 冷却触发
- 主场优势：homeAdvantage 控球加成

## 测试规范

- 框架：Vitest，测试文件在 `src/__tests__/`
- 使用 Mock 系列隔离测试（MockDataManager / MockPlatform / MockMatchEngine）
- 新增核心逻辑需附带测试
