import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Building2, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface PaymentMethod {
  id: string;
  name: string;
  icon: typeof CreditCard;
  description: string;
  enabled: boolean;
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupérer les informations du plan depuis la navigation
  const { planId, planName, price, source } = location.state || {};

  // Rediriger si pas de données
  if (!planId || !planName || !price) {
    navigate('/subscriptions');
    return null;
  }

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'wave',
      name: 'Wave',
      icon: Smartphone,
      description: 'Paiement mobile via Wave',
      enabled: true,
    },
    {
      id: 'orange-money',
      name: 'Orange Money',
      icon: Smartphone,
      description: 'Paiement mobile via Orange Money',
      enabled: true,
    },
    {
      id: 'mtn-momo',
      name: 'MTN Mobile Money',
      icon: Smartphone,
      description: 'Paiement mobile via MTN MoMo',
      enabled: true,
    },
    {
      id: 'moov-money',
      name: 'Moov Money',
      icon: Smartphone,
      description: 'Paiement mobile via Moov Money',
      enabled: true,
    },
    {
      id: 'visa',
      name: 'Visa / Mastercard',
      icon: CreditCard,
      description: 'Carte bancaire Visa ou Mastercard',
      enabled: true,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: CreditCard,
      description: 'Paiement sécurisé par Stripe',
      enabled: true,
    },
    {
      id: 'bank-transfer',
      name: 'Virement Bancaire',
      icon: Building2,
      description: 'Virement bancaire classique',
      enabled: true,
    },
  ];

  const handlePayment = async () => {
    if (!selectedMethod || !userProfile) return;

    setIsProcessing(true);

    // Logger l'intention d'abonnement avec la méthode de paiement sélectionnée
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/subscriptions/intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          planId,
          planName,
          price,
          userId: userProfile.id,
          feature: `Checkout - ${selectedMethod}`,
          source: source || 'checkout',
          paymentMethod: selectedMethod,
        }),
      });

      if (!response.ok) {
        console.error('Erreur lors du tracking d\'intention');
      }

      // Le chargement infini simule un "bug" - on ne désactive jamais setIsProcessing
      // L'utilisateur va attendre indéfiniment
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Finaliser votre abonnement</h1>
            <p className="text-blue-100">Choisissez votre méthode de paiement</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Plan Summary */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{planName}</p>
                  <p className="text-gray-600">Abonnement mensuel</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{price.split(' ')[0]}</p>
                  <p className="text-gray-600">{price.split(' ')[1]} / mois</p>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Méthode de paiement</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;

                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={!method.enabled || isProcessing}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                      } ${!method.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${isProcessing ? 'cursor-wait opacity-70' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? 'bg-blue-100' : 'bg-gray-100'
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              isSelected ? 'text-blue-600' : 'text-gray-600'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{method.name}</h3>
                          <p className="text-sm text-gray-600">{method.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ${
                !selectedMethod || isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-6 w-6 mr-3 text-current"
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
                `Payer ${price}`
              )}
            </button>

            {/* Security Note */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                🔒 Paiement 100% sécurisé. Vos données sont protégées.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions fréquentes</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">Puis-je annuler à tout moment ?</p>
              <p className="text-gray-600 mt-1">
                Oui, vous pouvez annuler votre abonnement à tout moment depuis votre compte.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Le paiement est-il sécurisé ?</p>
              <p className="text-gray-600 mt-1">
                Tous les paiements sont cryptés et sécurisés. Nous ne stockons jamais vos informations bancaires.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Quand commence mon abonnement ?</p>
              <p className="text-gray-600 mt-1">
                Votre abonnement commence immédiatement après le paiement. Vous aurez accès à toutes les fonctionnalités premium instantanément.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
