import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import { isPollingLeader, pollChannel, LEADERSHIP_EVENT } from '../lib/tab-coordinator';

type PollingOptions<T> = Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  'queryKey' | 'queryFn' | 'refetchInterval' | 'refetchIntervalInBackground'
> & {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  /** Intervalle de polling en ms (utilisé uniquement par l'onglet leader) */
  refetchInterval: number;
};

/**
 * Variante de useQuery conçue pour le polling coordonné entre onglets.
 *
 * - L'onglet "leader" (élu via tab-coordinator) est le seul à envoyer des requêtes HTTP.
 * - Les onglets "followers" reçoivent les résultats via BroadcastChannel et mettent à jour
 *   leur cache React Query sans jamais appeler le serveur.
 * - Si un onglet leader est fermé, un follower prend le relais automatiquement.
 * - Fallback sur le polling classique si BroadcastChannel n'est pas disponible (navigateurs anciens).
 *
 * Résultat : N onglets ouverts = 1 seul ensemble de requêtes de polling (pas N ensembles).
 */
export function usePollingQuery<T>({
  queryKey,
  queryFn,
  refetchInterval,
  ...rest
}: PollingOptions<T>) {
  const queryClient = useQueryClient();
  const [isLeader, setIsLeader] = useState(isPollingLeader);

  // Devenir actif quand cet onglet acquiert le leadership (ex : l'onglet leader était fermé)
  useEffect(() => {
    const onAcquire = () => setIsLeader(true);
    window.addEventListener(LEADERSHIP_EVENT, onAcquire);
    return () => window.removeEventListener(LEADERSHIP_EVENT, onAcquire);
  }, []);

  // Les onglets followers injectent les résultats dans le cache React Query via BroadcastChannel
  useEffect(() => {
    if (!pollChannel || isLeader) return;
    const cacheKey = JSON.stringify(queryKey);
    const onMessage = (e: MessageEvent) => {
      if (e.data?.k === cacheKey) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient.setQueryData(queryKey as any, e.data.v);
      }
    };
    pollChannel.addEventListener('message', onMessage);
    return () => pollChannel.removeEventListener('message', onMessage);
  }, [isLeader, queryClient, queryKey]);

  // Fallback : si BroadcastChannel n'est pas disponible, tous les onglets pollent normalement
  const shouldPoll = isLeader || !pollChannel;

  return useQuery({
    queryKey,
    queryFn: async () => {
      const data = await queryFn();
      // Le leader diffuse immédiatement le résultat aux onglets followers
      if (isLeader && pollChannel) {
        pollChannel.postMessage({ k: JSON.stringify(queryKey), v: data });
      }
      return data;
    },
    refetchInterval: shouldPoll ? refetchInterval : false,
    refetchIntervalInBackground: false,
    ...rest,
  });
}
