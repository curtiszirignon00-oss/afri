// backend/src/routes/real-portfolio.routes.ts
// Portefeuille réel importé. Surface séparée du simulateur (/api/portfolios) :
// pas de contrainte d'horaires de cotation (on saisit du passé), pas d'XP.

import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { auth } from '../middlewares/auth.middleware';
import { requireEmailVerifiedForWrite } from '../middlewares/emailVerification.middleware';
import {
  uploadStatement, parseFile, mapAndValidate, validate, commit, removeTransaction,
  updateCash, updateSettings, removePortfolio, getDashboard, getTransactions, getHistory,
  getDiscovery, postDiscovery,
} from '../controllers/real-portfolio.controller';

const router = Router();

// Validation = requêtes lourdes sur l'historique : 60/min par utilisateur.
const realPortfolioLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id || ipKeyGenerator(req),
  message: { message: 'Trop de requêtes. Réessayez dans une minute.' },
});

router.use(auth);

router.get('/', getDashboard);
router.get('/transactions', getTransactions);
router.get('/history', getHistory);

// Découverte de la fonctionnalité : état du guide et de l'encart « Nouveau »
router.get('/discovery', getDiscovery);
router.post('/discovery', postDiscovery);

router.post('/parse', realPortfolioLimiter, uploadStatement, parseFile);
router.post('/map', realPortfolioLimiter, mapAndValidate);
router.post('/validate', realPortfolioLimiter, validate);

router.post('/commit', realPortfolioLimiter, requireEmailVerifiedForWrite, commit);
router.delete('/transactions/:id', realPortfolioLimiter, requireEmailVerifiedForWrite, removeTransaction);
router.put('/cash', requireEmailVerifiedForWrite, updateCash);
router.patch('/', requireEmailVerifiedForWrite, updateSettings);
router.delete('/', requireEmailVerifiedForWrite, removePortfolio);

export default router;
