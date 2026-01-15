// backend/src/routes/stock.routes.ts

import { Router } from "express";
import {
  getStocks,
  getStock,
  getStockHistory,
  getStockFundamentals,
  getCompanyInfo,
  getStockNews,
  getShareholders,
  getAnnualFinancials,
  getComparisonHistory
} from "../controllers/stock.controller";

const router = Router();

router.get('/', getStocks);                      // Route pour lister toutes les actions
router.get('/comparison-history', getComparisonHistory); // Route pour historique de comparaison
router.get('/:symbol', getStock);                // Route pour voir une action par son symbole

// ========================================
// NOUVELLES ROUTES POUR STOCK DETAILS
// ========================================
router.get('/:symbol/history', getStockHistory);           // GET /api/stocks/:symbol/history?period=1Y
router.get('/:symbol/fundamentals', getStockFundamentals); // GET /api/stocks/:symbol/fundamentals
router.get('/:symbol/company', getCompanyInfo);            // GET /api/stocks/:symbol/company
router.get('/:symbol/news', getStockNews);                 // GET /api/stocks/:symbol/news?limit=10
router.get('/:symbol/shareholders', getShareholders);      // GET /api/stocks/:symbol/shareholders
router.get('/:symbol/financials', getAnnualFinancials);    // GET /api/stocks/:symbol/financials?years=5

export default router;