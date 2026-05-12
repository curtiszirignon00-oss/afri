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
  positive: { label: 'Haussier',  cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20', bar: 'bg-emerald-500', Icon: TrendingUp },
  negative: { label: 'Baissier',  cls: 'bg-red-500/15 text-red-400 border border-red-500/20',             bar: 'bg-red-500',     Icon: TrendingDown },
  warning:  { label: 'Attention', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',        bar: 'bg-amber-500',   Icon: AlertTriangle },
  neutral:  { label: 'Neutre',    cls: 'bg-white/5 text-slate-400 border border-white/10',                 bar: 'bg-slate-500',   Icon: Minus },
};

export default function NewsCard({ news }: Props) {
  const sentiment = news.sentiment ?? 'neutral';
  const config = SENTIMENT_CONFIG[sentiment] ?? SENTIMENT_CONFIG.neutral;
  const Icon = config.Icon;

  return (
    <div className="relative bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all duration-200 overflow-hidden">
      {/* Colored left border accent */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${config.bar}`} />

      <div className="pl-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {news.tag && (
              <span className="text-[9px] font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {news.tag}
              </span>
            )}
            {news.src && (
              <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                {news.src}
              </p>
            )}
          </div>
          <p className="text-sm text-slate-200 leading-snug font-medium">{news.text}</p>
          {news.date && (
            <p className="mt-2 text-[10px] text-slate-600">{news.date}</p>
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
