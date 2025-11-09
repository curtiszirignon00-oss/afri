// backend/src/routes/leaderboard.routes.ts
// Routes pour les classements

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
  getGlobalLeaderboard,
  getCountryLeaderboard,
  getFriendsLeaderboard
} from '../controllers/activity.controller';

const router = Router();

/**
 * GET /api/leaderboard/global
 * Classement général (public)
 */
router.get('/global', getGlobalLeaderboard);

/**
 * GET /api/leaderboard/country/:code
 * Classement par pays (public)
 */
router.get('/country/:code', getCountryLeaderboard);

/**
 * GET /api/leaderboard/friends
 * Classement des amis (protégé)
 */
router.get('/friends', auth, getFriendsLeaderboard);

export default router;                     