# Module 09 — Mobile Support

**Priority:** P1 | **Est. Days:** 2.5 | **Depends On:** 03, 05, 06

## Objective

Detect touch devices and provide fallback interaction models for both the cosmos view (touch-drag panning, pinch-to-zoom) and the gallery view (virtual joystick or tap-to-move, with a 2D slideshow fallback).

## Tasks

### 09.1 Device Detection Hook

**File:** `src/hooks/useDevice.ts`

```typescript
interface DeviceInfo {
  isTouch: boolean;       // 'ontouchstart' in window || matchMedia('(pointer: coarse)')
  isMobile: boolean;      // max-width: 768px
  isTablet: boolean;      // max-width: 1024px
  supportsWebGL: boolean; // !!document.createElement('canvas').getContext('webgl')
  prefersReducedMotion: boolean; // matchMedia('(prefers-reduced-motion: reduce)')
}

export function useDevice(): DeviceInfo;
```

- Values are memoized and don't change during the session.
- Exported for use across all components.

### 09.2 Cosmos Touch Controls

- On touch devices, replace `OrbitControls` with touch-compatible controls:
  - Single finger drag: rotate/pan.
  - Two-finger pinch: zoom in/out.
  - Tap on artist star: select (same as click).
- `OrbitControls` from drei already supports touch by default — verify and test:
  - `touches.ONE: THREE.TOUCH.ROTATE`
  - `touches.TWO: THREE.TOUCH.DOLLY_PAN`
- Ensure tooltips appear on touch (use `onPointerDown` + `onPointerUp` on the same mesh within 300ms to detect tap).

### 09.3 Gallery Touch Controls

#### Option A: Virtual Joystick (Primary)

**File:** `src/components/gallery/VirtualJoystick.tsx`

- A semi-transparent circular joystick overlay in the bottom-left corner of the screen.
- Touch and drag within the joystick area to move the player.
- The joystick's offset from center maps to movement direction and speed.
- Right side of the screen: touch-drag to look around (replaces mouse-look).
- Double-tap to interact with artwork (proximity trigger).

#### Option B: 2D Slideshow Fallback (When Gallery is Too Heavy)

**File:** `src/components/ui/MobileGalleryFallback.tsx`

- If the device is a phone (screen width < 768px), render a 2D slideshow instead of the full 3D gallery.
- Content:
  - Full-screen artwork images with swipe navigation (horizontal carousel).
  - Title, year, medium, and description below each image.
  - "Back to Cosmos" button.
- Uses Framer Motion for slide transitions.
- This avoids the performance and usability issues of FPS controls on small screens.

### 09.4 UI Responsiveness

- Artist overlay: on mobile (< 768px), slides up from the bottom instead of the right, takes full width.
- Font sizes scale down for mobile (use Tailwind `text-sm` / `text-base` / `text-lg` responsive classes).
- Tap targets are minimum 44x44px (Tailwind `min-h-[44px] min-w-[44px]`).
- Bottom safe area padding accounted for (`env(safe-area-inset-bottom)`).

### 09.5 Performance Mode for Mobile

- When `isMobile` is true:
  - Starfield particle count reduced to 1000.
  - Gallery texture resolution capped at 1024px (via image proxy `w=1024`).
  - Shadow maps disabled in gallery.
  - `dpr` capped at `[1, 1]`.
  - Fog and post-processing effects disabled.

## Deliverables

- [ ] Device detection hook returns accurate touch/mobile/WebGL flags
- [ ] Cosmos view works with touch gestures (drag, pinch, tap)
- [ ] Virtual joystick for gallery movement on tablets
- [ ] 2D slideshow fallback for phones
- [ ] Artist overlay responsive on mobile
- [ ] Performance optimizations applied on mobile devices
- [ ] Safe area insets handled on notched phones

## Validation

- Test on physical iPhone and Android devices
- Test on iPad (tablet mode)
- Test in Chrome DevTools device emulation
- Verify cosmos touch gestures: drag to rotate, pinch to zoom, tap to select artist
- Verify gallery virtual joystick works
- Verify slideshow fallback displays artworks correctly
- Verify 60fps on mobile devices (cosmos view)