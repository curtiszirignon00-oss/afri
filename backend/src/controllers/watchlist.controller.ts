// backend/src/controllers/watchlist.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as watchlistService from '../services/watchlist.service.prisma';

// Interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: { id: string }; 
}

// Controller for GET /api/watchlist/my
export async function getMyWatchlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const watchlistItems = await watchlistService.getWatchlistByUserId(userId);
    // Return only the tickers, or the full items depending on frontend needs
    // const tickers = watchlistItems.map(item => item.stock_ticker);
    return res.status(200).json(watchlistItems); // Sending full items for now

  } catch (error) {
    return next(error);
  }
}

// Controller for POST /api/watchlist/my
export async function addItemToMyWatchlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { stockTicker } = req.body; // Expecting { "stockTicker": "SNTS" } in body
    if (!stockTicker || typeof stockTicker !== 'string') {
        return res.status(400).json({ message: 'Ticker invalide fourni.' });
    }

    const newItem = await watchlistService.addToWatchlist(userId, stockTicker.toUpperCase());
    return res.status(201).json(newItem); // Return the created/existing item

  } catch (error) {
    return next(error);
  }
}

// Controller for DELETE /api/watchlist/my/:ticker
export async function removeItemFromMyWatchlist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const stockTicker = req.params.ticker; // Get ticker from URL parameter
     if (!stockTicker || typeof stockTicker !== 'string') {
        return res.status(400).json({ message: 'Ticker invalide dans l\'URL.' });
    }

    const result = await watchlistService.removeFromWatchlist(userId, stockTicker.toUpperCase());

    if (result.count === 0) {
        return res.status(404).json({ message: `Ticker ${stockTicker} non trouvé dans la watchlist.` });
    }

    return res.status(204).send(); // 204 No Content for successful deletion

  } catch (error) {
    return next(error);
  }
}