import { db } from "@/lib/db";
import { periods, artists, artworks } from "@/lib/db/schema";
import { queryWikidata, type RawWikiData } from "./wikidata";
import { fetchWikimediaImages } from "./wikimedia";
import { transformRawData } from "./transformer";
import { constellationLayout } from "@/lib/utils/math";

/**
 * Period catalogue synced from Wikidata. Keys are Wikidata QIDs. Shared by the
 * runtime repository (for fallback metadata) and the seed/sync pipeline.
 *
 * `minArtworks` is the minimum number of paintings-with-free-images an artist
 * must have to appear as a star. Pre-1900 periods clear 10 easily; Surrealism
 * and Modern Art are copyright-constrained (most 20th-c. works have no free
 * image on Commons), so they use a lower bar to stay populated.
 */
export const PERIOD_CONFIG: Record<
  string,
  { name: string; description: string; minArtworks: number }
> = {
  Q4692: {
    name: "Renaissance",
    description:
      "A period of European cultural, artistic, political and economic rebirth following the Middle Ages.",
    minArtworks: 10,
  },
  Q37853: {
    name: "Baroque",
    description:
      "A highly ornate and extravagant style of architecture, art and music that flourished in Europe.",
    minArtworks: 10,
  },
  Q40415: {
    name: "Impressionism",
    description:
      "A 19th-century art movement characterized by small, thin brush strokes and emphasis on light.",
    minArtworks: 10,
  },
  Q37068: {
    name: "Romanticism",
    description:
      "An artistic, literary, musical and intellectual movement emphasizing emotion and individualism.",
    minArtworks: 10,
  },
  Q39427: {
    name: "Surrealism",
    description:
      "A cultural movement that developed in Europe after World War I, known for unexpected juxtapositions.",
    minArtworks: 3,
  },
  Q38166: {
    name: "Modern Art",
    description:
      "Artistic works produced during the period extending roughly from the 1860s to the 1970s.",
    minArtworks: 3,
  },
};

// Max paintings loaded per artist — matches the cap in the artwork query and
// the gallery's curated wall count / VRAM budget.
const MAX_ARTWORKS_PER_ARTIST = 12;

function collectAllImageFilenames(data: RawWikiData): string[] {
  const filenames: string[] = [];
  for (const artist of data.artists) {
    if (artist.portrait) filenames.push(artist.portrait);
  }
  for (const artwork of data.artworks) {
    if (artwork.artworkImage) filenames.push(artwork.artworkImage);
  }
  return filenames;
}

export interface PeriodSyncResult {
  id: string;
  name: string;
  ok: boolean;
  artists: number;
  artworks: number;
  error?: string;
}

export interface SyncSummary {
  total: number;
  succeeded: number;
  failed: number;
  results: PeriodSyncResult[];
}

/**
 * Fetches one period from Wikidata + Wikimedia, transforms it, and upserts the
 * period, its artists, and their artworks into Neon. Idempotent: re-running
 * updates existing rows via `ON CONFLICT (id) DO UPDATE`.
 */
async function syncPeriod(
  periodId: string,
  config: { name: string; description: string; minArtworks: number },
  cosmosPosition: { x: number; y: number; z: number }
): Promise<PeriodSyncResult> {
  const rawData = await queryWikidata(periodId, config.minArtworks);
  if (!rawData.ok) throw new Error(rawData.error);

  const filenames = collectAllImageFilenames(rawData.data);
  const commonsResult = await fetchWikimediaImages(filenames);
  const commonsImages = commonsResult.ok ? commonsResult.data : [];

  const constellation = transformRawData(
    rawData.data,
    commonsImages,
    periodId,
    config.name,
    config.description,
    config.minArtworks,
    MAX_ARTWORKS_PER_ARTIST
  );
  constellation.cosmosPosition = cosmosPosition;

  const now = new Date();

  await db
    .insert(periods)
    .values({
      id: constellation.id,
      name: constellation.name,
      description: constellation.description,
      cosmosPositionX: cosmosPosition.x,
      cosmosPositionY: cosmosPosition.y,
      cosmosPositionZ: cosmosPosition.z,
      galleryModelPath: constellation.galleryModelPath,
    })
    .onConflictDoUpdate({
      target: periods.id,
      set: {
        name: constellation.name,
        description: constellation.description,
        cosmosPositionX: cosmosPosition.x,
        cosmosPositionY: cosmosPosition.y,
        cosmosPositionZ: cosmosPosition.z,
        galleryModelPath: constellation.galleryModelPath,
        updatedAt: now,
      },
    });

  let artworkCount = 0;

  for (const artist of constellation.artists) {
    await db
      .insert(artists)
      .values({
        id: artist.id,
        periodId: constellation.id,
        name: artist.name,
        birthYear: artist.birthYear,
        deathYear: artist.deathYear,
        portraitUrl: artist.portraitUrl,
        portraitThumbnailUrl: artist.portraitThumbnailUrl,
        localPositionX: artist.localPosition.x,
        localPositionY: artist.localPosition.y,
        localPositionZ: artist.localPosition.z,
      })
      .onConflictDoUpdate({
        target: artists.id,
        set: {
          periodId: constellation.id,
          name: artist.name,
          birthYear: artist.birthYear,
          deathYear: artist.deathYear,
          portraitUrl: artist.portraitUrl,
          portraitThumbnailUrl: artist.portraitThumbnailUrl,
          localPositionX: artist.localPosition.x,
          localPositionY: artist.localPosition.y,
          localPositionZ: artist.localPosition.z,
          updatedAt: now,
        },
      });

    for (const artwork of artist.artworks) {
      await db
        .insert(artworks)
        .values({
          id: artwork.id,
          artistId: artist.id,
          title: artwork.title,
          year: artwork.year,
          imageHighResUrl: artwork.imageHighResUrl,
          imageThumbnailUrl: artwork.imageThumbnailUrl,
          dimensionsWidth: artwork.dimensions.width,
          dimensionsHeight: artwork.dimensions.height,
          aspectRatio: artwork.aspectRatio,
          description: artwork.description,
        })
        .onConflictDoUpdate({
          target: artworks.id,
          set: {
            artistId: artist.id,
            title: artwork.title,
            year: artwork.year,
            imageHighResUrl: artwork.imageHighResUrl,
            imageThumbnailUrl: artwork.imageThumbnailUrl,
            dimensionsWidth: artwork.dimensions.width,
            dimensionsHeight: artwork.dimensions.height,
            aspectRatio: artwork.aspectRatio,
            description: artwork.description,
            updatedAt: now,
          },
        });
      artworkCount++;
    }
  }

  return {
    id: periodId,
    name: config.name,
    ok: true,
    artists: constellation.artists.length,
    artworks: artworkCount,
  };
}

/**
 * Syncs all configured periods into Neon. A failure in one period is logged and
 * skipped — Neon retains the last successful sync for that period — so the rest
 * still complete. Safe to run repeatedly (upserts).
 */
export async function syncAllPeriods(
  log: (message: string) => void = () => {}
): Promise<SyncSummary> {
  const periodIds = Object.keys(PERIOD_CONFIG);
  const layout = constellationLayout(periodIds.length, 18);
  const results: PeriodSyncResult[] = [];

  for (let i = 0; i < periodIds.length; i++) {
    const id = periodIds[i];
    const config = PERIOD_CONFIG[id];
    const pos = layout[i];

    try {
      log(`Syncing ${config.name} (${id})...`);
      const result = await syncPeriod(id, config, pos);
      log(`  ✓ ${config.name}: ${result.artists} artists, ${result.artworks} artworks`);
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log(`  ✗ ${config.name}: ${message}`);
      results.push({
        id,
        name: config.name,
        ok: false,
        artists: 0,
        artworks: 0,
        error: message,
      });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return {
    total: periodIds.length,
    succeeded,
    failed: periodIds.length - succeeded,
    results,
  };
}
