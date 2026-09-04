// src/components/MarketsPageRefactored.tsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/markets';
import { trackStockSearch } from '../lib/amplitude';
import { metaPixel } from '../utils/metaPixel';
import { Search, Filter, Star, PlusCircle, CheckCircle, LayoutGrid, List, Scale, ArrowRight, Wallet, AlertTriangle, TrendingUp, TrendingDown, Map, Activity } from 'lucide-react';
import { useStocks, useWatchlist, useAddToWatchlist, useRemoveFromWatchlist, usePortfolio, apiFetch, type StockFilters, type Stock } from '../hooks/useApi';
import type { MarketIndex } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { Button, Card, Input, LoadingSpinner, ErrorMessage } from './ui';
import { useAnalytics, ACTION_TYPES } from '../hooks/useAnalytics';
import StockComparison from './markets/StockComparison';
import BRVMMarketMap from './markets/BRVMMarketMap';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

import { useNavigate } from 'react-router-dom';
import { getStockLogo } from '../utils/stockLogos';
import { useMarketsPageNudge, markScreenerUsed } from '../hooks/useNudgeTriggers';
import { flashButton, highlightSection } from '../utils/nudgeUtils';

// Limites de comparaison selon l'abonnement
const COMPARISON_LIMITS: Record<string, number> = {
  free: 2,
  premium: 4,
  'investisseur-plus': Infinity,
  pro: Infinity,
  max: Infinity,
};
type MarketsPageRefactoredProps = {};

// Filtres de la liste : les trois vues d'abord, puis les sept secteurs BRVM.
// Chaque entree porte soit un onglet (tab), soit un secteur, jamais les deux.
// Cellules de la barre : trois vues de la liste, la carte du marche, puis deux
// raccourcis vers d'autres pages. Les secteurs ont quitte cette barre — ils
// restent filtrables par le selecteur de la carte de recherche, et dix cellules
// noyaient les trois vues qui comptent.
const MARKET_FILTERS: {
  key: string;
  label: string;
  icon: React.ElementType;
  tab?: 'all' | 'gainers' | 'losers';
  view?: 'list' | 'map';
  href?: string;
}[] = [
  { key: 'all',       label: 'Toutes actions',  icon: LayoutGrid,   tab: 'all' },
  { key: 'gainers',   label: 'Gagnants',        icon: TrendingUp,   tab: 'gainers' },
  { key: 'losers',    label: 'Perdants',        icon: TrendingDown, tab: 'losers' },
  { key: 'map',       label: 'Carte du marché', icon: Map,          view: 'map' },
  { key: 'indices',   label: 'Voir les indices', icon: Activity,    href: '/indices' },
  { key: 'watchlist', label: 'Ma watchlist',    icon: Star,         href: '/watchlist' },
];


export default function MarketsPageRefactored() {
  const navigate = useNavigate();
  const { trackAction } = useAnalytics();
  const { userProfile, isLoggedIn } = useAuth();

  // Déterminer la limite de comparaison selon le tier
  const subscriptionTier = (userProfile as any)?.subscriptionTier || 'free';
  const comparisonLimit = COMPARISON_LIMITS[subscriptionTier] ?? COMPARISON_LIMITS.free;
  // États locaux pour les filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'change' | 'price' | 'volume' | 'pe' | 'dividend'>('change');

  // Pill tabs navigation
  const [activeTab, setActiveTab] = useState<'all' | 'gainers' | 'losers' | 'sectors'>('all');

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minMarketCap, setMinMarketCap] = useState<number | undefined>(undefined);
  const [maxMarketCap, setMaxMarketCap] = useState<number | undefined>(undefined);
  const [minPE, setMinPE] = useState<number | undefined>(undefined);
  const [maxPE, setMaxPE] = useState<number | undefined>(undefined);
  const [minDividend, setMinDividend] = useState<number | undefined>(undefined);
  const [maxDividend, setMaxDividend] = useState<number | undefined>(undefined);

  // Vue : liste ou carte de marché
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Nudges contextuels — avec callbacks qui activent directement les features
  useMarketsPageNudge({
    OPEN_HEATMAP: () => {
      setViewMode('map');
      flashButton('heatmap-tab-btn');
      setTimeout(() => {
        highlightSection('heatmap-section', true);
        toast('Carte de marché activée : visualisez les performances BRVM', {
        icon: <LayoutGrid className="w-5 h-5 text-brand-navy" />,
          duration: 4000,
          style: { background: '#1e40af', color: '#fff', fontWeight: '600', borderRadius: '12px' },
        });
      }, 350);
    },
    OPEN_SCREENER: () => {
      setShowAdvancedFilters(true);
      flashButton('screener-section');
      setTimeout(() => {
        highlightSection('nudge-screener-panel', true);
        toast('Filtres avancés ouverts : affinez votre recherche', {
        icon: <Filter className="w-5 h-5 text-brand-navy" />,
          duration: 4000,
          style: { background: '#1e40af', color: '#fff', fontWeight: '600', borderRadius: '12px' },
        });
      }, 150);
    },
  });

  // Stock comparison
  const [comparisonStocks, setComparisonStocks] = useState<Stock[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Debounce du terme de recherche
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Préparer les filtres pour React Query
  const filters: StockFilters = useMemo(() => ({
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(selectedSector !== 'all' && { sector: selectedSector }),
    sort: sortBy,
    ...(minMarketCap !== undefined && { minMarketCap: minMarketCap.toString() }),
    ...(maxMarketCap !== undefined && { maxMarketCap: maxMarketCap.toString() }),
    ...(minPE !== undefined && { minPE: minPE.toString() }),
    ...(maxPE !== undefined && { maxPE: maxPE.toString() }),
    ...(minDividend !== undefined && { minDividend: minDividend.toString() }),
    ...(maxDividend !== undefined && { maxDividend: maxDividend.toString() }),
  }), [debouncedSearchTerm, selectedSector, sortBy, minMarketCap, maxMarketCap, minPE, maxPE, minDividend, maxDividend]);

  // Tracker les recherches (skip le premier rendu)
  const isFirstSearch = useRef(true);
  useEffect(() => {
    if (isFirstSearch.current) { isFirstSearch.current = false; return; }
    if (debouncedSearchTerm) {
      trackStockSearch(debouncedSearchTerm);
      metaPixel.search(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Indices du marché
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  useEffect(() => {
    apiFetch<MarketIndex[]>('/indices/latest?limit=5').then(setMarketIndices).catch(() => {});
  }, []);

  // Hooks React Query
  const { data: rawStocks = [], isLoading, error, refetch } = useStocks(filters);

  // Filtrage par tab actif
  const stocks = useMemo(() => {
    if (activeTab === 'gainers') return rawStocks.filter(s => s.daily_change_percent > 0);
    if (activeTab === 'losers')  return rawStocks.filter(s => s.daily_change_percent < 0).sort((a, b) => a.daily_change_percent - b.daily_change_percent);
    return rawStocks;
  }, [rawStocks, activeTab]);
  const { data: watchlist = [] } = useWatchlist(isLoggedIn);
  const { data: portfolio } = usePortfolio(isLoggedIn);
  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  // Set des tickers dans la watchlist
  const watchlistTickers = new Set(watchlist.map(item => item.stock_ticker));

  // Track les recherches
  useEffect(() => {
    if (debouncedSearchTerm) {
      trackAction(ACTION_TYPES.SEARCH_STOCK, 'Recherche d\'action', { query: debouncedSearchTerm });
    }
  }, [debouncedSearchTerm]);

  // Track les filtres par secteur
  useEffect(() => {
    if (selectedSector !== 'all') {
      trackAction(ACTION_TYPES.FILTER_STOCKS, 'Filtre par secteur', { sector: selectedSector });
    }
  }, [selectedSector]);

  // Liste des secteurs BRVM
  const sectors = [
    'all',
    'Consommation de Base',
    'Consommation Discrétionnaire',
    'Energie',
    'Industriels',
    'Services Financiers',
    'Services Publics',
    'Télécommunications'
  ];

  // Fonction pour formater les nombres
  const formatNumber = (num: number, decimals = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSector !== 'all') count++;
    if (minMarketCap !== undefined) count++;
    if (maxMarketCap !== undefined) count++;
    if (minPE !== undefined) count++;
    if (maxPE !== undefined) count++;
    if (minDividend !== undefined) count++;
    if (maxDividend !== undefined) count++;
    return count;
  }, [selectedSector, minMarketCap, maxMarketCap, minPE, maxPE, minDividend, maxDividend]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSector('all');
    setMinMarketCap(undefined);
    setMaxMarketCap(undefined);
    setMinPE(undefined);
    setMaxPE(undefined);
    setMinDividend(undefined);
    setMaxDividend(undefined);
  };

  // Comparison functions
  const addToComparison = (stock: Stock) => {
    if (comparisonStocks.length >= comparisonLimit) {
      const tierName = subscriptionTier === 'free' ? 'gratuit' : subscriptionTier;
      toast.error(
        `Limite de comparaison atteinte (${comparisonLimit} actions). ${
          subscriptionTier === 'free' || subscriptionTier === 'premium'
            ? 'Passez à un plan supérieur pour comparer plus d\'actions.'
            : ''
        }`,
        { duration: 4000 }
      );
      return;
    }
    if (comparisonStocks.find(s => s.id === stock.id)) {
      toast.error('Cette action est déjà dans la comparaison');
      return;
    }
    setComparisonStocks([...comparisonStocks, stock]);
    setShowComparison(true);
    toast.success(`${stock.symbol} ajouté à la comparaison`);
  };

  const removeFromComparison = (stockId: string) => {
    const newStocks = comparisonStocks.filter(s => s.id !== stockId);
    setComparisonStocks(newStocks);
    if (newStocks.length === 0) {
      setShowComparison(false);
    }
  };

  const closeComparison = () => {
    setComparisonStocks([]);
    setShowComparison(false);
  };

  const toggleComparison = () => {
    setShowComparison(prev => !prev);
  };

  const isInComparison = (stock: Stock) => {
    return comparisonStocks.some(s => s.id === stock.id);
  };

  // Load comparison from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const compareIds = params.get('compare');

    if (compareIds && stocks.length > 0) {
      const ids = compareIds.split(',');
      const stocksToCompare = stocks.filter(s => ids.includes(s.id));

      if (stocksToCompare.length > 0) {
        setComparisonStocks(stocksToCompare);
        setShowComparison(true);
        toast.success(`${stocksToCompare.length} action(s) chargée(s) pour comparaison`);
      }
    }
  }, [stocks]);

  // Gestion de la watchlist
  const handleToggleWatchlist = async (stockTicker: string) => {
    const isInWatchlist = watchlistTickers.has(stockTicker);

    try {
      if (isInWatchlist) {
        await removeFromWatchlist.mutateAsync(stockTicker);
        trackAction(ACTION_TYPES.REMOVE_FROM_WATCHLIST, 'Retrait de la watchlist', { ticker: stockTicker });
      } else {
        await addToWatchlist.mutateAsync(stockTicker);
        trackAction(ACTION_TYPES.ADD_TO_WATCHLIST, 'Ajout à la watchlist', { ticker: stockTicker });
      }
    } catch (error) {
      console.error('Erreur watchlist:', error);
    }
  };

  // Affichage du loading
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Chargement des marchés..." />;
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <ErrorMessage
        fullScreen
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <Helmet>
        <title>Marchés BRVM — Cours des Actions en Temps Réel | AfriBourse</title>
        <meta name="description" content="Cours en temps réel de toutes les actions BRVM. Consultez le cours de chaque action brvm, filtres par secteur, heatmap du marché BRVM et comparaison de valeurs cotées sur la Bourse Régionale des Valeurs Mobilières." />
        <meta name="keywords" content="brvm, brvm action, cours brvm, action brvm, brvm bourse, brvm cours, brvm aujourd'hui, brvm composite, cours actions brvm, bourse brvm, toutes les actions brvm, cours actions temps réel, bourse Afrique de l'Ouest, SGI bourse Afrique, cours bourse Côte d'Ivoire, UEMOA bourse" />
        <link rel="canonical" href={`${SITE_URL}/markets`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="Marchés BRVM — Cours des Actions en Temps Réel | AfriBourse" />
        <meta property="og:description" content="Tous les cours de la BRVM en temps réel. Filtres, comparaisons, heatmap et indicateurs pour investir sur la bourse d'Afrique de l'Ouest." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/markets`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="Marchés BRVM — Cours en Temps Réel | AfriBourse" />
        <meta name="twitter:description" content="Tous les cours de la BRVM en temps réel. Filtres, comparaisons et heatmap." />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FinancialService",
          "@id": "https://africbourse.com/markets#financialservice",
          "name": "AfriBourse — Marchés BRVM",
          "description": "Suivi des cours de la BRVM (Bourse Régionale des Valeurs Mobilières) en temps réel pour les investisseurs d'Afrique de l'Ouest.",
          "url": "https://africbourse.com/markets",
          "provider": { "@id": "https://africbourse.com/#organization" },
          "areaServed": { "@type": "Place", "name": "UEMOA — Union Économique et Monétaire Ouest-Africaine" },
          "serviceType": "Suivi des marchés boursiers BRVM",
          "inLanguage": "fr"
        })}</script>
      </Helmet>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* En-tete — meme sequence que la page Learn : titre, chapeau, bouton,
            puis l'encart d'avertissement, puis la barre de categories. */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
            Marchés BRVM
          </h1>
          <p className="text-gray-600 text-sm sm:text-lg md:text-xl leading-relaxed mb-5">
            Cours, volumes et ratios des {stocks.length} société{stocks.length > 1 ? 's' : ''} cotée{stocks.length > 1 ? 's' : ''} à la Bourse Régionale des Valeurs Mobilières, mis à jour au fil des séances.
          </p>
          <button
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/signup')}
            className="inline-flex items-center gap-2 h-14 bg-gradient-to-r from-brand-navy to-[#173F66] hover:from-brand-navy-hover hover:to-brand-navy-hover text-white font-bold text-sm px-7 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 shrink-0" />
            {isLoggedIn ? 'Ouvrir mon portefeuille' : 'Ouvrir un portefeuille virtuel'}
          </button>
        </div>

        {/* Encart orange — meme carte que celle de la page Learn. Deux etats :
            invitation a se connecter, ou solde du portefeuille virtuel. */}
        {!isLoggedIn ? (
          <div className="max-w-2xl mx-auto bg-white border-2 border-brand-orange rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-6 h-6 text-brand-orange flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  Connectez-vous pour investir
                </p>
                <p className="text-gray-600 text-sm">
                  Créez un compte gratuit pour suivre vos actions, comparer les valeurs et
                  passer vos premiers ordres avec un capital virtuel.
                </p>
              </div>
            </div>
          </div>
        ) : portfolio && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full max-w-2xl mx-auto flex items-center gap-4 text-left bg-white border-2 border-brand-orange rounded-2xl p-6 mb-8 shadow-sm transition-shadow duration-200 hover:shadow-md cursor-pointer"
          >
            <Wallet className="w-6 h-6 text-brand-orange flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Solde disponible — portefeuille virtuel
              </p>
              <p className="text-2xl font-bold text-gray-900 font-mono tabular-nums leading-none">
                {formatNumber(portfolio.cash_balance)}
                <span className="text-sm font-semibold text-gray-400 ml-1.5">FCFA</span>
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 shrink-0" />
          </button>
        )}

        {/* Filtres — memes cellules que les themes de la page Learn : icone au
            dessus, libelle en dessous, largeur egale sur une grille. Les trois
            vues (toutes / gagnants / perdants) et les sept secteurs y sont sur
            le meme plan : ce sont tous des filtres de la meme liste, l'onglet
            « Secteurs » qui les cachait derriere un second niveau n'avait pas
            lieu d'etre. */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-8 sticky top-20 z-30">
          <div className="flex md:grid md:grid-cols-6 gap-2 sm:gap-3 overflow-x-auto md:overflow-visible scrollbar-hide pb-1 -mx-1 px-1 snap-x snap-mandatory">
            {MARKET_FILTERS.map((f) => {
              // Les raccourcis vers une autre page ne s'allument jamais : ils
              // quittent la page au lieu de filtrer la liste.
              const active = f.href
                ? false
                : f.view
                  ? viewMode === 'map'
                  : activeTab === f.tab && viewMode === 'list';

              return (
                <button
                  key={f.key}
                  onClick={() => {
                    if (f.href) {
                      navigate(f.href);
                    } else if (f.view) {
                      setViewMode(f.view);
                    } else {
                      setActiveTab(f.tab!);
                      setViewMode('list');
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl font-semibold text-xs text-center transition-colors duration-200 flex-shrink-0 md:flex-shrink snap-start min-w-[92px] md:min-w-0 ${active
                    ? 'bg-gradient-to-r from-brand-navy to-[#173F66] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <f.icon className="w-5 h-5 shrink-0" />
                  <span className="leading-tight">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Indices — bande compacte plutot que deux grandes cartes : ce sont
            des reperes de contexte, pas le sujet de la page. */}
        {marketIndices.length > 0 && (
          <div className="flex items-stretch gap-2 mb-6 overflow-x-auto scrollbar-hide">
            {marketIndices.map((index) => {
              const isUp = index.daily_change_percent >= 0;
              return (
                <button
                  key={index.id}
                  onClick={() => navigate('/indices')}
                  className="group flex flex-1 min-w-[190px] items-center justify-between gap-3 bg-gray-100 border border-transparent rounded-xl px-4 py-2.5 transition-colors duration-150 cursor-pointer hover:bg-gray-200 hover:border-brand-navy/25"
                >
                  <span className="text-xs font-semibold text-gray-500 group-hover:text-brand-navy transition-colors">
                    {index.index_name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 font-mono tabular-nums">
                    {formatNumber(index.index_value, 2)}
                  </span>
                  <span className={`text-xs font-bold font-mono ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                    {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{index.daily_change_percent.toFixed(2)}%
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => navigate('/indices')}
              className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy hover:underline cursor-pointer px-3 whitespace-nowrap"
            >
              Tous les indices
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <Input
                icon={<Search className="w-5 h-5" />}
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm !== debouncedSearchTerm && (
                <p className="text-xs text-gray-500 mt-1 ml-1">Recherche en cours...</p>
              )}
            </div>

            {/* Filtre secteur */}
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full h-11 pl-10 pr-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent cursor-pointer appearance-none"
              >
                <option value="all">Tous les secteurs</option>
                {sectors.slice(1).map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full md:w-48 h-11 px-4 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent cursor-pointer"
            >
              <option value="name">Nom (A-Z)</option>
              <option value="change">Variation (%)</option>
              <option value="price">Prix</option>
              <option value="volume">Volume</option>
              <option value="pe">P/E Ratio</option>
              <option value="dividend">Dividende (%)</option>
            </select>
          </div>

          {/* Advanced Filters Toggle + Compare button */}
          <div className="flex items-center gap-3 flex-wrap mt-6">
            <Button
              id="screener-section"
              onClick={() => { setShowAdvancedFilters(!showAdvancedFilters); markScreenerUsed(); }}
              variant={showAdvancedFilters ? 'navy' : 'navyOutline'}
              size="md"
              className="h-12 gap-2"
            >
              <Filter className="w-4 h-4 shrink-0" />
              Filtres avancés
              {activeFiltersCount > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${showAdvancedFilters ? 'bg-white text-brand-navy' : 'bg-brand-navy text-white'}`}>
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                onClick={resetFilters}
                variant="ghost"
                size="md"
                className="h-12"
              >
                Réinitialiser
              </Button>
            )}
            <Button
              onClick={toggleComparison}
              variant={showComparison ? 'orange' : 'navyOutline'}
              size="md"
              className="h-12 gap-2"
            >
              <Scale className="w-4 h-4 shrink-0" />
              Comparer
              {comparisonStocks.length > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${showComparison ? 'bg-white text-brand-orange-dark' : 'bg-brand-navy text-white'}`}>
                  {comparisonStocks.length}
                </span>
              )}
            </Button>
          </div>
        </Card>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <Card id="nudge-screener-panel" className="mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres avancés</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Market Cap Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capitalisation boursière (FCFA)
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min (ex: 1000000)"
                      value={minMarketCap ?? ''}
                      onChange={(e) => setMinMarketCap(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max (ex: 100000000)"
                      value={maxMarketCap ?? ''}
                      onChange={(e) => setMaxMarketCap(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ex: 1M = 1000000, 1Mrd = 1000000000
                  </p>
                </div>

                {/* P/E Ratio Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ratio P/E (Price to Earnings)
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min (ex: 5)"
                      value={minPE ?? ''}
                      onChange={(e) => setMinPE(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max (ex: 20)"
                      value={maxPE ?? ''}
                      onChange={(e) => setMaxPE(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valeurs typiques: 10-20
                  </p>
                </div>

                {/* Dividend Yield Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rendement du dividende (%)
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min (ex: 2)"
                      value={minDividend ?? ''}
                      onChange={(e) => setMinDividend(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max (ex: 10)"
                      value={maxDividend ?? ''}
                      onChange={(e) => setMaxDividend(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Valeurs typiques: 2-10%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stock Comparison Section */}
        {showComparison && (
          <StockComparison
            stocks={comparisonStocks}
            allStocks={stocks}
            onRemove={removeFromComparison}
            onAdd={addToComparison}
            onClose={closeComparison}
            comparisonLimit={comparisonLimit}
          />
        )}

        {/* Bascule vue liste / carte de marché */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              id="heatmap-tab-btn"
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'map'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Carte de marché</span>
            </button>
          </div>

          {/* Indication scroll (visible uniquement en vue liste sur mobile) */}
          {viewMode === 'list' && (
            <div className="flex md:hidden items-center gap-2 text-xs text-gray-500 px-1">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Glissez pour voir P/E, Dividende, Cap. Boursière</span>
            </div>
          )}
        </div>

        {/* Vue Carte de marché */}
        {viewMode === 'map' && (
          <div id="heatmap-section">
            <BRVMMarketMap stocks={stocks} loading={isLoading} />
          </div>
        )}

        {/* Tableau des actions (vue liste) */}
        {/* Liste des actions — une ligne par societe, deux niveaux de lecture :
            l'identite et le cours en premier, les ratios en second, en gris.
            Le tableau a huit colonnes qu'elle remplace obligeait a faire defiler
            la page horizontalement pour atteindre le P/E et le dividende. */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {stocks.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-gray-500">
                  {debouncedSearchTerm || selectedSector !== 'all'
                    ? 'Aucune action trouvée avec ces critères.'
                    : 'Aucune action disponible.'}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stocks.map((stock) => {
                  const logo = getStockLogo(stock.symbol, stock.logo_url);
                  const isUp = stock.daily_change_percent >= 0;

                  return (
                    <li
                      key={stock.id}
                      onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      className="group flex items-center gap-4 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 cursor-pointer transition-colors duration-150 hover:bg-gray-50"
                    >
                      {/* Comparaison et watchlist — actions secondaires, donc
                          discretes tant que la ligne n'est pas survolee. */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            isInComparison(stock) ? removeFromComparison(stock.id) : addToComparison(stock);
                          }}
                          className="p-1.5 text-gray-300 hover:text-brand-navy transition-colors cursor-pointer"
                          title={isInComparison(stock) ? 'Retirer de la comparaison' : 'Ajouter à la comparaison'}
                        >
                          {isInComparison(stock)
                            ? <CheckCircle className="w-5 h-5 text-brand-navy" />
                            : <PlusCircle className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleWatchlist(stock.symbol); }}
                          className="p-1.5 cursor-pointer"
                          title="Suivre cette action"
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${watchlistTickers.has(stock.symbol)
                              ? 'fill-brand-orange text-brand-orange'
                              : 'text-gray-300 hover:text-brand-orange'}`}
                          />
                        </button>
                      </div>

                      {/* Logo */}
                      <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                        {logo
                          ? <img src={logo} alt="" className="w-full h-full object-contain" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />
                          : <span className="text-xs font-bold text-gray-400">{stock.symbol.slice(0, 2)}</span>}
                      </div>

                      {/* Identite + ratios */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900 font-mono tracking-tight group-hover:text-brand-navy transition-colors">
                            {stock.symbol}
                          </span>
                          <span className="text-sm text-gray-500 truncate">{stock.company_name}</span>
                        </div>
                        {stock.sector && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{stock.sector}</p>
                        )}
                      </div>

                      {/* Cours et variation */}
                      <div className="text-right shrink-0">
                        <p className="text-xl font-bold text-gray-900 font-mono tabular-nums leading-none">
                          {formatNumber(stock.current_price)}
                          <span className="text-sm font-semibold text-gray-400 ml-1.5">FCFA</span>
                        </p>
                        <p className={`text-sm font-bold font-mono mt-1.5 ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                          {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{stock.daily_change_percent.toFixed(2)}%
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}