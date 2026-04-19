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
        refetchInterval: 60000, // Réduit de 30s à 60s
        refetchIntervalInBackground: false, // Ne pas poller en arrière-plan
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
