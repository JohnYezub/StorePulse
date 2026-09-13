# AppRatingMap

AppRatingMap compares an app's rating and review count across regional **App Store** and **Google Play** storefronts, and shows the app's profile alongside them.

Enter an app name, select a matching listing, and receive a country-by-country table of ratings and review counts, sortable by country, rating or review count. The service covers 74 markets, including Europe, North America, Australia, New Zealand, the Gulf, Russia, China, Japan, and South Korea. If a storefront does not return a rating or review count, the table shows `—` and those rows are always sorted last.

Production site: [appratingmap.com](https://appratingmap.com)

## Stack

- Astro 7 (static page + on-demand API routes) with a React island for the interactive report
- Apple: public iTunes Search API, plus the public App Store product page for in-app purchases
- Google Play: `google-play-scraper`
- Deployment: Vercel (`@astrojs/vercel`)

## Run locally

Node.js 18.17 or newer is required. Vercel Serverless Functions run Node 24, so a local Node 25 build prints a version warning and targets 24 instead.

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

Verify the production build:

```bash
npm run build
```

## Project layout

```
src/
  components/RatingExplorer.tsx   interactive island: search, app profile, sortable table
  layouts/Layout.astro            document shell, metadata, JSON-LD
  lib/markets.ts                  the 74 supported storefronts
  lib/json.ts                     JSON responses with edge-cache headers
  lib/memoizee-lite.ts            memoizee stand-in (see "Build notes")
  pages/index.astro               the page
  pages/api/                      search, ratings and details endpoints
  pages/sitemap.xml.ts            generated at build time
```

The page itself is prerendered; only `/api/*` runs on demand. The React island is server-rendered into that static HTML, so the headline and copy are in the markup before hydration.

## Data model

- `/api/search` looks up apps in both storefronts at once.
- `/api/ratings` requests metrics for each supported country in parallel.
- `/api/details` returns the app profile: screenshots, developer, release and update dates, version, size, price, category, age rating, description and in-app purchases.
- Responses carry `s-maxage` cache headers (1 hour for search and details, 15 minutes for ratings) so the Vercel edge serves repeat lookups without refetching.

The iTunes Search API does not expose in-app purchases, so for App Store apps the profile also reads the `serialized-server-data` block embedded in the public `apps.apple.com` product page (US storefront). If that block is missing or changes shape, the rest of the profile still renders and the purchases row is simply omitted. Google Play purchases come from the scraper as an `offersIAP` flag and a price range rather than an itemised list.

Google Play does not provide a stable official public API for these metrics, so the project uses a public-storefront scraper. Availability and responses may be affected by Google Play restrictions. For a high-traffic production service, add a persistent cache and/or a dedicated store-data provider.

## Build notes

`google-play-scraper` imports `memoizee`, which depends on `es5-ext` — a package shipping directories literally named `#`. The Vercel adapter joins traced dependency paths with `new URL()`, which reads `#` as a URL fragment, collapses the path to its parent directory and then writes a self-referential symlink, so the build fails with `ELOOP`. Two lines in `astro.config.mjs` keep that tree out of the trace: the scraper is bundled into the server output (`ssr.noExternal`), and `memoizee` is aliased to `src/lib/memoizee-lite.ts`, a small equivalent memoizer. The scraper only uses `memoizee` inside its optional `memoized()` factory, which this project does not call.

## Deploy to Vercel

1. Push this project to GitHub, GitLab, or Bitbucket.
2. In Vercel, select **Add New → Project** and import the repository.
3. Vercel detects the **Astro** framework preset automatically; the adapter emits the serverless output.
4. Select **Deploy**. No environment variables are required.
5. In **Settings → Domains**, add `appratingmap.com` and point the registrar's nameservers or DNS records at Vercel. Keep `www` redirecting to the apex so the canonical URL stays `https://appratingmap.com/`.

The canonical URL, sitemap and JSON-LD all come from `site` in `astro.config.mjs`; changing the domain means changing it there and in `public/robots.txt`.
