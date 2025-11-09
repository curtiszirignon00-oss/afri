// backend/src/routes/activity.routes.ts
// Routes pour activités et classements

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
  getMyActivities,
  getActivityFeed
} from '../controllers/activity.controller';

const router = Router();

// Toutes les routes activités nécessitent une authentification
router.use(auth);

/**
 * GET /api/activities/me
 * Mes activités
 */
router.get('/me', getMyActivities);

/**
 * GET /api/activities/feed
 * Fil d'actualités des amis
 */
router.get('/feed', getActivityFeed);

export default router;