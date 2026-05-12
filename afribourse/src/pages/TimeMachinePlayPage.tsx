import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, CheckCircle, Loader2, Zap } from 'lucide-react';
import { useTimeMachine } from '../contexts/TimeMachineContext';
import { useScenarioStockData } from '../hooks/useTimeMachine';
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
    cash,
    portfolioValue,
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
  const [submittedStepIndex, setSubmittedStepIndex] = useState<number | null>(null);

  const step = session?.currentStep ?? 0;
  const displayStep = phase === 'submitted' && submittedStepIndex !== null ? submittedStepIndex : step;
  const year = scenario?.years[displayStep];

  const { data: stockData } = useScenarioStockData(slug, year);

  const fundamentals: Record<string, any> = {};
  if (stockData && stockData.length > 0) {
    for (const s of stockData) {
      fundamentals[s.ticker] = s;
    }
  } else if (scenario?.fundamentalsByYear && year) {
    const seedFund = scenario.fundamentalsByYear[String(year)] ?? {};
    Object.assign(fundamentals, seedFund);
  }

  const tickers = stockData && stockData.length > 0
    ? stockData.map(s => s.ticker)
    : (scenario?.availableStocks ?? []);

  useEffect(() => {
    async function init() {
      if (session) { setLoading(false); return; }
      if (sessionId) { await loadSession(sessionId); }
      setLoading(false);
    }
    init();
  }, [sessionId]);

  useEffect(() => {
    if (session?.status === 'COMPLETED') {
      navigate(`/time-machine/${slug}/recap?session=${sessionId ?? session.id}`);
    }
  }, [session?.status, session?.currentStep]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!session || !scenario) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-center px-4">
        <div className="space-y-4">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-lg font-semibold text-slate-200">Session introuvable.</p>
          <button
            onClick={() => navigate(`/time-machine/${slug}`)}
            className="text-amber-400 text-sm underline cursor-pointer hover:text-amber-300 transition-colors"
          >
            Retour au scénario
          </button>
        </div>
      </div>
    );
  }

  const isLastStep = displayStep === scenario.years.length - 1;
  const contextData = scenario.contextByYear?.[String(year)] ?? {};
  const stepPerf = session.performanceByStep?.[String(displayStep)];
  const prevPfVal = displayStep > 0 ? (session.performanceByStep?.[String(displayStep - 1)]?.pfVal ?? 0) : 0;
  const prevDivCum = displayStep > 0 ? (session.performanceByStep?.[String(displayStep - 1)]?.pfDivCum ?? 0) : 0;
  const totalCapital = session.capitalByStep?.[String(displayStep)] ?? scenario.startBudget;

  const prevHoldings: Record<string, number> = step > 0
    ? (session.portfolioByStep?.[String(step - 1)] ?? {})
    : {};

  async function handleSubmit() {
    const stepAtSubmit = session!.currentStep;
    try {
      await submitStep();
      setSubmittedStepIndex(stepAtSubmit);
      setPhase('submitted');
    } catch {
      // error set in context
    }
  }

  async function handleNext() {
    if (session!.status === 'COMPLETED') {
      navigate(`/time-machine/${slug}/recap?session=${sessionId ?? session!.id}`);
    } else {
      setSubmittedStepIndex(null);
      setPhase('choosing');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(`/time-machine/${slug}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{scenario.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Étape {displayStep + 1}</span>
              <span className="text-slate-600">·</span>
              <span className="text-sm font-bold text-amber-400">{year}</span>
            </div>
          </div>
          <StepProgress years={scenario.years} currentStep={displayStep} />
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">

          {/* ── Left — Context ─────────────────────────────────── */}
          <div className="space-y-4">
            {step > 0 && phase === 'choosing' && prevPfVal > 0 && (
              <ReinvestBanner
                portfolioValue={prevPfVal}
                dividendsCumulative={prevDivCum}
                newContribution={500000}
                totalCapital={totalCapital}
              />
            )}

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                Contexte — <span className="text-amber-400">{year}</span>
              </h2>
              <ContextPanel
                context={contextData}
                fundamentals={fundamentals}
                tickers={tickers}
              />
            </div>
          </div>

          {/* ── Right — Action ─────────────────────────────────── */}
          <div className="space-y-4">
            {phase === 'choosing' ? (
              <>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-violet-500 rounded-full inline-block" />
                    Votre allocation — <span className="text-amber-400">{year}</span>
                  </h2>
                  <AllocationZone
                    tickers={tickers}
                    allocation={currentAllocation}
                    prevHoldings={prevHoldings}
                    fundamentals={fundamentals}
                    cash={cash}
                    portfolioValue={portfolioValue}
                    onQtyChange={setQty}
                  />
                </div>

                <NoteZone value={currentNote} onChange={setNote} />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cash < -1}
                  className="w-full flex items-center justify-center gap-2.5 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Validation…</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" />Valider mes décisions</>
                  )}
                </button>
              </>
            ) : (
              /* ── Submitted phase ── */
              <div className="space-y-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h2 className="text-base font-bold text-white">
                      Résultats — <span className="text-amber-400">{year}</span>
                    </h2>
                  </div>
                  {stepPerf && (
                    <PerformanceSnapshot perf={stepPerf} year={year!} capital={totalCapital} />
                  )}
                </div>

                <KofiBubble
                  message={kofiMessage}
                  loading={kofiLoading}
                  mode="feedback"
                  onRequest={!kofiMessage ? () => requestKofiFeedback(displayStep) : undefined}
                  buttonLabel="Obtenir le feedback Simba"
                />

                <button
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2.5 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 cursor-pointer"
                >
                  {isLastStep ? 'Voir le bilan final' : `Passer à ${scenario.years[displayStep + 1]}`}
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
