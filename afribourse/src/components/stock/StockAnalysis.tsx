import React, { useState } from 'react';
import { Gauge, ArrowUpCircle, ArrowDownCircle, MinusCircle, Activity, TrendingUp, Lock, Zap } from 'lucide-react';
import PremiumPaywall from '../PremiumPaywall';

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
  const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);

  return (
    <div className="space-y-8">

      {/* Summary Card - Premium Locked */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-xl shadow-lg text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 p-12 opacity-5 pointer-events-none">
          <Gauge size={200} />
        </div>

        {/* Badge Premium */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-full">
            <Zap size={12} />
            Premium
          </span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Activity className="text-blue-400" />
              Synthèse Technique
            </h3>
            <p className="text-slate-400 max-w-md mb-4">
              Accédez à une synthèse complète basée sur une combinaison de moyennes mobiles et d'oscillateurs techniques.
            </p>
            <button
              onClick={() => setShowPremiumPaywall(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg text-sm"
            >
              <Lock className="w-4 h-4" />
              Débloquer l'analyse
            </button>
          </div>
          <div className="flex flex-col items-center bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 min-w-[200px] relative">
            {/* Overlay de flou */}
            <div className="absolute inset-0 backdrop-blur-md bg-white/5 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-white/50" />
            </div>
            <span className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1 blur-sm">Signal Global</span>
            <span className="text-3xl font-bold text-yellow-400 blur-sm">NEUTRE</span>
            <span className="text-xs text-slate-400 mt-2 blur-sm">Dernière mise à jour: 14:00</span>
          </div>
        </div>
      </div>

      {/* Technical Indicators Table - Premium Locked */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-gray-500" />
            Indicateurs Techniques
          </h3>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-full">
            <Zap size={12} />
            Premium
          </span>
        </div>

        {/* Aperçu flouté */}
        <div className="relative">
          <div className="overflow-x-auto blur-sm select-none pointer-events-none">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Indicateur</th>
                  <th className="px-4 py-3 text-right">Valeur</th>
                  <th className="px-4 py-3 text-right rounded-tr-lg">Signal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_INDICATORS.slice(0, 5).map((ind) => (
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

          {/* Overlay avec call-to-action */}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent flex items-center justify-center">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200 max-w-md">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full mb-3">
                <Lock className="w-6 h-6 text-yellow-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Accès Premium Requis
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                Débloquez l'accès complet aux indicateurs techniques avancés (RSI, MACD, Moyennes Mobiles, Bollinger, etc.)
              </p>
              <button
                onClick={() => setShowPremiumPaywall(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
              >
                <Zap className="w-4 h-4" />
                Voir les Indicateurs
              </button>
            </div>
          </div>
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

      {/* Paywall Modal */}
      <PremiumPaywall
        isOpen={showPremiumPaywall}
        onClose={() => setShowPremiumPaywall(false)}
        feature="Accéder aux indicateurs techniques avancés et à la synthèse complète"
        plan="investisseur-plus"
      />

    </div>
  );
};

export default StockAnalysis;
