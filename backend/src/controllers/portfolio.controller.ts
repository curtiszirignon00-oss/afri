// backend/src/controllers/portfolio.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as portfolioService from '../services/portfolio.service.prisma';

// --- Get/Create Portfolio ---

export async function getMyPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const portfolio = await portfolioService.findPortfolioByUserId(userId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }
    return res.status(200).json(portfolio);

  } catch (error) {
    return next(error);
  }
}

export async function createMyPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const existingPortfolio = await portfolioService.findPortfolioByUserId(userId);
    if (existingPortfolio) {
      return res.status(400).json({ message: 'Un portefeuille existe déjà pour cet utilisateur' });
    }

    const portfolioData = req.body;
    const newPortfolio = await portfolioService.createPortfolio(userId, portfolioData);
    return res.status(201).json(newPortfolio);

  } catch (error) {
    return next(error);
  }
}

// --- Buy/Sell Actions ---

export async function buyStock(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { stockTicker, quantity, pricePerShare } = req.body;

    if (!stockTicker || !quantity || !pricePerShare || quantity <= 0 || pricePerShare <= 0) {
        return res.status(400).json({ message: 'Données d\'achat invalides (ticker, quantité, prix)' });
    }

    // --- Service call is now active ---
    const result = await portfolioService.buyStock(userId, stockTicker, quantity, pricePerShare);
    return res.status(200).json(result); // Return updated portfolio and transaction details
    // --- End Service call ---

  } catch (error: any) {
     console.error("Error in buyStock controller:", error);
     // Return specific error message from service (e.g., "Fonds insuffisants")
     return res.status(400).json({ message: error.message || "Erreur lors de l'achat" });
  }
}

export async function sellStock(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { stockTicker, quantity, pricePerShare } = req.body;

    if (!stockTicker || !quantity || !pricePerShare || quantity <= 0 || pricePerShare <= 0) {
        return res.status(400).json({ message: 'Données de vente invalides (ticker, quantité, prix)' });
    }

    // --- Service call is now active ---
    const result = await portfolioService.sellStock(userId, stockTicker, quantity, pricePerShare);
    return res.status(200).json(result); // Return updated portfolio and transaction details
    // --- End Service call ---

  } catch (error: any) {
    console.error("Error in sellStock controller:", error);
    // Return specific error message from service (e.g., "Quantité insuffisante")
    return res.status(400).json({ message: error.message || "Erreur lors de la vente" });
  }
}

// --- TODO: Add functions for positions and transactions ---
// export async function getPortfolioPositions(...) {}
// export async function getPortfolioTransactions(...) {}
// Add this function to portfolio.controller.ts

// Controller for GET /api/portfolios/my/history
export async function getPortfolioHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const historyData = await portfolioService.getPortfolioHistory(userId);
    return res.status(200).json(historyData);

  } catch (error) {
    return next(error);
  }
}
export async function getPortfolioTransactions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    // Find the portfolio first to get its ID
    const portfolio = await portfolioService.findPortfolioByUserId(userId);
    if (!portfolio) {
      return res.status(404).json({ message: 'Portefeuille non trouvé' });
    }

    // Fetch transactions using the portfolio ID
    const transactions = await portfolioService.getTransactionsByPortfolioId(portfolio.id);
    return res.status(200).json(transactions);

  } catch (error) {
    return next(error);
  }
}