// src/components/real-portfolio/RealValueChart.tsx
// Évolution de la valeur des titres vs coût de revient (cours BRVM du jour,
// splits vérifiés appliqués). La liquidité actuelle est ajoutée en option.

import { useMemo, useState } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LineChart as ChartIcon } from 'lucide-react';
import type { HistoryPoint } from '../../services/realPortfolioApi';

const FILTERS = [
  { key: '1M', days: 31 },
  { key: '3M', days: 92 },
  { key: '6M', days: 183 },
  { key: '1A', days: 366 },
  { key: 'MAX', days: Infinity },
] as const;

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');
const fmtShort = (n: number) => (Math.abs(n) >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : Math.abs(n) >= 1e3 ? `${Math.round(n / 1e3)} k` : `${Math.round(n)}`);

interface Props {
  points: HistoryPoint[];
  loading?: boolean;
  isSnapshot: boolean;
}

export default function RealValueChart({ points, loading, isSnapshot }: Props) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('MAX');

  const data = useMemo(() => {
    const f = FILTERS.find(x => x.key === filter)!;
    if (!points.length || f.days === Infinity) return points;
    const from = new Date(Date.now() - f.days * 864e5).toISOString().slice(0, 10);
    return points.filter(p => p.date >= from);
  }, [points, filter]);

  const first = data[0];
  const last = data[data.length - 1];
  const change = first && last ? last.value - first.value - (last.invested - first.invested) : 0;
  const base = first?.value || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ChartIcon className="w-5 h-5 text-indigo-600" /> Évolution du portefeuille</h2>
          {first && last && (
            <p className={`text-sm font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{fmt(change)} F de variation de valeur sur la période{base > 0 ? ` (${((change / base) * 100).toFixed(2)} %)` : ''}, hors apports et retraits
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-2.5 py-1 text-xs font-semibold rounded-md ${filter === f.key ? 'bg-white shadow text-indigo-700' : 'text-gray-600'}`}>{f.key}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-72 animate-pulse bg-gray-50 rounded-xl" />
      ) : data.length < 2 ? (
        <div className="h-72 flex flex-col items-center justify-center text-center text-gray-500 text-sm px-6">
          <ChartIcon className="w-10 h-10 text-gray-300 mb-2" />
          {isSnapshot
            ? "Historique limité : en mode snapshot, la courbe démarre à la date d'arrêté de vos positions. Importez votre relevé de transactions pour reconstituer l'historique complet."
            : 'Pas encore assez de données pour tracer une courbe.'}
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="rpValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} minTickGap={40} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} width={52} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v, name) => [`${fmt(Number(v))} F`, String(name)]}
                labelFormatter={d => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="value" name="Valeur des titres" stroke="#4f46e5" strokeWidth={2} fill="url(#rpValue)" />
              <Line type="stepAfter" dataKey="invested" name="Coût de revient" stroke="#94a3b8" strokeDasharray="5 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
