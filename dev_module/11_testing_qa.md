# Module 11 — Testing & QA

**Priority:** P2 | **Est. Days:** 2 | **Depends On:** 01–10

## Objective

Implement unit tests for the data pipeline, component tests for 2D UI, and E2E smoke tests for the full user flow. Ensure code quality and prevent regressions.

## Tasks

### 11.1 Unit Tests — Data Pipeline

**Tool:** Vitest  
**Location:** `src/lib/data/__tests__/`

#### Test Cases:

**`transformer.test.ts`**
- Transforms valid raw Wikidata + Wikimedia data into `PeriodConstellation`.
- Handles empty artist list → returns empty `artists` array.
- Handles missing portrait → `portraitUrl: null`.
- Handles missing artwork images → artwork is filtered out.
- Computes `aspectRatio` correctly from dimensions.
- Generates `localPosition` coordinates for all artists (non-overlapping check on 100 runs).

**`wikidata.test.ts`**
- Builds correct SPARQL query URL for a given Wikidata ID.
- Parses valid JSON response into `RawWikiData`.
- Handles HTTP 429 (rate limit) → returns `DataResult` error.
- Handles timeout → returns `DataResult` error.
- Handles empty results → returns `DataResult` error.

**`wikimedia.test.ts`**
- Resolves valid filenames to image URLs with dimensions.
- Handles 404 for missing files → returns `DataResult` error.
- Handles malformed API response → returns `DataResult` error.

**`repository.test.ts`**
- Returns data from SPARQL when API succeeds.
- Falls back to static JSON when SPARQL fails.
- Caches results within the revalidation window.
- Retries 3 times on transient failures.

### 11.2 Unit Tests — Utilities

**`math.test.ts`**
- `sphericalFibonacci(n, radius)` returns `n` points.
- Points are within `radius` distance from origin.
- Points are reasonably distributed (no duplicates within 0.1 units).
- `spiralLayout(n, spacing)` returns `n` points on a spiral.

**`TexturePool.test.ts`**
- `set` and `get` work correctly.
- LRU eviction removes least recently used entries.
- `clear()` disposes all textures and resets VRAM.
- Adding texture over budget triggers eviction.
- VRAM calculation is accurate (width * height * 4).

### 11.3 Component Tests — 2D UI

**Tool:** Vitest + React Testing Library (or Storybook)  
**Location:** `src/components/ui/__tests__/`

**`ArtistOverlay.test.tsx`**
- Renders artist name, birth/death years, and portrait.
- Shows "Explore Gallery" button disabled while prefetching.
- Shows "Explore Gallery" button enabled when prefetch complete.
- Calls `enterGallery` on button click.
- Calls `closeArtistOverlay` on Escape key.
- Calls `closeArtistOverlay` on close button click.

**`ArtworkDetail.test.tsx`**
- Renders artwork title, year, medium, and description.
- Slides up from bottom on enter.
- Dismisses when `onDismiss` is called.

**`TransitionOverlay.test.tsx`**
- Renders overlay with correct opacity during transition states.
- Calls `onTransitionComplete` after fade-out animation.

**`LoadingScreen.test.tsx`**
- Renders loading state with animation.
- Hides when `viewState !== 'LOADING'`.

### 11.4 E2E Smoke Tests

**Tool:** Playwright  
**Location:** `e2e/`

**`smoke.spec.ts`**
```typescript
test('full user flow: cosmos → artist → gallery → cosmos', async ({ page }) => {
  await page.goto('/');
  
  // Wait for cosmos to load
  await page.waitForSelector('[data-testid="cosmos-canvas"]', { timeout: 10000 });
  
  // Click an artist star (first one)
  await page.click('[data-testid="artist-star"]:first-child');
  
  // Wait for artist overlay
  await page.waitForSelector('[data-testid="artist-overlay"]');
  
  // Wait for prefetch to complete
  await page.waitForSelector('[data-testid="explore-gallery"]:not([disabled])', { timeout: 15000 });
  
  // Click Explore Gallery
  await page.click('[data-testid="explore-gallery"]');
  
  // Wait for gallery to load
  await page.waitForSelector('[data-testid="gallery-canvas"]', { timeout: 10000 });
  
  // Verify artwork detail appears on proximity
  // (Requires programmatic camera movement or mock)
  
  // Press Escape to exit gallery
  await page.keyboard.press('Escape');
  
  // Wait for cosmos to return
  await page.waitForSelector('[data-testid="cosmos-canvas"]');
});
```

**`deep-link.spec.ts`**
- Navigate to `/?period=baroque&artist=caravaggio` → verify artist overlay opens.
- Navigate to `/?period=renaissance` → verify cosmos view with that period centered.

**`mobile.spec.ts`**
- Set viewport to iPhone 14 → verify slideshow fallback instead of gallery.
- Set viewport to iPad → verify virtual joystick appears.

### 11.5 Test Infrastructure Setup

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
```

- **`vitest.config.ts`:** Configure `jsdom` environment, path aliases, and setup file.
- **`playwright.config.ts`:** Configure browsers (Chromium, Firefox, WebKit), base URL, and viewport presets.
- **`src/test-setup.ts`:** Mock `canvas.getContext('webgl')` for component tests that import Three.js.

### 11.6 CI Integration (GitHub Actions)

```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npx vitest run
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

## Deliverables

- [ ] Unit tests for data pipeline (transformer, wikidata, wikimedia, repository)
- [ ] Unit tests for utilities (math, TexturePool)
- [ ] Component tests for 2D UI (ArtistOverlay, ArtworkDetail, TransitionOverlay, LoadingScreen)
- [ ] E2E smoke test for full user flow
- [ ] Deep link E2E test
- [ ] Mobile fallback E2E test
- [ ] Vitest config with jsdom
- [ ] Playwright config
- [ ] GitHub Actions CI workflow
- [ ] All tests pass in CI

## Validation

```bash
npx vitest run              # All unit + component tests pass
npx playwright test         # All E2E tests pass
npm run lint                # Zero warnings
npx tsc --noEmit            # Zero type errors
```