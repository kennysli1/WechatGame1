import type { IPlatform } from '../../platform/IPlatform.ts';

/**
 * In-memory IPlatform implementation for testing and P1 parallel development.
 * Uses a Map instead of localStorage so tests run without a browser environment.
 */
export class MockPlatform implements IPlatform {
  readonly name = 'mock';
  private store = new Map<string, string>();

  storageGet(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  storageSet(key: string, value: string): void {
    this.store.set(key, value);
  }

  storageRemove(key: string): void {
    this.store.delete(key);
  }

  getSystemInfo() {
    return { width: 1136, height: 640, pixelRatio: 1 };
  }

  /** Test helper: wipe all stored data. */
  clear(): void {
    this.store.clear();
  }

  /** Test helper: number of keys currently stored. */
  get size(): number {
    return this.store.size;
  }
}
