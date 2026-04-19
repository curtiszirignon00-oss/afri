// backend/src/routes/achievement.routes.ts
// Routes pour la gestion des achievements

import { Router } from 'express';
import { auth, optionalAuth } from '../middlewares/auth.middleware';
import {
  getAllAchievements,
  getMyAchievements,
  getMyAchievementsProgress,
  getUserAchievements,
  checkMyAchievements,
  checkCategoryAchievements,
  getNextAchievements,
  getNewAchievements
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
router.get('/user/:userId', optionalAuth, getUserAchievements);

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
 * GET /api/achievements/me/new
 * Badges récemment débloqués non encore montrés (marque comme notifiés)
 */
router.get('/me/new', auth, getNewAchievements);

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