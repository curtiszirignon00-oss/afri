// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Les données restent "fraîches" pendant 5 minutes
      gcTime: 1000 * 60 * 30,   // Les données en cache pendant 30 minutes
      // Ne jamais réessayer sur 429 (rate limit) — cela aggraverait la situation.
      // Réessayer une fois sur les autres erreurs (réseau, 5xx).
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 429 || status === 401 || status === 403) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false, // Désactivé globalement — chaque hook gère son propre cycle
      refetchOnReconnect: true,    // Recharger quand la connexion internet revient
    },
    mutations: {
      retry: 0, // Ne pas réessayer les mutations (POST, PUT, DELETE)
    },
  },
});