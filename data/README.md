# 配置表说明

本目录存放策划用 Excel 配置文件。每张配置表是一个独立的 `.xlsx` 文件，只用第一个 Sheet，第一行为表头。

## 文件清单

| 文件名 | 用途 | 关键字段 |
|--------|------|---------|
| `cards.xlsx` | 球员卡属性 | id, name, position, star, attack, defense, speed, technique, skill1, skill2, artAsset |
| `skills.xlsx` | 技能定义 | id, name, type, target, effectType, effectValue, triggerCondition |
| `ai_teams.xlsx` | AI队伍配置 | teamId, teamName, difficulty, card1Id~card7Id, card1X~card7X, card1Y~card7Y |
| `stages.xlsx` | 关卡配置 | stageId, name, aiTeamId, unlockAfterStage, rewardCardId, rewardCoins |
| `balance.xlsx` | 全局平衡参数 | key, value, type, description |
| `asset_manifest.xlsx` | 美术资源清单 | key, path, width, height, category, required |

## 字段约束

### cards.xlsx
- `position`: 必须是 GK / DEF / MID / FWD 之一
- `star`: 1-5 整数
- `skill1`, `skill2`: 必须在 skills.xlsx 的 id 列存在（空值允许）

### ai_teams.xlsx
- `card1Id` ~ `card7Id`: 必须在 cards.xlsx 的 id 列存在（空值表示该槽位无人）
- `card1X` ~ `card7X`, `card1Y` ~ `card7Y`: 0~1 之间的浮点数，表示球场归一化坐标

### stages.xlsx
- `aiTeamId`: 必须在 ai_teams.xlsx 的 teamId 列存在
- `unlockAfterStage`: 前置关卡ID，空值表示直接解锁

### balance.xlsx
- `type`: number / string / boolean
- `value` 必须与声明的 type 匹配

## 更新流程

1. 编辑 xlsx 文件
2. 运行 `npm run data`（或 watch 模式自动触发）
3. 检查终端输出，确认无校验错误
4. 生成的 JSON 文件在 `src/core/data/generated/`
