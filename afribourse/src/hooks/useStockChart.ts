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
import { calculateSMA, calculateEMA, calculateBollingerBands } from '../utils/indicators';

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
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Refs pour les indicateurs techniques
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [isReady, setIsReady] = useState(false);

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
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
          });
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

    // ResizeObserver : couvre le premier rendu (clientWidth peut être 0) + tous les redimensionnements
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;
      const width = entry.contentRect.width;
      if (width > 0) {
        chartRef.current.applyOptions({ width });
        // fitContent à chaque resize pour maintenir la vue complète
        chartRef.current.timeScale().fitContent();
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    // Plein écran : petit délai pour laisser le DOM se stabiliser
    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
          chartRef.current.timeScale().fitContent();
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

        // ── Recréer la série principale ──
        if (seriesRef.current) {
          chartRef.current.removeSeries(seriesRef.current);
          seriesRef.current = null;
        }
        if (volumeSeriesRef.current) {
          chartRef.current.removeSeries(volumeSeriesRef.current);
          volumeSeriesRef.current = null;
        }
        // Supprimer les indicateurs (ils seront recréés par l'effet indicateurs)
        for (const ref of [ma20SeriesRef, ma50SeriesRef, ma200SeriesRef, ema12SeriesRef,
                            bbUpperSeriesRef, bbMiddleSeriesRef, bbLowerSeriesRef]) {
          if (ref.current) { chartRef.current.removeSeries(ref.current); ref.current = null; }
        }

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

      } else {
        // ── Seules les données ont changé (changement de timeframe) ──
        // On met à jour les données SANS supprimer la série existante
        // → les line tools (dessins) sont préservés
        if (seriesRef.current) {
          seriesRef.current.setData(convertData() as any);
        }

        // Mettre à jour le volume en place
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(convertVolumeData());
        }

        // Mettre à jour les indicateurs actifs avec les nouvelles données
        const chartData = data.map(d => ({ time: d.time, close: d.close }));
        if (ma20SeriesRef.current)  ma20SeriesRef.current.setData(calculateSMA(chartData, 20));
        if (ma50SeriesRef.current)  ma50SeriesRef.current.setData(calculateSMA(chartData, 50));
        if (ma200SeriesRef.current) ma200SeriesRef.current.setData(calculateSMA(chartData, 200));
        if (ema12SeriesRef.current) ema12SeriesRef.current.setData(calculateEMA(chartData, 12));
        if (bbUpperSeriesRef.current || bbMiddleSeriesRef.current || bbLowerSeriesRef.current) {
          const bbData = calculateBollingerBands(chartData, 20, 2);
          if (bbUpperSeriesRef.current)  bbUpperSeriesRef.current.setData(bbData.upper);
          if (bbMiddleSeriesRef.current) bbMiddleSeriesRef.current.setData(bbData.middle);
          if (bbLowerSeriesRef.current)  bbLowerSeriesRef.current.setData(bbData.lower);
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

    chartRef.current.applyOptions(getChartOptions());

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

  /** Annule un tracé en cours (non finalisé) sans supprimer les tracés existants. */
  const cancelActiveDrawing = () => {
    if (!chartContainerRef.current) return;
    // L'Escape est le signal standard pour interrompre un tracé en cours
    chartContainerRef.current.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
  };

  const startDrawing = (toolType: string) => {
    if (!chartRef.current) return;
    (chartRef.current as any).addLineTool(toolType, [], {});
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
