# Module 01 — Data Pipeline & API Layer

**Priority:** P0 | **Est. Days:** 3 | **Depends On:** 00

## Objective

Build the server-side data pipeline that fetches art period data from Wikidata/Wikimedia, transforms it into the typed schema, and serves it to the client. Includes the Sharp image proxy and static fallback datasets.

## Tasks

### 01.1 SPARQL Query Builder + Executor

**File:** `src/lib/data/wikidata.ts`

- Define SPARQL query templates for retrieving artists and artworks by art movement Wikidata ID.
- Query structure:
  1. Get all artists (`wd:Q5` instances) with `occupation` → `painter` and `movement` → `{periodId}`.
  2. For each artist, retrieve `birthDate`, `deathDate`, `image` (portrait), and `notableWork` items.
  3. For each notable work, retrieve `title`, `inception` (year), `image` (Wikimedia filename), and `description`.
- Execute via `fetch` to `https://query.wikidata.org/sparql?format=json&query={encodedQuery}`.
- Handle errors: timeout (15s), rate limiting (429), empty results.
- Return `DataResult<RawWikiData>`.

### 01.2 Wikimedia Commons API Client

**File:** `src/lib/data/wikimedia.ts`

- Accept raw filenames from SPARQL results.
- Call `https://commons.wikimedia.org/w/api.php?action=query&titles=File:{filename}&prop=imageinfo&iiprop=url|size|extmetadata&format=json`.
- Extract: direct image URL, pixel width, pixel height, description.
- Return `DataResult<RawCommonsData[]>`.

### 01.3 Data Transformer

**File:** `src/lib/data/transformer.ts`

- Accept raw Wikidata + Wikimedia data.
- Transform into `PeriodConstellation` with all nested `ArtistNode` → `Artwork` chains.
- Compute `aspectRatio` from pixel dimensions.
- Generate `cosmosPosition` using spherical Fibonacci distribution (utility in `src/lib/utils/math.ts`).
- Generate `localPosition` for each artist around the constellation center.
- Filter out artworks missing images or titles.
- Deduplicate artists by Wikidata ID.

### 01.4 Repository Pattern

**File:** `src/lib/data/repository.ts`

```typescript
export async function getPeriodData(wikidataId: string): Promise<DataResult<PeriodConstellation>> {
  // 1. Try SPARQL query
  // 2. If SPARQL fails, load fallback JSON
  // 3. For each artwork, resolve Wikimedia image URLs
  // 4. If Wikimedia API fails for individual images, use placeholder
  // 5. Transform and return
}
```

- Each step is wrapped in `try/catch` with individual timeout handling.
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s).
- Fetch caching: `next: { revalidate: 86400 }`.

### 01.5 Fallback Datasets

**Files:** `src/lib/data/fallbacks/*.json`

Create curated static JSON for each major period:

| Period | Wikidata ID | Artists |
|---|---|---|
| Renaissance | Q4692 | 12 |
| Baroque | Q37853 | 12 |
| Impressionism | Q40415 | 10 |
| Romanticism | Q37068 | 10 |
| Surrealism | Q39427 | 10 |
| Modern Art | Q38166 | 10 |

Each fallback file contains the full `PeriodConstellation` shape with pre-resolved image URLs (from Wikimedia, validated to exist).

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

- `async` server component that calls `getPeriodData()` for all periods.
- Passes the resolved `PeriodConstellation[]` as props to the client component tree.
- Shows a loading skeleton while data fetches.

## Deliverables

- [ ] SPARQL query returns valid artist + artwork data for each period
- [ ] Wikimedia API resolves filenames to direct image URLs with dimensions
- [ ] Transformer produces valid `PeriodConstellation` objects
- [ ] Repository handles SPARQL failures by falling back to static JSON
- [ ] Fallback datasets exist for all 6 periods with real, validated data
- [ ] Image proxy route resizes and converts images to WebP
- [ ] Server component renders with fetched data within 2s

## Validation

```bash
# Test SPARQL query directly
curl "https://query.wikidata.org/sparql?format=json&query=..."

# Test image proxy
curl "http://localhost:3000/api/image?url=...&w=512"

# Type check
npx tsc --noEmit

# Unit tests (see Module 11)
npx vitest run src/lib/data/__tests__/
```