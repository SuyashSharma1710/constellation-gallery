# Module 04 — Artist Profile (2D Overlay)

**Priority:** P0 | **Est. Days:** 2 | **Depends On:** 01, 02, 03

## Objective

Build the 2D artist profile panel that slides over the cosmos canvas. Includes portrait, biography, birth/death info, and the texture prefetch + "Explore Gallery" flow.

## Tasks

### 04.1 ArtistOverlay Component

**File:** `src/components/ui/ArtistOverlay.tsx`

- Rendered as a Framer Motion `<motion.div>` with:
  - `initial={{ x: '100%' }}`, `animate={{ x: 0 }}`, `exit={{ x: '100%' }}`
  - `transition={{ type: 'spring', damping: 30, stiffness: 300 }}`
- Positioned as a right-side panel (width: 420px, full height).
- Uses `GlassPanel` wrapper for the glassmorphism effect.
- Content sections:
  - Artist portrait (circular, 180px, with border glow)
  - Name (Cinzel, large)
  - Birth–Death years (Inter, muted)
  - Biography (truncated to 3 paragraphs with "Read more" expand)
  - "Explore Gallery" button (prominent, gold accent)
  - Close button (top-right, X icon)

### 04.2 GlassPanel Shared Component

**File:** `src/components/shared/GlassPanel.tsx`

- Reusable panel with:
  - `background: rgba(10, 10, 20, 0.75)`
  - `backdrop-filter: blur(16px)`
  - `border: 1px solid rgba(255, 255, 255, 0.08)`
  - `border-radius: 16px`
- Accepts `className` for extension.

### 04.3 Texture Prefetching Hook

**File:** `src/hooks/usePrefetchTextures.ts`

- Accepts `artworks: Artwork[]`.
- On mount, starts prefetching textures via `useTexture.preload(artworks.map(a => a.imageHighResUrl))`.
- Tracks progress as `loadedCount / totalCount`.
- Returns `{ progress: number, isComplete: boolean }`.
- Uses `Suspense` internally — textures are loaded via R3F's `useTexture` in a hidden `<Canvas>` or via the `TexturePool`.

### 04.4 PrefetchProgress UI

- Inside `ArtistOverlay`, below the "Explore Gallery" button:
  - If `!isComplete`: show a progress bar (animated, gold fill) and "Loading gallery..." text.
  - Button is `disabled` and shows a spinner.
  - If `isComplete`: button is enabled, shows "Explore Gallery →".
- On click: calls `enterGallery()` from Zustand store.

### 04.5 Biography Fetching

- Biography text is fetched from Wikipedia API:
  - `https://en.wikipedia.org/api/rest_v1/page/summary/{artistName}`
  - Extract `extract` field (first 3 paragraphs).
- Cached with `next: { revalidate: 86400 }`.
- If fetch fails, show "Biography unavailable" with a fallback description from Wikidata.

### 04.6 Escape Key Handling

- Pressing `Escape` when the overlay is open calls `closeArtistOverlay()`.
- Uses `useEffect` with `keydown` listener, cleaned up on unmount.

## Deliverables

- [ ] ArtistOverlay slides in from the right with spring animation
- [ ] Portrait, name, dates, and biography display correctly
- [ ] Glassmorphism panel looks polished (blur, border, shadow)
- [ ] Texture prefetching starts on overlay open
- [ ] Progress bar shows prefetch status
- [ ] "Explore Gallery" button is disabled until prefetch complete
- [ ] Clicking button triggers transition to gallery
- [ ] Escape key closes overlay
- [ ] Close button returns to cosmos view

## Validation

- Open artist overlay — verify portrait and bio load
- Verify prefetch progress bar fills up
- Verify button enables only when complete
- Click Explore Gallery — verify viewState transitions to TRANSITIONING
- Press Escape — verify overlay closes and viewState returns to COSMOS