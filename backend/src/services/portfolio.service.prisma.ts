// backend/src/services/portfolio.service.prisma.ts

import prisma from '../config/prisma';
import { Portfolio, Position, Transaction } from '@prisma/client';

// --- Find/Create Portfolio (Keep existing functions) ---

export async function findPortfolioByUserId(userId: string, walletType?: string): Promise<Portfolio | null> {
  try {
    const targetWalletType = walletType || 'SANDBOX';

    // Récupérer tous les portfolios de l'utilisateur, triés par date de création (le plus ancien d'abord)
    const allPortfolios = await prisma.portfolio.findMany({
      where: { userId: userId },
      include: { positions: true },
      orderBy: { created_at: 'asc' } // Le plus ancien d'abord
    });

    if (allPortfolios.length === 0) {
      return null;
    }

    // Pour CONCOURS: chercher le portfolio avec wallet_type === 'CONCOURS'
    if (targetWalletType === 'CONCOURS') {
      return allPortfolios.find(p => p.wallet_type === 'CONCOURS') || null;
    }

    // Pour SANDBOX: retourner le premier (plus ancien) portfolio qui n'est pas CONCOURS
    return allPortfolios.find(p => p.wallet_type !== 'CONCOURS') || null;
  } catch (error) {
    console.error('Error finding portfolio by user ID:', error);
    throw error;
  }
}

export async function createPortfolio(userId: string, data: Partial<Portfolio> = {}): Promise<Portfolio> {
  try {
    const portfolioData = {
      userId: userId,
      name: data.name || 'Mon Portefeuille Virtuel',
      initial_balance: data.initial_balance || 1000000,
      cash_balance: data.initial_balance || 1000000,
      is_virtual: data.is_virtual ?? true,
      ...data,
    };
    const newPortfolio = await prisma.portfolio.create({ data: portfolioData });
    return newPortfolio;
  } catch (error) {
    console.error('Error creating portfolio:', error);
    throw error;
  }
}

// --- Buy Stock Logic ---

export async function buyStock(
  userId: string,
  stockTicker: string,
  quantity: number,
  pricePerShare: number,
  walletType: 'SANDBOX' | 'CONCOURS' = 'SANDBOX'
): Promise<{ portfolio: Portfolio, transaction: Transaction }> {
  // We use Prisma Transaction to ensure all database operations succeed or fail together
  return prisma.$transaction(async (tx) => {
    // 1. Get all user portfolios, sorted by creation date (oldest first)
    const allPortfolios = await tx.portfolio.findMany({
      where: { userId: userId },
      include: { positions: true },
      orderBy: { created_at: 'asc' } // Le plus ancien d'abord
    });

    let portfolio: (Portfolio & { positions: Position[] }) | null = null;

    if (walletType === 'CONCOURS') {
      portfolio = allPortfolios.find(p => p.wallet_type === 'CONCOURS') || null;
    } else {
      // Pour SANDBOX: retourner le premier (plus ancien) portfolio qui n'est pas CONCOURS
      portfolio = allPortfolios.find(p => p.wallet_type !== 'CONCOURS') || null;
    }

    if (!portfolio) {
      throw new Error(`Portefeuille ${walletType} non trouvé pour cet utilisateur.`);
    }

    // 2. Calculate total cost and check funds
    const totalCost = quantity * pricePerShare;
    if (portfolio.cash_balance < totalCost) {
      throw new Error("Fonds insuffisants pour effectuer cet achat.");
    }

    // 3. Update Portfolio cash balance
    const updatedPortfolio = await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        cash_balance: portfolio.cash_balance - totalCost,
      },
    });

    // 4. Find or create the Position for this stock
    let position = portfolio.positions.find(p => p.stock_ticker === stockTicker);

    if (position) {
      // Update existing position
      const currentTotalValue = position.average_buy_price * position.quantity;
      const newTotalQuantity = position.quantity + quantity;
      const newAveragePrice = (currentTotalValue + totalCost) / newTotalQuantity;

      position = await tx.position.update({
        where: { id: position.id },
        data: {
          quantity: newTotalQuantity,
          average_buy_price: newAveragePrice,
        },
      });
    } else {
      // Create new position
      position = await tx.position.create({
        data: {
          portfolioId: portfolio.id,
          stock_ticker: stockTicker,
          quantity: quantity,
          average_buy_price: pricePerShare,
        },
      });
    }

    // 5. Create Transaction record with Challenge metadata
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const executionDay = dayNames[now.getDay()];
    const wasWeekend = now.getDay() === 0 || now.getDay() === 6;

    const transaction = await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        stock_ticker: stockTicker,
        type: 'BUY',
        quantity: quantity,
        price_per_share: pricePerShare,
        execution_day: executionDay,
        was_weekend: wasWeekend,
      },
    });

    // Return updated portfolio data (with new balance) and the transaction details
    // Note: The position update is implicitly included in the transaction's success
    return { portfolio: updatedPortfolio, transaction };
  }); // End of Prisma Transaction
}

// --- Sell Stock Logic ---

export async function sellStock(
  userId: string,
  stockTicker: string,
  quantity: number,
  pricePerShare: number,
  walletType: 'SANDBOX' | 'CONCOURS' = 'SANDBOX'
): Promise<{ portfolio: Portfolio, transaction: Transaction }> {
  return prisma.$transaction(async (tx) => {
    // 1. Get all user portfolios, sorted by creation date (oldest first)
    const allPortfolios = await tx.portfolio.findMany({
      where: { userId: userId },
      include: { positions: { where: { stock_ticker: stockTicker } } },
      orderBy: { created_at: 'asc' } // Le plus ancien d'abord
    });

    let portfolio: (Portfolio & { positions: Position[] }) | null = null;

    if (walletType === 'CONCOURS') {
      portfolio = allPortfolios.find(p => p.wallet_type === 'CONCOURS') || null;
    } else {
      // Pour SANDBOX: retourner le premier (plus ancien) portfolio qui n'est pas CONCOURS
      portfolio = allPortfolios.find(p => p.wallet_type !== 'CONCOURS') || null;
    }

    if (!portfolio) {
      throw new Error(`Portefeuille ${walletType} non trouvé.`);
    }

    const position = portfolio.positions[0]; // Get the first (and only) position returned

    if (!position) {
      throw new Error(`Position non trouvée pour ${stockTicker} dans ce portefeuille.`);
    }

    // 2. Check if user has enough shares
    if (position.quantity < quantity) {
      throw new Error(`Quantité insuffisante. Vous n'avez que ${position.quantity} actions de ${stockTicker}.`);
    }

    // 3. Calculate revenue and update portfolio cash balance
    const totalRevenue = quantity * pricePerShare;
    const updatedPortfolio = await tx.portfolio.update({
      where: { id: portfolio.id },
      data: {
        cash_balance: portfolio.cash_balance + totalRevenue,
      },
    });

    // 4. Update or Delete Position
    const newQuantity = position.quantity - quantity;
    if (newQuantity === 0) {
      // Delete the position if quantity becomes zero
      await tx.position.delete({
        where: { id: position.id },
      });
    } else {
      // Update the position quantity (average buy price doesn't change on sell)
      await tx.position.update({
        where: { id: position.id },
        data: {
          quantity: newQuantity,
        },
      });
    }

    // 5. Create Transaction record with Challenge metadata
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const executionDay = dayNames[now.getDay()];
    const wasWeekend = now.getDay() === 0 || now.getDay() === 6;

    const transaction = await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        stock_ticker: stockTicker,
        type: 'SELL',
        quantity: quantity,
        price_per_share: pricePerShare,
        execution_day: executionDay,
        was_weekend: wasWeekend,
      },
    });

    return { portfolio: updatedPortfolio, transaction };
  }); // End of Prisma Transaction
}

// --- Functions for getting positions/transactions (Add later if needed) ---
// export async function getPositionsByPortfolioId(...) {}
// export async function getTransactionsByPortfolioId(...) {}
// Add this function to portfolio.service.prisma.ts

// Function to get real portfolio history (cash + stock positions value)
export async function getPortfolioHistory(userId: string, walletType?: string): Promise<{ date: string; value: number }[]> {
  try {
    const targetWalletType = walletType || 'SANDBOX';
    console.log(`📊 [HISTORY] Getting history for userId=${userId}, walletType=${targetWalletType}`);

    // 1. Find the user's portfolio with all necessary data using the wallet-aware function
    const portfolio = await findPortfolioByUserId(userId, walletType);

    if (!portfolio) {
      console.log(`📊 [HISTORY] No portfolio found for ${targetWalletType}`);
      return []; // No portfolio, no history
    }

    console.log(`📊 [HISTORY] Found portfolio: id=${portfolio.id}, wallet_type=${portfolio.wallet_type}`);

    // Vérifier que le portfolio trouvé correspond bien au type demandé
    // Note: Les anciens portfolios SANDBOX peuvent avoir wallet_type = null/undefined
    const portfolioIsConours = portfolio.wallet_type === 'CONCOURS';

    if (targetWalletType === 'CONCOURS' && !portfolioIsConours) {
      console.log(`⚠️ [HISTORY] Mismatch! Asked for CONCOURS but got ${portfolio.wallet_type || 'SANDBOX (null)'}`);
      return []; // Ne pas retourner l'historique du mauvais wallet
    }
    if (targetWalletType !== 'CONCOURS' && portfolioIsConours) {
      console.log(`⚠️ [HISTORY] Mismatch! Asked for SANDBOX but got CONCOURS`);
      return []; // Ne pas retourner l'historique du mauvais wallet
    }

    // 2. Get transactions for this specific portfolio
    const transactions = await prisma.transaction.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { created_at: 'asc' },
      select: {
        stock_ticker: true,
        type: true,
        quantity: true,
        price_per_share: true,
        created_at: true
      }
    });

    console.log(`📊 [HISTORY] Found ${transactions.length} transactions for portfolio ${portfolio.id} (${targetWalletType})`);

    // 3. Si le portefeuille n'a aucune transaction, retourner uniquement le solde initial
    if (!transactions || transactions.length === 0) {
      const createdDate = portfolio.created_at || new Date();
      return [{
        date: createdDate.toISOString().split('T')[0],
        value: portfolio.initial_balance
      }];
    }

    // 4. Obtenir la plage de dates (de la création à aujourd'hui)
    const startDate = portfolio.created_at || new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 5. Récupérer tous les tickers utilisés dans les transactions
    const tickers = Array.from(new Set(transactions.map(tx => tx.stock_ticker)));

    // 5. Pré-charger TOUS les prix historiques pour tous les tickers en une seule requête
    const allStockHistory = await prisma.stockHistory.findMany({
      where: {
        stock_ticker: { in: tickers },
        date: { gte: startDate, lte: today }
      },
      select: {
        stock_ticker: true,
        date: true,
        close: true
      },
      orderBy: { date: 'asc' }
    });

    // 6. Organiser les prix historiques par ticker et date pour un accès rapide
    const pricesByTickerAndDate = new Map<string, Map<string, number>>();
    for (const history of allStockHistory) {
      const ticker = history.stock_ticker;
      const dateStr = history.date.toISOString().split('T')[0];

      if (!pricesByTickerAndDate.has(ticker)) {
        pricesByTickerAndDate.set(ticker, new Map());
      }
      pricesByTickerAndDate.get(ticker)!.set(dateStr, history.close);
    }

    // 7. Pré-charger les prix actuels pour les tickers sans historique complet
    const currentPrices = new Map<string, number>();
    const stocks = await prisma.stock.findMany({
      where: { symbol: { in: tickers } },
      select: { symbol: true, current_price: true }
    });
    for (const stock of stocks) {
      currentPrices.set(stock.symbol, stock.current_price);
    }

    // 8. Créer une map pour stocker l'historique par date
    const historyMap = new Map<string, number>();

    // 9. Initialiser avec le solde initial au jour de création
    const startDateStr = startDate.toISOString().split('T')[0];
    historyMap.set(startDateStr, portfolio.initial_balance);

    // 10. Pour chaque jour, calculer la valeur du portefeuille
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    // Map pour tracker les positions par ticker (incrémental)
    const positionsByTicker = new Map<string, { quantity: number }>();
    let cashBalance = portfolio.initial_balance;

    // Index pour parcourir les transactions une seule fois
    let transactionIndex = 0;

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dateEnd = new Date(currentDate);
      dateEnd.setHours(23, 59, 59, 999);

      // 10.1. Appliquer les transactions de ce jour (incrémental)
      while (transactionIndex < transactions.length) {
        const tx = transactions[transactionIndex];
        const txDate = tx.created_at ? new Date(tx.created_at) : null;

        if (!txDate || txDate > dateEnd) {
          break; // Attendre les prochains jours
        }

        const totalCost = tx.quantity * tx.price_per_share;

        if (tx.type === 'BUY') {
          cashBalance -= totalCost;
          const existing = positionsByTicker.get(tx.stock_ticker) || { quantity: 0 };
          existing.quantity += tx.quantity;
          positionsByTicker.set(tx.stock_ticker, existing);
        } else if (tx.type === 'SELL') {
          cashBalance += totalCost;
          const existing = positionsByTicker.get(tx.stock_ticker);
          if (existing) {
            existing.quantity -= tx.quantity;
            if (existing.quantity <= 0) {
              positionsByTicker.delete(tx.stock_ticker);
            } else {
              positionsByTicker.set(tx.stock_ticker, existing);
            }
          }
        }

        transactionIndex++;
      }

      // 10.2. Calculer la valeur des positions à cette date
      let stocksValue = 0;

      const positionEntries = Array.from(positionsByTicker.entries());
      for (let i = 0; i < positionEntries.length; i++) {
        const [ticker, position] = positionEntries[i];
        if (position.quantity > 0) {
          // Chercher le prix dans les données pré-chargées
          let price = 0;
          const tickerPrices = pricesByTickerAndDate.get(ticker);

          if (tickerPrices) {
            // Chercher le prix exact ou le plus récent disponible
            price = tickerPrices.get(dateStr) || 0;

            // Si pas de prix exact, chercher le prix le plus récent avant cette date
            if (price === 0) {
              const currentDateObj = new Date(dateStr);
              const priceEntries = Array.from(tickerPrices.entries());
              for (let j = 0; j < priceEntries.length; j++) {
                const [priceDate, priceValue] = priceEntries[j];
                const priceDateObj = new Date(priceDate);
                if (priceDateObj <= currentDateObj && priceValue > price) {
                  price = priceValue;
                }
              }
            }
          }

          // Si toujours pas de prix, utiliser le prix actuel
          if (price === 0) {
            price = currentPrices.get(ticker) || 0;
          }

          stocksValue += position.quantity * price;
        }
      }

      // 10.3. Valeur totale = cash + valeur des actions
      const totalValue = cashBalance + stocksValue;
      historyMap.set(dateStr, totalValue);

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 11. Convertir la map en array et trier par date
    const historyData = Array.from(historyMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return historyData;

  } catch (error) {
    console.error(`❌ Erreur lors de la récupération de l'historique pour l'utilisateur ${userId}:`, error);
    throw error;
  }
}
export async function getTransactionsByPortfolioId(portfolioId: string): Promise<Transaction[]> {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        portfolioId: portfolioId,
      },
      orderBy: {
        created_at: 'desc', // Latest transactions first
      },
    });
    return transactions;
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des transactions pour le portefeuille ${portfolioId}:`, error);
    throw error;
  }
}

/**
 * Get portfolio summary for profile display
 */
export async function getPortfolioSummary(userId: string) {
  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId: userId },
      include: {
        positions: {
          include: {
            stock: {
              select: {
                ticker: true,
                name: true,
                current_price: true,
              },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return null;
    }

    // Calculate positions value
    let positionsValue = 0;
    const positionsDetails: Array<{
      ticker: string;
      name: string;
      quantity: number;
      avgPrice: number;
      currentPrice: number;
      value: number;
      gainLoss: number;
      gainLossPercent: number;
    }> = [];

    for (const position of portfolio.positions) {
      const currentPrice = position.stock?.current_price || position.average_price;
      const positionValue = position.quantity * currentPrice;
      const costBasis = position.quantity * position.average_price;
      const positionGainLoss = positionValue - costBasis;
      const positionGainLossPercent = costBasis > 0 ? ((positionValue - costBasis) / costBasis) * 100 : 0;

      positionsValue += positionValue;

      positionsDetails.push({
        ticker: position.stockTicker,
        name: position.stock?.name || position.stockTicker,
        quantity: position.quantity,
        avgPrice: position.average_price,
        currentPrice: currentPrice,
        value: positionValue,
        gainLoss: positionGainLoss,
        gainLossPercent: positionGainLossPercent,
      });
    }

    const totalValue = portfolio.cash_balance + positionsValue;
    const investedValue = portfolio.initial_balance - portfolio.cash_balance;
    const totalGainLoss = totalValue - portfolio.initial_balance;
    const totalGainLossPercent = portfolio.initial_balance > 0
      ? ((totalValue - portfolio.initial_balance) / portfolio.initial_balance) * 100
      : 0;

    return {
      id: portfolio.id,
      name: portfolio.name,
      totalValue,
      cashBalance: portfolio.cash_balance,
      positionsValue,
      investedValue,
      initialBalance: portfolio.initial_balance,
      gainLoss: totalGainLoss,
      gainLossPercent: totalGainLossPercent,
      positionsCount: portfolio.positions.length,
      topPerformers: positionsDetails
        .filter(p => p.gainLossPercent > 0)
        .sort((a, b) => b.gainLossPercent - a.gainLossPercent)
        .slice(0, 3),
      topLosers: positionsDetails
        .filter(p => p.gainLossPercent < 0)
        .sort((a, b) => a.gainLossPercent - b.gainLossPercent)
        .slice(0, 3),
    };
  } catch (error) {
    console.error(`Error getting portfolio summary for user ${userId}:`, error);
    throw error;
  }
}