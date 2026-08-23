import { NextRequest, NextResponse } from "next/server";
import gplay from "google-play-scraper";

export const runtime = "nodejs";

type Purchase = { name: string; price: string };
type Details = {
  store: "apple" | "google";
  name: string;
  developer: string | null;
  developerUrl: string | null;
  developerSite: string | null;
  icon: string | null;
  storeUrl: string | null;
  screenshots: string[];
  released: string | null;
  updated: string | null;
  version: string | null;
  price: string | null;
  size: string | null;
  genres: string[];
  contentRating: string | null;
  description: string | null;
  iap: { offers: boolean | null; range: string | null; items: Purchase[] };
};

const browser = {
  "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  "accept-language": "en-US,en;q=0.9"
};

function megabytes(bytes: unknown) {
  const value = Number(bytes);
  return Number.isFinite(value) && value > 0 ? `${Math.round(value / 1048576)} MB` : null;
}

// The App Store product page embeds an "In-App Purchases" annotation; the iTunes
// lookup API does not expose purchases at all, so the page is the only source.
function collectPurchases(node: unknown, found: { summary: string | null; items: Purchase[] }[] = []) {
  if (!node || typeof node !== "object") return found;
  if (Array.isArray(node)) { for (const item of node) collectPurchases(item, found); return found; }
  const record = node as Record<string, any>;
  if (typeof record.title === "string" && /in-app purchase/i.test(record.title)) {
    const pairs: [unknown, unknown][] = Array.isArray(record.items_V3)
      ? record.items_V3.map((item: any) => [item?.leadingText, item?.trailingText])
      : (Array.isArray(record.items) ? record.items : []).flatMap((item: any) => item?.textPairs ?? []);
    const items = pairs
      .filter(([name]) => typeof name === "string" && name.length > 0)
      .map(([name, price]) => ({ name: String(name), price: typeof price === "string" ? price : "" }));
    found.push({ summary: typeof record.summary === "string" ? record.summary : null, items });
  }
  for (const key of Object.keys(record)) collectPurchases(record[key], found);
  return found;
}

async function applePurchases(id: string) {
  try {
    const r = await fetch(`https://apps.apple.com/us/app/id${encodeURIComponent(id)}`, { headers: browser, next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const page = await r.text();
    const embedded = page.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/);
    if (!embedded) return null;
    const block = collectPurchases(JSON.parse(embedded[1]))[0];
    if (!block) return { offers: false, range: null, items: [] };
    const seen = new Set<string>();
    const items = block.items.filter((item) => {
      const key = `${item.name}|${item.price}`;
      return seen.has(key) ? false : (seen.add(key), true);
    });
    return { offers: items.length > 0 || /yes/i.test(block.summary ?? ""), range: null, items };
  } catch { return null; }
}

async function appleDetails(id: string): Promise<Details | null> {
  const r = await fetch(`https://itunes.apple.com/lookup?id=${encodeURIComponent(id)}&country=us`, { next: { revalidate: 900 } });
  if (!r.ok) return null;
  const item = (await r.json()).results?.[0];
  if (!item) return null;
  const purchases = await applePurchases(id);
  return {
    store: "apple",
    name: item.trackName,
    developer: item.artistName ?? item.sellerName ?? null,
    developerUrl: item.artistViewUrl ?? null,
    developerSite: item.sellerUrl ?? null,
    icon: item.artworkUrl512 ?? item.artworkUrl100 ?? null,
    storeUrl: item.trackViewUrl ?? null,
    screenshots: (item.screenshotUrls ?? item.ipadScreenshotUrls ?? []).slice(0, 8),
    released: item.releaseDate ?? null,
    updated: item.currentVersionReleaseDate ?? null,
    version: item.version ?? null,
    price: item.formattedPrice ?? null,
    size: megabytes(item.fileSizeBytes),
    genres: item.genres ?? [],
    contentRating: item.contentAdvisoryRating ?? item.trackContentRating ?? null,
    description: item.description ?? null,
    iap: purchases ?? { offers: null, range: null, items: [] }
  };
}

async function googleDetails(id: string): Promise<Details | null> {
  const item = await gplay.app({ appId: id, country: "us", lang: "en" });
  return {
    store: "google",
    name: item.title,
    developer: item.developer ?? null,
    developerUrl: item.developerId ? `https://play.google.com/store/apps/dev?id=${encodeURIComponent(item.developerId)}` : null,
    developerSite: item.developerWebsite ?? null,
    icon: item.icon ?? null,
    storeUrl: item.url ?? null,
    screenshots: (item.screenshots ?? []).slice(0, 8),
    released: item.released ?? null,
    updated: item.updated ? new Date(item.updated).toISOString() : null,
    version: item.version ?? null,
    price: item.priceText ?? null,
    size: typeof item.size === "string" ? item.size : null,
    genres: (item.categories ?? []).map((category: any) => category?.name).filter(Boolean),
    contentRating: item.contentRating ?? null,
    description: item.description ?? null,
    iap: { offers: item.offersIAP ?? null, range: item.IAPRange ?? null, items: [] }
  };
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const store = request.nextUrl.searchParams.get("store");
  if (!id || (store !== "apple" && store !== "google")) return NextResponse.json({ error: "Invalid app" }, { status: 400 });
  try {
    const details = store === "apple" ? await appleDetails(id) : await googleDetails(id);
    if (!details) return NextResponse.json({ error: "App not found" }, { status: 404 });
    return NextResponse.json(details);
  } catch {
    return NextResponse.json({ error: "Details could not be loaded" }, { status: 502 });
  }
}
