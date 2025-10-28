// backend/src/services/portfolio.service.prisma.ts

import prisma from '../config/prisma';
import { Portfolio, Position, Transaction } from '@prisma/client';

// --- Find/Create Portfolio (Keep existing functions) ---

export async function findPortfolioByUserId(userId: string): Promise<Portfolio | null> {
    try {
        const portfolio = await prisma.portfolio.findFirst({
            where: { userId: userId },
            include: { // Include positions when fetching the portfolio
                positions: true 
            }
        });
        return portfolio;
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

export async function buyStock(userId: string, stockTicker: string, quantity: number, pricePerShare: number): Promise<{ portfolio: Portfolio, transaction: Transaction }> {
    // We use Prisma Transaction to ensure all database operations succeed or fail together
    return prisma.$transaction(async (tx) => {
        // 1. Get the user's portfolio
        const portfolio = await tx.portfolio.findFirst({
            where: { userId: userId },
            include: { positions: true } // Include current positions
        });

        if (!portfolio) {
            throw new Error("Portefeuille non trouvé pour cet utilisateur.");
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

        // 5. Create Transaction record
        const transaction = await tx.transaction.create({
            data: {
                portfolioId: portfolio.id,
                stock_ticker: stockTicker,
                type: 'BUY',
                quantity: quantity,
                price_per_share: pricePerShare,
            },
        });

        // Return updated portfolio data (with new balance) and the transaction details
        // Note: The position update is implicitly included in the transaction's success
        return { portfolio: updatedPortfolio, transaction };
    }); // End of Prisma Transaction
}

// --- Sell Stock Logic ---

export async function sellStock(userId: string, stockTicker: string, quantity: number, pricePerShare: number): Promise<{ portfolio: Portfolio, transaction: Transaction }> {
    return prisma.$transaction(async (tx) => {
        // 1. Get portfolio AND the specific position to sell
        const portfolio = await tx.portfolio.findFirst({
            where: { userId: userId },
            include: {
                positions: { // Only include the position we want to sell
                    where: { stock_ticker: stockTicker }
                }
            }
        });

        if (!portfolio) {
            throw new Error("Portefeuille non trouvé.");
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

        // 5. Create Transaction record
        const transaction = await tx.transaction.create({
            data: {
                portfolioId: portfolio.id,
                stock_ticker: stockTicker,
                type: 'SELL',
                quantity: quantity,
                price_per_share: pricePerShare,
            },
        });

        return { portfolio: updatedPortfolio, transaction };
    }); // End of Prisma Transaction
}

// --- Functions for getting positions/transactions (Add later if needed) ---
// export async function getPositionsByPortfolioId(...) {}
// export async function getTransactionsByPortfolioId(...) {}
// Add this function to portfolio.service.prisma.ts

// Placeholder function for portfolio history
export async function getPortfolioHistory(userId: string): Promise<{ date: string; value: number }[]> {
  try {
    // 1. Find the user's portfolio ID (needed if you fetch transactions)
    const portfolio = await prisma.portfolio.findFirst({
        where: { userId: userId },
        select: { id: true } // Only need the ID
    });

    if (!portfolio) {
        return []; // No portfolio, no history
    }

    // --- Placeholder Implementation ---
    // TODO: Replace this with actual calculation later
    // For now, return some dummy data for the last 30 days
    const today = new Date();
    const historyData: { date: string; value: number }[] = [];
    const initialValue = 1000000; // Default initial balance

    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        // Simulate slight random changes for visual effect
        const randomFactor = 1 + (Math.random() - 0.5) * 0.05; // +/- 2.5% variation
        historyData.push({
            date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
            value: Math.round(initialValue * randomFactor), // Apply random fluctuation
        });
    }
    return historyData;
    // --- End Placeholder ---

    /* // --- More complex (but still simplified) approach based on transactions ---
       // This only reflects cash changes, NOT stock value changes
       const transactions = await prisma.transaction.findMany({
           where: { portfolioId: portfolio.id },
           orderBy: { created_at: 'asc' }
       });

       let currentValue = 1000000; // Start with initial balance
       const historyMap = new Map<string, number>();
       historyMap.set('start', currentValue); // Add initial point

       transactions.forEach(tx => {
           const dateStr = tx.created_at?.toISOString().split('T')[0];
           if (!dateStr) return;

           if (tx.type === 'BUY') {
               currentValue -= tx.quantity * tx.price_per_share;
           } else if (tx.type === 'SELL') {
               currentValue += tx.quantity * tx.price_per_share;
           }
           historyMap.set(dateStr, currentValue); // Overwrite if multiple tx on same day
       });

       // Convert map to array format expected by chart
       const historyData = Array.from(historyMap.entries()).map(([date, value]) => ({ date, value }));
       // Ensure sorted by date if map order isn't guaranteed (though it often is)
       historyData.sort((a, b) => a.date.localeCompare(b.date));
       return historyData;
    */

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