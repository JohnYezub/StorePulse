import { NextRequest, NextResponse } from "next/server";
import gplay from "google-play-scraper";

export const runtime = "nodejs";

const markets = [
  // Europe
  { code: "AL", label: "Albania", apple: "al", google: "al", lang: "en" },
  { code: "AD", label: "Andorra", apple: "ad", google: "ad", lang: "en" },
  { code: "AT", label: "Austria", apple: "at", google: "at", lang: "de" },
  { code: "BY", label: "Belarus", apple: "by", google: "by", lang: "en" },
  { code: "BE", label: "Belgium", apple: "be", google: "be", lang: "en" },
  { code: "BA", label: "Bosnia and Herzegovina", apple: "ba", google: "ba", lang: "en" },
  { code: "BG", label: "Bulgaria", apple: "bg", google: "bg", lang: "en" },
  { code: "HR", label: "Croatia", apple: "hr", google: "hr", lang: "en" },
  { code: "CY", label: "Cyprus", apple: "cy", google: "cy", lang: "en" },
  { code: "CZ", label: "Czechia", apple: "cz", google: "cz", lang: "en" },
  { code: "DK", label: "Denmark", apple: "dk", google: "dk", lang: "en" },
  { code: "EE", label: "Estonia", apple: "ee", google: "ee", lang: "en" },
  { code: "FI", label: "Finland", apple: "fi", google: "fi", lang: "en" },
  { code: "FR", label: "France", apple: "fr", google: "fr", lang: "fr" },
  { code: "DE", label: "Germany", apple: "de", google: "de", lang: "de" },
  { code: "GR", label: "Greece", apple: "gr", google: "gr", lang: "en" },
  { code: "HU", label: "Hungary", apple: "hu", google: "hu", lang: "en" },
  { code: "IS", label: "Iceland", apple: "is", google: "is", lang: "en" },
  { code: "IE", label: "Ireland", apple: "ie", google: "ie", lang: "en" },
  { code: "IT", label: "Italy", apple: "it", google: "it", lang: "it" },
  { code: "LV", label: "Latvia", apple: "lv", google: "lv", lang: "en" },
  { code: "LI", label: "Liechtenstein", apple: "li", google: "li", lang: "en" },
  { code: "LT", label: "Lithuania", apple: "lt", google: "lt", lang: "en" },
  { code: "LU", label: "Luxembourg", apple: "lu", google: "lu", lang: "en" },
  { code: "MT", label: "Malta", apple: "mt", google: "mt", lang: "en" },
  { code: "MD", label: "Moldova", apple: "md", google: "md", lang: "en" },
  { code: "MC", label: "Monaco", apple: "mc", google: "mc", lang: "en" },
  { code: "ME", label: "Montenegro", apple: "me", google: "me", lang: "en" },
  { code: "NL", label: "Netherlands", apple: "nl", google: "nl", lang: "en" },
  { code: "MK", label: "North Macedonia", apple: "mk", google: "mk", lang: "en" },
  { code: "NO", label: "Norway", apple: "no", google: "no", lang: "en" },
  { code: "PL", label: "Poland", apple: "pl", google: "pl", lang: "en" },
  { code: "PT", label: "Portugal", apple: "pt", google: "pt", lang: "en" },
  { code: "RO", label: "Romania", apple: "ro", google: "ro", lang: "en" },
  { code: "SM", label: "San Marino", apple: "sm", google: "sm", lang: "en" },
  { code: "RS", label: "Serbia", apple: "rs", google: "rs", lang: "en" },
  { code: "SK", label: "Slovakia", apple: "sk", google: "sk", lang: "en" },
  { code: "SI", label: "Slovenia", apple: "si", google: "si", lang: "en" },
  { code: "ES", label: "Spain", apple: "es", google: "es", lang: "es" },
  { code: "SE", label: "Sweden", apple: "se", google: "se", lang: "en" },
  { code: "CH", label: "Switzerland", apple: "ch", google: "ch", lang: "en" },
  { code: "TR", label: "Türkiye", apple: "tr", google: "tr", lang: "en" },
  { code: "UA", label: "Ukraine", apple: "ua", google: "ua", lang: "en" },
  { code: "GB", label: "United Kingdom", apple: "gb", google: "gb", lang: "en" },
  { code: "VA", label: "Vatican City", apple: "va", google: "va", lang: "en" },
  // North America, Oceania, the Gulf and key global markets
  { code: "CA", label: "Canada", apple: "ca", google: "ca", lang: "en" },
  { code: "MX", label: "Mexico", apple: "mx", google: "mx", lang: "es" },
  { code: "US", label: "United States", apple: "us", google: "us", lang: "en" },
  { code: "AU", label: "Australia", apple: "au", google: "au", lang: "en" },
  { code: "NZ", label: "New Zealand", apple: "nz", google: "nz", lang: "en" },
  { code: "BH", label: "Bahrain", apple: "bh", google: "bh", lang: "en" },
  { code: "KW", label: "Kuwait", apple: "kw", google: "kw", lang: "en" },
  { code: "OM", label: "Oman", apple: "om", google: "om", lang: "en" },
  { code: "QA", label: "Qatar", apple: "qa", google: "qa", lang: "en" },
  { code: "SA", label: "Saudi Arabia", apple: "sa", google: "sa", lang: "en" },
  { code: "AE", label: "United Arab Emirates", apple: "ae", google: "ae", lang: "en" },
  { code: "RU", label: "Russia", apple: "ru", google: "ru", lang: "ru" },
  { code: "CN", label: "China", apple: "cn", google: "cn", lang: "zh" },
  { code: "JP", label: "Japan", apple: "jp", google: "jp", lang: "ja" },
  { code: "KR", label: "South Korea", apple: "kr", google: "kr", lang: "ko" },
  { code: "HK", label: "Hong Kong", apple: "hk", google: "hk", lang: "en" },
  { code: "TW", label: "Taiwan", apple: "tw", google: "tw", lang: "zh" },
  { code: "SG", label: "Singapore", apple: "sg", google: "sg", lang: "en" },
  { code: "IN", label: "India", apple: "in", google: "in", lang: "en" },
  { code: "ID", label: "Indonesia", apple: "id", google: "id", lang: "en" },
  { code: "MY", label: "Malaysia", apple: "my", google: "my", lang: "en" },
  { code: "TH", label: "Thailand", apple: "th", google: "th", lang: "en" },
  { code: "PH", label: "Philippines", apple: "ph", google: "ph", lang: "en" },
  { code: "VN", label: "Vietnam", apple: "vn", google: "vn", lang: "en" },
  { code: "BR", label: "Brazil", apple: "br", google: "br", lang: "pt" },
  { code: "AR", label: "Argentina", apple: "ar", google: "ar", lang: "es" },
  { code: "CL", label: "Chile", apple: "cl", google: "cl", lang: "es" },
  { code: "CO", label: "Colombia", apple: "co", google: "co", lang: "es" },
  { code: "ZA", label: "South Africa", apple: "za", google: "za", lang: "en" }
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
