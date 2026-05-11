import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react';
import { useTimeMachine } from '../contexts/TimeMachineContext';
import StepProgress from '../components/time-machine/StepProgress';
import ContextPanel from '../components/time-machine/ContextPanel';
import AllocationZone from '../components/time-machine/AllocationZone';
import ReinvestBanner from '../components/time-machine/ReinvestBanner';
import KofiBubble from '../components/time-machine/KofiBubble';
import NoteZone from '../components/time-machine/NoteZone';
import PerformanceSnapshot from '../components/time-machine/PerformanceSnapshot';

export default function TimeMachinePlayPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const {
    scenario,
    session,
    currentAllocation,
    currentNote,
    availableCapital,
    kofiMessage,
    kofiLoading,
    isSubmitting,
    error,
    loadSession,
    setQty,
    setNote,
    submitStep,
    requestKofiFeedback,
  } = useTimeMachine();

  const [phase, setPhase] = useState<'choosing' | 'submitted'>('choosing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (session) {
        setLoading(false);
        return;
      }
      if (sessionId) {
        await loadSession(sessionId);
      }
      setLoading(false);
    }
    init();
  }, [sessionId]);

  // When session changes step after submit, reset phase
  useEffect(() => {
    if (session?.status === 'COMPLETED') {
      navigate(`/time-machine/${slug}/recap?session=${sessionId ?? session.id}`);
    }
  }, [session?.status, session?.currentStep]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div className="space-y-3">
          <p className="text-lg font-semibold text-gray-700">Session introuvable.</p>
          <button
            onClick={() => navigate(`/time-machine/${slug}`)}
            className="text-blue-600 text-sm underline"
          >
            Retour au scénario
          </button>
        </div>
      </div>
    );
  }

  const step = session.currentStep;
  const year = scenario.years[step];
  const isLastStep = step === scenario.years.length - 1;
  const contextData = scenario.contextByYear?.[String(year)] ?? {};
  const fundamentals = scenario.fundamentalsByYear?.[String(year)] ?? {};
  const totalBudget = session.capitalByStep?.[String(step)] ?? scenario.startBudget;
  const stepPerf = session.performanceByStep?.[String(step)];
  const prevPfVal = step > 0 ? (session.performanceByStep?.[String(step - 1)]?.pfVal ?? 0) : 0;
  const prevDivCum = step > 0 ? (session.performanceByStep?.[String(step - 1)]?.pfDivCum ?? 0) : 0;

  async function handleSubmit() {
    try {
      await submitStep();
      setPhase('submitted');
    } catch {
      // error set in context
    }
  }

  async function handleNext() {
    if (session!.status === 'COMPLETED') {
      navigate(`/time-machine/${slug}/recap?session=${sessionId ?? session!.id}`);
    } else {
      setPhase('choosing');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(`/time-machine/${slug}`)}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">{scenario.title}</p>
            <p className="text-sm font-bold text-gray-900">Étape {step + 1} — {year}</p>
          </div>
          <StepProgress years={scenario.years} currentStep={step} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left — Context */}
          <div className="space-y-4">
            {step > 0 && phase === 'choosing' && prevPfVal > 0 && (
              <ReinvestBanner
                portfolioValue={prevPfVal}
                dividendsCumulative={prevDivCum}
                newContribution={500000}
                totalCapital={totalBudget}
              />
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contexte — {year}</h2>
              <ContextPanel
                context={contextData}
                fundamentals={fundamentals}
                tickers={scenario.availableStocks ?? []}
              />
            </div>
          </div>

          {/* Right — Action */}
          <div className="space-y-4">
            {phase === 'choosing' ? (
              <>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                  <h2 className="text-lg font-bold text-gray-900">Votre allocation — {year}</h2>
                  <AllocationZone
                    tickers={scenario.availableStocks ?? []}
                    allocation={currentAllocation}
                    fundamentals={fundamentals}
                    availableCapital={availableCapital}
                    totalBudget={totalBudget}
                    onQtyChange={setQty}
                  />
                </div>

                <NoteZone value={currentNote} onChange={setNote} />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || availableCapital < 0}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Validation…</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" />Valider mes décisions</>
                  )}
                </button>
              </>
            ) : (
              /* Submitted phase */
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-gray-900">Résultats — {year}</h2>
                  </div>
                  {stepPerf && (
                    <PerformanceSnapshot perf={stepPerf} year={year} capital={totalBudget} />
                  )}
                </div>

                <KofiBubble
                  message={kofiMessage}
                  loading={kofiLoading}
                  mode="feedback"
                  onRequest={!kofiMessage ? () => requestKofiFeedback(step) : undefined}
                  buttonLabel="Obtenir le feedback KOFI"
                />

                <button
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-colors"
                >
                  {isLastStep ? 'Voir le bilan final' : `Passer à ${scenario.years[step + 1]}`}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
