import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface NewsItem {
  text: string;
  src?: string;
  date?: string;
  tag?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'warning';
}

interface Props {
  news: NewsItem;
}

const SENTIMENT_CONFIG = {
  positive: { label: 'Haussier',  cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', bar: 'bg-emerald-400', Icon: TrendingUp },
  negative: { label: 'Baissier',  cls: 'bg-red-100 text-red-600 border border-red-200',             bar: 'bg-red-400',     Icon: TrendingDown },
  warning:  { label: 'Attention', cls: 'bg-amber-100 text-amber-700 border border-amber-200',        bar: 'bg-amber-400',   Icon: AlertTriangle },
  neutral:  { label: 'Neutre',    cls: 'bg-gray-100 text-gray-500 border border-gray-200',           bar: 'bg-gray-300',    Icon: Minus },
};

export default function NewsCard({ news }: Props) {
  const sentiment = news.sentiment ?? 'neutral';
  const config = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;
  const Icon = config.Icon;

  return (
    <div className="relative bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl p-4 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md">
      {/* Colored left border accent */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${config.bar}`} />

      <div className="pl-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {news.tag && (
              <span className="text-[9px] font-bold bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {news.tag}
              </span>
            )}
            {news.src && (
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
                {news.src}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-800 leading-snug font-medium">{news.text}</p>
          {news.date && (
            <p className="mt-2 text-[10px] text-gray-400">{news.date}</p>
          )}
        </div>
        <span className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${config.cls}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
    </div>
  );
}
