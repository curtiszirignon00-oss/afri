import React, { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus, ChevronRight,
  BarChart2, Landmark, Leaf, Fuel, Radio, Filter,
  Clock, ArrowUpRight, ArrowDownRight, X,
} from "lucide-react";
import { NEWS_DATA, StockNews, Sector, SECTORS } from "../data/newsData";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtM(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + " Bn";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + " Md";
  return v.toLocaleString("fr-FR") + " M";
}

function fmtPct(v: number, withSign = true): string {
  const s = withSign && v > 0 ? "+" : "";
  return s + v.toFixed(1) + "%";
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const SECTOR_ICONS: Record<Sector, React.ReactNode> = {
  Banque: <Landmark size={13} />,
  "Agro-industrie": <Leaf size={13} />,
  "Distribution pétrolière": <Fuel size={13} />,
  Télécommunications: <Radio size={13} />,
};

const COUNTRY_FLAG: Record<string, string> = {
  CI: "🇨🇮", BF: "🇧🇫", SN: "🇸🇳",
};

type SortKey = "date" | "ticker" | "dy" | "income";

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 80; const H = 28; const pad = 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });
  const area = `${pts[0]} ${pts.join(" ")} ${W - pad},${H - pad} ${pad},${H - pad}`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polygon points={area} fill={color} fillOpacity={0.12} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => i === pts.length - 1 ? (
        <circle key={i} cx={+p.split(",")[0]} cy={+p.split(",")[1]} r={2.5} fill={color} />
      ) : null)}
    </svg>
  );
}

// ── TrendBadge ────────────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: "hausse" | "baisse" | "stable" }) {
  if (trend === "hausse")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
        <TrendingUp size={10} /> Hausse
      </span>
    );
  if (trend === "baisse")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
        <TrendingDown size={10} /> Baisse
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
      <Minus size={10} /> Stable
    </span>
  );
}

// ── DividendBar ───────────────────────────────────────────────────────────────

function DividendBar({ history }: { history: StockNews["history"] }) {
  const maxDiv = Math.max(...history.map(h => h.dividend));
  return (
    <div className="flex items-end gap-1.5 h-10">
      {history.map((h, i) => {
        const isLast = i === history.length - 1;
        const pct = Math.round((h.dividend / maxDiv) * 100);
        return (
          <div key={h.year} className="flex flex-col items-center gap-0.5 flex-1">
            <div
              className="w-full rounded-sm"
              style={{ height: `${Math.max(pct * 0.36, 4)}px`, background: isLast ? "#00D4A8" : "#CBD5E1" }}
            />
            <span className="text-[9px] text-slate-400">{String(h.year).slice(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── NewsCard ──────────────────────────────────────────────────────────────────

function NewsCard({ news, onOpen }: { news: StockNews; onOpen: (n: StockNews) => void }) {
  const last = news.history[news.history.length - 1];
  const prev = news.history[news.history.length - 2];
  const incomeVar = ((last.netIncome - prev.netIncome) / Math.abs(prev.netIncome)) * 100;
  const divVar    = ((last.dividend - prev.dividend)   / Math.abs(prev.dividend))   * 100;

  return (
    <article
      className="group bg-white border border-slate-200 rounded-xl hover:border-[#00D4A8] hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => onOpen(news)}
    >
      <div className="h-0.5 bg-slate-100 group-hover:bg-[#00D4A8] transition-colors" />
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {news.ticker}
            </span>
            <span className="text-base" title={news.country}>{COUNTRY_FLAG[news.country]}</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
              {SECTOR_ICONS[news.sector]}{news.sector}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Clock size={11} />{relativeTime(news.publishedAt)}
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-2 group-hover:text-[#00D4A8] transition-colors line-clamp-2">
          {news.headline}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{news.summary}</p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {
              label: `${news.revenueLabel} 2025`,
              value: `${fmtM(last.revenue)} XOF`,
              varPct: ((last.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100,
              up: news.revenueTrend === "hausse",
            },
            { label: "Résultat net", value: `${fmtM(last.netIncome)} XOF`, varPct: incomeVar, up: incomeVar >= 0 },
            { label: "Dividende",    value: `${last.dividend.toLocaleString("fr-FR")} XOF`, varPct: divVar, up: divVar >= 0, accent: true },
          ].map(m => (
            <div key={m.label} className="bg-slate-50 rounded-lg p-2.5">
              <p className="text-[10px] text-slate-400 mb-0.5">{m.label}</p>
              <p className={`text-xs font-semibold ${m.accent ? "text-[#00D4A8]" : "text-slate-700"}`}>{m.value}</p>
              <div className="flex items-center gap-0.5 mt-0.5">
                {m.up ? <ArrowUpRight size={10} className="text-emerald-500" /> : <ArrowDownRight size={10} className="text-red-400" />}
                <span className={`text-[10px] font-medium ${m.up ? "text-emerald-600" : "text-red-500"}`}>{fmtPct(m.varPct)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dividend bar + ratios */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Dividende 5 ans</p>
            <DividendBar history={news.history} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">DY</span>
              <span className="text-xs font-bold text-[#00D4A8]">{fmtPct(news.dyAnnual, false)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">PER</span>
              <span className="text-xs font-semibold text-slate-600">{news.per.toFixed(1)}x</span>
            </div>
            <TrendBadge trend={news.dividendTrend} />
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {news.tags.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">#{t}</span>
          ))}
        </div>
      </div>

      <div className="px-5 pb-4 flex justify-end">
        <span className="text-[11px] text-[#00D4A8] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Lire l'analyse <ChevronRight size={12} />
        </span>
      </div>
    </article>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────────

function DetailPanel({ news, onClose }: { news: StockNews; onClose: () => void }) {
  const divValues = news.history.map(h => h.dividend);
  const rnValues  = news.history.map(h => h.netIncome);
  const last = news.history[news.history.length - 1];
  const prev = news.history[news.history.length - 2];
  const incomeVar = ((last.netIncome - prev.netIncome) / Math.abs(prev.netIncome)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col" style={{ animation: "slideIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Header — couleurs plateforme (blanc/slate, pas de fond sombre) */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-lg font-bold text-slate-900">{news.ticker}</span>
                <span className="text-xl">{COUNTRY_FLAG[news.country]}</span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
                  {SECTOR_ICONS[news.sector]}{news.sector}
                </span>
              </div>
              <p className="text-sm text-slate-600">{news.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{relativeTime(news.publishedAt)}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 mt-1 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Headline + résumé */}
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug mb-3">{news.headline}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{news.summary}</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "DY annuel",  value: fmtPct(news.dyAnnual, false), accent: true },
              { label: "PER",        value: `${news.per.toFixed(1)}x`,     accent: false },
              { label: "P/B",        value: `${news.pb.toFixed(2)}x`,      accent: false },
              { label: "BNPA",       value: `${news.bnpa.toLocaleString("fr-FR")} XOF`, accent: false },
              { label: "Var. BNPA",  value: fmtPct(news.bnpaVar),           accent: news.bnpaVar > 0 },
              { label: "Payout",     value: fmtPct(news.payout, false),     accent: false },
            ].map(k => (
              <div key={k.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">{k.label}</p>
                <p className={`text-sm font-bold ${k.accent ? "text-[#00D4A8]" : "text-slate-900"}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Tableau 5 ans */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Évolution sur 5 ans (M XOF)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left px-3 py-2 font-medium">Indicateur</th>
                    {news.history.map(h => (
                      <th key={h.year} className={`px-3 py-2 font-medium text-right ${h.year === 2025 ? "text-[#00D4A8]" : ""}`}>{h.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: news.revenueLabel, key: "revenue" as const },
                    { label: "Résultat net",    key: "netIncome" as const },
                    { label: "Dividende (XOF)", key: "dividend" as const },
                    { label: "DY (%)",          key: "dy" as const },
                  ].map((row, ri) => (
                    <tr key={row.label} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 font-medium text-slate-600">{row.label}</td>
                      {news.history.map((h, hi) => {
                        const val = h[row.key];
                        const prevVal = hi > 0 ? news.history[hi - 1][row.key] : null;
                        const isLast = h.year === 2025;
                        const isUp   = prevVal !== null && (val as number) > (prevVal as number);
                        const isDown = prevVal !== null && (val as number) < (prevVal as number);
                        return (
                          <td key={h.year} className={`px-3 py-2 text-right font-mono ${isLast ? "font-bold text-[#00D4A8]" : "text-slate-700"}`}>
                            <span className="flex items-center justify-end gap-1">
                              {isLast && isUp   && <ArrowUpRight   size={10} className="text-emerald-500" />}
                              {isLast && isDown && <ArrowDownRight size={10} className="text-red-400" />}
                              {row.key === "dy"
                                ? `${(val as number).toFixed(1)}%`
                                : row.key === "dividend"
                                ? (val as number).toLocaleString("fr-FR")
                                : fmtM(val as number)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sparklines */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Résultat net — tendance</p>
              <Sparkline values={rnValues} color={incomeVar >= 0 ? "#10b981" : "#ef4444"} />
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Dividende — tendance</p>
              <Sparkline values={divValues} color="#00D4A8" />
            </div>
          </div>

          {/* Points clés */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Points clés</h3>
            <ul className="space-y-2">
              {news.keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4A8] shrink-0" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          {/* Note analytique */}
          <div className="border-l-2 border-[#00D4A8] pl-4 py-1">
            <p className="text-[10px] font-semibold text-[#00D4A8] uppercase tracking-wide mb-2">Note analytique</p>
            <p className="text-sm text-slate-600 leading-relaxed italic">{news.analyst_note}</p>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {news.tags.map(t => (
              <span key={t} className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded px-2 py-0.5">#{t}</span>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 italic text-center border-t border-slate-100 pt-4">
            Ces informations sont fournies à titre éducatif uniquement et ne constituent pas un conseil en investissement.
            Données issues des publications officielles BRVM.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

// ── FundamentalsGrid (export principal) ───────────────────────────────────────

export default function FundamentalsGrid() {
  const [search, setSearch]           = useState("");
  const [sectorFilter, setSectorFilter] = useState<Sector | "Tous">("Tous");
  const [trendFilter, setTrendFilter]   = useState<"Tous" | "hausse" | "baisse">("Tous");
  const [sortKey, setSortKey]           = useState<SortKey>("date");
  const [selected, setSelected]         = useState<StockNews | null>(null);

  const filtered = useMemo(() => {
    let data = [...NEWS_DATA];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(n =>
        n.ticker.toLowerCase().includes(q) ||
        n.name.toLowerCase().includes(q) ||
        n.headline.toLowerCase().includes(q) ||
        n.tags.some(t => t.includes(q))
      );
    }
    if (sectorFilter !== "Tous") data = data.filter(n => n.sector === sectorFilter);
    if (trendFilter  !== "Tous") data = data.filter(n => n.dividendTrend === trendFilter || n.incomeTrend === trendFilter);
    data.sort((a, b) => {
      if (sortKey === "date")   return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      if (sortKey === "ticker") return a.ticker.localeCompare(b.ticker);
      if (sortKey === "dy")     return b.dyAnnual - a.dyAnnual;
      if (sortKey === "income") return b.history[b.history.length - 1].netIncome - a.history[a.history.length - 1].netIncome;
      return 0;
    });
    return data;
  }, [search, sectorFilter, trendFilter, sortKey]);

  const stats = useMemo(() => ({
    total:   NEWS_DATA.length,
    hausses: NEWS_DATA.filter(n => n.dividendTrend === "hausse").length,
    avgDY:   NEWS_DATA.reduce((s, n) => s + n.dyAnnual, 0) / NEWS_DATA.length,
  }), []);

  return (
    <div>
      {/* Bande de stats */}
      <div className="flex items-center gap-6 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-[11px] text-slate-500">publications</p>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-600">{stats.hausses}</p>
          <p className="text-[11px] text-slate-500">dividende ↑</p>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="text-center">
          <p className="text-xl font-bold text-[#00D4A8]">{stats.avgDY.toFixed(1)}%</p>
          <p className="text-[11px] text-slate-500">DY moyen</p>
        </div>
        <div className="ml-auto">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#00D4A8]" />
            2025 · Données officielles BRVM
          </span>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Rechercher une action, un secteur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/30 focus:border-[#00D4A8]"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-slate-400 shrink-0" />
          {(["Tous", ...SECTORS] as const).map(s => (
            <button
              key={s}
              onClick={() => setSectorFilter(s as typeof sectorFilter)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                sectorFilter === s
                  ? "bg-slate-900 border-slate-900 text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {s === "Tous" ? "Tous secteurs" : s}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {(["Tous", "hausse", "baisse"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTrendFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                trendFilter === t
                  ? t === "hausse" ? "bg-emerald-600 border-emerald-600 text-white"
                  : t === "baisse" ? "bg-red-500 border-red-500 text-white"
                  : "bg-slate-900 border-slate-900 text-white"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {t === "Tous" ? "Toutes tendances" : t === "hausse" ? "↑ Hausse" : "↓ Baisse"}
            </button>
          ))}
        </div>

        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/30"
        >
          <option value="date">Trier : Date</option>
          <option value="dy">Trier : DY ↓</option>
          <option value="income">Trier : Résultat net ↓</option>
          <option value="ticker">Trier : Ticker A-Z</option>
        </select>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
        publication{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BarChart2 size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Aucun résultat pour cette recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(news => (
            <NewsCard key={news.id} news={news} onOpen={setSelected} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 italic text-center mt-8">
        Les informations présentées sont fournies à titre éducatif uniquement et ne constituent pas un conseil en investissement.
        Les données fondamentales sont issues des publications officielles de la BRVM.
      </p>

      {selected && <DetailPanel news={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
