// src/hooks/useOnboarding.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { apiClient } from '../lib/api-client';

export interface OnboardingData {
    risk_profile: 'CONSERVATIVE' | 'MODERATE' | 'BALANCED' | 'GROWTH' | 'AGGRESSIVE';
    investment_horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM' | 'VERY_LONG_TERM';
    favorite_sectors: string[];
    investment_style?: string;
    monthly_investment?: number;
    investment_goals?: string[];
    experience_level?: string;
    quiz_score?: number;
}

/**
 * Check if user has completed onboarding
 */
export function useOnboardingStatus() {
    return useQuery({
        queryKey: ['onboarding', 'status'],
        queryFn: async () => {
            const response = await apiClient.get('/investor-profile/onboarding/status');
            return response.data.data;
        },
    });
}

/**
 * Complete onboarding questionnaire
 */
export function useCompleteOnboarding() {
    return useMutation({
        mutationFn: async (data: OnboardingData) => {
            const response = await apiClient.post('/investor-profile/onboarding/complete', data);
            return response.data.data;
        },
    });
}

/**
 * Get investor profile
 */
export function useInvestorProfile() {
    return useQuery({
        queryKey: ['investor-profile'],
        queryFn: async () => {
            const response = await apiClient.get('/investor-profile');
            return response.data.data;
        },
    });
}

/**
 * Update investor DNA
 */
export function useUpdateInvestorDNA() {
    return useMutation({
        mutationFn: async (data: Partial<OnboardingData>) => {
            const response = await apiClient.put('/investor-profile/dna', data);
            return response.data.data;
        },
    });
}

/**
 * Update privacy settings
 */
export function useUpdatePrivacySettings() {
    return useMutation({
        mutationFn: async (data: {
            portfolio_visibility?: 'PUBLIC' | 'FOLLOWERS' | 'PRIVATE';
            show_performance?: boolean;
            show_transactions?: boolean;
            show_holdings?: boolean;
        }) => {
            const response = await apiClient.put('/investor-profile/privacy', data);
            return response.data.data;
        },
    });
}

/**
 * Sync social stats (recalculate followers, following, posts counts)
 */
export function useSyncSocialStats() {
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/investor-profile/sync-stats');
            return response.data.data;
        },
    });
}

/**
 * Hook for managing onboarding redirection logic
 * Redirects user to onboarding if they haven't completed their investor DNA
 *
 * @param options.enabled - Whether to enable the redirect check (default: true)
 * @param options.redirectTo - Path to redirect incomplete users to (default: '/onboarding')
 * @param options.allowedPaths - Paths that don't require onboarding completion (e.g., ['/onboarding', '/logout'])
 */
export function useOnboardingRedirect(options?: {
    enabled?: boolean;
    redirectTo?: string;
    allowedPaths?: string[];
}) {
    const navigate = useNavigate();
    const { data: status, isLoading, error } = useOnboardingStatus();

    const {
        enabled = true,
        redirectTo = '/onboarding',
        allowedPaths = ['/onboarding', '/logout', '/login', '/signup']
    } = options || {};

    useEffect(() => {
        // Don't redirect if disabled or still loading
        if (!enabled || isLoading) return;

        // Don't redirect if we're already on an allowed path
        const currentPath = window.location.pathname;
        if (allowedPaths.some(path => currentPath.startsWith(path))) return;

        // Redirect if onboarding is not completed
        if (status && !status.completed) {
            console.log('🔄 Onboarding incomplete, redirecting to:', redirectTo);
            navigate(redirectTo, { replace: true });
        }
    }, [status, isLoading, enabled, navigate, redirectTo, allowedPaths]);

    return {
        isOnboardingComplete: status?.completed ?? false,
        isLoading,
        error,
        needsOnboarding: status ? !status.completed : false
    };
}
