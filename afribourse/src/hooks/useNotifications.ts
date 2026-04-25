// src/hooks/useNotifications.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { usePollingQuery } from './usePollingQuery';

export interface Notification {
    id: string;
    type: 'NEW_POST' | 'NEW_FOLLOWER' | 'POST_LIKE' | 'POST_COMMENT' | 'COMMENT_REPLY' | 'MENTION' | 'ACHIEVEMENT' | 'LEVEL_UP' | 'PRICE_ALERT' | 'COMMUNITY_INVITE' | 'COMMUNITY_JOIN' | 'COMMUNITY_POST' | 'JOIN_REQUEST' | 'JOIN_APPROVED' | 'JOIN_REJECTED' | 'SYSTEM';
    title: string;
    message: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    actor_id: string | null;
    post_id: string | null;
    metadata: any;
    actor?: {
        id: string;
        name: string;
        lastname: string;
    };
}

export interface NotificationsResponse {
    data: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
}

/**
 * Get user notifications
 */
export function useNotifications(page: number = 1, unreadOnly: boolean = false) {
    return usePollingQuery({
        queryKey: ['notifications', page, unreadOnly],
        queryFn: async () => {
            const response = await apiClient.get<NotificationsResponse>(
                `/notifications?page=${page}&unread=${unreadOnly}`
            );
            return response.data;
        },
        refetchInterval: 60 * 1000, // 60s — seul l'onglet leader poll
        staleTime: 30000,
    });
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationCount() {
    return usePollingQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: async () => {
            const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
            return response.data.count;
        },
        refetchInterval: 67 * 1000, // 67s — décalé, seul l'onglet leader poll
        staleTime: 30000,
    });
}

/**
 * Mark a single notification as read
 */
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notificationId: string) => {
            const response = await apiClient.put(`/notifications/${notificationId}/read`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.put('/notifications/read-all');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        },
    });
}
