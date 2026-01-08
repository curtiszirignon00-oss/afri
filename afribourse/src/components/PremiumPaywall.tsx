import { useState } from 'react';
import { X, Zap, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PremiumPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  plan?: 'investisseur-plus' | 'pro';
}

export default function PremiumPaywall({ isOpen, onClose, feature, plan = 'investisseur-plus' }: PremiumPaywallProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const planDetails = plan === 'pro' ? {
    name: 'Pro',
    price: '300 000 XOF',
    period: '/ mois',
    icon: Crown,
    iconColor: 'text-purple-500',
    buttonColor: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700',
    features: [
      'Tout du plan Investisseur+',
      'Accès API complet',
      'Rapports sectoriels exclusifs',
      'Webinaires mensuels',
      'Support prioritaire',
    ],
  } : {
    name: 'Investisseur+',
    price: '9 900 XOF',
    period: '/ mois',
    icon: Zap,
    iconColor: 'text-yellow-500',
    buttonColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
    features: [
      'Données en temps réel',
      'Coach IA illimité',
      'Alertes personnalisées',
      'Screener avancé',
      'Export CSV',
      'Sans publicité',
    ],
  };

  const Icon = planDetails.icon;

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/subscriptions' } });
      return;
    }

    setIsProcessing(true);

    // Envoyer les données au backend pour tracking
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/subscriptions/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          planId: plan,
          planName: planDetails.name,
          price: planDetails.price,
          userId: user.id,
          feature: feature,
          source: 'paywall',
        }),
      });

      if (!response.ok) {
        console.error('Erreur lors du tracking d\'intention');
      }

      // Le chargement infini - on ne désactive jamais isProcessing
      // L'utilisateur va penser qu'il y a un bug
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all">
          {/* Close Button */}
          {!isProcessing && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}

          {/* Icon and Title */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-4 rounded-full">
                <Sparkles className="w-12 h-12 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Fonctionnalité Premium
            </h2>
            <p className="text-gray-600">
              {feature}. Passez à <span className="font-semibold">{planDetails.name}</span> pour y accéder.
            </p>
          </div>

          {/* Plan Card */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 mb-6">
            <div className="flex items-center mb-4">
              <Icon className={`w-8 h-8 ${planDetails.iconColor}`} />
              <div className="ml-3">
                <h3 className="text-xl font-bold text-gray-900">{planDetails.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold text-gray-900">{planDetails.price.split(' ')[0]}</span>
                  <span className="ml-1 text-gray-600 text-sm">{planDetails.price.split(' ')[1]}</span>
                  <span className="ml-1 text-gray-500 text-sm">{planDetails.period}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {planDetails.features.map((item, index) => (
                <li key={index} className="flex items-center text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className={`w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 ${planDetails.buttonColor} ${
                isProcessing ? 'opacity-70 cursor-wait' : ''
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Traitement en cours...
                </div>
              ) : (
                `Passer à ${planDetails.name}`
              )}
            </button>

            <button
              onClick={() => navigate('/subscriptions')}
              disabled={isProcessing}
              className="w-full py-3 px-6 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Voir tous les plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
