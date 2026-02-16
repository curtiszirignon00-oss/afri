// backend/src/routes/achievement.routes.ts
// Routes pour la gestion des achievements

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
  getAllAchievements,
  getMyAchievements,
  getMyAchievementsProgress,
  getUserAchievements,
  checkMyAchievements,
  checkCategoryAchievements,
  getNextAchievements
} from '../controllers/achievement.controller';

const router = Router();

// =====================================
// ROUTES PUBLIQUES
// =====================================

/**
 * GET /api/achievements
 * Liste de tous les achievements disponibles
 */
router.get('/', getAllAchievements);

/**
 * GET /api/achievements/user/:userId
 * Achievements publics d'un utilisateur
 */
router.get('/user/:userId', getUserAchievements);

// =====================================
// ROUTES PROTÉGÉES
// =====================================

/**
 * GET /api/achievements/me
 * Mes achievements débloqués
 */
router.get('/me', auth, getMyAchievements);

/**
 * GET /api/achievements/me/progress
 * Tous les achievements avec statut (débloqué/verrouillé)
 */
router.get('/me/progress', auth, getMyAchievementsProgress);

/**
 * GET /api/achievements/me/next
 * Les 3 prochains badges les plus proches
 */
router.get('/me/next', auth, getNextAchievements);

/**
 * POST /api/achievements/check
 * Vérifie et débloque les achievements
 */
router.post('/check', auth, checkMyAchievements);

/**
 * POST /api/achievements/check/:category
 * Vérifie les achievements d'une catégorie (formation, trading, social)
 */
router.post('/check/:category', auth, checkCategoryAchievements);

export default router;