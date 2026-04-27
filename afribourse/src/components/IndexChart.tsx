import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';
import { apiFetch } from '../hooks/useApi';
import type { MarketIndexHistory } from '../types';

const formatNumber = (num: number, decimals = 2) =>
  new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

const PERIODS = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1A' },
  { value: 'ALL', label: 'Max' },
];

export default function IndexChart({ indexName }: { indexName: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const [period, setPeriod] = useState('1Y');
  const [history, setHistory] = useState<MarketIndexHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ data: MarketIndexHistory[] }>(`/indices/history/${encodeURIComponent(indexName)}?period=${period}`)
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [indexName, period]);

  const chartData = useMemo((): LineData[] => {
    return history.map((h) => ({
      time: (Math.floor(new Date(h.date).getTime() / 1000)) as Time,
      value: h.close,
    }));
  }, [history]);

  const periodChange = useMemo(() => {
    if (history.length < 2) return null;
    const first = history[0].close;
    const last = history[history.length - 1].close;
    const change = last - first;
    const percent = (change / first) * 100;
    return { change, percent, isPositive: change >= 0 };
  }, [history]);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 350,
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#6b7280',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        grid: {
          vertLines: { color: '#f3f4f6', style: LineStyle.Dotted },
          horzLines: { color: '#f3f4f6', style: LineStyle.Dotted },
        },
        rightPriceScale: {
          borderColor: '#e5e7eb',
        },
        timeScale: {
          borderColor: '#e5e7eb',
          timeVisible: false,
        },
        crosshair: {
          vertLine: { color: '#3b82f6', width: 1, style: LineStyle.Dashed },
          horzLine: { color: '#3b82f6', width: 1, style: LineStyle.Dashed },
        },
      });
    }

    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current);
    }

    const isUp = chartData.length >= 2 && chartData[chartData.length - 1].value >= chartData[0].value;
    const lineColor = isUp ? '#10b981' : '#ef4444';

    seriesRef.current = chartRef.current.addLineSeries({
      color: lineColor,
      lineWidth: 2,
      crosshairMarkerRadius: 5,
      crosshairMarkerBorderColor: lineColor,
      crosshairMarkerBackgroundColor: '#ffffff',
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => formatNumber(price, 2),
      },
    });

    seriesRef.current.setData(chartData);
    chartRef.current.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (chartRef.current && entries[0]) {
        chartRef.current.applyOptions({
          width: entries[0].contentRect.width,
        });
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [chartData]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        {periodChange && (
          <div className={`flex items-center space-x-2 text-sm ${periodChange.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {periodChange.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">
              {periodChange.isPositive ? '+' : ''}{formatNumber(periodChange.change)} ({periodChange.isPositive ? '+' : ''}{periodChange.percent.toFixed(2)}%)
            </span>
            <span className="text-gray-500">sur la période</span>
          </div>
        )}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                period === p.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-[350px]">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[350px] text-gray-400">
          <BarChart3 className="w-12 h-12 mb-3" />
          <p className="text-sm">Aucune donnée historique disponible pour cette période</p>
          <p className="text-xs mt-1">Les données s'accumulent au fil du temps</p>
        </div>
      ) : (
        <div ref={chartContainerRef} className="w-full" style={{ height: 350 }} />
      )}
    </div>
  );
}
