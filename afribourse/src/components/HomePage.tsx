// src/components/HomePage.tsx - VERSION REFONTE COMPLÈTE
import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/home';
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
  ChevronRight,
  Clock,
  Calendar,
  Star,
  Quote,
  Award,
  Heart,
  MessageCircle,
  Flame,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import { useHomePageData } from '../hooks/useApi';
import { Button, Card, LoadingSpinner, ErrorMessage } from './ui';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, authFetch } from '../config/api';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { InstallInstructions } from './pwa/InstallPrompt';
import { BRVM_NEWS } from '../data/brvm2026News';
import SimulatorCarousel from './SimulatorCarousel';
import SparklineChart from './SparklineChart';

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

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    // Déjà dans le viewport au montage → afficher immédiatement (avant paint), sans flash opacity-0.
    // L'IntersectionObserver ne sert que pour les sections sous la ligne de flottaison (reveal au scroll).
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
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
// Langage de carte de la page d'accueil
//
// Fond blanc, filet gris clair, ombre discrète qui se lève au survol, icônes et
// liens en navy. Il remplace les traitements que chaque section s'était donnés
// au fil du temps — dégradés vert/émeraude, ambre/orange, bleu/indigo, cartes
// rounded-2xl à ombre XL, translation verticale au survol.
//
// Une seule source : modifier une carte ici les modifie toutes.
// ---------------------------------------------------------------------------

/** Carte de base. Compléter par le padding. */
const CARD = 'rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300';

/** À ajouter quand la carte est cliquable. Porte `group` pour CardLink. */
const CARD_CLICKABLE = 'group text-left hover:border-brand-navy/25 hover:shadow-md cursor-pointer';

/** Titre de carte. */
const CARD_TITLE = 'font-bold text-gray-900';

/** Corps de carte. */
const CARD_BODY = 'text-sm text-gray-600 leading-relaxed';

/** Icône de carte. */
const CARD_ICON = 'w-5 h-5 text-brand-navy shrink-0';

/**
 * Lien de fin de carte. Le trait se déploie depuis la gauche au survol de la
 * carte entière — d'où le group-hover, qui suppose un ancêtre portant `group`
 * (CARD_CLICKABLE le fournit). Même geste que les onglets du header.
 */
function CardLink({ label = 'En savoir plus' }: { label?: string }) {
  return (
    <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-navy">
      <span className="relative">
        {label}
        <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-brand-navy transition-transform duration-200 group-hover:scale-x-100" />
      </span>
      <ArrowRight className="w-4 h-4 shrink-0" />
    </span>
  );
}

/** Lien « voir tout » en en-tête de section — même geste que CardLink. */
function SectionLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group inline-flex items-center gap-1 text-sm font-semibold text-brand-navy shrink-0 cursor-pointer"
    >
      <span className="relative">
        {label}
        <span className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-brand-navy transition-transform duration-200 group-hover:scale-x-100" />
      </span>
      <ArrowRight className="w-4 h-4 shrink-0" />
    </button>
  );
}

/**
 * Les trois portes d'entrée, sous le hero. Elles reprennent des promesses déjà
 * faites ailleurs sur la page — modules gratuits, capital virtuel, données
 * BRVM — plutôt que d'en introduire de nouvelles.
 */
const HERO_CARDS: { to: string; icon: React.ElementType; title: string; desc: string }[] = [
  {
    to: '/learn',
    icon: BookOpen,
    title: 'Se former',
    desc: '15+ modules gratuits pour comprendre la BRVM, lire un bilan et bâtir une stratégie.',
  },
  {
    to: '/markets',
    icon: BarChart3,
    title: 'Simuler sans risque',
    desc: "1 000 000 FCFA de capital virtuel pour passer vos premiers ordres sans engager d'argent.",
  },
  {
    to: '/news',
    icon: TrendingUp,
    title: 'Suivre le marché',
    desc: 'Cours, indices et analyses des sociétés cotées, mis à jour au fil des séances.',
  },
];

/**
 * Cluster circulaire du hero : une grande image au centre, 5 valeurs BRVM en orbite.
 * Les positions sont calculées sur un cercle (72° d'écart) en % du conteneur carré,
 * ce qui garde la composition intacte à toutes les tailles.
 */
const ORBIT_STOCKS = [
  { src: '/logos/logo-SNTS.jfif', ticker: 'SNTS', alt: 'Logo Sonatel, action cotée à la BRVM' },
  { src: '/logos/logo-SLBC.png',  ticker: 'SLBC', alt: 'Logo Solibra, action cotée à la BRVM' },
  { src: '/logos/logo-SGBC.jpg',  ticker: 'SGBC', alt: 'Logo Société Générale Côte d’Ivoire, action cotée à la BRVM' },
  { src: '/logos/logo-ORAC.jpg',  ticker: 'ORAC', alt: 'Logo Orange Côte d’Ivoire, action cotée à la BRVM' },
  { src: '/logos/logo-BOAC.png',  ticker: 'BOAC', alt: 'Logo Bank of Africa Côte d’Ivoire, action cotée à la BRVM' },
];

const ORBIT_RADIUS = 37; // rayon de l'orbite, en % de la largeur du conteneur

function HeroImageOrbit() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[440px]">
      {/* Halo diffus derrière le cluster */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(96,165,250,0.35) 0%, rgba(45,212,191,0.12) 45%, transparent 70%)',
        }}
      />

      {/* Anneau d'orbite — rotation lente des pointillés */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        data-orb
        style={{ animation: 'orbitSpin 70s linear infinite' }}
      >
        <circle
          cx="50"
          cy="50"
          r={ORBIT_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.35"
          strokeDasharray="1.6 2.8"
        />
      </svg>

      {/* Centre de l'orbite : le logo AfriBourse, autour duquel gravitent les
          valeurs BRVM. Volontairement plus petit que l'orbite pour laisser un
          espace clair entre lui et les satellites.
          Fond blanc + object-contain, comme les satellites : le logo est
          detoure et cadre carre, object-cover le rognerait.
          Padding progressif : le disque grandit avec l'ecran, un padding fixe
          y laisserait le logo occuper une part croissante de la surface. */}
      <div className="absolute left-1/2 top-1/2 h-[32%] w-[32%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-white p-4 sm:p-5 lg:p-6 shadow-2xl shadow-blue-950/50 ring-[6px] ring-white/25">
        <img
          src="/images/logo_afribourse.png"
          alt="Logo AfriBourse"
          className="h-full w-full object-contain"
          width={440}
          height={440}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Groupe en rotation : carré calé sur le conteneur, il pivote donc
          autour du centre exact de l'orbite. Il emporte les cinq satellites
          d'un bloc, à la même vitesse que l'anneau pointillé — les logos
          restent alignés sur les tirets. */}
      <div
        data-orb
        className="absolute inset-0"
        style={{ animation: 'orbitSpin 70s linear infinite' }}
      >
      {/* Satellites */}
      {ORBIT_STOCKS.map((stock, i) => {
        const angle = ((-90 + i * 72) * Math.PI) / 180;
        return (
          <div
            key={stock.ticker}
            className="absolute h-[20%] w-[20%] -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${50 + ORBIT_RADIUS * Math.cos(angle)}%`,
              top: `${50 + ORBIT_RADIUS * Math.sin(angle)}%`,
            }}
          >
            {/* Wrapper séparé : l'animation pilote le transform sans écraser le centrage */}
            <div
              data-orb
              className="h-full w-full"
              style={{ animation: `orbitFloat 5.5s ease-in-out ${i * 0.55}s infinite alternate` }}
            >
              {/* Contre-rotation : annule exactement celle du groupe, donc le
                  logo reste droit sur tout le tour. Sans elle il basculerait
                  la tête en bas à mi-parcours. */}
              <div
                data-orb
                className="h-full w-full"
                style={{ animation: 'orbitSpinReverse 70s linear infinite' }}
              >
                {/* Fond blanc + object-contain : les logos s'affichent en entier, sans rognage */}
                <div className="relative h-full w-full overflow-hidden rounded-full bg-white p-2 shadow-lg shadow-blue-950/50 ring-2 ring-white/60">
                  <img
                    src={stock.src}
                    alt={stock.alt}
                    className="h-full w-full object-contain"
                    width={120}
                    height={120}
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HomePage
// ---------------------------------------------------------------------------

export default function HomePage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { showInstructions, closeInstructions, platform } = useInstallPrompt();

  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const backgroundImages = [
    '/images/brvm-growth.webp',
    '/images/financial-ratios.webp',
    '/images/sonatel-dividend.webp',
  ];

  const { data, isLoading, error, refetch } = useHomePageData();
  const topStocks = (data?.topStocks || []).slice(0, 2);
  const [sparklines, setSparklines] = useState<Record<string, { time: string; value: number }[]>>({});

  useEffect(() => {
    if (topStocks.length === 0) return;
    topStocks.forEach(stock => {
      fetch(`${API_BASE_URL}/stocks/${encodeURIComponent(stock.symbol)}/history?period=3M`, { credentials: 'include' })
        .then(r => r.ok ? r.json() : null)
        .then(res => {
          if (!res?.data?.length) return;
          const pts = res.data.map((d: { date: string; close: number }) => ({ time: d.date, value: d.close }));
          setSparklines(prev => ({ ...prev, [stock.symbol]: pts }));
        })
        .catch(() => {});
    });
  }, [topStocks.map(s => s.symbol).join(',')]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Actualités — BRVM_NEWS triées par date décroissante (les 4 plus récentes)
  const recentNewsItems = [...BRVM_NEWS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 4);

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

  return (
    <>
      <Helmet>
        <title>AfriBourse — Investissez sur la BRVM, la Bourse d'Afrique de l'Ouest</title>
        <meta name="description" content="AfriBourse — la plateforme BRVM pour apprendre à investir sur les actions brvm. Simulateur gratuit, cours brvm en temps réel, formations et analyses pour la Bourse Régionale des Valeurs Mobilières (UEMOA)." />
        <meta name="keywords" content="brvm, brvm action, brvm bourse, cours brvm, brvm aujourd'hui, brvm composite, investir brvm, bourse brvm, action brvm, brvm abidjan, simulateur bourse Afrique, bourse Afrique de l'Ouest, bourse Côte d'Ivoire, bourse UEMOA, formation investissement BRVM, AfriBourse" />
        <link rel="canonical" href={`${SITE_URL}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="AfriBourse — Investissez sur la BRVM, la Bourse d'Afrique de l'Ouest" />
        <meta property="og:description" content="Apprenez à investir sur la BRVM avec notre simulateur gratuit, nos formations et l'analyse des marchés boursiers d'Afrique de l'Ouest." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="AfriBourse — Investissez sur la BRVM" />
        <meta name="twitter:description" content="Simulateur, formations et analyse des marchés BRVM pour les investisseurs d'Afrique de l'Ouest." />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Qu'est-ce que la BRVM ?",
              "acceptedAnswer": { "@type": "Answer", "text": "La BRVM (Bourse Régionale des Valeurs Mobilières) est la bourse commune des 8 pays de l'UEMOA : Côte d'Ivoire, Sénégal, Burkina Faso, Mali, Niger, Togo, Bénin et Guinée-Bissau. Son siège est à Abidjan." }
            },
            {
              "@type": "Question",
              "name": "Comment investir sur la BRVM depuis l'Afrique de l'Ouest ?",
              "acceptedAnswer": { "@type": "Answer", "text": "Pour investir sur la BRVM, vous devez ouvrir un compte titres auprès d'une SGI (Société de Gestion et d'Intermédiation) agréée. AfriBourse vous propose un simulateur gratuit pour vous entraîner avant de franchir le pas avec de l'argent réel." }
            },
            {
              "@type": "Question",
              "name": "AfriBourse est-il gratuit ?",
              "acceptedAnswer": { "@type": "Answer", "text": "Oui. L'accès au simulateur de portefeuille virtuel, aux modules de formation de base et aux cours de la BRVM est entièrement gratuit. Des fonctionnalités avancées sont disponibles en version premium." }
            }
          ]
        })}</script>
      </Helmet>
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
        @keyframes orbitSpin {
          to { transform: rotate(360deg); }
        }
        /* Contre-rotation des satellites : meme duree et meme courbe que
           orbitSpin, donc parfaitement synchrone. Sans elle les logos
           basculeraient la tete en bas a mi-parcours. */
        @keyframes orbitSpinReverse {
          to { transform: rotate(-360deg); }
        }
        @keyframes orbitFloat {
          from { transform: translateY(-6px); }
          to   { transform: translateY(6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-orb] { animation: none !important; }
        }
      `}</style>

      <div className="pb-16 md:pb-24">

        {/* === Hero === */}
        <section className="relative bg-gradient-to-tr from-blue-700 via-indigo-900 to-gray-900 text-white pt-10 pb-12 md:pt-14 md:pb-16 lg:pt-16 lg:pb-20 overflow-hidden">
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
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">

              {/* --- Accroche (gauche) --- */}
              <div className="text-center lg:text-left">
                {/* Badge d'accroche — masqué
                <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 text-blue-100 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-5">
                  <Award className="w-4 h-4 shrink-0" />
                  <span>N°1 pour maîtriser la Bourse en Afrique de l'Ouest</span>
                </div>
                */}

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.5] tracking-tight mb-4">
                  <span className="block">Formez-vous à la bourse</span>
                  <span className="block mt-1 sm:mt-2">et investissez sur</span>
                  <span className="block mt-1 sm:mt-2">
                    la{' '}
                    <span className="text-brand-orange-light">
                      BRVM
                    </span>
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-indigo-100/90 mb-7 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Formations gratuites et 1 000 000 FCFA de capital virtuel pour vous lancer sans risque.
                </p>

                {/* CTA — toujours sur une seule ligne : libellés courts sous sm */}
                <div className="flex flex-row gap-3 items-center justify-center lg:justify-start">
                  <Button
                    variant="orange"
                    size="md"
                    className="flex-1 sm:flex-none h-12 sm:h-14 gap-2 whitespace-nowrap"
                    onClick={() => navigate('/markets')}
                  >
                    <BarChart3 className="w-5 h-5 shrink-0" />
                    <span className="sm:hidden">{isLoggedIn ? 'Marchés' : 'Commencer'}</span>
                    <span className="hidden sm:inline">
                      {isLoggedIn ? 'Explorer les marchés' : 'Commencer gratuitement'}
                    </span>
                    <ArrowRight className="w-5 h-5 shrink-0 hidden sm:block" />
                  </Button>

                  {/* Contour : le pendant du navyOutline du header, inverse en
                      blanc parce que le hero est sur fond sombre. */}
                  <Button
                    variant="inverseOutline"
                    size="md"
                    className="flex-1 sm:flex-none h-12 sm:h-14 gap-2 whitespace-nowrap"
                    onClick={() => navigate('/learn')}
                  >
                    <BookOpen className="w-5 h-5 shrink-0" />
                    <span className="sm:hidden">Apprendre</span>
                    <span className="hidden sm:inline">Apprendre à investir</span>
                  </Button>

                </div>
              </div>

              {/* --- Cluster d'images (droite) --- */}
              <HeroImageOrbit />

            </div>
          </div>
        </section>

        {/* === Bannière annonce ===
            <button> et non <div> : la bannière entière est cliquable, elle doit
            donc être atteignable au clavier. Le libellé est un <span>, un
            <button> n'accepte pas de contenu de type bloc. */}
        <button
          type="button"
          onClick={() => navigate('/webinaires')}
          className="block w-full bg-[#eef2ff] border-y border-brand-navy/10 cursor-pointer hover:bg-[#e0e7ff] transition-colors duration-150"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-sm">
            <span className="text-indigo-800 font-medium text-center">
              Investir, ça s'apprend : formez-vous avant d'engager votre argent
            </span>
          </div>
        </button>

        {/* === Trois portes d'entrée ===
            Marge réduite (mt-10) : elles prolongent le hero plutôt que d'ouvrir
            une nouvelle section, d'où l'écart plus court que le mt-16 md:mt-24
            qui sépare les sections entre elles. */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-12">
          <div className="grid gap-4 sm:grid-cols-3">
            {HERO_CARDS.map(({ to, icon: Icon, title, desc }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`${CARD} ${CARD_CLICKABLE} px-6 py-5`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={CARD_ICON} />
                  <h2 className={CARD_TITLE}>{title}</h2>
                </div>
                <p className={CARD_BODY}>{desc}</p>
                <CardLink />
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* === Simulateur === */}
        <SimulatorCarousel />

        {/* === Appel à l'action — simulateur ===
            Le carrousel ci-dessus montre le produit mais n'offre aucune sortie :
            ce bandeau porte le clic. Marge courte (mt-6) pour qu'il se lise comme
            le pied du bloc precedent et non comme une section autonome. */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-navy via-[#173F66] to-ink-950 px-7 py-9 md:px-12 md:py-11">
            {/* Halo et trame : decoratifs, sous le contenu et non cliquables. */}
            <div
              className="absolute inset-0 opacity-[0.18] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 88% 15%, #EE7B23 0%, transparent 55%)' }}
            />
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                backgroundSize: '44px 44px',
              }}
            />

            <div className="relative flex flex-col lg:flex-row lg:items-center gap-9 lg:gap-14">
              <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm mb-5">
                  <Wallet className="w-3.5 h-3.5" />
                  Portefeuille virtuel
                </span>

                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                  Ton premier ordre de bourse,{' '}
                  <span className="text-brand-orange-light">sans risquer un franc</span>
                </h2>

                <p className="text-ink-200 leading-relaxed max-w-xl mb-7">
                  Ouvre ton portefeuille simulé en moins d'une minute, achète tes premières
                  actions aux cours réels de la BRVM et suis tes performances jour après jour.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="orange"
                    size="md"
                    className="h-12 gap-2"
                    onClick={() => navigate(isLoggedIn ? '/dashboard' : '/signup')}
                  >
                    <BarChart3 className="w-5 h-5 shrink-0" />
                    {isLoggedIn ? 'Ouvrir mon simulateur' : 'Lancer ma simulation gratuite'}
                    <ArrowRight className="w-5 h-5 shrink-0" />
                  </Button>
                  <button
                    onClick={() => navigate('/markets')}
                    className="h-12 inline-flex items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white ring-1 ring-white/25 transition-colors duration-200 cursor-pointer hover:bg-white/10"
                  >
                    Explorer les 47 actions
                  </button>
                </div>
              </div>

              {/* Trois preuves, en colonne sur mobile, en ligne des sm. */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 lg:w-72 shrink-0">
                {[
                  { icon: Wallet,      value: '1 000 000 FCFA', label: 'de capital virtuel offert' },
                  { icon: TrendingUp,  value: '47 actions',     label: 'aux cours réels de la BRVM' },
                  { icon: ShieldCheck, value: '0 FCFA',         label: 'engagé, aucune carte requise' },
                ].map(({ icon: Icon, value, label }) => (
                  <div
                    key={value}
                    className="flex items-center gap-3 rounded-xl bg-white/[0.07] ring-1 ring-white/15 px-4 py-3.5 backdrop-blur-sm"
                  >
                    <Icon className="w-5 h-5 text-brand-orange-light shrink-0" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white font-mono tracking-tight">{value}</p>
                      <p className="text-xs text-ink-300 leading-snug">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* === Time Machine === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className={`${CARD} px-8 py-10 md:px-12 md:py-12`}>
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
              {/* Icône horloge + timeline */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-brand-navy" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <span className="text-brand-navy font-bold text-lg font-mono tracking-wider">2010</span>
                  <div className="w-px h-6 bg-gray-300" />
                  <span className="text-brand-navy font-bold text-lg font-mono tracking-wider">2025</span>
                </div>
              </div>

              {/* Texte */}
              <div className="flex-1 text-center md:text-left">
                <span className="inline-flex items-center gap-2 bg-brand-navy/10 text-brand-navy text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                  <Clock className="w-3.5 h-3.5" />
                  Machine à remonter le temps
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Investis en 2010, vois ce que ça vaut en 2026
                </h2>
                <p className="text-gray-600 leading-relaxed mb-7 max-w-xl">
                  Rejoue les grands moments de la BRVM avec de l'argent virtuel.
                  Comprends tes erreurs avant de les faire pour de vrai.
                </p>
                <Button
                  variant="orange"
                  size="md"
                  className="h-12 gap-2"
                  onClick={() => navigate('/time-machine')}
                >
                  <Clock className="w-5 h-5 shrink-0" />
                  Remonter le temps
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </Button>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* === Académie === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className={CARD}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 bg-brand-navy/10 text-brand-navy px-3 py-1.5 rounded-full text-xs font-bold mb-4">
                  <BookOpen className="w-4 h-4" />
                  <span>Académie AfriBourse</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Apprenez à investir intelligemment
                </h2>
                <p className="text-gray-600 mb-7 max-w-xl leading-relaxed">
                  Des guides complets, des tutoriels vidéo et des analyses pour maîtriser l'investissement boursier.
                  Apprenez à votre rythme.
                </p>
                <Button
                  variant="orange"
                  size="md"
                  className="h-12 gap-2"
                  onClick={() => navigate(isLoggedIn ? '/learn' : '/signup')}
                >
                  <FileText className="w-5 h-5 shrink-0" />
                  {isLoggedIn ? "Accéder à l'Académie" : 'Créer un Compte Gratuit'}
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </Button>
              </div>

              {/* Les cinq thèmes portaient cinq couleurs différentes. Ce sont des
                  filtres équivalents, rien ne justifiait de les hiérarchiser. */}
              <div className="flex flex-wrap gap-2.5 justify-center md:justify-end w-full md:w-auto md:max-w-xs">
                {['Psychologie', 'Analyse fondamentale', 'Analyse technique', 'Connaissance BRVM', 'Portefeuille'].map(label => (
                  <button
                    key={label}
                    onClick={() => navigate('/learn')}
                    className="text-sm font-semibold px-4 py-2 rounded-full border border-gray-200 text-gray-700 bg-white transition-colors duration-150 cursor-pointer hover:border-brand-navy/25 hover:text-brand-navy"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
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

            <div className="grid md:grid-cols-2 gap-6">
              {topStocks.map((stock, idx) => {
                const isUp = stock.daily_change_percent >= 0;
                const pts = sparklines[stock.symbol] ?? [];

                return (
                  <AnimatedSection key={stock.id} delay={idx * 60}>
                    <div
                      onClick={() => navigate(`/stock/${stock.symbol}`, { state: stock })}
                      className="bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col"
                    >
                      {/* Infos stock */}
                      <div className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center font-bold text-gray-700 text-sm overflow-hidden shadow-sm shrink-0 border border-slate-100">
                              {stock.logo_url
                                ? <OptimizedImage src={stock.logo_url} alt={stock.symbol} className="w-full h-full object-cover" />
                                : stock.symbol.substring(0, 2)
                              }
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-lg leading-none">{stock.symbol}</p>
                              <p className="text-sm text-slate-400 mt-1 truncate max-w-[200px]">{stock.company_name}</p>
                              {stock.sector && <p className="text-xs text-blue-500 mt-0.5 font-medium">{stock.sector}</p>}
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {isUp ? '+' : ''}{stock.daily_change_percent?.toFixed(2) ?? '0.00'}%
                          </div>
                        </div>

                        <p className="text-4xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                          {formatNumber(stock.current_price)}
                          <span className="text-base font-semibold text-slate-400 ml-2">FCFA</span>
                        </p>
                      </div>

                      {/* Graphique */}
                      <div className="border-t border-slate-50">
                        {pts.length >= 2 ? (
                          <SparklineChart data={pts} isUp={isUp} height={200} />
                        ) : (
                          <div className="h-[200px] flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-400 animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </AnimatedSection>
                );
              })}
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

        {/* === Actualités du Jour — BRVM_NEWS triées par date === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-brand-navy animate-pulse" />
                <span className="text-xs font-semibold text-brand-navy uppercase tracking-widest">En direct</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-navy">Actualités du Jour</h2>
              <p className="text-gray-600 mt-1">Les dernières actualités des marchés financiers africains</p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/news')}>
              Voir tout <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Bento : 2 grandes cartes a gauche, 2 cartes empilees a droite.
              Hauteur fixe en desktop pour que la colonne de droite se partage
              exactement en deux rangees. */}
          <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-5 md:h-[470px]">
            {recentNewsItems.map((article, idx) => {
              const isTall = idx < 2;

              const formatDate = (dateStr: string) => {
                const d = new Date(dateStr).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                });
                return d.charAt(0).toUpperCase() + d.slice(1);
              };

              return (
                <article
                  key={article.id}
                  onClick={() => navigate('/news')}
                  className={`group relative overflow-hidden rounded-2xl cursor-pointer bg-brand-navy ring-1 ring-ink-200/60 shadow-sm hover:shadow-xl transition-shadow duration-300 h-56 md:h-auto ${isTall ? 'md:row-span-2' : ''}`}
                >
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-navy to-ink-950">
                      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 70% 40%, #1B4E7D 0%, transparent 60%)' }} />
                    </div>
                  )}

                  {/* Voile sombre : garantit le contraste du texte quelle que
                      soit la luminosite de l'image. */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-brand-navy text-white shadow-sm mb-2">
                      {article.category}
                    </span>
                    <h3 className={`font-bold text-white leading-snug line-clamp-2 group-hover:text-ink-300 transition-colors duration-200 ${isTall ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                      {article.title}
                    </h3>
                    {isTall && (
                      <p className="text-xs text-white/70 line-clamp-2 mt-1.5 leading-relaxed">
                        {article.summary}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-white/80">
                      <Calendar size={13} />
                      {formatDate(article.publishedAt)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </AnimatedSection>

        {/* === Témoignages — bloc masqué ===
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
        */}

        {/* === FAQ === */}
        <AnimatedSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Questions Fréquentes</h2>
            <p className="text-gray-600">
              Tout ce que vous devez savoir pour commencer à investir sur la BRVM : le montant
              minimum pour se lancer, le coût réel de nos formations, l'accès depuis l'étranger
              et le suivi de votre portefeuille au quotidien.
            </p>
          </div>

          <div className="space-y-3">
            {faqData.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`bg-white border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${isOpen ? 'border-brand-navy/40 shadow-md shadow-brand-navy/10' : 'border-gray-200 hover:border-brand-navy/25 hover:shadow-sm'}`}
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                >
                  <div className="flex justify-between items-center px-6 py-5">
                    <h3 className="font-bold text-gray-900 pr-4">
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
                    <p className="text-gray-600 leading-relaxed px-6 pb-5">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-8">
            {/* Meme gabarit que les CTA du hero : size md + hauteur fixe h-12/h-14.
                L'espacement vient de gap-2, plus de marge sur l'icone. */}
            <Button
              variant="navy"
              size="md"
              className="h-12 sm:h-14 gap-2"
              onClick={() => navigate('/help')}
            >
              Consulter notre centre d'aide
              <ArrowRight className="w-5 h-5 shrink-0" />
            </Button>
          </div>
        </AnimatedSection>

        {/* === CTA Final === */}
        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
          <Card variant="elevated" className="bg-brand-navy text-white text-center">
            <div className="py-12 px-6">
              <h2 className="text-2xl font-bold mb-4">
                Prêt à commencer votre voyage d'investissement ?
              </h2>
              {/* Pyramide descendante : 103 / 71 / 42 caracteres. Les coupures
                  sont explicites et tombent sur des articulations de la phrase
                  (fin de proposition, puis avant le complement de but).
                  Elles ne s'activent qu'a partir de lg : en dessous, la largeur
                  disponible est insuffisante pour la premiere ligne, qui se
                  renverrait d'elle-meme et casserait la forme. */}
              <p className="text-white/80 mb-8 max-w-4xl mx-auto">
                Rejoignez des milliers d'investisseurs qui font confiance à AfriBourse pour développer leur patrimoine.
                <br className="hidden lg:inline" />
                Profitez de l'ensemble de nos formations de base et d'un tableau de bord
                <br className="hidden lg:inline" />
                pour suivre vos performances en temps réel.
              </p>
              <Button
                variant="inverse"
                size="md"
                className="h-12 sm:h-14 gap-2"
                onClick={() => navigate(isLoggedIn ? '/markets' : '/signup')}
              >
                {isLoggedIn ? 'Commencer à investir' : 'Créer un compte gratuit'}
                <ArrowRight className="w-5 h-5 shrink-0" />
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
