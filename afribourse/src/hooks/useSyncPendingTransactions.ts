// afribourse/src/hooks/useSyncPendingTransactions.ts
import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { getPendingTransactions, removePendingTransaction } from '../services/offlineStorage';
import { apiClient } from '../lib/api-client';

export function useSyncPendingTransactions() {
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOnline) {
      syncTransactions();
    }
  }, [isOnline]);

  async function syncTransactions() {
    try {
      const pending = await getPendingTransactions();

      for (const tx of pending) {
        try {
          const endpoint = tx.type === 'BUY' ? 'buy' : 'sell';
          const response = await apiClient.post(`/portfolios/my/${endpoint}`, {
            stockTicker: tx.ticker,
            quantity: tx.quantity,
            pricePerShare: tx.price,
          });

          if (response.status === 200 || response.status === 201) {
            await removePendingTransaction(tx.id);
          }
        } catch {
          // Conserver la transaction en attente pour la prochaine tentative
        }
      }
    } catch {
      // Silencieux — la synchro sera retentée à la prochaine connexion
    }
  }

  return { syncTransactions };
}
