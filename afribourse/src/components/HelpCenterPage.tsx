import React, { useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Rocket,
  TrendingUp,
  BookOpen,
  Building,
  Lightbulb,
  Shield,
  Mail,
  BookMarked,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  icon: React.ReactNode;
  title: string;
  items: FAQItem[];
}

const HelpCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState('');

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const faqCategories: FAQCategory[] = [
    {
      icon: <Rocket className="h-6 w-6" />,
      title: "Premiers Pas (Onboarding)",
      items: [
        {
          question: "Comment créer un compte sur AfriBourse ?",
          answer: "Cliquez sur le bouton \"S'inscrire\" en haut à droite. Remplissez votre nom, email et choisissez un mot de passe. Vous recevrez un lien de confirmation par email pour activer votre accès."
        },
        {
          question: "Est-ce que l'inscription est vraiment gratuite ?",
          answer: "Oui, l'accès à nos modules d'apprentissage et à notre simulateur de portefeuille est 100% gratuit. Notre mission est de démocratiser l'éducation financière."
        },
        {
          question: "Par quoi dois-je commencer pour apprendre ?",
          answer: "Nous vous recommandons de débuter par le module \"Introduction à la BRVM\" dans l'onglet Apprendre. Cela vous donnera les bases nécessaires avant de passer votre premier ordre virtuel."
        }
      ]
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Le Simulateur de Portefeuille",
      items: [
        {
          question: "D'où viennent les 10 000 000 FCFA sur mon compte ?",
          answer: "Il s'agit d'un capital virtuel offert à chaque nouvel inscrit. Cet argent n'a pas de valeur réelle, il sert uniquement à vous entraîner dans des conditions de marché réelles sans aucun risque financier."
        },
        {
          question: "Pourquoi mon ordre est-il marqué \"En attente\" ?",
          answer: "Les ordres sur le simulateur suivent les horaires réels de la BRVM. Si vous passez un ordre le soir ou le week-end, il restera en attente jusqu'à l'ouverture du marché le jour ouvré suivant."
        },
        {
          question: "Les cours des actions sont-ils réels ?",
          answer: "Oui. Nous utilisons les données officielles de la BRVM. Il peut y avoir un léger différé selon les flux, mais les prix reflètent la réalité du marché pour une immersion totale."
        },
        {
          question: "Puis-je retirer l'argent gagné sur le simulateur ?",
          answer: "Non. Les gains (et les pertes) sont virtuels. Le but est de tester vos stratégies avant de faire le saut vers l'investissement réel avec une SGI."
        }
      ]
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Cours et Formations",
      items: [
        {
          question: "Comment accéder aux modules d'apprentissage ?",
          answer: "Rendez-vous dans la section Apprendre. Les cours sont classés par niveau : Débutant, Intermédiaire et Avancé."
        },
        {
          question: "Puis-je suivre les cours à mon rythme ?",
          answer: "Absolument. Votre progression est enregistrée automatiquement. Vous pouvez reprendre une leçon là où vous l'avez arrêtée, sur mobile ou ordinateur."
        }
      ]
    },
    {
      icon: <Building className="h-6 w-6" />,
      title: "Questions sur la BRVM & Marchés",
      items: [
        {
          question: "Quels sont les horaires de cotation de la BRVM ?",
          answer: "Le marché est ouvert du lundi au vendredi, de 9h00 à 15h00 (GMT)."
        },
        {
          question: "AfriBourse est-il une SGI (Société de Gestion et d'Intermédiation) ?",
          answer: "Non. AfriBourse est une plateforme purement éducative. Nous ne sommes pas des courtiers et nous ne manipulons pas d'argent réel. Pour investir réellement, vous devez ouvrir un compte titres auprès d'une SGI agréée."
        }
      ]
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Mon Compte et Sécurité",
      items: [
        {
          question: "Comment réinitialiser mon mot de passe ?",
          answer: "Cliquez sur \"Connexion\" puis sur \"Mot de passe oublié\". Vous recevrez un lien de réinitialisation par email."
        },
        {
          question: "Mes données sont-elles protégées ?",
          answer: "Oui, nous respectons la confidentialité de vos informations. Aucune donnée n'est partagée avec des tiers sans votre consentement."
        }
      ]
    }
  ];

  // Filtrer les FAQ selon la recherche
  const filteredCategories = searchQuery
    ? faqCategories.map(category => ({
        ...category,
        items: category.items.filter(
          item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.items.length > 0)
    : faqCategories;

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (userQuestion.trim()) {
      // Rediriger vers la page de contact avec la question pré-remplie
      navigate('/contact', { state: { prefilledMessage: userQuestion } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Centre d'Aide AfriBourse</h1>
            <p className="text-xl text-blue-100 mb-8">
              Tout ce qu'il faut savoir pour maîtriser la bourse et notre simulateur.
            </p>

            {/* Barre de recherche */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Comment pouvons-nous vous aider ?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {filteredCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Category Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 text-blue-600">
                    {category.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                </div>
              </div>

              {/* FAQ Items */}
              <div className="divide-y divide-gray-200">
                {category.items.map((item, itemIndex) => {
                  const accordionId = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openAccordion === accordionId;

                  return (
                    <div key={itemIndex} className="border-b border-gray-100 last:border-b-0">
                      <button
                        onClick={() => toggleAccordion(accordionId)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                      >
                        <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors pr-4">
                          {item.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 leading-relaxed bg-blue-50/30">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Question spécifique */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-xl p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="h-8 w-8" />
            <h2 className="text-2xl font-bold">Vous avez une question spécifique ?</h2>
          </div>
          <p className="mb-6 text-blue-100">
            Vous ne trouvez pas la réponse ? Posez votre question à nos experts et à la communauté.
          </p>
          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            <textarea
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="Tapez votre question ici..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="w-full sm:w-auto bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <Send className="h-5 w-5" />
              Envoyer ma question
            </button>
          </form>
        </div>

        {/* Glossaire et Contact */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Glossaire */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <BookMarked className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Terminologie Boursière</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Besoin de comprendre un terme technique (Dividende, Capitalisation, Volatilité...) ?
            </p>
            <button
              onClick={() => navigate('/glossary')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
            >
              Consulter le Glossaire complet
            </button>
          </div>

          {/* Contact Support */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Besoin d'aide ?</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Notre équipe support est disponible pour vous accompagner dans votre parcours.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-md"
            >
              Contacter le Support AfriBourse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
