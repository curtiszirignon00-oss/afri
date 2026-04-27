// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { RateLimitError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Les données restent "fraîches" pendant 5 minutes
      gcTime: 1000 * 60 * 30,   // Les données en cache pendant 30 minutes
      // GET 429 : silencieux, pas de retry. Mutations : retentées par l'intercepteur axios (2×).
      // Réessayer une fois sur les autres erreurs (réseau, 5xx).
      retry: (failureCount, error: unknown) => {
        if (error instanceof RateLimitError) return false;
        const status = (error as any)?.response?.status;
        if (status === 429 || status === 401 || status === 403) return false;
        return failureCount < 1;
      },
      // Ne pas propager aux error boundaries les 429 silencieux (GET)
      throwOnError: (error: unknown) => !(error instanceof RateLimitError && error.silent),
      refetchOnWindowFocus: false,
      // Sur reconnexion réseau, ne refetch que les données critiques pour éviter le burst
      // de 50+ requêtes simultanées quand l'utilisateur retrouve du réseau.
      refetchOnReconnect: (query) => {
        const criticalKeys = ['me', 'notifications-unread-count', 'price-alerts', 'portfolios'];
        const firstKey = query.queryKey[0];
        return typeof firstKey === 'string' && criticalKeys.includes(firstKey);
      },
    },
    mutations: {
      retry: 0, // Ne pas réessayer les mutations (POST, PUT, DELETE)
    },
  },
});