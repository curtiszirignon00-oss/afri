import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useAnalytics, ACTION_TYPES } from '../hooks/useAnalytics';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: typeof Check;
  iconColor: string;
  buttonText: string;
  buttonColor: string;
  features: PlanFeature[];
  popular?: boolean;
}

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { trackAction } = useAnalytics();

  // Track la visite de la page pricing
  useEffect(() => {
    trackAction(ACTION_TYPES.VIEW_PRICING, 'Visite de la page pricing', {
      userLoggedIn: !!userProfile,
      userEmail: userProfile?.email || 'anonymous'
    });
  }, [trackAction, userProfile]);

  const plans: Plan[] = [
    {
      id: 'essentiel',
      name: 'Essentiel',
      price: 'Gratuit',
      period: '',
      description: 'Pour découvrir la bourse et apprendre les bases',
      icon: Check,
      iconColor: 'text-green-500',
      buttonText: 'Plan actuel',
      buttonColor: 'bg-gray-300 text-gray-700 cursor-not-allowed',
      features: [
        { text: 'Accès illimité à la section "Apprendre"', included: true },
        { text: 'Toutes les Actualités & Analyses', included: true },
        { text: 'Données de marché (délai 15-30 min)', included: true },
        { text: 'Fiches d\'entreprises basiques', included: true },
        { text: '1 Portefeuille Virtuel (1M FCFA)', included: true },
        { text: 'Données en temps réel', included: false },
        { text: 'Coach IA', included: false },
        { text: 'Alertes personnalisées', included: false },
        { text: 'Screener avancé', included: false },
        { text: 'Export de données CSV', included: false },
      ],
    },
    {
      id: 'investisseur-plus',
      name: 'Investisseur+',
      price: '9 900',
      period: '/ mois',
      description: 'Pour les passionnés qui veulent analyser et réagir vite',
      icon: Zap,
      iconColor: 'text-yellow-500',
      buttonText: 'Passer à Investisseur+',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white',
      popular: true,
      features: [
        { text: 'Tout du plan Essentiel', included: true },
        { text: '🌟 Données de marché en Temps Réel', included: true },
        { text: '🌟 Fiches d\'Analyse Complètes', included: true },
        { text: '🌟 Screener d\'Actions Avancé', included: true },
        { text: '🌟 Alertes Personnalisées', included: true },
        { text: '🌟 5 Portefeuilles Virtuels Illimités', included: true },
        { text: '🌟 Export de données CSV', included: true },
        { text: '🌟 Expérience sans publicité', included: true },
        { text: '🌟 Accès à l\'IA pour analyse des actions', included: true },
        { text: '🌟 Coach IA illimité', included: true },
        { text: '🌟 Réponses illimitées aux quiz', included: true },
        { text: '🌟 Audio dans les formations', included: true },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '300 000',
      period: '/ mois',
      description: 'Pour les professionnels et institutions',
      icon: Crown,
      iconColor: 'text-purple-500',
      buttonText: 'Passer à Pro',
      buttonColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white',
      features: [
        { text: 'Tout du plan Investisseur+', included: true },
        { text: '💎 Accès API complet', included: true },
        { text: '💎 Rapports d\'Analyse Sectoriels Exclusifs', included: true },
        { text: '💎 Webinaires Mensuels avec Experts', included: true },
        { text: '💎 Données Fondamentales Détaillées (10 ans)', included: true },
        { text: '💎 Compte Multi-Utilisateurs (3 accès)', included: true },
        { text: '💎 Support Prioritaire', included: true },
      ],
    },
  ];

  const handleSubscribe = (planId: string, planName: string, price: string) => {
    if (!userProfile) {
      navigate('/login', { state: { from: '/subscriptions' } });
      return;
    }

    if (planId === 'essentiel') return;

    // Track le clic sur le bouton d'abonnement
    trackAction(ACTION_TYPES.START_CHECKOUT, 'Début du processus d\'abonnement', {
      planId,
      planName,
      price,
      userEmail: userProfile.email
    });

    // Rediriger vers la page de paiement avec les informations du plan
    navigate('/checkout', {
      state: {
        planId,
        planName,
        price,
        source: 'subscriptions_page'
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Investissez dans votre futur financier avec AfriBourse
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-yellow-400' : ''
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    ⭐ POPULAIRE
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="flex items-center mb-4">
                    <Icon className={`w-10 h-10 ${plan.iconColor}`} />
                    <h3 className="ml-3 text-2xl font-bold text-gray-900">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 'Gratuit' ? (
                      <div className="text-4xl font-bold text-gray-900">{plan.price}</div>
                    ) : (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                        <span className="ml-2 text-gray-600">XOF</span>
                        <span className="ml-1 text-gray-500">{plan.period}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-6 h-12">{plan.description}</p>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id, plan.name, plan.price)}
                    disabled={plan.id === 'essentiel'}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 mb-8 ${plan.buttonColor}`}
                  >
                    {plan.buttonText}
                  </button>

                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-5 h-5 mr-3 flex-shrink-0">
                            <div className="w-4 h-4 border-2 border-gray-300 rounded-full mt-0.5"></div>
                          </div>
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? 'text-gray-700' : 'text-gray-400'
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ or additional info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Puis-je changer de plan à tout moment ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez passer d'un plan à un autre à tout moment. Les changements prennent effet immédiatement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Les données en temps réel sont-elles vraiment instantanées ?
              </h3>
              <p className="text-gray-600">
                Oui, avec Investisseur+ et Pro, vous accédez aux cotations avec un délai de quelques secondes seulement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Le plan Pro est-il adapté aux institutions ?
              </h3>
              <p className="text-gray-600">
                Absolument. Le plan Pro offre un accès API complet, des rapports exclusifs et un support prioritaire, idéal pour les professionnels et institutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
