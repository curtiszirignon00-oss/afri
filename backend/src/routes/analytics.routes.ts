import { Router } from 'express';
import {
  trackPageView,
  trackAction,
  trackFeatureUsage,
  updatePageDuration,
  getAnalyticsStats,
  getCohortAnalytics,
} from '../controllers/analytics.controller';
import { auth, admin } from '../middlewares/auth.middleware';
import { generalApiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Tracking endpoints (POST)
router.post('/page-view', generalApiLimiter, trackPageView); // Visiteurs: rate limited
router.post('/action', auth, trackAction); // Nécessite auth
router.post('/feature', auth, trackFeatureUsage); // Nécessite auth
router.put('/page-duration', generalApiLimiter, updatePageDuration); // Visiteurs: rate limited

// Analytics stats (GET) - ADMIN ONLY
router.get('/stats', admin, getAnalyticsStats);
router.get('/cohort', admin, getCohortAnalytics);

export default router;
