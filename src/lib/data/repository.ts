import { cache } from "react";
import { db } from "@/lib/db";
import type { DataResult, PeriodConstellation, ArtistNode, Artwork } from "./types";
import { PERIOD_CONFIG } from "./sync";

async function loadFallback(periodId: string): Promise<PeriodConstellation> {
  const config = PERIOD_CONFIG[periodId];
  const periodName = config?.name || periodId;

  try {
    const fallbackModule = await import(`./fallbacks/${periodName.toLowerCase()}.json`);
    return (fallbackModule.default || fallbackModule) as PeriodConstellation;
  } catch {
    return {
      id: periodId,
      name: periodName,
      description: config?.description || "",
      wikidataId: periodId,
      artists: [],
      cosmosPosition: { x: 0, y: 8, z: 0 },
      galleryModelPath: "",
    };
  }
}

async function loadAllFallbacks(): Promise<DataResult<PeriodConstellation[]>> {
  const periodIds = Object.keys(PERIOD_CONFIG);
  const data = await Promise.all(periodIds.map((id) => loadFallback(id)));
  return { ok: true, data };
}

/**
 * Reads all periods (with nested artists + artworks) from Neon via Drizzle and
 * maps the flat rows back into the nested `PeriodConstellation` shape. Falls
 * back to the curated static JSON datasets if Neon is unavailable.
 *
 * Wrapped in React `cache()` for per-request deduplication across server
 * components. Data freshness is managed by the weekly cron sync, so no
 * `revalidate` is needed here.
 */
export const getPeriods = cache(async (): Promise<DataResult<PeriodConstellation[]>> => {
  try {
    const periodRows = await db.query.periods.findMany({
      with: {
        artists: {
          with: { artworks: true },
        },
      },
    });

    if (periodRows.length === 0) {
      // Empty database (never seeded) — serve curated fallbacks instead of a
      // blank cosmos.
      return loadAllFallbacks();
    }

    const constellations: PeriodConstellation[] = periodRows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      wikidataId: p.id,
      cosmosPosition: {
        x: p.cosmosPositionX,
        y: p.cosmosPositionY,
        z: p.cosmosPositionZ,
      },
      galleryModelPath: p.galleryModelPath,
      artists: p.artists.map(
        (a): ArtistNode => ({
          id: a.id,
          name: a.name,
          birthYear: a.birthYear,
          deathYear: a.deathYear,
          portraitUrl: a.portraitUrl,
          portraitThumbnailUrl: a.portraitThumbnailUrl,
          localPosition: {
            x: a.localPositionX,
            y: a.localPositionY,
            z: a.localPositionZ,
          },
          artworks: a.artworks.map(
            (aw): Artwork => ({
              id: aw.id,
              title: aw.title,
              year: aw.year,
              imageHighResUrl: aw.imageHighResUrl,
              imageThumbnailUrl: aw.imageThumbnailUrl,
              dimensions: {
                width: aw.dimensionsWidth,
                height: aw.dimensionsHeight,
              },
              aspectRatio: aw.aspectRatio,
              description: aw.description,
            })
          ),
        })
      ),
    }));

    return { ok: true, data: constellations };
  } catch {
    // Neon unavailable (connection error, timeout, unconfigured) — degrade
    // gracefully to the static JSON datasets.
    return loadAllFallbacks();
  }
});

/**
 * Reads a single period by Wikidata ID from Neon, falling back to its static
 * JSON dataset on failure.
 */
export const getPeriodData = cache(
  async (wikidataId: string): Promise<DataResult<PeriodConstellation>> => {
    const config = PERIOD_CONFIG[wikidataId];
    if (!config) {
      return { ok: false, error: `Unknown period: ${wikidataId}` };
    }

    const all = await getPeriods();
    if (all.ok) {
      const match = all.data.find((p) => p.id === wikidataId);
      if (match) return { ok: true, data: match };
    }

    return { ok: true, data: await loadFallback(wikidataId) };
  }
);
