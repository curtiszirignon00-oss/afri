// src/hooks/useModeration.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface ModerationStats {
    pendingReports: number;
    resolvedReportsLast30Days: number;
    activeBans: number;
    bannedKeywords: number;
    moderationActionsLast30Days: number;
}

export interface Report {
    id: string;
    content_type: 'POST' | 'COMMENT' | 'COMMUNITY_POST' | 'COMMUNITY_COMMENT' | 'USER';
    content_id: string;
    reason: string;
    description?: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    created_at: string;
    reporter: {
        id: string;
        name: string;
        lastname: string;
    };
}

export interface BannedKeyword {
    id: string;
    keyword: string;
    severity: number;
    category: string | null;
    is_regex: boolean;
    is_active: boolean;
    created_at: string;
}

export function useModerationStats() {
    return useQuery({
        queryKey: ['moderation-stats'],
        queryFn: async () => {
            const response = await apiClient.get('/moderation/stats');
            return response.data as ModerationStats;
        },
    });
}

export function useReports(page: number = 1, status?: string) {
    return useQuery({
        queryKey: ['reports', page, status],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (status) params.append('status', status);

            const response = await apiClient.get(`/moderation/reports?${params}`);
            return response.data;
        },
    });
}

export function useProcessReport() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ reportId, status, resolution }: {
            reportId: string;
            status: 'RESOLVED' | 'DISMISSED';
            resolution?: string;
        }) => {
            const response = await apiClient.put(`/moderation/reports/${reportId}`, {
                status,
                resolution,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
        },
    });
}

export function useBannedKeywords() {
    return useQuery({
        queryKey: ['banned-keywords'],
        queryFn: async () => {
            const response = await apiClient.get('/moderation/keywords');
            return response.data;
        },
    });
}

export function useAddBannedKeyword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { keyword: string; severity?: number; category?: string; isRegex?: boolean }) => {
            const response = await apiClient.post('/moderation/keywords', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banned-keywords'] });
            queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
        },
    });
}

export function useToggleBannedKeyword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (keywordId: string) => {
            const response = await apiClient.patch(`/moderation/keywords/${keywordId}/toggle`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banned-keywords'] });
        },
    });
}

export function useRemoveBannedKeyword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (keywordId: string) => {
            const response = await apiClient.delete(`/moderation/keywords/${keywordId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banned-keywords'] });
            queryClient.invalidateQueries({ queryKey: ['moderation-stats'] });
        },
    });
}
