import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Zap } from 'lucide-react';
import { useTimeMachine } from '../contexts/TimeMachineContext';
import { useAuth } from '../contexts/AuthContext';
import BilanFinal from '../components/time-machine/BilanFinal';

export default function TimeMachineRecapPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const { scenario, session, kofiMessage, kofiLoading, loadSession, requestKofiRecap, startSession } =
    useTimeMachine();
  const { userProfile } = useAuth();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (session) { setLoading(false); return; }
      if (sessionId) { await loadSession(sessionId); }
      setLoading(false);
    }
    init();
  }, [sessionId]);

  async function handleRestart() {
    if (!slug) return;
    try {
      const newId = await startSession(slug);
      navigate(`/time-machine/${slug}/play?session=${newId}`);
    } catch { }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-gray-400 text-sm">Calcul de votre bilan…</p>
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
            onClick={() => navigate('/time-machine')}
            className="text-amber-600 text-sm underline cursor-pointer hover:text-amber-500"
          >
            Retour aux scénarios
          </button>
        </div>
      </div>
    );
  }

  const lastStepIndex = scenario.years.length - 1;
  const lastPerf = session.performanceByStep?.[String(lastStepIndex)] ?? {};
  const cagr = lastPerf.cagr ?? 0;
  const totalReturn = lastPerf.perfTotal ?? 0;
  const finalValue = lastPerf.pfVal ?? 0;
  const totalDividends = lastPerf.pfDivCum ?? 0;
  const lastByTicker: any[] = lastPerf.byTicker ?? [];

  const steps = scenario.years.map((year: number, i: number) => {
    const perf = session.performanceByStep?.[String(i)] ?? {};
    const capital = session.capitalByStep?.[String(i)] ?? scenario.startBudget;
    return {
      year,
      pfVal: perf.pfVal ?? 0,
      perfTotal: perf.perfTotal ?? 0,
      perfCapital: perf.perfCapital ?? 0,
      dividends: perf.pfDivCum ?? 0,
      capital,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-10">
        <BilanFinal
          scenarioTitle={scenario.title}
          years={scenario.years}
          steps={steps}
          cagr={cagr}
          totalReturn={totalReturn}
          finalValue={finalValue}
          totalDividends={totalDividends}
          startBudget={scenario.startBudget}
          lastByTicker={lastByTicker}
          userName={userProfile?.name ?? null}
          sessionId={session.id}
          kofiRecap={kofiMessage}
          kofiLoading={kofiLoading}
          onRequestRecap={requestKofiRecap}
          onRestart={handleRestart}
          onExplore={() => navigate('/time-machine')}
        />
      </div>
    </div>
  );
}
