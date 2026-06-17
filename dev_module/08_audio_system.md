# Module 08 — Audio System

**Priority:** P1 | **Est. Days:** 2 | **Depends On:** 02, 06

## Objective

Build a singleton `AudioManager` that handles `AudioContext` lifecycle, plays ambient tracks for cosmos and gallery views, crossfades between them, and provides spatial footstep sounds in the gallery.

## Tasks

### 08.1 AudioManager Singleton

**File:** `src/lib/audio/AudioManager.ts`

```typescript
export class AudioManager {
  private static instance: AudioManager;
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private cosmosGain: GainNode | null = null;
  private galleryGain: GainNode | null = null;
  private cosmosSource: AudioBufferSourceNode | null = null;
  private gallerySource: AudioBufferSourceNode | null = null;
  private footstepsBuffer: AudioBuffer | null = null;
  private isInitialized: boolean = false;

  static getInstance(): AudioManager;
  async init(): Promise<void>;                    // Create AudioContext on first user gesture
  async loadCosmosTrack(url: string): Promise<void>;
  async loadGalleryTrack(url: string): Promise<void>;
  async loadFootsteps(url: string): Promise<void>;
  crossfadeToGallery(duration: number): void;     // 1.5s crossfade
  crossfadeToCosmos(duration: number): void;      // 1.5s crossfade
  playFootstep(): void;                           // Play a single footstep with random pitch variation
  setMasterVolume(volume: number): void;          // 0–1
  dispose(): void;
}
```

### 08.2 AudioContext Initialization

- Browsers block `AudioContext` creation until a user gesture.
- `AudioManager.init()` is called on the first `click` or `keydown` event.
- Creates `AudioContext` with `sampleRate: 44100`.
- Creates the gain node chain: `masterGain → cosmosGain/galleryGain → destination`.
- Sets `masterGain.gain.value = 0.5` (default).

### 08.3 Ambient Track Loading

- **Cosmos Track:** Low-frequency ethereal drone (~30–60s loop, OGG/Vorbis format).
  - Stored in `/public/audio/cosmos_ambient.ogg`.
  - Loaded via `fetch` → `context.decodeAudioData()`.
- **Gallery Track:** Subtle room tone with faint torch crackle (~30–60s loop, OGG/Vorbis).
  - Stored in `/public/audio/gallery_ambient.ogg`.
  - Loaded via `fetch` → `context.decodeAudioData()`.
- Both tracks are loaded on first initialization and kept in memory.
- Tracks are set to `loop = true`.

### 08.4 Crossfade Logic

- `crossfadeToGallery(duration)`:
  - Ramp `cosmosGain.gain` from current value to 0 over `duration` seconds.
  - Simultaneously ramp `galleryGain.gain` from 0 to current master level over `duration` seconds.
  - If the gallery source isn't playing, start it.
- `crossfadeToCosmos(duration)`: reverse of the above.
- After crossfade completes, stop the faded-out source to save CPU.

### 08.5 Footstep Sounds

- Single footstep sound file (`/public/audio/footstep.ogg`).
- `playFootstep()`:
  - Creates a short `AudioBufferSourceNode`.
  - Randomizes `playbackRate` between 0.9 and 1.1 for natural variation.
  - Connects through a separate gain node at 0.3 volume.
  - Plays once and auto-disconnects.
- Triggered by the `FPSController` on each detected step (alternating left/right timing based on movement speed).

### 08.6 Integration with Zustand

- `AudioManager` is called from the `TransitionOverlay` component during state transitions:
  - `ARTIST_OVERLAY → TRANSITIONING`: `crossfadeToGallery(1.5)`
  - `TRANSITIONING → COSMOS`: `crossfadeToCosmos(1.5)`
- Initial cosmos ambient starts when `viewState` becomes `'COSMOS'` for the first time.

### 08.7 Mute Toggle

- A small speaker icon in the bottom-right corner of the UI.
- Toggles `masterGain.gain` between 0 and the saved volume.
- State persists in `localStorage`.

## Deliverables

- [ ] AudioManager singleton with lazy AudioContext initialization
- [ ] Cosmos ambient drone loads and loops
- [ ] Gallery ambient room tone loads and loops
- [ ] Smooth crossfade (1.5s) between cosmos and gallery tracks
- [ ] Footstep sounds triggered by player movement
- [ ] Mute toggle works and persists
- [ ] Audio gracefully fails if browser blocks or files are missing

## Validation

- Enter page, click to start — cosmos ambient plays
- Enter gallery — crossfade to gallery ambient, footsteps play on movement
- Exit gallery — crossfade back to cosmos ambient
- Mute/unmute works
- No audio glitches or pops during transitions