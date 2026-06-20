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
const TIMEOUT_MS = 30000;

// Max paintings to fetch per artist (gallery walls are curated, VRAM is capped).
const MAX_ARTWORKS_PER_ARTIST = 12;
// Max qualifying artists (stars) per constellation.
const MAX_ARTISTS_PER_PERIOD = 50;

// Wikimedia's User-Agent policy rejects requests with a generic/empty agent
// (Node's fetch sends none → 403). A descriptive agent is required.
// https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT =
  "ConstellationGallery/1.0 (https://github.com/suyash/constellation-gallery; art-history-visualization)";

function parseWikidataDate(raw: string): string {
  if (!raw) return "";
  const match = raw.match(/^\d{4}/);
  return match ? match[0] : raw.slice(0, 4);
}

function encodeQuery(query: string): string {
  return encodeURIComponent(query.replace(/\s+/g, " ").trim());
}

interface SparqlBinding {
  [key: string]: { value: string } | undefined;
}

interface SparqlResponse {
  results: { bindings: SparqlBinding[] };
}

async function executeSparql(query: string): Promise<SparqlResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = `${SPARQL_ENDPOINT}?format=json&query=${encodeQuery(query)}`;

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error("Wikidata rate limited (429)");
      throw new Error(`Wikidata query failed: ${response.status}`);
    }

    return (await response.json()) as SparqlResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Phase 1: qualifying artists for a period — those with at least `minArtworks`
 * paintings that have a free image on Commons — ordered by painting count, with
 * their portrait and birth/death dates. Caps at MAX_ARTISTS_PER_PERIOD.
 */
function buildQualifyingArtistsQuery(periodId: string, minArtworks: number): string {
  return `
    SELECT ?artist ?artistLabel (SAMPLE(?birth) AS ?birthDate)
           (SAMPLE(?death) AS ?deathDate) (SAMPLE(?portraitImg) AS ?portrait)
           (COUNT(DISTINCT ?artwork) AS ?cnt) WHERE {
      ?artist wdt:P31 wd:Q5;
              wdt:P106 wd:Q1028181;
              wdt:P135 wd:${periodId}.
      ?artwork wdt:P170 ?artist;
               wdt:P31 wd:Q3305213;
               wdt:P18 ?awImg.
      OPTIONAL { ?artist wdt:P569 ?birth. }
      OPTIONAL { ?artist wdt:P570 ?death. }
      OPTIONAL { ?artist wdt:P18 ?portraitImg. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    GROUP BY ?artist ?artistLabel
    HAVING(COUNT(DISTINCT ?artwork) >= ${minArtworks})
    ORDER BY DESC(?cnt)
    LIMIT ${MAX_ARTISTS_PER_PERIOD}
  `;
}

/**
 * Phase 2: up to MAX_ARTWORKS_PER_ARTIST paintings (with images) for one artist.
 * Prefers works that have a depicted year so galleries read chronologically.
 */
function buildArtistArtworksQuery(artistQid: string): string {
  return `
    SELECT ?artwork ?artworkLabel ?year ?artworkImage ?description WHERE {
      ?artwork wdt:P170 wd:${artistQid};
               wdt:P31 wd:Q3305213;
               wdt:P18 ?artworkImage.
      OPTIONAL { ?artwork wdt:P571 ?year. }
      OPTIONAL { ?artwork schema:description ?description. FILTER(LANG(?description) = "en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    ORDER BY DESC(BOUND(?year)) ?year
    LIMIT ${MAX_ARTWORKS_PER_ARTIST}
  `;
}

function qidFromUri(uri: string): string {
  return uri.split("/").pop() ?? uri;
}

/**
 * Fetches qualifying artists for a period and, for each, up to 12 of their
 * paintings — a two-phase query that guarantees a fair per-artist artwork cap
 * (a single bulk query truncates: prolific artists eat the whole LIMIT).
 *
 * @param periodId    Wikidata QID of the art movement (e.g. "Q4692").
 * @param minArtworks Minimum paintings-with-images an artist must have to qualify.
 */
export async function queryWikidata(
  periodId: string,
  minArtworks: number = 10
): Promise<DataResult<RawWikiData>> {
  try {
    const artistResp = await executeSparql(
      buildQualifyingArtistsQuery(periodId, minArtworks)
    );

    const artists: RawWikiArtist[] = artistResp.results.bindings.map((b) => ({
      artist: b.artist?.value || "",
      artistLabel: b.artistLabel?.value || "",
      birthDate: parseWikidataDate(b.birthDate?.value || ""),
      deathDate: parseWikidataDate(b.deathDate?.value || ""),
      portrait: b.portrait?.value || "",
    }));

    if (artists.length === 0) {
      return { ok: false, error: `No qualifying artists for period ${periodId}` };
    }

    const artworks: RawWikiArtwork[] = [];

    // Phase 2 runs sequentially to stay polite to the SPARQL endpoint.
    for (const artist of artists) {
      const qid = qidFromUri(artist.artist);
      try {
        const awResp = await executeSparql(buildArtistArtworksQuery(qid));
        for (const b of awResp.results.bindings) {
          artworks.push({
            artwork: b.artwork?.value || "",
            artworkLabel: b.artworkLabel?.value || "",
            year: parseWikidataDate(b.year?.value || ""),
            artworkImage: b.artworkImage?.value || "",
            description: b.description?.value || "",
            artistId: artist.artist,
          });
        }
      } catch {
        // Skip this artist's artworks on failure; they may be filtered out later
        // if they fall below the threshold, but the period still syncs.
        continue;
      }
    }

    return { ok: true, data: { artists, artworks } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Wikidata error";
    return { ok: false, error: message };
  }
}
