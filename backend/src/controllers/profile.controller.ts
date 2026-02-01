// backend/src/controllers/profile.controller.ts
// Controllers pour la gestion du profil social

import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service';
// Import gamification services
import * as xpService from '../services/xp.service';
import * as streakService from '../services/streak.service';
import * as achievementService from '../services/achievement.service';
import * as weeklyChallengeService from '../services/weekly-challenge.service';
import { prisma } from '../config/database';

// =====================================
// PROFIL PUBLIC
// =====================================

/**
 * GET /api/profile/:userId
 * Récupère le profil public d'un utilisateur
 */
export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    const profile = await profileService.getPublicProfile(userId, viewerId);

    if (!profile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    return res.status(200).json(profile);

  } catch (error: any) {
    console.error('❌ Erreur getPublicProfile:', error);
    return next(error);
  }
}

/**
 * GET /api/profile/me
 * Récupère le profil complet de l'utilisateur connecté
 */
export async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    // Récupérer le profil complet sans filtrage
    const profile = await profileService.getPublicProfile(userId, userId);

    if (!profile) {
      return res.status(404).json({ message: 'Profil non trouvé' });
    }

    return res.status(200).json(profile);

  } catch (error) {
    console.error('❌ Erreur getMyProfile:', error);
    return next(error);
  }
}

/**
 * GET /api/profile/me/stats
 * Récupère les statistiques de l'utilisateur connecté
 */
export async function getMyStats(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const stats = await profileService.getUserStats(userId);
    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Erreur getMyStats:', error);
    return next(error);
  }
}

// =====================================
// MISE À JOUR PROFIL
// =====================================

/**
 * PUT /api/profile/me
 * Met à jour le profil social de l'utilisateur
 */
export async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    console.log('📝 [UPDATE PROFILE] userId:', userId);
    console.log('📝 [UPDATE PROFILE] body:', JSON.stringify(req.body));

    if (!userId) {
      console.log('❌ [UPDATE PROFILE] No userId found');
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const updateData = req.body;

    // Validation basique
    if (updateData.name && updateData.name.length > 50) {
      return res.status(400).json({ message: 'Le prénom ne peut pas dépasser 50 caractères' });
    }

    if (updateData.lastname && updateData.lastname.length > 50) {
      return res.status(400).json({ message: 'Le nom de famille ne peut pas dépasser 50 caractères' });
    }

    // Validation basique
    if (updateData.username) {
      if (updateData.username.length < 3 || updateData.username.length > 30) {
        return res.status(400).json({ message: 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
        return res.status(400).json({ message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores' });
      }
      // Vérifier les usernames réservés (case-insensitive)
      const reservedUsernames = ['afribourse', 'admin', 'administrator', 'support', 'official', 'help', 'contact', 'info', 'service', 'team'];
      if (reservedUsernames.includes(updateData.username.toLowerCase())) {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur est réservé et ne peut pas être utilisé' });
      }
    }

    if (updateData.bio && updateData.bio.length > 200) {
      return res.status(400).json({ message: 'La bio ne peut pas dépasser 200 caractères' });
    }

    console.log('📝 [UPDATE PROFILE] Calling service...');
    const updatedProfile = await profileService.updateProfileSocial(userId, updateData);
    console.log('✅ [UPDATE PROFILE] Success:', updatedProfile?.id);

    // ========== GAMIFICATION TRIGGERS ==========
    let xpGained = 0;
    let newAchievements: string[] = [];

    try {
      // 1. Enregistrer activité streak
      await streakService.recordActivity(userId, 'profile_edit');

      // 2. Vérifier si le profil est maintenant complet
      // Un profil est considéré comme complet si: avatar, bio, username, country sont remplis
      const profile = await prisma.userProfile.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (profile) {
        const isComplete = !!(
          profile.avatar_url &&
          profile.bio &&
          profile.username &&
          profile.country &&
          profile.user.name &&
          profile.user.lastname
        );

        // Vérifier si on n'a pas déjà attribué le badge "new_member"
        const hasNewMemberBadge = await prisma.userAchievement.findFirst({
          where: {
            userId,
            achievement: { code: 'new_member' }
          }
        });

        if (isComplete && !hasNewMemberBadge) {
          // Profil maintenant complet! +250 XP
          const xpResult = await xpService.addXPForAction(userId, 'PROFILE_COMPLETED');
          xpGained = xpResult.xp_added;

          // Vérifier déblocage de badges sociaux
          const unlockedAchievements = await achievementService.checkSocialAchievements(userId);
          newAchievements = unlockedAchievements.map(a => a.name);
        }
      }

    } catch (gamificationError) {
      console.error('Erreur gamification (profile update):', gamificationError);
    }
    // ========== FIN GAMIFICATION ==========

    return res.status(200).json({
      success: true,
      data: updatedProfile,
      gamification: {
        xpGained,
        newAchievements
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur updateMyProfile:', error.message);
    console.error('❌ Stack:', error.stack);
    if (error.message?.includes('nom d\'utilisateur')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message?.includes('réservé')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message?.includes('Profil non trouvé')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message || 'Erreur lors de la mise à jour du profil' });
  }
}

/**
 * PATCH /api/profile/me/privacy
 * Met à jour les paramètres de confidentialité
 */
export async function updateMyPrivacy(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const settings = req.body;

    const updatedProfile = await profileService.updatePrivacySettings(userId, settings);
    return res.status(200).json(updatedProfile);

  } catch (error) {
    console.error('❌ Erreur updateMyPrivacy:', error);
    return next(error);
  }
}

// =====================================
// FOLLOW SYSTEM
// =====================================

/**
 * POST /api/profile/:userId/follow
 * Suivre un utilisateur
 */
export async function followUser(req: Request, res: Response, next: NextFunction) {
  try {
    const followerId = req.user?.id;
    if (!followerId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { userId: followingId } = req.params;

    const follow = await profileService.followUser(followerId, followingId);

    // ========== GAMIFICATION TRIGGERS ==========
    let gamificationData: any = {};

    try {
      // 1. Enregistrer activité streak pour le follower
      await streakService.recordActivity(followerId, 'follow_user');

      // 2. Mettre à jour progression défis hebdomadaires (follow)
      await weeklyChallengeService.updateChallengeProgress(followerId, 'social', 1);

      // 3. Vérifier badges sociaux pour l'utilisateur suivi (nombre de followers)
      const followerCount = await prisma.follow.count({
        where: { followingId }
      });

      // Paliers de followers: 10, 50, 100, 150, 200, 500
      const followerMilestones = [10, 50, 100, 150, 200, 500];
      if (followerMilestones.includes(followerCount)) {
        // L'utilisateur suivi reçoit XP pour le palier atteint (+200 XP)
        const xpResult = await xpService.addXPForAction(followingId, 'FOLLOWER_MILESTONE');
        gamificationData.targetUserXP = xpResult.xp_added;

        // Récompenser freezes pour 50 abonnés
        if (followerCount === 50) {
          await streakService.rewardFreezeForAction(followingId, 'FOLLOWER_50');
        }

        // Vérifier badges sociaux pour l'utilisateur suivi
        const unlockedBadges = await achievementService.checkSocialAchievements(followingId);
        if (unlockedBadges.length > 0) {
          gamificationData.targetUserBadges = unlockedBadges.map(a => a.name);
        }
      }

    } catch (gamificationError) {
      console.error('Erreur gamification (follow):', gamificationError);
    }
    // ========== FIN GAMIFICATION ==========

    return res.status(201).json({
      message: 'Abonnement réussi',
      follow,
      gamification: gamificationData
    });

  } catch (error: any) {
    console.error('❌ Erreur followUser:', error);
    if (error.message.includes('suivre')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
}

/**
 * DELETE /api/profile/:userId/unfollow
 * Ne plus suivre un utilisateur
 */
export async function unfollowUser(req: Request, res: Response, next: NextFunction) {
  try {
    const followerId = req.user?.id;
    if (!followerId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { userId: followingId } = req.params;

    await profileService.unfollowUser(followerId, followingId);
    return res.status(200).json({ message: 'Désabonnement réussi' });

  } catch (error: any) {
    console.error('❌ Erreur unfollowUser:', error);
    if (error.message.includes('suivez pas')) {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
}

/**
 * GET /api/profile/:userId/followers
 * Récupère la liste des abonnés
 */
export async function getFollowers(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    const followers = await profileService.getFollowers(userId, viewerId);
    return res.status(200).json(followers);

  } catch (error: any) {
    console.error('❌ Erreur getFollowers:', error);
    if (error.message.includes('privée')) {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
}

/**
 * GET /api/profile/:userId/following
 * Récupère la liste des abonnements
 */
export async function getFollowing(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const viewerId = req.user?.id;

    const following = await profileService.getFollowing(userId, viewerId);
    return res.status(200).json(following);

  } catch (error: any) {
    console.error('❌ Erreur getFollowing:', error);
    if (error.message.includes('privée')) {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
}

/**
 * GET /api/profile/suggestions
 * Obtenir des suggestions d'amis
 */
export async function getSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const limit = parseInt(req.query.limit as string) || 10;

    const suggestions = await profileService.getSuggestions(userId, limit);
    return res.status(200).json(suggestions);

  } catch (error) {
    console.error('❌ Erreur getSuggestions:', error);
    return next(error);
  }
}