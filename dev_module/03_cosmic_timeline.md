# Module 03 — Cosmic Timeline (3D)

**Priority:** P0 | **Est. Days:** 4 | **Depends On:** 01, 02

## Objective

Build the cosmic-level 3D view: a particle starfield, procedurally placed constellation clusters, artist star nodes with connecting lines, orbit controls, hover tooltips, and click-to-select camera transitions.

## Tasks

### 03.1 CosmosCanvas Wrapper

**File:** `src/components/canvas/CosmosCanvas.tsx`

- Renders a dedicated `<Canvas>` with:
  - `camera={{ position: [0, 0, 30], fov: 60 }}`
  - `gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}`
  - `dpr={[1, 2]}` (adaptive pixel ratio)
- Conditionally rendered when `viewState` is `'COSMOS'` or `'ARTIST_OVERLAY'`.
- Uncovers the gallery canvas and is hidden when `viewState` is `'TRANSITIONING'` or `'GALLERY'`.

### 03.2 Starfield Background

**File:** `src/components/cosmos/Starfield.tsx`

- 3000–5000 particles distributed in a sphere (radius ~50 units) using `@react-three/drei` `<Stars>` or custom `BufferGeometry` with `PointsMaterial`.
- Particles have varying sizes (0.02–0.08) and subtle twinkle via a shader or opacity jitter.
- Performance: use `frustumCulled={false}` for the starfield only (always visible).

### 03.3 Constellation Cluster

**File:** `src/components/cosmos/Constellation.tsx`

- Accepts a `PeriodConstellation` prop.
- Renders a glowing label at `cosmosPosition` using `<Text>` from drei.
- Renders connecting lines between artists within the period using `<Line>` from drei (thin, gold-colored, dashed or solid).
- Renders each `ArtistNode` as an `<ArtistStar>` component.

### 03.4 Artist Star Node

**File:** `src/components/cosmos/ArtistStar.tsx`

- Positioned at `artist.localPosition` offset from the constellation center.
- Visual: a small sphere (radius 0.15) with an emissive material (gold/white) and a subtle glow sprite (billboarded circle).
- Hover: detect via `onPointerOver` / `onPointerOut` on the mesh — show a `<Html>` overlay with artist name and portrait thumbnail.
- Cursor: `pointer` on hover.
- Click: calls `selectArtist(period, artist)` from Zustand store.

### 03.5 Orbit Controls

- Use `OrbitControls` from `@react-three/drei`.
- Config:
  - `enableDamping: true`, `dampingFactor: 0.08`
  - `minDistance: 5`, `maxDistance: 60`
  - `maxPolarAngle: Math.PI * 0.8` (prevent flipping)
  - `zoomSpeed: 1.2`
- Disable during camera transitions (locked).

### 03.6 Camera Transition (Click to Artist)

- When an artist is clicked, smoothly animate the camera from its current position to a position centered on the artist's world position.
- Use `@react-three/drei` `CameraControls` or manual `useFrame` lerp with `THREE.Vector3.lerp`.
- Duration: ~1.2s with easing (`easeInOutCubic`).
- After transition completes, the artist overlay opens (triggered by view state change).

### 03.7 Procedural Layout Algorithm

**File:** `src/lib/utils/math.ts`

- **Constellation Distribution:** Place constellation centers on a large spiral in the XZ plane, spaced 15–20 units apart.
- **Artist Distribution:** Use spherical Fibonacci to distribute artists around the constellation center within a radius of 3–5 units.
- Include a collision-avoidance pass: if two artists are within 0.5 units of each other, jitter one.

```typescript
export function sphericalFibonacci(n: number, radius: number): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < n; i++) {
    const theta = 2 * Math.PI * i / goldenRatio;
    const phi = Math.acos(1 - 2 * (i + 0.5) / n);
    points.push({
      x: radius * Math.cos(theta) * Math.sin(phi),
      y: radius * Math.sin(theta) * Math.sin(phi),
      z: radius * Math.cos(phi),
    });
  }
  return points;
}
```

## Deliverables

- [ ] Starfield renders with 3000+ particles at 60fps
- [ ] All 6 constellation clusters visible with labels
- [ ] Artist stars placed procedurally within each constellation
- [ ] Connecting lines between artists in the same period
- [ ] Hover reveals artist name + thumbnail tooltip
- [ ] Click selects artist, camera animates to star
- [ ] Orbit controls: pan, zoom, rotate with damping
- [ ] Camera locked during transitions

## Validation

- 60fps on mid-range GPU (Chrome DevTools FPS meter)
- All 6 periods visible and navigable
- No visual glitches during camera animation
- Orbit controls feel smooth and responsive