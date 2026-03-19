/**
 * 监听 src/、assets/、data/ 目录变更，自动重新生成 热血球球_preview.html
 * 用法：npm run preview:watch
 */
import { watch } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const ROOT = resolve(import.meta.dirname!, '..');
const WATCH_DIRS = ['src', 'assets', 'data'];

let building = false;
let pendingRebuild = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function build() {
  if (building) {
    pendingRebuild = true;
    return;
  }
  building = true;
  const start = Date.now();
  console.log(`\n[preview:watch] 正在生成预览文件...`);
  try {
    execSync('npm run preview:static', { cwd: ROOT, stdio: 'inherit' });
    console.log(`[preview:watch] ✅ 完成 (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  } catch {
    console.error(`[preview:watch] ❌ 构建失败`);
  }
  building = false;
  if (pendingRebuild) {
    pendingRebuild = false;
    build();
  }
}

// 首次构建
build();

// 监听文件变更
for (const dir of WATCH_DIRS) {
  const fullPath = resolve(ROOT, dir);
  watch(fullPath, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    // 忽略生成文件和临时文件
    if (filename.includes('generated') || filename.startsWith('~$')) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log(`[preview:watch] 检测到变更: ${dir}/${filename}`);
      build();
    }, 500);
  });
}

console.log(`[preview:watch] 正在监听 ${WATCH_DIRS.join(', ')} 目录变更...`);
console.log(`[preview:watch] 按 Ctrl+C 退出\n`);
