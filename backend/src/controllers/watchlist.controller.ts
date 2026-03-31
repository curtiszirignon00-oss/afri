// backend/src/controllers/watchlist.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as watchlistService from '../services/watchlist.service.prisma';
import { getWatchlistScores } from '../services/watchlist.scores';
import * as xpService from '../services/xp.service';

// Controller for GET /api/watchlist/my
export async function getMyWatchlist(req: Request, res: Response, next: NextFunction) {
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
export async function addItemToMyWatchlist(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { stockTicker } = req.body; // Expecting { "stockTicker": "SNTS" } in body
    if (!stockTicker || typeof stockTicker !== 'string') {
        return res.status(400).json({ message: 'Ticker invalide fourni.' });
    }

    // Récupérer le tier d'abonnement de l'utilisateur
    const subscriptionTier = (req.user?.subscriptionTier || 'free') as 'free' | 'premium' | 'pro' | 'max';

    const newItem = await watchlistService.addToWatchlist(userId, stockTicker.toUpperCase(), subscriptionTier);
    return res.status(201).json(newItem); // Return the created/existing item

  } catch (error: any) {
    // Gérer l'erreur de limite atteinte
    if (error.message?.includes('Limite de watchlist atteinte')) {
      return res.status(403).json({ message: error.message });
    }
    return next(error);
  }
}

// Controller for GET /api/watchlist/my/scores
export async function getMyWatchlistScores(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Non autorisé' });

    const scores = await getWatchlistScores(userId);
    return res.status(200).json(scores);
  } catch (error) {
    return next(error);
  }
}

// Controller for GET /api/watchlist/my/enriched
export async function getMyWatchlistEnriched(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Non autorisé' });

    const enriched = await watchlistService.getWatchlistEnriched(userId);
    return res.status(200).json(enriched);
  } catch (error) {
    return next(error);
  }
}

// Controller for PATCH /api/watchlist/my/:ticker
export async function updateMyWatchlistItem(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Non autorisé' });

    const stockTicker = req.params.ticker;
    const { entry_price, note, tags } = req.body;

    // Fetch current state to detect first-time entry_price set → award XP
    const existing = await watchlistService.getWatchlistItem(userId, stockTicker.toUpperCase());
    const isFirstEntryPrice = entry_price != null && (existing == null || existing.entry_price == null);

    const updated = await watchlistService.updateWatchlistItem(userId, stockTicker.toUpperCase(), {
      entry_price: entry_price ?? undefined,
      note: note ?? undefined,
      tags: tags ?? undefined,
    });

    // +5 XP for setting an entry price for the first time (Investisseur précis 🎯)
    if (isFirstEntryPrice) {
      try {
        await xpService.addXP(userId, 5, 'watchlist_entry_price', 'Prix d\'entrée défini sur la watchlist — Investisseur précis 🎯');
      } catch { /* XP is non-fatal */ }
    }

    return res.status(200).json(updated);
  } catch (error: any) {
    if (error.message?.includes('non trouvé')) {
      return res.status(404).json({ message: error.message });
    }
    return next(error);
  }
}

// Controller for DELETE /api/watchlist/my/:ticker
export async function removeItemFromMyWatchlist(req: Request, res: Response, next: NextFunction) {
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