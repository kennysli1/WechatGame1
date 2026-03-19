import type { IPlatform } from './IPlatform.ts';

export class WebPlatform implements IPlatform {
  readonly name = 'web';

  storageGet(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  storageSet(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('[WebPlatform] storageSet failed:', e);
    }
  }

  storageRemove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('[WebPlatform] storageRemove failed:', e);
    }
  }

  getSystemInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
    };
  }
}
