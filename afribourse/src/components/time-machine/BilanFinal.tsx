import { TrendingUp, TrendingDown, Trophy, Repeat, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KofiBubble from './KofiBubble';

interface StepSummary {
  year: number;
  pfVal: number;
  perfTotal: number;
  dividends: number;
}

interface Props {
  scenarioTitle: string;
  steps: StepSummary[];
  cagr: number;
  totalReturn: number;
  kofiRecap: string | null;
  kofiLoading: boolean;
  onRequestRecap: () => void;
  onRestart?: () => void;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
      <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">{label}</p>
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function BilanFinal({
  scenarioTitle,
  steps,
  cagr,
  totalReturn,
  kofiRecap,
  kofiLoading,
  onRequestRecap,
  onRestart,
}: Props) {
  const navigate = useNavigate();
  const isPos = totalReturn >= 0;
  const cagrPos = cagr >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 rounded-full mb-2">
          <Trophy className="w-7 h-7 text-amber-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">Bilan final</h2>
        <p className="text-sm text-gray-500">{scenarioTitle}</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Rendement total"
          value={`${isPos ? '+' : ''}${totalReturn.toFixed(1)}%`}
          sub="dividendes inclus"
        />
        <StatCard
          label="CAGR annualisé"
          value={`${cagrPos ? '+' : ''}${cagr.toFixed(2)}%`}
          sub="par an"
        />
        <StatCard
          label="Étapes jouées"
          value={String(steps.length)}
          sub="décisions prises"
        />
      </div>

      {/* Comparison: savings account */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Comparaison — épargne classique</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Votre portefeuille BRVM</span>
          <span className={`font-bold ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPos ? '+' : ''}{totalReturn.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Livret d'épargne (~3% / an)</span>
          <span className="font-bold text-gray-500">
            +{(3 * steps.length).toFixed(1)}% estimé
          </span>
        </div>
      </div>

      {/* Step timeline */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Évolution par étape</p>
        {steps.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <span className="text-sm font-semibold text-gray-700">{s.year}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{Math.round(s.pfVal).toLocaleString('fr-FR')} FCFA</span>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${s.perfTotal >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {s.perfTotal >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {s.perfTotal >= 0 ? '+' : ''}{s.perfTotal.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Simba Recap */}
      <KofiBubble
        message={kofiRecap}
        loading={kofiLoading}
        mode="recap"
        onRequest={!kofiRecap ? onRequestRecap : undefined}
        buttonLabel="Obtenir le récapitulatif Simba"
      />

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/time-machine')}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          Explorer d'autres scénarios
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Recommencer ce scénario
          </button>
        )}
      </div>
    </div>
  );
}
