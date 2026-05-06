// src/components/HomePage.tsx - VERSION REFONTE COMPLÈTE
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import OptimizedImage from './ui/OptimizedImage';
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BookOpen,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  Quote,
  CheckCircle,
  Award,
  Heart,
  MessageCircle,
  Flame
} from 'lucide-react';
import { useHomePageData, useRecentNews, NewsArticle } from '../hooks/useApi';
import { Button, Card, LoadingSpinner, ErrorMessage } from './ui';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, authFetch } from '../config/api';
import { ChallengeCTA } from './challenge';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { InstallInstructions } from './pwa/InstallPrompt';
import { NEWS_DATA } from '../data/newsData';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Scroll-reveal wrapper – respects prefers-reduced-motion */
function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/** Styled country badge – replaces emoji flags */
function CountryBadge({ code, name }: { code: string; name: string }) {
  const palette: Record<string, string> = {
    SN: 'bg-green-50 text-green-700 border-green-200',
    GH: 'bg-amber-50  text-amber-700  border-amber-200',
    CI: 'bg-orange-50 text-orange-700 border-orange-200',
    BF: 'bg-red-50    text-red-700    border-red-200',
    ML: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    TG: 'bg-lime-50   text-lime-700   border-lime-200',
    BJ: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NE: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  const cls = palette[code] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      <span className="font-mono text-[9px] opacity-50 tracking-widest">{code}</span>
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// HomePage
// ---------------------------------------------------------------------------

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { showInstructions, closeInstructions, platform } = useInstallPrompt();
  const newsContainerRef = useRef<HTMLDivElement>(null);

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const backgroundImages = [
    '/images/brvm-growth.webp',
    '/images/financial-ratios.webp',
    '/images/sonatel-dividend.webp',
  ];

  const { data, isLoading, error, refetch } = useHomePageData();
  const topStocks = data?.topStocks || [];

  // Actualités dynamiques — les plus récentes en BDD
  const { data: recentNewsData, isLoading: newsLoading } = useRecentNews(8);

  const { data: communityData } = useQuery({
    queryKey: ['home-community-preview'],
    queryFn: async () => {
      const response = await apiClient.get('/social/community?page=1&limit=20');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
  const topCommunityPosts = ((communityData?.data || communityData?.posts || []) as any[])
    .sort((a: any, b: any) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
    .slice(0, 3);
  const featuredNews = data?.featuredNews || [];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      id: 1,
      name: 'Aminata Diallo',
      role: 'Investisseuse depuis 2 ans',
      countryCode: 'SN',
      countryName: 'Sénégal',
      avatar: '/avatars/aminata.webp',
      rating: 5,
      comment:
        "AfriBourse m'a permis de comprendre la BRVM et de faire mes premiers investissements en toute confiance. Les formations sont exceptionnelles !",
    },
    {
      id: 2,
      name: 'Kwame Mensah',
      role: 'Entrepreneur',
      countryCode: 'GH',
      countryName: 'Ghana',
      avatar: '/avatars/kwame.webp',
      rating: 5,
      comment:
        "Interface intuitive, données en temps réel et analyses pertinentes. C'est l'outil qu'il manquait pour investir en Afrique de l'Ouest.",
    },
    {
      id: 3,
      name: 'Fatou Koné',
      role: 'Cadre bancaire',
      countryCode: 'CI',
      countryName: "Côte d'Ivoire",
      avatar: '/avatars/fatou.webp',
      rating: 5,
      comment:
        "Grâce à AfriBourse, j'ai diversifié mon portefeuille et augmenté mes rendements de 35% en 1 an. Je recommande vivement !",
    },
  ];

  const faqData = [
    {
      id: 1,
      question: "Qu'est-ce que la BRVM ?",
      answer:
        "La BRVM (Bourse Régionale des Valeurs Mobilières) est la bourse des valeurs des pays de l'UEMOA (Union Économique et Monétaire Ouest Africaine). Elle permet d'investir dans des entreprises cotées d'Afrique de l'Ouest.",
    },
    {
      id: 2,
      question: 'Combien faut-il pour commencer à investir ?',
      answer:
        'Vous pouvez commencer avec aussi peu que 50 000 FCFA. AfriBourse vous aide à démarrer progressivement avec des formations gratuites et un simulateur de portefeuille.',
    },
    {
      id: 3,
      question: 'Les formations sont-elles vraiment gratuites ?',
      answer:
        "Oui ! Tous nos modules d'apprentissage de base sont 100% gratuits. Nous proposons également des formations avancées premium pour ceux qui veulent aller plus loin.",
    },
    {
      id: 4,
      question: 'Comment puis-je suivre mes investissements ?',
      answer:
        "AfriBourse propose un tableau de bord complet avec suivi en temps réel de votre portefeuille, graphiques de performance, et alertes personnalisées sur vos actions préférées.",
    },
    {
      id: 5,
      question: "Est-ce que je peux investir depuis n'importe quel pays ?",
      answer:
        "Oui, AfriBourse est accessible depuis n'importe où dans le monde. Vous avez besoin d'un compte SGI (Société de Gestion et d'Intermédiation) local pour exécuter vos ordres.",
    },
  ];

  const [openFaqId, setOpenFaqId] = useState<number | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const exampleNews = [
    {
      id: 'ex1',
      title: 'La BRVM enregistre une hausse de 8% au premier trimestre 2025',
      summary: "Les investisseurs africains montrent un regain d'intérêt pour le marché boursier régional.",
      category: 'MARCHÉ',
      image_url: null,
      published_at: new Date().toISOString(),
      is_featured: true,
    },
    {
      id: 'ex2',
      title: 'Sonatel annonce un dividende record de 12 000 FCFA par action',
      summary: "L'opérateur télécoms récompense ses actionnaires après une année exceptionnelle.",
      category: 'DIVIDENDES',
      image_url: null,
      published_at: new Date().toISOString(),
      is_featured: false,
    },
    {
      id: 'ex3',
      title: 'Formation gratuite : Comprendre les ratios financiers',
      summary:
        'Apprenez à analyser le PER, le ROE et autres indicateurs clés pour choisir vos actions.',
      category: 'FORMATION',
      image_url: null,
      published_at: new Date().toISOString(),
      is_featured: false,
    },
  ];

  const displayedNews = featuredNews.length > 0 ? featuredNews : exampleNews;

  function formatNumber(num: number | null | undefined, options?: Intl.NumberFormatOptions): string {
    if (num == null) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      ...options,
    }).format(num);
  }

  function formatCurrency(value: number | null | undefined): string {
    if (value == null) return 'N/A';
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}Md`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
    return value.toString();
  }

  const scrollNews = (direction: 'left' | 'right') => {
    if (!newsContainerRef.current) return;
    const scrollAmount = newsContainerRef.current.offsetWidth * 0.8;
    newsContainerRef.current.scrollBy({
      left: direction === 'right' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) { setReviewError('Veuillez sélectionner une note'); return; }
    if (reviewText.trim().length === 0) { setReviewError('Veuillez saisir votre avis'); return; }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, text: reviewText.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Erreur lors de l'envoi");
      }
      setReviewRating(0);
      setReviewText('');
      setIsReviewModalOpen(false);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewRating(0);
    setReviewText('');
    setHoveredStar(0);
  };

  useEffect(() => {
    if (displayedNews.length <= 3) return;
    const interval = setInterval(() => {
      const container = newsContainerRef.current;
      if (container && !container.matches(':hover')) {
        const isAtEnd = container.scrollLeft + container.offsetWidth >= container.scrollWidth - 20;
        if (isAtEnd) container.scrollTo({ left: 0, behavior: 'smooth' });
        else scrollNews('right');
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [displayedNews]);

  if (isLoading) return <LoadingSpinner fullScreen text="Chargement de la page d'accueil..." />;
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

  // Country labels for news cards
  const COUNTRY_NAME: Record<string, string> = {
    CI: "Côte d'Ivoire",
    BF: 'Burkina Faso',
    SN: 'Sénégal',
    ML: 'Mali',
    TG: 'Togo',
    BJ: 'Bénin',
    NE: 'Niger',
    GW: 'Guinée-Bissau',
  };

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes floatOrb {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(24px, -32px) scale(1.06); }
        }
        @keyframes floatOrb2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-18px, 20px) scale(1.04); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-orb] { animation: none !important; }
        }
      `}</style>

      <div className="pb-16 md:pb-24">

        {/* === Hero === */}
        <section className="relative bg-gradient-to-tr from-blue-700 via-indigo-900 to-gray-900 text-white pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Rotating background images */}
          {backgroundImages.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Marché financier africain ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentBgIndex ? 'opacity-20' : 'opacity-0'}`}
            />
          ))}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />

          {/* Animated gradient orbs */}
          <div
            data-orb
            className="absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(96,165,250,0.22) 0%, rgba(129,140,248,0.12) 50%, transparent 70%)',
              animation: 'floatOrb 9s ease-in-out infinite alternate',
            }}
          />
          <div
            data-orb
            className="absolute bottom-0 -left-24 w-[480px] h-[480px] rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 70%)',
              animation: 'floatOrb2 13s ease-in-out infinite alternate',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="max-w-4xl text-center mx-auto">
              <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 px-6 py-2 rounded-full text-sm font-semibold mb-6 animate-pulse">
                <Award className="w-4 h-4" />
                <span>Plateforme #1 pour maîtriser la Bourse en Afrique de l'Ouest.</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
                Prenez des décisions éclairées pour votre{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400">
                  avenir financier
                </span>
              </h1>

              <p className="text-lg md:text-2xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                Formations gratuites, données en temps réel et analyses d'experts pour vous aider à investir
                intelligemment sur la BRVM
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(isLoggedIn ? '/markets' : '/signup')}
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  {isLoggedIn ? 'Explorer les marchés' : 'Commencer gratuitement'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <Button variant="secondary" size="lg" onClick={() => navigate('/learn')}>
                  <BookOpen className="w-5 h-5 mr-2" />
                  Apprendre à investir
                </Button>

              </div>
            </div>
          </div>
        </section>

        {/* === Challenge CTA === */}
        <ChallengeCTA />

        {/* === Académie === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
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
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => navigate(isLoggedIn ? '/learn' : '/signup')}
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
                  <AnimatedSection key={idx} delay={idx * 80}>
                    <Card hoverable className="text-center cursor-pointer">
                      <span className={`text-2xl font-bold text-${item.color}-500 block mb-1`}>
                        {item.level}
                      </span>
                      <span className="text-sm font-semibold block">{item.title}</span>
                      <span className="text-xs text-gray-500 block">{item.subtitle}</span>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>
            </div>
          </Card>
        </AnimatedSection>

        {/* === Top Performances === */}
        {topStocks.length > 0 && (
          <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Top Performances</h2>
                <p className="text-gray-600 mt-1">Les actions qui se démarquent aujourd'hui</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/markets')}>
                Voir le marché
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topStocks.map((stock, idx) => (
                <AnimatedSection key={stock.id} delay={idx * 60}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                    className="cursor-pointer transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center font-bold text-gray-700 text-sm overflow-hidden shadow-md">
                          {stock.logo_url ? (
                            <OptimizedImage src={stock.logo_url} alt={stock.symbol} className="w-full h-full object-cover" />
                          ) : (
                            stock.symbol.substring(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{stock.symbol}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">{stock.company_name}</p>
                        </div>
                      </div>

                      <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${stock.daily_change_percent >= 0
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'}`}>
                        {stock.daily_change_percent >= 0
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />}
                        <span>
                          {stock.daily_change_percent >= 0 ? '+' : ''}
                          {stock.daily_change_percent?.toFixed(2) ?? '0.00'}%
                        </span>
                      </div>
                    </div>

                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {formatNumber(stock.current_price)} F
                    </p>

                    <div className="pt-3 border-t border-gray-100 mt-3 text-xs text-gray-500 flex justify-between">
                      <span>Cap: {formatCurrency(stock.market_cap)}</span>
                      {stock.sector && <span className="font-medium text-blue-600">{stock.sector}</span>}
                    </div>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        )}

        {/* === Communauté === */}
        {topCommunityPosts.length > 0 && (
          <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <h2 className="text-3xl font-bold text-gray-900">La Communauté en effervescence</h2>
                </div>
                <p className="text-gray-600">Les posts qui font le plus réagir en ce moment</p>
              </div>
              <Button variant="ghost" onClick={() => navigate('/community')}>
                Voir la communauté
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {topCommunityPosts.map((post: any, idx: number) => {
                const authorName =
                  post.author?.profile?.username ||
                  `${post.author?.name ?? ''} ${post.author?.lastname ?? ''}`.trim();
                const avatar = post.author?.profile?.avatar_url;
                const typeColors: Record<string, string> = {
                  ANALYSIS: 'bg-blue-100 text-blue-700',
                  TRANSACTION: 'bg-green-100 text-green-700',
                  OPINION: 'bg-purple-100 text-purple-700',
                  QUESTION: 'bg-yellow-100 text-yellow-700',
                  ACHIEVEMENT: 'bg-orange-100 text-orange-700',
                  ARTICLE: 'bg-gray-100 text-gray-700',
                };
                const typeLabels: Record<string, string> = {
                  ANALYSIS: 'Analyse',
                  TRANSACTION: 'Transaction',
                  OPINION: 'Opinion',
                  QUESTION: 'Question',
                  ACHIEVEMENT: 'Succès',
                  ARTICLE: 'Article',
                };
                return (
                  <AnimatedSection key={post.id} delay={idx * 80}>
                    <Card
                      hoverable
                      onClick={() => navigate('/community')}
                      className="cursor-pointer transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl flex flex-col"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center font-bold text-gray-700 text-xs overflow-hidden shrink-0">
                          {avatar
                            ? <OptimizedImage src={avatar} alt={authorName} className="w-full h-full object-cover" />
                            : authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{authorName}</p>
                          {post.author?.profile?.verified_investor && (
                            <span className="text-xs text-blue-500 font-medium">Investisseur vérifié</span>
                          )}
                        </div>
                        {post.type && (
                          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${typeColors[post.type] ?? 'bg-gray-100 text-gray-700'}`}>
                            {typeLabels[post.type] ?? post.type}
                          </span>
                        )}
                      </div>

                      {post.title && (
                        <p className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{post.title}</p>
                      )}
                      <p className="text-sm text-gray-600 line-clamp-3 flex-1">{post.content}</p>

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-400" />
                          {post.likes_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-blue-400" />
                          {post.comments_count ?? 0}
                        </span>
                      </div>
                    </Card>
                  </AnimatedSection>
                );
              })}
            </div>
          </AnimatedSection>
        )}

        {/* === Actualités du Jour — dynamiques + fallback fondamentaux === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#00D4A8]" />
                <span className="text-xs font-semibold text-[#00D4A8] uppercase tracking-widest">
                  {recentNewsData && recentNewsData.length > 0 ? 'En direct' : 'Résultats 2025'}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Actualités du Jour</h2>
              <p className="text-gray-600 mt-1">
                {recentNewsData && recentNewsData.length > 0
                  ? 'Les dernières actualités des marchés financiers africains'
                  : 'Résultats annuels et dividendes des sociétés cotées à la BRVM'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => scrollNews('left')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => scrollNews('right')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={() => navigate('/news')} className="ml-2">
                Voir tout <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <div
            ref={newsContainerRef}
            className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollPadding: '1rem' }}
          >
            {/* Skeleton pendant le chargement */}
            {newsLoading && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="snap-start flex-shrink-0 w-[85%] sm:w-[46%] md:w-[31%] lg:w-[23%]">
                <div className="h-full bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
                  <div className="h-1 bg-slate-200" />
                  <div className="h-28 bg-slate-100" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-4/5" />
                    <div className="h-3 bg-slate-200 rounded w-1/2 mt-4" />
                  </div>
                </div>
              </div>
            ))}

            {/* Articles dynamiques depuis l'API */}
            {!newsLoading && recentNewsData && recentNewsData.length > 0 && recentNewsData.map((article) => {
              const catKey = (article.category ?? '').toUpperCase();
              const catStyles: Record<string, { bar: string; badge: string; text: string }> = {
                'MARCHÉ':      { bar: '#3b82f6', badge: 'bg-blue-50 border-blue-200',    text: 'text-blue-700'    },
                'MARCHE':      { bar: '#3b82f6', badge: 'bg-blue-50 border-blue-200',    text: 'text-blue-700'    },
                'DIVIDENDES':  { bar: '#00D4A8', badge: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
                'FORMATION':   { bar: '#8b5cf6', badge: 'bg-purple-50 border-purple-200',  text: 'text-purple-700'  },
                'ANALYSE':     { bar: '#6366f1', badge: 'bg-indigo-50 border-indigo-200',  text: 'text-indigo-700'  },
                'RÉSULTATS':   { bar: '#f59e0b', badge: 'bg-amber-50 border-amber-200',    text: 'text-amber-700'   },
                'RESULTATS':   { bar: '#f59e0b', badge: 'bg-amber-50 border-amber-200',    text: 'text-amber-700'   },
              };
              const style = catStyles[catKey] ?? { bar: '#94a3b8', badge: 'bg-slate-50 border-slate-200', text: 'text-slate-600' };

              const timeAgo = (dateStr: string | null) => {
                if (!dateStr) return '';
                const diffH = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000);
                if (diffH < 1)  return "moins d'1h";
                if (diffH < 24) return `il y a ${diffH}h`;
                const diffD = Math.floor(diffH / 24);
                if (diffD < 7)  return `il y a ${diffD}j`;
                return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              };

              return (
                <div key={article.id} className="snap-start flex-shrink-0 w-[85%] sm:w-[46%] md:w-[31%] lg:w-[23%]">
                  <article
                    className="group h-full bg-white border border-slate-200 rounded-xl hover:border-[#00D4A8] hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => navigate('/news')}
                  >
                    <div className="h-1 rounded-t-xl" style={{ background: style.bar }} />

                    {/* Image ou placeholder */}
                    <div className="relative h-28 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      {article.image_url ? (
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover opacity-70" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #00D4A8 0%, transparent 60%)' }} />
                      )}
                      {article.category && (
                        <span className={`absolute bottom-2 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${style.badge} ${style.text}`}>
                          {article.category}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-3 mb-2 group-hover:text-[#00D4A8] transition-colors flex-1">
                        {article.title}
                      </h3>

                      {article.summary && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {article.summary}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock size={10} />
                          {timeAgo(article.published_at)}
                        </span>
                        <span className="text-[10px] text-[#00D4A8] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Lire <ChevronRight size={11} />
                        </span>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}

            {/* Fallback statique si l'API ne retourne rien */}
            {!newsLoading && (!recentNewsData || recentNewsData.length === 0) && NEWS_DATA.map((item) => {
              const last = item.history[item.history.length - 1];
              const prev = item.history[item.history.length - 2];
              const divVar = ((last.dividend - prev.dividend) / Math.abs(prev.dividend)) * 100;
              const trendColor = item.dividendTrend === 'hausse' ? '#00D4A8' : item.dividendTrend === 'baisse' ? '#ef4444' : '#94a3b8';

              return (
                <div key={item.id} className="snap-start flex-shrink-0 w-[85%] sm:w-[46%] md:w-[31%] lg:w-[23%]">
                  <article
                    className="group h-full bg-white border border-slate-200 rounded-xl hover:border-[#00D4A8] hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
                    onClick={() => navigate('/news')}
                  >
                    <div className="h-1 rounded-t-xl" style={{ background: trendColor }} />
                    <div className="relative h-28 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #00D4A8 0%, transparent 60%)' }} />
                      <div className="text-center z-10 px-4">
                        <span className="font-mono text-2xl font-bold text-white tracking-wide">{item.ticker.split(' ')[0]}</span>
                        <div className="flex items-center justify-center gap-1.5 mt-1">
                          <CountryBadge code={item.country} name={COUNTRY_NAME[item.country] ?? item.country} />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-lg px-2 py-1 text-center">
                        <p className="text-[9px] text-[#00D4A8]/80 uppercase tracking-wide leading-none mb-0.5">DY</p>
                        <p className="text-sm font-bold text-[#00D4A8] leading-none">{item.dyAnnual.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 self-start mb-2">{item.sector}</span>
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-3 group-hover:text-[#00D4A8] transition-colors flex-1">{item.headline}</h3>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wide">Dividende</p>
                          <p className="text-xs font-bold text-slate-800">{last.dividend.toLocaleString('fr-FR')} XOF</p>
                          <p className={`text-[9px] font-medium ${divVar >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{divVar >= 0 ? '+' : ''}{divVar.toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2 text-center">
                          <p className="text-[9px] text-slate-400 uppercase tracking-wide">PER</p>
                          <p className="text-xs font-bold text-slate-800">{item.per.toFixed(1)}x</p>
                          <p className="text-[9px] text-slate-400">valorisation</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {item.dividendTrend === 'hausse' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><TrendingUp size={9} /> Div. en hausse</span>
                        ) : item.dividendTrend === 'baisse' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><TrendingDown size={9} /> Div. en baisse</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">Stable</span>
                        )}
                        <span className="text-[10px] text-[#00D4A8] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">Analyse <ChevronRight size={11} /></span>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-slate-400 mt-3 sm:hidden">← Faites glisser pour voir plus →</p>
        </AnimatedSection>

        {/* === Témoignages === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Rejoignez des milliers d'investisseurs qui ont transformé leur avenir financier avec AfriBourse
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center space-x-2 cursor-pointer"
            >
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Laisser un avis</span>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <AnimatedSection key={testimonial.id} delay={idx * 100}>
                <Card hoverable className="transform hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                  <div className="relative">
                    <div className="absolute -top-4 -left-4 bg-blue-500 text-white rounded-full p-3 shadow-lg">
                      <Quote className="w-6 h-6" />
                    </div>

                    <div className="flex justify-end mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>

                    <p className="text-gray-700 mb-6 italic leading-relaxed">
                      "{testimonial.comment}"
                    </p>

                    <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden shrink-0">
                        {testimonial.avatar ? (
                          <OptimizedImage src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                        ) : (
                          testimonial.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{testimonial.name}</p>
                        <p className="text-sm text-gray-600">{testimonial.role}</p>
                        <div className="mt-1.5">
                          <CountryBadge code={testimonial.countryCode} name={testimonial.countryName} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* === FAQ === */}
        <AnimatedSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Questions Fréquentes</h2>
            <p className="text-gray-600">
              Tout ce que vous devez savoir pour commencer à investir sur la BRVM
            </p>
          </div>

          <div className="space-y-3">
            {faqData.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${isOpen ? 'border-blue-200 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                >
                  <div className="flex justify-between items-center px-5 py-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 pr-4">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isOpen ? 'text-blue-500' : 'text-green-500'}`} />
                      {faq.question}
                    </h3>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                    />
                  </div>

                  {/* Smooth height accordion */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: isOpen ? '240px' : '0px' }}
                  >
                    <p className="text-gray-600 leading-relaxed px-5 pb-4 ml-7">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">Vous avez d'autres questions ?</p>
            <Button variant="outline" onClick={() => navigate('/help')}>
              Consulter notre centre d'aide
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </AnimatedSection>

        {/* === CTA Final === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
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
                onClick={() => navigate(isLoggedIn ? '/markets' : '/signup')}
              >
                {isLoggedIn ? 'Commencer à investir' : 'Créer un compte gratuit'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </Card>
        </AnimatedSection>

        {/* === Modal Avis === */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative"
              style={{ animation: 'fadeUp 0.25s ease-out both' }}
            >
              <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

              <button
                onClick={closeReviewModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200 cursor-pointer"
                aria-label="Fermer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Partagez votre expérience</h3>
                <p className="text-gray-600">Votre avis nous aide à améliorer nos services</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">Votre note</label>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors duration-150 ${star <= (hoveredStar || reviewRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
                {reviewRating > 0 && (
                  <p className="text-center text-sm text-gray-600 mt-2">
                    {['', 'Décevant', 'Peut mieux faire', 'Correct', 'Très bien', 'Excellent'][reviewRating]}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Votre avis <span className="text-gray-500 font-normal">(max 200 caractères)</span>
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => { if (e.target.value.length <= 200) setReviewText(e.target.value); }}
                  placeholder="Partagez votre expérience avec AfriBourse..."
                  className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">{reviewText.length}/200 caractères</p>
                  {reviewText.length === 200 && (
                    <p className="text-xs text-orange-600 font-medium">Limite atteinte</p>
                  )}
                </div>
              </div>

              {reviewError && <p className="text-sm text-red-600 text-center -mt-2 mb-3">{reviewError}</p>}

              <div className="flex space-x-4">
                <Button variant="ghost" onClick={closeReviewModal} className="flex-1" disabled={reviewSubmitting}>
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || reviewText.trim().length === 0 || reviewSubmitting}
                  className="flex-1"
                >
                  {reviewSubmitting ? 'Envoi...' : "Envoyer l'avis"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showInstructions && <InstallInstructions platform={platform} onClose={closeInstructions} />}
    </>
  );
}
