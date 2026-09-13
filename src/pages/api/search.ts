import type { APIRoute } from "astro";
import gplay from "google-play-scraper";
import { json } from "../../lib/json";

export const prerender = false;

type Result = { id: string; store: "apple" | "google"; name: string; developer: string; icon?: string };

export const GET: APIRoute = async ({ url }) => {
  const term = url.searchParams.get("q")?.trim();
  if (!term || term.length < 2) return json([]);

  const [apple, google] = await Promise.allSettled([
    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=8`).then((r) => r.json()),
    gplay.search({ term, num: 8, country: "us", lang: "en" })
  ]);

  const results: Result[] = [];
  if (apple.status === "fulfilled") {
    for (const item of apple.value.results ?? []) results.push({ id: String(item.trackId), store: "apple", name: item.trackName, developer: item.sellerName, icon: item.artworkUrl100 });
  }
  if (google.status === "fulfilled") {
    for (const item of google.value) results.push({ id: item.appId, store: "google", name: item.title, developer: item.developer, icon: item.icon });
  }
  return json(results, { maxAge: 3600 });
};
