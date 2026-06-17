# Product Requirements Document (PRD)

**Project Name:** Constellation Gallery
**Lead Developer & Architect:** Suyash Sharma
**Framework:** Next.js (App Router) + React Three Fiber
**Date:** June 17, 2026
**Version:** 4.0 (Dual-Canvas + Resilient Data Architecture)

---

## 1. Executive Summary

**Vision:** To create a highly immersive, interactive web experience that visualizes the history of art using live data. The application transitions users from a macro, cosmic view of art history (where periods are constellations and artists are stars) down to a micro, first-person 3D gallery experience exploring specific artworks.

**Objective:** Build a portfolio-defining experiential website that seamlessly blends 3D web rendering, procedural generation, and dynamic open-source museum data (Wikidata/Wikimedia) within a single-page architecture.

---

## 2. Target Audience

- **Art Enthusiasts & Students:** Looking for an engaging, non-traditional way to explore art history.
- **Creative Developers & Designers:** As a showcase of advanced WebGL optimization, procedural data visualization, and API chaining.
- **Educators:** Seeking interactive visual aids for history and art curriculums.

---

## 3. Core Features & User Flow

### 3.1 The Cosmic Timeline (Macro View)

- **Visual Interface:** A zoomable, pannable 3D space environment rendered in a dedicated R3F `<Canvas>`.
- **Constellations (Art Periods):** Major art periods (e.g., Renaissance, Baroque) are mapped as distinct clusters in 3D space.
- **Stars (Artists):** Individual artists act as nodes (stars) generated procedurally within their respective period's constellation. Lines connect artists within the same period.
- **Interaction:**
  - *Scroll/Drag:* Pan and zoom through the 3D space via OrbitControls.
  - *Hover:* Reveals a lightweight tooltip with the artist's name and a thumbnail preview.
  - *Click:* Smoothly interpolates the camera to center on the star and triggers the 2D UI Overlay.

### 3.2 The Artist Profile (2D UI Overlay)

- **Visual Interface:** An elegant, typography-driven 2D panel built with Framer Motion that slides over the 3D canvas.
- **Content:** Dynamically populated with the artist's high-res portrait, biography, and birth/death years fetched from Wikipedia.
- **Texture Prefetching:** Immediately upon opening the artist overlay, gallery textures are prefetched in the background. The "Explore Gallery" button remains disabled with a loading indicator until all textures are cached, preventing blank walls during the transition.
- **Action:** A prominent "Explore Gallery" button. Clicking this triggers a visual zoom animation flying *into* the star, fading to the 3D gallery.

### 3.3 The Immersive Gallery (Micro View)

- **Environment Design:** A pre-modeled 3D room (e.g., a medieval castle hall with stone arches). The gallery model is parameterized per art period — e.g., a Gothic cathedral for Renaissance, a Baroque palace for Baroque — loaded from period-specific `.glb` files.
- **Procedural Curation:** Paintings fetched from Wikimedia are procedurally assigned to predefined wall coordinates (`PlaneGeometry`) within the gallery. The gallery layout algorithm maps `Artwork` objects to empty wall slots, dynamically scaling the `PlaneGeometry` based on the fetched aspect ratio.
- **Lighting:** Dramatic, museum-style spotlighting focused dynamically on the loaded canvases. Low ambient light.
- **Navigation:** First-person controls using WASD/Arrow keys and mouse-look, constrained by Rapier physics to prevent wall-clipping.
- **Art Interaction:** Walking within a proximity radius of a painting triggers a UI overlay detailing the artwork's title, year, medium, and description.

### 3.4 Transition System

- **Dual-Canvas Architecture:** The cosmos view and the gallery view each use their own isolated R3F `<Canvas>` component. Each Canvas owns its own controls, physics world, and Three.js renderer, preventing configuration conflicts during transitions.
- **Transition Animation:** State changes between cosmos and gallery are masked by a Framer Motion overlay (fade-to-black, zoom blur) that covers the Canvas swap. The overlay duration is fixed at ~800ms, matching the texture preload completion.

---

## 4. UI/UX & Art Direction

### Typography

| Role | Font | Style |
|---|---|---|
| Names / Titles | `Cinzel` or `Playfair Display` | Elegant, classical serif |
| Descriptions | `Inter` or `Geist` | Legible, modern sans-serif |

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Void Black | `#050505` | Canvas background, deepest shadows |
| Deep Space Blue | `#0B0C10` | Ambient space backdrop |
| Star White | `#F5F5F5` | Stars, active text |
| Gold Accent | `#D4AF37` | Constellation lines, hover states |
| Glass Panel | `rgba(10, 10, 20, 0.75)` | UI overlay backgrounds with `backdrop-filter: blur(16px)` |

### Audio Design

- **Cosmos:** Low-frequency, ethereal ambient space drone.
- **Gallery:** Faint torch crackle, subtle room reverb, and soft footstep sound effects tied to WASD movement.
- **Audio Manager:** A singleton `AudioManager` class handles `AudioContext.resume()` on first user gesture, crossfades between cosmos and gallery tracks, and manages spatial audio for footsteps.

### URL State & Deep Linking

- `viewState`, `activePeriod`, and `activeArtist` are synced to the URL via `nuqs` (Next.js search params).
- This enables deep linking (e.g., `?period=renaissance&artist=leonardo`), browser back/forward navigation, and social sharing.

---

## 5. Technical Architecture

### 5.1 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server-side API fetching, routing, caching, image optimization |
| **3D Engine** | Three.js, React Three Fiber (R3F) | Dual-Canvas 3D rendering pipeline |
| **3D Utilities** | `@react-three/drei` | Camera controls, HTML overlays, GLTF loading, `useTexture.preload()` |
| **Physics** | `@react-three/rapier` | Rigid body physics for gallery boundaries (gallery canvas only) |
| **Styling & Motion** | Tailwind CSS, Framer Motion | 2D UI overlays, smooth panel transitions, transition masking |
| **State Management** | Zustand | Global state tracking (view states, active data, texture cache) |
| **URL State** | `nuqs` | Search-param-synced state for deep linking |
| **Image Optimization** | `sharp` (API route) | Server-side resize, WebP conversion, thumbnail generation |

### 5.2 Dual-Canvas Architecture

```
┌────────────────────────────────────────────┐
│                  Next.js Layout             │
│  ┌──────────────────┐ ┌──────────────────┐ │
│  │  Cosmos Canvas    │ │  Gallery Canvas   │ │
│  │  (OrbitControls)  │ │  (FPS + Rapier)   │ │
│  │  visible when:    │ │  visible when:    │ │
│  │  COSMOS           │ │  GALLERY          │ │
│  │  ARTIST_OVERLAY   │ │                    │ │
│  └──────────────────┘ └──────────────────┘ │
│  ┌──────────────────────────────────────┐  │
│  │  Framer Motion Transition Overlay     │  │
│  │  (masks canvas swap during state      │  │
│  │   transitions with fade/zoom effect)  │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │  2D UI Overlays (Framer Motion)       │  │
│  │  - Artist Profile Panel               │  │
│  │  - Artwork Detail Overlay             │  │
│  │  - Loading / Error States             │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## 6. Dynamic Data Pipeline (Wikidata & Wikimedia)

### 6.1 Two-Step Fetching Architecture

1. **SPARQL Query (Wikidata):** Next.js Server Components query `query.wikidata.org` for a specific art movement (e.g., Q1944 for Baroque) to retrieve all notable artists, their biographical data, and the raw filenames of their notable paintings.
2. **Wikimedia Commons API:** Next.js passes the raw filenames to `commons.wikimedia.org/w/api.php` to resolve direct `.jpg`/`.webp` image URLs, extract precise pixel dimensions, and fetch descriptions.

### 6.2 Resilient Data Layer

- **Repository Pattern:** All data fetching is wrapped in a repository layer with `try/catch` boundaries. Functions return a `DataResult<T>` discriminated union:

```typescript
type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

- **Fallback Datasets:** Each art period has a curated static JSON fallback dataset (~10–15 artists with pre-selected artworks). If the SPARQL query fails, times out, or returns empty results, the fallback is served transparently.
- **Stale-While-Revalidate:** On subsequent visits, the server serves cached data immediately while revalidating in the background.
- **Caching:** Next.js `fetch` uses `next: { revalidate: 86400 }` (24-hour cache) since historical art data rarely changes, preventing rate-limiting from Wikipedia.

### 6.3 Data Transformation Schema

```typescript
interface Artwork {
  id: string;
  title: string;
  year: string;
  imageHighResUrl: string;
  imageThumbnailUrl: string;     // Pre-generated thumbnail for tooltips
  dimensions: { width: number; height: number };
  aspectRatio: number;            // Computed: width / height
  description: string;
}

interface ArtistNode {
  id: string;
  name: string;
  birthYear: string;
  deathYear: string;
  portraitUrl: string | null;
  portraitThumbnailUrl: string | null;
  artworks: Artwork[];
  localPosition: { x: number; y: number; z: number };
}

interface PeriodConstellation {
  id: string;
  name: string;
  description: string;
  wikidataId: string;             // e.g., "Q1944" for Baroque
  artists: ArtistNode[];
  cosmosPosition: { x: number; y: number; z: number };
  galleryModelPath: string;       // Period-specific .glb model
}
```

### 6.4 Procedural Generation

- **Cosmic Layout:** A spherical Fibonacci distribution algorithm procedurally generates `localPosition` coordinates for artist stars around their constellation center. Constellation centers are themselves distributed on a larger spiral to create a navigable depth field.
- **Gallery Layout:** An algorithm maps the array of fetched `Artwork` objects to predefined empty wall slots in the period-specific `.glb` room model, dynamically scaling the Three.js `PlaneGeometry` based on the fetched aspect ratio.

---

## 7. Asset Pipeline

### 7.1 GLTF/GLB Models

- Gallery room models are compressed using `gltf-transform` (meshes deduplicated, textures resized, Draco mesh compression applied).
- Period-specific models are stored in `/public/models/{period-slug}.glb`.
- Models are loaded lazily via `useGLTF.preload()` only when the corresponding period is selected.

### 7.2 Image Optimization

- All Wikimedia image URLs are proxied through a Next.js API route (`/api/image`) that uses `sharp` to:
  - Resize images to a max dimension of 2048px (gallery view) and 256px (thumbnails).
  - Convert to WebP format with quality 85.
  - Strip EXIF metadata.
- This prevents loading multi-megapixel originals into WebGL textures and avoids CORS issues.

### 7.3 Texture Management

- **TexturePool:** A custom `TexturePool` class with LRU eviction and a configurable `maxVRAM` budget (default: 512MB).
- **Lifecycle:** Gallery textures are loaded only when `viewState === 'GALLERY'`. On exiting the gallery, `dispose()` is called on geometries and materials, and the `TexturePool` evicts unused textures.
- **Prefetching:** When the artist overlay opens, `useTexture.preload()` is called for all artwork textures in the background. The "Explore Gallery" button remains disabled until prefetch completes.

---

## 8. State Management (Zustand)

### 8.1 Core State

```typescript
type ViewState = 'LOADING' | 'COSMOS' | 'ARTIST_OVERLAY' | 'TRANSITIONING' | 'GALLERY';

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

  // Texture cache
  textureCache: Map<string, THREE.Texture>;
  addTexture: (key: string, texture: THREE.Texture) => void;
  removeTexture: (key: string) => void;
  clearTextures: () => void;

  // Prefetch status
  prefetchProgress: number; // 0–100
  isPrefetchComplete: boolean;
  setPrefetchProgress: (progress: number) => void;
}
```

### 8.2 State Transitions

```
LOADING ──► COSMOS
               │
               ├──► ARTIST_OVERLAY (prefetch starts)
               │        │
               │        ├──► COSMOS (close overlay)
               │        │
               │        └──► TRANSITIONING (prefetch complete, zoom animation)
               │                 │
               │                 └──► GALLERY
               │                        │
               │                        └──► TRANSITIONING (exit gallery)
               │                                 │
               │                                 └──► COSMOS
```

---

## 9. Physics World Abstraction

- A `PhysicsWorld` class initializes the Rapier world when the gallery canvas mounts and destroys it cleanly on unmount.
- Gallery boundaries are defined by collider planes matching the `.glb` room walls.
- FPS character controller uses a Rapier kinematic capsule with WASD movement and mouse-look rotation.
- The physics world is scoped exclusively to the gallery canvas — the cosmos canvas has no physics overhead.

---

## 10. Error Handling Strategy

| Failure Mode | User Experience |
|---|---|
| **WebGL Context Loss** | Detect via `canvas.addEventListener('webglcontextlost')`. Show a "WebGL context lost — refreshing" overlay. Auto-reload the page after 3 seconds. |
| **SPARQL Query Timeout / Failure** | Fall back to the curated static JSON dataset for the selected period. Show a subtle "Showing cached data" toast. |
| **Wikimedia Image 404** | Replace with a procedurally generated placeholder (solid color + artist initials). Log the missing filename for later curation. |
| **GLB Model Load Failure** | Fall back to a default white-box gallery (procedurally generated box room with textured walls). |
| **AudioContext Blocked** | `AudioManager` queues `resume()` on the first `click`/`keydown` event. Audio silently fails without blocking the experience. |
| **Browser Unsupported** | Detect `WebGLRenderingContext` availability. Show a static HTML fallback page with a curated slideshow. |

---

## 11. Performance Budget

| Metric | Target |
|---|---|
| **FPS (Cosmos View)** | 60fps on mid-range GPU (integrated graphics) |
| **FPS (Gallery View)** | 60fps on mid-range GPU, 30fps minimum |
| **Initial Bundle Size** | < 5MB (gzipped, including one GLB model) |
| **VRAM Usage** | < 200MB at peak (gallery loaded) |
| **First Contentful Paint** | < 2s on 4G |
| **Time to Interactive (Cosmos)** | < 3s on 4G |
| **Gallery Transition** | < 2s from button click to first-person view (masked by animation) |

---

## 12. Mobile Support

- **Device Detection:** The application detects touch devices via `'ontouchstart' in window` and `matchMedia('(pointer: coarse)')`.
- **Cosmos View:** Falls back to touch-drag panning and pinch-to-zoom.
- **Gallery View:** Implements a virtual on-screen joystick (left thumb) and touch-drag look (right thumb). Alternatively displays a 2D slideshow of the artist's artworks instead of the full 3D gallery.
- **UI Overlays:** All 2D panels are responsive and touch-friendly with adequate tap targets (min 44px).

---

## 13. Accessibility

- **2D UI Overlays:** All interactive elements have `aria-label` attributes. Panels support keyboard navigation (Tab, Enter, Escape).
- **Reduced Motion:** Respects `prefers-reduced-motion` media query — disables camera animations, replaces zoom transitions with instant cuts, and reduces parallax effects.
- **Color Contrast:** Glassmorphism panels maintain WCAG AA contrast ratios against the dark background.
- **Text Alternatives:** Artwork descriptions are rendered as accessible HTML text (not Canvas-rendered), readable by screen readers.

---

## 14. Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| **Data Fetching** | Vitest | Unit tests for SPARQL → `PeriodConstellation` transformation, error handling, fallback resolution |
| **2D UI Components** | Storybook + Vitest | Visual regression and interaction tests for artist overlay, artwork detail, loading states |
| **3D Rendering** | Manual QA | WebGL behavior is verified manually across Chrome, Firefox, Safari, and Edge on desktop + mobile |
| **Performance** | Lighthouse + Chrome DevTools | Bundle size, FCP, TTI, and VRAM profiling |
| **E2E** | Playwright | Smoke test: load page → select period → select artist → enter gallery → exit gallery |

---

## 15. Constraints & Edge Cases

- **CORS Policies:** All remote images are proxied through the `/api/image` route, eliminating WebGL cross-origin texture tainting issues entirely.
- **VRAM Management (Memory Leaks):** Textures are loaded only when `viewState === 'GALLERY'`. The `TexturePool` enforces a 512MB VRAM cap with LRU eviction. On gallery exit, all gallery-specific textures and materials are disposed via Three.js `dispose()`.
- **Browser Compatibility:** Target the last 2 versions of Chrome, Firefox, Safari, and Edge. WebGL 1.0 minimum (WebGL 2.0 preferred for KTX2 textures).
- **Network Resilience:** All data fetching has retry logic (3 attempts with exponential backoff). Fallback static datasets ensure the experience never breaks due to upstream API issues.