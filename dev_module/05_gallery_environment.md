# Module 05 — Gallery Environment (3D)

**Priority:** P0 | **Est. Days:** 5 | **Depends On:** 01, 02

## Objective

Build the first-person 3D gallery experience: GLB room loading, Rapier physics world, FPS character controller, procedural artwork placement on walls, museum-style lighting, and proximity-based artwork interaction.

## Tasks

### 05.1 GalleryCanvas Wrapper

**File:** `src/components/canvas/GalleryCanvas.tsx`

- Renders a dedicated `<Canvas>` with:
  - `camera={{ position: [0, 1.7, 5], fov: 75, near: 0.1, far: 100 }}` (eye height)
  - `shadows` enabled
  - `gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}`
  - `dpr={[1, 2]}`
- Wraps children in `<Physics>` from `@react-three/rapier` with:
  - `gravity={[0, -9.81, 0]}`
  - `debug={false}` (toggle in dev)
- Conditionally rendered when `viewState` is `'GALLERY'`.

### 05.2 GalleryScene Orchestrator

**File:** `src/components/gallery/GalleryScene.tsx`

- Receives `activeArtist` and `activePeriod` from Zustand.
- Orchestrates: room loading, artwork placement, lighting, and FPS controller.
- Reports readiness to the transition system after all assets are loaded.

### 05.3 GalleryRoom (GLB Model Loading)

**File:** `src/components/gallery/GalleryRoom.tsx`

- Loads the period-specific GLB model from `/public/models/{period-slug}.glb` using `useGLTF` from drei.
- Caches the model with `useGLTF.preload()`.
- If the GLB fails to load, falls back to a procedurally generated box room:
  - 6 `BoxGeometry` walls (10x4x15 units room)
  - Dark stone-like material (deep gray with subtle roughness)
  - Ceiling with a slight arched feel using a curved plane
- GLB model requirements:
  - 4–6 designated wall areas (named empties or bone markers: `wall_01`, `wall_02`, etc.)
  - Floor collider
  - Optimized mesh (< 2MB compressed)

### 05.4 ArtworkFrame (Procedural Placement)

**File:** `src/components/gallery/ArtworkFrame.tsx`

- Accepts an `Artwork` object and a `position` + `rotation` for a wall slot.
- Renders:
  - A `PlaneGeometry` scaled to the artwork's aspect ratio (max height 2.5 units, width derived).
  - A frame mesh (thin `BoxGeometry` border, gold/brown material) around the plane.
  - A plaque below the frame with the artwork title and year (using `<Text>` from drei).
- Texture: loads the artwork image via `useTexture` (from `imageHighResUrl`).
- Material: `MeshStandardMaterial` with `map: texture`, `roughness: 0.8`, `metalness: 0`.
- Proximity detection: `useFrame` checks distance from camera to artwork. If < 2 units, triggers `onProximityEnter(artwork)`. If > 2 units, triggers `onProximityExit()`.

### 05.5 GalleryLighting

**File:** `src/components/gallery/GalleryLighting.tsx`

- **Ambient Light:** `intensity={0.15}`, warm tone (slightly orange).
- **Spotlights:** One per artwork wall slot.
  - `intensity={8}`, `penumbra={0.5}`, `angle={0.4}`
  - Positioned above and angled toward the artwork.
  - `castShadow` enabled with `shadow-mapSize={[512, 512]}`.
- **Point Lights:** 2–3 dim point lights along the gallery center for path illumination.
- **Fog:** `fog={{ color: '#0a0a0a', near: 5, far: 25 }}` for atmospheric depth.

### 05.6 FPSController (First-Person Controls)

**File:** `src/components/gallery/FPSController.tsx`

- Uses Rapier's `RigidBody` with `type="kinematicPosition"` for the player capsule.
- **Movement:** WASD / Arrow keys. Reads keyboard state via `useKeyboardControls` or a custom `useKeyMap` hook.
  - Forward/back/strafe relative to camera look direction.
  - Speed: 3 units/sec walk, 5 units/sec sprint (Shift).
- **Look:** PointerLockControls from drei. Mouse movement rotates the camera.
  - `maxPolarAngle: Math.PI * 0.85` (prevent looking straight up/down).
  - Sensitivity: adjustable via prop (default 0.002).
- **Collision:** The player capsule (radius 0.3, height 1.6) collides with room walls via Rapier colliders.
- **Pointer Lock:** Click to lock pointer. Escape to unlock. Show "Click to explore" prompt when unlocked.

### 05.7 ArtworkDetail Overlay

**File:** `src/components/ui/ArtworkDetail.tsx`

- Rendered as a Framer Motion overlay at the bottom of the screen when within proximity of an artwork.
- Content: artwork title, year, medium, and description.
- Slides up from bottom with `animate={{ y: 0 }}` on enter, `animate={{ y: '100%' }}` on exit.
- Uses `GlassPanel` styling.
- Dismisses when the player moves away from the artwork.

### 05.8 PhysicsWorld Abstraction

**File:** `src/lib/physics/PhysicsWorld.ts`

- Wraps Rapier world initialization.
- Provides methods: `addWallCollider`, `removeWallCollider`, `getPlayerBody`.
- Handles cleanup on unmount (`world.free()`).
- The gallery room automatically registers its wall meshes as colliders.

## Deliverables

- [ ] GalleryCanvas renders with Rapier physics world
- [ ] GLB room loads with correct period-specific model
- [ ] Fallback box room works when GLB fails
- [ ] Artwork frames placed on wall slots with correct aspect ratios
- [ ] Museum lighting (spotlights + ambient + fog) looks dramatic
- [ ] FPS controls: WASD movement, mouse look, pointer lock
- [ ] Player collides with walls (no clipping)
- [ ] Proximity detection triggers artwork detail overlay
- [ ] 60fps on mid-range GPU with 8+ artworks loaded

## Validation

- Enter gallery, verify room loads with textures
- Walk around with WASD, verify collision with walls
- Approach a painting, verify detail overlay appears
- Verify all artworks are visible and lit
- Check FPS with Chrome DevTools — target 60fps
- Test with different periods, verify different rooms load