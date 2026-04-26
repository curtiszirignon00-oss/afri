import React, { useState, useMemo } from 'react';
import {
  Clock, ChevronRight, X, Filter, Star,
  TrendingUp, TrendingDown, Minus, ExternalLink,
  BarChart2, Tag,
} from 'lucide-react';
import { BRVM_NEWS, BRVMArticle, ImpactType, BRVM_CATEGORIES } from '../data/brvm2026News';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  if (diff < 7) return `Il y a ${diff} jours`;
  if (diff < 30) return `Il y a ${Math.floor(diff / 7)} sem.`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const IMPACT_STYLES: Record<ImpactType, string> = {
  Positif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Négatif: 'bg-red-50 text-red-700 border-red-200',
  Neutre:  'bg-slate-50 text-slate-500 border-slate-200',
  Mixte:   'bg-amber-50 text-amber-700 border-amber-200',
};

const IMPACT_DOT: Record<ImpactType, string> = {
  Positif: 'bg-emerald-500',
  Négatif: 'bg-red-500',
  Neutre:  'bg-slate-400',
  Mixte:   'bg-amber-500',
};

const CAT_COLORS: Record<string, string> = {
  'Marché':           'bg-blue-50 text-blue-700 border-blue-200',
  'Macroéconomie':    'bg-violet-50 text-violet-700 border-violet-200',
  'Matières premières': 'bg-amber-50 text-amber-700 border-amber-200',
  'Secteur bancaire': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Télécoms':         'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Dividendes':       'bg-[#00D4A8]/10 text-[#00868A] border-[#00D4A8]/30',
  'Réglementation':   'bg-slate-100 text-slate-600 border-slate-300',
  'Agro-industrie':   'bg-lime-50 text-lime-700 border-lime-200',
};

// ── DetailPanel ───────────────────────────────────────────────────────────────

function DetailPanel({ article, onClose }: { article: BRVMArticle; onClose: () => void }) {
  const catCls = CAT_COLORS[article.category] ?? 'bg-slate-100 text-slate-600 border-slate-300';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col"
        style={{ animation: 'slideIn .25s cubic-bezier(.16,1,.3,1)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-5 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${catCls}`}>
                  {article.isFeatured && <Star size={10} className="fill-current" />}
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={11} />{relTime(article.publishedAt)}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">{article.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">
          {/* Résumé */}
          <p className="text-sm font-medium text-slate-700 leading-relaxed border-l-2 border-[#00D4A8] pl-4 py-1">
            {article.summary}
          </p>

          {/* Contenu */}
          <div className="space-y-3">
            {article.content.split('\n\n').map((para, i) => (
              para.trim() ? (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">{para.trim()}</p>
              ) : null
            ))}
          </div>

          {/* Tickers impactés */}
          {article.tickers.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <BarChart2 size={13} /> Actions concernées
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="text-left px-4 py-2.5 font-medium">Ticker</th>
                      <th className="px-4 py-2.5 font-medium text-center">Impact</th>
                      <th className="text-left px-4 py-2.5 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {article.tickers.map((t, i) => (
                      <tr key={t.ticker} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="px-4 py-2.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                            {t.ticker}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${IMPACT_STYLES[t.impact]}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${IMPACT_DOT[t.impact]}`} />
                            {t.impact}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{t.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sources */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ExternalLink size={12} /> Sources & références
            </h3>
            <ul className="space-y-1">
              {article.sources.map((s, i) => (
                <li key={i} className="text-[11px] text-slate-500 flex items-start gap-2">
                  <span className="mt-1 w-1 h-1 rounded-full bg-[#00D4A8] shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {article.tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                <Tag size={9} />#{t}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 italic text-center border-t border-slate-100 pt-4">
            Ces informations sont fournies à titre éducatif exclusivement et ne constituent pas un conseil en investissement.
            Données issues des publications officielles BRVM.
          </p>
        </div>
      </div>

      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard({ article, onOpen }: { article: BRVMArticle; onOpen: () => void }) {
  const catCls = CAT_COLORS[article.category] ?? 'bg-slate-100 text-slate-600 border-slate-300';
  const posCount = article.tickers.filter(t => t.impact === 'Positif').length;
  const negCount = article.tickers.filter(t => t.impact === 'Négatif').length;

  return (
    <article
      className="group bg-white border border-slate-200 rounded-xl hover:border-[#00D4A8] hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
      onClick={onOpen}
    >
      <div className={`h-0.5 ${article.isFeatured ? 'bg-[#00D4A8]' : 'bg-slate-100 group-hover:bg-[#00D4A8] transition-colors'}`} />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catCls}`}>
              {article.isFeatured && <Star size={9} className="fill-current" />}
              {article.category}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
            <Clock size={10} />{relTime(article.publishedAt)}
          </div>
        </div>

        {/* Titre */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#00D4A8] transition-colors line-clamp-2 flex-1">
          {article.title}
        </h3>

        {/* Résumé */}
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-4">{article.summary}</p>

        {/* Tickers badges */}
        {article.tickers.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-3">
            {article.tickers.slice(0, 4).map(t => (
              <span key={t.ticker} className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${IMPACT_STYLES[t.impact]}`}>
                <span className={`w-1 h-1 rounded-full ${IMPACT_DOT[t.impact]}`} />
                {t.ticker}
              </span>
            ))}
            {article.tickers.length > 4 && (
              <span className="text-[9px] text-slate-400 self-center">+{article.tickers.length - 4}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-[10px]">
            {posCount > 0 && (
              <span className="flex items-center gap-0.5 text-emerald-600">
                <TrendingUp size={10} /> {posCount} positif{posCount > 1 ? 's' : ''}
              </span>
            )}
            {negCount > 0 && (
              <span className="flex items-center gap-0.5 text-red-500">
                <TrendingDown size={10} /> {negCount} négatif{negCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#00D4A8] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            Lire <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </article>
  );
}

// ── BRVMNewsGrid (export principal) ──────────────────────────────────────────

export default function BRVMNewsGrid() {
  const [catFilter, setCatFilter]   = useState<string>('Tous');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<BRVMArticle | null>(null);

  const filtered = useMemo(() => {
    let data = [...BRVM_NEWS];
    if (catFilter !== 'Tous') data = data.filter(a => a.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tickers.some(t => t.ticker.toLowerCase().includes(q)) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return data.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [catFilter, search]);

  const featured = filtered.filter(a => a.isFeatured);
  const regular  = filtered.filter(a => !a.isFeatured);

  return (
    <div>
      {/* Bande stats */}
      <div className="flex items-center gap-6 mb-5 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">12</p>
          <p className="text-[11px] text-slate-500">articles</p>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="text-center">
          <p className="text-xl font-bold text-[#00D4A8]">47</p>
          <p className="text-[11px] text-slate-500">sociétés couvertes</p>
        </div>
        <div className="w-px h-8 bg-slate-200" />
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-600">26</p>
          <p className="text-[11px] text-slate-500">impacts positifs</p>
        </div>
        <div className="ml-auto hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#00D4A8]" />
          Intelligence de marché BRVM 2026
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher un article, ticker, tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 pl-4 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00D4A8]/30 focus:border-[#00D4A8]"
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter size={13} className="text-slate-400 shrink-0" />
          {(['Tous', ...BRVM_CATEGORIES] as const).map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                catFilter === c
                  ? 'bg-slate-900 border-slate-900 text-white'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-5">
        <span className="font-semibold text-slate-700">{filtered.length}</span>{' '}
        article{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
      </p>

      {/* Articles à la une */}
      {featured.length > 0 && catFilter === 'Tous' && !search && (
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <Star size={13} className="text-[#00D4A8] fill-[#00D4A8]" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">À la une</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map(a => (
              <ArticleCard key={a.id} article={a} onOpen={() => setSelected(a)} />
            ))}
          </div>
        </div>
      )}

      {/* Autres articles */}
      {(catFilter !== 'Tous' || search || regular.length > 0) && (
        <div>
          {featured.length > 0 && catFilter === 'Tous' && !search && (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tous les articles</span>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <BarChart2 size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">Aucun résultat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(catFilter !== 'Tous' || search ? filtered : regular).map(a => (
                <ArticleCard key={a.id} article={a} onOpen={() => setSelected(a)} />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400 italic text-center mt-8">
        Informations fournies à titre éducatif uniquement. Données issues des publications officielles BRVM.
        Ne constituent pas un conseil en investissement.
      </p>

      {selected && <DetailPanel article={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export { DetailPanel as BRVMDetailPanel, ArticleCard as BRVMArticleCard };
