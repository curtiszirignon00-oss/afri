import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface LightweightChartProps {
  data: ChartData[];
  symbol: string;
}

export default function LightweightChart({ data, symbol }: LightweightChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Créer le graphique UNE SEULE FOIS
  useEffect(() => {
    console.log('LightweightChart: Initialization effect triggered');

    if (!chartContainerRef.current) {
      console.log('LightweightChart: Container ref not ready');
      return;
    }

    try {
      console.log('LightweightChart: Creating chart...');

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
      },
    });

    console.log('LightweightChart: Chart created successfully');
    console.log('LightweightChart: chart type:', typeof chart);
    console.log('LightweightChart: addCandlestickSeries exists?', typeof chart.addCandlestickSeries);
    console.log('LightweightChart: chart keys:', Object.keys(chart));

    // API v4: Utiliser addCandlestickSeries directement
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    console.log('LightweightChart: Chart created successfully');

    // Redimensionnement
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      console.log('LightweightChart: Cleaning up chart');
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
    } catch (err) {
      console.error('LightweightChart: Error creating chart:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []); // Vide ! Ne se crée qu'une fois

  // Mettre à jour les données SEULEMENT quand elles changent vraiment
  useEffect(() => {
    console.log('LightweightChart: Data update effect triggered', {
      hasCandleSeries: !!candleSeriesRef.current,
      hasVolumeSeries: !!volumeSeriesRef.current,
      dataLength: data?.length || 0
    });

    if (!candleSeriesRef.current || !volumeSeriesRef.current || !data || data.length === 0) {
      console.log('LightweightChart: Skipping data update - series or data not ready');
      return;
    }

    try {
      console.log('LightweightChart: Updating data with', data.length, 'points');
      console.log('LightweightChart: Sample data point:', data[0]);

      // Préparer les données pour les chandeliers
      const candleData = data.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      // Préparer les données pour le volume
      const volumeData = data.map((d, i) => ({
        time: d.time,
        value: d.volume,
        color: i > 0 && d.close >= data[i - 1].close ? '#10b98160' : '#ef444460',
      }));

      console.log('LightweightChart: Setting candle data...');
      candleSeriesRef.current.setData(candleData);

      console.log('LightweightChart: Setting volume data...');
      volumeSeriesRef.current.setData(volumeData);

      if (chartRef.current) {
        console.log('LightweightChart: Fitting content...');
        chartRef.current.timeScale().fitContent();
      }

      console.log('LightweightChart: Data set successfully');
    } catch (err) {
      console.error('LightweightChart: Error setting data:', err);
      setError(err instanceof Error ? err.message : 'Error setting chart data');
    }
  }, [data]); // Dépend uniquement de data

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{symbol} - Erreur</h3>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Erreur lors du chargement du graphique</p>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">{symbol}</h3>
        <div className="flex items-center justify-center h-96 text-gray-500">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {symbol} - Graphique TradingView
      </h3>
      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: '500px' }}
      />
    </div>
  );
}
