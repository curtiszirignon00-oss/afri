import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePawaPayment, getCorrespondent, getAvailableCountries, getCurrency, PAWAPAY_CORRESPONDENTS } from '../../hooks/usePawaPayment';

// ─── Indicatifs pays supportés par PawaPay ────────────────────────────────────

const ALL_DIAL_CODES = [
  { code: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: '+256', flag: '🇺🇬', name: 'Ouganda' },
  { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planId: string;
  planName: string;
  amount: string;     // ex: "9900"
  currency?: string;  // défaut "XOF"
  paymentMethod: string; // "wave" | "orange-money" | "mtn-momo" | "moov-money"
}

// ─── Libellés opérateurs ──────────────────────────────────────────────────────

const OPERATOR_LABELS: Record<string, string> = {
  'wave': 'Wave',
  'orange-money': 'Orange Money',
  'mtn-momo': 'MTN Mobile Money',
  'moov-money': 'Moov Money',
  'free-money': 'Free Money',
};

// ─── Composant principal ──────────────────────────────────────────────────────

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen, onClose, onSuccess,
  planId, planName, amount, currency = 'XOF', paymentMethod,
}) => {
  const availableDialCodes = getAvailableCountries(paymentMethod);
  const filteredCodes = ALL_DIAL_CODES.filter(c => availableDialCodes.includes(c.code));
  const defaultDial = filteredCodes[0]?.code ?? '+225';

  const [dialCode, setDialCode] = useState(defaultDial);
  const [phoneNumber, setPhoneNumber] = useState('');

  const { status, errorMessage, initiate, reset } = usePawaPayment(() => {
    onSuccess();
  });

  // Réinitialiser quand la modale s'ouvre
  useEffect(() => {
    if (isOpen) {
      reset();
      setPhoneNumber('');
      setDialCode(defaultDial);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const correspondent = getCorrespondent(paymentMethod, dialCode);
  const isSubmitting = status === 'initiating' || status === 'pending';

  const handleSubmit = () => {
    if (!phoneNumber.trim() || !correspondent) return;
    // Construire le MSISDN : indicatif sans "+" + numéro sans espaces
    const msisdn = dialCode.replace('+', '') + phoneNumber.replace(/\D/g, '');
    initiate({ planId, planName, amount, currency: getCurrency(dialCode), correspondent, phone: msisdn });
  };

  const formatAmount = () =>
    `${parseInt(amount).toLocaleString('fr-FR')} ${currency}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={isSubmitting ? undefined : onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          {!isSubmitting && (
            <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-5 h-5 text-white/80" />
            <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Paiement {OPERATOR_LABELS[paymentMethod]}
            </p>
          </div>
          <h3 className="text-white font-bold text-lg">{planName}</h3>
          <p className="text-blue-200 text-sm font-semibold mt-0.5">{formatAmount()}</p>
        </div>

        <div className="p-6">
          {/* ── Étape 1 : saisie du numéro ── */}
          {(status === 'idle' || status === 'initiating') && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Entrez le numéro associé à votre compte <strong>{OPERATOR_LABELS[paymentMethod]}</strong>.
              </p>

              {/* Sélecteur pays */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                <select
                  value={dialCode}
                  onChange={e => setDialCode(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {filteredCodes.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Numéro de téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
                <div className="flex items-stretch border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                  <span className="bg-gray-50 border-r border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600 flex items-center">
                    {dialCode}
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                    placeholder="07 00 00 00 00"
                    disabled={isSubmitting}
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-white placeholder:text-gray-400"
                  />
                </div>
              </div>

              {!correspondent && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ {OPERATOR_LABELS[paymentMethod]} n'est pas disponible dans ce pays.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!phoneNumber.trim() || !correspondent || isSubmitting}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {status === 'initiating' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  `Payer ${formatAmount()}`
                )}
              </button>
            </div>
          )}

          {/* ── Étape 2 : en attente du PIN ── */}
          {status === 'pending' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Vérifiez votre téléphone</h4>
                <p className="text-gray-600 text-sm mt-1">
                  Une demande de paiement a été envoyée sur votre téléphone.
                  <br />
                  <strong>Entrez votre PIN {OPERATOR_LABELS[paymentMethod]}</strong> pour confirmer.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                ⏱ Vous avez environ 1 à 2 minutes pour confirmer le paiement.
              </div>
            </div>
          )}

          {/* ── Succès ── */}
          {status === 'completed' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Paiement confirmé !</h4>
                <p className="text-gray-600 text-sm mt-1">
                  Votre abonnement <strong>{planName}</strong> est maintenant actif.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Continuer
              </button>
            </div>
          )}

          {/* ── Échec ── */}
          {status === 'failed' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">Paiement échoué</h4>
                <p className="text-gray-600 text-sm mt-1">{errorMessage}</p>
              </div>
              <button
                onClick={reset}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
        </div>

        {/* Footer sécurité */}
        {(status === 'idle' || status === 'initiating') && (
          <div className="px-6 pb-5 text-center">
            <p className="text-xs text-gray-400">🔒 Paiement sécurisé via PawaPay · Vos données sont chiffrées</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
