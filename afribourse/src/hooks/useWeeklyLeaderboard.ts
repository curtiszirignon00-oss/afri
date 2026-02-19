// src/hooks/useWeeklyLeaderboard.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatar_url: string | null;
    level: number;
    total_xp: number; // ROI * 100 for ROI leaderboard
    title: string;
    title_emoji: string;
}

interface LeaderboardResponse {
    type: string;
    entries: LeaderboardEntry[];
    total_participants: number;
    updated_at: string;
}

export function useWeeklyLeaderboard(limit: number = 5) {
    return useQuery<LeaderboardResponse>({
        queryKey: ['weekly-leaderboard', limit],
        queryFn: async () => {
            const response = await apiClient.get<LeaderboardResponse>(
                `/gamification/leaderboard/roi?limit=${limit}`
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
    });
}
