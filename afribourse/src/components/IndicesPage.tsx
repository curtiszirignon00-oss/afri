import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Loader2 } from 'lucide-react';
import { apiFetch } from '../hooks/useApi';
import type { MarketIndex } from '../types';

// IndexChart importe lightweight-charts (~150 KB) — chargé seulement au clic sur une carte
const IndexChart = lazy(() => import('./IndexChart'));

const formatNumber = (num: number, decimals = 2) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

export default function IndicesPage() {
  const navigate = useNavigate();
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<MarketIndex[]>('/indices')
      .then(setIndices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/markets')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux marchés
          </button>
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Indices BRVM</h1>
              <p className="text-gray-600">
                Suivez les principaux indices de la Bourse Régionale des Valeurs Mobilières
              </p>
            </div>
          </div>
        </div>

        {/* Indices Cards */}
        {indices.length > 0 ? (
          <div className="space-y-6">
            {indices.map((index) => {
              const isPositive = index.daily_change_percent >= 0;
              const isSelected = selectedIndex === index.index_name;
              return (
                <div
                  key={index.id}
                  className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    isSelected ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'
                  }`}
                >
                  {/* Bande de couleur en haut */}
                  <div className={`h-1.5 ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />

                  <div className="p-6">
                    {/* Clickable header */}
                    <button
                      onClick={() => setSelectedIndex(isSelected ? null : index.index_name)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-bold text-gray-900">{index.index_name}</h3>
                        </div>
                        <div
                          className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                            isPositive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span>
                            {isPositive ? '+' : ''}
                            {index.daily_change_percent.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <p className="text-3xl font-bold text-gray-900">
                          {formatNumber(index.index_value)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Mis à jour le{' '}
                          {new Date(index.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </button>

                    {/* Chart (expandable) — lazy: lightweight-charts chargé au clic */}
                    {isSelected && (
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center h-[350px] mt-4">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                          </div>
                        }
                      >
                        <IndexChart indexName={index.index_name} />
                      </Suspense>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune donnée d'indice disponible</p>
            <p className="text-gray-400 text-sm mt-1">
              Les données seront disponibles lors de la prochaine mise à jour du marché
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">À propos des indices BRVM</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>BRVM COMPOSITE</strong> — Indice global regroupant toutes les valeurs cotées à la BRVM.
              Il reflète la performance générale du marché boursier ouest-africain.
            </p>
            <p>
              <strong>BRVM 30</strong> — Indice composé des 30 valeurs les plus actives et les plus liquides
              de la BRVM. Il sert de baromètre principal pour les investisseurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
