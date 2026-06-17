# Module 02 — State Management & URL Sync

**Priority:** P0 | **Est. Days:** 1.5 | **Depends On:** 00

## Objective

Implement the Zustand global store with the full view state machine and sync selected state to the URL via `nuqs` for deep linking and browser navigation.

## Tasks

### 02.1 Zustand Store

**File:** `src/lib/store/index.ts`

```typescript
import { create } from 'zustand';
import type { PeriodConstellation, ArtistNode, ViewState } from '@/lib/data/types';

interface AppState {
  // View
  viewState: ViewState;
  setViewState: (state: ViewState) => void;

  // Data
  periods: PeriodConstellation[];
  setPeriods: (periods: PeriodConstellation[]) => void;
  activePeriod: PeriodConstellation | null;
  setActivePeriod: (period: PeriodConstellation | null) => void;
  activeArtist: ArtistNode | null;
  setActiveArtist: (artist: ArtistNode | null) => void;

  // Actions
  selectArtist: (period: PeriodConstellation, artist: ArtistNode) => void;
  enterGallery: () => void;
  exitGallery: () => void;
  closeArtistOverlay: () => void;
  resetToCosmos: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  viewState: 'LOADING',
  setViewState: (viewState) => set({ viewState }),

  periods: [],
  setPeriods: (periods) => set({ periods }),

  activePeriod: null,
  setActivePeriod: (period) => set({ activePeriod: period }),

  activeArtist: null,
  setActiveArtist: (artist) => set({ activeArtist: artist }),

  selectArtist: (period, artist) => {
    set({
      activePeriod: period,
      activeArtist: artist,
      viewState: 'ARTIST_OVERLAY',
    });
  },

  enterGallery: () => {
    set({ viewState: 'TRANSITIONING' });
    // Transition completes when gallery canvas mounts and reports ready
    // (handled by TransitionOverlay component)
  },

  exitGallery: () => {
    set({ viewState: 'TRANSITIONING' });
  },

  closeArtistOverlay: () => {
    set({
      activeArtist: null,
      viewState: 'COSMOS',
    });
  },

  resetToCosmos: () => {
    set({
      activePeriod: null,
      activeArtist: null,
      viewState: 'COSMOS',
    });
  },
}));
```

### 02.2 View State Machine Rules

Enforce valid transitions (invalid transitions should be no-ops or log warnings in dev):

```
LOADING        → COSMOS
COSMOS         → ARTIST_OVERLAY
ARTIST_OVERLAY → COSMOS (close)
ARTIST_OVERLAY → TRANSITIONING (enter gallery)
TRANSITIONING  → GALLERY (transition complete)
GALLERY        → TRANSITIONING (exit gallery)
TRANSITIONING  → COSMOS (exit transition complete)
```

### 02.3 URL Sync with nuqs

**File:** `src/hooks/useUrlState.ts`

- Sync `viewState`, `activePeriodId`, and `activeArtistId` to URL search params.
- On mount, read from URL and restore state (deep link support).
- On state change, update URL via `nuqs` (shallow routing, no page reload).
- URL format: `/?period=renaissance&artist=leonardo-da-vinci`

```typescript
import { useQueryState } from 'nuqs';

export function useUrlState() {
  const [periodId, setPeriodId] = useQueryState('period');
  const [artistId, setArtistId] = useQueryState('artist');
  // Sync with Zustand store
}
```

### 02.4 Initialization Flow

**File:** `src/components/shared/AppInitializer.tsx`

- Client component that receives `PeriodConstellation[]` from the server component (fetched from Neon via Module 01).
- On mount: calls `setPeriods(data)`, reads URL params, restores state if deep link exists, otherwise sets `viewState: 'COSMOS'`.
- This is the bridge between server data (Neon-backed) and client Zustand store.

## Deliverables

- [ ] Zustand store with all state fields and actions
- [ ] View state transitions enforce valid state machine rules
- [ ] URL syncs with `nuqs` on state changes
- [ ] Deep links restore correct state on page load
- [ ] Browser back/forward navigates between views correctly
- [ ] `AppInitializer` bridges server data to client store

## Validation

```bash
# Manual: Open page, click artist, verify URL updates
# Manual: Navigate to /?period=baroque&artist=caravaggio, verify state restores
# Manual: Browser back button returns to cosmos view
```