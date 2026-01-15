// backend/src/services/profile.service.ts
// Service pour gérer le profil social des utilisateurs

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Si c'est soi-même, retourner tout
    if (isSelf) {
      return {
        ...profile,
        followersCount: profile.followers.length,
        followingCount: profile.following.length,
        isFollowing: false // Pas besoin si c'est soi-même
      };
    }

    // Filtrer selon les paramètres de confidentialité
    const filtered: any = {
      userId: profile.userId,
      username: profile.username,
      created_at: profile.user.created_at,
    };

    // Appliquer les filtres
    if (profile.show_avatar) filtered.avatar_url = profile.avatar_url;
    if (profile.show_bio) filtered.bio = profile.bio;
    if (profile.show_country) filtered.country = profile.country;
    
    if (profile.show_level) filtered.level = profile.level;
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

    // Vérifier si le viewer suit ce profil
    if (viewerId) {
      filtered.isFollowing = await checkIfFollowing(viewerId, userId);
    }

    // Statut public/privé
    filtered.is_public = profile.is_public;

    return filtered;

  } catch (error) {
    console.error('❌ Erreur getPublicProfile:', error);
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
    console.error('❌ Erreur getUserStats:', error);
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
    console.log('📝 [SERVICE] updateProfileSocial called with userId:', userId);
    console.log('📝 [SERVICE] data received:', JSON.stringify(data));

    const updateData: any = {};

    // Champs autorisés à la mise à jour
    if (data.username !== undefined) updateData.username = data.username;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.banner_url !== undefined) updateData.banner_url = data.banner_url;
    if (data.banner_type !== undefined) updateData.banner_type = data.banner_type;
    if (data.social_links !== undefined) updateData.social_links = data.social_links;

    console.log('📝 [SERVICE] updateData prepared:', JSON.stringify(updateData));

    // Si aucune donnée à mettre à jour, retourner le profil existant
    if (Object.keys(updateData).length === 0) {
      console.log('📝 [SERVICE] No data to update, fetching existing profile');
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });
      return existingProfile;
    }

    // Utiliser upsert pour créer le profil s'il n'existe pas
    console.log('📝 [SERVICE] Performing upsert...');
    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        username: updateData.username || null,
        bio: updateData.bio || null,
        country: updateData.country || null,
        avatar_url: updateData.avatar_url || null,
        banner_url: updateData.banner_url || null,
        banner_type: updateData.banner_type || 'gradient',
        social_links: updateData.social_links || null,
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

    console.log('✅ [SERVICE] Profile updated successfully:', updatedProfile.id);
    return updatedProfile;

  } catch (error: any) {
    console.error('❌ [SERVICE] Error in updateProfileSocial:', error.message);
    console.error('❌ [SERVICE] Error code:', error.code);
    console.error('❌ [SERVICE] Full error:', error);
    if (error.code === 'P2002') {
      throw new Error('Ce nom d\'utilisateur est déjà pris');
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
      'show_portfolio_value', 'show_roi', 'show_positions', 'show_transactions',
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
    console.error('❌ Erreur updatePrivacySettings:', error);
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
      console.log(`🎯 ${followingId} a atteint ${followersCount} abonnés ! +200 XP`);
    }

    return follow;

  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('Vous suivez déjà cet utilisateur');
    }
    console.error('❌ Erreur followUser:', error);
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
    console.error('❌ Erreur unfollowUser:', error);
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
    console.error('❌ Erreur getFollowers:', error);
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
    console.error('❌ Erreur getFollowing:', error);
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
    console.error('❌ Erreur getSuggestions:', error);
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