// src/pages/RealPortfolioPage.tsx
// Dashboard du portefeuille RÉEL importé. Surface distincte du dashboard de
// simulation (/dashboard), qui n'est pas modifié. Reporting factuel uniquement :
// performance, allocation, exposition — aucune recommandation (CREPMG).

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Wallet, Upload, PlusCircle, Settings, Pencil, Check, X, TrendingUp, TrendingDown, PieChart as PieIcon,
  Activity, Layers, AlertTriangle, Camera, ListOrdered, Share2, Loader2, Coins, BarChart3, CheckCircle2, Banknote,
} from 'lucide-react';
import {
  useRealDashboard, useRealHistory, useRealTransactions, useUpdateRealCash, useUpdateRealSettings, useDeleteRealPortfolio,
  useRealPortfolioDiscovery, useRecordDiscovery,
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

// Palette lisible sur fond verre sombre (orange en tête, comme la maquette).
const COLORS = ['#fb923c', '#f5f5f4', '#facc15', '#60a5fa', '#34d399', '#f472b6', '#a78bfa', '#2dd4bf', '#a8a29e'];
const GLASS_TOOLTIP = {
  contentStyle: { background: 'rgba(28,25,23,0.85)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff' },
  itemStyle: { color: '#fff' },
  labelStyle: { color: 'rgba(255,255,255,0.7)' },
};
const NAV = [
  { id: 'rp-overview', label: "Vue d'ensemble" },
  { id: 'rp-positions', label: 'Positions' },
  { id: 'rp-simba', label: 'SIMBA' },
  { id: 'rp-transactions', label: 'Transactions' },
  { id: 'rp-exposure', label: 'Exposition' },
];
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const fmtShort = (n: number) => (Math.abs(n) >= 1e9 ? `${(n / 1e9).toFixed(2)} Md` : Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)} k` : `${Math.round(n)}`);
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

  // Visiter la page = fonctionnalité découverte : l'encart « Nouveau » et la pastille du menu disparaissent.
  const discovery = useRealPortfolioDiscovery(true);
  const recordDiscovery = useRecordDiscovery();
  const bannerPending = discovery.data ? !discovery.data.bannerDismissed : false;
  useEffect(() => {
    if (bannerPending) recordDiscovery.mutate('banner_dismissed');
  }, [bannerPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const lineAllocation = useMemo(() => {
    if (!data) return [];
    const top = data.positions.slice(0, 8).map(p => ({ name: p.ticker, value: p.marketValue, weight: p.weight }));
    const rest = data.positions.slice(8).reduce((s, p) => s + p.marketValue, 0);
    if (rest > 0) top.push({ name: 'Autres', value: rest, weight: data.totals.totalValue ? (rest / data.totals.totalValue) * 100 : 0 });
    if (data.cash.amount > 0) top.push({ name: 'Liquidités', value: data.cash.amount, weight: data.totals.totalValue ? (data.cash.amount / data.totals.totalValue) * 100 : 0 });
    return top;
  }, [data]);

  if (isLoading) {
    return <div className="glass-theme min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-300" /></div>;
  }
  if (error) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-red-700">{(error as Error).message}</div>;
  }

  // ─── Aucun portefeuille réel : invitation à importer ─────────────────────
  if (!data) {
    return (
      <div className="glass-theme min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="glass-card rounded-3xl p-6 md:p-10 text-center">
            <span className="inline-flex p-3 rounded-2xl bg-white/15 border border-white/15 text-orange-200"><Wallet className="w-8 h-8" /></span>
            <h1 className="mt-4 text-3xl font-bold">Suivez votre vrai portefeuille BRVM</h1>
            <p className="mt-2 text-white/70">
              Importez vos positions ou votre relevé de transactions. Chaque ligne est vérifiée contre l'historique BRVM, puis valorisée au dernier cours.
              Votre simulateur reste inchangé.
            </p>
            <div className="mt-8 grid sm:grid-cols-2 gap-3 text-left">
              <div className="glass-inset rounded-2xl p-5">
                <Camera className="w-6 h-6 text-orange-300" />
                <p className="mt-2 font-semibold">Snapshot</p>
                <p className="text-sm text-white/65">Titre, quantité, PRU : en deux minutes.</p>
              </div>
              <div className="glass-inset rounded-2xl p-5">
                <ListOrdered className="w-6 h-6 text-orange-300" />
                <p className="mt-2 font-semibold">Relevé complet</p>
                <p className="text-sm text-white/65">Transactions datées : historique et performance exacts.</p>
              </div>
            </div>
            <button onClick={() => navigate('/portefeuille-reel/import')} className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-stone-900 font-semibold hover:bg-white/90 shadow-lg shadow-black/25">
              <Upload className="w-5 h-5" /> Importer mon portefeuille
            </button>
            <p className="mt-4 text-xs text-white/50">Données privées · aucun classement · reporting factuel, sans recommandation d'investissement.</p>
          </div>
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

  const tone = (n: number) => (n >= 0 ? 'text-emerald-300' : 'text-rose-300');
  const badge = (n: number) => (n >= 0 ? 'bg-emerald-400/15 text-emerald-200 border-emerald-300/20' : 'bg-rose-400/15 text-rose-200 border-rose-300/20');

  return (
    <>
      <div className="glass-theme min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-5 pb-28">
          {/* En-tête */}
          <section id="rp-overview" className="glass-card relative z-30 rounded-3xl p-5 md:p-7 scroll-mt-24">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300/90">Portefeuille réel</p>
                <h1 className="mt-1 text-2xl md:text-3xl font-bold truncate">{data.portfolio.name}</h1>
                <p className="mt-1 text-sm text-white/60">
                  {data.portfolio.broker ? `${data.portfolio.broker} · ` : ''}{isSnapshot ? 'Snapshot' : 'Relevé de transactions'} · valorisé au cours BRVM du {new Date(data.priceDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 relative">
                <button onClick={() => openNewTx()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-stone-900 text-sm font-semibold hover:bg-white/90 shadow-lg shadow-black/20">
                  <PlusCircle className="w-4 h-4" /> Transaction
                </button>
                <button onClick={() => navigate('/portefeuille-reel/import')} className="glass-pill inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20">
                  <Upload className="w-4 h-4" /> {isSnapshot ? 'Importer mon relevé' : 'Importer'}
                </button>
                <button
                  onClick={() => sharePercentOnly(`Mon portefeuille BRVM : ${pct(t.unrealizedPct)} de plus-value latente. Suivi sur AfriBourse.`)}
                  className="glass-pill p-2 rounded-full hover:bg-white/20" title="Partager (pourcentages uniquement)"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => setMenuOpen(v => !v)} className="glass-pill p-2 rounded-full hover:bg-white/20" aria-label="Réglages">
                  <Settings className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl py-1 bg-stone-900/90 border border-white/15 backdrop-blur-xl shadow-2xl" onMouseLeave={() => setMenuOpen(false)}>
                    <button onClick={rename} className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">Renommer</button>
                    <button onClick={remove} className="w-full text-left px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/15">Supprimer le portefeuille</button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-white/60 flex items-center gap-2"><Wallet className="w-4 h-4" /> Valeur totale</p>
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight mt-1">{fmt(t.totalValue)} <span className="text-white/60 text-2xl md:text-3xl font-bold">F</span></p>
                <p className={`mt-2 text-sm font-semibold flex items-center gap-1.5 ${tone(t.unrealizedPnl)}`}>
                  {t.unrealizedPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {signed(t.unrealizedPnl)} F latents ({pct(t.unrealizedPct)})
                </p>
              </div>
              <div className="glass-inset rounded-2xl px-4 py-3 min-w-[9rem]">
                <p className="text-xs text-white/60">Aujourd'hui</p>
                <p className={`text-lg font-bold ${tone(t.dayChange)}`}>{signed(t.dayChange)} F</p>
                <span className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badge(t.dayChangePct)}`}>{pct(t.dayChangePct)}</span>
              </div>
            </div>
          </section>

          {data.flaggedCount > 0 && (
            <p className="glass-card flex items-start gap-2 rounded-2xl px-4 py-3 text-sm text-amber-100 !border-amber-300/30">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-300" />
              {data.flaggedCount} transaction(s) importée(s) avec un signalement de cohérence (⚠️). Vérifiez-les dans l'historique ci-dessous.
            </p>
          )}

          {/* Cartes KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="glass-card rounded-2xl p-4 md:p-5 transition-transform hover:-translate-y-1">
              <StatHead icon={<Coins className="w-4 h-4" />} label="Liquidités" />
              {editingCash ? (
                <div className="mt-3 flex items-center gap-1">
                  <input autoFocus inputMode="numeric" value={cashInput} onChange={e => setCashInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveCash()} className="glass-input w-full min-w-0 rounded-lg px-2 py-1 text-sm" />
                  <button onClick={saveCash} disabled={updateCash.isPending} className="p-1 rounded-md bg-emerald-500/80 hover:bg-emerald-500" aria-label="Valider"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingCash(false)} className="p-1 rounded-md bg-white/15 hover:bg-white/25" aria-label="Annuler"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <button onClick={() => { setCashInput(String(Math.round(data.cash.amount))); setEditingCash(true); }} className="mt-3 flex items-center gap-1.5 text-xl md:text-2xl font-bold hover:text-orange-200">
                  {fmt(data.cash.amount)} F <Pencil className="w-3.5 h-3.5 opacity-60" />
                </button>
              )}
              <p className="mt-1 text-xs text-white/50">cliquer pour modifier</p>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-5 transition-transform hover:-translate-y-1">
              <StatHead icon={<BarChart3 className="w-4 h-4" />} label="Titres" />
              <p className="mt-3 text-xl md:text-2xl font-bold">{fmt(t.securitiesValue)} F</p>
              <p className="mt-1 text-xs text-white/50">coût {fmt(t.costBasis)} F</p>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-5 transition-transform hover:-translate-y-1">
              <StatHead icon={<CheckCircle2 className="w-4 h-4" />} label="Plus-value réalisée" />
              <p className={`mt-3 text-xl md:text-2xl font-bold ${tone(t.realizedPnl)}`}>{signed(t.realizedPnl)} F</p>
              <p className="mt-1 text-xs text-white/50">au PRU moyen pondéré</p>
            </div>
            <div className="glass-card rounded-2xl p-4 md:p-5 transition-transform hover:-translate-y-1">
              <StatHead icon={<Banknote className="w-4 h-4" />} label="Dividendes estimés" />
              <p className="mt-3 text-xl md:text-2xl font-bold">{fmt(t.dividends)} F</p>
              <p className="mt-1 text-xs text-white/50">opérations référencées</p>
            </div>
          </div>

          {/* Courbe + allocation */}
          <div className="grid lg:grid-cols-3 gap-4 md:gap-5">
            <div className="lg:col-span-2 min-w-0">
              <RealValueChart points={history.data?.points ?? []} loading={history.isLoading} isSnapshot={isSnapshot} />
            </div>
            <div className="glass-card rounded-3xl p-5 md:p-6 min-w-0">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><PieIcon className="w-5 h-5 text-orange-300" /> Allocation</h3>
              {lineAllocation.length > 0 ? (
                <>
                  <div className="h-52 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={lineAllocation} dataKey="value" nameKey="name" innerRadius={62} outerRadius={86} paddingAngle={3} cornerRadius={6} stroke="none">
                          {lineAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={v => `${fmt(Number(v))} F`} {...GLASS_TOOLTIP} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[11px] text-white/55">Valeur totale</span>
                      <span className="text-lg font-bold">{fmtShort(t.totalValue)} F</span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2.5 text-sm">
                    {lineAllocation.map((a, i) => (
                      <li key={a.name}>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="flex-1 text-white/80">{a.name}</span>
                          <span className="font-semibold">{a.weight.toFixed(1)} %</span>
                        </div>
                        <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, a.weight)}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : <p className="text-white/55 text-sm">Aucune donnée.</p>}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-5">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-4 md:space-y-5 min-w-0">
              <section id="rp-positions" className="scroll-mt-24">
                <RealPositionsTable positions={data.positions} onBuy={onBuy} onSell={onSell} />
              </section>

              {/* Latente vs réalisée */}
              <div className="glass-card rounded-3xl p-5 md:p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-orange-300" /> Plus-value latente vs réalisée</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="glass-inset rounded-2xl p-4">
                    <p className="text-sm text-white/65">Latente (lignes ouvertes)</p>
                    <p className={`text-2xl font-bold ${tone(t.unrealizedPnl)}`}>{signed(t.unrealizedPnl)} F</p>
                    <p className="text-xs text-white/50">{pct(t.unrealizedPct)} sur un coût de {fmt(t.costBasis)} F</p>
                  </div>
                  <div className="glass-inset rounded-2xl p-4">
                    <p className="text-sm text-white/65">Réalisée (ventes)</p>
                    <p className={`text-2xl font-bold ${tone(t.realizedPnl)}`}>{signed(t.realizedPnl)} F</p>
                    <p className="text-xs text-white/50">Calculée au PRU moyen pondéré, frais inclus</p>
                  </div>
                </div>
              </div>

              <section id="rp-simba" className="scroll-mt-24">
                <SimbaRealReport />
              </section>

              <section id="rp-transactions" className="scroll-mt-24">
                <RealTransactionsList
                  transactions={txs.data ?? []}
                  loading={txs.isLoading}
                  onEdit={row => setEditor({ title: `Modifier — ${row.ticker} du ${new Date(row.date).toLocaleDateString('fr-FR')}`, rows: [row] })}
                />
              </section>

              <div className="glass-card glass-adapt rounded-3xl overflow-hidden [&>*]:!bg-transparent [&>*]:!border-0 [&>*]:!shadow-none">
                <DashboardPriceAlerts />
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-4 md:space-y-5 min-w-0">
              {/* Exposition sectorielle + concentration (constats, pas de recommandation) */}
              <section id="rp-exposure" className="glass-card rounded-3xl p-5 md:p-6 scroll-mt-24">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-orange-300" /> Exposition</h3>
                <ul className="space-y-3">
                  {data.allocationBySector.map(s => (
                    <li key={s.name}>
                      <div className="flex justify-between text-sm"><span className="text-white/80">{s.name}</span><span className="font-semibold">{s.weight.toFixed(1)} %</span></div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-amber-200" style={{ width: `${Math.min(100, s.weight)}%` }} /></div>
                    </li>
                  ))}
                </ul>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="glass-inset rounded-xl p-2"><dt className="text-[11px] text-white/55">Lignes</dt><dd className="font-bold">{t.positionsCount}</dd></div>
                  <div className="glass-inset rounded-xl p-2"><dt className="text-[11px] text-white/55">1re ligne</dt><dd className="font-bold">{t.topWeight.toFixed(1)} %</dd></div>
                  <div className="glass-inset rounded-xl p-2" title="Indice de Herfindahl : somme des carrés des poids (1 = une seule ligne)"><dt className="text-[11px] text-white/55">Herfindahl</dt><dd className="font-bold">{t.herfindahl.toFixed(2)}</dd></div>
                </dl>
              </section>

              <section className="glass-card rounded-3xl p-5 md:p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-orange-300" /> Aperçu du marché</h3>
                {indices.length > 0 ? (
                  <div className="space-y-3">
                    {indices.map(ix => (
                      <div key={ix.id} className="glass-inset p-3 rounded-2xl">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-white/80">{ix.index_name}</p>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge(ix.daily_change_percent)}`}>
                            {pct(ix.daily_change_percent)}
                          </span>
                        </div>
                        <p className="text-2xl font-bold">{ix.index_value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-white/55">Aucune donnée d'indice disponible.</p>}
              </section>

              {/* Pas d'habillage verre : backdrop-filter piégerait sa modale « fixed ». */}
              <DashboardWebinarWidget />
            </div>
          </div>

          <p className="text-xs text-white/45 text-center pb-4">
            Données déclarées par vous et valorisées au dernier cours BRVM disponible. AfriBourse fournit un reporting factuel
            et ne formule aucune recommandation d'investissement personnalisée.
          </p>
        </div>

        {/* Barre de navigation flottante (ancres de la page) */}
        <nav className="hidden md:flex fixed bottom-5 left-1/2 -translate-x-1/2 z-30 glass-pill !bg-stone-900/40 rounded-full p-1.5 gap-1 shadow-2xl shadow-black/40">
          {NAV.map(n => (
            <a key={n.id} href={`#${n.id}`} className="px-4 py-1.5 rounded-full text-sm text-white/75 hover:text-stone-900 hover:bg-white transition-colors">{n.label}</a>
          ))}
          <button onClick={() => openNewTx()} className="ml-1 w-8 h-8 rounded-full bg-white text-stone-900 flex items-center justify-center hover:bg-white/90" aria-label="Ajouter une transaction">
            <PlusCircle className="w-4 h-4" />
          </button>
        </nav>
      </div>

      {editor && (
        <TransactionEditorModal open title={editor.title} initialRows={editor.rows} onClose={() => setEditor(null)} />
      )}
    </>
  );
}

function StatHead({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-full bg-white/15 border border-white/15 flex items-center justify-center text-orange-200">{icon}</span>
      <span className="text-sm text-white/70">{label}</span>
    </div>
  );
}
