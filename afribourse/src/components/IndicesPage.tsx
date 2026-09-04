import { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, ChevronDown, Loader2 } from 'lucide-react';
import { apiFetch } from '../hooks/useApi';
import type { MarketIndex } from '../types';
import { lazyWithRetry } from '../lib/lazyWithRetry';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/indices';

// IndexChart importe lightweight-charts (~150 KB) — chargé seulement au clic sur une carte
const IndexChart = lazyWithRetry(() => import('./IndexChart'));

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>Indices BRVM — BRVM Composite et BRVM 30 en Temps Réel | AfriBourse</title>
        <meta name="description" content="BRVM Composite et BRVM 30 en temps réel. Suivez les indices brvm aujourd'hui avec leurs graphiques historiques. La bourse BRVM d'Afrique de l'Ouest (UEMOA) à portée de main." />
        <meta name="keywords" content="brvm, brvm composite, brvm 30, indice brvm, brvm composite aujourd'hui, brvm 30 aujourd'hui, cours brvm, brvm bourse, indices brvm, performance brvm, bourse afrique ouest, UEMOA indice bourse" />
        <link rel="canonical" href={`${SITE_URL}/indices`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="Indices BRVM Composite et BRVM 30 en Temps Réel | AfriBourse" />
        <meta property="og:description" content="BRVM Composite et BRVM 30 en temps réel avec graphiques d'évolution historique." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/indices`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="Indices BRVM en Temps Réel | AfriBourse" />
        <meta name="twitter:description" content="BRVM Composite et BRVM 30 avec graphiques historiques." />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://africbourse.com/" },
            { "@type": "ListItem", "position": 2, "name": "Indices BRVM", "item": "https://africbourse.com/indices" }
          ]
        })}</script>
      </Helmet>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Retour */}
        <button
          onClick={() => navigate('/markets')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux marchés
        </button>

        {/* En-tete — meme composition que les autres pages : titre centre sur
            une colonne etroite, chapeau en dessous. */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
            Les indices boursiers
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg md:text-xl leading-relaxed">
            Les principaux baromètres de la Bourse Régionale des Valeurs Mobilières,
            avec leur évolution historique.
          </p>
        </div>

        {/* Liste des indices — meme presentation que la liste des actions de la
            page Marchés : une carte unique, une ligne par indice separee par un
            filet, identite a gauche et chiffres a droite. Le graphique se
            deplie sous la ligne au clic. */}
        {indices.length > 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {indices.map((index) => {
                const isPositive = index.daily_change_percent >= 0;
                const isSelected = selectedIndex === index.index_name;
                return (
                  <li key={index.id}>
                    <button
                      onClick={() => setSelectedIndex(isSelected ? null : index.index_name)}
                      className="group w-full flex items-center gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 text-left transition-colors duration-150 cursor-pointer hover:bg-gray-50"
                    >
                      {/* Pastille d'indice, a la place du logo d'une action */}

                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-bold text-gray-900 font-mono tracking-tight group-hover:text-brand-navy transition-colors truncate">
                          {index.index_name}
                        </span>
                        <span className="block text-xs text-gray-400 mt-1">
                          Mis à jour le{' '}
                          {new Date(index.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </span>

                      <span className="text-right shrink-0">
                        <span className="block text-xl font-bold text-gray-900 font-mono tabular-nums leading-none">
                          {formatNumber(index.index_value)}
                        </span>
                        <span className={`block text-sm font-bold font-mono mt-1.5 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{index.daily_change_percent.toFixed(2)}%
                        </span>
                      </span>

                      <ChevronDown
                        className={`w-5 h-5 text-gray-300 shrink-0 transition-transform duration-300 ${isSelected ? 'rotate-180 text-brand-navy' : ''}`}
                      />
                    </button>

                    {/* Graphique — lazy : lightweight-charts chargé au clic */}
                    {isSelected && (
                      <div className="border-t border-gray-100 px-4 sm:px-6 pb-6 pt-4 bg-gray-50/50">
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center h-[350px]">
                              <Loader2 className="w-8 h-8 text-brand-navy animate-spin" />
                            </div>
                          }
                        >
                          <IndexChart indexName={index.index_name} />
                        </Suspense>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Aucune donnée d'indice disponible</p>
            <p className="text-gray-400 text-sm mt-1">
              Les données seront disponibles lors de la prochaine mise à jour du marché
            </p>
          </div>
        )}

        {/* Note explicative — carte grise sobre, plus l'aplat bleu d'avant. */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-3">À propos des indices BRVM</h3>
          <div className="space-y-2 text-sm text-gray-600 leading-relaxed">
            <p>
              <strong className="font-semibold text-gray-900">BRVM COMPOSITE</strong> : indice global regroupant toutes les valeurs cotées à la BRVM.
              Il reflète la performance générale du marché boursier ouest-africain.
            </p>
            <p>
              <strong className="font-semibold text-gray-900">BRVM 30</strong> : indice composé des 30 valeurs les plus actives et les plus liquides
              de la BRVM. Il sert de baromètre principal pour les investisseurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
