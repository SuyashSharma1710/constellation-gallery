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
npm install -D @types/three
```

### 00.3 Folder Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (Canvas host + UI overlays)
│   ├── page.tsx                 # Main page entry
│   ├── globals.css              # Tailwind + custom tokens
│   └── api/
│       └── image/
│           └── route.ts         # Sharp image proxy (stub)
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
│   │   ├── repository.ts        # Repository pattern interface
│   │   ├── wikidata.ts          # SPARQL query builder + executor
│   │   ├── wikimedia.ts         # Wikimedia Commons API client
│   │   ├── transformer.ts       # Raw API → typed schema
│   │   └── fallbacks/           # Static JSON datasets per period
│   │       ├── renaissance.json
│   │       ├── baroque.json
│   │       └── ...
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
```

### 00.4 Configuration Files

- **`next.config.ts`:** Configure `images.remotePatterns` for Wikimedia domains, set `experimental.serverActions` if needed.
- **`tailwind.config.ts`:** Add CSS custom properties for the color palette (obsidian, deep space blue, star white, gold accent, glass panel).
- **`globals.css`:** Import `Cinzel` and `Inter` from Google Fonts via `next/font/google`. Define `@layer base` with CSS variables.
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
- [ ] All dependencies installed and importable
- [ ] Folder structure created with placeholder files
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