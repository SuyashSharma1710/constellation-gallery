# Constellation Gallery

An immersive 3D web experience that visualizes art history through an interactive cosmic timeline. Navigate constellations of art periods, explore artist profiles, and walk through period-specific 3D galleries — all powered by live Wikidata and Wikimedia data.

## Features

- **Cosmic Timeline** — Zoom and pan through a procedurally generated 3D space where art periods are constellations and artists are stars
- **Artist Profiles** — Typography-driven 2D overlays with biographies, portraits, and artwork previews fetched from Wikipedia
- **Immersive 3D Gallery** — First-person exploration of period-specific galleries with museum-style lighting, physics-based navigation, and procedurally placed artworks
- **Dual-Canvas Architecture** — Isolated R3F canvases for cosmos and gallery views, with smooth Framer Motion transitions
- **Resilient Data Pipeline** — SPARQL queries to Wikidata with automatic fallback to curated static datasets
- **Deep Linking** — URL-synced state via `nuqs` for shareable links (`?period=renaissance&artist=leonardo`)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| 3D Engine | Three.js, React Three Fiber, Drei, Rapier |
| State | Zustand, nuqs |
| Styling | Tailwind CSS v4, Framer Motion |
| Fonts | Cinzel, Inter |
| Image Proxy | Sharp (API route) |
| Language | TypeScript (strict) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main entry
│   ├── globals.css         # Tailwind + custom tokens
│   └── api/image/route.ts  # Sharp image proxy
├── components/
│   ├── canvas/             # R3F Canvas wrappers (Cosmos, Gallery)
│   ├── cosmos/             # Starfield, constellations, artist stars
│   ├── gallery/            # Gallery room, frames, lighting, FPS controller
│   ├── ui/                 # Overlays, loading screen, error fallback
│   └── shared/             # Tooltip, GlassPanel
├── lib/
│   ├── data/               # Types, repository, Wikidata/Wikimedia clients, fallbacks
│   ├── store/              # Zustand global state
│   ├── textures/           # LRU texture cache
│   ├── audio/              # AudioContext singleton
│   ├── physics/            # Rapier world abstraction
│   └── utils/              # Math, device detection, constants
├── hooks/                  # usePrefetchTextures, useDevice, useAudioContext
└── types/                  # Global type augmentations
```

## Architecture

### Dual-Canvas Rendering

Two isolated R3F `<Canvas>` components prevent configuration conflicts between the cosmos orbit controls and the gallery first-person controller. A Framer Motion overlay masks the swap during state transitions.

### Data Pipeline

1. **Wikidata SPARQL** — Query for artists and artworks by art period
2. **Wikimedia Commons API** — Resolve image URLs and dimensions
3. **Repository Layer** — All fetching wrapped in `DataResult<T>` with fallback datasets
4. **Image Proxy** — `/api/image` uses Sharp to resize, convert to WebP, and strip metadata

### State Transitions

```
LOADING → COSMOS → ARTIST_OVERLAY → TRANSITIONING → GALLERY
```

## Performance Targets

| Metric | Target |
|---|---|
| Cosmos FPS | 60fps (mid-range GPU) |
| Gallery FPS | 60fps (mid-range), 30fps minimum |
| VRAM | < 200MB peak |
| Initial Bundle | < 5MB gzipped |
| First Contentful Paint | < 2s (4G) |
| Gallery Transition | < 2s |

## Browser Support

Chrome, Firefox, Safari, Edge (last 2 versions). WebGL 1.0 minimum required. Touch devices supported with virtual joystick controls.

## License

MIT