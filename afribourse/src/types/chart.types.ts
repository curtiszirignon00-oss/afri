// Types pour les données de marché et les graphiques
export type ChartType = 'candlestick' | 'line' | 'area' | 'bar';

export type TimeInterval = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export interface OHLCVData {
  date: string;
  time: string; // date YYYY-MM-DD — lightweight-charts l'interprète comme BusinessDay (ignore sam/dim)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandlestickData {
  time: string; // date YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LineData {
  time: string; // date YYYY-MM-DD
  value: number;
}

export interface AreaData {
  time: string; // date YYYY-MM-DD
  value: number;
}

export interface HistogramData {
  time: string; // date YYYY-MM-DD
  value: number;
  color?: string;
}

export interface StockChartConfig {
  symbol: string;
  interval: TimeInterval;
  chartType: ChartType;
  theme?: 'light' | 'dark';
}

export interface ChartColors {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  borderUpColor: string;
  borderDownColor: string;
}

export interface PriceChange {
  value: number;
  percent: number;
  isPositive: boolean;
}
