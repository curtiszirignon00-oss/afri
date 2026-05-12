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
    scenario, session, currentAllocation, currentNote, cash, portfolioValue,
    kofiMessage, kofiLoading, isSubmitting, error,
    loadSession, setQty, setNote, submitStep, requestKofiFeedback,
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
    for (const s of stockData) fundamentals[s.ticker] = s;
  } else if (scenario?.fundamentalsByYear && year) {
    Object.assign(fundamentals, scenario.fundamentalsByYear[String(year)] ?? {});
  }

  const tickers = stockData && stockData.length > 0
    ? stockData.map(s => s.ticker)
    : (scenario?.availableStocks ?? []);

  useEffect(() => {
    async function init() {
      if (session) { setLoading(false); return; }
      if (sessionId) await loadSession(sessionId);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!session || !scenario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center px-4">
        <div className="space-y-4">
          <div className="w-14 h-14 bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center mx-auto">
            <Zap className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-lg font-semibold text-gray-800">Session introuvable.</p>
          <button
            onClick={() => navigate(`/time-machine/${slug}`)}
            className="text-amber-600 text-sm underline cursor-pointer hover:text-amber-500 transition-colors"
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

  // Evolution des cours entre l'étape précédente et l'étape courante
  const prevYear = displayStep > 0 ? scenario.years[displayStep - 1] : null;
  const prevFundamentals: Record<string, any> = prevYear
    ? (scenario.fundamentalsByYear?.[String(prevYear)] ?? {})
    : {};

  const marketEvolution = displayStep > 0
    ? tickers.map(ticker => {
        const prev = prevFundamentals[ticker]?.cours;
        const curr = fundamentals[ticker]?.cours;
        if (!prev || !curr || prev === 0) return null;
        return { ticker, prevCours: prev as number, currCours: curr as number, pct: ((curr - prev) / prev) * 100 };
      }).filter(Boolean) as { ticker: string; prevCours: number; currCours: number; pct: number }[]
    : [];

  async function handleSubmit() {
    const stepAtSubmit = session!.currentStep;
    try {
      await submitStep();
      setSubmittedStepIndex(stepAtSubmit);
      setPhase('submitted');
    } catch { }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30">
      {/* Soft ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(`/time-machine/${slug}`)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest truncate">{scenario.title}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Étape {displayStep + 1}</span>
              <span className="text-gray-300">·</span>
              <span className="text-sm font-bold text-amber-600">{year}</span>
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

            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-amber-500 rounded-full inline-block" />
                Contexte — <span className="text-amber-600">{year}</span>
              </h2>
              <ContextPanel context={contextData} fundamentals={fundamentals} tickers={tickers} />
            </div>
          </div>

          {/* ── Right — Action ─────────────────────────────────── */}
          <div className="space-y-4">
            {phase === 'choosing' ? (
              <>
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-violet-500 rounded-full inline-block" />
                    Votre allocation — <span className="text-amber-600">{year}</span>
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
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Animated primary button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || cash < -1}
                  className="group relative overflow-hidden w-full flex items-center justify-center gap-2.5 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-amber-500/30 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Validation…</>
                  ) : (
                    <><CheckCircle className="w-5 h-5" />Valider mes décisions</>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">
                      Résultats — <span className="text-amber-600">{year}</span>
                    </h2>
                  </div>
                  {stepPerf && (
                    <PerformanceSnapshot
                      perf={stepPerf}
                      year={year!}
                      capital={totalCapital}
                      prevYear={prevYear ?? undefined}
                      marketEvolution={marketEvolution}
                    />
                  )}
                </div>

                <KofiBubble
                  message={kofiMessage}
                  loading={kofiLoading}
                  mode="feedback"
                  onRequest={!kofiMessage ? () => requestKofiFeedback(displayStep) : undefined}
                  buttonLabel="Obtenir le feedback Simba"
                />

                {/* Animated secondary button */}
                <button
                  onClick={handleNext}
                  className="group relative overflow-hidden w-full flex items-center justify-center gap-2.5 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-violet-500/30 shadow-lg shadow-violet-500/20 cursor-pointer"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  {isLastStep ? 'Voir le bilan final' : `Passer à ${scenario.years[displayStep + 1]}`}
                  <ChevronRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
