import { describe, it, expect, beforeEach } from 'vitest';
import { WebPlatform } from '../platform/WebPlatform.ts';

/**
 * WebPlatform wraps localStorage. We test via the public IPlatform API
 * using a minimal localStorage shim (Node has no built-in localStorage).
 */

const localStorageShim = (() => {
  let store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
})();

// Inject shim into globalThis so WebPlatform can find it
Object.defineProperty(globalThis, 'localStorage', { value: localStorageShim, writable: true });
Object.defineProperty(globalThis, 'window', {
  value: { innerWidth: 800, innerHeight: 600, devicePixelRatio: 2 },
  writable: true,
});

describe('WebPlatform', () => {
  let platform: WebPlatform;

  beforeEach(() => {
    localStorageShim.clear();
    platform = new WebPlatform();
  });

  it('has name "web"', () => {
    expect(platform.name).toBe('web');
  });

  describe('storageGet / storageSet', () => {
    it('returns null for missing key', () => {
      expect(platform.storageGet('no_such_key')).toBeNull();
    });

    it('round-trips a string value', () => {
      platform.storageSet('foo', 'bar');
      expect(platform.storageGet('foo')).toBe('bar');
    });

    it('overwrites existing value', () => {
      platform.storageSet('k', 'v1');
      platform.storageSet('k', 'v2');
      expect(platform.storageGet('k')).toBe('v2');
    });

    it('stores JSON strings intact', () => {
      const obj = { a: 1, b: [2, 3] };
      const json = JSON.stringify(obj);
      platform.storageSet('json', json);
      expect(JSON.parse(platform.storageGet('json')!)).toEqual(obj);
    });
  });

  describe('storageRemove', () => {
    it('removes an existing key', () => {
      platform.storageSet('k', 'v');
      platform.storageRemove('k');
      expect(platform.storageGet('k')).toBeNull();
    });

    it('is a no-op for missing key', () => {
      expect(() => platform.storageRemove('nope')).not.toThrow();
    });
  });

  describe('getSystemInfo', () => {
    it('returns width, height, pixelRatio', () => {
      const info = platform.getSystemInfo();
      expect(info).toEqual({ width: 800, height: 600, pixelRatio: 2 });
    });
  });
});
