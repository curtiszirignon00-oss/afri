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
  portfolioAdvisorIA,
  serveCachedMarketAnalysis,
} from '../controllers/ai.controller';
import { aiRateLimit } from '../middlewares/ai-rate-limiter.middleware';
import {
  streamAnalyst,
  streamPortfolio,
  streamRealPortfolio,
  streamTutor,
  getConversation,
  deleteConversation,
} from '../controllers/ai-stream.controller';
import { admin } from '../middlewares/auth.middleware';

const router = Router();

// Toutes les routes IA nécessitent une authentification + rate limiting granulaire
router.post('/tutor',              auth, aiRateLimit('tutor'),               askTutor);
router.post('/stock-analysis',     auth, aiRateLimit('stock-analysis'),      analyzeStock);
router.post('/coach',              auth, aiRateLimit('coach'),               coachIA);
router.post('/analyst',            auth, aiRateLimit('coach'),               coachAnalyst);
router.post('/market-analysis',    auth, serveCachedMarketAnalysis, aiRateLimit('market-analysis'), analyzeMarket);
router.post('/explain',            auth, aiRateLimit('explain'),             explainConceptHandler);
router.post('/portfolio-analysis', auth, aiRateLimit('portfolio-analysis'),  analyzePortfolioHandler);
router.post('/portfolio-advisor',  auth, aiRateLimit('coach'),               portfolioAdvisorIA);
router.post('/quiz',               auth, aiRateLimit('quiz'),                generateQuizHandler);

// Chats en streaming (réponse mot à mot) + mémoire des conversations
router.post('/analyst/stream',           auth, aiRateLimit('coach'), streamAnalyst);
router.post('/portfolio-advisor/stream', auth, aiRateLimit('coach'), streamPortfolio);
router.post('/real-portfolio/stream',    auth, aiRateLimit('coach'), streamRealPortfolio); // reporting factuel (CREPMG)
router.post('/tutor/stream',             auth, aiRateLimit('tutor'), streamTutor);
router.get('/conversations/:kind',       auth, getConversation);
router.delete('/conversations/:kind',    auth, deleteConversation);

// Feedback utilisateur — pas de rate limit strict (UX fluide)
router.post('/feedback',           auth,                                     aiFeedbackHandler);

// Analytics admin — accès restreint
router.get('/analytics',           auth, admin,                              aiAnalyticsHandler);

export default router;
