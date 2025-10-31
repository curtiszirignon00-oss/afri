// src/components/HomePage.tsx
import { useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, BookOpen, Newspaper, BarChart3, Users, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHomePageData } from '../hooks/useApi';
import { Button, Card, LoadingSpinner, ErrorMessage } from './ui';

type HomePageProps = {
  onNavigate: (page: string, data?: any) => void;
  isLoggedIn: boolean;
};

export default function HomePage({ onNavigate, isLoggedIn }: HomePageProps) {
  const newsContainerRef = useRef<HTMLDivElement>(null);

  // ✅ React Query remplace useState + useEffect + fetch
  const { data, isLoading, error, refetch } = useHomePageData();

  const topStocks = data?.topStocks || [];
  const featuredNews = data?.featuredNews || [];

  // --- Fonctions Utilitaires ---
  function formatNumber(num: number | null | undefined, options?: Intl.NumberFormatOptions): string {
    if (num == null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0,
      ...options 
    }).format(num);
  }

  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return 'N/A';
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}Md`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return value.toString();
  }

  // Carousel News
  const scrollNews = (direction: 'left' | 'right') => {
    if (!newsContainerRef.current) return;
    const scrollAmount = newsContainerRef.current.offsetWidth * 0.8;
    newsContainerRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth'
    });
  };

  // Auto-scroll carousel
  useEffect(() => {
    if (featuredNews.length <= 3) return;

    const interval = setInterval(() => {
      const container = newsContainerRef.current;
      if (container && !container.matches(':hover')) {
        const isAtEnd = container.scrollLeft + container.offsetWidth >= container.scrollWidth - 20;
        if (isAtEnd) {
          container.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollNews('right');
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredNews]);

  // ✅ LoadingSpinner remplace le spinner manuel
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Chargement de la page d'accueil..." />;
  }

  // ✅ ErrorMessage remplace l'affichage d'erreur manuel
  if (error) {
    return (
      <ErrorMessage
        fullScreen
        title="Erreur de chargement"
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="pb-16 md:pb-24">
      {/* === Section Héros === */}
      <section className="relative bg-gradient-to-tr from-blue-700 via-indigo-900 to-gray-900 text-white pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <img 
          src="/images/african-market-background.jpg" 
          alt="Marché financier africain" 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-3xl text-center mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
              INVESTIR <span className="text-blue-400">MIEUX</span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              Prenez des décisions éclairées pour votre avenir financier avec la BRVM.
            </p>

            {/* ✅ Button remplace le bouton manuel */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigate(isLoggedIn ? 'markets' : 'signup')}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                {isLoggedIn ? 'Explorer les marchés' : 'Commencer gratuitement'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => onNavigate('learn')}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Apprendre à investir
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* === Section Statistiques === */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ✅ Card remplace les div bg-white */}
          <Card variant="elevated" padding="lg" hoverable>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Actions disponibles</p>
                <p className="text-3xl font-bold text-gray-900">{topStocks.length}+</p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hoverable>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-green-100 rounded-full">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Investisseurs actifs</p>
                <p className="text-3xl font-bold text-gray-900">10k+</p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg" hoverable>
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-purple-100 rounded-full">
                <Newspaper className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">Articles publiés</p>
                <p className="text-3xl font-bold text-gray-900">500+</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* === Section Académie === */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <BookOpen className="w-4 h-4" />
                <span>Académie AfriBourse</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Apprenez à investir intelligemment
              </h2>
              <p className="text-gray-700 mb-6 max-w-xl">
                Des guides complets, des tutoriels vidéo et des analyses pour maîtriser l'investissement boursier. 
                Apprenez à votre rythme.
              </p>

              {/* ✅ Button remplace le bouton manuel */}
              <Button
                variant="success"
                size="lg"
                onClick={() => onNavigate(isLoggedIn ? 'learn' : 'signup')}
              >
                <FileText className="w-5 h-5 mr-2" />
                {isLoggedIn ? "Accéder à l'Académie" : 'Créer un Compte Gratuit'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {[
                { level: '1', title: 'Niveau Débutant', subtitle: 'Les bases', color: 'green' },
                { level: '2', title: 'Intermédiaire', subtitle: 'Analyse', color: 'yellow' },
                { level: '3', title: 'Avancé', subtitle: 'Stratégies', color: 'orange' },
                { level: '✓', title: 'Certification', subtitle: 'Validez', color: 'red' },
              ].map((item, idx) => (
                <Card key={idx} hoverable className="text-center">
                  <span className={`text-2xl font-bold text-${item.color}-500 block mb-1`}>
                    {item.level}
                  </span>
                  <span className="text-sm font-semibold block">{item.title}</span>
                  <span className="text-xs text-gray-500 block">{item.subtitle}</span>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* === Section Top Actions === */}
      {topStocks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Top Performances</h2>
            <Button variant="ghost" onClick={() => onNavigate('markets')}>
              Voir le marché
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topStocks.map((stock) => (
              <Card
                key={stock.id}
                hoverable
                onClick={() => onNavigate('stock-detail', stock)}
                className="cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm overflow-hidden">
                      {stock.logo_url ? (
                        <img src={stock.logo_url} alt={stock.symbol} className="w-full h-full object-contain" />
                      ) : (
                        stock.symbol.substring(0, 3)
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors">
                        {stock.symbol}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">{stock.company_name}</p>
                    </div>
                  </div>

                  <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    stock.daily_change_percent >= 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stock.daily_change_percent >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>
                      {stock.daily_change_percent >= 0 ? '+' : ''}
                      {stock.daily_change_percent?.toFixed(2) ?? '0.00'}%
                    </span>
                  </div>
                </div>

                <p className="text-xl font-bold text-gray-900 mb-1">
                  {formatNumber(stock.current_price)} F
                </p>

                <div className="pt-3 border-t border-gray-100 mt-3 text-xs text-gray-500 flex justify-between">
                  <span>Cap: {formatCurrency(stock.market_cap)}</span>
                  {stock.sector && <span>{stock.sector}</span>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* === Section Actualités === */}
      {featuredNews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Actualités du Jour</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => scrollNews('left')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollNews('right')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={() => onNavigate('news')} className="ml-4">
                Voir tout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          <div
            ref={newsContainerRef}
            className="flex space-x-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollPadding: '1rem' }}
          >
            {featuredNews.map((article) => (
              <div
                key={article.id}
                className="snap-start flex-shrink-0 w-[80%] sm:w-[45%] md:w-[30%] lg:w-[23%]"
              >
                <Card hoverable className="h-full flex flex-col">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col">
                    {article.category && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full mb-2 self-start">
                        {article.category}
                      </span>
                    )}

                    <h3 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 flex-1">
                      {article.title}
                    </h3>

                    {article.summary && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">{article.summary}</p>
                    )}

                    {article.published_at && (
                      <p className="text-xs text-gray-500">
                        {new Date(article.published_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === Section CTA Final === */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center">
          <div className="py-12 px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à commencer votre voyage d'investissement ?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers d'investisseurs qui font confiance à AfriBourse pour développer leur patrimoine.
            </p>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate(isLoggedIn ? 'markets' : 'signup')}
            >
              {isLoggedIn ? 'Commencer à investir' : 'Créer un compte gratuit'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}