import type { IPlatform } from './IPlatform.ts';

/**
 * Phase 2: WeChat Mini Game platform adapter.
 * Placeholder — will be implemented when targeting wx environment.
 */
export class WxPlatform implements IPlatform {
  readonly name = 'wx';

  storageGet(key: string): string | null {
    // TODO: wx.getStorageSync
    console.warn('[WxPlatform] storageGet not implemented', key);
    return null;
  }

  storageSet(key: string, value: string): void {
    // TODO: wx.setStorageSync
    console.warn('[WxPlatform] storageSet not implemented', key, value);
  }

  storageRemove(key: string): void {
    // TODO: wx.removeStorageSync
    console.warn('[WxPlatform] storageRemove not implemented', key);
  }

  getSystemInfo() {
    // TODO: wx.getSystemInfoSync
    return { width: 375, height: 667, pixelRatio: 2 };
  }
}
