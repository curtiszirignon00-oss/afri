// backend/src/routes/portfolio.routes.ts

import { Router } from 'express';
import { auth } from '../middlewares/auth.middleware';
import {
    getMyPortfolio,
    createMyPortfolio,
    buyStock,
    sellStock,
    getPortfolioHistory,
    getPortfolioTransactions
} from '../controllers/portfolio.controller';

const router = Router();


router.get('/my', auth, getMyPortfolio );
router.post('/my', auth, createMyPortfolio );
router.get('/my/history', auth, getPortfolioHistory);
router.post('/my/buy', auth, buyStock);   // <-- ADDED: Route for buying stock
router.post('/my/sell', auth, sellStock); // <-- ADDED: Route for selling stock
router.get('/my/transactions', auth, getPortfolioTransactions);
export default router;
