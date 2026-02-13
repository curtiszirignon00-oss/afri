// afribourse/src/hooks/useSyncPendingTransactions.ts
import { useEffect } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { getPendingTransactions, removePendingTransaction } from '../services/offlineStorage';

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
          const response = await fetch(`/api/portfolios/my/${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Note: Auth token should be handled by your API interceptor
            },
            body: JSON.stringify({
              stockTicker: tx.ticker,
              quantity: tx.quantity,
              pricePerShare: tx.price,
            }),
          });

          if (response.ok) {
            await removePendingTransaction(tx.id);
            console.log(`[Sync] Transaction ${tx.id} synchronized successfully`);
          } else {
            console.error(`[Sync] Failed to sync transaction ${tx.id}:`, await response.text());
          }
        } catch (error) {
          console.error(`[Sync] Error syncing transaction ${tx.id}:`, error);
          // Keep the transaction in pending for next sync attempt
        }
      }
    } catch (error) {
      console.error('[Sync] Error getting pending transactions:', error);
    }
  }

  return { syncTransactions };
}
