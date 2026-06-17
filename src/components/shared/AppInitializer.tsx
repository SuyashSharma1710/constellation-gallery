'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useUrlState } from '@/hooks/useUrlState';
import type { PeriodConstellation } from '@/lib/data/types';

interface AppInitializerProps {
  periods: PeriodConstellation[];
}

export default function AppInitializer({ periods }: AppInitializerProps) {
  const setPeriods = useAppStore((s) => s.setPeriods);
  const viewState = useAppStore((s) => s.viewState);

  useEffect(() => {
    setPeriods(periods);
  }, [periods, setPeriods]);

  useEffect(() => {
    if (viewState === 'LOADING' && periods.length > 0) {
      useAppStore.getState().setViewState('COSMOS');
    }
  }, [viewState, periods]);

  useUrlState();

  return null;
}