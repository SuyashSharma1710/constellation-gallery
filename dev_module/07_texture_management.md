# Module 07 — Texture Management

**Priority:** P1 | **Est. Days:** 2 | **Depends On:** 01, 05

## Objective

Implement a `TexturePool` class with LRU eviction, VRAM budget enforcement, and proper lifecycle management to prevent GPU memory leaks across gallery sessions.

## Tasks

### 07.1 TexturePool Class

**File:** `src/lib/textures/TexturePool.ts`

```typescript
interface TextureEntry {
  texture: THREE.Texture;
  size: number;          // Estimated bytes: width * height * 4 (RGBA)
  lastAccessed: number;  // Timestamp for LRU
  key: string;           // URL or unique identifier
}

export class TexturePool {
  private cache: Map<string, TextureEntry> = new Map();
  private maxVRAM: number;      // Default: 512 * 1024 * 1024 (512MB)
  private currentVRAM: number = 0;

  constructor(maxVRAM?: number) {
    this.maxVRAM = maxVRAM ?? 512 * 1024 * 1024;
  }

  get(key: string): THREE.Texture | null;
  set(key: string, texture: THREE.Texture, width: number, height: number): void;
  evict(key: string): void;
  evictLRU(): void;           // Evict least recently used until under budget
  clear(): void;              // Dispose all textures and clear cache
  getStats(): { count: number; vramUsed: number; vramMax: number };
}
```

- `set()`: Stores texture, computes size, adds to VRAM budget. If over budget, calls `evictLRU()`.
- `evictLRU()`: Sorts entries by `lastAccessed`, disposes and removes until under 80% of max VRAM.
- `clear()`: Calls `texture.dispose()` on every entry, clears the map, resets VRAM counter.
- `dispose()` on a texture also calls `renderer.dispose()` if the texture was uploaded.

### 07.2 Integration with Gallery Loading

- When `GalleryScene` mounts, artwork textures are loaded through the `TexturePool`:
  ```typescript
  const pool = TexturePool.getInstance(); // Singleton
  const texture = pool.get(url);
  if (!texture) {
    const tex = useTexture(url);
    pool.set(url, tex, dimensions.width, dimensions.height);
    return tex;
  }
  return texture;
  ```
- The pool is shared across gallery sessions (same artist, different artists).

### 07.3 Integration with Gallery Unmount

- When `GalleryCanvas` unmounts (transitioning back to cosmos):
  - All gallery-specific textures are evicted from the pool.
  - `pool.clear()` is called if the pool is above 200MB (keep some cache for quick re-entry).
  - All Three.js materials and geometries are disposed.

### 07.4 Thumbnail Cache

- Artist portrait thumbnails and artwork tooltip thumbnails (256px) are stored in a separate, smaller pool.
- This pool is never cleared — thumbnails persist across the entire session.
- Max budget: 50MB.

### 07.5 VRAM Monitoring (Dev Only)

- In development mode, expose `window.__TEXTURE_POOL__` for debugging.
- Log pool stats on each major operation (gated behind `process.env.NODE_ENV === 'development'`).
- Warn if VRAM usage exceeds 80% of budget.

## Deliverables

- [ ] TexturePool singleton with LRU eviction
- [ ] VRAM budget enforced (512MB default)
- [ ] Textures loaded through pool in gallery
- [ ] Pool cleared on gallery exit
- [ ] Thumbnail cache persists across sessions
- [ ] No texture memory leaks (verified via Chrome DevTools memory profiler)
- [ ] Dev-mode VRAM monitoring available

## Validation

- Enter gallery, check Chrome DevTools GPU memory
- Exit gallery, verify GPU memory drops significantly
- Enter/exit gallery 5 times — verify memory stabilizes (no unbounded growth)
- Check `window.__TEXTURE_POOL__.getStats()` in dev console