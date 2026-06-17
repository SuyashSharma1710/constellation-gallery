# Product Requirements Document (PRD)

**Project Name:** Constellation Gallery
**Lead Developer & Architect:** Suyash Sharma
**Framework:** Next.js (App Router) + React Three Fiber
**Date:** June 17, 2026
**Version:** 5.0 (Dual-Canvas + Neon Database + Resilient Data Architecture)

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
| **State Management** | Zustand | Global state tracking (view states, active data) |
| **URL State** | `nuqs` | Search-param-synced state for deep linking |
| **Database** | Neon (Serverless Postgres) | Primary data store for all period, artist, and artwork data |
| **ORM** | Drizzle ORM | Type-safe SQL schema, migrations, and query building |
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

## 6. Data Pipeline (Neon + Wikidata / Wikimedia)

### 6.1 Architecture Overview

The data pipeline has two distinct phases:

1. **Seed / Sync (offline):** A Node.js script (`scripts/sync-database.ts`) fetches data from Wikidata SPARQL and Wikimedia Commons APIs, transforms it into the typed schema, and upserts it into a Neon (serverless Postgres) database. This script runs:
   - Manually during development and initial seeding.
   - On a schedule via Vercel Cron Jobs (weekly) to refresh stale data.

2. **Read (runtime):** At request time, Next.js Server Components query Neon directly via Drizzle ORM. No external API calls happen during page loads — data is served from the database with sub-10ms query latency.

```
┌─────────────────────────────────────────────────────────────┐
│                    SEED / SYNC PHASE                          │
│                                                               │
│  scripts/sync-database.ts                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │ Wikidata      │   │ Wikimedia    │   │ Transformer      │  │
│  │ SPARQL Query  │──▶│ Commons API  │──▶│ (types.ts shape) │  │
│  └──────────────┘   └──────────────┘   └────────┬─────────┘  │
│                                                   │            │
│                                          ┌────────▼─────────┐  │
│                                          │ Neon Postgres     │  │
│                                          │ (Drizzle ORM)     │  │
│                                          └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    RUNTIME READ PHASE                          │
│                                                               │
│  Next.js Server Component                                     │
│  ┌──────────────────┐                                         │
│  │ Drizzle Query    │──────▶ Neon Postgres ──────▶ Client     │
│  │ (getPeriods)     │          (sub-10ms)          Props      │
│  └──────────────────┘                                         │
│         │                                                      │
│         │ (if Neon unavailable)                                │
│         ▼                                                      │
│  ┌──────────────────┐                                         │
│  │ Fallback JSON     │                                         │
│  │ (static datasets) │                                         │
│  └──────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Database Schema (Drizzle ORM)

The schema mirrors the existing TypeScript types and is normalized across three tables:

```typescript
// src/lib/db/schema.ts
import { pgTable, text, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";

export const periods = pgTable("periods", {
  id: text("id").primaryKey(),                    // Wikidata ID, e.g. "Q4692"
  name: text("name").notNull(),
  description: text("description").notNull(),
  cosmosPositionX: real("cosmos_position_x").notNull().default(0),
  cosmosPositionY: real("cosmos_position_y").notNull().default(0),
  cosmosPositionZ: real("cosmos_position_z").notNull().default(0),
  galleryModelPath: text("gallery_model_path").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const artists = pgTable("artists", {
  id: text("id").primaryKey(),                    // Wikidata ID, e.g. "Q762"
  periodId: text("period_id").references(() => periods.id).notNull(),
  name: text("name").notNull(),
  birthYear: text("birth_year").notNull().default(""),
  deathYear: text("death_year").notNull().default(""),
  portraitUrl: text("portrait_url"),
  portraitThumbnailUrl: text("portrait_thumbnail_url"),
  localPositionX: real("local_position_x").notNull().default(0),
  localPositionY: real("local_position_y").notNull().default(0),
  localPositionZ: real("local_position_z").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const artworks = pgTable("artworks", {
  id: text("id").primaryKey(),                    // Wikidata ID
  artistId: text("artist_id").references(() => artists.id).notNull(),
  title: text("title").notNull(),
  year: text("year").notNull().default(""),
  imageHighResUrl: text("image_high_res_url").notNull(),
  imageThumbnailUrl: text("image_thumbnail_url").notNull(),
  dimensionsWidth: integer("dimensions_width").notNull().default(800),
  dimensionsHeight: integer("dimensions_height").notNull().default(600),
  aspectRatio: real("aspect_ratio").notNull().default(1),
  description: text("description").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 6.3 Database Tooling

- **Drizzle Kit:** Manages schema migrations and provides a visual database explorer (Drizzle Studio).
- **Configuration:** `drizzle.config.ts` points to the schema file and Neon connection string.
- **Commands:**
  ```bash
  npm run db:generate    # Generate migration files from schema changes
  npm run db:migrate     # Apply pending migrations to Neon
  npm run db:studio      # Launch Drizzle Studio for visual data browsing
  npm run sync-database  # Run the seed/sync script to populate Neon from Wikidata
  ```
- **Dependencies:** `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `dotenv`.

### 6.4 Seed / Sync Script

**File:** `scripts/sync-database.ts`

- **For each period** (Renaissance, Baroque, Impressionism, Romanticism, Surrealism, Modern Art):
  1. Query Wikidata SPARQL for artists and artworks (reuses existing `wikidata.ts` + `wikimedia.ts`).
  2. Transform raw data into `PeriodConstellation` shape via `transformer.ts`.
  3. Compute procedural positions (spherical Fibonacci for artist stars, constellation spiral layout).
  4. Upsert into Neon using Drizzle: `INSERT ... ON CONFLICT (id) DO UPDATE`.
- **Idempotent:** Safe to run multiple times. Uses `ON CONFLICT` upserts so existing records are updated, new ones inserted.
- **Vercel Cron Job:** Configured in `vercel.json` to run weekly:
  ```json
  {
    "crons": [{
      "path": "/api/cron/sync-database",
      "schedule": "0 0 * * 0"
    }]
  }
  ```
- **Environment Variables:** `DATABASE_URL` (Neon connection string, pooled for serverless).

### 6.5 Runtime Data Access (Repository)

**File:** `src/lib/data/repository.ts`

```typescript
import { db } from "@/lib/db";
import { periods, artists, artworks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getPeriods(): Promise<DataResult<PeriodConstellation[]>> {
  try {
    const rows = await db.query.periods.findMany({
      with: {
        artists: {
          with: { artworks: true },
        },
      },
    });
    // Map flat rows back to nested PeriodConstellation shape
    // ...
    return { ok: true, data: constellations };
  } catch {
    // Fall back to static JSON if Neon is unavailable
    return loadAllFallbacks();
  }
}
```

- **Fallback Chain:** Neon → static JSON fallback files → empty constellation (graceful degradation).
- **No `fetch` caching needed:** Data is in Postgres. Next.js `unstable_cache` or React `cache()` wraps the Drizzle query for per-request deduplication.

### 6.6 Two-Step Fetching (Seed Phase Only)

The original Wikidata → Wikimedia two-step pipeline is **preserved but moved to the seed script**:

1. **SPARQL Query (Wikidata):** `scripts/sync-database.ts` queries `query.wikidata.org` for each art movement to retrieve all notable artists, their biographical data, and the raw filenames of their notable paintings.
2. **Wikimedia Commons API:** The script passes the raw filenames to `commons.wikimedia.org/w/api.php` to resolve direct `.jpg`/`.webp` image URLs, extract precise pixel dimensions, and fetch descriptions.

The transformed result is stored in Neon. At runtime, the app reads from Neon — no external API calls.

### 6.7 Resilient Data Layer

- **Neon as Primary Source:** All runtime reads go through Neon. Connection pooling handles serverless scale.
- **Fallback Datasets:** Each art period has a curated static JSON fallback dataset (~10–15 artists with pre-selected artworks). If the Neon query fails (connection error, timeout), the fallback is served transparently.
- **Seed Failure Recovery:** If the sync script fails (Wikidata down, rate limited), Neon retains the last successfully synced data. The script logs errors and exits non-zero for monitoring.
- **Caching:** Drizzle query results are cached per-request via React `cache()`. No `next: { revalidate }` needed since data freshness is managed by the cron sync.

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

  // Data (fetched from Neon via server component, passed as props)
  periods: PeriodConstellation[];
  setPeriods: (periods: PeriodConstellation[]) => void;
  activePeriod: PeriodConstellation | null;
  setActivePeriod: (period: PeriodConstellation | null) => void;
  activeArtist: ArtistNode | null;
  setActiveArtist: (artist: ArtistNode | null) => void;

  // Prefetch status
  prefetchProgress: number; // 0–100
  isPrefetchComplete: boolean;
  setPrefetchProgress: (progress: number) => void;
}
```

Note: The texture cache is managed by a dedicated `TexturePool` class (`src/lib/textures/TexturePool.ts`) with LRU eviction and VRAM budgeting — not in Zustand. The Zustand store is scoped to view state, active data references, and prefetch progress.

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
| **Neon Database Unavailable** | Fall back to the curated static JSON dataset for all periods. Show a subtle "Showing cached data" toast. The sync script is unaffected — data persists from the last successful sync. |
| **SPARQL Query Timeout / Failure (Sync)** | The sync script logs the error, skips the failed period, and continues with remaining periods. Neon retains the last successfully synced data for the failed period. |
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
| **Database Query (getPeriods)** | < 50ms cold start, < 10ms warm (Neon serverless) |
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
| **Data Fetching** | Vitest | Unit tests for Drizzle queries, data transformation, error handling, fallback resolution |
| **Database Sync** | Vitest | Unit tests for the sync script: SPARQL → Drizzle upsert, idempotency, error recovery |
| **2D UI Components** | Storybook + Vitest | Visual regression and interaction tests for artist overlay, artwork detail, loading states |
| **3D Rendering** | Manual QA | WebGL behavior is verified manually across Chrome, Firefox, Safari, and Edge on desktop + mobile |
| **Performance** | Lighthouse + Chrome DevTools | Bundle size, FCP, TTI, and VRAM profiling |
| **E2E** | Playwright | Smoke test: load page → select period → select artist → enter gallery → exit gallery |

---

## 15. Constraints & Edge Cases

- **CORS Policies:** All remote images are proxied through the `/api/image` route, eliminating WebGL cross-origin texture tainting issues entirely.
- **VRAM Management (Memory Leaks):** Textures are loaded only when `viewState === 'GALLERY'`. The `TexturePool` enforces a 512MB VRAM cap with LRU eviction. On gallery exit, all gallery-specific textures and materials are disposed via Three.js `dispose()`.
- **Browser Compatibility:** Target the last 2 versions of Chrome, Firefox, Safari, and Edge. WebGL 1.0 minimum (WebGL 2.0 preferred for KTX2 textures).
- **Neon Connection Pooling:** Use Neon's pooled connection string (`DATABASE_URL_POOLED`) for serverless environments. The Drizzle client is instantiated once per request via React `cache()` to avoid connection exhaustion in serverless functions.
- **Data Freshness:** Art history data is synced weekly via Vercel Cron. The sync script is idempotent (upserts). Manual re-sync can be triggered via `npm run sync-database`.