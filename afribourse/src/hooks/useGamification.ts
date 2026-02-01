// src/hooks/useGamification.ts
// Hooks pour le système de gamification AfriBourse

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import type {
  XPStats,
  XPHistoryEntry,
  StreakData,
  Achievement,
  UserAchievement,
  WeeklyChallenge,
  ChallengeProgress,
  GamificationLeaderboardResponse,
  Reward,
  UserReward,
  GamificationSummary
} from '../types';

// ============= XP & LEVEL HOOKS =============

/**
 * Récupère les stats XP de l'utilisateur connecté
 */
export function useXPStats() {
  return useQuery({
    queryKey: ['gamification', 'xp', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/xp/me');
      return response.data as XPStats;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Récupère l'historique XP de l'utilisateur
 */
export function useXPHistory(limit: number = 20) {
  return useQuery({
    queryKey: ['gamification', 'xp', 'history', limit],
    queryFn: async () => {
      const response = await apiClient.get(`/gamification/xp/history?limit=${limit}`);
      return response.data as XPHistoryEntry[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============= STREAK HOOKS =============

/**
 * Récupère les données de streak de l'utilisateur
 */
export function useStreak() {
  return useQuery({
    queryKey: ['gamification', 'streak'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/streak/me');
      return response.data as StreakData;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Utiliser un freeze de streak
 */
export function useStreakFreeze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/gamification/streak/freeze');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'streak'] });
    },
  });
}

// ============= ACHIEVEMENT HOOKS =============

/**
 * Récupère tous les badges disponibles
 */
export function useAllAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/achievements');
      return response.data as Achievement[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (static data)
  });
}

/**
 * Récupère les badges de l'utilisateur
 */
export function useMyAchievements() {
  return useQuery({
    queryKey: ['gamification', 'achievements', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/achievements/me');
      return response.data as UserAchievement[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Récupère les badges par catégorie
 */
export function useAchievementsByCategory(category: string) {
  return useQuery({
    queryKey: ['gamification', 'achievements', 'category', category],
    queryFn: async () => {
      const response = await apiClient.get(`/gamification/achievements/category/${category}`);
      return response.data as Achievement[];
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ============= WEEKLY CHALLENGE HOOKS =============

/**
 * Récupère les défis de la semaine
 */
export function useWeeklyChallenges() {
  return useQuery({
    queryKey: ['gamification', 'challenges', 'weekly'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/challenges');
      return (response.data.challenges || response.data) as WeeklyChallenge[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Récupère ma progression des défis
 */
export function useMyChallengesProgress() {
  return useQuery({
    queryKey: ['gamification', 'challenges', 'progress'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/challenges/progress');
      return (response.data.challenges || response.data) as ChallengeProgress[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Réclamer la récompense d'un défi
 */
export function useClaimChallengeReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiClient.post(`/gamification/challenges/${challengeId}/claim`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'challenges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'xp'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'achievements'] });
    },
  });
}

/**
 * Réclamer toutes les récompenses de défis complétés
 */
export function useClaimAllChallengeRewards() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/gamification/challenges/claim-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
}

// ============= LEADERBOARD HOOKS =============

/**
 * Récupère le classement global
 */
export function useGlobalLeaderboard(limit: number = 50) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', 'global', limit],
    queryFn: async () => {
      const response = await apiClient.get(`/gamification/leaderboard/global?limit=${limit}`);
      return response.data as GamificationLeaderboardResponse;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Récupère le classement par pays
 */
export function useCountryLeaderboard(countryCode?: string, limit: number = 50) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', 'country', countryCode, limit],
    queryFn: async () => {
      const url = countryCode
        ? `/gamification/leaderboard/country?country=${countryCode}&limit=${limit}`
        : `/gamification/leaderboard/country?limit=${limit}`;
      const response = await apiClient.get(url);
      return response.data as GamificationLeaderboardResponse;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Récupère le classement des amis
 */
export function useFriendsLeaderboard() {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', 'friends'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/leaderboard/friends');
      return response.data as GamificationLeaderboardResponse;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Récupère le classement par streak
 */
export function useStreakLeaderboard(limit: number = 50) {
  return useQuery({
    queryKey: ['gamification', 'leaderboard', 'streak', limit],
    queryFn: async () => {
      const response = await apiClient.get(`/gamification/leaderboard/streaks?limit=${limit}`);
      return response.data as GamificationLeaderboardResponse;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============= REWARD HOOKS =============

/**
 * Récupère toutes les récompenses disponibles
 */
export function useAllRewards() {
  return useQuery({
    queryKey: ['gamification', 'rewards', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/rewards');
      return response.data as Reward[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Récupère mes récompenses réclamées
 */
export function useMyRewards() {
  return useQuery({
    queryKey: ['gamification', 'rewards', 'me'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/rewards/me');
      return response.data as UserReward[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Réclamer une récompense
 */
export function useClaimReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await apiClient.post(`/gamification/rewards/${rewardId}/claim`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'rewards'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'xp'] });
      queryClient.invalidateQueries({ queryKey: ['portfolios'] }); // In case of virtual cash reward
    },
  });
}

// ============= SUMMARY HOOK =============

/**
 * Récupère le résumé complet de gamification
 */
export function useGamificationSummary() {
  return useQuery({
    queryKey: ['gamification', 'summary'],
    queryFn: async () => {
      const response = await apiClient.get('/gamification/summary');
      return response.data as GamificationSummary;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// ============= HELPER HOOKS =============

/**
 * Calcule le niveau à partir de l'XP total
 * Formule: XP requis niveau N = 50 × N × (N + 1)
 */
export function calculateLevelFromXP(totalXP: number): number {
  // XP cumulé pour atteindre le niveau N = somme de 50 × k × (k+1) pour k de 1 à N-1
  // Résolution: trouver le plus grand N tel que XP_cumulé(N) <= totalXP
  let level = 1;
  let cumulativeXP = 0;

  while (cumulativeXP <= totalXP) {
    const xpForNextLevel = 50 * level * (level + 1);
    if (cumulativeXP + xpForNextLevel > totalXP) break;
    cumulativeXP += xpForNextLevel;
    level++;
  }

  return level;
}

/**
 * Calcule l'XP nécessaire pour le prochain niveau
 */
export function getXPForNextLevel(level: number): number {
  return 50 * level * (level + 1);
}

/**
 * Retourne le titre et l'emoji du niveau
 */
export function getLevelTitle(level: number): { title: string; emoji: string } {
  if (level >= 100) return { title: 'Immortel', emoji: '🌟' };
  if (level >= 80) return { title: 'Titan', emoji: '💎' };
  if (level >= 65) return { title: 'Champion', emoji: '👑' };
  if (level >= 50) return { title: 'Légende', emoji: '⭐' };
  if (level >= 40) return { title: 'Maître', emoji: '🏆' };
  if (level >= 30) return { title: 'Expert', emoji: '🎯' };
  if (level >= 20) return { title: 'Trader', emoji: '📊' };
  if (level >= 10) return { title: 'Investisseur', emoji: '💼' };
  if (level >= 5) return { title: 'Apprenti', emoji: '📚' };
  return { title: 'Débutant', emoji: '🌱' };
}

/**
 * Hook combiné pour obtenir toutes les données de gamification d'un coup
 */
export function useGamification() {
  const xpStats = useXPStats();
  const streak = useStreak();
  const achievements = useMyAchievements();
  const challenges = useMyChallengesProgress();

  return {
    xp: xpStats,
    streak,
    achievements,
    challenges,
    isLoading: xpStats.isLoading || streak.isLoading || achievements.isLoading || challenges.isLoading,
    isError: xpStats.isError || streak.isError || achievements.isError || challenges.isError,
  };
}
