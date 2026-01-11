import React, { useState, useEffect } from 'react';
import { X, Bell, TrendingUp, TrendingDown, Mail, Smartphone } from 'lucide-react';
import { useCreatePriceAlert, useUpdatePriceAlert } from '../../hooks/usePriceAlerts';
import { PriceAlert } from '../../types';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockTicker: string;
  currentPrice: number;
  companyName: string;
  existingAlert?: PriceAlert | null;
}

export default function PriceAlertModal({
  isOpen,
  onClose,
  stockTicker,
  currentPrice,
  companyName,
  existingAlert
}: PriceAlertModalProps) {
  const [alertType, setAlertType] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);

  const createMutation = useCreatePriceAlert();
  const updateMutation = useUpdatePriceAlert();

  // Pré-remplir le formulaire si on édite une alerte existante
  useEffect(() => {
    if (existingAlert) {
      setAlertType(existingAlert.alert_type);
      setTargetPrice(existingAlert.target_price.toString());
      setNotifyEmail(existingAlert.notify_email);
      setNotifyInApp(existingAlert.notify_in_app);
    } else {
      // Suggérer un prix par défaut (+/-5% du prix actuel)
      const suggestedPrice = Math.round(currentPrice * 1.05);
      setTargetPrice(suggestedPrice.toString());
    }
  }, [existingAlert, currentPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      return;
    }

    if (existingAlert) {
      // Mise à jour
      updateMutation.mutate(
        {
          alertId: existingAlert.id,
          payload: {
            targetPrice: price,
            alertType,
            notifyEmail,
            notifyInApp,
          },
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      // Création
      createMutation.mutate(
        {
          stockTicker,
          alertType,
          targetPrice: price,
          notifyEmail,
          notifyInApp,
        },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    }
  };

  if (!isOpen) return null;

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {existingAlert ? 'Modifier l\'alerte' : 'Créer une alerte'}
              </h2>
              <p className="text-sm text-gray-500">{companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Prix actuel */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Prix actuel</p>
            <p className="text-2xl font-bold text-gray-900">
              {currentPrice.toLocaleString('fr-FR')} <span className="text-base font-normal">FCFA</span>
            </p>
          </div>

          {/* Type d'alerte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type d'alerte
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAlertType('ABOVE')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  alertType === 'ABOVE'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingUp
                  className={`w-6 h-6 mx-auto mb-2 ${
                    alertType === 'ABOVE' ? 'text-green-600' : 'text-gray-400'
                  }`}
                />
                <p className={`font-medium ${alertType === 'ABOVE' ? 'text-green-900' : 'text-gray-700'}`}>
                  Au-dessus
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Prix &gt;= cible
                </p>
              </button>

              <button
                type="button"
                onClick={() => setAlertType('BELOW')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  alertType === 'BELOW'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TrendingDown
                  className={`w-6 h-6 mx-auto mb-2 ${
                    alertType === 'BELOW' ? 'text-red-600' : 'text-gray-400'
                  }`}
                />
                <p className={`font-medium ${alertType === 'BELOW' ? 'text-red-900' : 'text-gray-700'}`}>
                  En-dessous
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Prix &lt;= cible
                </p>
              </button>
            </div>
          </div>

          {/* Prix cible */}
          <div>
            <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Prix cible (FCFA)
            </label>
            <input
              type="number"
              id="targetPrice"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              min="1"
              step="1"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Entrez le prix cible"
            />
            <p className="text-xs text-gray-500 mt-2">
              {alertType === 'ABOVE'
                ? `Vous serez alerté quand le prix atteint ou dépasse ${targetPrice || '...'} FCFA`
                : `Vous serez alerté quand le prix descend à ${targetPrice || '...'} FCFA ou moins`
              }
            </p>
          </div>

          {/* Options de notification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Méthodes de notification
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Email</p>
                  <p className="text-xs text-gray-500">Recevoir un email</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={notifyInApp}
                  onChange={(e) => setNotifyInApp(e.target.checked)}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">In-app</p>
                  <p className="text-xs text-gray-500">Notification dans l'application</p>
                </div>
              </label>
            </div>

            {!notifyEmail && !notifyInApp && (
              <p className="text-sm text-red-600 mt-2">
                Veuillez sélectionner au moins une méthode de notification
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || (!notifyEmail && !notifyInApp)}
              className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Enregistrement...' : existingAlert ? 'Mettre à jour' : 'Créer l\'alerte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
