import type { DataResult } from "./types";

export interface RawWikiArtist {
  artist: string;
  artistLabel: string;
  birthDate: string;
  deathDate: string;
  portrait: string;
}

export interface RawWikiArtwork {
  artwork: string;
  artworkLabel: string;
  year: string;
  artworkImage: string;
  description: string;
  artistId: string;
}

export interface RawWikiData {
  artists: RawWikiArtist[];
  artworks: RawWikiArtwork[];
}

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const TIMEOUT_MS = 15000;

function buildArtistQuery(periodId: string): string {
  return `
    SELECT DISTINCT ?artist ?artistLabel ?birthDate ?deathDate ?portrait WHERE {
      ?artist wdt:P31 wd:Q5;
              wdt:P106 wd:Q1028181;
              wdt:P135 wd:${periodId}.
      OPTIONAL { ?artist wdt:P569 ?birthDate. }
      OPTIONAL { ?artist wdt:P570 ?deathDate. }
      OPTIONAL { ?artist wdt:P18 ?portrait. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 50
  `;
}

function buildArtworkQuery(periodId: string): string {
  return `
    SELECT DISTINCT ?artist ?artwork ?artworkLabel ?year ?artworkImage ?description WHERE {
      ?artist wdt:P31 wd:Q5;
              wdt:P106 wd:Q1028181;
              wdt:P135 wd:${periodId};
              wdt:P800 ?artwork.
      ?artwork wdt:P31 wd:Q3305213.
      OPTIONAL { ?artwork wdt:P571 ?year. }
      OPTIONAL { ?artwork wdt:P18 ?artworkImage. }
      OPTIONAL { ?artwork schema:description ?description. FILTER(LANG(?description) = "en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 200
  `;
}

function encodeQuery(query: string): string {
  return encodeURIComponent(query.replace(/\s+/g, " ").trim());
}

function parseWikidataDate(raw: string): string {
  if (!raw) return "";
  const match = raw.match(/^\d{4}/);
  return match ? match[0] : raw.slice(0, 4);
}

async function executeSparql<T>(query: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeQuery(query)}`;

  const response = await fetch(url, {
    signal: controller.signal,
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Wikidata rate limited (429)");
    }
    throw new Error(`Wikidata query failed: ${response.status}`);
  }

  const json = await response.json();
  return json as T;
}

interface SparqlBinding {
  [key: string]: { value: string };
}

interface SparqlResponse {
  results: {
    bindings: SparqlBinding[];
  };
}

export async function queryWikidata(periodId: string): Promise<DataResult<RawWikiData>> {
  try {
    const [artistsResult, artworksResult] = await Promise.all([
      executeSparql<SparqlResponse>(buildArtistQuery(periodId)),
      executeSparql<SparqlResponse>(buildArtworkQuery(periodId)),
    ]);

    const artists: RawWikiArtist[] = artistsResult.results.bindings.map((b) => ({
      artist: b.artist?.value || "",
      artistLabel: b.artistLabel?.value || "",
      birthDate: parseWikidataDate(b.birthDate?.value || ""),
      deathDate: parseWikidataDate(b.deathDate?.value || ""),
      portrait: b.portrait?.value || "",
    }));

    const artworks: RawWikiArtwork[] = artworksResult.results.bindings.map((b) => ({
      artwork: b.artwork?.value || "",
      artworkLabel: b.artworkLabel?.value || "",
      year: parseWikidataDate(b.year?.value || ""),
      artworkImage: b.artworkImage?.value || "",
      description: b.description?.value || "",
      artistId: b.artist?.value || "",
    }));

    if (artists.length === 0) {
      return { ok: false, error: `No artists found for period ${periodId}` };
    }

    return { ok: true, data: { artists, artworks } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Wikidata error";
    return { ok: false, error: message };
  }
}