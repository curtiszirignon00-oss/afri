import { log } from '../config/logger';
// backend/src/services/profile.service.ts
// Service pour gérer le profil social des utilisateurs

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { calculateLevelFromXP } from './xp.service';
import { getPortfolioSummary } from './portfolio.service.prisma';
import { getWatchlistByUserId } from './watchlist.service.prisma';

// Liste des noms d'utilisateur réservés pour la plateforme
const RESERVED_USERNAMES = [
  'afribourse',
  'admin',
  'administrator',
  'support',
  'official',
  'help',
  'contact',
  'info',
  'service',
  'team'
];

// =====================================
// PROFIL PUBLIC
// =====================================

/**
 * Récupère le profil public d'un utilisateur avec filtrage selon ses paramètres de confidentialité
 */
export async function getPublicProfile(userId: string, viewerId?: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            role: true,
            created_at: true,
          }
        },
        achievements: {
          where: { is_displayed: true },
          include: {
            achievement: true
          },
          orderBy: { unlocked_at: 'desc' }
        },
        followers: {
          select: {
            followerId: true
          }
        },
        following: {
          select: {
            followingId: true
          }
        }
      }
    });

    if (!profile) {
      return null;
    }

    const isSelf = viewerId === userId;
    const isFriend = viewerId ? await checkIfFriend(viewerId, userId) : false;

    // Si c'est soi-même, retourner tout + portfolio & watchlist
    if (isSelf) {
      let portfolioStats = null;
      let positions: any[] = [];
      let watchlist: any[] = [];

      try {
        const summary = await getPortfolioSummary(userId);
        if (summary) {
          portfolioStats = {
            totalValue: summary.totalValue,
            gainLoss: summary.gainLoss,
            gainLossPercent: summary.gainLossPercent,
            positionsCount: summary.positionsCount,
          };
          positions = summary.positions || [];
        }
      } catch (e) { /* ignore */ }

      try {
        const items = await getWatchlistByUserId(userId);
        watchlist = items.map(item => ({
          ticker: item.stock_ticker,
          addedAt: item.created_at,
        }));
      } catch (e) { /* ignore */ }

      return {
        ...profile,
        followersCount: profile.followers.length,
        followingCount: profile.following.length,
        isFollowing: false,
        portfolioStats,
        positions,
        watchlist,
      };
    }

    // Filtrer selon les paramètres de confidentialité
    const filtered: any = {
      userId: profile.userId,
      username: profile.username,
      created_at: profile.user.created_at,
      // Le nom est toujours public
      name: profile.user.name,
      lastname: profile.user.lastname,
      // Liens sociaux et vérification toujours publics
      social_links: profile.social_links || null,
      verified_investor: profile.verified_investor || false,
    };

    // Appliquer les filtres
    if (profile.show_avatar) {
      filtered.avatar_url = profile.avatar_url;
      filtered.avatar_color = profile.avatar_color;
    }
    filtered.banner_url = profile.banner_url;
    filtered.banner_color = profile.banner_color;
    if (profile.show_bio) filtered.bio = profile.bio;
    if (profile.show_country) filtered.country = profile.country;

    // Inclure les flags de visibilité pour que le frontend sache quoi afficher
    filtered.show_level = profile.show_level;
    filtered.show_xp = profile.show_xp;
    filtered.show_streak = profile.show_streak;
    filtered.show_portfolio_value = profile.show_portfolio_value;
    filtered.show_positions = profile.show_positions;
    filtered.show_watchlist = profile.show_watchlist;
    filtered.show_followers_count = profile.show_followers_count;
    filtered.show_following_count = profile.show_following_count;

    // Recalculer le niveau depuis le XP pour éviter les incohérences
    const correctLevel = calculateLevelFromXP(profile.total_xp || 0);
    if (profile.show_level) filtered.level = correctLevel;
    if (profile.show_xp) filtered.total_xp = profile.total_xp;
    if (profile.show_rank) {
      filtered.global_rank = profile.global_rank;
      filtered.country_rank = profile.country_rank;
    }
    if (profile.show_streak) {
      filtered.current_streak = profile.current_streak;
      filtered.longest_streak = profile.longest_streak;
    }

    if (profile.show_achievements) {
      filtered.achievements = profile.achievements;
    }

    if (profile.show_followers_count) {
      filtered.followersCount = profile.followers.length;
    }
    if (profile.show_following_count) {
      filtered.followingCount = profile.following.length;
    }

    // Le nombre de publications est toujours public
    filtered.posts_count = profile.posts_count || 0;

    // Vérifier si le viewer suit ce profil
    if (viewerId) {
      filtered.isFollowing = await checkIfFollowing(viewerId, userId);
    }

    // Statut public/privé
    filtered.is_public = profile.is_public;

    // Données portefeuille (selon les paramètres de confidentialité)
    if (profile.show_portfolio_value || profile.show_positions) {
      try {
        const summary = await getPortfolioSummary(userId);
        if (summary) {
          if (profile.show_portfolio_value) {
            filtered.portfolioStats = {
              totalValue: summary.totalValue,
              gainLoss: summary.gainLoss,
              gainLossPercent: summary.gainLossPercent,
              positionsCount: summary.positionsCount,
            };
          }
          if (profile.show_positions) {
            filtered.positions = summary.positions || [];
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Watchlist (selon les paramètres de confidentialité)
    if (profile.show_watchlist) {
      try {
        const items = await getWatchlistByUserId(userId);
        filtered.watchlist = items.map(item => ({
          ticker: item.stock_ticker,
          addedAt: item.created_at,
        }));
      } catch (e) { /* ignore */ }
    }

    return filtered;

  } catch (error) {
    log.error('❌ Erreur getPublicProfile:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques complètes d'un utilisateur (usage interne ou self)
 */
export async function getUserStats(userId: string) {
  try {
    const [profile, achievementsCount, followersCount, followingCount] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId },
        select: {
          level: true,
          total_xp: true,
          current_streak: true,
          longest_streak: true,
          global_rank: true,
          country_rank: true,
          streak_freezes: true,
        }
      }),
      prisma.userAchievement.count({
        where: { userId }
      }),
      prisma.follow.count({
        where: { followingId: userId }
      }),
      prisma.follow.count({
        where: { followerId: userId }
      })
    ]);

    if (!profile) {
      throw new Error('Profil non trouvé');
    }

    return {
      ...profile,
      achievementsUnlocked: achievementsCount,
      followersCount,
      followingCount
    };

  } catch (error) {
    log.error('❌ Erreur getUserStats:', error);
    throw error;
  }
}

// =====================================
// MISE À JOUR PROFIL
// =====================================

/**
 * Met à jour les informations du profil social
 */
export async function updateProfileSocial(userId: string, data: any) {
  try {
    log.debug('📝 [SERVICE] updateProfileSocial called with userId:', userId);
    log.debug('📝 [SERVICE] data received:', JSON.stringify(data));

    const profileUpdateData: any = {};
    const userUpdateData: any = {};

    // Champs du UserProfile
    if (data.username !== undefined) {
      // Valider que le username n'est pas réservé
      const normalizedUsername = data.username.toLowerCase().trim();
      if (RESERVED_USERNAMES.includes(normalizedUsername)) {
        throw new Error("Ce nom d'utilisateur est réservé et ne peut pas être utilisé");
      }
      profileUpdateData.username = data.username;
    }
    if (data.bio !== undefined) profileUpdateData.bio = data.bio;
    if (data.country !== undefined) profileUpdateData.country = data.country;
    if (data.avatar_url !== undefined) profileUpdateData.avatar_url = data.avatar_url;
    if (data.avatar_color !== undefined) profileUpdateData.avatar_color = data.avatar_color;
    if (data.banner_url !== undefined) profileUpdateData.banner_url = data.banner_url;
    if (data.banner_color !== undefined) profileUpdateData.banner_color = data.banner_color;
    if (data.banner_type !== undefined) profileUpdateData.banner_type = data.banner_type;
    if (data.social_links !== undefined) profileUpdateData.social_links = data.social_links;

    // Champs du User (name et lastname)
    if (data.name !== undefined) userUpdateData.name = data.name;
    if (data.lastname !== undefined) userUpdateData.lastname = data.lastname;

    log.debug('📝 [SERVICE] profileUpdateData prepared:', JSON.stringify(profileUpdateData));
    log.debug('📝 [SERVICE] userUpdateData prepared:', JSON.stringify(userUpdateData));

    // Si aucune donnée à mettre à jour, retourner le profil existant
    if (Object.keys(profileUpdateData).length === 0 && Object.keys(userUpdateData).length === 0) {
      log.debug('📝 [SERVICE] No data to update, fetching existing profile');
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      return existingProfile;
    }

    // Mettre à jour le User si nécessaire
    if (Object.keys(userUpdateData).length > 0) {
      log.debug('📝 [SERVICE] Updating User table...');
      await prisma.user.update({
        where: { id: userId },
        data: userUpdateData
      });
    }

    // Si il y a des données de profil à mettre à jour
    if (Object.keys(profileUpdateData).length > 0) {
      // Utiliser upsert pour créer le profil s'il n'existe pas
      log.debug('📝 [SERVICE] Performing upsert on UserProfile...');
      const updatedProfile = await prisma.userProfile.upsert({
        where: { userId },
        update: profileUpdateData,
        create: {
          userId,
          username: profileUpdateData.username || null,
          bio: profileUpdateData.bio || null,
          country: profileUpdateData.country || null,
          avatar_url: profileUpdateData.avatar_url || null,
          banner_url: profileUpdateData.banner_url || null,
          banner_type: profileUpdateData.banner_type || 'gradient',
          social_links: profileUpdateData.social_links || null,
          // Valeurs par défaut requises
          is_public: true,
          level: 1,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
          streak_freezes: 5,
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
          reputation_score: 0,
          verified_investor: false,
        }
      });

      log.debug('✅ [SERVICE] Profile updated successfully:', updatedProfile.id);
      return updatedProfile;
    } else {
      // Si seulement le User a été mis à jour, retourner le profil existant
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      log.debug('✅ [SERVICE] User updated, returning existing profile');
      return existingProfile;
    }

  } catch (error: any) {
    log.error('❌ [SERVICE] Error in updateProfileSocial:', error.message);
    log.error('❌ [SERVICE] Error code:', error.code);
    log.error('❌ [SERVICE] Full error:', error);
    if (error.code === 'P2002') {
      throw new Error("Ce nom d'utilisateur est déjà pris");
    }
    // Re-throw l'erreur des usernames réservés
    if (error.message.includes('réservé')) {
      throw error;
    }
    throw error;
  }
}

/**
 * Met à jour les paramètres de confidentialité
 */
export async function updatePrivacySettings(userId: string, settings: any) {
  try {
    const updateData: any = {};

    // Tous les paramètres de confidentialité
    const privacyFields = [
      'is_public',
      'show_avatar', 'show_bio', 'show_country', 'show_birth_date',
      'show_level', 'show_xp', 'show_rank', 'show_streak',
      'show_portfolio_value', 'show_roi', 'show_positions', 'show_transactions', 'show_watchlist',
      'show_achievements', 'show_badges', 'show_completed_modules', 'show_quiz_scores',
      'show_followers_count', 'show_following_count', 'show_followers_list', 'show_following_list', 'show_activity_feed',
      'appear_in_search', 'appear_in_suggestions', 'allow_follow_requests'
    ];

    privacyFields.forEach(field => {
      if (settings[field] !== undefined) {
        updateData[field] = settings[field];
      }
    });

    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: updateData
    });

    return updatedProfile;

  } catch (error) {
    log.error('❌ Erreur updatePrivacySettings:', error);
    throw error;
  }
}

// =====================================
// FOLLOW SYSTEM
// =====================================

/**
 * Suivre un utilisateur
 */
export async function followUser(followerId: string, followingId: string) {
  try {
    // Vérifier que l'utilisateur n'essaie pas de se suivre lui-même
    if (followerId === followingId) {
      throw new Error('Vous ne pouvez pas vous suivre vous-même');
    }

    // Vérifier que le profil cible existe et autorise les follows
    const targetProfile = await prisma.userProfile.findUnique({
      where: { userId: followingId },
      select: { allow_follow_requests: true }
    });

    if (!targetProfile) {
      throw new Error('Utilisateur non trouvé');
    }

    if (!targetProfile.allow_follow_requests) {
      throw new Error('Cet utilisateur n\'accepte pas les demandes d\'abonnement');
    }

    // Créer le follow
    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      }
    });

    // Créer une activité
    await prisma.userActivity.create({
      data: {
        userId: followerId,
        type: 'follow',
        description: `a commencé à suivre un utilisateur`,
        metadata: { followingId },
        is_public: true
      }
    });

    // TODO: Ajouter XP pour chaque palier de 50 abonnés atteint
    const followersCount = await prisma.follow.count({
      where: { followingId }
    });

    if (followersCount % 50 === 0) {
      // Déclencher l'ajout de 200 XP (à implémenter dans xpService)
      log.debug(`🎯 ${followingId} a atteint ${followersCount} abonnés ! +200 XP`);
    }

    return follow;

  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Vous suivez déjà cet utilisateur');
    }
    log.error('❌ Erreur followUser:', error);
    throw error;
  }
}

/**
 * Ne plus suivre un utilisateur
 */
export async function unfollowUser(followerId: string, followingId: string) {
  try {
    const follow = await prisma.follow.deleteMany({
      where: {
        followerId,
        followingId
      }
    });

    if (follow.count === 0) {
      throw new Error('Vous ne suivez pas cet utilisateur');
    }

    return { message: 'Désabonnement réussi' };

  } catch (error) {
    log.error('❌ Erreur unfollowUser:', error);
    throw error;
  }
}

/**
 * Récupérer la liste des abonnés d'un utilisateur
 */
export async function getFollowers(userId: string, viewerId?: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { show_followers_list: true }
    });

    // Vérifier les permissions
    if (viewerId !== userId && !profile?.show_followers_list) {
      throw new Error('La liste des abonnés est privée');
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          include: {
            user: {
              select: {
                name: true,
                lastname: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return followers.map(f => ({
      userId: f.follower.userId,
      username: f.follower.username,
      name: f.follower.user.name,
      lastname: f.follower.user.lastname,
      avatar_url: f.follower.avatar_url,
      level: f.follower.level,
      followed_at: f.created_at
    }));

  } catch (error) {
    log.error('❌ Erreur getFollowers:', error);
    throw error;
  }
}

/**
 * Récupérer la liste des abonnements d'un utilisateur
 */
export async function getFollowing(userId: string, viewerId?: string) {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { show_following_list: true }
    });

    // Vérifier les permissions
    if (viewerId !== userId && !profile?.show_following_list) {
      throw new Error('La liste des abonnements est privée');
    }

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          include: {
            user: {
              select: {
                name: true,
                lastname: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return following.map(f => ({
      userId: f.following.userId,
      username: f.following.username,
      name: f.following.user.name,
      lastname: f.following.user.lastname,
      avatar_url: f.following.avatar_url,
      level: f.following.level,
      followed_at: f.created_at
    }));

  } catch (error) {
    log.error('❌ Erreur getFollowing:', error);
    throw error;
  }
}

/**
 * Suggestions d'amis (algorithme simple)
 */
export async function getSuggestions(userId: string, limit: number = 10) {
  try {
    const currentUser = await prisma.userProfile.findUnique({
      where: { userId },
      select: {
        country: true,
        level: true,
        main_goals: true
      }
    });

    if (!currentUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Récupérer les IDs des utilisateurs déjà suivis
    const alreadyFollowing = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = alreadyFollowing.map(f => f.followingId);

    // Trouver des suggestions basées sur :
    // 1. Même pays
    // 2. Niveau similaire (±5 niveaux)
    // 3. Pas déjà suivi
    // 4. Profil public
    // 5. Apparaît dans les suggestions
    const suggestions = await prisma.userProfile.findMany({
      where: {
        userId: {
          not: userId,
          notIn: followingIds
        },
        is_public: true,
        appear_in_suggestions: true,
        OR: [
          { country: currentUser.country },
          {
            level: {
              gte: Math.max(1, currentUser.level - 5),
              lte: currentUser.level + 5
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            lastname: true
          }
        },
        followers: {
          where: {
            followerId: { in: followingIds } // Amis en commun
          },
          select: {
            followerId: true
          }
        }
      },
      take: limit * 2 // Prendre plus pour filtrer ensuite
    });

    // Calculer un score de compatibilité
    const scored = suggestions.map(profile => {
      let score = 0;

      // Même pays : +30 points
      if (profile.country === currentUser.country) score += 30;

      // Niveau similaire : +20 points
      const levelDiff = Math.abs(profile.level - currentUser.level);
      if (levelDiff <= 2) score += 20;
      else if (levelDiff <= 5) score += 10;

      // Amis en commun : +30 points
      const mutualFriends = profile.followers.length;
      score += Math.min(mutualFriends * 10, 30);

      return {
        userId: profile.userId,
        username: profile.username,
        name: profile.user.name,
        lastname: profile.user.lastname,
        avatar_url: profile.avatar_url,
        level: profile.level,
        country: profile.country,
        mutualFriends,
        matchScore: score
      };
    });

    // Trier par score et retourner top N
    return scored
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

  } catch (error) {
    log.error('❌ Erreur getSuggestions:', error);
    throw error;
  }
}

// =====================================
// UTILITAIRES
// =====================================

/**
 * Vérifier si un utilisateur en suit un autre
 */
export async function checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId
      }
    }
  });
  return !!follow;
}

/**
 * Vérifier si deux utilisateurs sont amis (se suivent mutuellement)
 */
export async function checkIfFriend(userId1: string, userId2: string): Promise<boolean> {
  const [follow1, follow2] = await Promise.all([
    checkIfFollowing(userId1, userId2),
    checkIfFollowing(userId2, userId1)
  ]);
  return follow1 && follow2;
}