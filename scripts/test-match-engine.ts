/**
 * 控制台测试脚本 — Mod-B: MatchEngine、AIOpponent、FormationValidator
 * 运行方式: npx tsx scripts/test-match-engine.ts
 */
import { MockDataManager } from '../src/core/mocks/MockDataManager.ts';
import { MatchEngine } from '../src/core/systems/MatchEngine.ts';
import { AIOpponent } from '../src/core/systems/AIOpponent.ts';
import { FormationValidator } from '../src/core/systems/FormationValidator.ts';
import type { MatchEvent } from '../src/core/models/MatchEvent.ts';
import type { MatchResult } from '../src/core/models/MatchResult.ts';
import type { Team } from '../src/core/models/Team.ts';

const data = new MockDataManager();
const engine = new MatchEngine(data);
const aiOpponent = new AIOpponent(data);
const validator = new FormationValidator();

function name(id: string): string {
  try { return data.getCard(id).name; } catch { return id; }
}

function formatEvent(e: MatchEvent): string {
  switch (e.type) {
    case 'kickoff':  return `[${String(e.minute).padStart(2)}'] ⚽ 开球`;
    case 'pass':     return `[${String(e.minute).padStart(2)}'] ${e.success ? '✓' : '✗'} 传球 ${name(e.from)} → ${name(e.to)}`;
    case 'tackle':   return `[${String(e.minute).padStart(2)}'] ${e.success ? '✓' : '✗'} 铲断 ${name(e.tackler)} → ${name(e.target)}`;
    case 'shot':     return `[${String(e.minute).padStart(2)}'] ${e.onTarget ? '🎯' : '✗'} 射门 ${name(e.player)}`;
    case 'save':     return `[${String(e.minute).padStart(2)}'] 🧤 扑救 ${name(e.goalkeeper)}`;
    case 'goal':     return `[${String(e.minute).padStart(2)}'] ⚽ 进球! ${name(e.scorer)}${e.assist ? ` (助攻 ${name(e.assist)})` : ''}`;
    case 'skill':    return `[${String(e.minute).padStart(2)}'] ✨ 技能 ${name(e.player)} → ${e.skillId}`;
    case 'halftime': return `--- 中场休息 ---`;
    case 'fulltime': return `--- 终场 ${e.homeGoals}-${e.awayGoals} ---`;
  }
}

function printResult(r: MatchResult): void {
  console.log(`  ${r.homeName} ${r.homeGoals} - ${r.awayGoals} ${r.awayName}`);
  console.log(`  MVP: ${name(r.mvpPlayerId)}`);
  console.log(`  事件数: ${r.events.length}`);
}

function printTeam(t: Team): void {
  const gk  = t.formation.filter(s => s.card.position === 'GK').length;
  const def = t.formation.filter(s => s.card.position === 'DEF').length;
  const mid = t.formation.filter(s => s.card.position === 'MID').length;
  const fwd = t.formation.filter(s => s.card.position === 'FWD').length;
  console.log(`  ${t.name} (${t.formation.length} 人 | GK:${gk} DEF:${def} MID:${mid} FWD:${fwd})`);
  for (const s of t.formation) {
    const c = s.card;
    console.log(`    ${c.name.padEnd(4)} [${c.position}] atk=${c.attack} def=${c.defense} spd=${c.speed} tech=${c.technique}`);
  }
}

// ---------------------------------------------------------------------------
console.log('=== 热血球球 · 比赛引擎测试（7V7）===\n');

// Test 1: AI 队伍生成（7 人）
console.log('--- Test 1: AI 队伍生成 ---');
const teamA = aiOpponent.generateTeamById('ai_team_001');
const teamB = aiOpponent.generateTeamById('ai_team_003');
printTeam(teamA);
printTeam(teamB);
console.log(`  从关卡 stage_002 生成: ${aiOpponent.generateTeam('stage_002').name}`);

// Test 2: 阵型校验
console.log('\n--- Test 2: 阵型校验 ---');
for (const t of [teamA, teamB]) {
  const v = validator.validate(t);
  console.log(`  ${t.name}: ${v.valid ? '✓ 合法' : '✗ 不合法'}`);
  if (v.errors.length)   console.log(`    错误: ${v.errors.join('; ')}`);
  if (v.warnings.length) console.log(`    警告: ${v.warnings.join('; ')}`);
}

// 非法阵容：人数不足
const tooFew: Team = {
  name: '人数不足队',
  formation: [
    { card: data.getCard('gk_001'),  x: 0.05, y: 0.5 },
    { card: data.getCard('fw_001'),  x: 0.7,  y: 0.3 },
    { card: data.getCard('fw_002'),  x: 0.7,  y: 0.7 },
  ],
};
const r1 = validator.validate(tooFew);
console.log(`  ${tooFew.name}: ${r1.valid ? '✓' : '✗'} ${r1.errors.join('; ')}`);

// 非法阵容：无门将
const noGK: Team = {
  name: '无门将队',
  formation: [
    { card: data.getCard('df_001'), x: 0.1,  y: 0.2 },
    { card: data.getCard('df_002'), x: 0.1,  y: 0.8 },
    { card: data.getCard('mf_001'), x: 0.4,  y: 0.2 },
    { card: data.getCard('mf_002'), x: 0.4,  y: 0.8 },
    { card: data.getCard('fw_001'), x: 0.7,  y: 0.2 },
    { card: data.getCard('fw_002'), x: 0.7,  y: 0.5 },
    { card: data.getCard('fw_003'), x: 0.7,  y: 0.8 },
  ],
};
const r2 = validator.validate(noGK);
console.log(`  ${noGK.name}: ${r2.valid ? '✓' : '✗'} ${r2.errors.join('; ')}`);

// Test 3: 单场比赛完整日志（seed=42）
console.log('\n--- Test 3: 单场比赛 (seed=42) ---');
const match1 = engine.simulate(teamA, teamB, 42);
printResult(match1);
console.log('  事件日志:');
for (const e of match1.events) {
  console.log(`    ${formatEvent(e)}`);
}

// Test 4: 确定性
console.log('\n--- Test 4: 确定性验证 ---');
const match2 = engine.simulate(teamA, teamB, 42);
const same =
  match1.homeGoals === match2.homeGoals &&
  match1.awayGoals === match2.awayGoals &&
  match1.events.length === match2.events.length &&
  match1.mvpPlayerId === match2.mvpPlayerId;
console.log(`  seed=42 两次模拟: ${same ? '✓ 结果完全一致' : '✗ 结果不一致!'}`);

const match3 = engine.simulate(teamA, teamB, 99);
const diff = match1.homeGoals !== match3.homeGoals ||
             match1.awayGoals !== match3.awayGoals ||
             match1.events.length !== match3.events.length;
console.log(`  seed=42 vs seed=99: ${diff ? '✓ 结果不同（符合预期）' : '⚠ 结果相同（可能巧合）'}`);

// Test 5: 批量模拟（200 场）
console.log('\n--- Test 5: 批量模拟（200 场，teamA vs teamB）---');
let winsA = 0, winsB = 0, draws = 0;
let totalGoals = 0, totalEvents = 0, totalSkills = 0;
const N = 200;
for (let i = 0; i < N; i++) {
  const r = engine.simulate(teamA, teamB, 1000 + i);
  if (r.homeGoals > r.awayGoals) winsA++;
  else if (r.homeGoals < r.awayGoals) winsB++;
  else draws++;
  totalGoals  += r.homeGoals + r.awayGoals;
  totalEvents += r.events.length;
  totalSkills += r.events.filter(e => e.type === 'skill').length;
}
console.log(`  ${teamA.name} 胜: ${winsA}  平: ${draws}  ${teamB.name} 胜: ${winsB}`);
console.log(`  ${teamA.name} 胜率: ${((winsA / N) * 100).toFixed(1)}%`);
console.log(`  ${teamB.name} 胜率: ${((winsB / N) * 100).toFixed(1)}%`);
console.log(`  场均总进球: ${(totalGoals  / N).toFixed(2)}`);
console.log(`  场均事件数: ${(totalEvents / N).toFixed(1)}`);
console.log(`  场均技能触发: ${(totalSkills / N).toFixed(1)}`);

// Test 6: 镜像对决（主场优势验证）
console.log('\n--- Test 6: 镜像对决（100 场，teamB vs teamB）---');
let mHome = 0, mAway = 0, mDraw = 0;
for (let i = 0; i < 100; i++) {
  const r = engine.simulate(teamB, teamB, 5000 + i);
  if (r.homeGoals > r.awayGoals) mHome++;
  else if (r.homeGoals < r.awayGoals) mAway++;
  else mDraw++;
}
console.log(`  主场胜: ${mHome}  平: ${mDraw}  客场胜: ${mAway}`);
console.log(`  （homeAdvantage=1.05，主场应略占优）`);

console.log('\n=== 测试完成 ===');
