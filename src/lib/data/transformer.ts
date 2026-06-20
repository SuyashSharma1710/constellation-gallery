import type { PeriodConstellation, ArtistNode, Artwork } from "./types";
import type { RawWikiData } from "./wikidata";
import type { RawCommonsImage } from "./wikimedia";
import { sphericalFibonacci, collisionAvoidance } from "@/lib/utils/math";

function resolveImageUrl(
  wikidataImageUrl: string,
  commonsImages: RawCommonsImage[]
): { highRes: string; thumbnail: string; width: number; height: number } | null {
  if (!wikidataImageUrl) return null;

  const filename = extractFilenameFromUrl(wikidataImageUrl);
  const match = commonsImages.find((img) => {
    const cf = extractFilenameFromUrl(img.filename);
    const wf = filename;
    return cf === wf || cf.includes(wf) || wf.includes(cf);
  });

  if (match) {
    return {
      highRes: match.url,
      thumbnail: match.url,
      width: match.width,
      height: match.height,
    };
  }

  return {
    highRes: wikidataImageUrl,
    thumbnail: wikidataImageUrl,
    width: 800,
    height: 600,
  };
}

function extractFilenameFromUrl(url: string): string {
  const parts = url.split("/");
  const last = parts[parts.length - 1];
  const decoded = decodeURIComponent(last);
  return decoded.replace(/^File:/, "");
}

function extractWikidataId(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

export function transformRawData(
  raw: RawWikiData,
  commonsImages: RawCommonsImage[],
  periodId: string,
  periodName: string,
  description: string = "",
  minArtworks: number = 10,
  maxArtworksPerArtist: number = 12
): PeriodConstellation {
  const artistMap = new Map<string, ArtistNode>();

  for (let i = 0; i < raw.artists.length; i++) {
    const a = raw.artists[i];
    const id = extractWikidataId(a.artist);
    if (artistMap.has(id)) continue;

    const portrait = resolveImageUrl(a.portrait, commonsImages);

    artistMap.set(id, {
      id,
      name: a.artistLabel || "Unknown Artist",
      birthYear: a.birthDate,
      deathYear: a.deathDate,
      portraitUrl: portrait?.highRes || null,
      portraitThumbnailUrl: portrait?.thumbnail || null,
      artworks: [],
      localPosition: { x: 0, y: 0, z: 0 },
    });
  }

  for (let i = 0; i < raw.artworks.length; i++) {
    const aw = raw.artworks[i];
    const artistId = extractWikidataId(aw.artistId);
    const artist = artistMap.get(artistId);
    if (!artist) continue;
    if (!aw.artworkLabel || !aw.artworkImage) continue;

    const image = resolveImageUrl(aw.artworkImage, commonsImages);
    if (!image) continue;

    // Enforce the per-artist artwork cap (gallery walls + VRAM budget).
    if (artist.artworks.length >= maxArtworksPerArtist) continue;

    const artworkId = extractWikidataId(aw.artwork);
    const artwork: Artwork = {
      id: artworkId,
      title: aw.artworkLabel,
      year: aw.year,
      imageHighResUrl: image.highRes,
      imageThumbnailUrl: image.thumbnail,
      dimensions: { width: image.width, height: image.height },
      aspectRatio: image.height > 0 ? image.width / image.height : 1,
      description: aw.description,
    };

    artist.artworks.push(artwork);
  }

  // Keep only artists that meet the period's minimum artwork threshold, so the
  // cosmos never shows a star whose gallery is near-empty.
  const artists = Array.from(artistMap.values()).filter(
    (a) => a.artworks.length >= minArtworks
  );

  let positions = sphericalFibonacci(artists.length, 3);
  positions = collisionAvoidance(positions, 0.5);

  for (let i = 0; i < artists.length; i++) {
    artists[i].localPosition = positions[i];
  }

return {
    id: periodId,
    name: periodName,
    description,
    wikidataId: periodId,
    artists,
    cosmosPosition: { x: 0, y: 0, z: 0 },
    galleryModelPath: "",
  };
}