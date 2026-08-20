"use client";

import { FormEvent, useState } from "react";

type App = { id: string; store: "apple" | "google"; name: string; developer: string; icon?: string };
type Row = { code: string; label: string; score: number | null; count: number | null };

const number = new Intl.NumberFormat("ru-RU");

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
    catch { setError("Не удалось выполнить поиск. Повторите попытку."); }
    finally { setLoading(false); }
  }
  async function choose(app: App) {
    setSelected(app); setRows([]); setLoading(true); setError("");
    try { const r = await fetch(`/api/ratings?id=${encodeURIComponent(app.id)}&store=${app.store}`); if (!r.ok) throw new Error(); setRows((await r.json()).rows); }
    catch { setError("Не удалось получить оценки. Повторите попытку."); }
    finally { setLoading(false); }
  }
  return <main>
    <nav><span className="logo">store<span>pulse</span></span><span className="nav-note">App Store · Google Play</span></nav>
    <section className="hero">
      <p className="eyebrow">Международная аналитика приложений</p>
      <h1>Оценки приложения<br/><em>по странам</em></h1>
      <p className="intro">Сравнивайте рейтинг и число отзывов в локальных витринах App Store и Google Play.</p>
      <form onSubmit={search}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Введите название приложения" aria-label="Название приложения"/><button disabled={loading}>{loading ? "Ищем…" : "Найти приложение"}</button></form>
    </section>
    <section className="content">
      {error && <p className="error">{error}</p>}
      {!selected && searched && <div className="search-results"><p className="section-label">Результаты поиска</p>{apps.length === 0 ? <p className="empty">Ничего не найдено. Попробуйте другое название.</p> : apps.map((app) => <button className="app-card" key={`${app.store}-${app.id}`} onClick={() => choose(app)}><img src={app.icon} alt=""/><span><b>{app.name}</b><small>{app.developer}</small></span><i>{app.store === "apple" ? "App Store" : "Google Play"}</i><strong>→</strong></button>)}</div>}
      {loading && selected && <div className="loading">Собираем данные из витрин…</div>}
      {selected && rows.length > 0 && <div className="report"><div className="report-head"><div>{selected.icon && <img src={selected.icon} alt=""/>}<span><p className="section-label">{selected.store === "apple" ? "App Store" : "Google Play"}</p><h2>{selected.name}</h2><small>{selected.developer}</small></span></div><button className="change" onClick={() => { setSelected(null); setRows([]); }}>Изменить</button></div><div className="summary"><span>{rows.filter((r) => r.score !== null).length} витрин с данными</span><span>Обновлено только что</span></div><div className="table"><div className="tr th"><span>Страна</span><span>Оценка</span><span>Отзывы</span></div>{rows.map((row) => <div className="tr" key={row.code}><span><b>{row.code}</b>{row.label}</span><span>{row.score === null ? "—" : <><i className="star">★</i> {row.score.toFixed(1)}</>}</span><span>{row.count === null ? "—" : number.format(row.count)}</span></div>)}</div><p className="footnote">«—» означает, что витрина не вернула данные об оценке.</p></div>}
      {!searched && !selected && <div className="hint"><span>01</span> Найдите приложение <span>02</span> Выберите витрину <span>03</span> Сравните страны</div>}
    </section>
  </main>;
}
