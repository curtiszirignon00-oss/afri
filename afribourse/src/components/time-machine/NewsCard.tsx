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
  positive: { label: 'Haussier',  cls: 'bg-emerald-100 text-emerald-700', Icon: TrendingUp },
  negative: { label: 'Baissier',  cls: 'bg-red-100 text-red-700',         Icon: TrendingDown },
  warning:  { label: 'Attention', cls: 'bg-orange-100 text-orange-700',    Icon: AlertTriangle },
  neutral:  { label: 'Neutre',    cls: 'bg-gray-100 text-gray-600',        Icon: Minus },
};

export default function NewsCard({ news }: Props) {
  const sentiment = news.sentiment ?? 'neutral';
  const config = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;
  const Icon = config.Icon;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {news.tag && (
              <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {news.tag}
              </span>
            )}
            {news.src && (
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {news.src}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-800 leading-snug">{news.text}</p>
          {news.date && (
            <p className="mt-1.5 text-[10px] text-gray-400">{news.date}</p>
          )}
        </div>
        <span className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${config.cls}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      </div>
    </div>
  );
}
