'use client';

import { useEffect, useRef } from 'react';
import { useQueryState } from 'nuqs';
import { useAppStore } from '@/lib/store';
import type { PeriodConstellation, ArtistNode } from '@/lib/data/types';

const periodParser = {
  parse: (value: string) => value || null,
  serialize: (value: string) => value,
};

const artistParser = {
  parse: (value: string) => value || null,
  serialize: (value: string) => value,
};

export function useUrlState() {
  const [periodId, setPeriodId] = useQueryState('period', periodParser);
  const [artistId, setArtistId] = useQueryState('artist', artistParser);

  const activePeriod = useAppStore((s) => s.activePeriod);
  const activeArtist = useAppStore((s) => s.activeArtist);
  const viewState = useAppStore((s) => s.viewState);
  const periods = useAppStore((s) => s.periods);
  const setActivePeriod = useAppStore((s) => s.setActivePeriod);
  const setActiveArtist = useAppStore((s) => s.setActiveArtist);
  const setViewState = useAppStore((s) => s.setViewState);

  const isRestoring = useRef(false);
  const prevPeriodId = useRef<string | null>(null);
  const prevArtistId = useRef<string | null>(null);

  // Sync store → URL
  useEffect(() => {
    if (isRestoring.current) return;

    const newPeriodId = viewState === 'GALLERY' || viewState === 'ARTIST_OVERLAY'
      ? activePeriod?.id ?? null
      : null;

    const newArtistId = viewState === 'ARTIST_OVERLAY'
      ? activeArtist?.id ?? null
      : null;

    if (newPeriodId !== prevPeriodId.current) {
      prevPeriodId.current = newPeriodId;
      setPeriodId(newPeriodId);
    }

    if (newArtistId !== prevArtistId.current) {
      prevArtistId.current = newArtistId;
      setArtistId(newArtistId);
    }
  }, [viewState, activePeriod, activeArtist, setPeriodId, setArtistId]);

  // Restore from URL on mount
  useEffect(() => {
    if (periods.length === 0) return;

    let foundPeriod: PeriodConstellation | null = null;
    let foundArtist: ArtistNode | null = null;

    if (periodId) {
      foundPeriod = periods.find((p) => p.id === periodId) ?? null;
    }

    if (artistId && foundPeriod) {
      foundArtist = foundPeriod.artists.find((a) => a.id === artistId) ?? null;
    }

    if (foundPeriod && foundArtist) {
      isRestoring.current = true;
      setActivePeriod(foundPeriod);
      setActiveArtist(foundArtist);
      setViewState('ARTIST_OVERLAY');
      isRestoring.current = false;
    } else if (foundPeriod) {
      isRestoring.current = true;
      setActivePeriod(foundPeriod);
      setViewState('COSMOS');
      isRestoring.current = false;
    } else if (periodId || artistId) {
      setPeriodId(null);
      setArtistId(null);
      setViewState('COSMOS');
    } else {
      setViewState('COSMOS');
    }
  }, [periods, periodId, artistId, setActivePeriod, setActiveArtist, setViewState, setPeriodId, setArtistId]);
}