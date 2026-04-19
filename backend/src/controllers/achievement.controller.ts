import { log } from '../config/logger';
// backend/src/controllers/achievement.controller.ts
// Controllers pour la gestion des achievements

import { Request, Response, NextFunction } from 'express';
import * as achievementService from '../services/achievement.service';

/**
 * GET /api/achievements/me/new
 * Retourne les achievements récemment débloqués (non notifiés) et les marque comme notifiés
 */
export async function getNewAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    const achievements = await achievementService.getNewAchievements(userId);
    return res.status(200).json(achievements);
  } catch (error) {
    log.error('❌ Erreur getNewAchievements:', error);
    return next(error);
  }
}
import { parsePagination } from '../utils/pagination.util';

// =====================================
// RÉCUPÉRATION ACHIEVEMENTS
// =====================================

/**
 * GET /api/achievements
 * Récupère tous les achievements disponibles
 */
export async function getAllAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const achievements = await achievementService.getAllAchievements();
    return res.status(200).json(achievements);

  } catch (error) {
    log.error('❌ Erreur getAllAchievements:', error);
    return next(error);
  }
}

/**
 * GET /api/achievements/me
 * Récupère les achievements de l'utilisateur connecté
 */
export async function getMyAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const achievements = await achievementService.getUserAchievements(userId);
    return res.status(200).json(achievements);

  } catch (error) {
    log.error('❌ Erreur getMyAchievements:', error);
    return next(error);
  }
}

/**
 * GET /api/achievements/me/progress
 * Récupère tous les achievements avec leur statut de déblocage
 */
export async function getMyAchievementsProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const achievements = await achievementService.getAchievementsWithProgress(userId);
    return res.status(200).json(achievements);

  } catch (error) {
    log.error('❌ Erreur getMyAchievementsProgress:', error);
    return next(error);
  }
}

/**
 * GET /api/achievements/user/:userId
 * Récupère les achievements publics d'un utilisateur
 */
export async function getUserAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;

    // TODO: Vérifier les paramètres de confidentialité
    const achievements = await achievementService.getUserAchievements(userId);
    return res.status(200).json(achievements);

  } catch (error) {
    log.error('❌ Erreur getUserAchievements:', error);
    return next(error);
  }
}

// =====================================
// VÉRIFICATION ACHIEVEMENTS
// =====================================

/**
 * POST /api/achievements/check
 * Vérifie et débloque les achievements de l'utilisateur
 * (Appelé après une action importante)
 */
export async function checkMyAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const result = await achievementService.checkAllAchievements(userId);
    return res.status(200).json(result);

  } catch (error) {
    log.error('❌ Erreur checkMyAchievements:', error);
    return next(error);
  }
}

/**
 * GET /api/achievements/me/next
 * Retourne les 3 prochains badges les plus proches d'être débloqués
 */
export async function getNextAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const limit = parsePagination(req.query.limit, undefined, 3).limit;
    const nextBadges = await achievementService.getNextAchievements(userId, limit);
    return res.status(200).json(nextBadges);

  } catch (error) {
    log.error('❌ Erreur getNextAchievements:', error);
    return next(error);
  }
}

/**
 * POST /api/achievements/check/:category
 * Vérifie les achievements d'une catégorie spécifique
 */
export async function checkCategoryAchievements(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { category } = req.params;

    let result;
    switch (category) {
      case 'formation':
        result = await achievementService.checkFormationAchievements(userId);
        break;
      case 'trading':
        result = await achievementService.checkTradingAchievements(userId);
        break;
      case 'social':
        result = await achievementService.checkSocialAchievements(userId);
        break;
      default:
        return res.status(400).json({ message: 'Catégorie invalide' });
    }

    return res.status(200).json({ category, unlocked: result });

  } catch (error) {
    log.error('❌ Erreur checkCategoryAchievements:', error);
    return next(error);
  }
}