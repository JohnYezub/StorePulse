"use client";

import { FormEvent, useState } from "react";

type App = { id: string; store: "apple" | "google"; name: string; developer: string; icon?: string };
type Row = { code: string; label: string; score: number | null; count: number | null };

const number = new Intl.NumberFormat("en-US");

export default function Home() {
  const [query, setQuery] = useState("");
  const [apps, setApps] = useState<App[]>([]);
  const [selected, setSelected] = useState<App | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true); setSelected(null); setRows([]); setError("");
    try { const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`); setApps(await r.json()); setSearched(true); }
    catch { setError("Search could not be completed. Please try again."); }
    finally { setLoading(false); }
  }
  async function choose(app: App) {
    setSelected(app); setRows([]); setLoading(true); setError("");
    try { const r = await fetch(`/api/ratings?id=${encodeURIComponent(app.id)}&store=${app.store}`); if (!r.ok) throw new Error(); setRows((await r.json()).rows); }
    catch { setError("Ratings could not be loaded. Please try again."); }
    finally { setLoading(false); }
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
      {loading && selected && <div className="loading">Collecting storefront data…</div>}
      {selected && rows.length > 0 && <div className="report"><div className="report-head"><div>{selected.icon && <img src={selected.icon} alt=""/>}<span><p className="section-label">{selected.store === "apple" ? "App Store" : "Google Play"}</p><h2>{selected.name}</h2><small>{selected.developer}</small></span></div><button className="change" onClick={() => { setSelected(null); setRows([]); }}>Change app</button></div><div className="summary"><span>{rows.filter((r) => r.score !== null).length} storefronts with data</span><span>Updated just now</span></div><div className="table"><div className="tr th"><span>Country</span><span>Rating</span><span>Reviews</span></div>{rows.map((row) => <div className="tr" key={row.code}><span><b>{row.code}</b>{row.label}</span><span>{row.score === null ? "—" : <><i className="star">★</i> {row.score.toFixed(1)}</>}</span><span>{row.count === null ? "—" : number.format(row.count)}</span></div>)}</div><p className="footnote">“—” means the storefront did not return rating data.</p></div>}
      {!searched && !selected && <div className="hint"><span>01</span> Find an app <span>02</span> Select a storefront <span>03</span> Compare countries</div>}
    </section>
  </main>;
}
