# Module 06 — Transition System & Dual Canvas

**Priority:** P0 | **Est. Days:** 2 | **Depends On:** 03, 04, 05

## Objective

Orchestrate the dual-Canvas architecture and build smooth visual transitions between the cosmos and gallery views using a Framer Motion overlay that masks the canvas swap.

## Tasks

### 06.1 Root Layout Orchestration

**File:** `src/app/layout.tsx`

- Renders both `<CosmosCanvas>` and `<GalleryCanvas>` as siblings in the DOM.
- Each canvas is wrapped in a container div with `position: fixed; inset: 0`.
- Visibility is controlled by `viewState`:
  - Cosmos canvas: visible when `viewState ∈ { 'COSMOS', 'ARTIST_OVERLAY', 'TRANSITIONING' }` (cosmos→gallery direction only)
  - Gallery canvas: visible when `viewState ∈ { 'GALLERY', 'TRANSITIONING' }` (gallery→cosmos direction only)
- During `TRANSITIONING`, one canvas is fading out while the other fades in behind the overlay.

### 06.2 TransitionOverlay Component

**File:** `src/components/ui/TransitionOverlay.tsx`

- A full-screen Framer Motion `<motion.div>` with `position: fixed; inset: 0; z-index: 100`.
- **States:**
  - `hidden`: `opacity: 0, pointerEvents: 'none'`
  - `entering`: `opacity: 1` (fade in over 400ms)
  - `exiting`: `opacity: 0` (fade out over 400ms)
- **Transition Sequence (Cosmos → Gallery):**
  1. User clicks "Explore Gallery" → `viewState = 'TRANSITIONING'`
  2. Overlay fades in (400ms, black)
  3. Cosmos canvas unmounts, Gallery canvas mounts (behind overlay)
  4. Gallery reports ready (all assets loaded) via callback
  5. Overlay fades out (400ms)
  6. `viewState = 'GALLERY'`
- **Transition Sequence (Gallery → Cosmos):**
  1. User presses Escape → `viewState = 'TRANSITIONING'`
  2. Overlay fades in (400ms, black)
  3. Gallery canvas disposes textures and unmounts
  4. Cosmos canvas mounts (behind overlay)
  5. Overlay fades out (400ms)
  6. `viewState = 'COSMOS'`

### 06.3 Gallery Readiness Callback

- `GalleryScene` accepts an `onReady` prop.
- When all GLB models, textures, and physics are initialized, `onReady()` is called.
- The `TransitionOverlay` listens for this callback to trigger the fade-out.

### 06.4 Canvas Lifecycle Management

- **CosmosCanvas mount:** When `viewState` is `'COSMOS'` or `'ARTIST_OVERLAY'`.
- **CosmosCanvas unmount:** When `viewState` is `'TRANSITIONING'` (cosmos→gallery) or `'GALLERY'`.
- **GalleryCanvas mount:** When `viewState` is `'TRANSITIONING'` (cosmos→gallery) or `'GALLERY'`.
- **GalleryCanvas unmount:** When `viewState` is `'TRANSITIONING'` (gallery→cosmos) or `'COSMOS'`.
- On unmount, call `dispose()` on all Three.js geometries, materials, and textures (see Module 07).

### 06.5 Loading Screen (Initial Load)

**File:** `src/components/ui/LoadingScreen.tsx`

- Shown when `viewState === 'LOADING'`.
- Simple centered logo/name with a subtle loading animation (pulsing star).
- Fades out when data is loaded and `viewState` transitions to `'COSMOS'`.

## Deliverables

- [ ] Both canvases coexist in the DOM without conflicts
- [ ] TransitionOverlay masks canvas swaps with smooth fade
- [ ] Gallery readiness callback ensures no blank frames
- [ ] Cosmos → Gallery transition: overlay fades in, canvas swaps, overlay fades out
- [ ] Gallery → Cosmos transition: same flow in reverse
- [ ] Loading screen shown during initial data fetch
- [ ] No visual jank, flicker, or layout shift during transitions
- [ ] No WebGL context conflicts between canvases

## Validation

- Enter gallery from artist overlay — verify smooth transition
- Exit gallery back to cosmos — verify smooth transition
- Check Chrome DevTools for WebGL context errors (should be zero)
- Verify only one canvas is rendering at a time (GPU usage check)
- Test rapid transitions (enter/exit gallery multiple times) — no memory leaks or crashes