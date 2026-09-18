// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://appratingmap.com",
  output: "static",
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [react()],
  // google-play-scraper pulls in es5-ext, whose directories literally named "#"
  // break the Vercel adapter's URL-based dependency tracing (it reads "#" as a
  // URL fragment and emits a self-referential symlink). Bundling the scraper
  // into the server output keeps those files out of the trace entirely.
  vite: {
    // Bundle the scraper so its dependency tree never reaches the Vercel
    // adapter's file tracer, and swap memoizee for a local equivalent — see
    // src/lib/memoizee-lite.ts for why es5-ext must stay out of the trace.
    ssr: { noExternal: ["google-play-scraper"] },
    resolve: { alias: { memoizee: fileURLToPath(new URL("./src/lib/memoizee-lite.ts", import.meta.url)) } }
  }
});
