// backend/src/controllers/portfolio.controller.ts

import { Request, Response, NextFunction } from 'express';
import * as portfolioService from '../services/portfolio.service.prisma';
import * as challengeService from '../services/challenge.service';
// Import gamification services
import * as xpService from '../services/xp.service';
import * as streakService from '../services/streak.service';
import * as achievementService from '../services/achievement.service';
import * as weeklyChallengeService from '../services/weekly-challenge.service';
import { prisma } from '../config/database';

// --- Portfolio Summary for Profile ---

export async function getPortfolioSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorise' });
    }

    const summary = await portfolioService.getPortfolioSummary(userId);
    if (!summary) {
      return res.status(404).json({ success: false, message: 'Portefeuille non trouve' });
    }

    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    return next(error);
  }
}

// --- Get/Create Portfolio ---

export async function getMyPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    // Support pour le multi-wallet (challenge)
    const walletType = req.query.wallet_type as string | undefined;

    const portfolio = await portfolioService.findPortfolioByUserId(userId, walletType);
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

    const { stockTicker, quantity, pricePerShare, walletType, wallet_type } = req.body;
    const targetWallet = (walletType || wallet_type || 'SANDBOX') as 'SANDBOX' | 'CONCOURS';

    if (!stockTicker || !quantity || !pricePerShare || quantity <= 0 || pricePerShare <= 0) {
      return res.status(400).json({ message: 'Données d\'achat invalides (ticker, quantité, prix)' });
    }

    // Call service with wallet_type
    const result = await portfolioService.buyStock(userId, stockTicker, quantity, pricePerShare, targetWallet);

    // Si wallet CONCOURS, mettre à jour l'éligibilité (unique ticker count)
    if (targetWallet === 'CONCOURS') {
      try {
        await challengeService.validateTransaction(userId, stockTicker);
      } catch (err) {
        console.error('Error validating challenge transaction:', err);
        // Non-blocking - ne pas faire échouer l'achat
      }
    }

    // ========== GAMIFICATION TRIGGERS ==========
    let xpGained = 0;
    let bonusXP = 0;
    let newAchievements: string[] = [];

    try {
      // 1. Vérifier si c'est la première transaction de l'utilisateur
      const transactionCount = await prisma.transaction.count({
        where: { portfolio: { userId } }
      });

      if (transactionCount === 1) {
        // Première transaction! +200 XP bonus
        const firstTradeResult = await xpService.addXPForAction(userId, 'FIRST_TRADE');
        bonusXP = firstTradeResult.xp_added;
      }

      // 2. Ajouter XP pour la transaction (+10 XP)
      const xpResult = await xpService.addXPForAction(userId, 'TRADE');
      xpGained = xpResult.xp_added;

      // 3. Enregistrer activité streak
      await streakService.recordActivity(userId, 'transaction');

      // 4. Mettre à jour progression défis hebdomadaires
      await weeklyChallengeService.updateChallengeProgress(userId, 'trade', 1);

      // 5. Vérifier déblocage de badges trading
      const unlockedAchievements = await achievementService.checkTradingAchievements(userId);
      newAchievements = unlockedAchievements.map(a => a.name);

    } catch (gamificationError) {
      console.error('Erreur gamification (buy stock):', gamificationError);
    }
    // ========== FIN GAMIFICATION ==========

    return res.status(200).json({
      ...result,
      gamification: {
        xpGained: xpGained + bonusXP,
        bonusXP: bonusXP > 0 ? { reason: 'Première transaction!', amount: bonusXP } : null,
        newAchievements
      }
    });

  } catch (error: any) {
    console.error("Error in buyStock controller:", error);
    return res.status(400).json({ message: error.message || "Erreur lors de l'achat" });
  }
}

export async function sellStock(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Non autorisé' });
    }

    const { stockTicker, quantity, pricePerShare, walletType, wallet_type } = req.body;
    const targetWallet = (walletType || wallet_type || 'SANDBOX') as 'SANDBOX' | 'CONCOURS';

    if (!stockTicker || !quantity || !pricePerShare || quantity <= 0 || pricePerShare <= 0) {
      return res.status(400).json({ message: 'Données de vente invalides (ticker, quantité, prix)' });
    }

    // Call service with wallet_type
    const result = await portfolioService.sellStock(userId, stockTicker, quantity, pricePerShare, targetWallet);

    // ========== GAMIFICATION TRIGGERS ==========
    let xpGained = 0;
    let newAchievements: string[] = [];

    try {
      // 1. Ajouter XP pour la transaction (+10 XP)
      const xpResult = await xpService.addXPForAction(userId, 'TRADE');
      xpGained = xpResult.xp_added;

      // 2. Enregistrer activité streak
      await streakService.recordActivity(userId, 'transaction');

      // 3. Mettre à jour progression défis hebdomadaires
      await weeklyChallengeService.updateChallengeProgress(userId, 'trade', 1);

      // 4. Vérifier déblocage de badges trading
      const unlockedAchievements = await achievementService.checkTradingAchievements(userId);
      newAchievements = unlockedAchievements.map(a => a.name);

    } catch (gamificationError) {
      console.error('Erreur gamification (sell stock):', gamificationError);
    }
    // ========== FIN GAMIFICATION ==========

    return res.status(200).json({
      ...result,
      gamification: {
        xpGained,
        newAchievements
      }
    });

  } catch (error: any) {
    console.error("Error in sellStock controller:", error);
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

    // Support pour le multi-wallet
    const walletType = req.query.wallet_type as string | undefined;

    const historyData = await portfolioService.getPortfolioHistory(userId, walletType);
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

    // Support pour le multi-wallet
    const walletType = req.query.wallet_type as string | undefined;

    // Find the portfolio first to get its ID
    const portfolio = await portfolioService.findPortfolioByUserId(userId, walletType);
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