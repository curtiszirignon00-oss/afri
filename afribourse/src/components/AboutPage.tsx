import React from 'react';
import { Users, Target, Award, TrendingUp } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl font-bold mb-6">À propos d'AfriBourse</h1>
          <p className="text-xl text-blue-100 max-w-3xl">
            Votre plateforme d'apprentissage, d'analyse et de simulation pour maîtriser les marchés boursiers africains
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            AfriBourse a pour mission de démocratiser l'accès à l'éducation financière et aux marchés boursiers en Afrique.
            Nous croyons que chacun devrait avoir la possibilité de comprendre et de participer aux marchés financiers,
            en particulier à la Bourse Régionale des Valeurs Mobilières (BRVM).
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Notre plateforme combine apprentissage théorique, pratique en environnement simulé et accès aux données
            en temps réel pour vous permettre de développer vos compétences en investissement sans risque financier.
          </p>
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
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-8">
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
