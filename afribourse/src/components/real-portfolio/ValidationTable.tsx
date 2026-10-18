// src/components/real-portfolio/ValidationTable.tsx
// Tableau de validation partagé : correction à l'import ET mise à jour ensuite
// (ajout / modification de transaction). Chaque modification repasse par le
// moteur de cohérence serveur (validation debouncée).

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XOctagon, Plus, Trash2, Wand2, Loader2 } from 'lucide-react';
import type { DraftRow, FixSuggestion, ImportMode, RowResult, ValidationReport } from '../../services/realPortfolioApi';
import { applyFix, emptyRow } from './draft';
import { apiFetch } from '../../hooks/useApi';

const fmt = (n: number | null | undefined) => (n == null ? '—' : Math.round(n).toLocaleString('fr-FR'));

const STATUS = {
  VALID: { icon: CheckCircle2, cls: 'text-emerald-600', bg: '', label: 'Valide' },
  WARNING: { icon: AlertTriangle, cls: 'text-amber-500', bg: 'bg-amber-50/60', label: 'À vérifier' },
  BLOCKING: { icon: XOctagon, cls: 'text-red-600', bg: 'bg-red-50/70', label: 'Bloquant' },
} as const;

let stockListPromise: Promise<{ symbol: string; company_name: string }[]> | null = null;
function useStockOptions() {
  const [stocks, setStocks] = useState<{ symbol: string; company_name: string }[]>([]);
  useEffect(() => {
    stockListPromise ??= apiFetch<{ symbol: string; company_name: string }[]>('/stocks').catch(() => []);
    stockListPromise.then(setStocks);
  }, []);
  return stocks;
}

// ─── Composant ─────────────────────────────────────────────────────────────

interface Props {
  rows: DraftRow[];
  onChange: (rows: DraftRow[]) => void;
  report: ValidationReport | null;
  validating?: boolean;
  mode: ImportMode;
  allowAdd?: boolean;
  allowRemove?: boolean;
  /** Date par défaut des nouvelles lignes. */
  defaultDate: string;
}

type Filter = 'ALL' | 'BLOCKING' | 'WARNING';

export default function ValidationTable({ rows, onChange, report, validating, mode, allowAdd = true, allowRemove = true, defaultDate }: Props) {
  const stocks = useStockOptions();
  const [filter, setFilter] = useState<Filter>('ALL');
  const byId = useMemo(() => new Map((report?.rows ?? []).map(r => [r.rowId, r])), [report]);
  const listId = 'rp-stock-options';

  const update = (rowId: string, patch: Partial<DraftRow>) => onChange(rows.map(r => (r.rowId === rowId ? { ...r, ...patch } : r)));
  const fix = (rowId: string, f: FixSuggestion) => onChange(rows.map(r => (r.rowId === rowId ? applyFix(r, f) : r)));
  const remove = (rowId: string) => onChange(rows.filter(r => r.rowId !== rowId));
  const fixAllSplits = () => onChange(rows.map(r => {
    const f = byId.get(r.rowId)?.issues.find(i => i.fixes?.[0]?.splitAdjusted)?.fixes?.[0];
    return f ? applyFix(r, f) : r;
  }));

  const splitFixCount = rows.filter(r => byId.get(r.rowId)?.issues.some(i => i.fixes?.[0]?.splitAdjusted)).length;
  const visible = rows.filter(r => filter === 'ALL' || byId.get(r.rowId)?.status === filter);
  const s = report?.summary;
  const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(/\s/g, '').replace(',', '.')));

  return (
    <div className="space-y-3">
      <datalist id={listId}>
        {stocks.map(st => <option key={st.symbol} value={st.symbol}>{st.company_name}</option>)}
      </datalist>

      {/* Synthèse + filtres */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {(['ALL', 'BLOCKING', 'WARNING'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {f === 'ALL' ? `Toutes (${rows.length})` : f === 'BLOCKING' ? `⛔ Bloquantes (${s?.blocking ?? 0})` : `⚠️ À vérifier (${s?.warning ?? 0})`}
          </button>
        ))}
        {s && <span className="text-emerald-700">✅ {s.valid} valides</span>}
        {validating && <span className="inline-flex items-center gap-1 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Vérification…</span>}
        {splitFixCount > 1 && (
          <button onClick={fixAllSplits} className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
            <Wand2 className="w-4 h-4" /> Ajuster les {splitFixCount} lignes concernées par un split
          </button>
        )}
      </div>

      {/* En-tête (desktop) */}
      <div className="hidden md:grid grid-cols-[28px_1.5fr_0.9fr_1fr_0.8fr_0.9fr_0.7fr_32px] gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span />
        <span>Titre</span>
        <span>{mode === 'SNAPSHOT' ? 'Type' : 'Sens'}</span>
        <span>{mode === 'SNAPSHOT' ? 'Arrêté au' : 'Date'}</span>
        <span>Quantité</span>
        <span>{mode === 'SNAPSHOT' ? 'PRU (F)' : 'Cours (F)'}</span>
        <span>Frais (F)</span>
        <span />
      </div>

      <div className="space-y-2">
        {visible.map(row => {
          const res: RowResult | undefined = byId.get(row.rowId);
          const st = STATUS[res?.status ?? 'VALID'];
          const Icon = st.icon;
          const fieldIssue = (f: string) => res?.issues.some(i => i.field === f && i.severity === 'BLOCKING');
          const inputCls = (f: string) =>
            `w-full min-w-0 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${fieldIssue(f) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'}`;
          return (
            <div key={row.rowId} className={`rounded-xl border border-gray-200 p-3 ${res ? st.bg : ''}`}>
              <div className="grid grid-cols-2 md:grid-cols-[28px_1.5fr_0.9fr_1fr_0.8fr_0.9fr_0.7fr_32px] gap-2 items-center">
                <span className="col-span-2 md:col-span-1 flex items-center gap-2" title={res ? st.label : 'En attente'}>
                  {res ? <Icon className={`w-5 h-5 ${st.cls}`} /> : <span className="w-5 h-5 rounded-full border-2 border-gray-200" />}
                  <span className="md:hidden text-xs font-medium text-gray-500">{res ? st.label : ''}{res?.resolvedTicker && res.resolvedTicker !== row.ticker.toUpperCase() ? ` · ${res.resolvedTicker}` : ''}</span>
                </span>
                <input
                  aria-label="Titre"
                  list={listId}
                  value={row.ticker}
                  onChange={e => update(row.rowId, { ticker: e.target.value })}
                  placeholder="SNTS ou Sonatel"
                  className={`${inputCls('ticker')} col-span-2 md:col-span-1`}
                />
                {mode === 'SNAPSHOT' || row.side === 'OPENING' ? (
                  <span className="text-sm text-gray-600 px-1">Ligne d'ouverture</span>
                ) : (
                  <select aria-label="Sens" value={row.side} onChange={e => update(row.rowId, { side: e.target.value as DraftRow['side'] })} className={inputCls('side')}>
                    <option value="BUY">Achat</option>
                    <option value="SELL">Vente</option>
                  </select>
                )}
                <input aria-label="Date" type="date" value={row.date} max={new Date().toISOString().slice(0, 10)} onChange={e => update(row.rowId, { date: e.target.value })} className={inputCls('date')} />
                <input aria-label="Quantité" inputMode="numeric" value={row.quantity ?? ''} onChange={e => update(row.rowId, { quantity: num(e.target.value) })} placeholder="Qté" className={inputCls('quantity')} />
                <input aria-label="Cours" inputMode="decimal" value={row.price ?? ''} onChange={e => update(row.rowId, { price: num(e.target.value) })} placeholder={mode === 'SNAPSHOT' ? 'PRU' : 'Cours'} className={inputCls('price')} />
                <input aria-label="Frais" inputMode="decimal" value={row.fees ?? ''} onChange={e => update(row.rowId, { fees: num(e.target.value) })} placeholder="0" className={inputCls('fees')} />
                {allowRemove ? (
                  <button onClick={() => remove(row.rowId)} className="justify-self-end p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label="Supprimer la ligne">
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : <span />}
              </div>

              {row.splitAdjusted && (
                <p className="mt-2 text-xs text-indigo-700">
                  Ajusté d'un split — saisie d'origine : {fmt(row.originalQuantity)} titres à {fmt(row.originalPrice)} F
                </p>
              )}

              {res && res.issues.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {res.issues.map((issue, k) => (
                    <li key={k} className="text-sm">
                      <span className={issue.severity === 'BLOCKING' ? 'text-red-700' : 'text-amber-800'}>
                        {issue.severity === 'BLOCKING' ? '⛔' : '⚠️'} {issue.message}
                      </span>
                      {issue.fixes && issue.fixes.length > 0 && (
                        <span className="ml-1 inline-flex flex-wrap gap-1.5 align-middle">
                          {issue.fixes.map((f, j) => (
                            <button
                              key={j}
                              onClick={() => fix(row.rowId, f)}
                              className="inline-flex items-center gap-1 rounded-md bg-white border border-indigo-200 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                            >
                              <Wand2 className="w-3 h-3" /> {f.label}
                            </button>
                          ))}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
        {visible.length === 0 && <p className="text-sm text-gray-500 px-3 py-6 text-center">Aucune ligne dans ce filtre.</p>}
      </div>

      {allowAdd && (
        <button
          onClick={() => onChange([...rows, emptyRow(mode, defaultDate)])}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" /> Ajouter une ligne
        </button>
      )}

      {report && report.checks.length > 0 && (
        <div className="space-y-1.5">
          {report.checks.map((c, i) => (
            <p key={i} className={`text-sm rounded-lg px-3 py-2 ${c.severity === 'BLOCKING' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>
              {c.severity === 'BLOCKING' ? '⛔' : '⚠️'} {c.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
