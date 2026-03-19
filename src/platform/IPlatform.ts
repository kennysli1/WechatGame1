export interface IPlatform {
  name: string;

  storageGet(key: string): string | null;
  storageSet(key: string, value: string): void;
  storageRemove(key: string): void;

  getSystemInfo(): { width: number; height: number; pixelRatio: number };
}
