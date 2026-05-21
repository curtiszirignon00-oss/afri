import { Router } from 'express';
import {
  trackPageView,
  trackAction,
  trackFeatureUsage,
  updatePageDuration,
  getAnalyticsStats,
  getCohortAnalytics,
} from '../controllers/analytics.controller';
import { auth, admin, optionalAuth } from '../middlewares/auth.middleware';
import { generalApiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Tracking endpoints (POST)
router.post('/page-view',    generalApiLimiter, optionalAuth, trackPageView); // Identifie user si connecté
router.post('/action',       auth,              trackAction);
router.post('/feature',      auth,              trackFeatureUsage);
router.put('/page-duration', generalApiLimiter, updatePageDuration);

// Analytics stats (GET) - ADMIN ONLY
router.get('/stats', admin, getAnalyticsStats);
router.get('/cohort', admin, getCohortAnalytics);

export default router;
