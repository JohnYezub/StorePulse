"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type App = { id: string; store: "apple" | "google"; name: string; developer: string; icon?: string };
type Row = { code: string; label: string; score: number | null; count: number | null };
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
type SortKey = "label" | "score" | "count";
type Sort = { key: SortKey; dir: 1 | -1 };

const number = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" });
const defaultDir: Record<SortKey, 1 | -1> = { label: 1, score: -1, count: -1 };

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : date.format(parsed);
}
function hostname(url: string | null) {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}
function purchaseSummary(iap: Details["iap"]) {
  if (iap.offers === null) return null;
  if (!iap.offers) return "No";
  if (iap.range) return `Yes · ${iap.range}`;
  return iap.items.length > 0 ? `Yes · ${iap.items.length} items` : "Yes";
}
function sortRows(rows: Row[], sort: Sort) {
  return [...rows].sort((a, b) => {
    if (sort.key === "label") return a.label.localeCompare(b.label) * sort.dir;
    const x = a[sort.key];
    const y = b[sort.key];
    if (x === null || y === null) return x === y ? a.label.localeCompare(b.label) : x === null ? 1 : -1;
    return x === y ? a.label.localeCompare(b.label) : (x - y) * sort.dir;
  });
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [apps, setApps] = useState<App[]>([]);
  const [selected, setSelected] = useState<App | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [details, setDetails] = useState<Details | null>(null);
  const [sort, setSort] = useState<Sort>({ key: "label", dir: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const current = useRef("");

  const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);

  function toggleSort(key: SortKey) {
    setSort((state) => state.key === key ? { key, dir: state.dir === 1 ? -1 : 1 } : { key, dir: defaultDir[key] });
  }
  function reset() { setSelected(null); setRows([]); setDetails(null); current.current = ""; }
  async function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true); reset(); setError("");
    try { const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`); setApps(await r.json()); setSearched(true); }
    catch { setError("Search could not be completed. Please try again."); }
    finally { setLoading(false); }
  }
  async function loadDetails(app: App, token: string) {
    try {
      const r = await fetch(`/api/details?id=${encodeURIComponent(app.id)}&store=${app.store}`);
      if (!r.ok) return;
      const data: Details = await r.json();
      if (current.current === token) setDetails(data);
    } catch { /* the ratings table stays usable without the app profile */ }
  }
  async function choose(app: App) {
    const token = `${app.store}-${app.id}`;
    current.current = token;
    setSelected(app); setRows([]); setDetails(null); setSort({ key: "label", dir: 1 }); setLoading(true); setError("");
    void loadDetails(app, token);
    try { const r = await fetch(`/api/ratings?id=${encodeURIComponent(app.id)}&store=${app.store}`); if (!r.ok) throw new Error(); setRows((await r.json()).rows); }
    catch { setError("Ratings could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }
  function header(key: SortKey, title: string) {
    const active = sort.key === key;
    return <button type="button" className={active ? "sort active" : "sort"} onClick={() => toggleSort(key)} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>{title}<i>{active ? (sort.dir === 1 ? "↑" : "↓") : "↕"}</i></button>;
  }
  function fact(title: string, value: string | null, href?: string | null) {
    if (!value) return null;
    return <div className="fact" key={title}><p className="section-label">{title}</p>{href ? <a href={href} target="_blank" rel="noreferrer">{value}</a> : <b>{value}</b>}</div>;
  }
  return <main>
    <nav><span className="logo">store<span>pulse</span></span><span className="nav-note">App Store · Google Play</span></nav>
    <section className="hero">
      <p className="eyebrow">Global app intelligence</p>
      <h1>App ratings<br/><em>by country</em></h1>
      <p className="intro">Compare ratings and review counts across local App Store and Google Play storefronts.</p>
      <form onSubmit={search}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter an app name" aria-label="App name"/><button disabled={loading}>{loading ? "Searching…" : "Find app"}</button></form>
    </section>
    <section className="content">
      {error && <p className="error">{error}</p>}
      {!selected && searched && <div className="search-results"><p className="section-label">Search results</p>{apps.length === 0 ? <p className="empty">No apps found. Try a different search.</p> : apps.map((app) => <button className="app-card" key={`${app.store}-${app.id}`} onClick={() => choose(app)}><img src={app.icon} alt=""/><span><b>{app.name}</b><small>{app.developer}</small></span><i>{app.store === "apple" ? "App Store" : "Google Play"}</i><strong>→</strong></button>)}</div>}
      {selected && <div className="report">
        <div className="report-head"><div>{(details?.icon || selected.icon) && <img src={details?.icon || selected.icon} alt=""/>}<span><p className="section-label">{selected.store === "apple" ? "App Store" : "Google Play"}</p><h2>{selected.name}</h2><small>{details?.developer ?? selected.developer}</small></span></div><button className="change" onClick={reset}>Change app</button></div>
        {details && <div className="about">
          {details.screenshots.length > 0 && <div className="shots">{details.screenshots.map((shot) => <img src={shot} alt={`${details.name} screenshot`} key={shot} loading="lazy"/>)}</div>}
          <div className="facts">
            {fact("Developer", details.developer, details.developerUrl)}
            {fact("Developer site", hostname(details.developerSite), details.developerSite)}
            {fact("Released", formatDate(details.released))}
            {fact("Updated", formatDate(details.updated))}
            {fact("Version", details.version)}
            {fact("Size", details.size)}
            {fact("Price", details.price)}
            {fact("In-app purchases", purchaseSummary(details.iap))}
            {fact("Category", details.genres.join(", ") || null)}
            {fact("Age rating", details.contentRating)}
            {fact("Store page", details.storeUrl ? "Open listing" : null, details.storeUrl)}
          </div>
          {details.iap.items.length > 0 && <details className="drop"><summary>In-app purchases ({details.iap.items.length})</summary><ul className="iap">{details.iap.items.map((item) => <li key={`${item.name}-${item.price}`}><span>{item.name}</span><b>{item.price}</b></li>)}</ul></details>}
          {details.description && <details className="drop"><summary>Description</summary><p className="description">{details.description}</p></details>}
        </div>}
        {loading && <div className="loading">Collecting storefront data…</div>}
        {rows.length > 0 && <>
          <div className="summary"><span>{rows.filter((r) => r.score !== null).length} storefronts with data</span><span>Updated just now</span></div>
          <div className="table"><div className="tr th">{header("label", "Country")}{header("score", "Rating")}{header("count", "Reviews")}</div>{sorted.map((row) => <div className="tr" key={row.code}><span><b>{row.code}</b>{row.label}</span><span>{row.score === null ? "—" : <><i className="star">★</i> {row.score.toFixed(1)}</>}</span><span>{row.count === null ? "—" : number.format(row.count)}</span></div>)}</div>
          <p className="footnote">“—” means the storefront did not return rating data.</p>
        </>}
      </div>}
      {!searched && !selected && <div className="hint"><span>01</span> Find an app <span>02</span> Select a storefront <span>03</span> Compare countries</div>}
    </section>
  </main>;
}
