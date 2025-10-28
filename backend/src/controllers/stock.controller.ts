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