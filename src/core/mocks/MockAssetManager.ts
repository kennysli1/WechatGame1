import { Texture, type Graphics } from 'pixi.js';
import type { AssetManifestEntry } from '../data/schemas.ts';

/** Development-time mock — all textures return Texture.EMPTY, no network requests. */
export class MockAssetManager {
  getTexture(_key: string): Texture {
    return Texture.EMPTY;
  }

  registerFallback(_key: string, _drawFn: () => Graphics): void {}

  async loadManifest(_manifest: AssetManifestEntry[]): Promise<void> {
    console.log('[MockAssetManager] loadManifest() — no-op');
  }

  async loadEntries(_entries: unknown[]): Promise<void> {}

  hasTexture(_key: string): boolean {
    return false;
  }

  replaceTexture(_key: string, _newTexture: Texture): void {}
}
