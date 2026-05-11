import { useState } from 'react';
import { Clock, Zap, Star, Filter } from 'lucide-react';
import { useTimeMachineScenarios } from '../hooks/useTimeMachine';
import ScenarioCard from '../components/time-machine/ScenarioCard';

const TIER_FILTERS = [
  { id: 'all',  label: 'Tous' },
  { id: 'FREE', label: 'Gratuit', Icon: Clock },
  { id: 'PLUS', label: 'Investisseur+', Icon: Zap },
  { id: 'MAX',  label: 'Max', Icon: Star },
] as const;

export default function TimeMachinePage() {
  const { data: scenarios = [], isLoading, error } = useTimeMachineScenarios();
  const [tier, setTier] = useState<'all' | 'FREE' | 'PLUS' | 'MAX'>('all');

  const filtered = tier === 'all' ? scenarios : scenarios.filter((s: any) => s.tier === tier);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold mb-2">
            <Clock className="w-3.5 h-3.5" />
            Apprentissage par l'histoire
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            La Time Machine
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto leading-relaxed">
            Rejouez les grands événements de la BRVM. Composez votre portefeuille virtuel, prenez vos décisions et découvrez ce qui se serait réellement passé.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex gap-2 flex-wrap">
            {TIER_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTier(id as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                  tier === id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-semibold">Impossible de charger les scénarios.</p>
            <p className="text-sm mt-1">Vérifiez votre connexion et réessayez.</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p>Aucun scénario disponible pour ce filtre.</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((scenario: any) => (
              <ScenarioCard key={scenario.id} scenario={scenario} />
            ))}
          </div>
        )}

        {/* Pedagogy note */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-2">
          <h3 className="font-bold text-gray-900">Comment ça marche ?</h3>
          <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
            {[
              { n: '1', t: 'Choisissez un scénario', d: 'Crise, bull run, ou événement BRVM.' },
              { n: '2', t: 'Composez votre portefeuille', d: 'Achetez, vendez, rééquilibrez à chaque étape.' },
              { n: '3', t: 'Découvrez les résultats réels', d: 'Comparez vos décisions à l\'histoire.' },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">{n}</div>
                <p className="font-semibold text-gray-800">{t}</p>
                <p className="text-xs">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
