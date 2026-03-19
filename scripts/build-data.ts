import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(import.meta.dirname!, '..', 'data');
const OUT_DIR = path.resolve(import.meta.dirname!, '..', 'src', 'core', 'data', 'generated');

interface ValidationError {
  file: string;
  row: number;
  field: string;
  message: string;
}

const VALID_POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];
const VALID_SKILL_TYPES = ['active', 'passive'];
const VALID_SKILL_TARGETS = ['self', 'enemy', 'team'];
const VALID_ASSET_CATEGORIES = ['card', 'pitch', 'ui', 'effect'];

function readSheet<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠ File not found: ${filePath}`);
    return [];
  }
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    console.warn(`  ⚠ No sheets in: ${filePath}`);
    return [];
  }
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<T>(sheet);
}

function validate(): ValidationError[] {
  const errors: ValidationError[] = [];

  const cards = readSheet<Record<string, unknown>>(path.join(DATA_DIR, 'cards.xlsx'));
  const skills = readSheet<Record<string, unknown>>(path.join(DATA_DIR, 'skills.xlsx'));
  const aiTeams = readSheet<Record<string, unknown>>(path.join(DATA_DIR, 'ai_teams.xlsx'));
  const stages = readSheet<Record<string, unknown>>(path.join(DATA_DIR, 'stages.xlsx'));
  const balance = readSheet<Record<string, unknown>>(path.join(DATA_DIR, 'balance.xlsx'));

  const cardIds = new Set(cards.map((c) => c.id as string));
  const skillIds = new Set(skills.map((s) => s.id as string));
  const aiTeamIds = new Set(aiTeams.map((t) => t.teamId as string));

  // Validate cards
  const seenCardIds = new Set<string>();
  cards.forEach((c, i) => {
    const row = i + 2;
    if (!c.id) errors.push({ file: 'cards.xlsx', row, field: 'id', message: 'id is required' });
    if (seenCardIds.has(c.id as string))
      errors.push({ file: 'cards.xlsx', row, field: 'id', message: `Duplicate id: ${c.id}` });
    seenCardIds.add(c.id as string);

    if (!VALID_POSITIONS.includes(c.position as string))
      errors.push({ file: 'cards.xlsx', row, field: 'position', message: `Invalid position: ${c.position}. Must be GK/DEF/MID/FWD` });

    const star = Number(c.star);
    if (!Number.isInteger(star) || star < 1 || star > 5)
      errors.push({ file: 'cards.xlsx', row, field: 'star', message: `Star must be 1-5, got: ${c.star}` });

    if (c.skill1 && !skillIds.has(c.skill1 as string))
      errors.push({ file: 'cards.xlsx', row, field: 'skill1', message: `Skill not found in skills.xlsx: ${c.skill1}` });
    if (c.skill2 && !skillIds.has(c.skill2 as string))
      errors.push({ file: 'cards.xlsx', row, field: 'skill2', message: `Skill not found in skills.xlsx: ${c.skill2}` });
  });

  // Validate skills
  const seenSkillIds = new Set<string>();
  skills.forEach((s, i) => {
    const row = i + 2;
    if (seenSkillIds.has(s.id as string))
      errors.push({ file: 'skills.xlsx', row, field: 'id', message: `Duplicate id: ${s.id}` });
    seenSkillIds.add(s.id as string);

    if (!VALID_SKILL_TYPES.includes(s.type as string))
      errors.push({ file: 'skills.xlsx', row, field: 'type', message: `Invalid type: ${s.type}` });
    if (!VALID_SKILL_TARGETS.includes(s.target as string))
      errors.push({ file: 'skills.xlsx', row, field: 'target', message: `Invalid target: ${s.target}` });
  });

  // Validate AI teams — card references
  aiTeams.forEach((t, i) => {
    const row = i + 2;
    for (let slot = 1; slot <= 7; slot++) {
      const cardIdKey = `card${slot}Id`;
      const cardId = t[cardIdKey] as string | undefined;
      if (cardId && !cardIds.has(cardId))
        errors.push({ file: 'ai_teams.xlsx', row, field: cardIdKey, message: `Card not found in cards.xlsx: ${cardId}` });
    }
  });

  // Validate stages — AI team references
  stages.forEach((s, i) => {
    const row = i + 2;
    if (s.aiTeamId && !aiTeamIds.has(s.aiTeamId as string))
      errors.push({ file: 'stages.xlsx', row, field: 'aiTeamId', message: `AI team not found in ai_teams.xlsx: ${s.aiTeamId}` });
  });

  // Validate balance — type consistency
  balance.forEach((b, i) => {
    const row = i + 2;
    const declaredType = b.type as string;
    const value = b.value;
    if (declaredType === 'number' && typeof value !== 'number')
      errors.push({ file: 'balance.xlsx', row, field: 'value', message: `Expected number, got: ${typeof value}` });
    if (declaredType === 'boolean' && typeof value !== 'boolean' && value !== 'true' && value !== 'false')
      errors.push({ file: 'balance.xlsx', row, field: 'value', message: `Expected boolean, got: ${value}` });
  });

  return errors;
}

function transformAITeams(raw: Record<string, unknown>[]): unknown[] {
  return raw.map((t) => {
    const slots: { cardId: string; x: number; y: number }[] = [];
    for (let i = 1; i <= 7; i++) {
      const cardId = t[`card${i}Id`] as string | undefined;
      if (cardId) {
        slots.push({
          cardId,
          x: Number(t[`card${i}X`] ?? 0.5),
          y: Number(t[`card${i}Y`] ?? 0.5),
        });
      }
    }
    return {
      teamId: t.teamId,
      teamName: t.teamName,
      difficulty: Number(t.difficulty),
      slots,
    };
  });
}

function transformBalance(raw: Record<string, unknown>[]): unknown[] {
  return raw.map((b) => {
    let value: unknown = b.value;
    if (b.type === 'number') value = Number(b.value);
    else if (b.type === 'boolean') value = b.value === true || b.value === 'true';
    return {
      key: b.key,
      value,
      type: b.type,
      description: b.description ?? '',
    };
  });
}

function build(): void {
  console.log('=== build-data: Excel → JSON ===');
  console.log(`  data dir:   ${DATA_DIR}`);
  console.log(`  output dir: ${OUT_DIR}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('\n[1/3] Validating...');
  const errors = validate();
  if (errors.length > 0) {
    console.error('\n❌ Validation failed:');
    for (const e of errors) {
      console.error(`  ${e.file} row ${e.row}, field "${e.field}": ${e.message}`);
    }
    process.exit(1);
  }
  console.log('  ✓ All validation passed');

  console.log('\n[2/3] Converting...');

  const cards = readSheet(path.join(DATA_DIR, 'cards.xlsx'));
  write('cards.json', cards);

  const skills = readSheet(path.join(DATA_DIR, 'skills.xlsx'));
  write('skills.json', skills);

  const aiTeamsRaw = readSheet<Record<string, unknown>>(path.join(DATA_DIR, 'ai_teams.xlsx'));
  write('ai_teams.json', transformAITeams(aiTeamsRaw));

  const stages = readSheet(path.join(DATA_DIR, 'stages.xlsx'));
  write('stages.json', stages);

  const balanceRaw = readSheet<Record<string, unknown>>(path.join(DATA_DIR, 'balance.xlsx'));
  write('balance.json', transformBalance(balanceRaw));

  const assetManifest = readSheet(path.join(DATA_DIR, 'asset_manifest.xlsx'));
  write('asset_manifest.json', assetManifest);

  console.log('\n[3/3] Done! ✓');
}

function write(filename: string, data: unknown): void {
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  const count = Array.isArray(data) ? data.length : 0;
  console.log(`  → ${filename} (${count} entries)`);
}

build();
