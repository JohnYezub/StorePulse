# StorePulse

StorePulse compares an app's rating and review count across regional **App Store** and **Google Play** storefronts.

Enter an app name, select a matching listing, and receive a country-by-country table of ratings and review counts. The service covers 74 markets, including Europe, North America, Australia, New Zealand, the Gulf, Russia, China, Japan, and South Korea. If a storefront does not return a rating or review count, the table shows `—`.

## Stack

- Next.js 14 + React + TypeScript
- Apple: public iTunes Search API
- Google Play: `google-play-scraper`
- Deployment: Vercel

## Run locally

Node.js 18.17 or newer is required.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Verify the production build:

```bash
npm run build
npm run start
```

## Deploy to Vercel

1. Push this project to GitHub, GitLab, or Bitbucket.
2. In Vercel, select **Add New → Project** and import the repository.
3. Vercel will detect the **Next.js** framework preset automatically.
4. Select **Deploy**. No environment variables are required for the current MVP.

You can also deploy through the CLI:

```bash
npx vercel
```

## Data model

- `/api/search` looks up apps in both storefronts at once.
- `/api/ratings` requests metrics for each supported country in parallel.
- `/api/details` returns the app profile: screenshots, developer, release and update dates, version, size, price, category, age rating, description and in-app purchases.
- Apple responses are cached for 15 minutes and search results for one hour.

The iTunes Search API does not expose in-app purchases, so for App Store apps the profile also reads the `serialized-server-data` block embedded in the public `apps.apple.com` product page (US storefront, cached for one hour). If that block is missing or changes shape, the rest of the profile still renders and the purchases row is simply omitted. Google Play purchases come from the scraper as an `offersIAP` flag and a price range rather than an itemised list.

Google Play does not provide a stable official public API for these metrics, so the project uses a public-storefront scraper. Availability and responses may be affected by Google Play restrictions. For a high-traffic production service, add a persistent cache (such as Vercel KV) and/or a dedicated store-data provider.
