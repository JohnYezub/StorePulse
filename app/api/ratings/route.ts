import { NextRequest, NextResponse } from "next/server";
import gplay from "google-play-scraper";

export const runtime = "nodejs";

const markets = [
  { code: "RU", label: "Россия", apple: "ru", google: "ru", lang: "ru" },
  { code: "US", label: "США", apple: "us", google: "us", lang: "en" },
  { code: "GB", label: "Великобритания", apple: "gb", google: "gb", lang: "en" },
  { code: "DE", label: "Германия", apple: "de", google: "de", lang: "de" },
  { code: "FR", label: "Франция", apple: "fr", google: "fr", lang: "fr" },
  { code: "JP", label: "Япония", apple: "jp", google: "jp", lang: "ja" }
];

type Rating = { code: string; label: string; score: number | null; count: number | null };

async function appleRating(id: string, country: string) {
  const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${country}`, { next: { revalidate: 900 } });
  if (!r.ok) throw new Error("Apple lookup failed");
  const item = (await r.json()).results?.[0];
  return { score: item?.averageUserRating ?? null, count: item?.userRatingCount ?? null };
}

async function googleRating(id: string, country: string, lang: string) {
  const item = await gplay.app({ appId: id, country, lang });
  return { score: item.score ?? null, count: item.ratings ?? null };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const store = request.nextUrl.searchParams.get("store");
  if (!id || (store !== "apple" && store !== "google")) return NextResponse.json({ error: "Invalid app" }, { status: 400 });

  const settled = await Promise.allSettled(markets.map(async (market): Promise<Rating> => {
    const value = store === "apple" ? await appleRating(id, market.apple) : await googleRating(id, market.google, market.lang);
    return { code: market.code, label: market.label, ...value };
  }));
  const rows = settled.map((outcome, index) => outcome.status === "fulfilled"
    ? outcome.value
    : { code: markets[index].code, label: markets[index].label, score: null, count: null });
  return NextResponse.json({ rows, updatedAt: new Date().toISOString() });
}
