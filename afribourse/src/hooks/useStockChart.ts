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
} from 'lightweight-charts';
import type {
  ChartType,
  OHLCVData,
  CandlestickData,
  LineData,
  AreaData,
  HistogramData,
  ChartColors,
} from '../types/chart.types';

interface UseStockChartProps {
  chartType: ChartType;
  theme: 'light' | 'dark';
  data: OHLCVData[];
}

export const useStockChart = ({ chartType, theme, data }: UseStockChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Couleurs AfriBourse
  const colors: ChartColors = {
    upColor: '#10b981', // vert pour hausse
    downColor: '#ef4444', // rouge pour baisse
    wickUpColor: '#10b981',
    wickDownColor: '#ef4444',
    borderUpColor: '#10b981',
    borderDownColor: '#ef4444',
  };

  // Convertir les données OHLCV en format approprié selon le type de graphique
  const convertData = () => {
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
    return data.map((d, index) => ({
      time: d.time,
      value: d.volume,
      color:
        index > 0 && d.close >= data[index - 1].close
          ? colors.upColor + '40' // 40 = opacité 25%
          : colors.downColor + '40',
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
          width: 1,
          color: isDark ? '#6b7280' : '#94a3b8',
          style: 3,
        },
        horzLine: {
          width: 1,
          color: isDark ? '#6b7280' : '#94a3b8',
          style: 3,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#374151' : '#e2e8f0',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
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
          upColor: colors.upColor,
          downColor: colors.downColor,
          wickUpColor: colors.wickUpColor,
          wickDownColor: colors.wickDownColor,
          borderUpColor: colors.borderUpColor,
          borderDownColor: colors.borderDownColor,
          borderVisible: true,
        } as CandlestickSeriesPartialOptions;
      case 'line':
        return {
          color: colors.upColor,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 6,
          lastValueVisible: true,
          priceLineVisible: true,
        } as LineSeriesPartialOptions;
      case 'area':
        return {
          topColor: colors.upColor + '40',
          bottomColor: colors.upColor + '00',
          lineColor: colors.upColor,
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

  // Initialisation du graphique
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Créer le graphique
    const chart = createChart(chartContainerRef.current, {
      ...getChartOptions(),
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    chartRef.current = chart;

    // Créer la série principale selon le type
    let mainSeries: ISeriesApi<any>;
    switch (chartType) {
      case 'candlestick':
        mainSeries = chart.addCandlestickSeries(
          getSeriesOptions() as CandlestickSeriesPartialOptions
        );
        break;
      case 'bar':
        mainSeries = chart.addCandlestickSeries({
          ...getSeriesOptions(),
          borderVisible: false,
        } as CandlestickSeriesPartialOptions);
        break;
      case 'line':
        mainSeries = chart.addLineSeries(getSeriesOptions() as LineSeriesPartialOptions);
        break;
      case 'area':
        mainSeries = chart.addAreaSeries(getSeriesOptions() as AreaSeriesPartialOptions);
        break;
      default:
        mainSeries = chart.addCandlestickSeries(
          getSeriesOptions() as CandlestickSeriesPartialOptions
        );
    }

    seriesRef.current = mainSeries;

    // Ajouter la série de volume
    const volumeSeries = chart.addHistogramSeries({
      color: colors.upColor + '40',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    } as HistogramSeriesPartialOptions);

    volumeSeriesRef.current = volumeSeries;

    // Gestionnaire de redimensionnement
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    setIsReady(true);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartType, theme]);

  // Mise à jour des données
  useEffect(() => {
    if (!isReady || !seriesRef.current || !volumeSeriesRef.current || data.length === 0) return;

    const chartData = convertData();
    const volumeData = convertVolumeData();

    seriesRef.current.setData(chartData as any);
    volumeSeriesRef.current.setData(volumeData);

    // Ajuster la vue pour afficher toutes les données
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, isReady, chartType]);

  // Mise à jour du thème
  useEffect(() => {
    if (!isReady || !chartRef.current) return;

    chartRef.current.applyOptions(getChartOptions());

    // Mettre à jour les couleurs de la série
    if (seriesRef.current) {
      seriesRef.current.applyOptions(getSeriesOptions());
    }
  }, [theme, isReady]);

  return {
    chartContainerRef,
    chart: chartRef.current,
    series: seriesRef.current,
    volumeSeries: volumeSeriesRef.current,
    isReady,
  };
};
