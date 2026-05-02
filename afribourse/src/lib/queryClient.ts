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
        const status = (error as any)?.response?.status ?? (error as any)?.status;
        if (status === 429 || status === 401 || status === 403) return false;
        return failureCount < 1;
      },
      // Ne pas propager aux error boundaries :
      // - 429 silencieux (rate limit GET)
      // - 401 (non authentifié — géré par AuthContext / SessionExpiredModal / redirect login)
      // - 403 (interdit — la page concernée affiche son propre message)
      // - 404 (ressource absente — la page affiche un état vide)
      // Sans ce filtre, n'importe quel échec API d'une query (ex: visiteur non loggé qui charge
      // la home avec une query auth-required) casse toute l'app derrière l'ErrorBoundary.
      throwOnError: (error: unknown) => {
        if (error instanceof RateLimitError && error.silent) return false;
        const status = (error as any)?.response?.status ?? (error as any)?.status;
        if (status === 401 || status === 403 || status === 404 || status === 429) return false;
        return true;
      },
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