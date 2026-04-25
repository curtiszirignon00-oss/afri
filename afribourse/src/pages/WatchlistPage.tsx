// src/pages/WatchlistPage.tsx
import { useState } from 'react';
import { trackWatchlistAction } from '../lib/amplitude';
import { useNavigate } from 'react-router-dom';
import {
  Star, TrendingUp, TrendingDown, Edit3, Trash2, Tag,
  StickyNote, DollarSign, Search, RefreshCw, ArrowLeft,
  Plus, X, Check, ArrowUpRight, ArrowDownRight, Target,
  Activity, Zap,
} from 'lucide-react';
import {
  useWatchlistEnriched,
  useWatchlistScores,
  useRemoveFromWatchlist,
  useUpdateWatchlistItem,
  type WatchlistItemEnriched,
  type TickerScore,
  type SignalZone,
} from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import WatchlistAlertButton from '../components/watchlist/WatchlistAlertButton';

// ── Format helpers ─────────────────────────────────────────────────────────────

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '–';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '–';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// ── Zone config ────────────────────────────────────────────────────────────────

const ZONE_CFG: Record<SignalZone, {
  color: string; border: string; glow: string;
  badge: string; label: string;
}> = {
  'Achat Fort': {
    color: '#10b981',
    border: 'border-emerald-500/35',
    glow: 'shadow-[0_0_28px_rgba(16,185,129,0.18)]',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    label: 'Achat Fort',
  },
  'Signal Achat': {
    color: '#22c55e',
    border: 'border-green-500/30',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.14)]',
    badge: 'bg-green-500/15 text-green-400 border-green-500/30',
    label: 'Signal Achat',
  },
  'Neutre': {
    color: '#64748b',
    border: 'border-slate-600/35',
    glow: '',
    badge: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
    label: 'Neutre',
  },
  'Signal Vente': {
    color: '#f97316',
    border: 'border-orange-500/30',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.14)]',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    label: 'Signal Vente',
  },
  'Vente Forte': {
    color: '#ef4444',
    border: 'border-red-500/30',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.14)]',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    label: 'Vente Forte',
  },
};

// ── Ticker gradient (deterministic) ───────────────────────────────────────────

const GRADIENTS: [string, string][] = [
  ['#3b82f6', '#8b5cf6'],
  ['#06b6d4', '#3b82f6'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#8b5cf6', '#ec4899'],
  ['#ec4899', '#f97316'],
  ['#14b8a6', '#6366f1'],
];

function tickerGradient(ticker: string): [string, string] {
  const idx = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

// ── Score Arc (gauge SVG) ──────────────────────────────────────────────────────

function ScoreArc({ score, zone }: { score: number; zone: SignalZone }) {
  const cfg = ZONE_CFG[zone];
  const size = 58;
  const r = 23;
  const sw = 3.5;
  const maxDeg = 270;
  const startDeg = 135;

  function polar(cx: number, cy: number, radius: number, deg: number) {
    const rad = (deg - 90) * (Math.PI / 180);
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function arc(cx: number, cy: number, radius: number, a1: number, a2: number) {
    const s = polar(cx, cy, radius, a1);
    const e = polar(cx, cy, radius, a2);
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${radius} ${radius} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  const cx = size / 2;
  const cy = size / 2;
  const fgEnd = startDeg + (score / 100) * maxDeg;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <path d={arc(cx, cy, r, startDeg, startDeg + maxDeg)} fill="none" stroke="#1e293b" strokeWidth={sw} strokeLinecap="round" />
      {score > 0 && (
        <path d={arc(cx, cy, r, startDeg, fgEnd)} fill="none" stroke={cfg.color} strokeWidth={sw} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 1} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="800" fill={cfg.color}>
        {score}
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill="#475569">
        /100
      </text>
    </svg>
  );
}

// ── Decorative spark bars ──────────────────────────────────────────────────────

function SparkBars({ positive }: { positive: boolean }) {
  const heights = [3, 5, 4, 7, 5, 8, 6, 9, 7, 10];
  const color = positive ? '#10b981' : '#ef4444';
  return (
    <div className="flex items-end gap-[2px]">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{ height: `${h * 2.2}px`, backgroundColor: color, opacity: 0.2 + (i / heights.length) * 0.65 }}
        />
      ))}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

interface EditModalProps {
  item: WatchlistItemEnriched;
  onClose: () => void;
  onSave: (data: { entry_price?: number | null; note?: string | null; tags?: string[] }) => void;
  isSaving: boolean;
}

function EditModal({ item, onClose, onSave, isSaving }: EditModalProps) {
  const [entryPrice, setEntryPrice] = useState<string>(item.entry_price?.toString() ?? '');
  const [note, setNote] = useState(item.note ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(item.tags ?? []);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  const pnlEstimate =
    entryPrice && item.current_price
      ? ((item.current_price - parseFloat(entryPrice)) / parseFloat(entryPrice)) * 100
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4">
      <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{item.stock_ticker}</h3>
            <p className="text-xs text-slate-500">Modifier les informations</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prix d'entrée */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Prix d'entrée (FCFA)
          </label>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2.5">
            <DollarSign className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              type="number"
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              placeholder="ex: 12500"
              className="flex-1 outline-none text-sm text-white bg-transparent placeholder-slate-600"
            />
          </div>
          {pnlEstimate != null && (
            <p className={`text-xs font-semibold ${pnlEstimate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              P&L estimé : {fmtPct(pnlEstimate)}
            </p>
          )}
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Note personnelle
          </label>
          <div className="flex items-start gap-2 bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2.5">
            <StickyNote className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Pourquoi surveiller cette action ?"
              rows={3}
              className="flex-1 outline-none text-sm text-white bg-transparent resize-none placeholder-slate-600"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            Tags
          </label>
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium px-2 py-0.5 rounded-full">
                  #{t}
                  <button onClick={() => setTags(p => p.filter(x => x !== t))} className="hover:text-white transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 flex-1">
              <Tag className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Ajouter un tag…"
                className="flex-1 outline-none text-sm text-white bg-transparent placeholder-slate-600"
              />
            </div>
            <button
              onClick={addTag}
              className="px-3 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave({ entry_price: entryPrice !== '' ? parseFloat(entryPrice) : null, note: note || null, tags })}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WatchlistCard ──────────────────────────────────────────────────────────────

interface WatchlistCardProps {
  item: WatchlistItemEnriched;
  score: TickerScore | undefined;
  onEdit: (item: WatchlistItemEnriched) => void;
  onRemove: (ticker: string) => void;
}

function WatchlistCard({ item, score, onEdit, onRemove }: WatchlistCardProps) {
  const navigate = useNavigate();
  const isPositiveDay = (item.change_pct ?? 0) >= 0;
  const isPositivePnl = (item.pnl_pct ?? 0) >= 0;
  const zone = score?.zone;
  const zoneCfg = zone ? ZONE_CFG[zone] : null;
  const [c1, c2] = tickerGradient(item.stock_ticker);

  return (
    <div
      className={`
        relative flex flex-col bg-gradient-to-b from-slate-900 to-[#07101f]
        rounded-2xl border overflow-hidden
        transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl
        ${zoneCfg ? `${zoneCfg.border} ${zoneCfg.glow}` : 'border-slate-700/40'}
      `}
    >
      {/* Top accent line */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{
          background: zoneCfg
            ? `linear-gradient(to right, ${zoneCfg.color}99, transparent 70%)`
            : 'transparent',
        }}
      />

      <div className="p-4 flex flex-col gap-3.5 flex-1">

        {/* Row 1: Logo + ticker + actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
            >
              {item.stock_ticker.slice(0, 2)}
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#07101f] ${
                isPositiveDay ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <button
              onClick={() => navigate(`/stock/${item.stock_ticker}`)}
              className="font-bold text-white text-sm hover:text-cyan-400 transition-colors flex items-center gap-1 group/name"
            >
              {item.stock_ticker}
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/name:opacity-100 text-cyan-400 transition-opacity" />
            </button>
            <p className="text-[10px] text-slate-600 mt-0.5">BRVM · Équité</p>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <WatchlistAlertButton ticker={item.stock_ticker} currentPrice={item.current_price} />
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-600 hover:text-cyan-400 transition-colors"
              title="Modifier"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onRemove(item.stock_ticker)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-600 hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Price + change + spark */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-extrabold text-white tracking-tight leading-none">
              {fmtPrice(item.current_price)}
            </p>
            <div className={`flex items-center gap-1 mt-1.5 ${isPositiveDay ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositiveDay
                ? <ArrowUpRight className="w-3.5 h-3.5" />
                : <ArrowDownRight className="w-3.5 h-3.5" />
              }
              <span className="text-xs font-bold">{fmtPct(item.change_pct)}</span>
              <span className="text-[10px] text-slate-600">aujourd'hui</span>
            </div>
          </div>
          <SparkBars positive={isPositiveDay} />
        </div>

        {/* Row 3: P&L (if entry price) */}
        {item.entry_price != null && (
          <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Target className="w-3 h-3 flex-shrink-0" />
                <span>Entrée :{' '}
                  <span className="text-slate-400 font-semibold">{fmtPrice(item.entry_price)}</span>
                </span>
              </div>
              {item.pnl_pct != null && (
                <span className={`text-xs font-bold ${isPositivePnl ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtPct(item.pnl_pct)} P&L
                </span>
              )}
            </div>
            {item.pnl_pct != null && (
              <div className="h-1 bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isPositivePnl
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      : 'bg-gradient-to-r from-red-700 to-red-400'
                  }`}
                  style={{ width: `${Math.min(Math.abs(item.pnl_pct), 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Row 4: Score */}
        {score && (
          <div className="flex items-center gap-3 border-t border-slate-800/80 pt-3.5">
            <ScoreArc score={score.score} zone={score.zone} />
            <div className="flex-1 space-y-2 min-w-0">
              {zoneCfg && (
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${zoneCfg.badge}`}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: zoneCfg.color }} />
                  {zoneCfg.label}
                </span>
              )}
              <div className="space-y-1.5">
                {score.technical != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-11">Technique</span>
                    <div className="flex-1 h-[3px] bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${score.technical}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-500 w-5 text-right tabular-nums">{score.technical}</span>
                  </div>
                )}
                {score.fundamental != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 w-11">Fondament.</span>
                    <div className="flex-1 h-[3px] bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-400 rounded-full" style={{ width: `${score.fundamental}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-500 w-5 text-right tabular-nums">{score.fundamental}</span>
                  </div>
                )}
              </div>
              {score.dataQuality === 'low' && (
                <p className="text-[9px] text-slate-700">données limitées</p>
              )}
            </div>
          </div>
        )}

        {/* Row 5: Tags + note */}
        {((item.tags && item.tags.length > 0) || item.note) && (
          <div className="border-t border-slate-800/60 pt-3 space-y-1.5">
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {item.tags.map(t => (
                  <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500 border border-slate-700/50">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {item.note && (
              <p className="text-[10px] text-slate-600 truncate flex items-center gap-1">
                <StickyNote className="w-3 h-3 flex-shrink-0 text-slate-700" />
                {item.note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

type SortKey = 'default' | 'perf' | 'pnl' | 'score';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Défaut' },
  { key: 'perf', label: '% Jour' },
  { key: 'pnl', label: 'P&L' },
  { key: 'score', label: 'Score' },
];

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [editItem, setEditItem] = useState<WatchlistItemEnriched | null>(null);

  const { data: items = [], isLoading, refetch } = useWatchlistEnriched();
  const { data: scoresData = [] } = useWatchlistScores();
  const scoreMap = Object.fromEntries(scoresData.map(s => [s.ticker, s]));
  const removeMut = useRemoveFromWatchlist();
  const updateMut = useUpdateWatchlistItem();

  // Stats
  const bullishCount = items.filter(i => (i.change_pct ?? 0) >= 0).length;
  const bearishCount = items.filter(i => (i.change_pct ?? 0) < 0).length;
  const itemsWithPnl = items.filter(i => i.pnl_pct != null);
  const avgPnl =
    itemsWithPnl.length > 0
      ? itemsWithPnl.reduce((s, i) => s + i.pnl_pct!, 0) / itemsWithPnl.length
      : null;
  const avgScore =
    scoresData.length > 0
      ? Math.round(scoresData.reduce((s, x) => s + x.score, 0) / scoresData.length)
      : null;

  // Filter + sort
  const filtered = items
    .filter(i =>
      i.stock_ticker.toLowerCase().includes(search.toLowerCase()) ||
      (i.note ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (i.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'perf') return (b.change_pct ?? -Infinity) - (a.change_pct ?? -Infinity);
      if (sortBy === 'pnl') return (b.pnl_pct ?? -Infinity) - (a.pnl_pct ?? -Infinity);
      if (sortBy === 'score') return (scoreMap[b.stock_ticker]?.score ?? 0) - (scoreMap[a.stock_ticker]?.score ?? 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#060d1f] via-[#080f1e] to-[#060d1f]">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Ma Watchlist
              </span>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </h1>
            {isLoggedIn && (
              <p className="text-sm text-slate-600 mt-0.5">
                {items.length} action{items.length !== 1 ? 's' : ''} surveillée{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* ── Stats ── */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-400 leading-none">{bullishCount}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Haussières</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-red-400 leading-none">{bearishCount}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Baissières</p>
              </div>
            </div>

            <div className={`bg-slate-900/80 border rounded-2xl p-4 flex items-center gap-3 ${
              avgPnl != null && avgPnl >= 0 ? 'border-emerald-500/20' : 'border-orange-500/20'
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                avgPnl != null && avgPnl >= 0 ? 'bg-emerald-500/10' : 'bg-orange-500/10'
              }`}>
                <Activity className={`w-5 h-5 ${avgPnl != null && avgPnl >= 0 ? 'text-emerald-400' : 'text-orange-400'}`} />
              </div>
              <div>
                <p className={`text-2xl font-extrabold leading-none ${
                  avgPnl != null ? (avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-slate-600'
                }`}>
                  {avgPnl != null ? fmtPct(avgPnl) : '–'}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">P&L moyen</p>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-cyan-400 leading-none">{avgScore ?? '–'}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Score moyen</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Search + Sort ── */}
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/50 rounded-2xl px-4 py-2.5 flex-1">
            <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par ticker, note ou tag…"
              className="flex-1 outline-none text-sm text-slate-200 bg-transparent placeholder-slate-600"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {items.length > 1 && (
            <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-700/50 rounded-2xl p-1 flex-shrink-0">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    sortBy === key
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Liste ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            {items.length === 0 ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Star className="w-10 h-10 text-slate-700" />
                </div>
                <p className="font-semibold text-slate-500 text-lg">Watchlist vide</p>
                <p className="text-sm mt-1 text-slate-600">Ajoutez des actions depuis les fiches détaillées</p>
              </>
            ) : (
              <>
                <Search className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-slate-500">Aucun résultat pour « {search} »</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <WatchlistCard
                key={item.id}
                item={item}
                score={scoreMap[item.stock_ticker]}
                onEdit={setEditItem}
                onRemove={ticker => {
                  trackWatchlistAction('remove', ticker);
                  removeMut.mutate(ticker);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit modal ── */}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          isSaving={updateMut.isPending}
          onSave={data => {
            updateMut.mutate(
              { stockTicker: editItem.stock_ticker, data },
              { onSuccess: () => setEditItem(null) }
            );
          }}
        />
      )}
    </div>
  );
}
