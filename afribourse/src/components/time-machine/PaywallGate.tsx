import { Lock, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  requiredTier: 'PLUS' | 'MAX';
  scenarioTitle?: string;
}

const TIER_CONFIG = {
  PLUS: {
    label: 'Investisseur+',
    color: 'text-blue-600',
    bg: 'bg-blue-600',
    light: 'bg-blue-50 border-blue-200',
    Icon: Zap,
    perks: [
      '22 scénarios historiques supplémentaires',
      'Analyse KOFI avancée',
      'Accès au simulateur portefeuille',
    ],
  },
  MAX: {
    label: 'Max',
    color: 'text-purple-600',
    bg: 'bg-purple-600',
    light: 'bg-purple-50 border-purple-200',
    Icon: Star,
    perks: [
      '8 scénarios exclusifs Max',
      'Toutes les fonctionnalités Investisseur+',
      'Accès en avant-première',
    ],
  },
};

export default function PaywallGate({ requiredTier, scenarioTitle }: Props) {
  const navigate = useNavigate();
  const cfg = TIER_CONFIG[requiredTier] ?? TIER_CONFIG.PLUS;
  const Icon = cfg.Icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full border ${cfg.light} p-6 space-y-5`}>
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className={`w-14 h-14 ${cfg.light} border ${cfg.light.split(' ')[1]} rounded-full flex items-center justify-center`}>
            <Lock className={`w-7 h-7 ${cfg.color}`} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-extrabold text-gray-900">Scénario réservé</h3>
          {scenarioTitle && (
            <p className="text-sm text-gray-500">"{scenarioTitle}"</p>
          )}
          <p className="text-sm text-gray-600">
            Ce scénario est disponible avec le plan{' '}
            <span className={`font-bold ${cfg.color}`}>{cfg.label}</span>.
          </p>
        </div>

        {/* Perks */}
        <ul className="space-y-2">
          {cfg.perks.map((perk, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
              <Icon className={`w-4 h-4 ${cfg.color} shrink-0`} />
              {perk}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/subscriptions')}
            className={`w-full py-3 ${cfg.bg} text-white font-bold rounded-xl hover:opacity-90 transition-opacity`}
          >
            Passer à {cfg.label}
          </button>
          <button
            onClick={() => navigate('/time-machine')}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Retour aux scénarios gratuits
          </button>
        </div>
      </div>
    </div>
  );
}
