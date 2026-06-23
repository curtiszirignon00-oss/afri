import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Building2, CheckCircle, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authFetch, API_BASE_URL } from '../config/api';
import PaymentModal from './payment/PaymentModal';
import { PAWAPAY_CORRESPONDENTS } from '../hooks/usePawaPayment';
import { metaPixel } from '../utils/metaPixel';

interface PromoInfo {
  hasDiscount: boolean;
  discountPercent?: number;
  originalAmount?: number;
  discountedAmount?: number;
  remainingUses?: number;
  maxUses?: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: typeof CreditCard;
  description: string;
  type: 'mobile' | 'card' | 'bank';
}

const MOBILE_METHODS = new Set(['orange-money', 'mtn-momo', 'moov-money', 'free-money']);

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [promo, setPromo] = useState<PromoInfo | null>(null);

  const { planId, planName, price, source } = location.state || {};

  if (!planId || !planName || !price) {
    navigate('/subscriptions');
    return null;
  }

  // Extraire le montant brut depuis "9 900 XOF / mois" → "9900"
  const rawAmount = price.replace(/\s/g, '').split('XOF')[0];
  const displayAmount = price.split(' / ')[0]; // "9 900 XOF"

  // Montant effectif (remplacé par le prix promo si applicable — le backend le valide aussi côté serveur)
  const effectiveAmount = promo?.hasDiscount && promo.discountedAmount
    ? String(promo.discountedAmount)
    : rawAmount;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    authFetch(`${API_BASE_URL}/promo/check?planId=${planId}`)
      .then(r => r.json())
      .then((data: PromoInfo) => setPromo(data))
      .catch(() => {/* non bloquant */});
  }, [planId]);

  const paymentMethods: PaymentMethod[] = [
    { id: 'orange-money', name: 'Orange Money',       icon: Smartphone,  description: 'Paiement Orange Money',        type: 'mobile' },
    { id: 'mtn-momo',     name: 'MTN Mobile Money',   icon: Smartphone,  description: 'Paiement MTN MoMo',            type: 'mobile' },
    { id: 'moov-money',   name: 'Moov Money',         icon: Smartphone,  description: 'Paiement Moov Money',          type: 'mobile' },
    { id: 'free-money',   name: 'Free Money',         icon: Smartphone,  description: 'Paiement Free Money',          type: 'mobile' },
    { id: 'wave',         name: 'Wave',               icon: Smartphone,  description: 'Bientôt disponible',           type: 'mobile' },
    { id: 'visa',         name: 'Visa / Mastercard',  icon: CreditCard,  description: 'Bientôt disponible',           type: 'card'   },
    { id: 'bank-transfer',name: 'Virement Bancaire',  icon: Building2,   description: 'Bientôt disponible',           type: 'bank'   },
  ];

  const isMobileMethod = (id: string) => MOBILE_METHODS.has(id);
  const isMethodAvailable = (id: string) => isMobileMethod(id);

  const handlePay = async () => {
    if (!selectedMethod || !userProfile) return;

    // Tracker l'intention d'abonnement (analytics)
    try {
      await authFetch(`${API_BASE_URL}/subscriptions/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId, planName, price,
          userId: userProfile.id,
          feature: `Checkout - ${selectedMethod}`,
          source: source || 'checkout',
          paymentMethod: selectedMethod,
        }),
      });
    } catch { /* non bloquant */ }

    if (isMobileMethod(selectedMethod)) {
      metaPixel.addPaymentInfo(planName, Number(effectiveAmount) || 0); // Meta : Ajout d'infos de paiement
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    navigate('/dashboard', {
      state: { paymentSuccess: true, planName },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Retour */}
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

          <div className="p-8">
            {/* Récapitulatif */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{planName}</p>
                  <p className="text-gray-600">Abonnement mensuel</p>
                </div>
                <div className="text-right">
                  {promo?.hasDiscount ? (
                    <>
                      <p className="text-lg line-through text-gray-400">{promo.originalAmount?.toLocaleString('fr-FR')} XOF</p>
                      <p className="text-3xl font-bold text-orange-500">{promo.discountedAmount?.toLocaleString('fr-FR')} XOF</p>
                      <p className="text-gray-600">/ mois</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-blue-600">{price.split(' ')[0]}</p>
                      <p className="text-gray-600">{price.split(' ')[1]} / mois</p>
                    </>
                  )}
                </div>
              </div>
              {promo?.hasDiscount && (
                <div className="mt-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                  <Tag className="w-4 h-4 text-orange-500 shrink-0" />
                  <p className="text-sm text-orange-700 font-medium">
                    Offre spéciale — {promo.discountPercent}% de réduction pendant {promo.maxUses} mois
                    {promo.remainingUses !== undefined && promo.remainingUses < promo.maxUses! && (
                      <span className="ml-1 text-orange-500">({promo.remainingUses} mois restant{promo.remainingUses > 1 ? 's' : ''})</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Méthodes de paiement */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Méthode de paiement</h2>
              <p className="text-sm text-gray-500 mb-4">Mobile Money disponible · Carte et virement bientôt</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  const available = isMethodAvailable(method.id);

                  return (
                    <button
                      key={method.id}
                      onClick={() => available && setSelectedMethod(method.id)}
                      disabled={!available}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                        ${isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'}
                        ${!available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{method.name}</h3>
                          <p className="text-sm text-gray-500">{method.description}</p>
                          {available && (
                            <span className="inline-block mt-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              Disponible
                            </span>
                          )}
                        </div>
                        {isSelected && <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton payer */}
            <button
              onClick={handlePay}
              disabled={!selectedMethod || !isMethodAvailable(selectedMethod)}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300
                ${!selectedMethod || !isMethodAvailable(selectedMethod)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : promo?.hasDiscount
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                }`}
            >
              Payer {promo?.hasDiscount && promo.discountedAmount
                ? `${promo.discountedAmount.toLocaleString('fr-FR')} XOF`
                : displayAmount}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">🔒 Paiement 100% sécurisé via PawaPay</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions fréquentes</h3>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-gray-900">Comment fonctionne le paiement Mobile Money ?</p>
              <p className="text-gray-600 mt-1">
                Vous entrez votre numéro et vous recevez une demande de paiement sur votre téléphone.
                Il suffit d'entrer votre PIN pour confirmer — c'est tout.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Quand commence mon abonnement ?</p>
              <p className="text-gray-600 mt-1">
                Votre abonnement est activé immédiatement après confirmation du paiement.
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Puis-je annuler à tout moment ?</p>
              <p className="text-gray-600 mt-1">
                Oui, vous pouvez annuler depuis votre compte. L'abonnement reste actif jusqu'à la fin de la période payée.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de paiement PawaPay */}
      {selectedMethod && showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          planId={planId}
          planName={planName}
          amount={effectiveAmount}
          currency="XOF"
          paymentMethod={selectedMethod}
        />
      )}
    </div>
  );
}
