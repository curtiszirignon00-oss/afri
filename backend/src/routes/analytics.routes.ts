import { Router } from 'express';
import {
  trackPageView,
  trackAction,
  trackFeatureUsage,
  updatePageDuration,
  getAnalyticsStats,
} from '../controllers/analytics.controller';
import { auth } from '../middlewares/auth.middleware';

const router = Router();

// Tracking endpoints (POST)
router.post('/page-view', trackPageView); // Peut être appelé sans auth (pour les visiteurs)
router.post('/action', auth, trackAction); // Nécessite auth
router.post('/feature', auth, trackFeatureUsage); // Nécessite auth
router.put('/page-duration', updatePageDuration); // Peut être appelé sans auth

// Analytics stats (GET) - ADMIN ONLY
router.get('/stats', auth, getAnalyticsStats);

export default router;
