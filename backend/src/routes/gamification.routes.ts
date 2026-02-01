// backend/src/routes/gamification.routes.ts
// Routes pour le système de gamification AfriBourse

import { Router } from 'express';
import * as gamificationController from '../controllers/gamification.controller';
import { auth, admin } from '../middlewares/auth.middleware';

const router = Router();

// =====================================
// ROUTES PUBLIQUES (config)
// =====================================

// GET /api/gamification/config - Configuration complète (public)
router.get('/config', gamificationController.getGamificationConfig);

// GET /api/gamification/levels - Configuration des niveaux (public)
router.get('/levels', gamificationController.getLevelsConfig);

// =====================================
// ROUTES XP (authentifié)
// =====================================

// GET /api/gamification/xp/me - Mes stats XP
router.get('/xp/me', auth, gamificationController.getMyXPStats);

// GET /api/gamification/xp/history - Mon historique XP
router.get('/xp/history', auth, gamificationController.getXPHistory);

// POST /api/gamification/xp/add - Ajouter XP (admin seulement)
router.post('/xp/add', admin, gamificationController.addXP);

// =====================================
// ROUTES NIVEAUX (authentifié)
// =====================================

// GET /api/gamification/levels/features - Mes features débloquées
router.get('/levels/features', auth, gamificationController.getMyUnlockedFeatures);

// =====================================
// ROUTES STREAK (authentifié)
// =====================================

// GET /api/gamification/streak/me - Mon streak actuel
router.get('/streak/me', auth, gamificationController.getMyStreak);

// POST /api/gamification/streak/freeze - Utiliser un freeze
router.post('/streak/freeze', auth, gamificationController.useStreakFreeze);

// =====================================
// ROUTES ACHIEVEMENTS (authentifié)
// =====================================

// GET /api/gamification/achievements - Tous les badges
router.get('/achievements', gamificationController.getAllAchievements);

// GET /api/gamification/achievements/me - Mes badges
router.get('/achievements/me', auth, gamificationController.getMyAchievements);

// GET /api/gamification/achievements/me/progress - Mes badges avec progression
router.get('/achievements/me/progress', auth, gamificationController.getAchievementsProgress);

// POST /api/gamification/achievements/check - Vérifier déblocages
router.post('/achievements/check', auth, gamificationController.checkAchievements);

// =====================================
// ROUTES REWARDS (authentifié)
// =====================================

// GET /api/gamification/rewards - Toutes les récompenses
router.get('/rewards', gamificationController.getAllRewards);

// GET /api/gamification/rewards/me - Mes récompenses
router.get('/rewards/me', auth, gamificationController.getMyRewards);

// POST /api/gamification/rewards/:id/claim - Réclamer une récompense
router.post('/rewards/:id/claim', auth, gamificationController.claimReward);

// =====================================
// ROUTES DÉFIS HEBDOMADAIRES (authentifié)
// =====================================

// GET /api/gamification/challenges - Défis de la semaine
router.get('/challenges', gamificationController.getWeeklyChallenges);

// GET /api/gamification/challenges/progress - Ma progression des défis
router.get('/challenges/progress', auth, gamificationController.getMyChallengesProgress);

// POST /api/gamification/challenges/:id/claim - Réclamer récompense d'un défi
router.post('/challenges/:id/claim', auth, gamificationController.claimChallengeReward);

// POST /api/gamification/challenges/claim-all - Réclamer toutes les récompenses
router.post('/challenges/claim-all', auth, gamificationController.claimAllChallengeRewards);

// =====================================
// ROUTES CLASSEMENTS
// =====================================

// GET /api/gamification/leaderboard/global - Classement mondial par XP
router.get('/leaderboard/global', gamificationController.getGlobalLeaderboard);

// GET /api/gamification/leaderboard/country - Classement par pays
router.get('/leaderboard/country', gamificationController.getCountryLeaderboard);

// GET /api/gamification/leaderboard/friends - Classement amis
router.get('/leaderboard/friends', auth, gamificationController.getFriendsLeaderboard);

// GET /api/gamification/leaderboard/roi - Classement ROI mensuel
router.get('/leaderboard/roi', gamificationController.getROILeaderboard);

// GET /api/gamification/leaderboard/streaks - Classement par streak
router.get('/leaderboard/streaks', gamificationController.getStreakLeaderboard);

// =====================================
// ROUTES RÉSUMÉ (authentifié)
// =====================================

// GET /api/gamification/summary - Résumé complet gamification
router.get('/summary', auth, gamificationController.getGamificationSummary);

export default router;
