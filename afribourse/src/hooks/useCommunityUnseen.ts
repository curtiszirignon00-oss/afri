// src/hooks/useCommunityUnseen.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

/**
 * Get unseen community posts count
 */
export function useUnseenCommunityCount() {
    return useQuery({
        queryKey: ['community-unseen-count'],
        queryFn: async () => {
            const response = await apiClient.get<{ count: number }>('/communities/unseen-count');
            return response.data.count;
        },
        refetchInterval: 30000,
        staleTime: 10000,
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
