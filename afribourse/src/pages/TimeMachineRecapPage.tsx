import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTimeMachine } from '../contexts/TimeMachineContext';
import BilanFinal from '../components/time-machine/BilanFinal';

export default function TimeMachineRecapPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');

  const { scenario, session, kofiMessage, kofiLoading, loadSession, requestKofiRecap, startSession, isSubmitting } =
    useTimeMachine();

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
    } catch { /* ignore */ }
  }

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
            onClick={() => navigate('/time-machine')}
            className="text-blue-600 text-sm underline"
          >
            Retour aux scénarios
          </button>
        </div>
      </div>
    );
  }

  // Build step summaries from performanceByStep
  const steps = scenario.years.map((year: number, i: number) => {
    const perf = session.performanceByStep?.[String(i)] ?? {};
    return {
      year,
      pfVal: perf.pfVal ?? 0,
      perfTotal: perf.perfTotal ?? 0,
      dividends: perf.pfDivCum ?? 0,
    };
  });

  // Last step performance for overall CAGR
  const lastPerf = session.performanceByStep?.[String(scenario.years.length - 1)] ?? {};
  const cagr = lastPerf.cagr ?? 0;
  const totalReturn = lastPerf.perfTotal ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <BilanFinal
          scenarioTitle={scenario.title}
          steps={steps}
          cagr={cagr}
          totalReturn={totalReturn}
          kofiRecap={kofiMessage}
          kofiLoading={kofiLoading}
          onRequestRecap={requestKofiRecap}
          onRestart={handleRestart}
        />
      </div>
    </div>
  );
}
