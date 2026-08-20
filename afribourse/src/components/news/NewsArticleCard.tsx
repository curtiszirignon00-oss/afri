import { Calendar, Clock, Newspaper, Heart, MessageCircle, Eye, Flame } from 'lucide-react';
import {
  getCategoryLabel, getCategoryColor, formatTimeAgo, calcReadTime,
  isNewArticle, stripHtml, type ArticleCounts,
} from './newsHelpers';

// Type structurel minimal — compatible avec le NewsArticle de NewsPage
export interface NewsCardArticle {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  tickers: string[];
  image_url: string | null;
  is_featured: boolean;
  published_at: string | null;
}

interface Props {
  article: NewsCardArticle;
  counts?: ArticleCounts;
  popular?: boolean;
  onOpen: () => void;
  compact?: boolean;
}

export default function NewsArticleCard({ article, counts, popular, onOpen, compact }: Props) {
  const teaser = article.summary?.trim() || stripHtml(article.content);

  return (
    <article
      onClick={onOpen}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-brand-navy/25 hover:shadow-lg cursor-pointer group overflow-hidden flex flex-col"
    >
      <div className={`${compact ? 'h-32' : 'h-44'} overflow-hidden bg-ink-100 relative`}>
        {article.image_url ? (
          <img src={article.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-navy to-ink-950">
            <Newspaper className="w-8 h-8 text-white/40" />
          </div>
        )}
        {/* Badges flottants en haut à gauche */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {isNewArticle(article.published_at) && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-orange text-white shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />NOUVEAU
            </span>
          )}
          {popular && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-brand-navy text-white shadow">
              <Flame className="w-2.5 h-2.5" />Populaire
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${getCategoryColor(article.category)}`}>
            {getCategoryLabel(article.category)}
          </span>
          {article.tickers?.slice(0, 3).map(t => (
            <span key={t} className="font-mono text-[10px] font-bold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
              {t}
            </span>
          ))}
        </div>

        <h4 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-brand-navy transition-colors line-clamp-2">
          {article.title}
        </h4>

        {!compact && teaser && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{teaser}</p>
        )}

        <div className="flex items-center justify-between text-gray-400 text-xs pt-3 border-t border-gray-100 mt-auto">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Il y a {formatTimeAgo(article.published_at)}</span>
          <div className="flex items-center gap-2.5">
            {counts && (counts.likes > 0 || counts.comments > 0 || counts.views > 0) ? (
              <>
                {counts.views > 0 && <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{counts.views}</span>}
                {counts.likes > 0 && <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" />{counts.likes}</span>}
                {counts.comments > 0 && <span className="flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{counts.comments}</span>}
              </>
            ) : (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{calcReadTime(article.content)} min</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
