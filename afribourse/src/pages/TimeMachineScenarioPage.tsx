import { useParams, useNavigate } from 'react-router-dom';
import { Clock, TrendingUp, Wallet, ArrowLeft, Play, Lock } from 'lucide-react';
import { useState } from 'react';
import { useTimeMachineScenario } from '../hooks/useTimeMachine';
import { useTimeMachine } from '../contexts/TimeMachineContext';
import KofiBubble from '../components/time-machine/KofiBubble';
import PaywallGate from '../components/time-machine/PaywallGate';

const TIER_LABEL: Record<string, string> = {
  FREE: 'Gratuit',
  PLUS: 'Investisseur+',
  MAX: 'Max',
};

export default function TimeMachineScenarioPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { startSession, isSubmitting, error } = useTimeMachine();

  const { data: scenario, isLoading } = useTimeMachineScenario(slug);
  const [paywallTier, setPaywallTier] = useState<'PLUS' | 'MAX' | null>(null);

  async function handleStart() {
    if (!slug) return;
    try {
      const sessionId = await startSession(slug);
      navigate(`/time-machine/${slug}/play?session=${sessionId}`);
    } catch (err: any) {
      if (err.response?.status === 403) {
        const rt = err.response?.data?.requiredTier;
        setPaywallTier(rt === 'MAX' ? 'MAX' : 'PLUS');
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <p>Scénario introuvable.</p>
      </div>
    );
  }

  const kofiIntro = scenario.contextByYear?.[String(scenario.years[0])]?.kofiPresentation
    ?? scenario.contextByYear?.[String(scenario.years[0])]?.kofiIntro;

  return (
    <div className="min-h-screen bg-gray-50">
      {paywallTier && (
        <PaywallGate
          requiredTier={paywallTier}
          scenarioTitle={scenario.title}
        />
      )}

      {/* Back */}
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <button
          onClick={() => navigate('/time-machine')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux scénarios
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16 space-y-6">
        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gradient-to-br from-slate-800 to-blue-900 p-8 text-white space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                {TIER_LABEL[scenario.tier] ?? scenario.tier}
              </span>
              <span className="text-xs text-blue-200">{scenario.category}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">{scenario.title}</h1>
            <p className="text-blue-100 leading-relaxed">{scenario.description}</p>
          </div>

          {/* Meta */}
          <div className="px-8 py-5 grid grid-cols-3 gap-4 border-t border-gray-100">
            <div className="flex flex-col items-center gap-1 text-center">
              <Clock className="w-5 h-5 text-blue-500" />
              <p className="text-xs text-gray-500">Étapes</p>
              <p className="text-base font-bold text-gray-900">{scenario.years.length}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <p className="text-xs text-gray-500">Période</p>
              <p className="text-base font-bold text-gray-900">{scenario.years[0]}–{scenario.years[scenario.years.length - 1]}</p>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Wallet className="w-5 h-5 text-amber-500" />
              <p className="text-xs text-gray-500">Budget départ</p>
              <p className="text-base font-bold text-gray-900">{(scenario.startBudget / 1000).toFixed(0)}k FCFA</p>
            </div>
          </div>
        </div>

        {/* Available stocks */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <h3 className="font-semibold text-gray-900">Titres disponibles</h3>
          <div className="flex flex-wrap gap-2">
            {scenario.availableStocks?.map((t: string) => (
              <span key={t} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-mono rounded-lg">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* KOFI intro */}
        {kofiIntro && (
          <KofiBubble
            message={kofiIntro}
            loading={false}
            mode="intro"
          />
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg shadow-blue-200"
        >
          {scenario.locked ? (
            <><Lock className="w-5 h-5" />Scénario verrouillé</>
          ) : isSubmitting ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Démarrage…</>
          ) : (
            <><Play className="w-5 h-5" />Démarrer la simulation</>
          )}
        </button>

        <p className="text-xs text-center text-gray-400">
          Vos décisions sont sauvegardées automatiquement. Vous pouvez reprendre à tout moment.
        </p>
      </div>
    </div>
  );
}
