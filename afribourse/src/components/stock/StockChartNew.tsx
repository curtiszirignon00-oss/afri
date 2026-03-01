import { useState, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Loader2, Maximize2, Minimize2, TrendingUp as Indicator, Lock, Share2, Info, PenLine } from 'lucide-react';
import { useStockChart } from '../../hooks/useStockChart';
import { useAuth } from '../../contexts/AuthContext';
import type { ChartType, TimeInterval, OHLCVData, PriceChange } from '../../types/chart.types';
import type { CandleResolution } from '../../utils/chartDataAdapter';
import { applyResolution, RESOLUTION_LABEL } from '../../utils/chartDataAdapter';
import ChartShareModal from './ChartShareModal';
import ChartDrawingToolbar from './ChartDrawingToolbar';

interface StockChartProps {
  symbol: string;
  data: OHLCVData[];
  onIntervalChange?: (interval: TimeInterval) => void;
  currentInterval?: TimeInterval;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
}

// Chaque entrée définit :
//   label          → texte affiché sur le bouton
//   resolution     → granularité de chaque bougie
//   backendPeriod  → période envoyée au backend pour récupérer les données
//   resolutionInfo → texte descriptif affiché dans le badge
type DisplayInterval = '1H' | '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

interface IntervalConfig {
  value: DisplayInterval;
  label: string;
  resolution: CandleResolution;
  backendPeriod: TimeInterval;  // période demandée au backend
  premium?: boolean;
}

const DISPLAY_INTERVALS: IntervalConfig[] = [
  { value: '1H', label: '1H',  resolution: 'hourly',     backendPeriod: '5D',  premium: true },
  { value: '1D', label: '1J',  resolution: 'daily',      backendPeriod: 'ALL' },
  { value: '1W', label: '5J',  resolution: 'weekly',     backendPeriod: 'ALL' },
  { value: '1M', label: '1M',  resolution: 'monthly',    backendPeriod: 'ALL' },
  { value: '3M', label: '3M',  resolution: 'quarterly',  backendPeriod: 'ALL' },
  { value: '6M', label: '6M',  resolution: 'semiannual', backendPeriod: 'ALL' },
  { value: '1Y', label: '1A',  resolution: 'annual',     backendPeriod: 'ALL' },
];

const CHART_TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: 'candlestick', label: 'Chandeliers', icon: '📊' },
  { value: 'area', label: 'Aires', icon: '📈' },
  { value: 'line', label: 'Ligne', icon: '📉' },
  { value: 'bar', label: 'Barres', icon: '📊' },
];

export default function StockChartNew({
  symbol,
  data,
  onIntervalChange,
  currentInterval = '1Y',
  isLoading = false,
  theme = 'light',
}: StockChartProps) {
  const { userProfile } = useAuth();
  const isPremium = userProfile?.subscriptionTier && userProfile.subscriptionTier !== 'free';

  // Intervalle d'affichage (résolution des bougies)
  const [selectedDisplay, setSelectedDisplay] = useState<DisplayInterval>('1D');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('candlestick');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [chartScreenshot, setChartScreenshot] = useState<string | null>(null);
  const [showDrawingToolbar, setShowDrawingToolbar] = useState(false);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeConfig = DISPLAY_INTERVALS.find(i => i.value === selectedDisplay)!;

  // Données agrégées selon la résolution de bougie sélectionnée
  const displayData = useMemo(() => {
    if (!data || data.length === 0) return data;
    return applyResolution(data, activeConfig.resolution);
  }, [data, activeConfig.resolution]);

  const { chartContainerRef, isReady, takeScreenshot, startDrawing, deleteSelectedTools, clearAllDrawings } = useStockChart({
    chartType: selectedChartType,
    theme,
    data: displayData,
    indicators: activeIndicators,
  });

  // Synchroniser l'état isFullscreen avec le vrai état du navigateur
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Toggle indicateur
  const toggleIndicator = (indicator: string) => {
    setActiveIndicators(prev =>
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // Calculer la variation sur la période (données brutes = toute la période disponible)
  const periodChange = useMemo((): PriceChange => {
    if (!data || data.length < 2) {
      return { value: 0, percent: 0, isPositive: true };
    }
    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = lastPrice - firstPrice;
    const changePercent = (change / firstPrice) * 100;
    return { value: change, percent: changePercent, isPositive: change >= 0 };
  }, [data]);

  const resolutionLabel = RESOLUTION_LABEL[activeConfig.resolution];

  const handleDisplayIntervalChange = (display: DisplayInterval) => {
    const config = DISPLAY_INTERVALS.find(i => i.value === display)!;
    setSelectedDisplay(display);
    // Notifier le parent du backend period à fetcher
    if (onIntervalChange) {
      onIntervalChange(config.backendPeriod);
    }
  };

  const handleChartTypeChange = (chartType: ChartType) => {
    setSelectedChartType(chartType);
  };

  const handleShare = async () => {
    const screenshot = await takeScreenshot(symbol);
    setChartScreenshot(screenshot);
    setShowShareModal(true);
  };

  const handleDrawingToolSelect = (toolType: string) => {
    if (toolType === 'cursor') {
      setActiveDrawingTool(null);
      return;
    }
    setActiveDrawingTool(toolType);
    startDrawing(toolType);
  };

  // Formatter pour afficher les prix
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const containerClasses = theme === 'dark'
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';

  const textClasses = theme === 'dark'
    ? 'text-gray-100'
    : 'text-gray-900';

  const mutedTextClasses = theme === 'dark'
    ? 'text-gray-400'
    : 'text-gray-500';

  const buttonBgClasses = theme === 'dark'
    ? 'bg-gray-700'
    : 'bg-gray-100';

  const buttonActiveBgClasses = theme === 'dark'
    ? 'bg-gray-600 text-blue-400'
    : 'bg-white text-blue-600';

  const buttonHoverBgClasses = theme === 'dark'
    ? 'hover:bg-gray-600'
    : 'hover:bg-gray-200';

  if (isLoading) {
    return (
      <div className={`${containerClasses} rounded-xl shadow-sm border p-6 md:p-8`}>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`${containerClasses} rounded-xl shadow-sm border p-4 md:p-6 ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">

        {/* Ligne 1 : Symbole + variation | Plein écran */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={`text-xl md:text-2xl font-bold ${textClasses} mb-1 truncate`}>
              {symbol}
            </h3>
            {data.length > 0 && (
              <div className={`flex items-center flex-wrap gap-x-2 gap-y-0.5 text-sm ${
                periodChange.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {periodChange.isPositive ? <TrendingUp className="w-4 h-4 flex-shrink-0" /> : <TrendingDown className="w-4 h-4 flex-shrink-0" />}
                <span className="font-semibold whitespace-nowrap">
                  {periodChange.isPositive ? '+' : ''}{formatPrice(periodChange.value)} FCFA
                  ({periodChange.isPositive ? '+' : ''}{periodChange.percent.toFixed(2)}%)
                </span>
                <span className={`${mutedTextClasses} whitespace-nowrap`}>sur la période</span>
              </div>
            )}
          </div>
          <button
            onClick={toggleFullscreen}
            className={`flex-shrink-0 p-2 ${buttonBgClasses} ${mutedTextClasses} ${buttonHoverBgClasses} rounded-lg transition-all`}
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Ligne 2 : Timeframes + badge résolution */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex ${buttonBgClasses} rounded-lg p-1`}>
            {DISPLAY_INTERVALS.map((interval) => {
              const isLocked = !!interval.premium && !isPremium;
              return (
                <button
                  key={interval.value}
                  onClick={() => { if (!isLocked) handleDisplayIntervalChange(interval.value); }}
                  className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                    isLocked
                      ? 'text-gray-400 cursor-not-allowed opacity-60'
                      : selectedDisplay === interval.value
                        ? `${buttonActiveBgClasses} shadow-sm`
                        : `${mutedTextClasses} ${buttonHoverBgClasses}`
                  }`}
                  title={isLocked ? 'Disponible avec un abonnement Premium' : RESOLUTION_LABEL[interval.resolution]}
                >
                  {interval.label}
                  {isLocked && <Lock className="w-2.5 h-2.5" />}
                </button>
              );
            })}
          </div>

          {/* Badge résolution — visible uniquement en mode chandelier ou barre */}
          {(selectedChartType === 'candlestick' || selectedChartType === 'bar') && (
            <div className="flex items-center gap-2">
              {activeConfig.resolution === 'hourly' && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
                  <Info className="w-3 h-3" />
                  <span className="hidden sm:inline">Données journalières</span>
                </span>
              )}
              <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${
                activeConfig.resolution === 'hourly' || activeConfig.resolution === 'daily'
                  ? 'bg-blue-50 text-blue-600'
                  : activeConfig.resolution === 'weekly'
                    ? 'bg-violet-50 text-violet-600'
                    : activeConfig.resolution === 'monthly'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
              }`}>
                {resolutionLabel}
              </span>
            </div>
          )}
        </div>

        {/* Ligne 3 : Type de graphique | Indicateurs · Dessiner · Partager */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Type selector */}
          <div className={`flex ${buttonBgClasses} rounded-lg p-1`}>
            {CHART_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => handleChartTypeChange(type.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                  selectedChartType === type.value
                    ? `${buttonActiveBgClasses} shadow-sm`
                    : `${mutedTextClasses} ${buttonHoverBgClasses}`
                }`}
                title={type.label}
              >
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
                showIndicators
                  ? 'bg-blue-100 text-blue-600 border border-blue-300'
                  : `${buttonBgClasses} ${mutedTextClasses} ${buttonHoverBgClasses} border border-transparent`
              }`}
              title="Indicateurs techniques"
            >
              <Indicator className="w-4 h-4" />
              <span>Indicateurs</span>
            </button>

            <button
              onClick={() => {
                setShowDrawingToolbar(!showDrawingToolbar);
                if (showDrawingToolbar) setActiveDrawingTool(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${
                showDrawingToolbar
                  ? 'bg-blue-100 text-blue-600 border border-blue-300'
                  : `${buttonBgClasses} ${mutedTextClasses} ${buttonHoverBgClasses} border border-transparent`
              }`}
              title="Outils de dessin"
            >
              <PenLine className="w-4 h-4" />
              <span>Dessiner</span>
            </button>

            <button
              onClick={handleShare}
              disabled={!isReady || data.length === 0}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium ${buttonBgClasses} ${mutedTextClasses} ${buttonHoverBgClasses} border border-transparent disabled:opacity-40`}
              title="Partager le graphique"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </button>
          </div>
        </div>

        {/* Menu Indicateurs techniques */}
        {showIndicators && (
          <div className={`${containerClasses} border rounded-lg p-4 space-y-2`}>
            <h4 className={`text-sm font-semibold ${textClasses} mb-3`}>Indicateurs Techniques</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'volume', label: 'Volume', description: 'Afficher le volume', premium: false },
                { id: 'ma20', label: 'MA 20', description: 'Moyenne mobile 20 périodes', premium: true },
                { id: 'ma50', label: 'MA 50', description: 'Moyenne mobile 50 périodes', premium: true },
                { id: 'ma200', label: 'MA 200', description: 'Moyenne mobile 200 périodes', premium: true },
                { id: 'ema12', label: 'EMA 12', description: 'Moyenne mobile exponentielle 12', premium: true },
                { id: 'bb', label: 'Bollinger', description: 'Bandes de Bollinger', premium: true },
              ].map((indicator) => {
                const isLocked = indicator.premium && !isPremium;
                return (
                  <button
                    key={indicator.id}
                    onClick={() => {
                      if (isLocked) return;
                      toggleIndicator(indicator.id);
                    }}
                    className={`px-3 py-2 text-xs font-medium rounded-md transition-all text-left ${
                      isLocked
                        ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                        : activeIndicators.includes(indicator.id)
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : `${buttonBgClasses} ${mutedTextClasses} ${buttonHoverBgClasses} border border-transparent`
                    }`}
                    title={isLocked ? 'Disponible avec un abonnement Premium' : indicator.description}
                    disabled={isLocked}
                  >
                    <div className="flex items-center justify-between">
                      <span>{indicator.label}</span>
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : activeIndicators.includes(indicator.id) ? (
                        <span className="text-blue-600">✓</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            {!isPremium && (
              <p className={`text-xs text-amber-600 mt-2`}>
                Les indicateurs techniques (MA, EMA, Bollinger) sont réservés aux abonnés Premium
              </p>
            )}
          </div>
        )}
      </div>

      {/* Graphique */}
      {data.length > 0 ? (
        <div className="relative">
          <div
            ref={chartContainerRef}
            className="w-full"
            style={{
              height: isFullscreen ? 'calc(100vh - 180px)' : '500px',
              minHeight: isFullscreen ? 'calc(100vh - 180px)' : '500px',
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff'
            }}
          />
          {/* Barre d'outils de dessin flottante (gauche) */}
          {showDrawingToolbar && isReady && (
            <div className="absolute left-2 top-2 z-10">
              <ChartDrawingToolbar
                onToolSelect={handleDrawingToolSelect}
                onDeleteSelected={deleteSelectedTools}
                onClearAll={clearAllDrawings}
                activeTool={activeDrawingTool}
                theme={theme}
              />
            </div>
          )}
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center h-96 ${mutedTextClasses}`}>
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm">Aucune donnée d'historique disponible pour cette période</p>
        </div>
      )}

      {/* Légende */}
      <div className={`mt-4 text-xs ${mutedTextClasses} flex flex-wrap gap-4 justify-center`}>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Hausse</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Baisse</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>📊</span>
          <span>Indicateurs</span>
        </div>
      </div>

      {/* Modal de partage du graphique */}
      <ChartShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        symbol={symbol}
        dataUrl={chartScreenshot}
        periodLabel={activeConfig.label}
        changePercent={periodChange.percent}
        changeValue={periodChange.value}
      />
    </div>
  );
}
