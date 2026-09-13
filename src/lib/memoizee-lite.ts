type Options = { normalizer?: (args: unknown[]) => string; maxAge?: number; max?: number; primitive?: boolean };
type AnyFn = (...args: any[]) => any;

/**
 * Stand-in for `memoizee`, aliased in astro.config.mjs.
 *
 * google-play-scraper imports memoizee, which drags in es5-ext — a package that
 * ships directories literally named "#". The Vercel adapter joins traced file
 * paths with `new URL()`, reads that "#" as a URL fragment and writes a
 * self-referential symlink, so any build that traces es5-ext dies with ELOOP.
 * The scraper only uses memoizee inside its optional `memoized()` factory, so a
 * small in-process memoizer covers the real behaviour without the dependency.
 */
export default function memoize<T extends AnyFn>(fn: T, options: Options = {}): T {
  const { normalizer = (args: unknown[]) => JSON.stringify(args), maxAge = 0, max = 0 } = options;
  const cache = new Map<string, { value: ReturnType<T>; storedAt: number }>();

  const memoized = (...args: Parameters<T>) => {
    const key = normalizer(args);
    const hit = cache.get(key);
    if (hit && (maxAge <= 0 || Date.now() - hit.storedAt < maxAge)) return hit.value;

    const value = fn(...args) as ReturnType<T>;
    cache.set(key, { value, storedAt: Date.now() });
    // A failed lookup must not be served from cache for the rest of maxAge.
    if (value && typeof (value as any).then === "function") {
      (value as any).then(undefined, () => { if (cache.get(key)?.value === value) cache.delete(key); });
    }
    if (max > 0 && cache.size > max) {
      const oldest = cache.keys().next();
      if (!oldest.done) cache.delete(oldest.value);
    }
    return value;
  };
  memoized.clear = () => cache.clear();
  return memoized as unknown as T;
}
