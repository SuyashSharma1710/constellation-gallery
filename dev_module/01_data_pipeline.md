# Module 01 — Data Pipeline & API Layer

**Priority:** P0 | **Est. Days:** 2 | **Depends On:** 00, 01b

## Objective

Build the server-side data layer that reads art period data from Neon (via Drizzle ORM), transforms flat rows into the nested `PeriodConstellation` shape, and serves it to the client. The data is pre-populated by the seed script in Module 01b — no external API calls happen at runtime. Also includes the Sharp image proxy route.

## Architecture

```
Request → Server Component → Drizzle Query → Neon Postgres → Client Props
                                        │
                                        │ (if Neon unavailable)
                                        ▼
                                   Fallback JSON
```

## Tasks

### 01.1 Repository — Neon-Backed Queries

**File:** `src/lib/data/repository.ts`

Rewrite the repository to read from Neon via Drizzle instead of calling SPARQL/Wikimedia at runtime:

```typescript
import { db } from "@/lib/db";
import type { DataResult, PeriodConstellation, ArtistNode, Artwork } from "./types";
import { constellationLayout } from "@/lib/utils/math";

export async function getPeriods(): Promise<DataResult<PeriodConstellation[]>> {
  try {
    const periodRows = await db.query.periods.findMany({
      with: {
        artists: {
          with: { artworks: true },
        },
      },
    });

    const constellations: PeriodConstellation[] = periodRows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      wikidataId: p.id,
      cosmosPosition: {
        x: p.cosmosPositionX,
        y: p.cosmosPositionY,
        z: p.cosmosPositionZ,
      },
      galleryModelPath: p.galleryModelPath,
      artists: p.artists.map((a): ArtistNode => ({
        id: a.id,
        name: a.name,
        birthYear: a.birthYear,
        deathYear: a.deathYear,
        portraitUrl: a.portraitUrl,
        portraitThumbnailUrl: a.portraitThumbnailUrl,
        localPosition: {
          x: a.localPositionX,
          y: a.localPositionY,
          z: a.localPositionZ,
        },
        artworks: a.artworks.map((aw): Artwork => ({
          id: aw.id,
          title: aw.title,
          year: aw.year,
          imageHighResUrl: aw.imageHighResUrl,
          imageThumbnailUrl: aw.imageThumbnailUrl,
          dimensions: {
            width: aw.dimensionsWidth,
            height: aw.dimensionsHeight,
          },
          aspectRatio: aw.aspectRatio,
          description: aw.description,
        })),
      })),
    }));

    return { ok: true, data: constellations };
  } catch {
    return loadAllFallbacks();
  }
}
```

- **Fallback chain:** Neon → static JSON fallback files → empty period (graceful degradation).
- **Caching:** Wrap with React `cache()` for per-request deduplication in server components.
- **No `fetch` caching needed:** Data is in Postgres. Freshness is managed by the cron sync.

### 01.2 Fallback Datasets (Unchanged)

**Files:** `src/lib/data/fallbacks/*.json`

The existing static JSON fallback files remain as the secondary data source. The repository falls back to them if Neon is unavailable.

| Period | Wikidata ID | Artists |
|---|---|---|
| Renaissance | Q4692 | 12 |
| Baroque | Q37853 | 12 |
| Impressionism | Q40415 | 10 |
| Romanticism | Q37068 | 10 |
| Surrealism | Q39427 | 10 |
| Modern Art | Q38166 | 10 |

### 01.3 SPARQL Query Builder + Executor (Seed-Time Only)

**File:** `src/lib/data/wikidata.ts`

*This file is unchanged from the original implementation.* It is imported only by `scripts/sync-database.ts` (not by the runtime app). The SPARQL query builder, executor, and error handling remain as-is for the seed script.

### 01.4 Wikimedia Commons API Client (Seed-Time Only)

**File:** `src/lib/data/wikimedia.ts`

*This file is unchanged from the original implementation.* It is imported only by `scripts/sync-database.ts`. The Commons API batch resolver, filename extraction, and response parsing remain as-is.

### 01.5 Data Transformer (Seed-Time Only)

**File:** `src/lib/data/transformer.ts`

*This file is unchanged from the original implementation.* It is imported only by `scripts/sync-database.ts`. The transformation from `RawWikiData` → `PeriodConstellation` happens during the seed phase, not at runtime.

### 01.6 Image Proxy API Route

**File:** `src/app/api/image/route.ts`

- Accepts `?url={encodedWikimediaUrl}&w={width}&q={quality}`.
- Uses `sharp` to resize, convert to WebP, and strip metadata.
- Sets `Cache-Control: public, max-age=31536000, immutable`.
- Sets `Access-Control-Allow-Origin: *`.
- Returns the processed image as `image/webp`.
- Rate limiting: max 50 requests per second via in-memory counter.

### 01.7 Server Component Data Fetching

**File:** `src/app/page.tsx` (or a dedicated server component)

- `async` server component that calls `getPeriods()` (reads from Neon).
- Passes the resolved `PeriodConstellation[]` as props to the client component tree.
- Shows a loading skeleton while data fetches.
- On the first request (cold start), Neon may take ~50ms. Subsequent requests hit the React cache.

## Deliverables

- [ ] Repository reads all 6 periods from Neon via Drizzle relations
- [ ] Flat rows correctly mapped to nested `PeriodConstellation` shape
- [ ] Repository falls back to static JSON if Neon is unavailable
- [ ] React `cache()` wraps `getPeriods()` for per-request deduplication
- [ ] Fallback datasets exist for all 6 periods with real, validated data
- [ ] Image proxy route resizes and converts images to WebP
- [ ] Server component renders with data from Neon within 2s

## Validation

```bash
# Test image proxy
curl "http://localhost:3000/api/image?url=...&w=512"

# Verify Neon connection
node -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.DATABASE_URL_POOLED); sql\`SELECT count(*) FROM periods\`.then(console.log)"

# Type check
npx tsc --noEmit

# Unit tests (see Module 11)
npx vitest run src/lib/data/__tests__/
```