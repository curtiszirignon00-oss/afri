// backend/src/services/activity.service.ts
// Service pour gérer les activités utilisateur et leaderboard

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================
// ACTIVITÉS
// =====================================

/**
 * Récupère les activités d'un utilisateur
 */
export async function getUserActivities(userId: string, limit: number = 20) {
  try {
    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return activities;

  } catch (error) {
    console.error('❌ Erreur getUserActivities:', error);
    throw error;
  }
}

/**
 * Récupère le fil d'actualités des amis d'un utilisateur
 */
export async function getActivityFeed(userId: string, limit: number = 50) {
  try {
    // Récupérer les IDs des utilisateurs suivis
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const followingIds = following.map(f => f.followingId);

    // Récupérer les activités publiques des utilisateurs suivis
    const activities = await prisma.userActivity.findMany({
      where: {
        userId: { in: followingIds },
        is_public: true
      },
      include: {
        userProfile: {
          select: {
            userId: true,
            username: true,
            avatar_url: true,
            user: {
              select: {
                name: true,
                lastname: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: limit
    });

    return activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      metadata: activity.metadata,
      created_at: activity.created_at,
      user: {
        userId: activity.userProfile.userId,
        username: activity.userProfile.username,
        name: activity.userProfile.user.name,
        lastname: activity.userProfile.user.lastname,
        avatar_url: activity.userProfile.avatar_url
      }
    }));

  } catch (error) {
    console.error('❌ Erreur getActivityFeed:', error);
    throw error;
  }
}

/**
 * Crée une nouvelle activité
 */
export async function createActivity(
  userId: string,
  type: string,
  description: string,
  metadata?: any,
  isPublic: boolean = true
) {
  try {
    const activity = await prisma.userActivity.create({
      data: {
        userId,
        type,
        description,
        metadata,
        is_public: isPublic
      }
    });

    return activity;

  } catch (error) {
    console.error('❌ Erreur createActivity:', error);
    throw error;
  }
}

// =====================================
// LEADERBOARD
// =====================================

/**
 * Classement global par XP
 */
export async function getGlobalLeaderboard(limit: number = 100, offset: number = 0) {
  try {
    const leaderboard = await prisma.userProfile.findMany({
      where: {
        is_public: true,
        appear_in_search: true
      },
      select: {
        userId: true,
        username: true,
        avatar_url: true,
        level: true,
        total_xp: true,
        global_rank: true,
        user: {
          select: {
            name: true,
            lastname: true
          }
        }
      },
      orderBy: [
        { total_xp: 'desc' },
        { level: 'desc' }
      ],
      skip: offset,
      take: limit
    });

    // Ajouter le rang
    return leaderboard.map((profile, index) => ({
      rank: offset + index + 1,
      userId: profile.userId,
      username: profile.username,
      name: profile.user.name,
      lastname: profile.user.lastname,
      avatar_url: profile.avatar_url,
      level: profile.level,
      total_xp: profile.total_xp
    }));

  } catch (error) {
    console.error('❌ Erreur getGlobalLeaderboard:', error);
    throw error;
  }
}

/**
 * Classement par pays
 */
export async function getCountryLeaderboard(countryCode: string, limit: number = 50) {
  try {
    const leaderboard = await prisma.userProfile.findMany({
      where: {
        country: countryCode,
        is_public: true,
        appear_in_search: true
      },
      select: {
        userId: true,
        username: true,
        avatar_url: true,
        level: true,
        total_xp: true,
        country_rank: true,
        user: {
          select: {
            name: true,
            lastname: true
          }
        }
      },
      orderBy: [
        { total_xp: 'desc' },
        { level: 'desc' }
      ],
      take: limit
    });

    return leaderboard.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      username: profile.username,
      name: profile.user.name,
      lastname: profile.user.lastname,
      avatar_url: profile.avatar_url,
      level: profile.level,
      total_xp: profile.total_xp
    }));

  } catch (error) {
    console.error('❌ Erreur getCountryLeaderboard:', error);
    throw error;
  }
}

/**
 * Classement des amis d'un utilisateur
 */
export async function getFriendsLeaderboard(userId: string, limit: number = 50) {
  try {
    // Récupérer les amis (ceux qu'on suit)
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });

    const friendIds = following.map(f => f.followingId);
    friendIds.push(userId); // Inclure soi-même

    const leaderboard = await prisma.userProfile.findMany({
      where: {
        userId: { in: friendIds }
      },
      select: {
        userId: true,
        username: true,
        avatar_url: true,
        level: true,
        total_xp: true,
        current_streak: true,
        user: {
          select: {
            name: true,
            lastname: true
          }
        }
      },
      orderBy: [
        { total_xp: 'desc' },
        { level: 'desc' }
      ],
      take: limit
    });

    return leaderboard.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      username: profile.username,
      name: profile.user.name,
      lastname: profile.user.lastname,
      avatar_url: profile.avatar_url,
      level: profile.level,
      total_xp: profile.total_xp,
      current_streak: profile.current_streak,
      isMe: profile.userId === userId
    }));

  } catch (error) {
    console.error('❌ Erreur getFriendsLeaderboard:', error);
    throw error;
  }
}

/**
 * Calcule et met à jour les rangs (à exécuter quotidiennement via CRON)
 */
export async function updateRanks() {
  try {
    console.log('📊 Début du calcul des rangs...');

    // Classement global
    const allProfiles = await prisma.userProfile.findMany({
      select: {
        userId: true,
        total_xp: true,
        country: true
      },
      orderBy: [
        { total_xp: 'desc' },
        { level: 'desc' }
      ]
    });

    // Mettre à jour les rangs globaux
    for (let i = 0; i < allProfiles.length; i++) {
      await prisma.userProfile.update({
        where: { userId: allProfiles[i].userId },
        data: { global_rank: i + 1 }
      });
    }

    console.log(`✅ ${allProfiles.length} rangs globaux mis à jour`);

    // Rangs par pays
    const countries = [...new Set(allProfiles.map(p => p.country).filter(Boolean))];

    for (const country of countries) {
      const countryProfiles = allProfiles.filter(p => p.country === country);
      
      for (let i = 0; i < countryProfiles.length; i++) {
        await prisma.userProfile.update({
          where: { userId: countryProfiles[i].userId },
          data: { country_rank: i + 1 }
        });
      }

      console.log(`✅ ${countryProfiles.length} rangs pour ${country} mis à jour`);
    }

    console.log('🎉 Calcul des rangs terminé !');

  } catch (error) {
    console.error('❌ Erreur updateRanks:', error);
    throw error;
  }
}