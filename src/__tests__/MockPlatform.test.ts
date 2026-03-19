import { describe, it, expect, beforeEach } from 'vitest';
import { MockPlatform } from '../core/mocks/MockPlatform.ts';

describe('MockPlatform', () => {
  let platform: MockPlatform;

  beforeEach(() => {
    platform = new MockPlatform();
  });

  it('has name "mock"', () => {
    expect(platform.name).toBe('mock');
  });

  it('returns null for missing key', () => {
    expect(platform.storageGet('nope')).toBeNull();
  });

  it('round-trips string values', () => {
    platform.storageSet('key', 'value');
    expect(platform.storageGet('key')).toBe('value');
  });

  it('removes keys', () => {
    platform.storageSet('key', 'value');
    platform.storageRemove('key');
    expect(platform.storageGet('key')).toBeNull();
  });

  it('clear() wipes all data', () => {
    platform.storageSet('a', '1');
    platform.storageSet('b', '2');
    platform.clear();
    expect(platform.size).toBe(0);
    expect(platform.storageGet('a')).toBeNull();
  });

  it('size tracks stored keys', () => {
    expect(platform.size).toBe(0);
    platform.storageSet('a', '1');
    expect(platform.size).toBe(1);
    platform.storageSet('b', '2');
    expect(platform.size).toBe(2);
    platform.storageRemove('a');
    expect(platform.size).toBe(1);
  });

  it('getSystemInfo returns default dimensions', () => {
    expect(platform.getSystemInfo()).toEqual({ width: 1136, height: 640, pixelRatio: 1 });
  });
});
