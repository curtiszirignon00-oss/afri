// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Les données restent "fraîches" pendant 5 minutes
      gcTime: 1000 * 60 * 30, // Les données en cache pendant 30 minutes
      retry: 1, // Réessayer 1 fois en cas d'échec
      refetchOnWindowFocus: false, // Ne pas recharger quand on revient sur l'onglet
      refetchOnReconnect: true, // Recharger quand la connexion internet revient
    },
    mutations: {
      retry: 0, // Ne pas réessayer les mutations (POST, PUT, DELETE)
    },
  },
});