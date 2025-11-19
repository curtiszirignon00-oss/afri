// backend/src/controllers/stock.controller.ts

import { Response, Request, NextFunction } from "express";
import * as stockService from "../services/stock.service.prisma"; // <-- On utilise le service Prisma

// Pour la route: GET /api/stocks
export async function getStocks(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract filters from query parameters
    const filters = {
        searchTerm: req.query.search as string | undefined,
        sector: req.query.sector as string | undefined,
        sortBy: req.query.sort as string | undefined,
    };

    const stocks = await stockService.getAllStocks(filters);
    return res.status(200).json(stocks);
  } catch (error) {
    return next(error);
  }
}

// ... getStock (no change needed) ...

// Pour la route: GET /api/stocks/:symbol
export async function getStock(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const stock = await stockService.getStockBySymbol(symbol);

    if (!stock) {
        return res.status(404).json({ message: "Action non trouvée" });
    }
    return res.status(200).json(stock);
  } catch (error) {
    return next(error);
  }
}

// ========================================
// NOUVEAUX CONTRÔLEURS POUR STOCK DETAILS
// ========================================

// Pour la route: GET /api/stocks/:symbol/history?period=1Y
export async function getStockHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const period = (req.query.period as '1M' | '3M' | '6M' | '1Y' | 'ALL') || '1Y';

    const history = await stockService.getStockHistory(symbol, period);

    return res.status(200).json({
      symbol,
      period,
      data: history
    });
  } catch (error) {
    return next(error);
  }
}

// Pour la route: GET /api/stocks/:symbol/fundamentals
export async function getStockFundamentals(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const fundamentals = await stockService.getStockFundamentals(symbol);

    if (!fundamentals) {
      return res.status(404).json({ message: "Données fondamentales non disponibles" });
    }

    return res.status(200).json(fundamentals);
  } catch (error) {
    return next(error);
  }
}

// Pour la route: GET /api/stocks/:symbol/company
export async function getCompanyInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const companyInfo = await stockService.getCompanyInfo(symbol);

    if (!companyInfo) {
      return res.status(404).json({ message: "Informations sur la compagnie non disponibles" });
    }

    return res.status(200).json(companyInfo);
  } catch (error) {
    return next(error);
  }
}

// Pour la route: GET /api/stocks/:symbol/news?limit=10
export async function getStockNews(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const limit = parseInt(req.query.limit as string) || 10;

    const news = await stockService.getStockNews(symbol, limit);

    return res.status(200).json(news);
  } catch (error) {
    return next(error);
  }
}

// Pour la route: GET /api/stocks/:symbol/shareholders
export async function getShareholders(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const shareholders = await stockService.getShareholders(symbol);

    return res.status(200).json(shareholders);
  } catch (error) {
    return next(error);
  }
}

// Pour la route: GET /api/stocks/:symbol/financials?years=5
export async function getAnnualFinancials(req: Request, res: Response, next: NextFunction) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const yearsBack = parseInt(req.query.years as string) || 5;

    const financials = await stockService.getAnnualFinancials(symbol, yearsBack);

    return res.status(200).json({
      symbol,
      years: financials.length,
      data: financials
    });
  } catch (error) {
    return next(error);
  }
}