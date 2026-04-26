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
  Newspaper,
  BarChart3,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Star,
  Quote,
  CheckCircle,
  Target,
  Award,
  TrendingUpIcon,
  Heart,
  MessageCircle,
  Flame
} from 'lucide-react';
import { useHomePageData } from '../hooks/useApi';
import { Button, Card, LoadingSpinner, ErrorMessage } from './ui';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, authFetch } from '../config/api';
import { ChallengeCTA } from './challenge';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { InstallInstructions } from './pwa/InstallPrompt';
import { NEWS_DATA } from '../data/newsData';

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { isInstallable, installApp, showInstructions, closeInstructions, platform } = useInstallPrompt();
  const newsContainerRef = useRef<HTMLDivElement>(null);

  // <-- AJOUT: État pour rotation des images de fond
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Images de fond - servies depuis le dossier public du frontend
  const backgroundImages = [
    '/images/brvm-growth.png',
    '/images/financial-ratios.png',
    '/images/sonatel-dividend.png'
  ];

  // ✅ React Query remplace useState + useEffect + fetch
  const { data, isLoading, error, refetch } = useHomePageData();

  const topStocks = data?.topStocks || [];

  // Top posts communauté (3 posts avec le plus d'engagement)
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

  // <-- AJOUT: Rotation automatique des images de fond toutes les 6 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 6000); // Change toutes les 6 secondes

    return () => clearInterval(interval);
  }, []);

  // Données de témoignages avec avatars - servies depuis le dossier public du frontend
  const testimonials = [
    {
      id: 1,
      name: "Aminata Diallo",
      role: "Investisseuse depuis 2 ans",
      country: "🇸🇳 Sénégal",
      avatar: "/avatars/aminata.png",
      rating: 5,
      comment: "AfriBourse m'a permis de comprendre la BRVM et de faire mes premiers investissements en toute confiance. Les formations sont exceptionnelles !"
    },
    {
      id: 2,
      name: "Kwame Mensah",
      role: "Entrepreneur",
      country: "🇬🇭 Ghana",
      avatar: "/avatars/kwame.png",
      rating: 5,
      comment: "Interface intuitive, données en temps réel et analyses pertinentes. C'est l'outil qu'il manquait pour investir en Afrique de l'Ouest."
    },
    {
      id: 3,
      name: "Fatou Koné",
      role: "Cadre bancaire",
      country: "🇨🇮 Côte d'Ivoire",
      avatar: "/avatars/fatou.png",
      rating: 5,
      comment: "Grâce à AfriBourse, j'ai diversifié mon portefeuille et augmenté mes rendements de 35% en 1 an. Je recommande vivement !"
    }
  ];

  // <-- AJOUT: Données FAQ (exemples statiques)
  const faqData = [
    {
      id: 1,
      question: "Qu'est-ce que la BRVM ?",
      answer: "La BRVM (Bourse Régionale des Valeurs Mobilières) est la bourse des valeurs des pays de l'UEMOA (Union Économique et Monétaire Ouest Africaine). Elle permet d'investir dans des entreprises cotées d'Afrique de l'Ouest."
    },
    {
      id: 2,
      question: "Combien faut-il pour commencer à investir ?",
      answer: "Vous pouvez commencer avec aussi peu que 50 000 FCFA. AfriBourse vous aide à démarrer progressivement avec des formations gratuites et un simulateur de portefeuille."
    },
    {
      id: 3,
      question: "Les formations sont-elles vraiment gratuites ?",
      answer: "Oui ! Tous nos modules d'apprentissage de base sont 100% gratuits. Nous proposons également des formations avancées premium pour ceux qui veulent aller plus loin."
    },
    {
      id: 4,
      question: "Comment puis-je suivre mes investissements ?",
      answer: "AfriBourse propose un tableau de bord complet avec suivi en temps réel de votre portefeuille, graphiques de performance, et alertes personnalisées sur vos actions préférées."
    },
    {
      id: 5,
      question: "Est-ce que je peux investir depuis n'importe quel pays ?",
      answer: "Oui, AfriBourse est accessible depuis n'importe où dans le monde. Vous avez besoin d'un compte SGI (Société de Gestion et d'Intermédiation) local pour exécuter vos ordres."
    }
  ];

  // <-- AJOUT: État pour l'accordéon FAQ
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  // <-- AJOUT: État pour le modal d'avis
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  // Actualités d'exemple (sans images pour le moment - seront ajoutées plus tard)
  const exampleNews = [
    {
      id: 'ex1',
      title: "La BRVM enregistre une hausse de 8% au premier trimestre 2025",
      summary: "Les investisseurs africains montrent un regain d'intérêt pour le marché boursier régional.",
      category: "MARCHÉ",
      image_url: null,
      published_at: new Date().toISOString(),
      is_featured: true
    },
    {
      id: 'ex2',
      title: "Sonatel annonce un dividende record de 12 000 FCFA par action",
      summary: "L'opérateur télécoms récompense ses actionnaires après une année exceptionnelle.",
      category: "DIVIDENDES",
      image_url: null,
      published_at: new Date().toISOString(),
      is_featured: false
    },
    {
      id: 'ex3',
      title: "Formation gratuite : Comprendre les ratios financiers",
      summary: "Apprenez à analyser le PER, le ROE et autres indicateurs clés pour choisir vos actions.",
      category: "FORMATION",
      image_url: null,
      published_at: new Date().toISOString(),
      is_featured: false
    }
  ];

  // <-- CORRECTION: Utiliser exampleNews si featuredNews est vide
  const displayedNews = featuredNews.length > 0 ? featuredNews : exampleNews;

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

  // <-- AJOUT: Fonctions pour gérer le modal d'avis
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewError('Veuillez sélectionner une note');
      return;
    }
    if (reviewText.trim().length === 0) {
      setReviewError('Veuillez saisir votre avis');
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, text: reviewText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erreur lors de l\'envoi');
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

  // Auto-scroll carousel
  useEffect(() => {
    if (displayedNews.length <= 3) return;

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
  }, [displayedNews]);

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
    <>
    <div className="pb-16 md:pb-24">
      {/* === Section Héros AMÉLIORÉE === */}
      <section className="relative bg-gradient-to-tr from-blue-700 via-indigo-900 to-gray-900 text-white pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* <-- AJOUT: Images de fond rotatives avec transition fluide */}
        {backgroundImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Marché financier africain ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentBgIndex ? 'opacity-20' : 'opacity-0'
              }`}
          />
        ))}

        {/* <-- CORRECTION: Overlay amélioré pour meilleure lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-4xl text-center mx-auto">
            {/* <-- AJOUT: Badge "Nouvelle plateforme" */}
            <div className="inline-flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-200 px-6 py-2 rounded-full text-sm font-semibold mb-6 animate-pulse">
              <Award className="w-4 h-4" />
              <span>Plateforme #1 pour maîtriser la Bourse en Afrique de l'Ouest.</span>
            </div>

            {/* <-- CORRECTION: Titre amélioré et slogan plus impactant */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
              Prenez des décisions éclairées pour votre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400">
                avenir financier
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-indigo-100 mb-10 max-w-3xl mx-auto leading-relaxed">
              Formations gratuites, données en temps réel et analyses d'experts pour vous aider à investir intelligemment sur la BRVM
            </p>

            {/* ✅ Boutons inchangés (comme demandé) */}
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

              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/learn')}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Apprendre à investir
              </Button>

              {isInstallable && (
                <button
                  onClick={() => installApp()}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Installer l'application
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* === Challenge AfriBourse 2026 CTA === */}
      <ChallengeCTA />

      {/* === Section Académie (inchangée) === */}
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

      {/* === Section Top Performances AMÉLIORÉE === */}
      {topStocks.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
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

          {/* <-- CORRECTION: Design amélioré avec ombres et hover effects */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topStocks.map((stock) => (
              <Card
                key={stock.id}
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
                      <p className="text-xs text-gray-500 truncate max-w-[140px]">
                        {stock.company_name}
                      </p>
                    </div>
                  </div>

                  {/* <-- CORRECTION: Badge de variation amélioré */}
                  <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${stock.daily_change_percent >= 0
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                    : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
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

                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {formatNumber(stock.current_price)} F
                </p>

                <div className="pt-3 border-t border-gray-100 mt-3 text-xs text-gray-500 flex justify-between">
                  <span>Cap: {formatCurrency(stock.market_cap)}</span>
                  {stock.sector && <span className="font-medium text-blue-600">{stock.sector}</span>}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* === Section Aperçu Communauté === */}
      {topCommunityPosts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
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
            {topCommunityPosts.map((post: any) => {
              const authorName = post.author?.profile?.username
                || `${post.author?.name ?? ''} ${post.author?.lastname ?? ''}`.trim();
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
                ANALYSIS: 'Analyse', TRANSACTION: 'Transaction',
                OPINION: 'Opinion', QUESTION: 'Question',
                ACHIEVEMENT: 'Succès', ARTICLE: 'Article',
              };
              return (
                <Card
                  key={post.id}
                  hoverable
                  onClick={() => navigate('/community')}
                  className="cursor-pointer transform hover:-translate-y-1 transition-all duration-300 hover:shadow-xl flex flex-col"
                >
                  {/* Auteur */}
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

                  {/* Contenu */}
                  {post.title && (
                    <p className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">{post.title}</p>
                  )}
                  <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                    {post.content}
                  </p>

                  {/* Engagement */}
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
              );
            })}
          </div>
        </section>
      )}

      {/* === Section Actualités — Résultats fondamentaux BRVM === */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00D4A8]" />
              <span className="text-xs font-semibold text-[#00D4A8] uppercase tracking-widest">Résultats 2025</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Actualités du Jour</h2>
            <p className="text-gray-600 mt-1">Résultats annuels et dividendes des sociétés cotées à la BRVM</p>
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

        {/* Carousel */}
        <div
          ref={newsContainerRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
          style={{ scrollPadding: '1rem' }}
        >
          {NEWS_DATA.map((item) => {
            const last = item.history[item.history.length - 1];
            const prev = item.history[item.history.length - 2];
            const divVar = ((last.dividend - prev.dividend) / Math.abs(prev.dividend)) * 100;
            const trendColor = item.dividendTrend === 'hausse' ? '#00D4A8' : item.dividendTrend === 'baisse' ? '#ef4444' : '#94a3b8';
            const COUNTRY_FLAG: Record<string, string> = { CI: '🇨🇮', BF: '🇧🇫', SN: '🇸🇳' };

            return (
              <div
                key={item.id}
                className="snap-start flex-shrink-0 w-[85%] sm:w-[46%] md:w-[31%] lg:w-[23%]"
              >
                <article
                  className="group h-full bg-white border border-slate-200 rounded-xl hover:border-[#00D4A8] hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
                  onClick={() => navigate('/news')}
                >
                  {/* Barre accent top */}
                  <div className="h-1 rounded-t-xl" style={{ background: trendColor }} />

                  {/* Visuel de fond stylisé */}
                  <div className="relative h-28 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #00D4A8 0%, transparent 60%)' }} />
                    <div className="text-center z-10 px-4">
                      <span className="font-mono text-2xl font-bold text-white tracking-wide">{item.ticker.split(' ')[0]}</span>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <span className="text-lg">{COUNTRY_FLAG[item.country]}</span>
                        <span className="text-xs text-slate-400">{item.shortName}</span>
                      </div>
                    </div>
                    {/* Badge DY */}
                    <div className="absolute top-3 right-3 bg-[#00D4A8]/10 border border-[#00D4A8]/30 rounded-lg px-2 py-1 text-center">
                      <p className="text-[9px] text-[#00D4A8]/80 uppercase tracking-wide leading-none mb-0.5">DY</p>
                      <p className="text-sm font-bold text-[#00D4A8] leading-none">{item.dyAnnual.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    {/* Secteur */}
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 border border-slate-200 rounded-full px-2 py-0.5 self-start mb-2">
                      {item.sector}
                    </span>

                    {/* Titre */}
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 mb-3 group-hover:text-[#00D4A8] transition-colors flex-1">
                      {item.headline}
                    </h3>

                    {/* Métriques clés */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">Dividende</p>
                        <p className="text-xs font-bold text-slate-800">{last.dividend.toLocaleString('fr-FR')} XOF</p>
                        <p className={`text-[9px] font-medium ${divVar >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {divVar >= 0 ? '+' : ''}{divVar.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wide">PER</p>
                        <p className="text-xs font-bold text-slate-800">{item.per.toFixed(1)}x</p>
                        <p className="text-[9px] text-slate-400">valorisation</p>
                      </div>
                    </div>

                    {/* Footer : trend badge + CTA */}
                    <div className="flex items-center justify-between">
                      {item.dividendTrend === 'hausse' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                          <TrendingUp size={9} /> Div. en hausse
                        </span>
                      ) : item.dividendTrend === 'baisse' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <TrendingDown size={9} /> Div. en baisse
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5">
                          Stable
                        </span>
                      )}
                      <span className="text-[10px] text-[#00D4A8] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Analyse <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Indicateur de scroll mobile */}
        <p className="text-center text-xs text-slate-400 mt-3 sm:hidden">← Faites glisser pour voir plus →</p>
      </section>

      {/* <-- AJOUT: Section Témoignages (Social Proof) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Ce que disent nos utilisateurs
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Rejoignez des milliers d'investisseurs qui ont transformé leur avenir financier avec AfriBourse
          </p>

          {/* <-- AJOUT: Bouton "Laisser un avis" */}
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsReviewModalOpen(true)}
            className="inline-flex items-center space-x-2"
          >
            <Star className="w-5 h-5 text-yellow-500" />
            <span>Laisser un avis</span>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} hoverable className="transform hover:-translate-y-1 transition-all duration-300">
              <div className="relative">
                {/* Icône de quote */}
                <div className="absolute -top-4 -left-4 bg-blue-500 text-white rounded-full p-3 shadow-lg">
                  <Quote className="w-6 h-6" />
                </div>

                {/* Étoiles */}
                <div className="flex justify-end mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Commentaire */}
                <p className="text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonial.comment}"
                </p>

                {/* Profil */}
                <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md overflow-hidden">
                    {testimonial.avatar ? (
                      <OptimizedImage src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                    ) : (
                      testimonial.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500 mt-1">{testimonial.country}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* <-- AJOUT: Section FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Questions Fréquentes
          </h2>
          <p className="text-gray-600">
            Tout ce que vous devez savoir pour commencer à investir sur la BRVM
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq) => (
            <Card
              key={faq.id}
              hoverable
              className="cursor-pointer"
              onClick={() => setOpenFaqId(openFaqId === faq.id ? null : faq.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    {faq.question}
                  </h3>

                  {/* Réponse dépliable */}
                  {openFaqId === faq.id && (
                    <p className="text-gray-600 leading-relaxed ml-7 mt-2 animate-fadeIn">
                      {faq.answer}
                    </p>
                  )}
                </div>

                <ChevronRight
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-4 transition-transform duration-300 ${openFaqId === faq.id ? 'rotate-90' : ''
                    }`}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* CTA après FAQ */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Vous avez d'autres questions ?</p>
          <Button variant="outline" onClick={() => navigate('/help')}>
            Consulter notre centre d'aide
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* === Section CTA Final (inchangée) === */}
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
              onClick={() => navigate(isLoggedIn ? '/markets' : '/signup')}
            >
              {isLoggedIn ? 'Commencer à investir' : 'Créer un compte gratuit'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </section>

      {/* <-- AJOUT: Modal pour laisser un avis */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fadeIn">
            {/* Bouton fermer */}
            <button
              onClick={closeReviewModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Titre */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Partagez votre expérience
              </h3>
              <p className="text-gray-600">
                Votre avis nous aide à améliorer nos services
              </p>
            </div>

            {/* Sélection des étoiles */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 text-center">
                Votre note
              </label>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 ${star <= (hoveredStar || reviewRating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  {reviewRating === 1 && 'Décevant'}
                  {reviewRating === 2 && 'Peut mieux faire'}
                  {reviewRating === 3 && 'Correct'}
                  {reviewRating === 4 && 'Très bien'}
                  {reviewRating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Zone de texte */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Votre avis <span className="text-gray-500 font-normal">(max 200 caractères)</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setReviewText(e.target.value);
                  }
                }}
                placeholder="Partagez votre expérience avec AfriBourse..."
                className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {reviewText.length}/200 caractères
                </p>
                {reviewText.length === 200 && (
                  <p className="text-xs text-orange-600 font-medium">
                    Limite atteinte
                  </p>
                )}
              </div>
            </div>

            {/* Message d'erreur */}
            {reviewError && (
              <p className="text-sm text-red-600 text-center -mt-2">{reviewError}</p>
            )}

            {/* Boutons d'action */}
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                onClick={closeReviewModal}
                className="flex-1"
                disabled={reviewSubmitting}
              >
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
    {showInstructions && (
      <InstallInstructions platform={platform} onClose={closeInstructions} />
    )}
    </>
  );
}