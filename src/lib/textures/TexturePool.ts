export class TexturePool {
  private cache = new Map<string, unknown>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: unknown) {
    this.cache.set(key, value);
  }
}