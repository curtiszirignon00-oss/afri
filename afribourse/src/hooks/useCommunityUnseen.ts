// src/hooks/useCommunityUnseen.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

/**
 * Get unseen community posts count
 */
export function useUnseenCommunityCount(enabled: boolean = true) {
    return useQuery({
        queryKey: ['community-unseen-count'],
        queryFn: async () => {
            const response = await apiClient.get<{ count: number }>('/communities/unseen-count');
            return response.data.count;
        },
        enabled,
        refetchInterval: 73 * 1000, // 73s — décalé de 13s pour éviter la synchronisation avec les autres polls
        refetchIntervalInBackground: false,
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
