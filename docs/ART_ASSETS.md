# 功夫足球 — 美术资产总表

> **用途**：所有美术资源与效果的**唯一参考文件**。其他模块改动、调用时据此查阅：  
> - 有哪些美术效果可用（key、路径、尺寸、用途）  
> - 哪些已接入、哪些尚未接入  
> - 哪些资产文件尚未就绪  

**调用方式**：通过 `AssetManager.getTexture(key)` 获取纹理，`key` 即下表中的 **key**。  
**数据源**：manifest 来自 `data/asset_manifest.xlsx` → `src/core/data/generated/asset_manifest.json`。

---

## 状态说明

| 符号 | 含义 |
|------|------|
| ✅ 已接入 | 代码中已使用 `getTexture(key)` 或等价逻辑 |
| 🔲 已入 manifest，未接入 | 已在 asset_manifest 中，有 key，但尚无模块使用 |
| ⬜ 未入 manifest | 规划中有，但未加入 asset_manifest.xlsx |
| 📁 文件缺失 | 路径下无对应文件（当前为占位/fallback） |
| 📁 文件存在 | 路径下已有该资源文件 |

---

## 1. 场景背景

| key | path | 尺寸 | 用途 | 文件 | 接入情况 |
|-----|------|------|------|------|----------|
| `menu_bg` | `assets/menu/main_menu_bg.svg` | 1136×640 | 主菜单背景（球场夜景、功夫剪影、标题区、三按钮槽、粒子） | 📁 存在 | ✅ **MenuScene** 已用 `getTexture('menu_bg')` 作背景 |
| `pitch_bg` | `assets/pitch/pitch_bg.png` | 1136×640 | 比赛/球场全景背景 | 📁 缺失 | 🔲 已入 manifest，**MatchScene / PitchView 尚未使用** |

---

## 2. 球员卡面（Card 卡图）

卡面由 `CardDef.artAsset` 指定 key，当前 **CardView 仅用 Graphics 绘制占位**，未调用 `getTexture(artAsset)`。

| key | path | 尺寸 | 用途 | 文件 | 接入情况 |
|-----|------|------|------|------|----------|
| `card_gk_001` | `assets/cards/card_gk_001.png` | 256×360 | 守门员·李守门 | 📁 缺失 | 🔲 已入 manifest，**CardView 未接纹理** |
| `card_df_001` | `assets/cards/card_df_001.png` | 256×360 | 后卫·张铁壁 | 📁 缺失 | 同上 |
| `card_df_002` | `assets/cards/card_df_002.png` | 256×360 | 后卫·王坚盾 | 📁 缺失 | 同上 |
| `card_mf_001` | `assets/cards/card_mf_001.png` | 256×360 | 中场·陈中场 | 📁 缺失 | 同上 |
| `card_mf_002` | `assets/cards/card_mf_002.png` | 256×360 | 中场·刘组织 | 📁 缺失 | 同上 |
| `card_fw_001` | `assets/cards/card_fw_001.png` | 256×360 | 前锋·赵射手 | 📁 缺失 | 同上 |
| `card_fw_002` | `assets/cards/card_fw_002.png` | 256×360 | 前锋·孙飞翼 | 📁 缺失 | 同上 |
| `card_fw_003` | `assets/cards/card_fw_003.png` | 256×360 | 前锋·周重炮 | 📁 缺失 | 同上 |

**接入建议**：在 `CardView` 中根据 `this.cardDef.artAsset` 调用 `assetManager.getTexture(artAsset)`，有纹理时用 `Sprite` 显示，无纹理时保留现有 Graphics 占位。

---

## 3. UI 通用

| key | path | 尺寸 | 用途 | 文件 | 接入情况 |
|-----|------|------|------|------|----------|
| `btn_primary` | `assets/ui/btn_primary.png` | 200×56 | 主按钮背景 | 📁 缺失 | 🔲 已入 manifest，**Button 组件当前为纯 Graphics，未用纹理** |
| `logo` | `assets/ui/logo.png` | 512×256 | 游戏 Logo | 📁 缺失 | 🔲 已入 manifest，**暂无场景使用**（可放在 MenuScene 标题区） |

**未入 manifest 的 UI（规划）**：

| 建议 key | 建议 path | 尺寸 | 用途 | 接入建议 |
|----------|-----------|------|------|----------|
| `btn_secondary` | `assets/ui/btn_secondary.png` | 200×56 | 次按钮背景 | Button 支持按 type 选纹理时使用 |
| `panel_bg` | `assets/ui/panel_bg.png` | 400×300 | 面板背景 | Panel 组件可选纹理背景时使用 |
| `icon_attack` | `assets/ui/icon_attack.png` | 48×48 | 攻击力 | 卡牌/属性栏图标 |
| `icon_defense` | `assets/ui/icon_defense.png` | 48×48 | 防守 | 同上 |
| `icon_speed` | `assets/ui/icon_speed.png` | 48×48 | 速度 | 同上 |
| `icon_technique` | `assets/ui/icon_technique.png` | 48×48 | 技术 | 同上 |

---

## 4. 球场与地形

| key | path | 尺寸 | 用途 | 文件 | 接入情况 |
|-----|------|------|------|------|----------|
| （见上） | `pitch_bg` | 1136×640 | 球场背景 | 见场景背景 | 见上 |
| ⬜ 未入 manifest | `assets/pitch/pitch_grass_tile.png` | 128×128 | 草地平铺纹理 | 📁 缺失 | 可用于 PitchView 或 MatchScene 地面平铺 |

---

## 5. 特效（动画帧 / 序列帧）

当前 manifest 与代码中**均未**接入以下特效，属规划资产。

| 建议 key / 路径 | 帧尺寸 | 帧数 | 用途 | 建议接入模块 |
|-----------------|--------|------|------|--------------|
| `assets/effects/goal_celebration/` | 128×128 | 3 | 进球庆祝 | MatchScene 进球时播放 |
| `assets/effects/shot_trail/` | 64×64 | 3 | 射门轨迹 | MatchAnimator / MatchScene 射门时 |

**说明**：若使用序列帧，需在 manifest 中约定多帧资源的 key 规则（如 `effect_goal_01`…）或由 AssetManager 扩展加载序列帧 API。

---

## 6. 仅作参考、不通过 manifest 加载的资源

| 路径 | 用途 |
|------|------|
| `assets/ui/style-reference.svg` | UI 风格参考（配色、描边、按钮/面板示例），不参与运行时加载 |

---

## 7. 模块与资产对应速查

| 模块 | 已用资产 | 可接未接资产 |
|------|----------|-----------------------------|
| **MenuScene** | `menu_bg` | `logo`（标题区） |
| **MatchScene** | — | `pitch_bg`（背景）, 进球/射门特效 |
| **PitchView** | — | `pitch_bg`, `pitch_grass_tile` |
| **CardView** | — | `card_*`（cardDef.artAsset） |
| **Button** | — | `btn_primary`, `btn_secondary` |
| **Panel** | — | `panel_bg` |

---

## 8. 维护约定

- 新增或删除资产时：  
  1. 在 **asset_manifest.xlsx** 中增/删行（或通过脚本维护），运行 `npm run data` 生成 JSON。  
  2. 在本文件 **ART_ASSETS.md** 中同步更新对应表格与「已接入/未接入」状态。  
- 某模块首次使用某 key 时：在本文件该 key 的「接入情况」中写上模块名，便于后续排查与复用。

---

## 9. 美术资产生成 Todo 清单（含 Prompt）

> **用途**：本节作为美术资产生成的执行清单，是各资产 Prompt 的**唯一真实来源**。每次生成并放置文件后，在对应 checkbox 打 `[x]`，并按第 9.4 节维护约定同步更新第 1–7 节表格。

---

### 9.0 全局风格前缀（所有 Prompt 共用）

以下文本作为**前缀**追加到每条 Prompt 的开头（后面用逗号连接具体描述）：

> `Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified`

调色板色值参考（描述颜色时使用）：  
草地绿 `#2d8a4e` · 深蓝 `#16213e` · 行动红 `#e63946` · 金色 `#ffd700` · 青绿 `#2a9d8f` · 暖黄 `#e9c46a` · 中场蓝 `#457b9d`

---

### 9.1 UI 交互页面（6 项）

- [ ] **`pitch_bg`** — 比赛球场背景
  - 路径：`assets/pitch/pitch_bg.png` | 尺寸：1136×640
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, soccer pitch top-down view (slightly isometric angle), bright grass green (#2d8a4e) with white line markings (center circle, penalty areas, halfway line, corner arcs), two goals on left and right sides, clean flat cartoon turf texture, faint crowd silhouettes in background bleachers, 1136x640px landscape orientation, transparent outer padding`

- [ ] **`logo`** — 游戏 Logo
  - 路径：`assets/ui/logo.png` | 尺寸：512×256
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, game logo design combining Chinese characters "功夫足球" and English text "KUNG FU SOCCER", kung fu fighter silhouette kicking a soccer ball integrated into the layout, action red (#e63946) primary color with gold (#ffd700) accent highlights, bold dramatic typography with glowing outline effect, transparent background, 512x256px`

- [ ] **`btn_primary`** — 主操作按钮底图
  - 路径：`assets/ui/btn_primary.png` | 尺寸：200×56
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, rounded rectangle button shape, action red (#e63946) solid fill, 2-3px black border, subtle 3D bottom-edge bevel shadow for depth, no text (text overlaid in code at runtime), transparent background, 200x56px`

- [ ] **`btn_secondary`** — 次操作按钮底图
  - 路径：`assets/ui/btn_secondary.png` | 尺寸：200×56
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, rounded rectangle button shape, teal (#2a9d8f) solid fill, 2-3px black border, subtle 3D bottom-edge bevel shadow for depth, no text (text overlaid in code at runtime), transparent background, 200x56px`

- [ ] **`panel_bg`** — 通用面板背景
  - 路径：`assets/ui/panel_bg.png` | 尺寸：400×300
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, rounded rectangle panel background, deep blue (#16213e) fill, 2-3px black border, small decorative diagonal corner bracket accents in gold (#ffd700), slightly darker inner recessed area, no icons or text inside, transparent outer region, 400x300px`

- [ ] **`icon_star`** — 星级评分图标
  - 路径：`assets/ui/icon_star.png` | 尺寸：48×48
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, single five-pointed star icon, gold (#ffd700) fill with bright highlight glint on top-left facet, 2-3px black outline, centered on transparent background, clean flat vector style with slight cartoon puffiness, no drop shadow, 48x48px`

---

### 9.2 球员卡面与头像 Icon（5 项）

> **卡面规格**：256×360px，透明底，半身人物像，略夸张的动态运动姿势，卡通比例。  
> **头像规格**：64×64px，透明底，头部特写，构图适合圆形/方形裁切。

- [ ] **`card_gk_001`** — 守门员卡面（李守门）
  - 路径：`assets/cards/card_gk_001.png` | 尺寸：256×360
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, goalkeeper half-body portrait, diving save pose with arms fully extended, wearing warm yellow gloves (#e9c46a) and yellow-black jersey, shaved head with intense determined expression, kung fu martial arts energy in posture, dramatic wide stance, transparent background, 256x360px`

- [ ] **`card_df_001`** — 后卫卡面（张铁壁）
  - 路径：`assets/cards/card_df_001.png` | 尺寸：256×360
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, defender half-body portrait, strong sliding tackle pose with sweeping leg motion, muscular stocky build with stern protective expression, teal and black jersey (#2a9d8f), teal headband, kung fu iron-body stance, transparent background, 256x360px`

- [ ] **`card_mf_001`** — 中场卡面（陈中场）
  - 路径：`assets/cards/card_mf_001.png` | 尺寸：256×360
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, midfielder half-body portrait, dynamic passing pose with arms out for balance and one leg raised, agile slim build with calm intelligent expression, blue jersey (#457b9d), kung fu balanced-stance influence, transparent background, 256x360px`

- [ ] **`card_fw_001`** — 前锋卡面（赵射手）
  - 路径：`assets/cards/card_fw_001.png` | 尺寸：256×360
  - Prompt：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, striker half-body portrait, powerful shooting pose with dynamic high kick, soccer ball at foot with energy aura, energetic athletic build with fierce battle expression, action red jersey (#e63946), kung fu flying-kick stance, transparent background, 256x360px`

- [ ] **`avatar_icon`** — 球员头像 Icon 通用模板（含 GK / DEF / MID / FWD 四位置变体）
  - 路径：`assets/cards/avatar_{position}.png`（如 `avatar_gk.png`、`avatar_df.png`、`avatar_mf.png`、`avatar_fw.png`）| 尺寸：64×64
  - Prompt 通用模板（替换 `[POSITION_DESC]` 生成四张）：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, player head-and-shoulders avatar icon, [POSITION_DESC], round-crop friendly tight framing, large expressive cartoon face, consistent style across all positions, transparent background, 64x64px`
  - 位置变体替换 `[POSITION_DESC]`：
    - **GK** → `goalkeeper, warm yellow cap and gloves (#e9c46a), calm focused eyes, confident expression`
    - **DEF** → `defender, teal headband (#2a9d8f), square jaw, stern no-nonsense expression`
    - **MID** → `midfielder, blue jersey collar (#457b9d), sharp intelligent eyes, composed expression`
    - **FWD** → `striker, red jersey (#e63946), fierce eyes with flame glint, determined battle expression`

---

### 9.3 技能特效（5 项）

> **特效规格**：序列帧 PNG，透明底。接入时需在 `AssetManager` 扩展序列帧加载 API；key 命名规则：`effect_{name}_{帧序号两位数字}`（如 `effect_goal_01`、`effect_goal_02`、`effect_goal_03`）。

- [ ] **`effect_goal_celebration`** — 进球庆祝特效（3 帧）
  - 路径：`assets/effects/goal_celebration/effect_goal_{01-03}.png` | 帧尺寸：128×128
  - Prompt 模板（分三次生成，替换 `[FRAME]` 和 `[FRAME_DESC]`）：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, goal celebration burst effect sprite animation frame [FRAME] of 3, [FRAME_DESC], gold stars and confetti explosion with action red accents (#e63946 #ffd700), centered composition, transparent background, 128x128px`
  - 帧描述：`[FRAME 1]` small concentrated spark burst igniting at center · `[FRAME 2]` full confetti and star explosion at peak size · `[FRAME 3]` fading sparkle and confetti pieces dissipating outward

- [ ] **`effect_shot_trail`** — 射门球运动轨迹特效（3 帧）
  - 路径：`assets/effects/shot_trail/effect_shot_{01-03}.png` | 帧尺寸：64×64
  - Prompt 模板：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, soccer ball speed trail sprite animation frame [FRAME] of 3, [FRAME_DESC], horizontal speed lines and motion blur streaks, white and gold energy trail (#ffd700 #ffffff), transparent background, 64x64px`
  - 帧描述：`[FRAME 1]` short faint tail just forming · `[FRAME 2]` full bright speed-lines trail at peak intensity · `[FRAME 3]` long fading afterimage dissolving away

- [ ] **`effect_skill_aura_attack`** — 攻击技能光环特效（3 帧）
  - 路径：`assets/effects/skill_aura/effect_aura_atk_{01-03}.png` | 帧尺寸：128×128
  - Prompt 模板：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, attack skill chi aura activation sprite animation frame [FRAME] of 3, [FRAME_DESC], circular energy ring expanding outward with kung fu flame effect, action red and orange fire colors (#e63946 #ff7700), centered composition, transparent background, 128x128px`
  - 帧描述：`[FRAME 1]` small tight energy ring forming at center · `[FRAME 2]` full expanded aura ring with blazing flame tendrils · `[FRAME 3]` outer ring dissipating into floating embers

- [ ] **`effect_skill_aura_defense`** — 防守技能护盾光环特效（3 帧）
  - 路径：`assets/effects/skill_aura/effect_aura_def_{01-03}.png` | 帧尺寸：128×128
  - Prompt 模板：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, defense skill iron-body shield aura sprite animation frame [FRAME] of 3, [FRAME_DESC], hexagonal tile barrier pattern forming a protective ring, teal and icy blue colors (#2a9d8f #a8dadc), solid fortress feeling with kung fu chi glow, centered composition, transparent background, 128x128px`
  - 帧描述：`[FRAME 1]` small hexagonal pattern pieces assembling at center · `[FRAME 2]` full hexagonal shield ring fully formed with inner glow · `[FRAME 3]` shield shattering outward into teal crystal shards

- [ ] **`effect_tackle_spark`** — 铲球碰撞火花特效（3 帧）
  - 路径：`assets/effects/tackle_spark/effect_tackle_{01-03}.png` | 帧尺寸：64×64
  - Prompt 模板：`Kung Fu Soccer mobile game art, cartoon flat style, vibrant saturated colors, clean vector-like edges, bold outlines (2-3px black), game UI asset, optimized for small screen display, no gradients unless specified, tackle impact collision spark sprite animation frame [FRAME] of 3, [FRAME_DESC], cartoon impact starburst with flying sparks and stars, yellow and white colors (#ffd700 #ffffff) with black outline, centered composition, transparent background, 64x64px`
  - 帧描述：`[FRAME 1]` initial bright white impact flash and center starburst · `[FRAME 2]` full starburst explosion with scattered yellow sparks and cartoon stars · `[FRAME 3]` fading scattered sparks drifting outward

---

### 9.4 维护约定（更新规则）

每次**生成并放置**资产文件后，必须执行以下步骤：

1. 将本节对应 checkbox 由 `- [ ]` 改为 `- [x]`
2. 在第 1–7 节对应表格中更新：
   - 「文件」列：`📁 缺失` → `📁 文件存在`
   - 「接入情况」列：注明当前接入状态（如 `🔲 已入 manifest，待接入`）
3. 若新增了规划外的资产，同步更新 `data/asset_manifest.xlsx` 并运行 `npm run data`
4. 告知用户：「资产已就绪，ART_ASSETS.md 已同步更新」
