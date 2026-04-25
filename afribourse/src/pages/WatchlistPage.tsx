// src/pages/WatchlistPage.tsx
import { useState } from 'react';
import { trackWatchlistAction } from '../lib/amplitude';
import { useNavigate } from 'react-router-dom';
import {
  Star, TrendingUp, TrendingDown, Edit3, Trash2, Tag,
  StickyNote, DollarSign, Search, RefreshCw, ArrowLeft,
  Plus, X, Check, ChevronRight,
} from 'lucide-react';
import {
  useWatchlistEnriched,
  useWatchlistScores,
  useRemoveFromWatchlist,
  useUpdateWatchlistItem,
  type WatchlistItemEnriched,
  type TickerScore,
} from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import WatchlistScoreBadge from '../components/watchlist/WatchlistScoreBadge';
import WatchlistAlertButton from '../components/watchlist/WatchlistAlertButton';

// ── Format helpers ────────────────────────────────────────────────────────────

function fmtPrice(n: number | null | undefined): string {
  if (n == null) return '–';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return '–';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function pctColor(n: number | null | undefined): string {
  if (n == null) return 'text-gray-400';
  return n >= 0 ? 'text-emerald-600' : 'text-red-500';
}

// ── Inline Edit Modal ──────────────────────────────────────────────────────────

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

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  function handleSave() {
    onSave({
      entry_price: entryPrice !== '' ? parseFloat(entryPrice) : null,
      note: note || null,
      tags,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{item.stock_ticker}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prix d'entrée */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Prix d'entrée (FCFA)
          </label>
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="number"
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              placeholder="ex: 12500"
              className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
            />
          </div>
          {entryPrice && item.current_price && (
            <p className={`text-xs mt-1 font-medium ${pctColor(
              ((item.current_price - parseFloat(entryPrice)) / parseFloat(entryPrice)) * 100
            )}`}>
              P&L estimé : {fmtPct(
                ((item.current_price - parseFloat(entryPrice)) / parseFloat(entryPrice)) * 100
              )}
            </p>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Note personnelle
          </label>
          <div className="flex items-start gap-2 border border-gray-200 rounded-xl px-3 py-2">
            <StickyNote className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Pourquoi surveiller cette action ?"
              rows={3}
              className="flex-1 outline-none text-sm text-gray-800 bg-transparent resize-none"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Tags
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {t}
                <button onClick={() => removeTag(t)} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 flex-1">
              <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Ajouter un tag…"
                className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
              />
            </div>
            <button
              onClick={addTag}
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row ────────────────────────────────────────────────────────────────────────

interface WatchlistRowProps {
  item: WatchlistItemEnriched;
  score: TickerScore | undefined;
  onEdit: (item: WatchlistItemEnriched) => void;
  onRemove: (ticker: string) => void;
}

function WatchlistRow({ item, score, onEdit, onRemove }: WatchlistRowProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-3">
        {/* Logo placeholder */}
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
          <span className="text-blue-700 font-bold text-xs">{item.stock_ticker.slice(0, 2)}</span>
        </div>

        {/* Ticker + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/stock/${item.stock_ticker}`)}
              className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors"
            >
              {item.stock_ticker}
            </button>
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {item.tags.map(t => (
                  <span key={t} className="bg-blue-100 text-blue-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {item.note && (
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.note}</p>
          )}
        </div>

        {/* Price + change */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-gray-900">{fmtPrice(item.current_price)}</p>
          <p className={`text-xs font-semibold ${pctColor(item.change_pct)}`}>
            {fmtPct(item.change_pct)} aujourd'hui
          </p>
        </div>

        {/* P&L */}
        {item.pnl_pct != null && (
          <div className={`flex-shrink-0 text-right border-l border-gray-100 pl-3 ml-1`}>
            <p className="text-[10px] text-gray-400">P&L</p>
            <p className={`text-sm font-bold ${pctColor(item.pnl_pct)}`}>{fmtPct(item.pnl_pct)}</p>
          </div>
        )}

        {/* Signal Score badge */}
        {score && (
          <div className="flex-shrink-0 border-l border-gray-100 pl-3 ml-1">
            <WatchlistScoreBadge score={score} variant="compact" />
          </div>
        )}

        {/* Alert button — always visible if has alerts, else on hover */}
        <WatchlistAlertButton ticker={item.stock_ticker} currentPrice={item.current_price} />

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
            title="Modifier"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/stock/${item.stock_ticker}`)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            title="Voir l'action"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(item.stock_ticker)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────

export default function WatchlistPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<WatchlistItemEnriched | null>(null);

  const { data: items = [], isLoading, refetch } = useWatchlistEnriched();
  const { data: scoresData = [] } = useWatchlistScores();
  const scoreMap = Object.fromEntries(scoresData.map(s => [s.ticker, s]));
  const removeMut = useRemoveFromWatchlist();
  const updateMut = useUpdateWatchlistItem();

  const filtered = items.filter(i =>
    i.stock_ticker.toLowerCase().includes(search.toLowerCase()) ||
    (i.note ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i.tags ?? []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const bullishCount = items.filter(i => (i.change_pct ?? 0) >= 0).length;
  const bearishCount = items.filter(i => (i.change_pct ?? 0) < 0).length;
  const avgPnl =
    items.filter(i => i.pnl_pct != null).length > 0
      ? items.filter(i => i.pnl_pct != null).reduce((s, i) => s + i.pnl_pct!, 0) /
        items.filter(i => i.pnl_pct != null).length
      : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            Ma Watchlist
          </h1>
          {isLoggedIn && (
            <p className="text-sm text-gray-400">{items.length} action{items.length !== 1 ? 's' : ''} surveillée{items.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
          title="Actualiser"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats summary */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-emerald-700">{bullishCount}</p>
            <p className="text-xs text-emerald-600">Haussières</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center">
            <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xl font-bold text-red-600">{bearishCount}</p>
            <p className="text-xs text-red-500">Baissières</p>
          </div>
          <div className={`${avgPnl != null && avgPnl >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-2xl p-3 text-center`}>
            <DollarSign className={`w-5 h-5 mx-auto mb-1 ${avgPnl != null && avgPnl >= 0 ? 'text-blue-600' : 'text-orange-500'}`} />
            <p className={`text-xl font-bold ${avgPnl != null ? pctColor(avgPnl) : 'text-gray-400'}`}>
              {avgPnl != null ? fmtPct(avgPnl) : '–'}
            </p>
            <p className="text-xs text-gray-500">P&L moy.</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 border border-gray-200 rounded-2xl px-4 py-2.5 bg-white shadow-sm">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par ticker, note ou tag…"
          className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {items.length === 0 ? (
            <>
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-semibold">Watchlist vide</p>
              <p className="text-sm mt-1">Ajoutez des actions depuis les fiches détaillées</p>
            </>
          ) : (
            <>
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              <p>Aucun résultat pour « {search} »</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <WatchlistRow
              key={item.id}
              item={item}
              score={scoreMap[item.stock_ticker]}
              onEdit={setEditItem}
              onRemove={ticker => { trackWatchlistAction('remove', ticker); removeMut.mutate(ticker); }}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
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
