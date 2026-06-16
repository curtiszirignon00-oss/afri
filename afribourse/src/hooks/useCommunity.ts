// src/hooks/useCommunity.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

// ============= TYPES =============

export type CommunityVisibility = 'PUBLIC' | 'PRIVATE' | 'SECRET';
export type CommunityMemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
export type PostType = 'ANALYSIS' | 'TRANSACTION' | 'OPINION' | 'QUESTION' | 'ACHIEVEMENT' | 'ARTICLE' | 'TASK_LIST' | 'SURVEY';
export type CommunitySection = 'DEAL_FLOW' | 'RECAPS_REPLAYS' | 'MES_ANALYSES' | 'EXERCICES_CHALLENGES' | 'GENERAL' | 'ANNONCES';

export interface PostAttachment {
    url: string;
    name: string;
    size?: number;
}

export interface CommunityRule {
    title: string;
    description: string;
}

export interface CommunitySettings {
    allow_posts?: boolean;
    require_post_approval?: boolean;
    min_level?: number;
    allow_invitations?: boolean;
    sections_enabled?: boolean;
}

export interface CreateCommunityData {
    name: string;
    description?: string;
    avatar_url?: string;
    banner_url?: string;
    visibility?: CommunityVisibility;
    rules?: CommunityRule[];
    category?: string;
    tags?: string[];
    settings?: CommunitySettings;
}

export interface UpdateCommunityData extends Partial<CreateCommunityData> {}

export interface TaskItem {
    id: string;
    text: string;
    order: number;
}

export interface SurveyMeta {
    survey_type: 'multiple_choice' | 'open';
    question: string;
    options?: string[];
    responses_public: boolean;
}

export interface PostMetadata {
    tasks?: TaskItem[];
    survey?: SurveyMeta;
    achievement?: Record<string, unknown>;
    is_html?: boolean;
    html_url?: string;
    unlock_level?: number;
    locked?: boolean;
}

export interface TaskCheckMap {
    [taskId: string]: { count: number; checkedByMe: boolean };
}

export interface SurveyResponse {
    id: string;
    user_id: string;
    answer: { option_index?: number; text?: string };
    created_at: string;
    user: { id: string; name: string; lastname: string; profile?: { username?: string; avatar_url?: string } };
}

export interface CreateCommunityPostData {
    type?: PostType;
    content: string;
    title?: string;
    section?: CommunitySection;
    stock_symbol?: string;
    stock_price?: number;
    stock_change?: number;
    images?: string[];
    video_url?: string;
    attachments?: PostAttachment[];
    tags?: string[];
    metadata?: PostMetadata;
}

export interface Community {
    id: string;
    name: string;
    slug: string;
    description?: string;
    avatar_url?: string;
    banner_url?: string;
    visibility: CommunityVisibility;
    rules?: CommunityRule[];
    category?: string;
    tags: string[];
    settings?: CommunitySettings;
    members_count: number;
    posts_count: number;
    is_verified: boolean;
    is_featured: boolean;
    created_at: string;
    creator: {
        id: string;
        name: string;
        lastname: string;
        profile?: {
            username?: string;
            avatar_url?: string;
        };
    };
    isMember?: boolean;
    memberRole?: CommunityMemberRole | null;
    hasPendingRequest?: boolean;
}

export interface CommunityMember {
    id: string;
    user_id: string;
    role: CommunityMemberRole;
    joined_at: string;
    user: {
        id: string;
        name: string;
        lastname: string;
        profile?: {
            username?: string;
            avatar_url?: string;
            level?: number;
            verified_investor?: boolean;
            country?: string;
        };
    };
}

export interface CommunityPost {
    id: string;
    community_id: string;
    author_id: string;
    type: PostType;
    content: string;
    title?: string;
    stock_symbol?: string;
    stock_price?: number;
    stock_change?: number;
    images: string[];
    video_url?: string;
    tags: string[];
    likes_count: number;
    comments_count: number;
    views_count: number;
    is_pinned: boolean;
    created_at: string;
    updated_at: string;
    author: {
        id: string;
        name: string;
        lastname: string;
        profile?: {
            username?: string;
            avatar_url?: string;
            verified_investor?: boolean;
            level?: number;
            current_streak?: number;
            rare_badge?: { icon: string; rarity: string; name: string } | null;
        };
    };
    hasLiked?: boolean;
    metadata?: PostMetadata;
    section?: CommunitySection;
    attachments?: PostAttachment[];
}

// ============= COMMUNITY CRUD HOOKS =============

/**
 * Create a new community
 */
export function useCreateCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateCommunityData) => {
            const response = await apiClient.post('/communities', data);
            return response.data.data as Community;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['my-communities'] });
        },
    });
}

/**
 * Update a community
 */
export function useUpdateCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ communityId, data }: { communityId: string; data: UpdateCommunityData }) => {
            const response = await apiClient.put(`/communities/${communityId}`, data);
            return response.data.data as Community;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['community', variables.communityId] });
        },
    });
}

/**
 * Delete a community
 */
export function useDeleteCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (communityId: string) => {
            const response = await apiClient.delete(`/communities/${communityId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['my-communities'] });
        },
    });
}

/**
 * Get a community by ID or slug
 */
export function useCommunity(idOrSlug: string) {
    return useQuery({
        queryKey: ['community', idOrSlug],
        queryFn: async () => {
            const response = await apiClient.get(`/communities/${idOrSlug}`);
            return response.data.data as Community;
        },
        enabled: !!idOrSlug,
    });
}

/**
 * List communities with filters
 */
export function useCommunities(
    page: number = 1,
    options: {
        category?: string;
        search?: string;
        featured?: boolean;
        limit?: number;
    } = {}
) {
    const { category, search, featured, limit = 20 } = options;

    return useQuery({
        queryKey: ['communities', page, category, search, featured],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            if (category) params.append('category', category);
            if (search) params.append('search', search);
            if (featured) params.append('featured', 'true');

            const response = await apiClient.get(`/communities?${params.toString()}`);
            return response.data as {
                data: Community[];
                total: number;
                page: number;
                totalPages: number;
            };
        },
    });
}

/**
 * Get user's communities (joined and created)
 */
export function useUserCommunities(page: number = 1) {
    return useQuery({
        queryKey: ['my-communities', page],
        queryFn: async () => {
            const response = await apiClient.get(`/communities/my?page=${page}`);
            return response.data as {
                data: Community[];
                total: number;
                page: number;
                totalPages: number;
            };
        },
    });
}

// ============= MEMBERSHIP HOOKS =============

/**
 * Join a community
 */
export function useJoinCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (communityId: string) => {
            const response = await apiClient.post(`/communities/${communityId}/join`);
            return response.data as { status: 'joined' | 'pending' };
        },
        onSuccess: (_data, communityId) => {
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['my-communities'] });
        },
    });
}

/**
 * Leave a community
 */
export function useLeaveCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (communityId: string) => {
            const response = await apiClient.delete(`/communities/${communityId}/leave`);
            return response.data;
        },
        onSuccess: (_data, communityId) => {
            queryClient.invalidateQueries({ queryKey: ['community', communityId] });
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['my-communities'] });
        },
    });
}

/**
 * Process a join request (approve/reject)
 */
export function useProcessJoinRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            requestId,
            action,
            rejectReason,
        }: {
            requestId: string;
            action: 'approve' | 'reject';
            rejectReason?: string;
        }) => {
            const response = await apiClient.post(`/communities/join-requests/${requestId}/process`, {
                action,
                rejectReason,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['join-requests'] });
            queryClient.invalidateQueries({ queryKey: ['community-members'] });
        },
    });
}

/**
 * Get pending join requests for a community
 */
export function usePendingJoinRequests(communityId: string, page: number = 1) {
    return useQuery({
        queryKey: ['join-requests', communityId, page],
        queryFn: async () => {
            const response = await apiClient.get(`/communities/${communityId}/join-requests?page=${page}`);
            return response.data;
        },
        enabled: !!communityId,
    });
}

/**
 * Update a member's role
 */
export function useUpdateMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            communityId,
            memberId,
            role,
        }: {
            communityId: string;
            memberId: string;
            role: CommunityMemberRole;
        }) => {
            const response = await apiClient.put(`/communities/${communityId}/members/${memberId}/role`, { role });
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['community-members', variables.communityId] });
        },
    });
}

/**
 * Remove a member from community
 */
export function useRemoveMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ communityId, memberId }: { communityId: string; memberId: string }) => {
            const response = await apiClient.delete(`/communities/${communityId}/members/${memberId}`);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['community-members', variables.communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', variables.communityId] });
        },
    });
}

/**
 * Get community members
 */
export function useCommunityMembers(communityId: string, page: number = 1, role?: CommunityMemberRole) {
    return useQuery({
        queryKey: ['community-members', communityId, page, role],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            if (role) params.append('role', role);

            const response = await apiClient.get(`/communities/${communityId}/members?${params.toString()}`);
            return response.data as {
                data: CommunityMember[];
                total: number;
                page: number;
                totalPages: number;
            };
        },
        enabled: !!communityId,
    });
}

// ============= COMMUNITY POSTS HOOKS =============

/**
 * Create a post in a community
 */
export function useCreateCommunityPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ communityId, data }: { communityId: string; data: CreateCommunityPostData }) => {
            const response = await apiClient.post(`/communities/${communityId}/posts`, data);
            return response.data.data as CommunityPost;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['community-posts', variables.communityId] });
            queryClient.invalidateQueries({ queryKey: ['community', variables.communityId] });
        },
    });
}

/**
 * Upload images for a post — returns public URLs
 */
export function useUploadPostImages() {
    return useMutation({
        mutationFn: async (files: File[]) => {
            const formData = new FormData();
            files.forEach((f) => formData.append('images', f));
            const res = await apiClient.post('/upload/post-images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.data.images as string[];
        },
    });
}

/**
 * Upload a PDF document — returns { url, name, size }
 */
export function useUploadPdf() {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await apiClient.post('/upload/post-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.data as PostAttachment & { filename: string };
        },
    });
}

/**
 * Upload an HTML file (rich content: deal flow, analyses…) — returns { url, name }
 */
export function useUploadHtml() {
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await apiClient.post('/upload/post-html', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.data as { url: string; name: string; size: number; filename: string };
        },
    });
}

/**
 * Get a single community post (dedicated page for HTML content)
 */
export function useCommunityPost(postId: string) {
    return useQuery({
        queryKey: ['community-post', postId],
        queryFn: async () => {
            const res = await apiClient.get(`/communities/posts/${postId}`);
            return res.data.data as CommunityPost & {
                community?: { id: string; name: string; slug: string };
            };
        },
        enabled: !!postId,
    });
}

/**
 * Get posts in a community
 */
export function useCommunityPosts(communityId: string, page: number = 1, section?: CommunitySection) {
    return useQuery({
        queryKey: ['community-posts', communityId, page, section ?? null],
        queryFn: async () => {
            const params = new URLSearchParams({ page: String(page) });
            if (section) params.set('section', section);
            const response = await apiClient.get(`/communities/${communityId}/posts?${params.toString()}`);
            return response.data as {
                data: CommunityPost[];
                total: number;
                page: number;
                totalPages: number;
            };
        },
        enabled: !!communityId,
    });
}

/**
 * Like a community post
 */
export function useLikeCommunityPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await apiClient.post(`/communities/posts/${postId}/like`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

/**
 * Unlike a community post
 */
export function useUnlikeCommunityPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await apiClient.delete(`/communities/posts/${postId}/like`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

/**
 * Comment on a community post
 */
export function useCommentCommunityPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            postId,
            content,
            parentId,
        }: {
            postId: string;
            content: string;
            parentId?: string;
        }) => {
            const response = await apiClient.post(`/communities/posts/${postId}/comments`, { content, parentId });
            return response.data.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['community-post-comments', variables.postId] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

/**
 * Get comments for a community post
 */
export function useCommunityPostComments(postId: string, page: number = 1) {
    return useQuery({
        queryKey: ['community-post-comments', postId, page],
        queryFn: async () => {
            const response = await apiClient.get(`/communities/posts/${postId}/comments?page=${page}`);
            return response.data;
        },
        enabled: !!postId,
    });
}

/**
 * Delete a community post
 */
export function useDeleteCommunityPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await apiClient.delete(`/communities/posts/${postId}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

/**
 * Pin/unpin a community post
 */
export function useTogglePinPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (postId: string) => {
            const response = await apiClient.post(`/communities/posts/${postId}/pin`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

// ============= TASK LIST HOOKS =============

export function useTaskChecks(postId: string) {
    return useQuery({
        queryKey: ['task-checks', postId],
        queryFn: async () => {
            const res = await apiClient.get(`/communities/posts/${postId}/tasks/checks`);
            return res.data.data as TaskCheckMap;
        },
        enabled: !!postId,
    });
}

export function useToggleTaskCheck(postId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (taskId: string) => {
            const res = await apiClient.post(`/communities/posts/${postId}/tasks/${taskId}/check`);
            return res.data.data as { checked: boolean; taskId: string };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-checks', postId] });
        },
    });
}

// ============= SURVEY HOOKS =============

export function useSurveyResponses(postId: string, enabled: boolean) {
    return useQuery({
        queryKey: ['survey-responses', postId],
        queryFn: async () => {
            const res = await apiClient.get(`/communities/posts/${postId}/survey/responses`);
            return res.data.data as { responses: SurveyResponse[]; total: number | null; is_public: boolean };
        },
        enabled: !!postId && enabled,
    });
}

export function useSubmitSurveyResponse(postId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (answer: { option_index?: number; text?: string }) => {
            const res = await apiClient.post(`/communities/posts/${postId}/survey/respond`, { answer });
            return res.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey-responses', postId] });
        },
    });
}

export function useToggleSurveyPublic(postId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await apiClient.post(`/communities/posts/${postId}/survey/toggle-public`);
            return res.data.data as { responses_public: boolean };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey-responses', postId] });
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        },
    });
}

// ============= INVITE LINK HOOKS =============

export function useGetInviteLink() {
    return useMutation({
        mutationFn: async (communityId: string) => {
            const res = await apiClient.get(`/communities/${communityId}/invite`);
            return res.data.data as { invite_token: string; community_name: string };
        },
    });
}

export function useRegenerateInviteLink() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (communityId: string) => {
            const res = await apiClient.post(`/communities/${communityId}/invite/regenerate`);
            return res.data.data as { invite_token: string; community_name: string };
        },
        onSuccess: (_, communityId) => {
            queryClient.invalidateQueries({ queryKey: ['community-invite', communityId] });
        },
    });
}

export function useGetCommunityByInviteToken(token: string) {
    return useQuery({
        queryKey: ['community-invite-preview', token],
        queryFn: async () => {
            const res = await apiClient.get(`/communities/invite/${token}`);
            return res.data.data as {
                id: string; name: string; slug: string; description?: string;
                avatar_url?: string; visibility: CommunityVisibility; members_count: number;
                creator: { id: string; name: string; lastname: string; profile?: { username?: string; avatar_url?: string } };
            };
        },
        enabled: !!token,
        retry: false,
    });
}

export function useJoinByInvite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (token: string) => {
            const res = await apiClient.post(`/communities/invite/${token}/join`);
            return res.data.data as { status: 'joined' | 'already_member'; community: { slug: string; name: string } };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communities'] });
            queryClient.invalidateQueries({ queryKey: ['my-communities'] });
        },
    });
}

// ============= CATEGORY CONSTANTS =============

export const COMMUNITY_CATEGORIES = [
    { value: 'investissement', label: 'Investissement' },
    { value: 'trading', label: 'Trading' },
    { value: 'analyse', label: 'Analyse Technique' },
    { value: 'debutants', label: 'Débutants' },
    { value: 'brvm', label: 'BRVM' },
    { value: 'actualites', label: 'Actualités' },
    { value: 'education', label: 'Éducation' },
    { value: 'dividendes', label: 'Dividendes' },
    { value: 'secteur-bancaire', label: 'Secteur Bancaire' },
    { value: 'secteur-agricole', label: 'Secteur Agricole' },
    { value: 'autre', label: 'Autre' },
] as const;
