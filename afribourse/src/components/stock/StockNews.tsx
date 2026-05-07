import React, { useState } from 'react';
import { ExternalLink, Newspaper, BarChart2, ChevronRight, X, TrendingUp, TrendingDown, Minus, Clock, ArrowUpRight, ArrowDownRight, Landmark, Leaf, Fuel, Radio, Star } from 'lucide-react';
import { findNewsByTicker, StockNews as FundamentalsNews, Sector } from '../../data/newsData';
import { BRVM_NEWS, BRVMArticle } from '../../data/brvm2026News';
import { BRVMDetailPanel, BRVMArticleCard } from '../BRVMNewsGrid';

type NewsItem = {
  id: string;
  stock_ticker: string;
  title: string;
  summary?: string | null;
  source: string;
  url?: string | null;
  published_at: Date | string;
};

type StockNewsProps = {
  news: NewsItem[];
  isLoading?: boolean;
  ticker?: string;
};

// ── Helpers fondamentaux ──────────────────────────────────────────────────────

function fmtM(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + " Bn";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + " Md";
  return v.toLocaleString("fr-FR") + " M";
}

function fmtPct(v: number, withSign = true): string {
  const s = withSign && v > 0 ? "+" : "";
  return s + v.toFixed(1) + "%";
}

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

const SECTOR_ICONS: Record<Sector, React.ReactNode> = {
  Banque: <Landmark size={12} />,
  "Agro-industrie": <Leaf size={12} />,
  "Distribution pétrolière": <Fuel size={12} />,
  Télécommunications: <Radio size={12} />,
};

const COUNTRY_FLAG: Record<string, string> = { CI: "🇨🇮", BF: "🇧🇫", SN: "🇸🇳" };

function FundTrendBadge({ trend }: { trend: "hausse" | "baisse" | "stable" }) {
  if (trend === "hausse") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
      <TrendingUp size={9} /> Hausse
    </span>
  );
  if (trend === "baisse") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
      <TrendingDown size={9} /> Baisse
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
      <Minus size={9} /> Stable
    </span>
  );
}

function DivBar({ history }: { history: FundamentalsNews["history"] }) {
  const maxDiv = Math.max(...history.map(h => h.dividend));
  return (
    <div className="flex items-end gap-1 h-8">
      {history.map((h, i) => {
        const isLast = i === history.length - 1;
        const pct = Math.round((h.dividend / maxDiv) * 100);
        return (
          <div key={h.year} className="flex flex-col items-center gap-0.5 flex-1">
            <div className="w-full rounded-sm" style={{ height: `${Math.max(pct * 0.28, 3)}px`, background: isLast ? "#00D4A8" : "#CBD5E1" }} />
            <span className="text-[8px] text-slate-400">{String(h.year).slice(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Panneau détail fondamentaux ───────────────────────────────────────────────

function FundDetailPanel({ news, onClose }: { news: FundamentalsNews; onClose: () => void }) {
  const last = news.history[news.history.length - 1];
  const prev = news.history[news.history.length - 2];
  const incomeVar = ((last.netIncome - prev.netIncome) / Math.abs(prev.netIncome)) * 100;
  const divValues = news.history.map(h => h.dividend);
  const rnValues  = news.history.map(h => h.netIncome);
  const min = (arr: number[]) => Math.min(...arr);
  const max = (arr: number[]) => Math.max(...arr);

  function Sparkline({ values, color }: { values: number[]; color: string }) {
    const mn = min(values); const mx = max(values); const range = mx - mn || 1;
    const W = 80; const H = 28; const pad = 2;
    const pts = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v - mn) / range) * (H - pad * 2);
      return `${x},${y}`;
    });
    const area = `${pts[0]} ${pts.join(" ")} ${W - pad},${H - pad} ${pad},${H - pad}`;
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        <polygon points={area} fill={color} fillOpacity={0.12} />
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => i === pts.length - 1 ? <circle key={i} cx={+p.split(",")[0]} cy={+p.split(",")[1]} r={2.5} fill={color} /> : null)}
      </svg>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-2xl overflow-y-auto flex flex-col" style={{ animation: "slideIn 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-lg font-bold text-slate-900">{news.ticker}</span>
                <span className="text-xl">{COUNTRY_FLAG[news.country]}</span>
              </div>
              <p className="text-sm text-slate-600">{news.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{relTime(news.publishedAt)}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-snug mb-2">{news.headline}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{news.summary}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "DY annuel",  value: fmtPct(news.dyAnnual, false), accent: true },
              { label: "PER",        value: `${news.per.toFixed(1)}x`,    accent: false },
              { label: "P/B",        value: `${news.pb.toFixed(2)}x`,     accent: false },
              { label: "BNPA",       value: `${news.bnpa.toLocaleString("fr-FR")} XOF`, accent: false },
              { label: "Var. BNPA",  value: fmtPct(news.bnpaVar),          accent: news.bnpaVar > 0 },
              { label: "Payout",     value: fmtPct(news.payout, false),    accent: false },
            ].map(k => (
              <div key={k.label} className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide">{k.label}</p>
                <p className={`text-sm font-bold ${k.accent ? "text-[#00D4A8]" : "text-slate-900"}`}>{k.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Évolution sur 5 ans (M XOF)</h3>
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
                              {isLast && isUp   && <ArrowUpRight   size={9} className="text-emerald-500" />}
                              {isLast && isDown && <ArrowDownRight size={9} className="text-red-400" />}
                              {row.key === "dy" ? `${(val as number).toFixed(1)}%`
                                : row.key === "dividend" ? (val as number).toLocaleString("fr-FR")
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

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Résultat net — tendance</p>
              <Sparkline values={rnValues} color={incomeVar >= 0 ? "#10b981" : "#ef4444"} />
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Dividende — tendance</p>
              <Sparkline values={divValues} color="#00D4A8" />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Points clés</h3>
            <ul className="space-y-2">
              {news.keyFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4A8] shrink-0" />
                  {fact}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-l-2 border-[#00D4A8] pl-4 py-1">
            <p className="text-[10px] font-semibold text-[#00D4A8] uppercase tracking-wide mb-1">Note analytique</p>
            <p className="text-sm text-slate-600 leading-relaxed italic">{news.analyst_note}</p>
          </div>

          <p className="text-[10px] text-slate-400 italic text-center border-t border-slate-100 pt-4">
            Informations fournies à titre éducatif. Données officielles BRVM.
          </p>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}

// ── Card fondamentale compacte ────────────────────────────────────────────────

function FundCard({ news, onOpen }: { news: FundamentalsNews; onOpen: () => void }) {
  const last = news.history[news.history.length - 1];
  const prev = news.history[news.history.length - 2];
  const divVar = ((last.dividend - prev.dividend) / Math.abs(prev.dividend)) * 100;

  return (
    <article
      className="group bg-white border border-slate-200 rounded-xl hover:border-[#00D4A8] hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden mb-6"
      onClick={onOpen}
    >
      <div className="h-0.5 bg-[#00D4A8]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#00D4A8] bg-[#00D4A8]/10 border border-[#00D4A8]/20 rounded-full px-2 py-0.5">
              <BarChart2 size={10} /> Résultats 2025
            </span>
            <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{news.ticker}</span>
            <span>{COUNTRY_FLAG[news.country]}</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 border border-slate-200 rounded-full px-2 py-0.5">
              {SECTOR_ICONS[news.sector]}{news.sector}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
            <Clock size={10} />{relTime(news.publishedAt)}
          </div>
        </div>

        <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-2 group-hover:text-[#00D4A8] transition-colors">
          {news.headline}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{news.summary}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">Dividende 5 ans</p>
              <DivBar history={news.history} />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">DY</span>
                <span className="text-xs font-bold text-[#00D4A8]">{fmtPct(news.dyAnnual, false)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">DIV</span>
                <span className="text-xs font-semibold text-slate-700">{last.dividend.toLocaleString("fr-FR")} XOF</span>
                <span className={`text-[10px] font-medium ${divVar >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {divVar >= 0 ? "+" : ""}{divVar.toFixed(1)}%
                </span>
              </div>
              <FundTrendBadge trend={news.dividendTrend} />
            </div>
          </div>
          <span className="text-[11px] text-[#00D4A8] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Détails <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </article>
  );
}

export default function StockNews({ news, isLoading = false, ticker }: StockNewsProps) {
  const [fundDetail, setFundDetail] = useState<FundamentalsNews | null>(null);
  const [selectedBRVM, setSelectedBRVM] = useState<BRVMArticle | null>(null);
  const fundamentalsNews = ticker ? findNewsByTicker(ticker) : undefined;
  const brvmArticles = ticker
    ? BRVM_NEWS.filter(a => a.tickers.some(t => t.ticker === ticker || t.ticker === ticker.split(' ')[0]))
    : [];
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaine${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
    return formatDate(d);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="py-8">
        {fundamentalsNews && (
          <>
            <FundCard news={fundamentalsNews} onOpen={() => setFundDetail(fundamentalsNews)} />
            {fundDetail && <FundDetailPanel news={fundDetail} onClose={() => setFundDetail(null)} />}
          </>
        )}
        {brvmArticles.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Star size={13} className="text-indigo-500 fill-indigo-500" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Analyses AfriBourse</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {brvmArticles.map(a => (
                <BRVMArticleCard key={a.id} article={a} onOpen={() => setSelectedBRVM(a)} />
              ))}
            </div>
          </div>
        )}
        {selectedBRVM && <BRVMDetailPanel article={selectedBRVM} onClose={() => setSelectedBRVM(null)} />}
        {!fundamentalsNews && brvmArticles.length === 0 && (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center justify-center text-gray-400">
              <Newspaper className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium text-gray-600">Aucune actualité disponible</p>
              <p className="text-sm text-gray-500 mt-2">
                Les actualités concernant cette action apparaîtront ici.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 py-8">
      {/* Card fondamentale si disponible pour ce ticker */}
      {fundamentalsNews && (
        <FundCard news={fundamentalsNews} onOpen={() => setFundDetail(fundamentalsNews)} />
      )}
      {fundDetail && <FundDetailPanel news={fundDetail} onClose={() => setFundDetail(null)} />}

      {/* Analyses BRVM pour ce ticker */}
      {brvmArticles.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={13} className="text-indigo-500 fill-indigo-500" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Analyses AfriBourse</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {brvmArticles.map(a => (
              <BRVMArticleCard key={a.id} article={a} onOpen={() => setSelectedBRVM(a)} />
            ))}
          </div>
        </div>
      )}
      {selectedBRVM && <BRVMDetailPanel article={selectedBRVM} onClose={() => setSelectedBRVM(null)} />}

      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Dernières Actualités ({news.length})
      </h3>

      {news.map((item) => (
        <article
          key={item.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                {item.title}
              </h4>

              <div className="flex items-center space-x-3 text-sm text-gray-600 mb-3">
                <span className="font-medium text-blue-600">{item.source}</span>
                <span>•</span>
                <time dateTime={item.published_at.toString()}>
                  {getTimeAgo(item.published_at)}
                </time>
              </div>

              {item.summary && (
                <p className="text-gray-700 leading-relaxed mb-4">{item.summary}</p>
              )}

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <span>Lire l'article complet</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
