// backend/src/routes/portfolio.routes.ts

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import { requireEmailVerifiedForWrite } from '../middlewares/emailVerification.middleware';
import { validateTradingHours } from '../middleware/challenge.middleware';
import { tradingLimiter } from '../middleware/rateLimiter';
import {
    getMyPortfolio,
    createMyPortfolio,
    buyStock,
    sellStock,
    getPortfolioHistory,
    getPortfolioTransactions,
    getPortfolioSummary,
    getMyRank
} from '../controllers/portfolio.controller';
import { validateBuyStock, validateSellStock } from '../validation/portfolio.validation';

const router = Router();

router.get('/summary', auth, getPortfolioSummary); // Summary for profile display
router.get('/my', auth, getMyPortfolio);
router.post('/my', auth, createMyPortfolio);
router.get('/my/history', auth, getPortfolioHistory);
router.get('/my/rank', auth, getMyRank);
// Trading routes avec rate limiting (30 transactions/min max)
router.post('/my/buy', auth, requireEmailVerifiedForWrite, tradingLimiter, validateTradingHours, validateBuyStock, buyStock);
router.post('/my/sell', auth, requireEmailVerifiedForWrite, tradingLimiter, validateTradingHours, validateSellStock, sellStock);
router.get('/my/transactions', auth, getPortfolioTransactions);

export default router;
