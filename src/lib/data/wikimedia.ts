import type { DataResult } from "./types";

export interface RawCommonsImage {
  filename: string;
  url: string;
  width: number;
  height: number;
  description: string;
}

interface CommonsApiResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          url: string;
          width: number;
          height: number;
          extmetadata?: {
            ImageDescription?: { value: string };
          };
        }>;
      }
    >;
  };
}

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const TIMEOUT_MS = 10000;

function extractFilename(urlOrFilename: string): string {
  if (urlOrFilename.includes("File:")) {
    const match = urlOrFilename.match(/File:([^?#]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return urlOrFilename.replace(/^File:/, "");
}

export async function fetchWikimediaImages(filenames: string[]): Promise<DataResult<RawCommonsImage[]>> {
  const uniqueFilenames = [...new Set(filenames.filter(Boolean))];

  if (uniqueFilenames.length === 0) {
    return { ok: true, data: [] };
  }

  const results: RawCommonsImage[] = [];

  const batchSize = 20;
  for (let i = 0; i < uniqueFilenames.length; i += batchSize) {
    const batch = uniqueFilenames.slice(i, i + batchSize);
    const titles = batch.map((f) => `File:${extractFilename(f)}`).join("|");

    const url = `${COMMONS_API}?action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const json: CommonsApiResponse = await response.json();
      const pages = json.query?.pages;

      if (!pages) continue;

      for (const page of Object.values(pages)) {
        const info = page.imageinfo?.[0];
        if (!info?.url) continue;

        results.push({
          filename: extractFilename(page.title || batch[0]),
          url: info.url,
          width: info.width || 0,
          height: info.height || 0,
          description: info.extmetadata?.ImageDescription?.value || "",
        });
      }
    } catch {
      continue;
    }
  }

  return { ok: true, data: results };
}