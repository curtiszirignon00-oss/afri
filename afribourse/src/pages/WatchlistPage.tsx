// src/pages/WatchlistPage.tsx
import { useState } from 'react';
import { trackWatchlistAction } from '../lib/amplitude';
import { useNavigate } from 'react-router-dom';
import {
  Star, TrendingUp, TrendingDown, Edit3, Trash2, Tag,
  StickyNote, DollarSign, Search, RefreshCw, ArrowLeft,
  Plus, X, Check, ArrowUpRight, ArrowDownRight, Target,
  Activity, Zap, Sun, Moon,
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '–';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '–';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

// ── Zone configs (dark & light) ────────────────────────────────────────────────

interface ZoneCfg { color: string; border: string; glow: string; badge: string; label: string }

const ZONE_DARK: Record<SignalZone, ZoneCfg> = {
  'Achat Fort':   { color: '#10b981', border: 'border-emerald-500/35', glow: 'shadow-[0_0_28px_rgba(16,185,129,0.18)]', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Achat Fort' },
  'Signal Achat': { color: '#22c55e', border: 'border-green-500/30',   glow: 'shadow-[0_0_20px_rgba(34,197,94,0.14)]',  badge: 'bg-green-500/15 text-green-400 border-green-500/30',    label: 'Signal Achat' },
  'Neutre':       { color: '#64748b', border: 'border-slate-600/35',   glow: '',                                         badge: 'bg-slate-700/50 text-slate-400 border-slate-600/30',    label: 'Neutre' },
  'Signal Vente': { color: '#f97316', border: 'border-orange-500/30',  glow: 'shadow-[0_0_20px_rgba(249,115,22,0.14)]', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', label: 'Signal Vente' },
  'Vente Forte':  { color: '#ef4444', border: 'border-red-500/30',     glow: 'shadow-[0_0_20px_rgba(239,68,68,0.14)]',  badge: 'bg-red-500/15 text-red-400 border-red-500/30',          label: 'Vente Forte' },
};

const ZONE_LIGHT: Record<SignalZone, ZoneCfg> = {
  'Achat Fort':   { color: '#059669', border: 'border-slate-200', glow: '', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Achat Fort' },
  'Signal Achat': { color: '#16a34a', border: 'border-slate-200', glow: '', badge: 'bg-green-50 text-green-700 border-green-200',       label: 'Signal Achat' },
  'Neutre':       { color: '#94a3b8', border: 'border-slate-200', glow: '', badge: 'bg-slate-100 text-slate-600 border-slate-200',       label: 'Neutre' },
  'Signal Vente': { color: '#ea580c', border: 'border-slate-200', glow: '', badge: 'bg-orange-50 text-orange-700 border-orange-200',     label: 'Signal Vente' },
  'Vente Forte':  { color: '#dc2626', border: 'border-slate-200', glow: '', badge: 'bg-red-50 text-red-700 border-red-200',             label: 'Vente Forte' },
};

// ── Ticker gradient ────────────────────────────────────────────────────────────

const GRADIENTS: [string, string][] = [
  ['#3b82f6', '#8b5cf6'], ['#06b6d4', '#3b82f6'], ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'], ['#8b5cf6', '#ec4899'], ['#ec4899', '#f97316'],
  ['#14b8a6', '#6366f1'],
];

function tickerGradient(ticker: string): [string, string] {
  return GRADIENTS[ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];
}

// ── Score Arc ──────────────────────────────────────────────────────────────────

function ScoreArc({ score, zone, isDark }: { score: number; zone: SignalZone; isDark: boolean }) {
  const cfg = isDark ? ZONE_DARK[zone] : ZONE_LIGHT[zone];
  const trackColor = isDark ? '#1e293b' : '#e2e8f0';
  const subColor = isDark ? '#475569' : '#94a3b8';
  const size = 58; const r = 23; const sw = 3.5;
  const startDeg = 135; const maxDeg = 270;

  function polar(cx: number, cy: number, rad: number, deg: number) {
    const a = (deg - 90) * (Math.PI / 180);
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  }
  function arc(cx: number, cy: number, rad: number, a1: number, a2: number) {
    const s = polar(cx, cy, rad, a1), e = polar(cx, cy, rad, a2);
    return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${rad} ${rad} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
  }

  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <path d={arc(cx, cy, r, startDeg, startDeg + maxDeg)} fill="none" stroke={trackColor} strokeWidth={sw} strokeLinecap="round" />
      {score > 0 && <path d={arc(cx, cy, r, startDeg, startDeg + (score / 100) * maxDeg)} fill="none" stroke={cfg.color} strokeWidth={sw} strokeLinecap="round" />}
      <text x={cx} y={cy - 1} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="800" fill={cfg.color}>{score}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" dominantBaseline="middle" fontSize="6.5" fill={subColor}>/100</text>
    </svg>
  );
}

// ── Spark bars ─────────────────────────────────────────────────────────────────

function SparkBars({ positive }: { positive: boolean }) {
  const h = [3, 5, 4, 7, 5, 8, 6, 9, 7, 10];
  const color = positive ? '#10b981' : '#ef4444';
  return (
    <div className="flex items-end gap-[2px]">
      {h.map((v, i) => (
        <div key={i} className="w-[3px] rounded-sm"
          style={{ height: `${v * 2.2}px`, backgroundColor: color, opacity: 0.2 + (i / h.length) * 0.65 }} />
      ))}
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────────

interface EditModalProps {
  item: WatchlistItemEnriched; onClose: () => void;
  onSave: (d: { entry_price?: number | null; note?: string | null; tags?: string[] }) => void;
  isSaving: boolean; isDark: boolean;
}

function EditModal({ item, onClose, onSave, isSaving, isDark }: EditModalProps) {
  const [entryPrice, setEntryPrice] = useState(item.entry_price?.toString() ?? '');
  const [note, setNote] = useState(item.note ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(item.tags ?? []);

  const pnlEstimate = entryPrice && item.current_price
    ? ((item.current_price - parseFloat(entryPrice)) / parseFloat(entryPrice)) * 100 : null;

  const d = isDark ? {
    overlay: 'bg-black/75 backdrop-blur-md',
    box: 'bg-slate-900 border border-slate-700/60',
    title: 'text-white', sub: 'text-slate-500',
    close: 'hover:bg-slate-800 text-slate-400 hover:text-white',
    label: 'text-slate-500', field: 'bg-slate-800 border-slate-700/60',
    input: 'text-white placeholder-slate-600', icon: 'text-slate-500',
    tag: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    addBtn: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20',
    cancel: 'border-slate-700 text-slate-400 hover:bg-slate-800',
    save: 'from-cyan-500 to-blue-500',
    pnlPos: 'text-emerald-400', pnlNeg: 'text-red-400',
  } : {
    overlay: 'bg-slate-900/40 backdrop-blur-sm',
    box: 'bg-white border border-slate-200',
    title: 'text-slate-900', sub: 'text-slate-400',
    close: 'hover:bg-slate-100 text-slate-400 hover:text-slate-700',
    label: 'text-slate-400', field: 'bg-slate-50 border-slate-200',
    input: 'text-slate-800 placeholder-slate-300', icon: 'text-slate-400',
    tag: 'bg-blue-50 text-blue-600 border-blue-200',
    addBtn: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100',
    cancel: 'border-slate-200 text-slate-600 hover:bg-slate-50',
    save: 'from-blue-600 to-indigo-600',
    pnlPos: 'text-emerald-600', pnlNeg: 'text-red-600',
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${d.overlay} px-4`}>
      <div className={`${d.box} rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${d.title}`}>{item.stock_ticker}</h3>
            <p className={`text-xs ${d.sub}`}>Modifier les informations</p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${d.close}`}><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-1.5">
          <label className={`block text-[10px] font-semibold uppercase tracking-widest ${d.label}`}>Prix d'entrée (FCFA)</label>
          <div className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 ${d.field}`}>
            <DollarSign className={`w-4 h-4 flex-shrink-0 ${d.icon}`} />
            <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="ex: 12500" className={`flex-1 outline-none text-sm bg-transparent ${d.input}`} />
          </div>
          {pnlEstimate != null && <p className={`text-xs font-semibold ${pnlEstimate >= 0 ? d.pnlPos : d.pnlNeg}`}>P&L estimé : {fmtPct(pnlEstimate)}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={`block text-[10px] font-semibold uppercase tracking-widest ${d.label}`}>Note personnelle</label>
          <div className={`flex items-start gap-2 border rounded-xl px-3 py-2.5 ${d.field}`}>
            <StickyNote className={`w-4 h-4 flex-shrink-0 mt-0.5 ${d.icon}`} />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Pourquoi surveiller cette action ?" rows={3} className={`flex-1 outline-none text-sm bg-transparent resize-none ${d.input}`} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={`block text-[10px] font-semibold uppercase tracking-widest ${d.label}`}>Tags</label>
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-2">
              {tags.map(t => (
                <span key={t} className={`flex items-center gap-1 border text-xs font-medium px-2 py-0.5 rounded-full ${d.tag}`}>
                  #{t}<button onClick={() => setTags(p => p.filter(x => x !== t))} className="cursor-pointer"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 flex-1 ${d.field}`}>
              <Tag className={`w-4 h-4 flex-shrink-0 ${d.icon}`} />
              <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), setTags(p => tagInput.trim() && !p.includes(tagInput.trim().toLowerCase()) ? [...p, tagInput.trim().toLowerCase()] : p), setTagInput(''))} placeholder="Ajouter un tag…" className={`flex-1 outline-none text-sm bg-transparent ${d.input}`} />
            </div>
            <button onClick={() => { const t = tagInput.trim().toLowerCase(); if (t && !tags.includes(t)) setTags(p => [...p, t]); setTagInput(''); }} className={`px-3 py-2 border rounded-xl transition-colors cursor-pointer ${d.addBtn}`}>
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${d.cancel}`}>Annuler</button>
          <button onClick={() => onSave({ entry_price: entryPrice !== '' ? parseFloat(entryPrice) : null, note: note || null, tags })} disabled={isSaving}
            className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${d.save} text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer`}>
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
  item: WatchlistItemEnriched; score: TickerScore | undefined;
  onEdit: (item: WatchlistItemEnriched) => void; onRemove: (ticker: string) => void;
  isDark: boolean;
}

function WatchlistCard({ item, score, onEdit, onRemove, isDark }: WatchlistCardProps) {
  const navigate = useNavigate();
  const posDay = (item.change_pct ?? 0) >= 0;
  const posPnl = (item.pnl_pct ?? 0) >= 0;
  const zone = score?.zone;
  const zoneCfg = zone ? (isDark ? ZONE_DARK[zone] : ZONE_LIGHT[zone]) : null;
  const [c1, c2] = tickerGradient(item.stock_ticker);

  // ── theme classes
  const card = isDark
    ? `group relative flex flex-col bg-gradient-to-b from-slate-900 to-[#07101f] rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${zoneCfg ? `${zoneCfg.border} ${zoneCfg.glow}` : 'border-slate-700/40'}`
    : 'group relative flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(15,23,42,0.12)]';

  const pad   = isDark ? 'p-4' : 'pl-5 pr-4 py-4';
  const tName = isDark ? 'font-bold text-white text-sm hover:text-cyan-400' : 'font-bold text-slate-900 text-sm hover:text-blue-600';
  const arrow = isDark ? 'text-cyan-400' : 'text-blue-500';
  const sub   = isDark ? 'text-[10px] text-slate-600 mt-0.5' : 'text-[10px] text-slate-400 mt-0.5';
  const dotBd = isDark ? 'border-[#07101f]' : 'border-white';
  const actBtn = isDark ? 'p-1.5 rounded-lg hover:bg-slate-800 text-slate-600 hover:text-cyan-400 transition-colors cursor-pointer' : 'p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer';
  const delBtn = isDark ? 'p-1.5 rounded-lg hover:bg-slate-800 text-slate-600 hover:text-red-400 transition-colors cursor-pointer' : 'p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer';
  const price  = isDark ? 'text-xl font-extrabold text-white tracking-tight leading-none' : 'text-xl font-extrabold text-slate-900 tracking-tight leading-none';
  const chgClr = posDay ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600');
  const dayLbl = isDark ? 'text-[10px] text-slate-600' : 'text-[10px] text-slate-400';
  const pnlBox = isDark ? 'bg-slate-800/50 border border-slate-700/30 rounded-xl p-2.5 space-y-1.5' : 'bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5';
  const entLbl = isDark ? 'text-[11px] text-slate-500' : 'text-[11px] text-slate-500';
  const entVal = isDark ? 'text-slate-400 font-semibold' : 'text-slate-700 font-semibold';
  const pnlClr = posPnl ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600');
  const pnlTrk = isDark ? 'h-1 bg-slate-700/60 rounded-full overflow-hidden' : 'h-1 bg-slate-200 rounded-full overflow-hidden';
  const pnlBar = posPnl ? (isDark ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400') : (isDark ? 'bg-gradient-to-r from-red-700 to-red-400' : 'bg-gradient-to-r from-red-600 to-red-400');
  const scDiv  = isDark ? 'flex items-center gap-3 border-t border-slate-800/80 pt-3.5' : 'flex items-center gap-3 border-t border-slate-100 pt-3.5';
  const tLbl   = isDark ? 'text-[9px] text-slate-600 w-11' : 'text-[9px] text-slate-400 w-11';
  const tTrk   = isDark ? 'flex-1 h-[3px] bg-slate-800 rounded-full overflow-hidden' : 'flex-1 h-[3px] bg-slate-200 rounded-full overflow-hidden';
  const tBar   = isDark ? 'h-full bg-cyan-500 rounded-full' : 'h-full bg-blue-500 rounded-full';
  const fBar   = isDark ? 'h-full bg-violet-400 rounded-full' : 'h-full bg-violet-500 rounded-full';
  const sNum   = 'text-[9px] text-slate-500 w-5 text-right tabular-nums';
  const dqText = isDark ? 'text-[9px] text-slate-700' : 'text-[9px] text-slate-400';
  const tgDiv  = isDark ? 'border-t border-slate-800/60 pt-3 space-y-1.5' : 'border-t border-slate-100 pt-3 space-y-1.5';
  const tgItem = isDark ? 'text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-500 border border-slate-700/50' : 'text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200';
  const ntText = isDark ? 'text-[10px] text-slate-600 truncate flex items-center gap-1' : 'text-[10px] text-slate-400 truncate flex items-center gap-1';
  const ntIco  = isDark ? 'w-3 h-3 flex-shrink-0 text-slate-700' : 'w-3 h-3 flex-shrink-0 text-slate-300';

  return (
    <div className={card}>
      {/* Dark: top gradient line | Light: left accent stripe */}
      {isDark ? (
        <div className="h-[2px] w-full flex-shrink-0"
          style={{ background: zoneCfg ? `linear-gradient(to right, ${zoneCfg.color}99, transparent 70%)` : 'transparent' }} />
      ) : (
        <div className="absolute left-0 inset-y-0 w-[3px] rounded-l-2xl"
          style={{ backgroundColor: zoneCfg?.color ?? '#cbd5e1' }} />
      )}

      <div className={`${pad} flex flex-col gap-3.5 flex-1`}>

        {/* Row 1 */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
              {item.stock_ticker.slice(0, 2)}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${dotBd} ${posDay ? 'bg-emerald-400' : 'bg-red-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <button onClick={() => navigate(`/stock/${item.stock_ticker}`)}
              className={`${tName} transition-colors flex items-center gap-1 group/name cursor-pointer`}>
              {item.stock_ticker}
              <ArrowUpRight className={`w-3 h-3 opacity-0 group-hover/name:opacity-100 ${arrow} transition-opacity`} />
            </button>
            <p className={sub}>BRVM · Équité</p>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <WatchlistAlertButton ticker={item.stock_ticker} currentPrice={item.current_price} />
            <button onClick={() => onEdit(item)} className={actBtn} title="Modifier"><Edit3 className="w-3.5 h-3.5" /></button>
            <button onClick={() => onRemove(item.stock_ticker)} className={delBtn} title="Supprimer"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* Row 2: Price + spark */}
        <div className="flex items-end justify-between">
          <div>
            <p className={price}>{fmtPrice(item.current_price)}</p>
            <div className={`flex items-center gap-1 mt-1.5 ${chgClr}`}>
              {posDay ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span className="text-xs font-bold">{fmtPct(item.change_pct)}</span>
              <span className={dayLbl}>aujourd'hui</span>
            </div>
          </div>
          <SparkBars positive={posDay} />
        </div>

        {/* Row 3: P&L */}
        {item.entry_price != null && (
          <div className={pnlBox}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 ${entLbl}`}>
                <Target className="w-3 h-3 flex-shrink-0" />
                <span>Entrée : <span className={entVal}>{fmtPrice(item.entry_price)}</span></span>
              </div>
              {item.pnl_pct != null && <span className={`text-xs font-bold ${pnlClr}`}>{fmtPct(item.pnl_pct)} P&L</span>}
            </div>
            {item.pnl_pct != null && (
              <div className={pnlTrk}>
                <div className={`h-full rounded-full ${pnlBar}`} style={{ width: `${Math.min(Math.abs(item.pnl_pct), 100)}%` }} />
              </div>
            )}
          </div>
        )}

        {/* Row 4: Score */}
        {score && (
          <div className={scDiv}>
            <ScoreArc score={score.score} zone={score.zone} isDark={isDark} />
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
                    <span className={tLbl}>Technique</span>
                    <div className={tTrk}><div className={tBar} style={{ width: `${score.technical}%` }} /></div>
                    <span className={sNum}>{score.technical}</span>
                  </div>
                )}
                {score.fundamental != null && (
                  <div className="flex items-center gap-2">
                    <span className={tLbl}>Fondament.</span>
                    <div className={tTrk}><div className={fBar} style={{ width: `${score.fundamental}%` }} /></div>
                    <span className={sNum}>{score.fundamental}</span>
                  </div>
                )}
              </div>
              {score.dataQuality === 'low' && <p className={dqText}>données limitées</p>}
            </div>
          </div>
        )}

        {/* Row 5: Tags + note */}
        {((item.tags && item.tags.length > 0) || item.note) && (
          <div className={tgDiv}>
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {item.tags.map(t => <span key={t} className={tgItem}>#{t}</span>)}
              </div>
            )}
            {item.note && (
              <p className={ntText}><StickyNote className={ntIco} />{item.note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type SortKey = 'default' | 'perf' | 'pnl' | 'score';
const SORT_OPTS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Défaut' }, { key: 'perf', label: '% Jour' },
  { key: 'pnl', label: 'P&L' }, { key: 'score', label: 'Score' },
];

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('default');
  const [editItem, setEditItem] = useState<WatchlistItemEnriched | null>(null);
  const [isDark, setIsDark] = useState(true);

  const { data: items = [], isLoading, refetch } = useWatchlistEnriched();
  const { data: scoresData = [] } = useWatchlistScores();
  const scoreMap = Object.fromEntries(scoresData.map(s => [s.ticker, s]));
  const removeMut = useRemoveFromWatchlist();
  const updateMut = useUpdateWatchlistItem();

  const bullish   = items.filter(i => (i.change_pct ?? 0) >= 0).length;
  const bearish   = items.filter(i => (i.change_pct ?? 0) < 0).length;
  const withPnl   = items.filter(i => i.pnl_pct != null);
  const avgPnl    = withPnl.length > 0 ? withPnl.reduce((s, i) => s + i.pnl_pct!, 0) / withPnl.length : null;
  const avgScore  = scoresData.length > 0 ? Math.round(scoresData.reduce((s, x) => s + x.score, 0) / scoresData.length) : null;

  const filtered = items
    .filter(i =>
      i.stock_ticker.toLowerCase().includes(search.toLowerCase()) ||
      (i.note ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (i.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'perf')  return (b.change_pct ?? -Infinity) - (a.change_pct ?? -Infinity);
      if (sortBy === 'pnl')   return (b.pnl_pct ?? -Infinity) - (a.pnl_pct ?? -Infinity);
      if (sortBy === 'score') return (scoreMap[b.stock_ticker]?.score ?? 0) - (scoreMap[a.stock_ticker]?.score ?? 0);
      return 0;
    });

  // Page-level theme classes
  const pg       = isDark ? 'min-h-screen bg-gradient-to-b from-[#060d1f] via-[#080f1e] to-[#060d1f]' : 'min-h-screen bg-[#F8FAFC]';
  const hTitle   = isDark ? 'from-cyan-400 to-blue-400' : 'from-blue-700 to-indigo-700';
  const subClr   = isDark ? 'text-slate-600' : 'text-slate-400';
  const iconBtn  = isDark ? 'p-2 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-colors cursor-pointer' : 'p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer';
  const statCard = isDark ? 'bg-slate-900/80 border border-slate-700/40 rounded-2xl p-4 flex items-center gap-3' : 'bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm';
  const srchBar  = isDark ? 'flex items-center gap-2 bg-slate-900 border border-slate-700/50 rounded-2xl px-4 py-2.5 flex-1' : 'flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex-1 shadow-sm';
  const srchIn   = isDark ? 'text-slate-200 placeholder-slate-600' : 'text-slate-700 placeholder-slate-300';
  const srchIco  = isDark ? 'text-slate-500' : 'text-slate-400';
  const sortPnl  = isDark ? 'flex items-center gap-0.5 bg-slate-900 border border-slate-700/50 rounded-2xl p-1 flex-shrink-0' : 'flex items-center gap-0.5 bg-white border border-slate-200 rounded-2xl p-1 flex-shrink-0 shadow-sm';
  const srtAct   = isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200';
  const srtIn    = isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700';
  const sklLoad  = isDark ? 'h-64 rounded-2xl animate-pulse bg-slate-900/60 border border-slate-800' : 'h-64 rounded-2xl animate-pulse bg-slate-200/60';

  return (
    <div className={pg}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className={iconBtn}><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <span className={`bg-gradient-to-r ${hTitle} bg-clip-text text-transparent`}>Ma Watchlist</span>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </h1>
            {isLoggedIn && (
              <p className={`text-sm mt-0.5 ${subClr}`}>
                {items.length} action{items.length !== 1 ? 's' : ''} surveillée{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button onClick={() => setIsDark(d => !d)} title={isDark ? 'Mode clair' : 'Mode sombre'}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-500'}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => refetch()} className={iconBtn} title="Actualiser">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={statCard}>
              <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-500 leading-none">{bullish}</p>
                <p className={`text-[11px] mt-0.5 ${subClr}`}>Haussières</p>
              </div>
            </div>

            <div className={statCard}>
              <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-red-500 leading-none">{bearish}</p>
                <p className={`text-[11px] mt-0.5 ${subClr}`}>Baissières</p>
              </div>
            </div>

            <div className={statCard}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${avgPnl != null && avgPnl >= 0 ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}>
                <Activity className={`w-5 h-5 ${avgPnl != null && avgPnl >= 0 ? 'text-emerald-500' : 'text-orange-500'}`} />
              </div>
              <div>
                <p className={`text-2xl font-extrabold leading-none ${avgPnl != null ? (avgPnl >= 0 ? 'text-emerald-500' : 'text-red-500') : subClr}`}>
                  {avgPnl != null ? fmtPct(avgPnl) : '–'}
                </p>
                <p className={`text-[11px] mt-0.5 ${subClr}`}>P&L moyen</p>
              </div>
            </div>

            <div className={statCard}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-cyan-500/10' : 'bg-blue-50'}`}>
                <Zap className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <p className={`text-2xl font-extrabold leading-none ${isDark ? 'text-cyan-400' : 'text-blue-700'}`}>{avgScore ?? '–'}</p>
                <p className={`text-[11px] mt-0.5 ${subClr}`}>Score moyen</p>
              </div>
            </div>
          </div>
        )}

        {/* Search + Sort */}
        <div className="flex gap-3 items-center">
          <div className={srchBar}>
            <Search className={`w-4 h-4 flex-shrink-0 ${srchIco}`} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par ticker, note ou tag…"
              className={`flex-1 outline-none text-sm bg-transparent ${srchIn}`} />
            {search && (
              <button onClick={() => setSearch('')} className={`transition-colors cursor-pointer ${srchIco}`}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {items.length > 1 && (
            <div className={sortPnl}>
              {SORT_OPTS.map(({ key, label }) => (
                <button key={key} onClick={() => setSortBy(key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${sortBy === key ? srtAct : srtIn}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className={sklLoad} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            {items.length === 0 ? (
              <>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200 shadow-sm'}`}>
                  <Star className={`w-10 h-10 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                </div>
                <p className={`font-semibold text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Watchlist vide</p>
                <p className={`text-sm mt-1 ${subClr}`}>Ajoutez des actions depuis les fiches détaillées</p>
              </>
            ) : (
              <>
                <Search className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-slate-700' : 'text-slate-300'}`} />
                <p className={isDark ? 'text-slate-500' : 'text-slate-500'}>Aucun résultat pour « {search} »</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => (
              <WatchlistCard key={item.id} item={item} score={scoreMap[item.stock_ticker]}
                onEdit={setEditItem} isDark={isDark}
                onRemove={ticker => { trackWatchlistAction('remove', ticker); removeMut.mutate(ticker); }} />
            ))}
          </div>
        )}
      </div>

      {editItem && (
        <EditModal item={editItem} onClose={() => setEditItem(null)} isSaving={updateMut.isPending} isDark={isDark}
          onSave={data => updateMut.mutate({ stockTicker: editItem.stock_ticker, data }, { onSuccess: () => setEditItem(null) })} />
      )}
    </div>
  );
}
