// src/hooks/useSocial.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface CreatePostData {
    type: 'ANALYSIS' | 'TRANSACTION' | 'OPINION' | 'QUESTION' | 'ACHIEVEMENT' | 'ARTICLE';
    content: string;
    title?: string;
    stock_symbol?: string;
    stock_price?: number;
    stock_change?: number;
    images?: string[];
    video_url?: string;
    tags?: string[];
    visibility?: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
}

/**
 * Follow a user
 */
export function useFollowUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await apiClient.post(`/social/follow/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            queryClient.invalidateQueries({ queryKey: ['following'] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
        },
    });
}

/**
 * Unfollow a user
 */
export function useUnfollowUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await apiClient.delete(`/social/follow/${userId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['followers'] });
            queryClient.invalidateQueries({ queryKey: ['following'] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
        },
    });
}

/**
 * Get followers list
 */
export function useFollowers(userId: string, page: number = 1) {
    return useQuery({
        queryKey: ['followers', userId, page],
        queryFn: async () => {
            const response = await apiClient.get(`/social/followers/${userId}?page=${page}`);
            return response.data;
        },
    });
}

/**
 * Get following list
 */
export function useFollowing(userId: string, page: number = 1) {
    return useQuery({
        queryKey: ['following', userId, page],
        queryFn: async () => {
            const response = await apiClient.get(`/social/following/${userId}?page=${page}`);
            return response.data;
        },
    });
}

/**
 * Create a post
 */
export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreatePostData) => {
            const response = await apiClient.post('/social/posts', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
        },
    });
}

/**
 * Like a post
 */
export function useLikePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await apiClient.post(`/social/posts/${postId}/like`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
        },
    });
}

/**
 * Unlike a post
 */
export function useUnlikePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await apiClient.delete(`/social/posts/${postId}/like`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
        },
    });
}

/**
 * Comment on a post
 */
export function useCommentPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
            const response = await apiClient.post(`/social/posts/${postId}/comments`, { content, parentId });
            return response.data.data;
        },
        onSuccess: (_data, variables) => {
            // Invalidate all comments queries for this post
            queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
            // Also invalidate post lists to update comment counts
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

/**
 * Get user feed
 */
export function useFeed(page: number = 1) {
    return useQuery({
        queryKey: ['feed', page],
        queryFn: async () => {
            const response = await apiClient.get(`/social/feed?page=${page}`);
            return response.data;
        },
    });
}

/**
 * Get user posts
 */
export function useUserPosts(userId: string, page: number = 1) {
    return useQuery({
        queryKey: ['user-posts', userId, page],
        queryFn: async () => {
            const response = await apiClient.get(`/social/posts/${userId}?page=${page}`);
            return response.data;
        },
    });
}

/**
 * Get post comments
 */
export function usePostComments(postId: string, page: number = 1) {
    return useQuery({
        queryKey: ['comments', postId, page],
        queryFn: async () => {
            const response = await apiClient.get(`/social/posts/${postId}/comments?page=${page}`);
            return response.data;
        },
        enabled: !!postId,
    });
}

/**
 * Update a post
 */
export function useUpdatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ postId, data }: { postId: string; data: Partial<CreatePostData> }) => {
            const response = await apiClient.put(`/social/post/${postId}`, data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

/**
 * Delete a post
 */
export function useDeletePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await apiClient.delete(`/social/post/${postId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['investor-profile'] });
        },
    });
}

/**
 * Get a single post
 */
export function usePost(postId: string) {
    return useQuery({
        queryKey: ['post', postId],
        queryFn: async () => {
            const response = await apiClient.get(`/social/post/${postId}`);
            return response.data.data;
        },
        enabled: !!postId,
    });
}
