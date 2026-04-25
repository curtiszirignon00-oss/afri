// src/hooks/useCommunityUnseen.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { usePollingQuery } from './usePollingQuery';

/**
 * Get unseen community posts count
 */
export function useUnseenCommunityCount(enabled: boolean = true) {
    return usePollingQuery({
        queryKey: ['community-unseen-count'],
        queryFn: async () => {
            const response = await apiClient.get<{ count: number }>('/communities/unseen-count');
            return response.data.count;
        },
        enabled,
        refetchInterval: 73 * 1000, // 73s — décalé, seul l'onglet leader poll
        staleTime: 30000,
    });
}

/**
 * Mark community as visited (resets unseen count)
 */
export function useMarkCommunityVisited() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/communities/mark-visited');
            return response.data;
        },
        onSuccess: () => {
            queryClient.setQueryData(['community-unseen-count'], 0);
        },
    });
}
