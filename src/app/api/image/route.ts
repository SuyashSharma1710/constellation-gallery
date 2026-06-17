import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_SECOND = 50;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 1000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_SECOND) {
    return false;
  }

  entry.count++;
  return true;
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const widthParam = searchParams.get("w");
  const qualityParam = searchParams.get("q");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const width = widthParam ? parseInt(widthParam, 10) : 512;
  const quality = qualityParam ? parseInt(qualityParam, 10) : 80;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const imageResponse = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ConstillationGallery/1.0 (image proxy)",
      },
    });

    clearTimeout(timeoutId);

    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch source image" }, { status: 502 });
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const processed = await sharp(buffer)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(new Uint8Array(processed), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image processing failed" }, { status: 500 });
  }
}