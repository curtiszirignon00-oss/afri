import { useParams } from 'react-router-dom';
import ValuationPanel from '../components/valuation/ValuationPanel';
import { NAVY } from '../components/valuation/ValuationFormat';

/**
 * Page de valorisation fondamentale d'un titre : /stock/:symbol/valorisation.
 *
 * Volontairement sans entrée de navigation pour l'instant — la page n'est
 * atteignable que par lien direct, et le gating par abonnement est appliqué dans
 * ValuationPanel.
 */
export default function ValuationPage() {
  const { symbol } = useParams<{ symbol: string }>();

  if (!symbol) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center text-gray-600">
        Aucun titre spécifié.
      </div>
    );
  }

  const ticker = symbol.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Valorisation fondamentale
          </p>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
            {ticker}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl">
        <ValuationPanel symbol={ticker} />
      </div>
    </div>
  );
}
