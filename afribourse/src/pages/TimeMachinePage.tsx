import { useState } from 'react';
import { Clock, Zap, Star, Filter, Lock } from 'lucide-react';
import { useTimeMachineScenarios } from '../hooks/useTimeMachine';
import ScenarioCard, { type StaticScenario } from '../components/time-machine/ScenarioCard';

const TIER_FILTERS = [
  { id: 'all',  label: 'Tous' },
  { id: 'FREE', label: 'Gratuit',       icon: Clock },
  { id: 'PLUS', label: 'Investisseur+', icon: Zap },
  { id: 'MAX',  label: 'Max',           icon: Star },
] as const;

// Scénario "bientôt disponible" — card statique, pas de contenu en DB
const COMING_SOON: StaticScenario[] = [
  {
    slug: 'crise-subprimes-2008',
    title: 'La Crise des Subprimes 2008',
    description: 'Les subprimes font trembler le monde. La BRVM résiste... mais combien de temps ? Testez votre sang-froid face à la panique mondiale.',
    category: 'WORLD_CRISIS',
    tier: 'FREE',
    years: [2008, 2009, 2010],
    startBudget: 500000,
    comingSoon: true,
  },
];

// Scénarios premium à venir — cards statiques, accès bloqué
const LOCKED_SCENARIOS: StaticScenario[] = [
  {
    slug: 'crise-politique-ci-2011',
    title: 'La Crise Politique Ivoirienne',
    description: "Crise post-électorale en Côte d'Ivoire. La BRVM suspend ses séances plusieurs semaines. Comment survivre et se positionner pour la reprise ?",
    category: 'BRVM_EVENT',
    tier: 'PLUS',
    years: [2010, 2011, 2012],
    startBudget: 500000,
    locked: true,
  },
  {
    slug: 'bull-run-brvm-2013',
    title: 'Le Grand Bull Run 2012–2014',
    description: 'La BRVM double en 3 ans. Savoir quand acheter, quand prendre ses bénéfices. L\'euphorie comme principal piège de l\'investisseur.',
    category: 'BULL_RUN',
    tier: 'PLUS',
    years: [2012, 2013, 2014],
    startBudget: 500000,
    locked: true,
  },
  {
    slug: 'ipo-orange-ci-2018',
    title: "L'IPO Orange CI 2018",
    description: "La plus grande introduction en bourse de la BRVM. Souscrire ou attendre ? À quel prix entrer ? Gérer l'euphorie médiatique autour d'une IPO historique.",
    category: 'BRVM_EVENT',
    tier: 'PLUS',
    years: [2017, 2018, 2019],
    startBudget: 500000,
    locked: true,
  },
  {
    slug: 'covid-brvm-2020',
    title: 'COVID-19 & BRVM 2020',
    description: 'Pandémie mondiale. La BRVM recule de -8%. Confinements, incertitudes, mais aussi opportunités. Qui sait garder la tête froide ?',
    category: 'WORLD_CRISIS',
    tier: 'PLUS',
    years: [2019, 2020, 2021],
    startBudget: 500000,
    locked: true,
  },
  {
    slug: 'choc-cacao-2016',
    title: 'Le Choc du Cacao 2016–2019',
    description: "Les cours mondiaux du cacao s'effondrent. PALM CI, SOGB, SAPH en chute libre. Peut-on anticiper un retournement sectoriel et saisir le rebond ?",
    category: 'SECTOR_SHOCK',
    tier: 'MAX',
    years: [2016, 2017, 2018, 2019],
    startBudget: 500000,
    locked: true,
  },
  {
    slug: 'strategie-dividendes-brvm',
    title: 'La Stratégie Dividendes BRVM',
    description: "Construire un portefeuille de revenus passifs sur la BRVM. Sélection des meilleurs payeurs de dividendes, réinvestissement, et effet boule de neige sur 7 ans.",
    category: 'STRATEGY',
    tier: 'MAX',
    years: [2015, 2017, 2019, 2022],
    startBudget: 1000000,
    locked: true,
  },
  {
    slug: 'boom-telecom-uemoa',
    title: 'Le Boom Télécom & Data UEMOA',
    description: "Révolution data mobile en Afrique de l'Ouest. Sonatel, Orange CI, Ecobank décollent. Timing d'entrée, sélection de titres, gestion de la valorisation élevée.",
    category: 'SECTOR_SHOCK',
    tier: 'MAX',
    years: [2014, 2016, 2018, 2020],
    startBudget: 500000,
    locked: true,
  },
  {
    slug: 'inflation-taux-bceao-2022',
    title: "L'Inflation & la Hausse des Taux",
    description: "Inflation record à +7.4%, BCEAO relève ses taux à 3.5%. Comment repositionner son portefeuille BRVM face à un environnement de taux qui change tout ?",
    category: 'WORLD_CRISIS',
    tier: 'MAX',
    years: [2021, 2022, 2023],
    startBudget: 500000,
    locked: true,
  },
];

export default function TimeMachinePage() {
  const { data: apiScenarios = [], isLoading, error } = useTimeMachineScenarios();
  const [tier, setTier] = useState<'all' | 'FREE' | 'PLUS' | 'MAX'>('all');

  // Filter out crise-subprimes from the dynamic API results (shown as "coming soon" card below)
  const liveScenarios = (apiScenarios as StaticScenario[]).filter(
    (s: StaticScenario) => s.slug !== 'crise-subprimes-2008'
  );

  // All scenarios to display: live + coming soon + locked
  const allScenarios: StaticScenario[] = [
    ...liveScenarios,
    ...COMING_SOON,
    ...LOCKED_SCENARIOS,
  ];

  const filtered = tier === 'all' ? allScenarios : allScenarios.filter(s => s.tier === tier);

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
          {/* Stats bar */}
          <div className="flex items-center justify-center gap-8 pt-4">
            {[
              { label: 'Scénarios', value: String(allScenarios.length) },
              { label: 'Années couvertes', value: '2008–2023' },
              { label: 'Tickers BRVM', value: '17' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="text-xs text-blue-300 font-medium">{label}</p>
              </div>
            ))}
          </div>
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
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
                  tier === id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Legend */}
          <div className="ml-auto flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Gratuit
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-gray-400" />Premium
            </span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-semibold">Impossible de charger les scénarios.</p>
          </div>
        )}

        {/* Grid — live + coming soon + locked */}
        {!isLoading && !error && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((scenario) => (
              <ScenarioCard key={scenario.slug} scenario={scenario} />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">
                <p>Aucun scénario pour ce filtre.</p>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-2">
          <h3 className="font-bold text-gray-900">Comment ça marche ?</h3>
          <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm text-gray-600">
            {[
              { n: '1', t: 'Choisissez un scénario', d: 'Crise, bull run, ou événement BRVM.' },
              { n: '2', t: 'Composez votre portefeuille', d: 'Achetez, vendez, rééquilibrez à chaque étape.' },
              { n: '3', t: 'Découvrez les résultats réels', d: "Comparez vos décisions à l'histoire." },
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
