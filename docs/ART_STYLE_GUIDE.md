# 美术风格指南

## 整体风格

- **基调**: 卡通/扁平 + 鲜艳配色，休闲足球主题
- **画风**: 简洁清爽的矢量感，边缘清晰，适合小屏幕显示
- **配色**: 以绿茵场为主色，搭配明亮活力色彩

## 调色板

| 用途 | 色值 | 说明 |
|------|------|------|
| 主色 | `#2d8a4e` | 草地绿 |
| 辅色 | `#16213e` | 深蓝（UI背景） |
| 强调色 | `#e63946` | 活力红（进攻/得分） |
| 金色 | `#ffd700` | 星级/MVP/奖励 |
| 蓝色 | `#457b9d` | 中场标识 |
| 绿色 | `#2a9d8f` | 防守标识 |
| 黄色 | `#e9c46a` | 守门员标识 |

## 球员卡规格

- **尺寸**: 256 x 360 px
- **背景**: 透明底
- **内容**: 半身像，动态姿势
- **风格**: 卡通比例，略夸张的运动姿态

### AI 生成 Prompt 模板

```
cartoon style football player, [position] pose, vibrant colors,
transparent background, 256x360px, flat shading, game card art,
clean lines, dynamic action pose, [specific description]
```

**位置变体:**
- GK: `goalkeeper diving save pose, wearing gloves`
- DEF: `defender tackling pose, strong stance`
- MID: `midfielder passing pose, balanced stance`
- FWD: `striker shooting pose, dynamic kick`

## 球场规格

- **尺寸**: 1136 x 640 px（或 800 x 500 游戏内）
- **视角**: 正俯视（或微微倾斜的等距视角）
- **元素**: 绿茵草地、白色线条标记、球门

## UI 元素规格

- **按钮**: 圆角矩形，渐变填充，微投影
- **面板**: 半透明深色底 + 圆角 + 微光边框
- **图标**: 48x48px，简洁扁平风

## 命名约定

`{类别}_{子类}_{编号}.png`

- `card_fw_001.png` — 前锋卡面001
- `card_gk_001.png` — 守门员卡面001
- `pitch_bg.png` — 球场背景
- `btn_primary.png` — 主按钮
- `icon_attack.png` — 攻击力图标
