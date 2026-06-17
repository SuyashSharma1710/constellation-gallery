import { create } from 'zustand';
import type { PeriodConstellation, ArtistNode, ViewState } from '@/lib/data/types';

const VALID_TRANSITIONS: Record<ViewState, ViewState[]> = {
  LOADING: ['COSMOS'],
  COSMOS: ['ARTIST_OVERLAY'],
  ARTIST_OVERLAY: ['COSMOS', 'TRANSITIONING'],
  TRANSITIONING: ['GALLERY', 'COSMOS'],
  GALLERY: ['TRANSITIONING'],
};

function isValidTransition(from: ViewState, to: ViewState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

interface AppState {
  viewState: ViewState;
  setViewState: (state: ViewState) => void;

  periods: PeriodConstellation[];
  setPeriods: (periods: PeriodConstellation[]) => void;
  activePeriod: PeriodConstellation | null;
  setActivePeriod: (period: PeriodConstellation | null) => void;
  activeArtist: ArtistNode | null;
  setActiveArtist: (artist: ArtistNode | null) => void;

  selectArtist: (period: PeriodConstellation, artist: ArtistNode) => void;
  enterGallery: () => void;
  exitGallery: () => void;
  closeArtistOverlay: () => void;
  resetToCosmos: () => void;
  completeTransition: (target: ViewState) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  viewState: 'LOADING',
  setViewState: (viewState) => {
    const current = get().viewState;
    if (!isValidTransition(current, viewState)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[AppStore] Invalid view state transition: ${current} → ${viewState}`
        );
      }
      return;
    }
    set({ viewState });
  },

  periods: [],
  setPeriods: (periods) => set({ periods }),

  activePeriod: null,
  setActivePeriod: (period) => set({ activePeriod: period }),

  activeArtist: null,
  setActiveArtist: (artist) => set({ activeArtist: artist }),

  selectArtist: (period, artist) => {
    const current = get().viewState;
    if (!isValidTransition(current, 'ARTIST_OVERLAY')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[AppStore] Cannot select artist from state: ${current}`
        );
      }
      return;
    }
    set({
      activePeriod: period,
      activeArtist: artist,
      viewState: 'ARTIST_OVERLAY',
    });
  },

  enterGallery: () => {
    const current = get().viewState;
    if (!isValidTransition(current, 'TRANSITIONING')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[AppStore] Cannot enter gallery from state: ${current}`
        );
      }
      return;
    }
    set({ viewState: 'TRANSITIONING' });
  },

  exitGallery: () => {
    const current = get().viewState;
    if (!isValidTransition(current, 'TRANSITIONING')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[AppStore] Cannot exit gallery from state: ${current}`
        );
      }
      return;
    }
    set({ viewState: 'TRANSITIONING' });
  },

  closeArtistOverlay: () => {
    const current = get().viewState;
    if (current !== 'ARTIST_OVERLAY') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[AppStore] Cannot close artist overlay from state: ${current}`
        );
      }
      return;
    }
    set({
      activeArtist: null,
      viewState: 'COSMOS',
    });
  },

  resetToCosmos: () => {
    set({
      activePeriod: null,
      activeArtist: null,
      viewState: 'COSMOS',
    });
  },

  completeTransition: (target) => {
    const current = get().viewState;
    if (current !== 'TRANSITIONING') {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[AppStore] completeTransition called from non-transitioning state: ${current}`
        );
      }
      return;
    }
    if (!isValidTransition('TRANSITIONING', target)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[AppStore] Invalid transition target: TRANSITIONING → ${target}`
        );
      }
      return;
    }
    set({ viewState: target });
  },
}));