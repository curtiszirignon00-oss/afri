import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  togglePriceAlert,
  deletePriceAlert,
  fetchAlertNotifications
} from '../services/stockApi';
import { CreatePriceAlertPayload, UpdatePriceAlertPayload } from '../types';
import { toast } from 'react-hot-toast';

/**
 * Hook pour récupérer toutes les alertes de l'utilisateur
 */
export function usePriceAlerts() {
  return useQuery({
    queryKey: ['price-alerts'],
    queryFn: () => fetchPriceAlerts(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour récupérer les alertes d'un ticker spécifique
 */
export function useStockAlerts(stockTicker: string) {
  return useQuery({
    queryKey: ['price-alerts', stockTicker],
    queryFn: () => fetchPriceAlerts(stockTicker),
    enabled: !!stockTicker,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook pour créer une nouvelle alerte
 */
export function useCreatePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePriceAlertPayload) => createPriceAlert(payload),
    onSuccess: (data) => {
      // Invalider les requêtes pour rafraîchir les alertes
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['price-alerts', data.stock_ticker] });

      toast.success(`Alerte créée pour ${data.stock_ticker}`, {
        icon: '🔔',
        duration: 4000,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la création de l\'alerte');
    },
  });
}

/**
 * Hook pour mettre à jour une alerte
 */
export function useUpdatePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, payload }: { alertId: string; payload: UpdatePriceAlertPayload }) =>
      updatePriceAlert(alertId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['price-alerts', data.stock_ticker] });

      toast.success('Alerte mise à jour', {
        icon: '✅',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    },
  });
}

/**
 * Hook pour activer/désactiver une alerte
 */
export function useTogglePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, isActive }: { alertId: string; isActive: boolean }) =>
      togglePriceAlert(alertId, isActive),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['price-alerts', data.stock_ticker] });

      const message = variables.isActive ? 'Alerte activée' : 'Alerte désactivée';
      toast.success(message, {
        icon: variables.isActive ? '🔔' : '🔕',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors du changement de statut');
    },
  });
}

/**
 * Hook pour supprimer une alerte
 */
export function useDeletePriceAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => deletePriceAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });

      toast.success('Alerte supprimée', {
        icon: '🗑️',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la suppression');
    },
  });
}

/**
 * Hook pour récupérer l'historique des notifications d'une alerte
 */
export function useAlertNotifications(alertId: string) {
  return useQuery({
    queryKey: ['alert-notifications', alertId],
    queryFn: () => fetchAlertNotifications(alertId),
    enabled: !!alertId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
