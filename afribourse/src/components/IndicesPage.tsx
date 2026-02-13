import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, Loader2 } from 'lucide-react';
import { apiFetch } from '../hooks/useApi';
import type { MarketIndex, MarketIndexHistory } from '../types';
import { createChart, ColorType, LineStyle } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts';

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

function IndexChart({ indexName }: { indexName: string }) {
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

  // Compute period change
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

    // Create chart
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

    // Create or update series
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

    // Handle resize
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

  // Cleanup on unmount
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
      {/* Period selector + stats */}
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

      {/* Chart */}
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

                    {/* Chart (expandable) */}
                    {isSelected && (
                      <IndexChart indexName={index.index_name} />
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
