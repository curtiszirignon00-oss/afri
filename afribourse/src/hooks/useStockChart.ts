import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeriesPartialOptions,
  LineSeriesPartialOptions,
  AreaSeriesPartialOptions,
  HistogramSeriesPartialOptions,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts-line-tools';
import type {
  ChartType,
  OHLCVData,
  CandlestickData,
  LineData,
  AreaData,
  HistogramData,
  ChartColors,
} from '../types/chart.types';
import {
  calculateSMA, calculateEMA, calculateBollingerBands,
  calculateRSI,
  calculateStochastic, calculateWilliamsR, calculateCCI,
  calculateROC, calculateMFI, calculateAroon,
  calculateATR, calculateADX, calculateOBV, calculateVWAP,
  calculateIchimoku, calculatePivotPoints,
} from '../utils/indicators';

interface UseStockChartProps {
  chartType: ChartType;
  theme: 'light' | 'dark';
  data: OHLCVData[];
  indicators?: string[]; // Liste des indicateurs actifs
}

// Couleurs AfriBourse (constante hors du hook)
const CHART_COLORS: ChartColors = {
  upColor: '#10b981', // vert pour hausse
  downColor: '#ef4444', // rouge pour baisse
  wickUpColor: '#10b981',
  wickDownColor: '#ef4444',
  borderUpColor: '#10b981',
  borderDownColor: '#ef4444',
};

export const useStockChart = ({ chartType, theme, data, indicators }: UseStockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const oscillatorContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const oscillatorChartRef = useRef<IChartApi | null>(null);
  const syncingRef = useRef(false);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // IDs des indicateurs qui vont dans le panneau oscillateur (séparé)
  const OSCILLATOR_IDS = ['rsi', 'stoch', 'willr', 'cci', 'roc', 'mfi', 'aroon', 'atr', 'adx', 'obv'];
  const hasOscillator = !!(indicators?.some(id => OSCILLATOR_IDS.includes(id)));

  // Refs pour les indicateurs techniques
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Tendance & Volume — nouveaux indicateurs
  const atrSeriesRef    = useRef<ISeriesApi<'Line'> | null>(null);
  const adxPlusRef      = useRef<ISeriesApi<'Line'> | null>(null);
  const adxMinusRef     = useRef<ISeriesApi<'Line'> | null>(null);
  const adxLineRef      = useRef<ISeriesApi<'Line'> | null>(null);
  const obvSeriesRef    = useRef<ISeriesApi<'Line'> | null>(null);
  const vwapSeriesRef   = useRef<ISeriesApi<'Line'> | null>(null);
  const ichTenkanRef    = useRef<ISeriesApi<'Line'> | null>(null);
  const ichKijunRef     = useRef<ISeriesApi<'Line'> | null>(null);
  const ichSpanARef     = useRef<ISeriesApi<'Line'> | null>(null);
  const ichSpanBRef     = useRef<ISeriesApi<'Line'> | null>(null);
  const ichChikouRef    = useRef<ISeriesApi<'Line'> | null>(null);
  const pivotPRef       = useRef<ISeriesApi<'Line'> | null>(null);
  const pivotR1Ref      = useRef<ISeriesApi<'Line'> | null>(null);
  const pivotR2Ref      = useRef<ISeriesApi<'Line'> | null>(null);
  const pivotS1Ref      = useRef<ISeriesApi<'Line'> | null>(null);
  const pivotS2Ref      = useRef<ISeriesApi<'Line'> | null>(null);

  const rsiSeriesRef    = useRef<ISeriesApi<'Line'> | null>(null);

  // Oscillateurs (pane inférieur — priceScaleId séparé)
  const stochKSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const stochDSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const willrSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const cciSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rocSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const mfiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const aroonUpSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const aroonDownSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [isReady, setIsReady] = useState(false);

  // ── Suivi de session de dessin (API publique uniquement) ──────────────────
  /** IDs des outils présents AVANT de commencer la session de dessin */
  const preSessionIdsRef = useRef<Set<string>>(new Set());
  /** IDs des outils COMPLÉTÉS pendant la session (via subscribeLineToolsAfterEdit) */
  const completedDrawingIdsRef = useRef<Set<string>>(new Set());
  /** Fonction de désabonnement à subscribeLineToolsAfterEdit */
  const drawingSubscriptionRef = useRef<(() => void) | null>(null);
  /** Vrai si une session de dessin est active */
  const inDrawingSessionRef = useRef<boolean>(false);

  // Utiliser une clé pour détecter les vrais changements de données
  const dataKey = data.length > 0
    ? `${data.length}-${data[0]?.time}-${data[data.length - 1]?.time}`
    : 'empty';
  const prevDataKeyRef = useRef<string>('');
  const prevChartTypeRef = useRef<ChartType>(chartType);

  // Convertir les données OHLCV en format approprié selon le type de graphique
  const convertData = () => {
    if (!data || data.length === 0) return [];

    switch (chartType) {
      case 'candlestick':
        return data.map((d): CandlestickData => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
      case 'line':
        return data.map((d): LineData => ({
          time: d.time,
          value: d.close,
        }));
      case 'area':
        return data.map((d): AreaData => ({
          time: d.time,
          value: d.close,
        }));
      case 'bar':
        return data.map((d): CandlestickData => ({
          time: d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
      default:
        return [];
    }
  };

  // Convertir les données de volume
  const convertVolumeData = (): HistogramData[] => {
    if (!data || data.length === 0) return [];

    return data.map((d, index) => ({
      time: d.time,
      value: d.volume,
      color:
        index > 0 && d.close >= data[index - 1].close
          ? CHART_COLORS.upColor + '40' // 40 = opacité 25%
          : CHART_COLORS.downColor + '40',
    }));
  };

  // Configuration du graphique
  const getChartOptions = () => {
    const isDark = theme === 'dark';
    return {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1f2937' : '#ffffff' },
        textColor: isDark ? '#9ca3af' : '#6b7280',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: {
          color: isDark ? '#374151' : '#f1f5f9',
          style: 1,
        },
        horzLines: {
          color: isDark ? '#374151' : '#f1f5f9',
          style: 1,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1 as const,
          color: isDark ? '#6b7280' : '#94a3b8',
          style: 3 as const,
        },
        horzLine: {
          width: 1 as const,
          color: isDark ? '#6b7280' : '#94a3b8',
          style: 3 as const,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#374151' : '#e2e8f0',
        scaleMargins: {
          top: 0.05,
          bottom: 0.05,
        },
      },
      timeScale: {
        borderColor: isDark ? '#374151' : '#e2e8f0',
        timeVisible: false,     // inutile en daily — on n'affiche pas l'heure
        secondsVisible: false,
        tickMarkFormatter: (time: { year: number; month: number; day: number } | number, tickMarkType: number) => {
          // Avec les dates YYYY-MM-DD, lightweight-charts passe un BusinessDay {year, month, day}
          const t = time as { year: number; month: number; day: number };
          const d = new Date(t.year, t.month - 1, t.day);
          switch (tickMarkType) {
            case 0: // Year
              return String(t.year);
            case 1: // Month
              return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
            default: // DayOfMonth
              return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          }
        },
      },
      localization: {
        locale: 'fr-FR',
        priceFormatter: (price: number) => {
          return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(price) + ' FCFA';
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    };
  };

  // Configuration des séries selon le type
  const getSeriesOptions = ():
    | CandlestickSeriesPartialOptions
    | LineSeriesPartialOptions
    | AreaSeriesPartialOptions => {
    switch (chartType) {
      case 'candlestick':
      case 'bar':
        return {
          upColor: CHART_COLORS.upColor,
          downColor: CHART_COLORS.downColor,
          wickUpColor: CHART_COLORS.wickUpColor,
          wickDownColor: CHART_COLORS.wickDownColor,
          borderUpColor: CHART_COLORS.borderUpColor,
          borderDownColor: CHART_COLORS.borderDownColor,
          borderVisible: true,
        } as CandlestickSeriesPartialOptions;
      case 'line':
        return {
          color: CHART_COLORS.upColor,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
          lastValueVisible: true,
          priceLineVisible: true,
        } as LineSeriesPartialOptions;
      case 'area':
        return {
          topColor: CHART_COLORS.upColor + '40',
          bottomColor: CHART_COLORS.upColor + '00',
          lineColor: CHART_COLORS.upColor,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
          lastValueVisible: true,
          priceLineVisible: true,
        } as AreaSeriesPartialOptions;
      default:
        return {};
    }
  };

  // Initialisation du graphique (uniquement à la première création)
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.log('useStockChart: chartContainerRef not ready');
      return;
    }

    console.log('useStockChart: Initializing chart');

    // Créer le graphique
    const chart = createChart(chartContainerRef.current, {
      ...getChartOptions(),
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    chartRef.current = chart;
    console.log('useStockChart: Chart created');

    // Graphique oscillateur (panneau séparé en dessous)
    if (oscillatorContainerRef.current) {
      const isDark = theme === 'dark';
      const oscOpts = getChartOptions();
      const oscChart = createChart(oscillatorContainerRef.current, {
        ...oscOpts,
        width: chartContainerRef.current.clientWidth,
        height: 150,
        localization: {
          locale: 'fr-FR',
          priceFormatter: (price: number) => price.toFixed(2),
        },
        rightPriceScale: {
          borderColor: isDark ? '#374151' : '#e2e8f0',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          ...oscOpts.timeScale,
          visible: true,
        },
      });
      oscillatorChartRef.current = oscChart;

      // Synchronisation bidirectionnelle des échelles de temps
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (syncingRef.current || !range) return;
        syncingRef.current = true;
        oscChart.timeScale().setVisibleLogicalRange(range);
        syncingRef.current = false;
      });
      oscChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (syncingRef.current || !range) return;
        syncingRef.current = true;
        chart.timeScale().setVisibleLogicalRange(range);
        syncingRef.current = false;
      });
    }

    // ResizeObserver : couvre le premier rendu (clientWidth peut être 0) + tous les redimensionnements
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;
      const width = entry.contentRect.width;
      if (width > 0) {
        chartRef.current.applyOptions({ width });
        oscillatorChartRef.current?.applyOptions({ width });
        // fitContent à chaque resize pour maintenir la vue complète
        chartRef.current.timeScale().fitContent();
        oscillatorChartRef.current?.timeScale().fitContent();
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Plein écran : petit délai pour laisser le DOM se stabiliser
    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (chartContainerRef.current && chartRef.current) {
          const w = chartContainerRef.current.clientWidth;
          chartRef.current.applyOptions({ width: w });
          oscillatorChartRef.current?.applyOptions({ width: w });
          chartRef.current.timeScale().fitContent();
          oscillatorChartRef.current?.timeScale().fitContent();
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    setIsReady(true);
    console.log('useStockChart: Chart ready');

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (oscillatorChartRef.current) {
        oscillatorChartRef.current.remove();
        oscillatorChartRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        volumeSeriesRef.current = null;
      }
      setIsReady(false);
    };
  }, []); // Ne se réinitialise jamais

  // Mise à jour du type de graphique ET des données
  useEffect(() => {
    console.log('useStockChart: Effect triggered', {
      isReady,
      hasChart: !!chartRef.current,
      dataLength: data.length,
      dataKey,
      prevDataKey: prevDataKeyRef.current
    });

    if (!isReady || !chartRef.current) {
      console.log('useStockChart: Skipping - chart not ready');
      return;
    }

    // Ignorer les données vides - garder le graphique précédent
    if (data.length === 0) {
      console.log('useStockChart: Skipping - empty data, keeping previous chart');
      return;
    }

    // Ne rien faire si ni le type ni les données n'ont changé
    const chartTypeChanged = prevChartTypeRef.current !== chartType;
    const dataChanged = prevDataKeyRef.current !== dataKey;

    if (!chartTypeChanged && !dataChanged) {
      console.log('useStockChart: Skipping - no changes detected');
      return;
    }

    console.log('useStockChart: Updating chart', {
      chartTypeChanged,
      dataChanged,
      type: chartType,
      dataLength: data.length,
      firstDate: data[0]?.date,
      lastDate: data[data.length - 1]?.date
    });

    try {
      const chartApi = chartRef.current as any;

      // Créer/recréer la série si le type a changé OU si elle n'existe pas encore (premier rendu)
      if (chartTypeChanged || !seriesRef.current) {
        // ── Type de graphique changé ou série absente : sortir du mode dessin ──
        cancelActiveDrawing();

        // ── Exporter et retirer temporairement les line tools avant de supprimer les séries ──
        // Raison : quand removeSeries() retire la série principale, les line tools deviennent
        // dataSources[0], faisant planter _internal_minMove() → "unexpected base" dans le RAF.
        const savedLineTools: string | undefined = chartApi.exportLineTools?.();
        const hasLineTools = savedLineTools && savedLineTools !== '[]';
        if (hasLineTools) {
          chartApi.removeAllLineTools?.();
        }

        // ── Recréer la série principale ──
        if (seriesRef.current) {
          chartRef.current.removeSeries(seriesRef.current);
          seriesRef.current = null;
        }
        if (volumeSeriesRef.current) {
          chartRef.current.removeSeries(volumeSeriesRef.current);
          volumeSeriesRef.current = null;
        }
        // Supprimer les indicateurs overlay du chart PRINCIPAL (recréés par l'effet indicateurs)
        for (const ref of [
          ma20SeriesRef, ma50SeriesRef, ma200SeriesRef, ema12SeriesRef,
          bbUpperSeriesRef, bbMiddleSeriesRef, bbLowerSeriesRef,
          vwapSeriesRef,
          ichTenkanRef, ichKijunRef, ichSpanARef, ichSpanBRef, ichChikouRef,
          pivotPRef, pivotR1Ref, pivotR2Ref, pivotS1Ref, pivotS2Ref,
        ]) {
          if (ref.current) { chartRef.current.removeSeries(ref.current); ref.current = null; }
        }
        // Les oscillateurs sont sur oscillatorChartRef → pas besoin de les supprimer ici

        let mainSeries: ISeriesApi<any>;
        switch (chartType) {
          case 'candlestick':
            mainSeries = chartApi.addCandlestickSeries(getSeriesOptions() as CandlestickSeriesPartialOptions);
            break;
          case 'bar':
            mainSeries = chartApi.addBarSeries(getSeriesOptions() as CandlestickSeriesPartialOptions);
            break;
          case 'line':
            mainSeries = chartApi.addLineSeries(getSeriesOptions() as LineSeriesPartialOptions);
            break;
          case 'area':
            mainSeries = chartApi.addAreaSeries(getSeriesOptions() as AreaSeriesPartialOptions);
            break;
          default:
            mainSeries = chartApi.addCandlestickSeries(getSeriesOptions() as CandlestickSeriesPartialOptions);
        }
        seriesRef.current = mainSeries;
        mainSeries.setData(convertData() as any);

        // ── Réimporter les line tools une fois la nouvelle série en place ──
        if (hasLineTools) {
          chartApi.importLineTools?.(savedLineTools);
        }

      } else {
        // ── Seules les données ont changé (changement de timeframe) ──
        // Sortir du mode dessin pour libérer le chart avant setData
        cancelActiveDrawing();
        // On met à jour les données SANS supprimer la série existante
        // → les line tools (dessins) finalisés sont préservés
        if (seriesRef.current) {
          seriesRef.current.setData(convertData() as any);
        }

        // Mettre à jour le volume en place
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(convertVolumeData() as any);
        }

        // Mettre à jour les indicateurs actifs avec les nouvelles données
        const chartData = data.map(d => ({ time: d.time, close: d.close }));
        const ohlcvData = data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume }));
        if (ma20SeriesRef.current)  ma20SeriesRef.current.setData(calculateSMA(chartData, 20) as any);
        if (ma50SeriesRef.current)  ma50SeriesRef.current.setData(calculateSMA(chartData, 50) as any);
        if (ma200SeriesRef.current) ma200SeriesRef.current.setData(calculateSMA(chartData, 200) as any);
        if (ema12SeriesRef.current) ema12SeriesRef.current.setData(calculateEMA(chartData, 12) as any);
        if (bbUpperSeriesRef.current || bbMiddleSeriesRef.current || bbLowerSeriesRef.current) {
          const bbData = calculateBollingerBands(chartData, 20, 2);
          if (bbUpperSeriesRef.current)  bbUpperSeriesRef.current.setData(bbData.upper as any);
          if (bbMiddleSeriesRef.current) bbMiddleSeriesRef.current.setData(bbData.middle as any);
          if (bbLowerSeriesRef.current)  bbLowerSeriesRef.current.setData(bbData.lower as any);
        }
        if (stochKSeriesRef.current || stochDSeriesRef.current) {
          const stochData = calculateStochastic(ohlcvData);
          if (stochKSeriesRef.current) stochKSeriesRef.current.setData(stochData.k as any);
          if (stochDSeriesRef.current) stochDSeriesRef.current.setData(stochData.d as any);
        }
        if (willrSeriesRef.current) willrSeriesRef.current.setData(calculateWilliamsR(ohlcvData) as any);
        if (cciSeriesRef.current)   cciSeriesRef.current.setData(calculateCCI(ohlcvData) as any);
        if (rocSeriesRef.current)   rocSeriesRef.current.setData(calculateROC(chartData) as any);
        if (mfiSeriesRef.current)   mfiSeriesRef.current.setData(calculateMFI(ohlcvData) as any);
        if (aroonUpSeriesRef.current || aroonDownSeriesRef.current) {
          const aroonData = calculateAroon(ohlcvData);
          if (aroonUpSeriesRef.current)   aroonUpSeriesRef.current.setData(aroonData.up as any);
          if (aroonDownSeriesRef.current) aroonDownSeriesRef.current.setData(aroonData.down as any);
        }
        if (rsiSeriesRef.current)  rsiSeriesRef.current.setData(calculateRSI(chartData) as any);
        if (atrSeriesRef.current)  atrSeriesRef.current.setData(calculateATR(ohlcvData) as any);
        if (adxPlusRef.current || adxMinusRef.current || adxLineRef.current) {
          const adxData = calculateADX(ohlcvData);
          if (adxPlusRef.current)  adxPlusRef.current.setData(adxData.diPlus as any);
          if (adxMinusRef.current) adxMinusRef.current.setData(adxData.diMinus as any);
          if (adxLineRef.current)  adxLineRef.current.setData(adxData.adx as any);
        }
        if (obvSeriesRef.current)  obvSeriesRef.current.setData(calculateOBV(ohlcvData) as any);
        if (vwapSeriesRef.current) vwapSeriesRef.current.setData(calculateVWAP(ohlcvData) as any);
        if (ichTenkanRef.current || ichKijunRef.current) {
          const ich = calculateIchimoku(ohlcvData);
          if (ichTenkanRef.current)  ichTenkanRef.current.setData(ich.tenkan as any);
          if (ichKijunRef.current)   ichKijunRef.current.setData(ich.kijun as any);
          if (ichSpanARef.current)   ichSpanARef.current.setData(ich.spanA as any);
          if (ichSpanBRef.current)   ichSpanBRef.current.setData(ich.spanB as any);
          if (ichChikouRef.current)  ichChikouRef.current.setData(ich.chikou as any);
        }
        if (pivotPRef.current || pivotR1Ref.current) {
          const pvt = calculatePivotPoints(ohlcvData);
          if (pivotPRef.current)  pivotPRef.current.setData(pvt.p as any);
          if (pivotR1Ref.current) pivotR1Ref.current.setData(pvt.r1 as any);
          if (pivotR2Ref.current) pivotR2Ref.current.setData(pvt.r2 as any);
          if (pivotS1Ref.current) pivotS1Ref.current.setData(pvt.s1 as any);
          if (pivotS2Ref.current) pivotS2Ref.current.setData(pvt.s2 as any);
        }
      }

      // fitContent après mise à jour des données
      requestAnimationFrame(() => {
        chartRef.current?.timeScale().fitContent();
      });

      prevChartTypeRef.current = chartType;
      prevDataKeyRef.current = dataKey;
    } catch (error) {
      console.error('useStockChart: Error updating chart:', error);
    }
  }, [chartType, dataKey, isReady]);

  // Mise à jour du thème
  useEffect(() => {
    if (!isReady || !chartRef.current) return;
    const isDark = theme === 'dark';

    chartRef.current.applyOptions(getChartOptions());

    if (oscillatorChartRef.current) {
      const oscOpts = getChartOptions();
      oscillatorChartRef.current.applyOptions({
        ...oscOpts,
        localization: {
          locale: 'fr-FR',
          priceFormatter: (price: number) => price.toFixed(2),
        },
        rightPriceScale: {
          borderColor: isDark ? '#374151' : '#e2e8f0',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
      });
    }

    // Mettre à jour les couleurs de la série
    if (seriesRef.current) {
      seriesRef.current.applyOptions(getSeriesOptions());
    }
  }, [theme, isReady]);

  // Gestion des indicateurs techniques
  useEffect(() => {
    if (!isReady || !chartRef.current || !data || data.length === 0) {
      console.log('useStockChart: Skipping indicators - chart not ready or no data');
      return;
    }

    console.log('useStockChart: Managing indicators', indicators);
    const chartApi = chartRef.current as any;
    const chartData = data.map(d => ({ time: d.time, close: d.close }));

    // MA20 - Moyenne Mobile 20 périodes
    if (indicators?.includes('ma20')) {
      if (!ma20SeriesRef.current) {
        console.log('useStockChart: Adding MA20 indicator');
        const ma20Series = chartApi.addLineSeries({
          color: '#2962FF',
          lineWidth: 2,
          title: 'MA 20',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const ma20Data = calculateSMA(chartData, 20);
        ma20Series.setData(ma20Data);
        ma20SeriesRef.current = ma20Series;
      }
    } else if (ma20SeriesRef.current) {
      console.log('useStockChart: Removing MA20 indicator');
      chartRef.current.removeSeries(ma20SeriesRef.current);
      ma20SeriesRef.current = null;
    }

    // MA50 - Moyenne Mobile 50 périodes
    if (indicators?.includes('ma50')) {
      if (!ma50SeriesRef.current) {
        console.log('useStockChart: Adding MA50 indicator');
        const ma50Series = chartApi.addLineSeries({
          color: '#F23645',
          lineWidth: 2,
          title: 'MA 50',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const ma50Data = calculateSMA(chartData, 50);
        ma50Series.setData(ma50Data);
        ma50SeriesRef.current = ma50Series;
      }
    } else if (ma50SeriesRef.current) {
      console.log('useStockChart: Removing MA50 indicator');
      chartRef.current.removeSeries(ma50SeriesRef.current);
      ma50SeriesRef.current = null;
    }

    // MA200 - Moyenne Mobile 200 périodes
    if (indicators?.includes('ma200')) {
      if (!ma200SeriesRef.current) {
        console.log('useStockChart: Adding MA200 indicator');
        const ma200Series = chartApi.addLineSeries({
          color: '#9C27B0',
          lineWidth: 2,
          title: 'MA 200',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const ma200Data = calculateSMA(chartData, 200);
        ma200Series.setData(ma200Data);
        ma200SeriesRef.current = ma200Series;
      }
    } else if (ma200SeriesRef.current) {
      console.log('useStockChart: Removing MA200 indicator');
      chartRef.current.removeSeries(ma200SeriesRef.current);
      ma200SeriesRef.current = null;
    }

    // EMA12 - Moyenne Mobile Exponentielle 12 périodes
    if (indicators?.includes('ema12')) {
      if (!ema12SeriesRef.current) {
        console.log('useStockChart: Adding EMA12 indicator');
        const ema12Series = chartApi.addLineSeries({
          color: '#FF6D00',
          lineWidth: 2,
          title: 'EMA 12',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        const ema12Data = calculateEMA(chartData, 12);
        ema12Series.setData(ema12Data);
        ema12SeriesRef.current = ema12Series;
      }
    } else if (ema12SeriesRef.current) {
      console.log('useStockChart: Removing EMA12 indicator');
      chartRef.current.removeSeries(ema12SeriesRef.current);
      ema12SeriesRef.current = null;
    }

    // Bollinger Bands - 3 lignes (supérieure, moyenne, inférieure)
    if (indicators?.includes('bb')) {
      if (!bbUpperSeriesRef.current) {
        console.log('useStockChart: Adding Bollinger Bands');
        const bbData = calculateBollingerBands(chartData, 20, 2);

        const bbUpperSeries = chartApi.addLineSeries({
          color: '#787B86',
          lineWidth: 1,
          lineStyle: 2, // dashed
          title: 'BB Upper',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        bbUpperSeries.setData(bbData.upper);
        bbUpperSeriesRef.current = bbUpperSeries;

        const bbMiddleSeries = chartApi.addLineSeries({
          color: '#787B86',
          lineWidth: 1,
          title: 'BB Middle',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        bbMiddleSeries.setData(bbData.middle);
        bbMiddleSeriesRef.current = bbMiddleSeries;

        const bbLowerSeries = chartApi.addLineSeries({
          color: '#787B86',
          lineWidth: 1,
          lineStyle: 2, // dashed
          title: 'BB Lower',
          lastValueVisible: false,
          priceLineVisible: false,
        });
        bbLowerSeries.setData(bbData.lower);
        bbLowerSeriesRef.current = bbLowerSeries;
      }
    } else {
      if (bbUpperSeriesRef.current) {
        console.log('useStockChart: Removing Bollinger Bands');
        chartRef.current.removeSeries(bbUpperSeriesRef.current);
        bbUpperSeriesRef.current = null;
      }
      if (bbMiddleSeriesRef.current) {
        chartRef.current.removeSeries(bbMiddleSeriesRef.current);
        bbMiddleSeriesRef.current = null;
      }
      if (bbLowerSeriesRef.current) {
        chartRef.current.removeSeries(bbLowerSeriesRef.current);
        bbLowerSeriesRef.current = null;
      }
    }

    // Données OHLCV complètes pour les oscillateurs
    const ohlcvData = data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume }));

    // Raccourci vers le chart oscillateur
    const oscApi = oscillatorChartRef.current as any;

    // Visibilité du time scale du chart principal :
    // caché quand un oscillateur est actif (le panneau oscillateur montre le sien)
    chartRef.current.applyOptions({ timeScale: { ...(getChartOptions().timeScale as object), visible: !hasOscillator } });

    // Helper : ajoute une ligne de référence horizontale (niveau)
    const addRefLine = (series: ISeriesApi<any>, price: number, color: string, title = '') =>
      (series as any).createPriceLine({ price, color, lineWidth: 1, lineStyle: 2, axisLabelVisible: !!title, title });

    // ── RSI ──────────────────────────────────────────────────────────────────
    if (indicators?.includes('rsi')) {
      if (!rsiSeriesRef.current && oscApi) {
        const s = oscApi.addLineSeries({ color: '#9C27B0', lineWidth: 1, title: 'RSI 14', lastValueVisible: true, priceLineVisible: false });
        s.setData(calculateRSI(chartData));
        addRefLine(s, 70, '#ef4444', '70');
        addRefLine(s, 50, '#9ca3af');
        addRefLine(s, 30, '#10b981', '30');
        rsiSeriesRef.current = s;
      }
    } else if (rsiSeriesRef.current) {
      oscillatorChartRef.current?.removeSeries(rsiSeriesRef.current); rsiSeriesRef.current = null;
    }

    // ── Stochastique (%K et %D) ───────────────────────────────────────────────
    if (indicators?.includes('stoch')) {
      if (!stochKSeriesRef.current && oscApi) {
        const stochData = calculateStochastic(ohlcvData);
        const kSeries = oscApi.addLineSeries({ color: '#2962FF', lineWidth: 1, title: '%K', lastValueVisible: true, priceLineVisible: false });
        kSeries.setData(stochData.k);
        addRefLine(kSeries, 80, '#ef4444', '80');
        addRefLine(kSeries, 50, '#9ca3af');
        addRefLine(kSeries, 20, '#10b981', '20');
        stochKSeriesRef.current = kSeries;
        const dSeries = oscApi.addLineSeries({ color: '#FF6D00', lineWidth: 1, title: '%D', lastValueVisible: false, priceLineVisible: false });
        dSeries.setData(stochData.d);
        stochDSeriesRef.current = dSeries;
      }
    } else {
      if (stochKSeriesRef.current) { oscillatorChartRef.current?.removeSeries(stochKSeriesRef.current); stochKSeriesRef.current = null; }
      if (stochDSeriesRef.current) { oscillatorChartRef.current?.removeSeries(stochDSeriesRef.current); stochDSeriesRef.current = null; }
    }

    // ── Williams %R ───────────────────────────────────────────────────────────
    if (indicators?.includes('willr')) {
      if (!willrSeriesRef.current && oscApi) {
        const s = oscApi.addLineSeries({ color: '#9C27B0', lineWidth: 1, title: 'W%R', lastValueVisible: true, priceLineVisible: false });
        s.setData(calculateWilliamsR(ohlcvData));
        addRefLine(s, -20, '#ef4444', '-20');
        addRefLine(s, -50, '#9ca3af');
        addRefLine(s, -80, '#10b981', '-80');
        willrSeriesRef.current = s;
      }
    } else if (willrSeriesRef.current) {
      oscillatorChartRef.current?.removeSeries(willrSeriesRef.current); willrSeriesRef.current = null;
    }

    // ── CCI ───────────────────────────────────────────────────────────────────
    if (indicators?.includes('cci')) {
      if (!cciSeriesRef.current && oscApi) {
        const s = oscApi.addLineSeries({ color: '#F23645', lineWidth: 1, title: 'CCI', lastValueVisible: true, priceLineVisible: false });
        s.setData(calculateCCI(ohlcvData));
        addRefLine(s,  100, '#ef4444', '100');
        addRefLine(s,    0, '#9ca3af');
        addRefLine(s, -100, '#10b981', '-100');
        cciSeriesRef.current = s;
      }
    } else if (cciSeriesRef.current) {
      oscillatorChartRef.current?.removeSeries(cciSeriesRef.current); cciSeriesRef.current = null;
    }

    // ── ROC ───────────────────────────────────────────────────────────────────
    if (indicators?.includes('roc')) {
      if (!rocSeriesRef.current && oscApi) {
        const s = oscApi.addLineSeries({ color: '#00BCD4', lineWidth: 1, title: 'ROC', lastValueVisible: true, priceLineVisible: false });
        s.setData(calculateROC(chartData));
        addRefLine(s, 0, '#9ca3af');
        rocSeriesRef.current = s;
      }
    } else if (rocSeriesRef.current) {
      oscillatorChartRef.current?.removeSeries(rocSeriesRef.current); rocSeriesRef.current = null;
    }

    // ── MFI ───────────────────────────────────────────────────────────────────
    if (indicators?.includes('mfi')) {
      if (!mfiSeriesRef.current && oscApi) {
        const s = oscApi.addLineSeries({ color: '#4CAF50', lineWidth: 1, title: 'MFI', lastValueVisible: true, priceLineVisible: false });
        s.setData(calculateMFI(ohlcvData));
        addRefLine(s, 80, '#ef4444', '80');
        addRefLine(s, 50, '#9ca3af');
        addRefLine(s, 20, '#10b981', '20');
        mfiSeriesRef.current = s;
      }
    } else if (mfiSeriesRef.current) {
      oscillatorChartRef.current?.removeSeries(mfiSeriesRef.current); mfiSeriesRef.current = null;
    }

    // ── Aroon (Up + Down) ─────────────────────────────────────────────────────
    if (indicators?.includes('aroon')) {
      if (!aroonUpSeriesRef.current && oscApi) {
        const aroonData = calculateAroon(ohlcvData);
        const upSeries   = oscApi.addLineSeries({ color: '#10b981', lineWidth: 1, title: 'Aroon+', lastValueVisible: true,  priceLineVisible: false });
        const downSeries = oscApi.addLineSeries({ color: '#ef4444', lineWidth: 1, title: 'Aroon-', lastValueVisible: false, priceLineVisible: false });
        upSeries.setData(aroonData.up);
        addRefLine(upSeries, 50, '#9ca3af');
        downSeries.setData(aroonData.down);
        aroonUpSeriesRef.current   = upSeries;
        aroonDownSeriesRef.current = downSeries;
      }
    } else {
      if (aroonUpSeriesRef.current)   { oscillatorChartRef.current?.removeSeries(aroonUpSeriesRef.current);   aroonUpSeriesRef.current   = null; }
      if (aroonDownSeriesRef.current) { oscillatorChartRef.current?.removeSeries(aroonDownSeriesRef.current); aroonDownSeriesRef.current = null; }
    }

    // ── ATR ──────────────────────────────────────────────────────────────────
    if (indicators?.includes('atr')) {
      if (!atrSeriesRef.current && oscApi) {
        const s = oscApi.addLineSeries({ color: '#FF9800', lineWidth: 1, title: 'ATR', lastValueVisible: true, priceLineVisible: false });
        s.setData(calculateATR(ohlcvData));
        atrSeriesRef.current = s;
      }
    } else if (atrSeriesRef.current) {
      oscillatorChartRef.current?.removeSeries(atrSeriesRef.current); atrSeriesRef.current = null;
    }

    // ── ADX / DMI ─────────────────────────────────────────────────────────────
    if (indicators?.includes('adx')) {
      if (!adxPlusRef.current && oscApi) {
        const adxData = calculateADX(ohlcvData);
        const mkLine  = (color: string, title: string, visible = true) =>
          oscApi.addLineSeries({ color, lineWidth: 1, title, lastValueVisible: visible, priceLineVisible: false });
        const sp = mkLine('#10b981', '+DI');       sp.setData(adxData.diPlus);  adxPlusRef.current  = sp;
        const sm = mkLine('#ef4444', '-DI', false); sm.setData(adxData.diMinus); adxMinusRef.current = sm;
        const sa = mkLine('#FF9800', 'ADX', false); sa.setData(adxData.adx);    adxLineRef.current  = sa;
        addRefLine(sp, 25, '#9ca3af', '25');
      }
    } else {
      if (adxPlusRef.current)  { oscillatorChartRef.current?.removeSeries(adxPlusRef.current);  adxPlusRef.current  = null; }
      if (adxMinusRef.current) { oscillatorChartRef.current?.removeSeries(adxMinusRef.current); adxMinusRef.current = null; }
      if (adxLineRef.current)  { oscillatorChartRef.current?.removeSeries(adxLineRef.current);  adxLineRef.current  = null; }
    }

    // ── OBV ──────────────────────────────────────────────────────────────────
    if (indicators?.includes('obv')) {
      if (!obvSeriesRef.current && oscApi) {
        const s = oscApi.addLineSeries({ color: '#2962FF', lineWidth: 1, title: 'OBV', lastValueVisible: true, priceLineVisible: false });
        s.setData(calculateOBV(ohlcvData));
        obvSeriesRef.current = s;
      }
    } else if (obvSeriesRef.current) {
      oscillatorChartRef.current?.removeSeries(obvSeriesRef.current); obvSeriesRef.current = null;
    }

    // ── VWAP (overlay sur le prix) ────────────────────────────────────────────
    if (indicators?.includes('vwap')) {
      if (!vwapSeriesRef.current) {
        const s = chartApi.addLineSeries({
          color: '#E91E63', lineWidth: 1, lineStyle: 1, title: 'VWAP',
          lastValueVisible: false, priceLineVisible: false,
        });
        s.setData(calculateVWAP(ohlcvData));
        vwapSeriesRef.current = s;
      }
    } else if (vwapSeriesRef.current) {
      chartRef.current.removeSeries(vwapSeriesRef.current); vwapSeriesRef.current = null;
    }

    // ── Ichimoku (overlay) ────────────────────────────────────────────────────
    if (indicators?.includes('ichimoku')) {
      if (!ichTenkanRef.current) {
        const ich = calculateIchimoku(ohlcvData);
        const mkLine = (color: string, title: string, style = 0) => chartApi.addLineSeries({
          color, lineWidth: 1, lineStyle: style, title,
          lastValueVisible: false, priceLineVisible: false,
        });
        const t = mkLine('#ef4444', 'Tenkan');   t.setData(ich.tenkan);  ichTenkanRef.current = t;
        const k = mkLine('#2962FF', 'Kijun');    k.setData(ich.kijun);   ichKijunRef.current  = k;
        const a = mkLine('#10b981', 'SpanA', 2); a.setData(ich.spanA);   ichSpanARef.current  = a;
        const b = mkLine('#ef4444', 'SpanB', 2); b.setData(ich.spanB);   ichSpanBRef.current  = b;
        const c = mkLine('#9C27B0', 'Chikou', 1);c.setData(ich.chikou);  ichChikouRef.current = c;
      }
    } else {
      if (ichTenkanRef.current)  { chartRef.current.removeSeries(ichTenkanRef.current);  ichTenkanRef.current  = null; }
      if (ichKijunRef.current)   { chartRef.current.removeSeries(ichKijunRef.current);   ichKijunRef.current   = null; }
      if (ichSpanARef.current)   { chartRef.current.removeSeries(ichSpanARef.current);   ichSpanARef.current   = null; }
      if (ichSpanBRef.current)   { chartRef.current.removeSeries(ichSpanBRef.current);   ichSpanBRef.current   = null; }
      if (ichChikouRef.current)  { chartRef.current.removeSeries(ichChikouRef.current);  ichChikouRef.current  = null; }
    }

    // ── Pivot Points (overlay) ────────────────────────────────────────────────
    if (indicators?.includes('pivots')) {
      if (!pivotPRef.current) {
        const pvt = calculatePivotPoints(ohlcvData);
        const mkLine = (color: string, title: string) => chartApi.addLineSeries({
          color, lineWidth: 1, lineStyle: 1, title,
          lastValueVisible: false, priceLineVisible: false,
        });
        const pp = mkLine('#787B86', 'P');  pp.setData(pvt.p);  pivotPRef.current  = pp;
        const r1 = mkLine('#10b981', 'R1'); r1.setData(pvt.r1); pivotR1Ref.current = r1;
        const r2 = mkLine('#10b981', 'R2'); r2.setData(pvt.r2); pivotR2Ref.current = r2;
        const s1 = mkLine('#ef4444', 'S1'); s1.setData(pvt.s1); pivotS1Ref.current = s1;
        const s2 = mkLine('#ef4444', 'S2'); s2.setData(pvt.s2); pivotS2Ref.current = s2;
      }
    } else {
      if (pivotPRef.current)  { chartRef.current.removeSeries(pivotPRef.current);  pivotPRef.current  = null; }
      if (pivotR1Ref.current) { chartRef.current.removeSeries(pivotR1Ref.current); pivotR1Ref.current = null; }
      if (pivotR2Ref.current) { chartRef.current.removeSeries(pivotR2Ref.current); pivotR2Ref.current = null; }
      if (pivotS1Ref.current) { chartRef.current.removeSeries(pivotS1Ref.current); pivotS1Ref.current = null; }
      if (pivotS2Ref.current) { chartRef.current.removeSeries(pivotS2Ref.current); pivotS2Ref.current = null; }
    }

    // Volume - Histogramme
    if (indicators?.includes('volume')) {
      if (!volumeSeriesRef.current) {
        const volumeSeries = chartApi.addHistogramSeries({
          color: CHART_COLORS.upColor + '40',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
          scaleMargins: { top: 0.8, bottom: 0 },
        } as HistogramSeriesPartialOptions);
        const volumeData = convertVolumeData();
        volumeSeries.setData(volumeData);
        volumeSeriesRef.current = volumeSeries;
      }
    } else if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }
  }, [indicators, isReady, data.length]);

  const takeScreenshot = async (symbol?: string): Promise<string | null> => {
    if (!chartRef.current) return null;
    try {
      const chartCanvas: HTMLCanvasElement = (chartRef.current as any).takeScreenshot();

      // Bande de branding en bas (48px)
      const FOOTER_H = 48;
      const composited = document.createElement('canvas');
      composited.width = chartCanvas.width;
      composited.height = chartCanvas.height + FOOTER_H;

      const ctx = composited.getContext('2d');
      if (!ctx) return chartCanvas.toDataURL('image/png');

      // Dessiner le graphique
      ctx.drawImage(chartCanvas, 0, 0);

      // Footer blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, chartCanvas.height, composited.width, FOOTER_H);

      // Ligne de séparation
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, chartCanvas.height);
      ctx.lineTo(composited.width, chartCanvas.height);
      ctx.stroke();

      // Nom du symbole à gauche
      if (symbol) {
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 15px Inter, system-ui, sans-serif';
        ctx.fillText(symbol, 16, chartCanvas.height + 30);
      }

      // Logo AfriBourse à droite
      await new Promise<void>((resolve) => {
        const logo = new Image();
        logo.onload = () => {
          const logoH = 28;
          const logoW = Math.round((logo.naturalWidth / logo.naturalHeight) * logoH);
          const x = composited.width - logoW - 16;
          const y = chartCanvas.height + (FOOTER_H - logoH) / 2;
          ctx.drawImage(logo, x, y, logoW, logoH);
          resolve();
        };
        logo.onerror = () => {
          // Fallback texte si le logo ne charge pas
          ctx.fillStyle = '#1d4ed8';
          ctx.font = 'bold 14px Inter, system-ui, sans-serif';
          const text = 'AfriBourse';
          const tw = ctx.measureText(text).width;
          ctx.fillText(text, composited.width - tw - 16, chartCanvas.height + 30);
          resolve();
        };
        logo.src = '/images/logo_afribourse.png';
      });

      return composited.toDataURL('image/png');
    } catch {
      return null;
    }
  };

  // ── Outils de dessin (ligne-outils) ──────────────────────────────────────

  /**
   * Annule un tracé en cours (non finalisé) sans supprimer les tracés finalisés.
   * Utilise uniquement l'API publique : exportLineTools / removeLineToolsById /
   * subscribeLineToolsAfterEdit — compatibles avec le build de production minifié.
   */
  const cancelActiveDrawing = () => {
    if (!chartRef.current || !inDrawingSessionRef.current) return;
    try {
      const chartApi = chartRef.current as any;

      // 1. Sortir du mode dessin (efface _activeType côté bibliothèque)
      chartApi.setActiveLineTool?.(null, {});

      // 2. Supprimer les outils interrompus (commencés mais jamais finalisés)
      const exported: string | undefined = chartApi.exportLineTools?.();
      if (exported) {
        try {
          const tools = JSON.parse(exported) as Array<{ id?: string }>;
          const toRemove = tools
            .map(t => t.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)
            .filter(id =>
              // Garder les outils pré-session ET les outils complétés durant la session
              !preSessionIdsRef.current.has(id) &&
              !completedDrawingIdsRef.current.has(id)
            );

          if (toRemove.length > 0) {
            chartApi.removeLineToolsById?.(toRemove);
          }
        } catch (e) {
          console.warn('[cancelActiveDrawing] parse error', e);
        }
      }

      // Fin de session : nettoyer l'abonnement et remettre les refs à zéro
      drawingSubscriptionRef.current?.();
      drawingSubscriptionRef.current = null;
      inDrawingSessionRef.current = false;
      preSessionIdsRef.current = new Set();
      completedDrawingIdsRef.current = new Set();
    } catch (e) {
      console.warn('[cancelActiveDrawing]', e);
    }
  };

  interface FibLevelInput { coeff: number; color: string; opacity: number }

  const startDrawing = (
    toolType: string,
    textValue?: string,
    fibLevels?: FibLevelInput[],
  ) => {
    if (!chartRef.current) return;
    try {
      const chartApi = chartRef.current as any;

      // Démarrer une nouvelle session de dessin si ce n'est pas déjà fait
      if (!inDrawingSessionRef.current) {
        // Snapshot des IDs existants AVANT de commencer à dessiner
        const exported: string | undefined = chartApi.exportLineTools?.();
        preSessionIdsRef.current = new Set();
        if (exported) {
          try {
            const tools = JSON.parse(exported) as Array<{ id?: string }>;
            tools.forEach(t => { if (t.id) preSessionIdsRef.current.add(t.id); });
          } catch { /* ignore */ }
        }
        completedDrawingIdsRef.current = new Set();

        // S'abonner pour capturer les IDs des outils finalisés
        // L'événement reçu : { selectedLineTool: { id, toolType, options, points }, stage }
        // stage = 'lineToolFinished' | 'pathFinished' | 'lineToolEdited'
        const handler = (event: { selectedLineTool?: { id?: string }; stage?: string }) => {
          const stage = event?.stage;
          const id = event?.selectedLineTool?.id;
          // Capturer uniquement les nouvelles créations (pas les éditions d'anciens outils)
          if (id && (stage === 'lineToolFinished' || stage === 'pathFinished')) {
            completedDrawingIdsRef.current.add(id);
          }
        };

        chartApi.subscribeLineToolsAfterEdit?.(handler);
        drawingSubscriptionRef.current = () => chartApi.unsubscribeLineToolsAfterEdit?.(handler);
        inDrawingSessionRef.current = true;
      }

      // Options de base
      const options: Record<string, unknown> = {};
      // Text et Callout partagent la même option text.value
      if ((toolType === 'Text' || toolType === 'Callout') && textValue) {
        options.text = { value: textValue };
      }
      // FibRetracement : on passe les niveaux directement dans addLineTool.
      // La lib a été patchée pour remplacer le tableau levels au lieu de le merger
      // par index (ce qui laissait les niveaux par défaut 1.618–4.236 intacts).
      if (toolType === 'FibRetracement' && fibLevels) {
        options.levels = fibLevels.map((l: FibLevelInput) => ({
          coeff: l.coeff,
          color: l.color,
          opacity: l.opacity,
          distanceFromCoeffEnabled: false,
          distanceFromCoeff: 0,
        }));
      }

      // Créer l'outil en mode placement (points vides = attend les clics de l'utilisateur)
      chartApi.addLineTool?.(toolType, [], options);
    } catch (e) {
      console.warn('[startDrawing]', e);
    }
  };

  const deleteSelectedTools = () => {
    if (!chartRef.current) return;
    (chartRef.current as any).removeSelectedLineTools();
  };

  const clearAllDrawings = () => {
    if (!chartRef.current) return;
    (chartRef.current as any).removeAllLineTools();
  };

  return {
    chartContainerRef,
    oscillatorContainerRef,
    hasOscillator,
    chart: chartRef.current,
    series: seriesRef.current,
    volumeSeries: volumeSeriesRef.current,
    isReady,
    takeScreenshot,
    cancelActiveDrawing,
    startDrawing,
    deleteSelectedTools,
    clearAllDrawings,
  };
};
