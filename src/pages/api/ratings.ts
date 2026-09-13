import type { APIRoute } from "astro";
import gplay from "google-play-scraper";
import { markets } from "../../lib/markets";
import { json } from "../../lib/json";

export const prerender = false;

type Rating = { code: string; label: string; score: number | null; count: number | null };

async function appleRating(id: string, country: string) {
  const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=${country}`);
  if (!r.ok) throw new Error("Apple lookup failed");
  const item = (await r.json()).results?.[0];
  return { score: item?.averageUserRating ?? null, count: item?.userRatingCount ?? null };
}

async function googleRating(id: string, country: string, lang: string) {
  const item = await gplay.app({ appId: id, country, lang });
  return { score: item.score ?? null, count: item.ratings ?? null };
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get("id");
  const store = url.searchParams.get("store");
  if (!id || (store !== "apple" && store !== "google")) return json({ error: "Invalid app" }, { status: 400 });

  const settled = await Promise.allSettled(markets.map(async (market): Promise<Rating> => {
    const value = store === "apple" ? await appleRating(id, market.apple) : await googleRating(id, market.google, market.lang);
    return { code: market.code, label: market.label, ...value };
  }));
  const rows = settled.map((outcome, index) => outcome.status === "fulfilled"
    ? outcome.value
    : { code: markets[index].code, label: markets[index].label, score: null, count: null });
  return json({ rows, updatedAt: new Date().toISOString() }, { maxAge: 900 });
};
