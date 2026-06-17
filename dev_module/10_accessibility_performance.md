# Module 10 — Accessibility & Performance

**Priority:** P1 | **Est. Days:** 2 | **Depends On:** 06, 07

## Objective

Ensure the application meets accessibility standards (WCAG AA), respects user preferences (reduced motion, dark mode), and meets the defined performance budget.

## Tasks

### 10.1 Reduced Motion Support

- Check `prefers-reduced-motion: reduce` via the `useDevice` hook.
- When enabled:
  - Disable all camera animations — use instant cuts instead of lerp transitions.
  - Disable the zoom animation on "Explore Gallery" — cut directly to the transition overlay.
  - Disable Framer Motion spring animations on UI panels — use `duration: 0` or `animate: false`.
  - Disable starfield twinkle animation.
  - Disable fog in gallery (can cause disorientation).
- Implementation: wrap motion components with a conditional that checks `prefersReducedMotion`.

### 10.2 Keyboard Navigation

- **2D Overlays:**
  - `Tab` cycles through focusable elements (buttons, links).
  - `Enter` / `Space` activates the focused element.
  - `Escape` closes the current overlay.
- **Gallery:**
  - WASD / Arrow keys for movement (already implemented in Module 05).
  - `Escape` unlocks pointer and returns to cosmos.
- **Focus Management:**
  - When `ArtistOverlay` opens, focus moves to the close button.
  - When `ArtworkDetail` appears, the title is announced via `aria-live`.
  - Focus trap within overlays — `Tab` wraps within the overlay, doesn't escape to the canvas behind.

### 10.3 ARIA & Screen Reader Support

- All interactive elements have `aria-label` attributes:
  - Artist stars: `aria-label="{artistName}, {birthYear}–{deathYear}"`
  - "Explore Gallery" button: `aria-label="Explore {artistName}'s gallery"`
  - Close button: `aria-label="Close artist profile"`
  - Artwork frames: `aria-label="{title}, {year}"`
- Artwork descriptions are rendered as accessible HTML text (not canvas-rendered text).
- `aria-live="polite"` region announces state changes (e.g., "Entering gallery").
- Canvas elements have `role="img"` and `aria-label="3D art history visualization"`.

### 10.4 Color Contrast

- Verify all text on glass panels meets WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large text).
- Gold accent text on dark backgrounds: verify contrast.
- Use Chrome DevTools Accessibility panel or axe DevTools to audit.

### 10.5 Performance Budget Enforcement

| Metric | Target | How to Verify |
|---|---|---|
| Initial JS bundle (gzipped) | < 500KB | `next build` output, `@next/bundle-analyzer` |
| Three.js tree-shaking | Only used modules imported | Check bundle analyzer for unused Three.js code |
| First Contentful Paint | < 2s | Lighthouse (simulated 4G) |
| Largest Contentful Paint | < 3s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Total Blocking Time | < 200ms | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Database Query (getPeriods) | < 50ms cold, < 10ms warm | Neon query timing in server logs |

### 10.6 Bundle Optimization

- **Three.js:** Import only from `three` directly (no `import * as THREE`). Use `drei`'s tree-shakeable imports.
- **Dynamic Imports:** Lazy-load the gallery canvas and all its dependencies:
  ```typescript
  const GalleryCanvas = dynamic(() => import('@/components/canvas/GalleryCanvas'), { ssr: false });
  ```
- **GLB Models:** Pre-compress with `gltf-transform` (draco + texture resize).
- **Fonts:** Use `next/font/google` with `subset: ['latin']` and `display: 'swap'`.
- **Images:** All images go through the `/api/image` proxy with WebP output.

### 10.7 Runtime Performance

- **FPS Monitoring:** Use `stats.js` or a custom `useFPS` hook in development.
- **Draw Calls:** Keep under 500 draw calls in gallery view, under 200 in cosmos view.
- **Instance Rendering:** Use `InstancedMesh` for starfield particles and artist stars (if count > 50).
- **Texture Atlas:** Consider combining small textures (thumbnails) into a single atlas to reduce draw calls.

### 10.8 Error Boundary

**File:** `src/components/shared/ErrorBoundary.tsx`

- React error boundary wrapping the entire app.
- Catches rendering errors and shows a graceful fallback UI.
- Logs errors to console (and optionally to a monitoring service).

## Deliverables

- [ ] Reduced motion preferences respected throughout
- [ ] Keyboard navigation works for all 2D overlays
- [ ] ARIA labels on all interactive elements
- [ ] Focus management (trap + auto-focus) in overlays
- [ ] Color contrast meets WCAG AA
- [ ] Lighthouse score ≥ 90 (Performance, Accessibility, Best Practices)
- [ ] Bundle size under 500KB (gzipped) for initial load
- [ ] Gallery canvas lazy-loaded
- [ ] Error boundary catches and displays fallback UI

## Validation

```bash
npm run build          # Check bundle sizes
npx lighthouse http://localhost:3000 --view
npx axe http://localhost:3000
```
- Manual: test with macOS VoiceOver or Windows Narrator
- Manual: test keyboard navigation through full user flow