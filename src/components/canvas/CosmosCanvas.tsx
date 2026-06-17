'use client';

import { Canvas } from '@react-three/fiber';
import { useAppStore } from '@/lib/store';
import CosmosScene from '@/components/cosmos/CosmosScene';

export default function CosmosCanvas() {
  const viewState = useAppStore((s) => s.viewState);
  const visible = viewState === 'COSMOS' || viewState === 'ARTIST_OVERLAY';

  return (
    <div
      className="fixed inset-0 z-0"
      style={{ visibility: visible ? 'visible' : 'hidden' }}
    >
      <Canvas
        camera={{ position: [0, 0, 30], fov: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <CosmosScene />
      </Canvas>
    </div>
  );
}