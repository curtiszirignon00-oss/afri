import React, { useEffect, useState } from 'react';
import { Users, Target, Award, TrendingUp, User, Linkedin, Globe, BookOpen, Wallet } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://africbourse.com';
const OG_IMAGE = `${SITE_URL}/images/logo_afribourse.png`;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Helmet>
        <title>À propos d'AfriBourse — Notre Mission pour l'Investissement en Afrique | AfriBourse</title>
        <meta name="description" content="AfriBourse démocratise l'investissement sur la BRVM pour les Africains francophones. Découvrez notre mission, notre équipe et notre impact sur l'éducation financière en Afrique de l'Ouest." />
        <meta name="keywords" content="AfriBourse mission, plateforme investissement BRVM, éducation financière Afrique, bourse Afrique de l'Ouest, UEMOA investissement" />
        <link rel="canonical" href={`${SITE_URL}/about`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AfriBourse" />
        <meta property="og:title" content="À propos d'AfriBourse — Notre Mission pour l'Investissement en Afrique" />
        <meta property="og:description" content="Démocratiser l'investissement sur la BRVM pour tous les Africains. Découvrez notre mission et notre impact." />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-6">À propos d'AfriBourse</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Votre plateforme d'apprentissage, d'analyse et de simulation pour maîtriser les marchés boursiers africains
          </p>
        </div>
      </div>

      {/* Notre Histoire */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Histoire : Transformer le potentiel en opportunité</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Pendant trop longtemps, le monde de la finance africaine est resté un domaine mystérieux, perçu comme réservé
            à une élite ou aux institutions internationales. Pourtant, au cœur de notre économie, la BRVM (Bourse Régionale
            des Valeurs Mobilières) regorge d'opportunités pour construire un patrimoine et soutenir la croissance de nos
            entreprises locales.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            Le constat était simple : <strong>Beaucoup d'Africains souhaitent investir, mais la peur de perdre de l'argent
            et le manque de formation concrète freinent leurs ambitions.</strong>
          </p>

          <h3 className="text-2xl font-bold text-blue-600 mb-4">La naissance d'AfriBourse</h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-6">
            AfriBourse est née de la volonté de briser ces barrières. Nous avons imaginé un pont entre le désir d'apprendre
            et la réalité du marché. Nous avons bâti une plateforme où l'excellence technique se met au service de la simplicité.
          </p>

          <h3 className="text-2xl font-bold text-blue-600 mb-4">Ce qui nous anime</h3>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Nous ne nous contentons pas de donner des cours. Nous créons un environnement sécurisé où chaque utilisateur peut :
          </p>
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Comprendre sans risque</h4>
              <p className="text-gray-700">
                Grâce à notre simulateur de portefeuille, vous apprenez à dompter les fluctuations du marché sans
                engager un seul franc CFA réel.
              </p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-600 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Décider avec précision</h4>
              <p className="text-gray-700">
                En utilisant des données réelles et des modèles d'analyse robustes, nous transformons la complexité
                des chiffres en décisions claires.
              </p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
              <h4 className="font-bold text-gray-900 mb-2">Devenir acteur</h4>
              <p className="text-gray-700">
                Nous croyons fermement que l'éducation financière est la clé de la souveraineté économique individuelle
                et collective en Afrique.
              </p>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-blue-600 mb-4">Notre Vision</h3>
          <p className="text-lg text-gray-700 leading-relaxed">
            Faire de chaque citoyen de l'UEMOA un investisseur averti, capable de bâtir son avenir financier avec
            confiance et sérénité. Que vous fassiez vos premiers pas ou que vous cherchiez à affiner vos stratégies,
            AfriBourse est votre partenaire de confiance pour naviguer sur les marchés financiers.
          </p>
        </div>

        {/* Chiffres Clés Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 md:p-12 mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Nos Chiffres Clés</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Utilisateurs inscrits */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                {isLoadingStats ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  `+${userCount.toLocaleString('fr-FR')}`
                )}
              </div>
              <p className="text-blue-100 font-medium">Utilisateurs déjà inscrits</p>
            </div>

            {/* Modules de formation */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">16</div>
              <p className="text-blue-100 font-medium">Modules de formation</p>
            </div>

            {/* Montant investi (virtuel) */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">1,25 Mds</div>
              <p className="text-blue-100 font-medium">FCFA virtuels investis</p>
            </div>

            {/* Pays représentés */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">8</div>
              <p className="text-blue-100 font-medium">Pays de l'UEMOA</p>
            </div>
          </div>

          {/* Top 3 des pays */}
          <div className="mt-10 pt-8 border-t border-white/20">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Top 3 des pays représentés</h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Côte d'Ivoire */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">🇨🇮 Côte d'Ivoire</span>
                  <span className="text-white font-bold">44%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-2" style={{ width: '44%' }}></div>
                </div>
              </div>

              {/* Sénégal */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">🇸🇳 Sénégal</span>
                  <span className="text-white font-bold">32%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-2" style={{ width: '32%' }}></div>
                </div>
              </div>

              {/* Bénin */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold">🇧🇯 Bénin</span>
                  <span className="text-white font-bold">13%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white rounded-full h-2" style={{ width: '13%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Accessibilité</h3>
            <p className="text-gray-600">
              Rendre l'investissement accessible à tous, quel que soit le niveau d'expérience
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Éducation</h3>
            <p className="text-gray-600">
              Fournir des ressources pédagogiques de qualité pour former les investisseurs de demain
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
            <p className="text-gray-600">
              Offrir une expérience de qualité avec des données fiables et à jour
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600">
              Utiliser la technologie pour simplifier l'apprentissage de l'investissement
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ce que nous offrons</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-3">📚 Modules d'apprentissage</h3>
              <p className="text-gray-700">
                Des cours structurés couvrant les bases de la bourse, l'analyse technique,
                l'analyse fondamentale et les stratégies d'investissement.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-3">💼 Portefeuille simulé</h3>
              <p className="text-gray-700">
                Pratiquez l'investissement avec de l'argent virtuel sur des données réelles de la BRVM
                sans risque financier.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-3">📊 Données en temps réel</h3>
              <p className="text-gray-700">
                Accédez aux cotations, graphiques et informations financières des entreprises
                cotées à la BRVM.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-3">📰 Actualités financières</h3>
              <p className="text-gray-700">
                Restez informé avec les dernières nouvelles et analyses du marché africain.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-3">🎯 Quiz et évaluations</h3>
              <p className="text-gray-700">
                Testez vos connaissances avec des quiz interactifs et suivez votre progression.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-blue-600 mb-3">🏆 Classements</h3>
              <p className="text-gray-700">
                Comparez vos performances avec d'autres utilisateurs et relevez des défis.
              </p>
            </div>
          </div>
        </div>

        {/* About BRVM Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">La BRVM</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            La Bourse Régionale des Valeurs Mobilières (BRVM) est le marché boursier de l'Union Économique et
            Monétaire Ouest Africaine (UEMOA). Basée à Abidjan en Côte d'Ivoire, elle dessert huit pays :
            Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal et Togo.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            AfriBourse vous permet de vous familiariser avec ce marché dynamique et en pleine croissance,
            en vous offrant les outils nécessaires pour comprendre son fonctionnement et développer
            vos stratégies d'investissement.
          </p>
        </div>

        {/* Notre Équipe Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Notre Équipe</h2>

          <div className="flex justify-center">
            <div className="max-w-sm">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg overflow-hidden shadow-md mb-6">
                {/* Espace pour la photo */}
                <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-blue-200 to-indigo-200">
                  <User className="h-32 w-32 text-blue-600 opacity-50" />
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Curtis Zirignon</h3>
                <p className="text-blue-600 font-semibold mb-4">Co-fondateur / CEO / Actuaire</p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Spécialiste en modélisation financière, Curtis veille à ce que nos outils d'analyse et de
                  simulation reflètent avec précision la réalité mathématique des marchés pour une expérience
                  d'apprentissage rigoureuse.
                </p>
                <a
                  href="https://www.linkedin.com/in/curtis-zirignon-097424202/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors text-sm"
                >
                  <Linkedin className="h-4 w-4" />
                  <span>Voir le profil LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à commencer votre parcours d'investissement ?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des milliers d'utilisateurs qui apprennent à investir intelligemment
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="/signup"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              S'inscrire gratuitement
            </a>
            <a
              href="/learn"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              Découvrir les cours
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
