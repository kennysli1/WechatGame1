import { Assets, Texture, Graphics, RenderTexture, type Renderer } from 'pixi.js';
import type { AssetManifestEntry } from '../core/data/schemas.ts';

export interface AssetEntry {
  key: string;
  path: string;
  width: number;
  height: number;
  required: boolean;
}

export class AssetManager {
  private textures = new Map<string, Texture>();
  private fallbacks = new Map<string, () => Graphics>();
  private renderer: Renderer | null = null;

  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
  }

  registerFallback(key: string, drawFn: () => Graphics): void {
    this.fallbacks.set(key, drawFn);
  }

  async loadManifest(manifest: AssetManifestEntry[]): Promise<void> {
    const entries = manifest.map((m) => ({
      key: m.key,
      path: m.path,
      width: m.width,
      height: m.height,
      required: m.required,
    }));

    await this.loadEntries(entries);
  }

  async loadEntries(entries: AssetEntry[]): Promise<void> {
    // 快照模式：使用构建时预注入的 base64 data URL
    const inlineAssets: Record<string, string> | undefined =
      (globalThis as any).__INLINE_ASSETS__;

    for (const entry of entries) {
      try {
        const src = inlineAssets?.[entry.path] ?? entry.path;
        const texture = await Assets.load<Texture>(src);
        this.textures.set(entry.key, texture);
      } catch {
        if (entry.required) {
          console.error(`[AssetManager] Required asset failed to load: ${entry.key} (${entry.path})`);
        }
        this.applyFallback(entry.key);
      }
    }
  }

  private applyFallback(key: string): void {
    const drawFn = this.fallbacks.get(key);
    if (drawFn && this.renderer) {
      const graphics = drawFn();
      const bounds = graphics.getBounds();
      const rt = RenderTexture.create({
        width: Math.max(1, Math.ceil(bounds.width)),
        height: Math.max(1, Math.ceil(bounds.height)),
      });
      this.renderer.render({ container: graphics, target: rt });
      this.textures.set(key, rt);
      graphics.destroy();
    } else {
      this.textures.set(key, Texture.EMPTY);
    }
  }

  getTexture(key: string): Texture {
    const tex = this.textures.get(key);
    if (tex) return tex;

    this.applyFallback(key);
    return this.textures.get(key) ?? Texture.EMPTY;
  }

  replaceTexture(key: string, newTexture: Texture): void {
    const old = this.textures.get(key);
    if (old && old !== Texture.EMPTY) {
      old.destroy(true);
    }
    this.textures.set(key, newTexture);
  }

  hasTexture(key: string): boolean {
    return this.textures.has(key) && this.textures.get(key) !== Texture.EMPTY;
  }
}
