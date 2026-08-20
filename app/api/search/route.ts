import { NextRequest, NextResponse } from "next/server";
import gplay from "google-play-scraper";

export const runtime = "nodejs";

type Result = { id: string; store: "apple" | "google"; name: string; developer: string; icon?: string };

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q")?.trim();
  if (!term || term.length < 2) return NextResponse.json([]);

  const [apple, google] = await Promise.allSettled([
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=8`, { next: { revalidate: 3600 } })
      .then((r) => r.json()),
    gplay.search({ term, num: 8, country: "us", lang: "en" })
  ]);

  const results: Result[] = [];
  if (apple.status === "fulfilled") {
    for (const item of apple.value.results ?? []) results.push({ id: String(item.trackId), store: "apple", name: item.trackName, developer: item.sellerName, icon: item.artworkUrl100 });
  }
  if (google.status === "fulfilled") {
    for (const item of google.value) results.push({ id: item.appId, store: "google", name: item.title, developer: item.developer, icon: item.icon });
  }
  return NextResponse.json(results);
}
