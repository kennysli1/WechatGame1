/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, readdirSync, statSync, renameSync, rmSync } from 'fs';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

const OUTPUT_DIR = resolve(__dirname, '.snapshot-temp');
const FINAL_PATH = resolve(__dirname, '热血球球_preview.html');

/**
 * 自定义 Vite 插件：构建时将 JSON 数据 + PNG 资源内联到 HTML 中，
 * 通过全局变量 __INLINE_JSON__ 和 __INLINE_ASSETS__ 注入。
 * 配合 DataManager 和 AssetManager 中的内联检查逻辑使用。
 */
function inlineGameData(): Plugin {
  return {
    name: 'inline-game-data',
    transformIndexHtml() {
      // 1. 内联 JSON 数据
      const jsonDir = resolve(__dirname, 'src/core/data/generated');
      const jsonNames = ['cards', 'skills', 'ai_teams', 'stages', 'balance', 'asset_manifest'];
      const jsonMap: Record<string, unknown> = {};
      for (const name of jsonNames) {
        const raw = readFileSync(resolve(jsonDir, `${name}.json`), 'utf-8');
        jsonMap[name] = JSON.parse(raw);
      }

      // 2. 内联图片资源为 base64 data URL
      const assetsRoot = resolve(__dirname, 'assets');
      const assetMap: Record<string, string> = {};

      function walkDir(dir: string) {
        for (const entry of readdirSync(dir)) {
          const full = resolve(dir, entry);
          if (statSync(full).isDirectory()) {
            walkDir(full);
          } else if (entry.endsWith('.png')) {
            const relPath = 'assets/' + full.substring(assetsRoot.length + 1).replace(/\\/g, '/');
            const b64 = readFileSync(full).toString('base64');
            assetMap[relPath] = `data:image/png;base64,${b64}`;
          }
        }
      }
      walkDir(assetsRoot);

      // 3. 注入 <script> 到 <head> 最前面，确保在应用代码之前执行
      const script = `
        window.__INLINE_JSON__ = ${JSON.stringify(jsonMap)};
        window.__INLINE_ASSETS__ = ${JSON.stringify(assetMap)};
      `;

      return [
        {
          tag: 'script',
          attrs: { type: 'text/javascript' },
          children: script,
          injectTo: 'head-prepend' as const,
        },
      ];
    },
  };
}

/**
 * 构建完成后将临时目录中的 index.html 移动到项目根目录并重命名，
 * 然后清理临时目录。
 */
function moveToRoot(): Plugin {
  return {
    name: 'move-snapshot-to-root',
    closeBundle() {
      const tempFile = resolve(OUTPUT_DIR, 'index.html');
      renameSync(tempFile, FINAL_PATH);
      rmSync(OUTPUT_DIR, { recursive: true, force: true });
      console.log(`\n  ✅ 预览文件已生成: 热血球球_preview.html\n`);
    },
  };
}

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2022',
    outDir: OUTPUT_DIR,
    assetsInlineLimit: 100 * 1024 * 1024,
  },
  plugins: [
    inlineGameData(),
    viteSingleFile(),
    moveToRoot(),
  ],
});
