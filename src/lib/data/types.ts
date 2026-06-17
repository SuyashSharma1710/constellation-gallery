export type DataResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ViewState = 'LOADING' | 'COSMOS' | 'ARTIST_OVERLAY' | 'TRANSITIONING' | 'GALLERY';

export interface Artwork {
  id: string;
  title: string;
  year: string;
  imageHighResUrl: string;
  imageThumbnailUrl: string;
  dimensions: { width: number; height: number };
  aspectRatio: number;
  description: string;
}

export interface ArtistNode {
  id: string;
  name: string;
  birthYear: string;
  deathYear: string;
  portraitUrl: string | null;
  portraitThumbnailUrl: string | null;
  artworks: Artwork[];
  localPosition: { x: number; y: number; z: number };
}

export interface PeriodConstellation {
  id: string;
  name: string;
  description: string;
  wikidataId: string;
  artists: ArtistNode[];
  cosmosPosition: { x: number; y: number; z: number };
  galleryModelPath: string;
}