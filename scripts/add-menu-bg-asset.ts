/**
 * One-off: add menu_bg entry to data/asset_manifest.xlsx so it is included when running npm run data.
 */
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.resolve(import.meta.dirname!, '..', 'data');
const FILE = path.join(DATA_DIR, 'asset_manifest.xlsx');

const newRow = {
  key: 'menu_bg',
  path: 'assets/menu/main_menu_bg.svg',
  width: 1136,
  height: 640,
  category: 'ui',
  required: false,
  description: '主菜单背景-球场夜景',
};

const buf = fs.readFileSync(FILE);
const wb = XLSX.read(buf, { type: 'buffer' });
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

if (rows.some((r) => r.key === 'menu_bg')) {
  console.log('menu_bg already in asset_manifest.xlsx');
  process.exit(0);
}

rows.push(newRow as Record<string, unknown>);
const newSheet = XLSX.utils.json_to_sheet(rows);
wb.Sheets[sheetName] = newSheet;
fs.writeFileSync(FILE, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
console.log('Added menu_bg to data/asset_manifest.xlsx');
process.exit(0);
