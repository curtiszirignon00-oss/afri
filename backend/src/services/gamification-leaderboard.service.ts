// backend/src/services/gamification-leaderboard.service.ts
// Service pour les classements gamification (XP, pays, amis, ROI)
// Système de gamification AfriBourse

import { PrismaClient } from '@prisma/client';
import * as xpService from './xp.service';
import * as achievementService from './achievement.service';

const prisma = new PrismaClient();

// =====================================
// TYPES
// =====================================

export interface GamificationLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar_url: string | null;
  level: number;
  total_xp: number;
  title: string;
  title_emoji: string;
  country?: string;
  badges_count?: number;
}

export interface LeaderboardResponse {
  type: 'global' | 'country' | 'friends' | 'roi';
  entries: GamificationLeaderboardEntry[];
  user_rank?: number;
  user_entry?: GamificationLeaderboardEntry;
  total_participants: number;
  percentile?: number;
  updated_at: Date;
}

// =====================================
// CLASSEMENT GLOBAL (PAR XP)
// =====================================

/**
 * Récupère le classement global par XP total
 */
export async function getGlobalLeaderboard(
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardResponse> {
  try {
    const profiles = await prisma.userProfile.findMany({
      where: { total_xp: { gt: 0 } },
      orderBy: { total_xp: 'desc' },
      skip: offset,
      take: limit,
      select: {
        userId: true,
        username: true,
        avatar_url: true,
        level: true,
        total_xp: true,
        global_rank: true,
        country: true
      }
    });

    const totalParticipants = await prisma.userProfile.count({
      where: { total_xp: { gt: 0 } }
    });

    const entries: GamificationLeaderboardEntry[] = profiles.map((profile, index) => {
      const { title, emoji } = xpService.getLevelTitle(profile.level);
      return {
        rank: offset + index + 1,
        userId: profile.userId,
        username: profile.username || 'Utilisateur',
        avatar_url: profile.avatar_url,
        level: profile.level,
        total_xp: profile.total_xp,
        title,
        title_emoji: emoji,
        country: profile.country || undefined
      };
    });

    return {
      type: 'global',
      entries,
      total_participants: totalParticipants,
      updated_at: new Date()
    };

  } catch (error) {
    console.error('❌ Erreur getGlobalLeaderboard:', error);
    throw error;
  }
}

/**
 * Récupère le classement global avec la position de l'utilisateur
 */
export async function getGlobalLeaderboardWithUserRank(
  userId: string,
  limit: number = 100
): Promise<LeaderboardResponse> {
  try {
    const leaderboard = await getGlobalLeaderboard(limit);

    // Récupérer le profil de l'utilisateur
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        global_rank: true,
        total_xp: true,
        level: true,
        username: true,
        avatar_url: true,
        country: true
      }
    });

    if (userProfile && userProfile.global_rank) {
      const { title, emoji } = xpService.getLevelTitle(userProfile.level);
      const percentile = ((leaderboard.total_participants - userProfile.global_rank) / leaderboard.total_participants) * 100;

      leaderboard.user_rank = userProfile.global_rank;
      leaderboard.percentile = Math.round(percentile * 10) / 10;
      leaderboard.user_entry = {
        rank: userProfile.global_rank,
        userId,
        username: userProfile.username || 'Utilisateur',
        avatar_url: userProfile.avatar_url,
        level: userProfile.level,
        total_xp: userProfile.total_xp,
        title,
        title_emoji: emoji,
        country: userProfile.country || undefined
      };
    }

    return leaderboard;

  } catch (error) {
    console.error('❌ Erreur getGlobalLeaderboardWithUserRank:', error);
    throw error;
  }
}

// =====================================
// CLASSEMENT PAR PAYS
// =====================================

/**
 * Récupère le classement par pays
 */
export async function getCountryLeaderboard(
  countryCode: string,
  limit: number = 50
): Promise<LeaderboardResponse> {
  try {
    const profiles = await prisma.userProfile.findMany({
      where: {
        total_xp: { gt: 0 },
        country: countryCode
      },
      orderBy: { total_xp: 'desc' },
      take: limit,
      select: {
        userId: true,
        username: true,
        avatar_url: true,
        level: true,
        total_xp: true,
        country_rank: true
      }
    });

    const totalParticipants = await prisma.userProfile.count({
      where: {
        total_xp: { gt: 0 },
        country: countryCode
      }
    });

    const entries: GamificationLeaderboardEntry[] = profiles.map((profile, index) => {
      const { title, emoji } = xpService.getLevelTitle(profile.level);
      return {
        rank: index + 1,
        userId: profile.userId,
        username: profile.username || 'Utilisateur',
        avatar_url: profile.avatar_url,
        level: profile.level,
        total_xp: profile.total_xp,
        title,
        title_emoji: emoji,
        country: countryCode
      };
    });

    return {
      type: 'country',
      entries,
      total_participants: totalParticipants,
      updated_at: new Date()
    };

  } catch (error) {
    console.error('❌ Erreur getCountryLeaderboard:', error);
    throw error;
  }
}

/**
 * Récupère le classement du pays de l'utilisateur avec sa position
 */
export async function getCountryLeaderboardForUser(
  userId: string,
  limit: number = 50
): Promise<LeaderboardResponse> {
  try {
    // Récupérer le profil utilisateur avec le pays et les stats
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        country: true,
        country_rank: true,
        total_xp: true,
        level: true,
        username: true,
        avatar_url: true
      }
    });

    if (!userProfile?.country) {
      return {
        type: 'country',
        entries: [],
        total_participants: 0,
        updated_at: new Date()
      };
    }

    const leaderboard = await getCountryLeaderboard(userProfile.country, limit);

    if (userProfile.country_rank) {
      const { title, emoji } = xpService.getLevelTitle(userProfile.level);
      const percentile = ((leaderboard.total_participants - userProfile.country_rank) / leaderboard.total_participants) * 100;

      leaderboard.user_rank = userProfile.country_rank;
      leaderboard.percentile = Math.round(percentile * 10) / 10;
      leaderboard.user_entry = {
        rank: userProfile.country_rank,
        userId,
        username: userProfile.username || 'Utilisateur',
        avatar_url: userProfile.avatar_url,
        level: userProfile.level,
        total_xp: userProfile.total_xp,
        title,
        title_emoji: emoji,
        country: userProfile.country
      };
    }

    return leaderboard;

  } catch (error) {
    console.error('❌ Erreur getCountryLeaderboardForUser:', error);
    throw error;
  }
}

// =====================================
// CLASSEMENT AMIS
// =====================================

/**
 * Récupère le classement parmi les amis (abonnements)
 * Temps réel - pas de cache
 */
export async function getFriendsLeaderboard(userId: string): Promise<LeaderboardResponse> {
  try {
    // Récupérer les IDs des personnes suivies
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const friendIds = following.map(f => f.followingId);
    friendIds.push(userId); // Inclure l'utilisateur lui-même

    // Récupérer les profils des amis triés par XP
    const profiles = await prisma.userProfile.findMany({
      where: {
        userId: { in: friendIds },
        total_xp: { gt: 0 }
      },
      orderBy: { total_xp: 'desc' },
      select: {
        userId: true,
        username: true,
        avatar_url: true,
        level: true,
        total_xp: true
      }
    });

    const entries: GamificationLeaderboardEntry[] = profiles.map((profile, index) => {
      const { title, emoji } = xpService.getLevelTitle(profile.level);
      return {
        rank: index + 1,
        userId: profile.userId,
        username: profile.username || 'Utilisateur',
        avatar_url: profile.avatar_url,
        level: profile.level,
        total_xp: profile.total_xp,
        title,
        title_emoji: emoji
      };
    });

    // Trouver le rang de l'utilisateur
    const userRank = entries.findIndex(e => e.userId === userId) + 1;
    const userEntry = entries.find(e => e.userId === userId);

    return {
      type: 'friends',
      entries,
      user_rank: userRank > 0 ? userRank : undefined,
      user_entry: userEntry,
      total_participants: entries.length,
      updated_at: new Date()
    };

  } catch (error) {
    console.error('❌ Erreur getFriendsLeaderboard:', error);
    throw error;
  }
}

// =====================================
// CLASSEMENT ROI MENSUEL
// =====================================

/**
 * Récupère le classement ROI du mois
 */
export async function getMonthlyROILeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
  try {
    // Récupérer tous les portfolios SANDBOX avec leurs performances
    const portfolios = await prisma.portfolio.findMany({
      where: {
        wallet_type: 'SANDBOX',
        status: 'ACTIVE'
      },
      include: {
        positions: true,
        user: {
          select: {
            name: true,
            lastname: true,
            profile: {
              select: {
                username: true,
                avatar_url: true,
                level: true
              }
            }
          }
        }
      }
    });

    // Calculer le ROI pour chaque portfolio
    const performances = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Calculer la valeur des positions
        let positionsValue = 0;
        for (const position of portfolio.positions) {
          const stock = await prisma.stock.findUnique({
            where: { symbol: position.stock_ticker },
            select: { current_price: true }
          });
          if (stock) {
            positionsValue += position.quantity * stock.current_price;
          }
        }

        const totalValue = portfolio.cash_balance + positionsValue;
        const roi = ((totalValue - portfolio.initial_balance) / portfolio.initial_balance) * 100;

        const displayName = portfolio.user
          ? `${portfolio.user.name} ${portfolio.user.lastname}`.trim()
          : null;

        return {
          userId: portfolio.userId,
          username: displayName || portfolio.user?.profile?.username || 'Utilisateur',
          avatar_url: portfolio.user?.profile?.avatar_url || null,
          level: portfolio.user?.profile?.level || 1,
          roi,
          total_value: totalValue
        };
      })
    );

    // Trier par ROI et prendre le top
    const sortedPerformances = performances
      .filter(p => p.roi !== null && !isNaN(p.roi))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, limit);

    const entries: GamificationLeaderboardEntry[] = sortedPerformances.map((perf, index) => {
      const { title, emoji } = xpService.getLevelTitle(perf.level);
      return {
        rank: index + 1,
        userId: perf.userId,
        username: perf.username,
        avatar_url: perf.avatar_url,
        level: perf.level,
        total_xp: Math.round(perf.roi * 100), // Utiliser ROI comme "XP" pour l'affichage
        title,
        title_emoji: emoji
      };
    });

    return {
      type: 'roi',
      entries,
      total_participants: performances.length,
      updated_at: new Date()
    };

  } catch (error) {
    console.error('❌ Erreur getMonthlyROILeaderboard:', error);
    throw error;
  }
}

// =====================================
// CALCUL DES RANGS (CRON JOB)
// =====================================

/**
 * Calcule et met à jour les rangs globaux et par pays
 * Appelé par le CRON job à 02h00
 */
export async function calculateAllRankings() {
  try {
    console.log('📊 Calcul des classements gamification...');

    // Récupérer tous les profils avec XP > 0
    const profiles = await prisma.userProfile.findMany({
      where: { total_xp: { gt: 0 } },
      orderBy: { total_xp: 'desc' },
      select: {
        userId: true,
        total_xp: true,
        country: true
      }
    });

    console.log(`   📈 ${profiles.length} profils à classer`);

    // Calculer le rang global
    const countryRanks: { [country: string]: number } = {};
    let globalRank = 1;

    for (const profile of profiles) {
      const country = profile.country || 'unknown';

      // Initialiser le rang par pays
      if (!countryRanks[country]) {
        countryRanks[country] = 1;
      }

      // Mettre à jour les rangs
      await prisma.userProfile.update({
        where: { userId: profile.userId },
        data: {
          global_rank: globalRank,
          country_rank: countryRanks[country]
        }
      });

      globalRank++;
      countryRanks[country]++;
    }

    const countriesCount = Object.keys(countryRanks).length;

    console.log(`✅ Classements calculés:`);
    console.log(`   - Profils classés: ${profiles.length}`);
    console.log(`   - Pays: ${countriesCount}`);

    // Attribuer les récompenses de classement
    await distributeRankingRewards(profiles.length);

    return {
      profiles_ranked: profiles.length,
      countries: countriesCount
    };

  } catch (error) {
    console.error('❌ Erreur calculateAllRankings:', error);
    throw error;
  }
}

/**
 * Distribue les récompenses de classement
 */
async function distributeRankingRewards(totalParticipants: number) {
  try {
    // Top 1: Champion
    const top1 = await prisma.userProfile.findFirst({
      where: { global_rank: 1 },
      select: { userId: true }
    });

    if (top1) {
      // TODO: Vérifier si déjà récompensé cette semaine
      // Pour l'instant, on log seulement
      console.log(`   🥇 Champion: ${top1.userId}`);
    }

    // Top 2-3: Podium
    const podium = await prisma.userProfile.findMany({
      where: { global_rank: { in: [2, 3] } },
      select: { userId: true, global_rank: true }
    });

    for (const user of podium) {
      console.log(`   🥈🥉 Podium #${user.global_rank}: ${user.userId}`);
    }

    // Top 10%
    const top10PercentRank = Math.ceil(totalParticipants * 0.1);
    const top10Percent = await prisma.userProfile.findMany({
      where: {
        global_rank: { lte: top10PercentRank }
      },
      select: { userId: true }
    });

    // Vérifier et débloquer le badge top_10_percent
    for (const user of top10Percent) {
      await achievementService.unlockAchievement(user.userId, 'top_10_percent');
    }

    console.log(`   🏆 Top 10% (${top10Percent.length} utilisateurs) - badge attribué`);

  } catch (error) {
    console.error('❌ Erreur distributeRankingRewards:', error);
  }
}

// =====================================
// CLASSEMENT STREAKS
// =====================================

/**
 * Récupère le classement par streak
 */
export async function getStreakLeaderboard(limit: number = 50): Promise<LeaderboardResponse> {
  try {
    const profiles = await prisma.userProfile.findMany({
      where: { current_streak: { gt: 0 } },
      orderBy: { current_streak: 'desc' },
      take: limit,
      select: {
        userId: true,
        username: true,
        avatar_url: true,
        level: true,
        total_xp: true,
        current_streak: true,
        longest_streak: true
      }
    });

    const totalParticipants = await prisma.userProfile.count({
      where: { current_streak: { gt: 0 } }
    });

    const entries: GamificationLeaderboardEntry[] = profiles.map((profile, index) => {
      const { title, emoji } = xpService.getLevelTitle(profile.level);
      return {
        rank: index + 1,
        userId: profile.userId,
        username: profile.username || 'Utilisateur',
        avatar_url: profile.avatar_url,
        level: profile.level,
        total_xp: profile.current_streak, // Utiliser streak comme valeur affichée
        title,
        title_emoji: emoji
      };
    });

    return {
      type: 'global', // Sous-type streak
      entries,
      total_participants: totalParticipants,
      updated_at: new Date()
    };

  } catch (error) {
    console.error('❌ Erreur getStreakLeaderboard:', error);
    throw error;
  }
}
