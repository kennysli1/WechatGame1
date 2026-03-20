# 美术风格指南 — Kung Fu Soccer 功夫足球

## 整体风格（移动端游戏 UI）

- **风格**: 卡通扁平（cartoon flat style）
- **色彩**: 高饱和度、鲜艳明快（vibrant saturated colors）
- **轮廓**: 干净矢量感边缘，**粗黑描边 2–3px**（clean vector-like edges, bold black outlines）
- **用途**: 游戏 UI 资源，针对小屏显示优化（game UI asset, optimized for small screen display）
- **填充**: **默认无渐变**，纯色块；仅在文档单独说明时使用渐变（no gradients unless specified）

## 调色板（官方色值）

| 用途 | 色值 | 说明 |
|------|------|------|
| 草地绿 | `#2d8a4e` | 球场/主色 (grass green) |
| 深蓝 | `#16213e` | UI 背景 (deep blue) |
| 行动红 | `#e63946` | 进攻/得分/强调 (action red) |
| 金色 | `#ffd700` | 星级/MVP/奖励 (gold) |
| 青绿 | `#2a9d8f` | 防守/辅助 (teal) |
| 暖黄 | `#e9c46a` | 守门员/高亮 (warm yellow) |

> 扩展用色（如需）：中场蓝 `#457b9d`。描边统一用黑色 `#000000`，线宽 2–3px。

## 球员卡规格

- **尺寸**: 256 x 360 px
- **背景**: 透明底
- **内容**: 半身像，动态姿势
- **风格**: 卡通比例，略夸张的运动姿态

### AI 生成 Prompt 模板

```
Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors,
clean vector-like edges, bold outlines (2-3px black), game UI asset,
optimized for small screen display, no gradients unless specified,
transparent background, 256x360px, [position] pose, [specific description]
```

**位置变体:**
- GK: `goalkeeper diving save pose, wearing gloves`
- DEF: `defender tackling pose, strong stance`
- MID: `midfielder passing pose, balanced stance`
- FWD: `striker shooting pose, dynamic kick`

## 主菜单背景（main menu background）

- **尺寸**: 1136 x 640 px，横屏宽屏（cinematic widescreen）
- **主题**: 球场夜景、草皮视角（stadium night scene, pitch level）, 戏剧光效（dramatic lighting）
- **景深分层**（layered depth，从远到近）:
  1. 远处看台（far stadium bleachers）— 深色剪影
  2. 中场灯光（midfield lights）— 暖黄/金色光带
  3. 近处草皮（near pitch）— 草地绿 `#2d8a4e`
- **天空**: 深蓝渐变 `#16213e`（dark blue sky gradient，此处为指定例外）
- **氛围**: 边线处功夫武者剪影（kung fu fighters silhouettes on sidelines）、漂浮粒子/彩纸（particles/confetti）
- **布局**: 标题发光区居中偏上（glowing title area center-top）、三个按钮槽居中偏下（three button slots center-bottom）
- **源文件**: `assets/menu/main_menu_bg.svg`（可导出为 PNG 供 PixiJS 使用）

## 球场规格

- **尺寸**: 1136 x 640 px（或 800 x 500 游戏内）
- **视角**: 正俯视（或微微倾斜的等距视角）
- **元素**: 绿茵草地、白色线条标记、球门

## UI 元素规格

- **描边**: 所有 UI 形状使用 **2–3px 黑色描边**，无渐变时用纯色填充
- **按钮**: 圆角矩形，纯色填充（主按钮可用 `#e63946` 或 `#2d8a4e`），2–3px 黑边
- **面板**: 深蓝 `#16213e` 或纯色块 + 圆角 + 2–3px 黑边；需要时再使用半透明
- **图标**: 48x48px，扁平、粗黑描边、调色板内纯色

## 命名约定

`{类别}_{子类}_{编号}.png`

- `card_fw_001.png` — 前锋卡面001
- `card_gk_001.png` — 守门员卡面001
- `pitch_bg.png` — 球场背景
- `btn_primary.png` — 主按钮
- `icon_attack.png` — 攻击力图标
