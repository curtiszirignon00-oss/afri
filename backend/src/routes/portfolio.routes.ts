// backend/src/routes/portfolio.routes.ts

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import { validateTradingHours } from '../middleware/challenge.middleware';
import { tradingLimiter } from '../middleware/rateLimiter';
import {
    getMyPortfolio,
    createMyPortfolio,
    buyStock,
    sellStock,
    getPortfolioHistory,
    getPortfolioTransactions,
    getPortfolioSummary
} from '../controllers/portfolio.controller';

const router = Router();

router.get('/summary', auth, getPortfolioSummary); // Summary for profile display
router.get('/my', auth, getMyPortfolio);
router.post('/my', auth, createMyPortfolio);
router.get('/my/history', auth, getPortfolioHistory);
// Trading routes avec rate limiting (30 transactions/min max)
router.post('/my/buy', auth, tradingLimiter, validateTradingHours, buyStock);
router.post('/my/sell', auth, tradingLimiter, validateTradingHours, sellStock);
router.get('/my/transactions', auth, getPortfolioTransactions);

export default router;
