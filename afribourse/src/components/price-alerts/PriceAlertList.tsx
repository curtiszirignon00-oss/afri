import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Mail,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import { useStockAlerts, useTogglePriceAlert, useDeletePriceAlert } from '../../hooks/usePriceAlerts';
import { PriceAlert } from '../../types';
import PriceAlertModal from './PriceAlertModal';

interface PriceAlertListProps {
  stockTicker: string;
  currentPrice: number;
  companyName: string;
}

export default function PriceAlertList({ stockTicker, currentPrice, companyName }: PriceAlertListProps) {
  const { data: alerts, isLoading } = useStockAlerts(stockTicker);
  const toggleMutation = useTogglePriceAlert();
  const deleteMutation = useDeletePriceAlert();

  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggle = (alertId: string, isActive: boolean) => {
    toggleMutation.mutate({ alertId, isActive });
  };

  const handleDelete = (alertId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
      deleteMutation.mutate(alertId);
    }
  };

  const handleEdit = (alert: PriceAlert) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlert(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">Aucune alerte configurée</p>
          <p className="text-sm text-gray-500">
            Créez une alerte pour être notifié quand le prix atteint un certain niveau
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">
              Mes alertes ({alerts.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {alerts.map((alert) => {
            const isPriceAboveTarget = currentPrice >= alert.target_price;
            const isPriceBelowTarget = currentPrice <= alert.target_price;
            const shouldTrigger =
              (alert.alert_type === 'ABOVE' && isPriceAboveTarget) ||
              (alert.alert_type === 'BELOW' && isPriceBelowTarget);

            return (
              <div
                key={alert.id}
                className={`p-4 transition-colors ${
                  alert.is_notified ? 'bg-gray-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info alerte */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {alert.alert_type === 'ABOVE' ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {alert.target_price.toLocaleString('fr-FR')} FCFA
                      </span>

                      {/* Badges */}
                      {alert.is_notified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Déclenchée
                        </span>
                      )}
                      {!alert.is_active && !alert.is_notified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <Clock className="w-3 h-3" />
                          Désactivée
                        </span>
                      )}
                      {alert.is_active && !alert.is_notified && shouldTrigger && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          Prête
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {alert.alert_type === 'ABOVE'
                        ? `Alerter quand le prix dépasse ${alert.target_price.toLocaleString('fr-FR')} FCFA`
                        : `Alerter quand le prix descend sous ${alert.target_price.toLocaleString('fr-FR')} FCFA`}
                    </p>

                    {/* Notifications */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {alert.notify_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Email
                        </span>
                      )}
                      {alert.notify_in_app && (
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          In-app
                        </span>
                      )}
                    </div>

                    {/* Date de déclenchement */}
                    {alert.triggered_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Déclenchée le{' '}
                        {new Date(alert.triggered_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        à {alert.triggered_price?.toLocaleString('fr-FR')} FCFA
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!alert.is_notified && (
                      <>
                        <button
                          onClick={() => handleEdit(alert)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggle(alert.id, !alert.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            alert.is_active
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={alert.is_active ? 'Désactiver' : 'Activer'}
                        >
                          {alert.is_active ? (
                            <Bell className="w-4 h-4" />
                          ) : (
                            <BellOff className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal d'édition */}
      <PriceAlertModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        stockTicker={stockTicker}
        currentPrice={currentPrice}
        companyName={companyName}
        existingAlert={editingAlert}
      />
    </>
  );
}
