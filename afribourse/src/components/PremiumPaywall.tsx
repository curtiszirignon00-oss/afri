import { X, Zap, Crown, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PremiumWaitlist from './PremiumWaitlist';
import { FORMATION_PRICE_LABEL, FORMATION_PREMIUM_RANGE, FORMATION_PREMIUM_COUNT } from '../config/formation';

interface PremiumPaywallProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  plan?: 'investisseur-plus' | 'pro' | 'premium-modules';
}

// Deux cas :
// - premium-modules (Formation Complète, voir config/formation.ts) : achat unique disponible → page de paiement /formation
// - investisseur-plus / pro (abonnement) : indisponible pour le moment → liste d'attente
export default function PremiumPaywall({ isOpen, onClose, feature, plan = 'investisseur-plus' }: PremiumPaywallProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const isFormation = plan === 'premium-modules';

  const planDetails = isFormation ? {
    name: 'Formation Complète',
    price: FORMATION_PRICE_LABEL,
    period: '— accès à vie',
    icon: Crown,
    iconColor: 'text-amber-500',
    features: [
      `${FORMATION_PREMIUM_COUNT} modules avancés (${FORMATION_PREMIUM_RANGE}) débloqués à vie`,
      'Tous les quiz inclus',
      'Analyse fondamentale, valorisation, analyse technique',
      'Gestion du risque & stratégie de portefeuille',
      'Paiement unique — aucun abonnement',
    ],
  } : {
    name: plan === 'pro' ? 'Pro' : 'Investisseur+',
    icon: Zap,
    iconColor: 'text-yellow-500',
    features: [
      'Coach IA illimité',
      'Données en temps réel',
      'Alertes personnalisées',
      'Screener avancé',
      'Certificats téléchargeables',
    ],
  };

  const Icon = planDetails.icon;

  const goToFormation = () => {
    onClose();
    navigate('/formation');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 transform transition-all">
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Icon and Title */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-4 rounded-full">
                {isFormation
                  ? <Sparkles className="w-12 h-12 text-yellow-600" />
                  : <Clock className="w-12 h-12 text-orange-600" />}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isFormation ? 'Fonctionnalité Premium' : 'L’abonnement Premium revient bientôt'}
            </h2>
            <p className="text-gray-600">
              {isFormation ? (
                <>{feature}. Débloquez la <span className="font-semibold">{planDetails.name}</span> pour y accéder.</>
              ) : (
                <>{feature}. L’abonnement <span className="font-semibold">{planDetails.name}</span> est momentanément indisponible : inscrivez-vous à la liste d’attente pour être prévenu(e) de son retour.</>
              )}
            </p>
          </div>

          {/* Plan Card */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-5 mb-6">
            <div className="flex items-center mb-4">
              <Icon className={`w-8 h-8 ${planDetails.iconColor}`} />
              <div className="ml-3">
                <h3 className="text-xl font-bold text-gray-900">{planDetails.name}</h3>
                {'price' in planDetails ? (
                  <div className="flex items-baseline flex-wrap gap-1">
                    <span className="text-2xl font-bold text-gray-900">{planDetails.price}</span>
                    <span className="text-gray-500 text-sm">{planDetails.period}</span>
                  </div>
                ) : (
                  <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    Bientôt de retour
                  </span>
                )}
              </div>
            </div>

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
            {isFormation ? (
              <button
                onClick={goToFormation}
                className="w-full py-3 px-6 rounded-lg text-white font-semibold transition-all duration-300 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                Débloquer la {planDetails.name}
              </button>
            ) : (
              <PremiumWaitlist feature={feature} />
            )}

            <button
              onClick={onClose}
              className="w-full py-3 px-6 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-300"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
