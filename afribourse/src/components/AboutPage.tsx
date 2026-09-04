// src/components/AboutPage.tsx
//
// A propos : bandeau navy commun aux pages editoriales, puis des cartes
// blanches au gabarit unique. La charte se limite au navy, a l'orange du logo
// et aux gris ; les emojis des rubriques laissent la place a des icones.
import React, { useEffect, useState } from 'react';
import { Users, Target, Award, TrendingUp, User, Linkedin, Globe, BookOpen, Wallet, Info, ShieldCheck, BarChart3, Newspaper, Trophy } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';
import { Helmet } from 'react-helmet-async';
import PageBanner from './ui/PageBanner';
import { HERO_BACKGROUNDS, HERO_GRID_STYLE } from '../utils/heroBackgrounds';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = 'https://afribourse-api.onrender.com/api/og/image/page/about';

/** Ce qui nous anime : trois promesses, meme gabarit de panneau. */
const PROMISES = [
  {
    title: 'Comprendre sans risque',
    text: "Grâce à notre simulateur de portefeuille, vous apprenez à dompter les fluctuations du marché sans engager un seul franc CFA réel.",
  },
  {
    title: 'Décider avec précision',
    text: "En utilisant des données réelles et des modèles d'analyse robustes, nous transformons la complexité des chiffres en décisions claires.",
  },
  {
    title: 'Devenir acteur',
    text: "Nous croyons fermement que l'éducation financière est la clé de la souveraineté économique individuelle et collective en Afrique.",
  },
];

const VALUES = [
  { icon: Users, title: 'Accessibilité', text: "Rendre l'investissement accessible à tous, quel que soit le niveau d'expérience." },
  { icon: Target, title: 'Éducation', text: 'Fournir des ressources pédagogiques de qualité pour former les investisseurs de demain.' },
  { icon: Award, title: 'Excellence', text: 'Offrir une expérience de qualité avec des données fiables et à jour.' },
  { icon: TrendingUp, title: 'Innovation', text: "Utiliser la technologie pour simplifier l'apprentissage de l'investissement." },
];

const FEATURES = [
  { icon: BookOpen, title: "Modules d'apprentissage", text: "Des cours structurés couvrant les bases de la bourse, l'analyse technique, l'analyse fondamentale et les stratégies d'investissement." },
  { icon: Wallet, title: 'Portefeuille simulé', text: "Pratiquez l'investissement avec de l'argent virtuel sur des données réelles de la BRVM, sans risque financier." },
  { icon: BarChart3, title: 'Données de marché', text: 'Accédez aux cotations, graphiques et informations financières des entreprises cotées à la BRVM.' },
  { icon: Newspaper, title: 'Actualités financières', text: 'Restez informé avec les dernières nouvelles et analyses du marché africain.' },
  { icon: ShieldCheck, title: 'Quiz et évaluations', text: 'Testez vos connaissances avec des quiz interactifs et suivez votre progression.' },
  { icon: Trophy, title: 'Classements', text: "Comparez vos performances avec d'autres utilisateurs et relevez des défis." },
];

const TOP_COUNTRIES = [
  { name: "Côte d'Ivoire", share: 44 },
  { name: 'Sénégal', share: 32 },
  { name: 'Bénin', share: 13 },
];

const AboutPage: React.FC = () => {
  const [userCount, setUserCount] = useState(1074);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/users/count`);
        if (response.data.count) {
          setUserCount(response.data.count + 1000);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du nombre d\'utilisateurs:', error);
        // Garder la valeur par défaut en cas d'erreur
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchUserCount();
  }, []);

  const stats = [
    {
      icon: Users,
      value: isLoadingStats ? '...' : `+${userCount.toLocaleString('fr-FR')}`,
      label: 'Utilisateurs déjà inscrits',
    },
    { icon: BookOpen, value: '16', label: 'Modules de formation' },
    { icon: Wallet, value: '1,25 Mds', label: 'FCFA virtuels investis' },
    { icon: Globe, value: '8', label: "Pays de l'UEMOA" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>À propos d'AfriBourse — Notre Mission pour l'Investissement en Afrique | AfriBourse</title>
        <meta name="description" content="AfriBourse démocratise l'investissement sur la BRVM pour les Africains francophones. Découvrez notre mission, notre équipe et notre impact sur l'éducation financière en Afrique de l'Ouest." />
        <meta name="keywords" content="brvm, afribourse brvm, brvm plateforme, brvm investissement, brvm afrique, afribourse, plateforme brvm, bourse afrique de l'ouest, UEMOA bourse, éducation financière Afrique, investir brvm" />
        <link rel="canonical" href={`${SITE_URL}/about`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="À propos d'AfriBourse — Notre Mission pour l'Investissement en Afrique" />
        <meta property="og:description" content="Démocratiser l'investissement sur la BRVM pour tous les Africains. Découvrez notre mission et notre impact." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content={`${SITE_URL}/about`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@AfriBourse" />
        <meta name="twitter:title" content="À propos d'AfriBourse" />
        <meta name="twitter:description" content="Notre mission : démocratiser l'investissement BRVM pour tous les Africains francophones." />
        <meta name="twitter:image" content={OG_IMAGE} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://africbourse.com/" },
            { "@type": "ListItem", "position": 2, "name": "À propos", "item": "https://africbourse.com/about" }
          ]
        })}</script>
      </Helmet>

      <PageBanner
        icon={Info}
        title="À propos d'AfriBourse"
        subtitle="Votre plateforme d'apprentissage, d'analyse et de simulation pour maîtriser les marchés boursiers africains."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 space-y-6">

        {/* Notre histoire */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Notre histoire : transformer le potentiel en opportunité
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Pendant trop longtemps, le monde de la finance africaine est resté un domaine mystérieux, perçu comme réservé
            à une élite ou aux institutions internationales. Pourtant, au cœur de notre économie, la BRVM (Bourse Régionale
            des Valeurs Mobilières) regorge d'opportunités pour construire un patrimoine et soutenir la croissance de nos
            entreprises locales.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Le constat était simple :{' '}
            <strong className="text-gray-900">
              beaucoup d'Africains souhaitent investir, mais la peur de perdre de l'argent et le manque de formation
              concrète freinent leurs ambitions.
            </strong>
          </p>

          <h3 className="text-lg font-bold text-brand-navy mt-6 mb-2">La naissance d'AfriBourse</h3>
          <p className="text-gray-600 leading-relaxed">
            AfriBourse est née de la volonté de briser ces barrières. Nous avons imaginé un pont entre le désir d'apprendre
            et la réalité du marché, et bâti une plateforme où l'excellence technique se met au service de la simplicité.
          </p>

          <h3 className="text-lg font-bold text-brand-navy mt-6 mb-3">Ce qui nous anime</h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            Nous ne nous contentons pas de donner des cours. Nous créons un environnement sécurisé où chaque utilisateur peut :
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {PROMISES.map(({ title, text }) => (
              <div key={title} className="bg-ink-50 rounded-xl p-4">
                <h4 className="font-bold text-brand-navy mb-1.5">{title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-bold text-brand-navy mt-6 mb-2">Notre vision</h3>
          <p className="text-gray-600 leading-relaxed">
            Faire de chaque citoyen de l'UEMOA un investisseur averti, capable de bâtir son avenir financier avec
            confiance et sérénité. Que vous fassiez vos premiers pas ou que vous cherchiez à affiner vos stratégies,
            AfriBourse est votre partenaire pour naviguer sur les marchés financiers.
          </p>
        </section>

        {/* Chiffres cles : carte blanche, cellules separees par un filet et
            chiffres en mono, comme les listes du reste du site. */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
            Nos chiffres clés
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
            {stats.map(({ icon: Icon, value, label }, i) => (
              <div
                key={label}
                className={`px-4 py-5 text-center ${i < 2 ? 'border-b border-gray-100 lg:border-b-0' : ''}`}
              >
                <span className="inline-flex items-center justify-center w-10 h-10 bg-ink-50 rounded-xl mb-3">
                  <Icon className="w-5 h-5 text-brand-navy" />
                </span>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono tabular-nums leading-none mb-1.5">
                  {value}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 px-5 sm:px-6 py-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Top 3 des pays représentés
            </p>
            <div className="space-y-3.5">
              {TOP_COUNTRIES.map(({ name, share }) => (
                <div key={name} className="flex items-center gap-4">
                  <span className="w-32 sm:w-40 shrink-0 text-sm font-semibold text-gray-900 truncate">
                    {name}
                  </span>
                  <span className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <span className="block h-full bg-brand-navy rounded-full" style={{ width: `${share}%` }} />
                  </span>
                  <span className="w-12 shrink-0 text-right text-sm font-bold text-gray-900 font-mono tabular-nums">
                    {share}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 text-center"
            >
              <span className="inline-flex items-center justify-center w-12 h-12 bg-ink-50 rounded-xl mb-3">
                <Icon className="w-6 h-6 text-brand-navy" />
              </span>
              <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </section>

        {/* Ce que nous offrons */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">Ce que nous offrons</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-9 h-9 rounded-lg bg-ink-50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-brand-navy" />
                  </span>
                  <h3 className="font-bold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* La BRVM */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">La BRVM</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-3">
            La Bourse Régionale des Valeurs Mobilières est le marché boursier de l'Union Économique et
            Monétaire Ouest Africaine. Basée à Abidjan en Côte d'Ivoire, elle dessert huit pays :
            Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal et Togo.
          </p>
          <p className="text-gray-600 leading-relaxed">
            AfriBourse vous permet de vous familiariser avec ce marché dynamique et en pleine croissance,
            en vous offrant les outils nécessaires pour comprendre son fonctionnement et développer
            vos stratégies d'investissement.
          </p>
        </section>

        {/* Equipe */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 text-center">Notre équipe</h2>

          <div className="max-w-sm mx-auto text-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-brand-navy to-[#173F66] flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-white/40" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Curtis Zirignon</h3>
            <p className="text-sm font-semibold text-brand-navy mb-3">Co-fondateur, CEO et actuaire</p>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Spécialiste en modélisation financière, Curtis veille à ce que nos outils d'analyse et de
              simulation reflètent avec précision la réalité mathématique des marchés, pour une expérience
              d'apprentissage rigoureuse.
            </p>
            <a
              href="https://www.linkedin.com/in/curtis-zirignon-097424202/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-brand-navy hover:text-brand-navy transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              Voir le profil LinkedIn
            </a>
          </div>
        </section>

        {/* Appel final */}
        <section
          className="relative overflow-hidden rounded-2xl"
          style={{ backgroundImage: HERO_BACKGROUNDS[0].gradient }}
        >
          <div className="absolute inset-0" style={{ backgroundImage: HERO_BACKGROUNDS[0].halo }} />
          <div className="absolute inset-0 opacity-[0.07]" style={HERO_GRID_STYLE} />

          <div className="relative px-6 py-10 sm:px-10 sm:py-12 text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-3">
              Prêt à commencer votre parcours d'investissement ?
            </h2>
            <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6">
              Rejoignez des milliers d'utilisateurs qui apprennent à investir intelligemment sur la BRVM.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-lg bg-brand-orange text-white text-sm font-semibold shadow-sm hover:bg-brand-orange-hover transition-colors"
              >
                S'inscrire gratuitement
              </Link>
              <Link
                to="/learn"
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-lg border-2 border-white/80 text-white text-sm font-semibold hover:bg-white hover:text-brand-navy transition-colors"
              >
                Découvrir les cours
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
