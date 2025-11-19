import { ExternalLink, Newspaper } from 'lucide-react';

type NewsItem = {
  id: string;
  stock_ticker: string;
  title: string;
  summary?: string | null;
  source: string;
  url?: string | null;
  published_at: Date | string;
};

type StockNewsProps = {
  news: NewsItem[];
  isLoading?: boolean;
};

export default function StockNews({ news, isLoading = false }: StockNewsProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    if (diffInDays < 30) return `Il y a ${Math.floor(diffInDays / 7)} semaine${Math.floor(diffInDays / 7) > 1 ? 's' : ''}`;
    return formatDate(d);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!news || news.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <Newspaper className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium text-gray-600">Aucune actualité disponible</p>
          <p className="text-sm text-gray-500 mt-2">
            Les actualités concernant cette action apparaîtront ici.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">
        Dernières Actualités ({news.length})
      </h3>

      {news.map((item) => (
        <article
          key={item.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                {item.title}
              </h4>

              <div className="flex items-center space-x-3 text-sm text-gray-600 mb-3">
                <span className="font-medium text-blue-600">{item.source}</span>
                <span>•</span>
                <time dateTime={item.published_at.toString()}>
                  {getTimeAgo(item.published_at)}
                </time>
              </div>

              {item.summary && (
                <p className="text-gray-700 leading-relaxed mb-4">{item.summary}</p>
              )}

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  <span>Lire l'article complet</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
