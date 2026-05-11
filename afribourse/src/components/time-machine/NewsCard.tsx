import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NewsItem {
  headline: string;
  source?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  detail?: string;
}

interface Props {
  news: NewsItem;
}

const SENTIMENT_CONFIG = {
  positive: { label: 'Haussier', cls: 'bg-emerald-100 text-emerald-700', Icon: TrendingUp },
  negative: { label: 'Baissier', cls: 'bg-red-100 text-red-700', Icon: TrendingDown },
  neutral:  { label: 'Neutre',   cls: 'bg-gray-100 text-gray-600', Icon: Minus },
};

export default function NewsCard({ news }: Props) {
  const sentiment = news.sentiment ?? 'neutral';
  const config = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;
  const Icon = config.Icon;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {news.source && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {news.source}
            </p>
          )}
          <p className="text-sm font-semibold text-gray-800 leading-snug">{news.headline}</p>
          {news.detail && (
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{news.detail}</p>
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
