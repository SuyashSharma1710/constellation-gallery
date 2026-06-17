import type { DataResult, PeriodConstellation } from "./types";
import { queryWikidata } from "./wikidata";
import { fetchWikimediaImages } from "./wikimedia";
import { transformRawData } from "./transformer";

const PERIOD_CONFIG: Record<string, { name: string; description: string }> = {
  Q4692: {
    name: "Renaissance",
    description: "A period of European cultural, artistic, political and economic rebirth following the Middle Ages.",
  },
  Q37853: {
    name: "Baroque",
    description: "A highly ornate and extravagant style of architecture, art and music that flourished in Europe.",
  },
  Q40415: {
    name: "Impressionism",
    description: "A 19th-century art movement characterized by small, thin brush strokes and emphasis on light.",
  },
  Q37068: {
    name: "Romanticism",
    description: "An artistic, literary, musical and intellectual movement emphasizing emotion and individualism.",
  },
  Q39427: {
    name: "Surrealism",
    description: "A cultural movement that developed in Europe after World War I, known for unexpected juxtapositions.",
  },
  Q38166: {
    name: "Modern Art",
    description: "Artistic works produced during the period extending roughly from the 1860s to the 1970s.",
  },
};

async function retry<T>(fn: () => Promise<T>, attempts: number = 3): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function collectAllImageFilenames(data: { artists: Array<{ portrait: string }>; artworks: Array<{ artworkImage: string }> }): string[] {
  const filenames: string[] = [];

  for (const artist of data.artists) {
    if (artist.portrait) filenames.push(artist.portrait);
  }

  for (const artwork of data.artworks) {
    if (artwork.artworkImage) filenames.push(artwork.artworkImage);
  }

  return filenames;
}

async function loadFallback(periodId: string): Promise<PeriodConstellation> {
  const config = PERIOD_CONFIG[periodId];
  const periodName = config?.name || periodId;

  try {
    const fallbackModule = await import(`./fallbacks/${periodName.toLowerCase()}.json`);
    return fallbackModule.default || fallbackModule;
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

export async function getPeriodData(wikidataId: string): Promise<DataResult<PeriodConstellation>> {
  const config = PERIOD_CONFIG[wikidataId];
  if (!config) {
    return { ok: false, error: `Unknown period: ${wikidataId}` };
  }

  try {
    const rawData = await retry(() => queryWikidata(wikidataId));

    if (!rawData.ok) {
      const fallback = await loadFallback(wikidataId);
      return { ok: true, data: fallback };
    }

    const imageFilenames = collectAllImageFilenames(rawData.data);
    const commonsResult = await retry(() => fetchWikimediaImages(imageFilenames));

    const commonsImages = commonsResult.ok ? commonsResult.data : [];

    const constellation = transformRawData(
      rawData.data,
      commonsImages,
      wikidataId,
      config.name,
      config.description
    );

    return { ok: true, data: constellation };
  } catch {
    const fallback = await loadFallback(wikidataId);
    return { ok: true, data: fallback };
  }
}

export async function getPeriods(): Promise<DataResult<PeriodConstellation[]>> {
  const periodIds = Object.keys(PERIOD_CONFIG);
  const results: PeriodConstellation[] = [];

  for (const id of periodIds) {
    const result = await getPeriodData(id);
    if (result.ok) {
      results.push(result.data);
    }
  }

  return { ok: true, data: results };
}