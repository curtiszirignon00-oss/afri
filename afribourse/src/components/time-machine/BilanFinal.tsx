import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Trophy, Repeat, ArrowRight, TrendingUp, TrendingDown,
  Wallet, BarChart3, Star, Target, Clock,
} from 'lucide-react';
import KofiBubble from './KofiBubble';
import ScenarioFeedback from './ScenarioFeedback';

interface StepSummary {
  year: number;
  pfVal: number;
  perfTotal: number;
  perfCapital: number;
  dividends: number;
  capital: number;
}

interface TickerRow {
  ticker: string;
  qty: number;
  prix: number;
  valeur: number;
  gain: number;
  gainPct: number;
}

interface Props {
  scenarioTitle: string;
  years: number[];
  steps: StepSummary[];
  cagr: number;
  totalReturn: number;
  finalValue: number;
  totalDividends: number;
  startBudget: number;
  lastByTicker: TickerRow[];
  userName: string | null;
  sessionId: string;
  kofiRecap: string | null;
  kofiLoading: boolean;
  onRequestRecap: () => void;
  onRestart?: () => void;
  onExplore: () => void;
}

const PIE_COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#06b6d4'];

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'amber' | 'emerald' | 'violet' | 'red' | 'default' }) {
  const accentCls = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    red: 'bg-red-50 border-red-200 text-red-600',
    default: 'bg-white border-gray-100 text-gray-900',
  }[accent ?? 'default'];

  return (
    <div className={`border rounded-2xl p-4 flex flex-col gap-1 shadow-sm ${accentCls}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-2xl font-extrabold tabular-nums leading-none">{value}</p>
      {sub && <p className="text-[11px] opacity-50 font-medium">{sub}</p>}
    </div>
  );
}

function PerfBadge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${
      pos ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
    }`}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('fr-FR');
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="font-semibold text-gray-800 tabular-nums ml-auto pl-4">
            {Math.round(p.value).toLocaleString('fr-FR')} F
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BilanFinal({
  scenarioTitle,
  years,
  steps,
  cagr,
  totalReturn,
  finalValue,
  totalDividends,
  startBudget,
  lastByTicker,
  userName,
  sessionId,
  kofiRecap,
  kofiLoading,
  onRequestRecap,
  onRestart,
  onExplore,
}: Props) {
  const isPos = totalReturn >= 0;
  const cagrPos = cagr >= 0;

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const nbYears = lastYear - firstYear;

  // Data for portfolio evolution chart (same recharts pattern as Dashboard)
  const chartData = steps.map((s, i) => {
    const savingsGrowth = (startBudget + startBudget * i) * Math.pow(1.03, i);
    return {
      year: String(s.year),
      Portefeuille: s.pfVal,
      Dividendes: s.dividends,
      Épargne: Math.round(savingsGrowth),
    };
  });

  // Pie chart — final allocation
  const pieData = lastByTicker.filter(t => t.qty > 0).map(t => ({
    name: t.ticker,
    value: Math.round(t.valeur),
  }));

  // Savings comparison numbers (for table)
  const savingsFinalValue = (startBudget + startBudget * (steps.length - 1)) * Math.pow(1.03, steps.length - 1);
  const savingsReturn = ((savingsFinalValue / (startBudget * steps.length)) - 1) * 100;

  const firstName = userName?.split(' ')[0] ?? null;

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
          <Trophy className="w-7 h-7 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Bilan Time Machine</p>
          <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
            {firstName ? `${firstName}, voici vos résultats` : 'Votre bilan final'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {scenarioTitle} · <span className="font-semibold text-amber-600">{firstYear} → {lastYear}</span> ({nbYears} ans)
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: steps.length }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-amber-400 opacity-80" />
          ))}
        </div>
      </div>

      {/* ── KPI Cards (dashboard-style) ──────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Valeur finale"
          value={`${fmt(finalValue)} F`}
          sub="portefeuille BRVM"
          accent="amber"
        />
        <KpiCard
          label="Rendement total"
          value={`${isPos ? '+' : ''}${totalReturn.toFixed(1)}%`}
          sub="dividendes inclus"
          accent={isPos ? 'emerald' : 'red'}
        />
        <KpiCard
          label="CAGR annualisé"
          value={`${cagrPos ? '+' : ''}${cagr.toFixed(2)}%`}
          sub="par an"
          accent={cagrPos ? 'emerald' : 'red'}
        />
        <KpiCard
          label="Dividendes perçus"
          value={`${fmt(totalDividends)} F`}
          sub="revenus cumulés"
          accent="violet"
        />
      </div>

      {/* ── Portfolio Evolution Chart (recharts AreaChart — Dashboard pattern) ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
            <h2 className="text-base font-bold text-gray-900">Évolution du portefeuille</h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-gray-500">Portefeuille</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />
              <span className="text-gray-500">Dividendes</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm border-2 border-dashed border-gray-400 inline-block" />
              <span className="text-gray-500">Épargne 3%</span>
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="gradPortefeuille" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="gradDividendes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(v)}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Épargne"
              stroke="#9ca3af"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="none"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="Dividendes"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#gradDividendes)"
              dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="Portefeuille"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#gradPortefeuille)"
              dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Step Journey + Comparison — 2 col grid ──────────── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Step by step */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-5 bg-sky-500 rounded-full inline-block" />
            <h2 className="text-sm font-bold text-gray-900">Parcours année par année</h2>
          </div>
          <div className="space-y-1.5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-sm font-bold text-gray-800">{s.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 tabular-nums">{fmt(s.pfVal)} F</span>
                  <PerfBadge value={s.perfTotal} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full inline-block" />
            <h2 className="text-sm font-bold text-gray-900">Vs alternatives</h2>
          </div>
          <div className="space-y-2 flex-1">
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${isPos ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800">Votre portefeuille BRVM</p>
                  <p className="text-[10px] text-gray-500">{fmt(finalValue)} FCFA final</p>
                </div>
              </div>
              <PerfBadge value={totalReturn} />
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-700">Livret d'épargne (3%/an)</p>
                  <p className="text-[10px] text-gray-500">{fmt(savingsFinalValue)} FCFA estimé</p>
                </div>
              </div>
              <PerfBadge value={savingsReturn} />
            </div>

            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-700">Cash (0% rendement)</p>
                  <p className="text-[10px] text-gray-500">{fmt(startBudget * steps.length)} FCFA nominal</p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400">0.0%</span>
            </div>
          </div>

          {/* Delta highlight */}
          {isPos && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <p className="text-[11px] text-amber-700 font-semibold text-center">
                +{fmt(finalValue - Math.round(savingsFinalValue))} FCFA de plus qu'un livret d'épargne
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Final Positions (dashboard table style) ─────────── */}
      {lastByTicker.filter(t => t.qty > 0).length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 bg-violet-500 rounded-full inline-block" />
              <h2 className="text-sm font-bold text-gray-900">Positions finales — {lastYear}</h2>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{lastByTicker.filter(t => t.qty > 0).length} titres</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Titre</th>
                    <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Qté</th>
                    <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Valeur</th>
                    <th className="text-right px-3 py-2.5 text-[10px] text-gray-500 uppercase font-bold tracking-widest">Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lastByTicker
                    .filter(t => t.qty > 0)
                    .sort((a, b) => b.valeur - a.valeur)
                    .map(row => (
                      <tr key={row.ticker} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-gray-900 text-xs">{row.ticker}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-500 text-xs tabular-nums">{row.qty}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 text-xs tabular-nums font-medium">
                          {fmt(row.valeur)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <PerfBadge value={row.gainPct} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pie chart allocation */}
            {pieData.length > 0 && (
              <div className="flex flex-col items-center justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Répartition</p>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={72}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${fmt(value)} F`, '']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                  {pieData.map((d, i) => (
                    <span key={d.name} className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Simba Recap ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
          <h2 className="text-sm font-bold text-gray-900">Bilan Simba</h2>
        </div>
        <KofiBubble
          message={kofiRecap}
          loading={kofiLoading}
          mode="recap"
          onRequest={!kofiRecap ? onRequestRecap : undefined}
          buttonLabel="Obtenir l'analyse Simba"
        />
      </div>

      {/* ── Feedback utilisateur ─────────────────────────────── */}
      <ScenarioFeedback sessionId={sessionId} scenarioTitle={scenarioTitle} />

      {/* ── Achievement banner ──────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-amber-100 uppercase tracking-widest">Scénario complété</p>
          <p className="text-sm font-bold text-white mt-0.5 truncate">{scenarioTitle}</p>
          <p className="text-[11px] text-amber-100 mt-0.5">
            {steps.length} étapes · {nbYears} ans · CAGR {cagrPos ? '+' : ''}{cagr.toFixed(2)}%/an
          </p>
        </div>
      </div>

      {/* ── CTAs ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onExplore}
          className="group relative overflow-hidden flex-1 flex items-center justify-center gap-2.5 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-amber-500/30 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          <ArrowRight className="w-4 h-4" />
          Explorer d'autres scénarios
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl transition-all duration-200 hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Repeat className="w-4 h-4" />
            Rejouer ce scénario
          </button>
        )}
      </div>
    </div>
  );
}
