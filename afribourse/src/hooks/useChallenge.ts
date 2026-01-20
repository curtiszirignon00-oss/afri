// src/hooks/useChallenge.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

// ============= TYPES =============

export interface ChallengeStatus {
    enrolled: boolean;
    status?: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
    enrollmentDate?: string;
    validTransactions?: number;
    isEligible?: boolean;
    acceptedRules?: boolean;
    walletId?: string;
}

export interface EnrollmentData {
    experienceLevel: string;
    hasRealAccount: boolean;
    discoverySource: string;
    primaryGoal: string;
    preferredSector: string;
    referralCode?: string;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    lastname: string;
    username?: string;
    avatar_url?: string;
    totalValue: number;
    gainLoss: number;
    gainLossPercent: number;
    validTransactions: number;
    isEligible: boolean;
}

export interface ChallengeStats {
    totalParticipants: number;
    activeParticipants: number;
    eligibleParticipants: number;
    bannedParticipants: number;
    totalTransactions: number;
}

export interface WeeklyStocks {
    top3: Array<{
        ticker: string;
        company_name: string;
        current_price: number;
        change_percent: number;
        tradingVolume: number;
    }>;
    flop3: Array<{
        ticker: string;
        company_name: string;
        current_price: number;
        change_percent: number;
        tradingVolume: number;
    }>;
}

// ============= QUERIES =============

/**
 * Récupère le statut de participation de l'utilisateur
 */
export function useChallengeStatus() {
    return useQuery({
        queryKey: ['challenge', 'status'],
        queryFn: async () => {
            const response = await apiClient.get('/challenge/status');
            return response.data.data as ChallengeStatus;
        },
        retry: 1,
    });
}

/**
 * Récupère le leaderboard
 */
export function useLeaderboard(limit: number = 20) {
    return useQuery({
        queryKey: ['challenge', 'leaderboard', limit],
        queryFn: async () => {
            const response = await apiClient.get(`/challenge/leaderboard?limit=${limit}`);
            return response.data.data as LeaderboardEntry[];
        },
        staleTime: 5 * 60 * 1000, // Cache 5 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch toutes les 5 min
    });
}

/**
 * Récupère le rang de l'utilisateur
 */
export function useMyRank() {
    return useQuery({
        queryKey: ['challenge', 'myRank'],
        queryFn: async () => {
            const response = await apiClient.get('/challenge/my-rank');
            return response.data.data as {
                rank: number | null;
                totalParticipants: number;
                percentile?: number;
            };
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Récupère les statistiques globales du challenge
 */
export function useChallengeStats() {
    return useQuery({
        queryKey: ['challenge', 'stats'],
        queryFn: async () => {
            const response = await apiClient.get('/challenge/statistics');
            return response.data.data as ChallengeStats;
        },
        staleTime: 10 * 60 * 1000, // Cache 10 minutes
    });
}

/**
 * Récupère les Top/Flop 3 actions de la semaine
 */
export function useWeeklyStocks() {
    return useQuery({
        queryKey: ['challenge', 'weeklyStocks'],
        queryFn: async () => {
            const response = await apiClient.get('/challenge/weekly-stocks');
            return response.data.data as WeeklyStocks;
        },
        staleTime: 30 * 60 * 1000, // Cache 30 minutes
    });
}

/**
 * Récupère les infos publiques du challenge
 */
export function useChallengeInfo() {
    return useQuery({
        queryKey: ['challenge', 'info'],
        queryFn: async () => {
            const response = await apiClient.get('/challenge/info');
            return response.data.data;
        },
    });
}

// ============= MUTATIONS =============

/**
 * Inscription au Challenge
 */
export function useEnrollInChallenge() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: EnrollmentData) => {
            const response = await apiClient.post('/challenge/enroll', data);
            return response.data;
        },
        onSuccess: () => {
            // Invalider les queries pour rafraîchir le statut
            queryClient.invalidateQueries({ queryKey: ['challenge', 'status'] });
            queryClient.invalidateQueries({ queryKey: ['challenge', 'stats'] });
            queryClient.invalidateQueries({ queryKey: ['portfolios'] }); // Refresh portfolios
        },
    });
}

/**
 * Acceptation du règlement
 */
export function useAcceptRules() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post('/challenge/accept-rules');
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['challenge', 'status'] });
        },
    });
}

// ============= HELPER HOOKS =============

/**
 * Hook pour vérifier si le trading est autorisé
 */
export function useCanTrade(walletType: 'SANDBOX' | 'CONCOURS'): {
    canTrade: boolean;
    reason?: string;
} {
    if (walletType === 'SANDBOX') {
        return { canTrade: true };
    }

    // Check weekend
    const now = new Date();
    const day = now.getDay();
    if (day === 0 || day === 6) {
        return {
            canTrade: false,
            reason: 'Trading interdit le weekend pour le wallet Concours. Revenez du lundi au vendredi.',
        };
    }

    // Check date ouverture
    const launchDate = new Date('2026-02-02T00:00:00Z');
    if (now < launchDate) {
        const daysRemaining = Math.ceil((launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
            canTrade: false,
            reason: `Le Challenge AfriBourse ouvre le 2 février 2026 (dans ${daysRemaining} jours).`,
        };
    }

    return { canTrade: true };
}

/**
 * Hook pour vérifier si le challenge est ouvert
 */
export function useIsChallengeOpen(): boolean {
    const launchDate = new Date('2026-02-02T00:00:00Z');
    return Date.now() >= launchDate.getTime();
}
