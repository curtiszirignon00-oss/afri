// backend/src/services/gamification-leaderboard.service.ts
// Service pour les classements gamification (XP, pays, amis, ROI)
// Système de gamification AfriBourse

import { prisma } from '../config/database';
import * as xpService from './xp.service';
import * as achievementService from './achievement.service';

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
  rank_streak_days?: number; // Nombre de jours consécutifs à cette position (top 3 uniquement)
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
                level: true,
                roi_rank: true,
                roi_rank_held_since: true
              }
            }
          }
        }
      }
    });

    // Récupérer tous les prix en une seule requête (évite le N+1)
    const allTickers = [...new Set(portfolios.flatMap(p => p.positions.map(pos => pos.stock_ticker)))];
    const stockRows = await prisma.stock.findMany({
      where: { symbol: { in: allTickers } },
      select: { symbol: true, current_price: true }
    });
    const priceMap = new Map(stockRows.map(s => [s.symbol, s.current_price]));

    // Calculer le ROI pour chaque portfolio (sans requête DB supplémentaire)
    const performances = portfolios.map((portfolio) => {
      let positionsValue = 0;
      for (const position of portfolio.positions) {
        const price = priceMap.get(position.stock_ticker);
        if (price !== undefined) positionsValue += position.quantity * price;
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
        roi_rank_held_since: portfolio.user?.profile?.roi_rank_held_since || null,
        roi,
        total_value: totalValue
      };
    });

    // Trier par ROI et prendre le top
    const now = new Date();
    const sortedPerformances = performances
      .filter(p => p.roi !== null && !isNaN(p.roi))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, limit);

    const entries: GamificationLeaderboardEntry[] = sortedPerformances.map((perf, index) => {
      const { title, emoji } = xpService.getLevelTitle(perf.level);
      const rank = index + 1;

      // Calculer le nombre de jours consécutifs à cette position (top 3 uniquement)
      // +1 : le jour où on prend la place compte comme jour 1
      // null → 1j par défaut (première exécution avant le cron)
      let rank_streak_days: number | undefined;
      if (rank <= 3) {
        if (perf.roi_rank_held_since) {
          rank_streak_days = Math.floor((now.getTime() - new Date(perf.roi_rank_held_since).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        } else {
          rank_streak_days = 1; // Fallback avant la première initialisation par le cron
        }
      }

      return {
        rank,
        userId: perf.userId,
        username: perf.username,
        avatar_url: perf.avatar_url,
        level: perf.level,
        total_xp: Math.round(perf.roi * 100), // Utiliser ROI comme "XP" pour l'affichage
        title,
        title_emoji: emoji,
        rank_streak_days
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
// MISE À JOUR STREAK ROI TOP 3
// =====================================

/**
 * Met à jour roi_rank et roi_rank_held_since pour le top 3 ROI (SANDBOX).
 * - Si même rang qu'hier → roi_rank_held_since inchangé (streak continue)
 * - Si rang différent ou première fois → roi_rank_held_since = maintenant
 * - Si sorti du top 3 → roi_rank et roi_rank_held_since remis à null
 * Appelé par le CRON job à 02h00 après updateRankings.
 */
export async function updateROITopRanks(): Promise<{ updated: number; reset: number }> {
  try {
    // 1. Récupérer tous les portfolios SANDBOX actifs avec positions
    const portfolios = await prisma.portfolio.findMany({
      where: { wallet_type: 'SANDBOX', status: 'ACTIVE' },
      include: { positions: true },
    });

    // 2. Calculer le ROI de chaque portfolio (batch stock prices — pas de N+1)
    const allTickers = [...new Set(portfolios.flatMap(p => p.positions.map(pos => pos.stock_ticker)))];
    const stockRows = await prisma.stock.findMany({
      where: { symbol: { in: allTickers } },
      select: { symbol: true, current_price: true },
    });
    const priceMap = new Map(stockRows.map(s => [s.symbol, s.current_price]));

    const performances: { userId: string; roi: number }[] = [];

    for (const portfolio of portfolios) {
      let positionsValue = 0;
      for (const position of portfolio.positions) {
        const price = priceMap.get(position.stock_ticker);
        if (price !== undefined) positionsValue += position.quantity * price;
      }
      const totalValue = portfolio.cash_balance + positionsValue;
      const roi = ((totalValue - portfolio.initial_balance) / portfolio.initial_balance) * 100;
      if (!isNaN(roi)) {
        performances.push({ userId: portfolio.userId, roi });
      }
    }

    // 3. Trier par ROI décroissant et garder le top 3
    performances.sort((a, b) => b.roi - a.roi);
    const top3 = performances.slice(0, 3);
    const top3UserIds = top3.map((p) => p.userId);

    // 4. Récupérer les profils qui étaient dans le top 3
    const prevTop3Profiles = await prisma.userProfile.findMany({
      where: { roi_rank: { not: null } },
      select: { userId: true, roi_rank: true, roi_rank_held_since: true },
    });

    const now = new Date();
    let updated = 0;
    let reset = 0;

    // 5. Mettre à jour les rangs des 3 premiers
    for (let i = 0; i < top3.length; i++) {
      const rank = i + 1;
      const { userId } = top3[i];
      const prevProfile = prevTop3Profiles.find((p) => p.userId === userId);
      const keepSince = prevProfile?.roi_rank === rank && prevProfile.roi_rank_held_since != null;

      await prisma.userProfile.update({
        where: { userId },
        data: {
          roi_rank: rank,
          roi_rank_held_since: keepSince ? prevProfile!.roi_rank_held_since : now,
        },
      });
      updated++;
    }

    // 6. Réinitialiser les profils qui ne sont plus dans le top 3
    for (const prev of prevTop3Profiles) {
      if (!top3UserIds.includes(prev.userId)) {
        await prisma.userProfile.update({
          where: { userId: prev.userId },
          data: { roi_rank: null, roi_rank_held_since: null },
        });
        reset++;
      }
    }

    console.log(`✅ ROI top 3 mis à jour: ${updated} mis à jour, ${reset} réinitialisés`);
    return { updated, reset };

  } catch (error) {
    console.error('❌ Erreur updateROITopRanks:', error);
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

// =====================================
// MISE À JOUR DES STREAKS DE POSITION ROI
// =====================================

/**
 * Met à jour les streaks de position pour le top 3 du classement ROI.
 * Appelé après chaque mise à jour des prix (scraping horaire).
 * - Si un utilisateur garde la même position → roi_rank_held_since inchangé (streak continue)
 * - Si un utilisateur change de position ou sort du top 3 → reset
 */
export async function updateROIRankStreaks(): Promise<void> {
  try {
    // 1. Calculer le top 3 actuel
    const leaderboard = await getMonthlyROILeaderboard(3);
    const newTop3 = leaderboard.entries.slice(0, 3);
    const newTop3UserIds = newTop3.map(e => e.userId);
    const now = new Date();

    // 2. Récupérer les anciens détenteurs du top 3
    const previousTop3 = await prisma.userProfile.findMany({
      where: { roi_rank: { not: null } },
      select: { userId: true, roi_rank: true }
    });

    // 3. Réinitialiser ceux qui ne sont plus dans le top 3
    for (const prev of previousTop3) {
      if (!newTop3UserIds.includes(prev.userId)) {
        await prisma.userProfile.update({
          where: { userId: prev.userId },
          data: { roi_rank: null, roi_rank_held_since: null }
        });
      }
    }

    // 4. Mettre à jour chaque utilisateur du nouveau top 3
    for (const entry of newTop3) {
      const existing = previousTop3.find(p => p.userId === entry.userId);

      if (existing?.roi_rank === entry.rank) {
        // Même position → streak continue, on ne touche pas roi_rank_held_since
      } else {
        // Nouvelle position ou arrivée dans le top 3 → reset du streak
        await prisma.userProfile.update({
          where: { userId: entry.userId },
          data: {
            roi_rank: entry.rank,
            roi_rank_held_since: now
          }
        });
      }
    }

    console.log(`✅ ROI rank streaks mis à jour (top ${newTop3.length})`);
  } catch (error) {
    console.error('❌ Erreur updateROIRankStreaks:', error);
    throw error;
  }
}
