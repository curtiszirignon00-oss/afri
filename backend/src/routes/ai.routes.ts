import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
  askTutor,
  analyzeStock,
  coachIA,
  coachAnalyst,
  analyzeMarket,
  explainConceptHandler,
  analyzePortfolioHandler,
  generateQuizHandler,
  aiFeedbackHandler,
  aiAnalyticsHandler,
} from '../controllers/ai.controller';
import { aiRateLimit } from '../middlewares/ai-rate-limiter.middleware';
import { admin } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes IA nécessitent une authentification + rate limiting granulaire
router.post('/tutor',              auth, aiRateLimit('tutor'),               askTutor);
router.post('/stock-analysis',     auth, aiRateLimit('stock-analysis'),      analyzeStock);
router.post('/coach',              auth, aiRateLimit('coach'),               coachIA);
router.post('/analyst',            auth, aiRateLimit('coach'),               coachAnalyst);
router.post('/market-analysis',    auth, aiRateLimit('market-analysis'),     analyzeMarket);
router.post('/explain',            auth, aiRateLimit('explain'),             explainConceptHandler);
router.post('/portfolio-analysis', auth, aiRateLimit('portfolio-analysis'),  analyzePortfolioHandler);
router.post('/quiz',               auth, aiRateLimit('quiz'),                generateQuizHandler);

// Feedback utilisateur — pas de rate limit strict (UX fluide)
router.post('/feedback',           auth,                                     aiFeedbackHandler);

// Analytics admin — accès restreint
router.get('/analytics',           auth, admin,                              aiAnalyticsHandler);

export default router;
