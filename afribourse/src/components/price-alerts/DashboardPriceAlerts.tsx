import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { usePriceAlerts, useTogglePriceAlert, useDeletePriceAlert } from '../../hooks/usePriceAlerts';

export default function DashboardPriceAlerts() {
  const navigate = useNavigate();
  const { data: alerts, isLoading } = usePriceAlerts();
  const toggleMutation = useTogglePriceAlert();
  const deleteMutation = useDeletePriceAlert();

  // Détecter les alertes nouvellement déclenchées et afficher un toast
  const prevNotifiedRef = useRef<Map<string, boolean>>(new Map());
  useEffect(() => {
    if (!alerts) return;
    const prevMap = prevNotifiedRef.current;

    // Premier chargement : enregistrer l'état actuel sans toast
    if (prevMap.size === 0) {
      alerts.forEach(a => prevMap.set(a.id, a.is_notified));
      return;
    }

    // Détecter les transitions false → true
    alerts.forEach(alert => {
      const wasNotified = prevMap.get(alert.id);
      if (wasNotified === false && alert.is_notified) {
        const direction = alert.alert_type === 'ABOVE' ? 'au-dessus de' : 'en-dessous de';
        toast.success(
          `Alerte ${alert.stock_ticker} déclenchée ! Prix ${direction} ${alert.target_price.toLocaleString('fr-FR')} FCFA`,
          { icon: '🔔', duration: 8000 }
        );
      }
      prevMap.set(alert.id, alert.is_notified);
    });
  }, [alerts]);

  const handleToggle = (alertId: string, isActive: boolean) => {
    toggleMutation.mutate({ alertId, isActive });
  };

  const handleDelete = (alertId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette alerte ?')) {
      deleteMutation.mutate(alertId);
    }
  };

  const handleViewStock = (ticker: string) => {
    navigate(`/stock/${ticker}`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts?.filter(a => a.is_active && !a.is_notified) || [];
  const triggeredAlerts = alerts?.filter(a => a.is_notified) || [];
  const inactiveAlerts = alerts?.filter(a => !a.is_active && !a.is_notified) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Alertes de Prix</h2>
              <p className="text-sm text-gray-500">
                {alerts?.length || 0} alerte{(alerts?.length || 0) > 1 ? 's' : ''} configurée{(alerts?.length || 0) > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            {activeAlerts.length > 0 && (
              <div className="text-center">
                <p className="font-bold text-green-600">{activeAlerts.length}</p>
                <p className="text-gray-500">Active{activeAlerts.length > 1 ? 's' : ''}</p>
              </div>
            )}
            {triggeredAlerts.length > 0 && (
              <div className="text-center">
                <p className="font-bold text-orange-600">{triggeredAlerts.length}</p>
                <p className="text-gray-500">Déclenchée{triggeredAlerts.length > 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {!alerts || alerts.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune alerte configurée
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Créez des alertes pour recevoir des notifications quand le prix d'une action atteint un certain niveau
            </p>
            <button
              onClick={() => navigate('/markets')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Créer une alerte
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Alertes actives
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onViewStock={handleViewStock}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Triggered Alerts */}
            {triggeredAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Alertes déclenchées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {triggeredAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onViewStock={handleViewStock}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Alerts */}
            {inactiveAlerts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Alertes désactivées
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {inactiveAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onViewStock={handleViewStock}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* View All Link */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate('/markets')}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
              >
                Gérer toutes mes alertes
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Alert Card Component
interface AlertCardProps {
  alert: any;
  onToggle: (alertId: string, isActive: boolean) => void;
  onDelete: (alertId: string) => void;
  onViewStock: (ticker: string) => void;
}

function AlertCard({ alert, onToggle, onDelete, onViewStock }: AlertCardProps) {
  return (
    <div
      className={`border-2 rounded-lg p-4 transition-all ${
        alert.is_notified
          ? 'border-orange-200 bg-orange-50'
          : alert.is_active
          ? 'border-green-200 bg-green-50/30'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewStock(alert.stock_ticker)}
            className="font-bold text-gray-900 hover:text-orange-600 transition-colors"
          >
            {alert.stock_ticker}
          </button>
          {alert.alert_type === 'ABOVE' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
        </div>

        {/* Status Badge */}
        {alert.is_notified ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <CheckCircle className="w-3 h-3" />
            Déclenchée
          </span>
        ) : alert.is_active ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Bell className="w-3 h-3" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <BellOff className="w-3 h-3" />
            Désactivée
          </span>
        )}
      </div>

      {/* Alert Info */}
      <div className="mb-3">
        <p className="text-sm text-gray-600 mb-1">
          {alert.alert_type === 'ABOVE' ? 'Au-dessus de' : 'En-dessous de'}
        </p>
        <p className="text-lg font-bold text-gray-900">
          {alert.target_price.toLocaleString('fr-FR')} FCFA
        </p>
      </div>

      {/* Triggered Info */}
      {alert.triggered_at && (
        <div className="mb-3 p-2 bg-white rounded border border-orange-200">
          <p className="text-xs text-gray-600 mb-1">Déclenchée le</p>
          <p className="text-xs font-medium text-gray-900">
            {new Date(alert.triggered_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {alert.triggered_price && (
            <p className="text-xs text-gray-600">
              Prix: {alert.triggered_price.toLocaleString('fr-FR')} FCFA
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
        {!alert.is_notified && (
          <button
            onClick={() => onToggle(alert.id, !alert.is_active)}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              alert.is_active
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {alert.is_active ? 'Désactiver' : 'Activer'}
          </button>
        )}
        <button
          onClick={() => onViewStock(alert.stock_ticker)}
          className="flex-1 px-3 py-1.5 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700 transition-colors"
        >
          Voir l'action
        </button>
        <button
          onClick={() => onDelete(alert.id)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
