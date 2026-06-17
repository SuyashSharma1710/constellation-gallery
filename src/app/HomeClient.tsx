'use client';

import { useUrlState } from '@/hooks/useUrlState';
import AppInitializer from '@/components/shared/AppInitializer';
import CosmosCanvas from '@/components/canvas/CosmosCanvas';
import GalleryCanvas from '@/components/canvas/GalleryCanvas';
import { useAppStore } from '@/lib/store';
import type { PeriodConstellation } from '@/lib/data/types';

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Clock: This module has been deprecated')) {
    return;
  }
  originalWarn.apply(console, args);
};

export default function HomeClient({ periods }: { periods: PeriodConstellation[] }) {
  const viewState = useAppStore((s) => s.viewState);

  useUrlState();

  const showGallery = viewState === 'TRANSITIONING' || viewState === 'GALLERY';

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-obsidian">
      <AppInitializer periods={periods} />
      <CosmosCanvas />
      {showGallery && <GalleryCanvas />}
    </main>
  );
}