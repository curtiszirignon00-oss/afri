// src/pages/RealPortfolioPage.tsx
// Dashboard du portefeuille RÉEL importé. Surface distincte du dashboard de
// simulation (/dashboard), qui n'est pas modifié. Reporting factuel uniquement :
// performance, allocation, exposition — aucune recommandation (CREPMG).

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Wallet, Upload, PlusCircle, Settings, Pencil, Check, X, TrendingUp, TrendingDown, PieChart as PieIcon,
  Activity, Layers, AlertTriangle, Camera, ListOrdered, Share2, Loader2,
} from 'lucide-react';
import {
  useRealDashboard, useRealHistory, useRealTransactions, useUpdateRealCash, useUpdateRealSettings, useDeleteRealPortfolio,
} from '../hooks/useRealPortfolio';
import type { DraftRow, RealPositionLine } from '../services/realPortfolioApi';
import { newRowId } from '../components/real-portfolio/draft';
import RealValueChart from '../components/real-portfolio/RealValueChart';
import RealPositionsTable from '../components/real-portfolio/RealPositionsTable';
import RealTransactionsList from '../components/real-portfolio/RealTransactionsList';
import TransactionEditorModal from '../components/real-portfolio/TransactionEditorModal';
import SimbaRealReport from '../components/real-portfolio/SimbaRealReport';
import { sharePercentOnly } from '../components/real-portfolio/share';
import DashboardPriceAlerts from '../components/price-alerts/DashboardPriceAlerts';
import DashboardWebinarWidget from '../components/dashboard/DashboardWebinarWidget';
import { apiFetch } from '../hooks/useApi';
import type { MarketIndex } from '../types';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const signed = (n: number) => `${n >= 0 ? '+' : ''}${fmt(n)}`;
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)} %`;
const today = () => new Date().toISOString().slice(0, 10);

interface EditorState { title: string; rows: DraftRow[] }

export default function RealPortfolioPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useRealDashboard();
  const hasPortfolio = !!data;
  const history = useRealHistory(hasPortfolio);
  const txs = useRealTransactions(hasPortfolio);
  const updateCash = useUpdateRealCash();
  const updateSettings = useUpdateRealSettings();
  const deletePortfolio = useDeleteRealPortfolio();

  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editingCash, setEditingCash] = useState(false);
  const [cashInput, setCashInput] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [indices, setIndices] = useState<MarketIndex[]>([]);

  useEffect(() => {
    apiFetch<MarketIndex[]>('/indices/latest').then(setIndices).catch(() => setIndices([]));
  }, []);

  const lineAllocation = useMemo(() => {
    if (!data) return [];
    const top = data.positions.slice(0, 8).map(p => ({ name: p.ticker, value: p.marketValue, weight: p.weight }));
    const rest = data.positions.slice(8).reduce((s, p) => s + p.marketValue, 0);
    if (rest > 0) top.push({ name: 'Autres', value: rest, weight: data.totals.totalValue ? (rest / data.totals.totalValue) * 100 : 0 });
    if (data.cash.amount > 0) top.push({ name: 'Liquidités', value: data.cash.amount, weight: data.totals.totalValue ? (data.cash.amount / data.totals.totalValue) * 100 : 0 });
    return top;
  }, [data]);

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }
  if (error) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-red-700">{(error as Error).message}</div>;
  }

  // ─── Aucun portefeuille réel : invitation à importer ─────────────────────
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <span className="inline-flex p-3 rounded-2xl bg-indigo-100 text-indigo-700"><Wallet className="w-8 h-8" /></span>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Suivez votre vrai portefeuille BRVM</h1>
          <p className="mt-2 text-gray-600">
            Importez vos positions ou votre relevé de transactions. Chaque ligne est vérifiée contre l'historique BRVM, puis valorisée au dernier cours.
            Votre simulateur reste inchangé.
          </p>
          <div className="mt-8 grid sm:grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl bg-white border border-gray-200 p-5">
              <Camera className="w-6 h-6 text-indigo-600" />
              <p className="mt-2 font-semibold text-gray-900">Snapshot</p>
              <p className="text-sm text-gray-600">Titre, quantité, PRU : en deux minutes.</p>
            </div>
            <div className="rounded-2xl bg-white border border-gray-200 p-5">
              <ListOrdered className="w-6 h-6 text-indigo-600" />
              <p className="mt-2 font-semibold text-gray-900">Relevé complet</p>
              <p className="text-sm text-gray-600">Transactions datées : historique et performance exacts.</p>
            </div>
          </div>
          <button onClick={() => navigate('/portefeuille-reel/import')} className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700">
            <Upload className="w-5 h-5" /> Importer mon portefeuille
          </button>
          <p className="mt-4 text-xs text-gray-500">Données privées · aucun classement · reporting factuel, sans recommandation d'investissement.</p>
        </div>
      </div>
    );
  }

  const t = data.totals;
  const isSnapshot = data.portfolio.importMode === 'SNAPSHOT';

  const openNewTx = (preset?: Partial<DraftRow>) => setEditor({
    title: preset?.side === 'SELL' ? `Enregistrer une vente${preset.ticker ? ` — ${preset.ticker}` : ''}` : 'Ajouter une transaction',
    rows: [{ rowId: newRowId(), ticker: '', side: 'BUY', date: today(), quantity: null, price: null, fees: null, ...preset }],
  });
  const onBuy = (p: RealPositionLine) => openNewTx({ ticker: p.ticker, side: 'BUY', price: p.lastPrice });
  const onSell = (p: RealPositionLine) => openNewTx({ ticker: p.ticker, side: 'SELL', quantity: p.quantity, price: p.lastPrice });

  const saveCash = () => {
    const amount = Number(cashInput.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount < 0) { toast.error('Montant invalide.'); return; }
    updateCash.mutate(amount, {
      onSuccess: () => { setEditingCash(false); toast.success('Liquidité mise à jour.'); },
      onError: (e: Error) => toast.error(e.message),
    });
  };

  const rename = () => {
    setMenuOpen(false);
    const name = window.prompt('Nom du portefeuille', data.portfolio.name);
    if (name && name.trim()) updateSettings.mutate({ name: name.trim() });
  };
  const remove = () => {
    setMenuOpen(false);
    if (!window.confirm('Supprimer définitivement ce portefeuille réel et toutes ses transactions ?')) return;
    deletePortfolio.mutate(undefined, { onSuccess: () => toast.success('Portefeuille supprimé.') });
  };

  const kpiTone = t.unrealizedPnl >= 0 ? 'text-emerald-300' : 'text-red-300';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Portefeuille réel</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">{data.portfolio.name}</h1>
            <p className="text-sm text-gray-500">
              {data.portfolio.broker ? `${data.portfolio.broker} · ` : ''}{isSnapshot ? 'Snapshot' : 'Relevé de transactions'} · valorisé au cours BRVM du {new Date(data.priceDate).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 relative">
            <button onClick={() => openNewTx()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
              <PlusCircle className="w-4 h-4" /> Transaction
            </button>
            <button onClick={() => navigate('/portefeuille-reel/import')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50">
              <Upload className="w-4 h-4" /> {isSnapshot ? 'Importer mon relevé' : 'Importer'}
            </button>
            <button onClick={() => setMenuOpen(v => !v)} className="p-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50" aria-label="Réglages">
              <Settings className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20" onMouseLeave={() => setMenuOpen(false)}>
                <button onClick={rename} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Renommer</button>
                <button onClick={remove} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Supprimer le portefeuille</button>
              </div>
            )}
          </div>
        </div>

        {data.flaggedCount > 0 && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {data.flaggedCount} transaction(s) importée(s) avec un signalement de cohérence (⚠️). Vérifiez-les dans l'historique ci-dessous.
          </p>
        )}

        {/* KPI principal */}
        <div className="rounded-2xl p-6 md:p-8 text-white bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-700 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-indigo-200 flex items-center gap-2"><Wallet className="w-4 h-4" /> Valeur totale</p>
              <p className="text-4xl md:text-5xl font-extrabold mt-1">{fmt(t.totalValue)} F</p>
              <p className={`mt-2 font-semibold flex items-center gap-1.5 ${kpiTone}`}>
                {t.unrealizedPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {signed(t.unrealizedPnl)} F latents ({pct(t.unrealizedPct)})
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-3">
                <p className="text-xs text-indigo-200">Aujourd'hui</p>
                <p className={`text-lg font-bold ${t.dayChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{signed(t.dayChange)} F</p>
                <p className={`text-xs ${t.dayChange >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{pct(t.dayChangePct)}</p>
              </div>
              <button
                onClick={() => sharePercentOnly(`Mon portefeuille BRVM : ${pct(t.unrealizedPct)} de plus-value latente. Suivi sur AfriBourse.`)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20" title="Partager (pourcentages uniquement)"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <p className="text-xs text-indigo-200">💰 Liquidités</p>
              {editingCash ? (
                <div className="mt-1 flex items-center gap-1">
                  <input autoFocus inputMode="numeric" value={cashInput} onChange={e => setCashInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveCash()} className="w-full min-w-0 rounded-md px-2 py-1 text-gray-900 text-sm" />
                  <button onClick={saveCash} disabled={updateCash.isPending} className="p-1 rounded bg-emerald-500" aria-label="Valider"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingCash(false)} className="p-1 rounded bg-white/20" aria-label="Annuler"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => { setCashInput(String(Math.round(data.cash.amount))); setEditingCash(true); }} className="mt-1 flex items-center gap-1.5 text-xl font-bold hover:text-indigo-100">
                  {fmt(data.cash.amount)} F <Pencil className="w-3.5 h-3.5 opacity-70" />
                </button>
              )}
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <p className="text-xs text-indigo-200">📊 Titres</p>
              <p className="mt-1 text-xl font-bold">{fmt(t.securitiesValue)} F</p>
              <p className="text-xs text-indigo-200">coût {fmt(t.costBasis)} F</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <p className="text-xs text-indigo-200">✅ Plus-value réalisée</p>
              <p className={`mt-1 text-xl font-bold ${t.realizedPnl >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{signed(t.realizedPnl)} F</p>
            </div>
            <div className="rounded-xl bg-white/10 border border-white/10 p-4">
              <p className="text-xs text-indigo-200">💵 Dividendes estimés</p>
              <p className="mt-1 text-xl font-bold">{fmt(t.dividends)} F</p>
              <p className="text-xs text-indigo-200">opérations référencées</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <RealValueChart points={history.data?.points ?? []} loading={history.isLoading} isSnapshot={isSnapshot} />
            <RealPositionsTable positions={data.positions} onBuy={onBuy} onSell={onSell} />

            {/* Latente vs réalisée */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600" /> Plus-value latente vs réalisée</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Latente (lignes ouvertes)</p>
                  <p className={`text-2xl font-bold ${t.unrealizedPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{signed(t.unrealizedPnl)} F</p>
                  <p className="text-xs text-gray-500">{pct(t.unrealizedPct)} sur un coût de {fmt(t.costBasis)} F</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">Réalisée (ventes)</p>
                  <p className={`text-2xl font-bold ${t.realizedPnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{signed(t.realizedPnl)} F</p>
                  <p className="text-xs text-gray-500">Calculée au PRU moyen pondéré, frais inclus</p>
                </div>
              </div>
            </div>

            <SimbaRealReport />

            <RealTransactionsList
              transactions={txs.data ?? []}
              loading={txs.isLoading}
              onEdit={row => setEditor({ title: `Modifier — ${row.ticker} du ${new Date(row.date).toLocaleDateString('fr-FR')}`, rows: [row] })}
            />

            <DashboardPriceAlerts />
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><PieIcon className="w-5 h-5 text-indigo-600" /> Allocation</h3>
              {lineAllocation.length > 0 ? (
                <>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={lineAllocation} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                          {lineAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => `${fmt(Number(v))} F`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {lineAllocation.map((a, i) => (
                      <li key={a.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="flex-1 text-gray-700">{a.name}</span>
                        <span className="font-medium text-gray-900">{a.weight.toFixed(1)} %</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : <p className="text-gray-500 text-sm">Aucune donnée.</p>}
            </div>

            {/* Exposition sectorielle + concentration (constats, pas de recommandation) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-600" /> Exposition</h3>
              <ul className="space-y-2.5">
                {data.allocationBySector.map(s => (
                  <li key={s.name}>
                    <div className="flex justify-between text-sm"><span className="text-gray-700">{s.name}</span><span className="font-medium">{s.weight.toFixed(1)} %</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, s.weight)}%` }} /></div>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2"><dt className="text-[11px] text-gray-500">Lignes</dt><dd className="font-bold">{t.positionsCount}</dd></div>
                <div className="rounded-lg bg-gray-50 p-2"><dt className="text-[11px] text-gray-500">1re ligne</dt><dd className="font-bold">{t.topWeight.toFixed(1)} %</dd></div>
                <div className="rounded-lg bg-gray-50 p-2" title="Indice de Herfindahl : somme des carrés des poids (1 = une seule ligne)"><dt className="text-[11px] text-gray-500">Herfindahl</dt><dd className="font-bold">{t.herfindahl.toFixed(2)}</dd></div>
              </dl>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600" /> Aperçu du marché</h3>
              {indices.length > 0 ? (
                <div className="space-y-3">
                  {indices.map(ix => (
                    <div key={ix.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-700">{ix.index_name}</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${ix.daily_change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {pct(ix.daily_change_percent)}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{ix.index_value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-500">Aucune donnée d'indice disponible.</p>}
            </div>

            <DashboardWebinarWidget />
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center pb-4">
          Données déclarées par vous et valorisées au dernier cours BRVM disponible. AfriBourse fournit un reporting factuel
          et ne formule aucune recommandation d'investissement personnalisée.
        </p>
      </div>

      {editor && (
        <TransactionEditorModal open title={editor.title} initialRows={editor.rows} onClose={() => setEditor(null)} />
      )}
    </div>
  );
}
