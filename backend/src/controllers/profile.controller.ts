// backend/src/controllers/profile.controller.ts
// Controllers pour la gestion du profil social

import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service';

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
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const updateData = req.body;

    // Validation basique
    if (updateData.username) {
      if (updateData.username.length < 3 || updateData.username.length > 30) {
        return res.status(400).json({ message: 'Le nom d\'utilisateur doit contenir entre 3 et 30 caractères' });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
        return res.status(400).json({ message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores' });
      }
    }

    if (updateData.bio && updateData.bio.length > 200) {
      return res.status(400).json({ message: 'La bio ne peut pas dépasser 200 caractères' });
    }

    const updatedProfile = await profileService.updateProfileSocial(userId, updateData);
    return res.status(200).json(updatedProfile);

  } catch (error: any) {
    console.error('❌ Erreur updateMyProfile:', error);
    if (error.message.includes('nom d\'utilisateur')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('Profil non trouvé')) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
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
    return res.status(201).json({ 
      message: 'Abonnement réussi',
      follow 
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