import React from 'react';
import { Gauge, ArrowUpCircle, ArrowDownCircle, MinusCircle, Activity, TrendingUp } from 'lucide-react';

type Signal = 'Achat' | 'Vente' | 'Neutre' | 'Achat Fort' | 'Vente Forte';

interface TechnicalIndicator {
  name: string;
  value: string;
  signal: Signal;
}

// Données d'exemple - à remplacer par des données réelles via API
const MOCK_INDICATORS: TechnicalIndicator[] = [
  { name: 'RSI (14)', value: '45.2', signal: 'Neutre' },
  { name: 'MACD (12, 26)', value: '-12.5', signal: 'Vente' },
  { name: 'Stochastique %K', value: '33.1', signal: 'Neutre' },
  { name: 'Moyenne Mobile (20)', value: '2405', signal: 'Vente' },
  { name: 'Moyenne Mobile (50)', value: '2350', signal: 'Achat' },
  { name: 'Moyenne Mobile (200)', value: '2100', signal: 'Achat Fort' },
  { name: 'Bollinger Sup.', value: '2450', signal: 'Neutre' },
  { name: 'Bollinger Inf.', value: '2340', signal: 'Neutre' },
];

const SignalBadge: React.FC<{ signal: Signal }> = ({ signal }) => {
  let colorClass = 'bg-gray-100 text-gray-600 border-gray-200';
  let Icon = MinusCircle;

  if (signal.includes('Achat')) {
    colorClass = signal.includes('Fort')
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-green-50 text-green-600 border-green-100';
    Icon = ArrowUpCircle;
  } else if (signal.includes('Vente')) {
    colorClass = signal.includes('Fort')
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-red-50 text-red-600 border-red-100';
    Icon = ArrowDownCircle;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <Icon size={12} />
      {signal}
    </span>
  );
};

const StockAnalysis: React.FC = () => {
  return (
    <div className="space-y-8">

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-xl shadow-lg text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 p-12 opacity-5 pointer-events-none">
          <Gauge size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Activity className="text-blue-400" />
              Synthèse Technique
            </h3>
            <p className="text-slate-400 max-w-md">
              Basé sur une combinaison de moyennes mobiles et d'oscillateurs techniques.
              Le consensus penche légèrement vers l'achat à long terme malgré une volatilité à court terme.
            </p>
          </div>
          <div className="flex flex-col items-center bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 min-w-[200px]">
            <span className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Signal Global</span>
            <span className="text-3xl font-bold text-yellow-400">NEUTRE</span>
            <span className="text-xs text-slate-400 mt-2">Dernière mise à jour: 14:00</span>
          </div>
        </div>
      </div>

      {/* Technical Indicators Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-gray-500" />
            Indicateurs Techniques
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Indicateur</th>
                <th className="px-4 py-3 text-right">Valeur</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {MOCK_INDICATORS.map((ind) => (
                <tr key={ind.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-gray-900">{ind.name}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-gray-600">{ind.value}</td>
                  <td className="px-4 py-3.5 text-right">
                    <SignalBadge signal={ind.signal} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 text-yellow-800 text-sm flex gap-3">
        <Activity size={18} className="flex-shrink-0 mt-0.5" />
        <p>
          L'analyse technique est fournie à titre indicatif uniquement et ne doit pas constituer la seule base de vos décisions d'investissement.
          Les performances passées ne préjugent pas des performances futures.
        </p>
      </div>

    </div>
  );
};

export default StockAnalysis;
