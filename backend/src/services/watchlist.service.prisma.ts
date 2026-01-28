// backend/src/services/watchlist.service.prisma.ts

import prisma from '../config/prisma';
import { WatchlistItem } from '@prisma/client';

// Limites de watchlist selon l'abonnement
const WATCHLIST_LIMITS: Record<string, number> = {
  free: 3,
  premium: 15,
  pro: Infinity,
  max: Infinity, // Alias pour le plan max
};

// Get all watchlist items for a specific user
export async function getWatchlistByUserId(userId: string): Promise<WatchlistItem[]> {
  try {
    const watchlistItems = await prisma.watchlistItem.findMany({
      where: {
        userId: userId,
      },
      orderBy: { // Optional: order alphabetically by ticker
        stock_ticker: 'asc',
      },
    });
    return watchlistItems;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de la watchlist pour l'utilisateur ${userId}:`, error);
    throw error;
  }
}

// Add a stock ticker to a user's watchlist
export async function addToWatchlist(
  userId: string,
  stockTicker: string,
  userSubscriptionTier: 'free' | 'premium' | 'pro' | 'max' = 'free'
): Promise<WatchlistItem> {
  try {
    // First, check if the item already exists to avoid duplicates
    const existingItem = await prisma.watchlistItem.findFirst({
      where: {
        userId: userId,
        stock_ticker: stockTicker,
      },
    });

    if (existingItem) {
      // If it exists, just return the existing item
      return existingItem;
    }

    // Vérifier la limite de watchlist pour l'utilisateur
    const existingCount = await prisma.watchlistItem.count({
      where: {
        userId: userId,
      },
    });

    const limit = WATCHLIST_LIMITS[userSubscriptionTier] ?? WATCHLIST_LIMITS.free;
    if (existingCount >= limit) {
      throw new Error(
        `Limite de watchlist atteinte (${limit}). Passez à un plan supérieur pour ajouter plus d'actions.`
      );
    }

    // If it doesn't exist, create it
    const newItem = await prisma.watchlistItem.create({
      data: {
        userId: userId,
        stock_ticker: stockTicker,
      },
    });
    return newItem;
  } catch (error) {
    console.error(`❌ Erreur lors de l'ajout de ${stockTicker} à la watchlist pour ${userId}:`, error);
    throw error;
  }
}

// Remove a stock ticker from a user's watchlist
export async function removeFromWatchlist(userId: string, stockTicker: string): Promise<{ count: number }> {
    try {
        // DeleteMany returns a count of deleted records
        const deleteResult = await prisma.watchlistItem.deleteMany({
            where: {
                userId: userId,
                stock_ticker: stockTicker,
            },
        });
        
        if (deleteResult.count === 0) {
           // Optional: You could throw an error if the item wasn't found
           // throw new Error(`Ticker ${stockTicker} non trouvé dans la watchlist.`);
        }

        return deleteResult; // { count: 1 } if successful, { count: 0 } if not found
    } catch (error) {
        console.error(`❌ Erreur lors de la suppression de ${stockTicker} de la watchlist pour ${userId}:`, error);
        throw error;
    }
}