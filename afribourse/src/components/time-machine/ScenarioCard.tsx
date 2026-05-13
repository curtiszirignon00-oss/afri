import { Lock, Clock, TrendingUp, ChevronRight, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIER_BADGE: Record<string, { label: string; cls: string }> = {
  FREE:  { label: 'Gratuit',        cls: 'bg-emerald-100 text-emerald-700' },
  PLUS:  { label: 'Investisseur+',  cls: 'bg-blue-100 text-blue-700' },
  MAX:   { label: 'Max',            cls: 'bg-purple-100 text-purple-700' },
};

const CAT_COLOR: Record<string, string> = {
  WORLD_CRISIS:   'from-red-50 to-orange-50 border-red-200',
  BULL_RUN:       'from-green-50 to-emerald-50 border-green-200',
  BRVM_EVENT:     'from-blue-50 to-indigo-50 border-blue-200',
  SECTOR_SHOCK:   'from-yellow-50 to-amber-50 border-yellow-200',
  STRATEGY:       'from-purple-50 to-violet-50 border-purple-200',
};

export interface StaticScenario {
  slug: string;
  title: string;
  description: string;
  category: string;
  tier: string;
  years: number[];
  startBudget: number;
  locked?: boolean;
  comingSoon?: boolean;
}

interface Props {
  scenario: StaticScenario;
}

export default function ScenarioCard({ scenario }: Props) {
  const navigate = useNavigate();
  const tier = TIER_BADGE[scenario.tier] ?? TIER_BADGE.FREE;
  const gradient = CAT_COLOR[scenario.category] ?? CAT_COLOR.BRVM_EVENT;
  const isLocked = scenario.locked || scenario.comingSoon;

  function handleClick() {
    if (isLocked) return;
    navigate(`/time-machine/${scenario.slug}`);
  }

  return (
    <div
      onClick={handleClick}
      className={`relative group rounded-2xl border bg-gradient-to-br ${gradient} p-5 flex flex-col gap-3 transition-all duration-200 ${
        isLocked
          ? 'opacity-75 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Coming soon overlay */}
      {scenario.comingSoon && (
        <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 gap-2">
          <div className="bg-white rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-gray-700">Bientôt disponible</span>
          </div>
          <p className="text-[10px] text-gray-500 font-medium">En cours de développement</p>
        </div>
      )}

      {/* Lock overlay */}
      {scenario.locked && !scenario.comingSoon && (
        <div className="absolute inset-0 rounded-2xl bg-white/50 flex items-center justify-center z-10">
          <div className="bg-white rounded-full p-3 shadow-md">
            <Lock className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.cls}`}>
          {tier.label}
        </span>
        {!isLocked && (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors shrink-0 mt-0.5" />
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 text-base leading-snug">{scenario.title}</h3>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 flex-1">{scenario.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-black/5">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{scenario.years.length} étapes</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{scenario.years[0]}–{scenario.years[scenario.years.length - 1]}</span>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {(scenario.startBudget / 1000).toFixed(0)}k FCFA
        </div>
      </div>

      {scenario.locked && !scenario.comingSoon && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${tier.cls} shadow-sm`}>
            Passer à {tier.label}
          </span>
        </div>
      )}
    </div>
  );
}
