type Options = { status?: number; maxAge?: number };

// Responses are cached on the Vercel edge instead of in the process, so that
// cold serverless invocations still serve repeat lookups without refetching.
export function json(data: unknown, { status = 200, maxAge = 0 }: Options = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": maxAge > 0 ? `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}` : "no-store"
    }
  });
}
