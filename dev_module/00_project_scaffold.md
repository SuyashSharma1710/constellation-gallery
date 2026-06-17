# Module 00 — Project Scaffold & Toolchain

**Priority:** P0 | **Est. Days:** 1 | **Depends On:** — 

## Objective

Initialize the Next.js project with all required dependencies, folder structure, and toolchain configuration.

## Tasks

### 00.1 Initialize Next.js Project

- `npx create-next-app@latest constillation_gallery --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack`
- Verify dev server starts with `npm run dev`.

### 00.2 Install Dependencies

```bash
npm install three @react-three/fiber @react-three/drei @react-three/rapier
npm install zustand nuqs framer-motion
npm install sharp
npm install @neondatabase/serverless drizzle-orm dotenv
npm install -D @types/three drizzle-kit tsx
```

### 00.3 Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (Canvas host + UI overlays)
│   ├── page.tsx                 # Main page entry
│   ├── globals.css              # Tailwind + custom tokens
│   └── api/
│       ├── image/
│       │   └── route.ts         # Sharp image proxy (stub)
│       └── cron/
│           └── sync-database/
│               └── route.ts     # Vercel Cron endpoint for DB sync
├── components/
│   ├── canvas/
│   │   ├── CosmosCanvas.tsx     # Cosmos R3F Canvas wrapper
│   │   └── GalleryCanvas.tsx    # Gallery R3F Canvas wrapper
│   ├── cosmos/
│   │   ├── CosmosScene.tsx
│   │   ├── Constellation.tsx
│   │   ├── ArtistStar.tsx
│   │   └── Starfield.tsx
│   ├── gallery/
│   │   ├── GalleryScene.tsx
│   │   ├── GalleryRoom.tsx
│   │   ├── ArtworkFrame.tsx
│   │   ├── FPSController.tsx
│   │   └── GalleryLighting.tsx
│   ├── ui/
│   │   ├── ArtistOverlay.tsx
│   │   ├── ArtworkDetail.tsx
│   │   ├── TransitionOverlay.tsx
│   │   ├── LoadingScreen.tsx
│   │   └── ErrorFallback.tsx
│   └── shared/
│       ├── Tooltip.tsx
│       └── GlassPanel.tsx
├── lib/
│   ├── data/
│   │   ├── types.ts             # ArtistNode, Artwork, PeriodConstellation, DataResult
│   │   ├── repository.ts        # Repository: reads from Neon via Drizzle, falls back to JSON
│   │   ├── wikidata.ts          # SPARQL query builder + executor (used by seed script only)
│   │   ├── wikimedia.ts         # Wikimedia Commons API client (used by seed script only)
│   │   ├── transformer.ts       # Raw API → typed schema (used by seed script only)
│   │   └── fallbacks/           # Static JSON datasets per period (runtime fallback)
│   │       ├── renaissance.json
│   │       ├── baroque.json
│   │       └── ...
│   ├── db/
│   │   ├── schema.ts            # Drizzle ORM schema (periods, artists, artworks)
│   │   └── index.ts             # Drizzle client instance (Neon HTTP)
│   ├── store/
│   │   └── index.ts             # Zustand store
│   ├── textures/
│   │   └── TexturePool.ts       # LRU texture cache
│   ├── audio/
│   │   └── AudioManager.ts      # Audio context singleton
│   ├── physics/
│   │   └── PhysicsWorld.ts      # Rapier world abstraction
│   └── utils/
│       ├── math.ts              # Spherical Fibonacci, spiral layout
│       ├── device.ts            # Touch detection, WebGL check
│       └── constants.ts         # VRAM budgets, timing, dimensions
├── hooks/
│   ├── usePrefetchTextures.ts
│   ├── useDevice.ts
│   └── useAudioContext.ts
└── types/
    └── global.d.ts              # Three.js module augmentation

scripts/
└── sync-database.ts             # Seed script: Wikidata → Neon (runs via `npm run sync-database`)

drizzle/                         # Auto-generated migration files (Drizzle Kit)
drizzle.config.ts                # Drizzle Kit configuration
```

### 00.4 Configuration Files

- **`next.config.ts`:** Configure `images.remotePatterns` for Wikimedia domains, set `experimental.serverActions` if needed.
- **`tailwind.config.ts`:** Add CSS custom properties for the color palette (obsidian, deep space blue, star white, gold accent, glass panel).
- **`globals.css`:** Import `Cinzel` and `Inter` from Google Fonts via `next/font/google`. Define `@layer base` with CSS variables.
- **`drizzle.config.ts`:** Configure Drizzle Kit with schema path, output directory, and Neon connection string.
- **`.env.local`:** Set `DATABASE_URL` and `DATABASE_URL_POOLED` (Neon connection strings).
- **`.eslintrc.json`:** Extend `next/core-web-vitals` + `@typescript-eslint` rules.
- **`tsconfig.json`:** Set `strict: true`, enable path aliases.

### 00.5 Global Type Definitions

```typescript
// src/lib/data/types.ts
type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type ViewState = 'LOADING' | 'COSMOS' | 'ARTIST_OVERLAY' | 'TRANSITIONING' | 'GALLERY';

interface Artwork {
  id: string;
  title: string;
  year: string;
  imageHighResUrl: string;
  imageThumbnailUrl: string;
  dimensions: { width: number; height: number };
  aspectRatio: number;
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
  wikidataId: string;
  artists: ArtistNode[];
  cosmosPosition: { x: number; y: number; z: number };
  galleryModelPath: string;
}
```

## Deliverables

- [ ] Running Next.js dev server with Turbopack
- [ ] All dependencies installed and importable (including `@neondatabase/serverless`, `drizzle-orm`, `drizzle-kit`, `tsx`)
- [ ] `drizzle.config.ts` configured with schema path and Neon connection
- [ ] `.env.local` populated with `DATABASE_URL` and `DATABASE_URL_POOLED`
- [ ] Folder structure created with placeholder files (including `src/lib/db/` and `scripts/`)
- [ ] `package.json` scripts include `db:generate`, `db:migrate`, `db:studio`, `sync-database`
- [ ] Tailwind with custom color tokens working
- [ ] TypeScript types defined and compile without errors
- [ ] `npm run lint` passes clean

## Validation

```bash
npm run dev      # Starts without errors
npm run build    # Production build succeeds
npm run lint     # Zero warnings
npx tsc --noEmit # Zero type errors
```