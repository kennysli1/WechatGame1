import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(import.meta.dirname!, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

function writeXlsx(filename: string, data: Record<string, unknown>[]): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const filePath = path.join(DATA_DIR, filename);
  // Use write() + fs to avoid ESM writeFile issues
  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  fs.writeFileSync(filePath, buf);
  console.log(`  → ${filename} (${data.length} rows)`);
}

console.log('=== Generating initial xlsx data files ===\n');

writeXlsx('cards.xlsx', [
  { id: 'gk_001', name: '李守门', position: 'GK', star: 3, attack: 20, defense: 85, speed: 50, technique: 55, skill1: 'skill_save', skill2: '', artAsset: 'card_gk_001', description: '稳健守门员' },
  { id: 'df_001', name: '张铁壁', position: 'DEF', star: 3, attack: 35, defense: 80, speed: 55, technique: 50, skill1: 'skill_tackle', skill2: '', artAsset: 'card_df_001', description: '坚固后卫' },
  { id: 'df_002', name: '王坚盾', position: 'DEF', star: 2, attack: 30, defense: 75, speed: 60, technique: 45, skill1: 'skill_tackle', skill2: '', artAsset: 'card_df_002', description: '快速后卫' },
  { id: 'mf_001', name: '陈中场', position: 'MID', star: 3, attack: 60, defense: 60, speed: 70, technique: 75, skill1: 'skill_through', skill2: '', artAsset: 'card_mf_001', description: '全能中场' },
  { id: 'mf_002', name: '刘组织', position: 'MID', star: 4, attack: 55, defense: 55, speed: 65, technique: 85, skill1: 'skill_through', skill2: 'skill_freekick', artAsset: 'card_mf_002', description: '组织核心' },
  { id: 'fw_001', name: '赵射手', position: 'FWD', star: 4, attack: 88, defense: 25, speed: 80, technique: 78, skill1: 'skill_shot', skill2: 'skill_dribble', artAsset: 'card_fw_001', description: '锋线杀手' },
  { id: 'fw_002', name: '孙飞翼', position: 'FWD', star: 3, attack: 75, defense: 30, speed: 90, technique: 70, skill1: 'skill_dribble', skill2: '', artAsset: 'card_fw_002', description: '极速边锋' },
  { id: 'fw_003', name: '周重炮', position: 'FWD', star: 5, attack: 95, defense: 20, speed: 70, technique: 88, skill1: 'skill_shot', skill2: 'skill_freekick', artAsset: 'card_fw_003', description: '传奇射手' },
]);

writeXlsx('skills.xlsx', [
  { id: 'skill_save', name: '神扑', description: '提升扑救成功率', type: 'passive', target: 'self', effectType: 'buff_defense', effectValue: 15, duration: 0, triggerCondition: 'on_shot', animKey: 'anim_save', cooldown: 0 },
  { id: 'skill_tackle', name: '飞铲', description: '提升铲断能力', type: 'passive', target: 'self', effectType: 'buff_defense', effectValue: 12, duration: 0, triggerCondition: 'on_tackle', animKey: 'anim_tackle', cooldown: 0 },
  { id: 'skill_shot', name: '暴力射门', description: '提升射门威力', type: 'active', target: 'self', effectType: 'buff_attack', effectValue: 20, duration: 1, triggerCondition: 'on_shot', animKey: 'anim_power_shot', cooldown: 3 },
  { id: 'skill_dribble', name: '灵巧过人', description: '提升突破成功率', type: 'active', target: 'self', effectType: 'buff_speed', effectValue: 18, duration: 1, triggerCondition: 'on_pass', animKey: 'anim_dribble', cooldown: 2 },
  { id: 'skill_through', name: '致命直塞', description: '提升传球精准度', type: 'active', target: 'team', effectType: 'buff_technique', effectValue: 15, duration: 2, triggerCondition: 'on_pass', animKey: 'anim_through', cooldown: 3 },
  { id: 'skill_freekick', name: '任意球大师', description: '获得额外定位球机会', type: 'active', target: 'self', effectType: 'buff_technique', effectValue: 25, duration: 1, triggerCondition: 'on_shot', animKey: 'anim_freekick', cooldown: 5 },
]);

writeXlsx('ai_teams.xlsx', [
  { teamId: 'ai_team_001', teamName: '新手挑战队', difficulty: 1, card1Id: 'gk_001', card1X: 0.05, card1Y: 0.5, card2Id: 'df_001', card2X: 0.2, card2Y: 0.3, card3Id: 'df_002', card3X: 0.2, card3Y: 0.7, card4Id: 'mf_001', card4X: 0.4, card4Y: 0.5, card5Id: 'fw_002', card5X: 0.7, card5Y: 0.5, card6Id: '', card6X: 0, card6Y: 0, card7Id: '', card7X: 0, card7Y: 0 },
  { teamId: 'ai_team_002', teamName: '实力对手', difficulty: 2, card1Id: 'gk_001', card1X: 0.05, card1Y: 0.5, card2Id: 'df_001', card2X: 0.2, card2Y: 0.3, card3Id: 'df_002', card3X: 0.2, card3Y: 0.7, card4Id: 'mf_001', card4X: 0.4, card4Y: 0.3, card5Id: 'mf_002', card5X: 0.4, card5Y: 0.7, card6Id: 'fw_001', card6X: 0.7, card6Y: 0.5, card7Id: '', card7X: 0, card7Y: 0 },
  { teamId: 'ai_team_003', teamName: '精英劲旅', difficulty: 3, card1Id: 'gk_001', card1X: 0.05, card1Y: 0.5, card2Id: 'df_001', card2X: 0.2, card2Y: 0.3, card3Id: 'df_002', card3X: 0.2, card3Y: 0.7, card4Id: 'mf_001', card4X: 0.4, card4Y: 0.3, card5Id: 'mf_002', card5X: 0.4, card5Y: 0.7, card6Id: 'fw_001', card6X: 0.65, card6Y: 0.35, card7Id: 'fw_003', card7X: 0.65, card7Y: 0.65 },
]);

writeXlsx('stages.xlsx', [
  { stageId: 'stage_001', name: '新手试炼', aiTeamId: 'ai_team_001', unlockAfterStage: '', rewardCardId: 'mf_001', rewardCoins: 100, description: '你的第一场比赛' },
  { stageId: 'stage_002', name: '城市联赛', aiTeamId: 'ai_team_002', unlockAfterStage: 'stage_001', rewardCardId: 'fw_001', rewardCoins: 200, description: '面对更强的对手' },
  { stageId: 'stage_003', name: '冠军之路', aiTeamId: 'ai_team_003', unlockAfterStage: 'stage_002', rewardCardId: 'fw_003', rewardCoins: 500, description: '终极挑战' },
]);

writeXlsx('balance.xlsx', [
  { key: 'passSuccessBase', value: 0.7, type: 'number', description: '基础传球成功率' },
  { key: 'shotPowerWeight', value: 0.4, type: 'number', description: '射门力量权重（vs技术）' },
  { key: 'homeAdvantage', value: 1.05, type: 'number', description: '主场优势系数' },
  { key: 'matchMinutes', value: 90, type: 'number', description: '比赛时长（分钟）' },
  { key: 'eventsPerMinute', value: 0.8, type: 'number', description: '每分钟事件概率' },
  { key: 'tackleBaseChance', value: 0.3, type: 'number', description: '基础铲断触发概率' },
  { key: 'shotChance', value: 0.4, type: 'number', description: '传球后射门概率' },
]);

writeXlsx('asset_manifest.xlsx', [
  { key: 'card_gk_001', path: 'assets/cards/card_gk_001.png', width: 256, height: 360, category: 'card', required: false, description: '守门员001卡面' },
  { key: 'card_df_001', path: 'assets/cards/card_df_001.png', width: 256, height: 360, category: 'card', required: false, description: '后卫001卡面' },
  { key: 'card_df_002', path: 'assets/cards/card_df_002.png', width: 256, height: 360, category: 'card', required: false, description: '后卫002卡面' },
  { key: 'card_mf_001', path: 'assets/cards/card_mf_001.png', width: 256, height: 360, category: 'card', required: false, description: '中场001卡面' },
  { key: 'card_mf_002', path: 'assets/cards/card_mf_002.png', width: 256, height: 360, category: 'card', required: false, description: '中场002卡面' },
  { key: 'card_fw_001', path: 'assets/cards/card_fw_001.png', width: 256, height: 360, category: 'card', required: false, description: '前锋001卡面' },
  { key: 'card_fw_002', path: 'assets/cards/card_fw_002.png', width: 256, height: 360, category: 'card', required: false, description: '前锋002卡面' },
  { key: 'card_fw_003', path: 'assets/cards/card_fw_003.png', width: 256, height: 360, category: 'card', required: false, description: '前锋003卡面' },
  { key: 'pitch_bg', path: 'assets/pitch/pitch_bg.png', width: 1136, height: 640, category: 'pitch', required: false, description: '球场全景背景' },
  { key: 'btn_primary', path: 'assets/ui/btn_primary.png', width: 200, height: 56, category: 'ui', required: false, description: '主按钮' },
  { key: 'logo', path: 'assets/ui/logo.png', width: 512, height: 256, category: 'ui', required: false, description: '游戏Logo' },
]);

console.log('\n✓ All xlsx files created in data/');
