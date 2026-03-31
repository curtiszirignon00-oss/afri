import { log } from '../config/logger';
// Service pour calculer les statistiques de portefeuille et envoyer les résumés bi-hebdomadaires
import { prisma } from '../config/database';
import { sendPortfolioSummaryEmail } from './email.service';

interface PortfolioPosition {
  stock_ticker: string;
  quantity: number;
  average_purchase_price: number;
  current_price: number;
  value: number;
  invested: number;
  gain_loss: number;
  gain_loss_percent: number;
}

interface UserPortfolioStats {
  userId: string;
  email: string;
  name: string;
  portfolioId: string;
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  topPerformers: Array<{
    ticker: string;
    gainLossPercent: number;
    value: number;
  }>;
  topLosers: Array<{
    ticker: string;
    gainLossPercent: number;
    value: number;
  }>;
  positionsCount: number;
  period: string;
  biweeklyEvolution?: {
    previousValue: number;
    currentValue: number;
    change: number;
    changePercent: number;
  };
}

/**
 * Calcule la période bi-hebdomadaire (par exemple: "du 1er au 14 janvier 2026")
 */
function getBiweeklyPeriod(): string {
  const now = new Date();
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(now.getDate() - 14);

  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'long' });
    const year = date.getFullYear();

    // Ordinal en français
    const dayStr = day === 1 ? '1er' : day.toString();

    return `${dayStr} ${month} ${year}`;
  };

  return `du ${formatDate(twoWeeksAgo)} au ${formatDate(now)}`;
}

/**
 * Récupère le prix actuel d'une action depuis la base de données
 */
async function getCurrentPrice(stockTicker: string): Promise<number> {
  const stock = await prisma.stock.findUnique({
    where: { symbol: stockTicker },
    select: { current_price: true },
  });

  return stock?.current_price || 0;
}

/**
 * Crée un snapshot du portefeuille
 */
async function createPortfolioSnapshot(
  portfolioId: string,
  stats: {
    totalValue: number;
    cashBalance: number;
    investedValue: number;
    positionsValue: number;
    gainLoss: number;
    gainLossPercent: number;
    positionsCount: number;
  },
  snapshotType: string = 'bi_weekly_summary'
): Promise<void> {
  await prisma.portfolioSnapshot.create({
    data: {
      portfolioId,
      total_value: stats.totalValue,
      cash_balance: stats.cashBalance,
      invested_value: stats.investedValue,
      positions_value: stats.positionsValue,
      gain_loss: stats.gainLoss,
      gain_loss_percent: stats.gainLossPercent,
      positions_count: stats.positionsCount,
      snapshot_type: snapshotType,
    },
  });
}

/**
 * Récupère le dernier snapshot bi-hebdomadaire d'un portefeuille
 */
async function getLastBiweeklySnapshot(portfolioId: string) {
  return await prisma.portfolioSnapshot.findFirst({
    where: {
      portfolioId,
      snapshot_type: 'bi_weekly_summary',
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

/**
 * Calcule les statistiques du portefeuille d'un utilisateur
 */
async function calculateUserPortfolioStats(userId: string): Promise<UserPortfolioStats | null> {
  try {
    // Récupérer l'utilisateur avec son portfolio
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        portfolios: {
          where: { is_virtual: true }, // Portfolio de simulation
          select: {
            id: true,
            cash_balance: true,
            positions: {
              where: { quantity: { gt: 0 } }, // Seulement les positions actives
              select: {
                stock_ticker: true,
                quantity: true,
                average_buy_price: true,
              },
            },
          },
          take: 1, // Premier portfolio de simulation
        },
      },
    });

    if (!user || !user.portfolios || user.portfolios.length === 0) {
      return null; // Pas de portfolio
    }

    const portfolio = user.portfolios[0];
    const cashBalance = portfolio.cash_balance;
    const positions = portfolio.positions;

    if (positions.length === 0) {
      return null; // Pas de positions actives
    }

    // Calculer les statistiques de chaque position
    const positionStats: PortfolioPosition[] = await Promise.all(
      positions.map(async (position) => {
        const currentPrice = await getCurrentPrice(position.stock_ticker);
        const value = position.quantity * currentPrice;
        const invested = position.quantity * position.average_buy_price;
        const gainLoss = value - invested;
        const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;

        return {
          stock_ticker: position.stock_ticker,
          quantity: position.quantity,
          average_purchase_price: position.average_buy_price,
          current_price: currentPrice,
          value,
          invested,
          gain_loss: gainLoss,
          gain_loss_percent: gainLossPercent,
        };
      })
    );

    // Calculer les totaux
    const investedValue = positionStats.reduce((sum, pos) => sum + pos.invested, 0);
    const currentValue = positionStats.reduce((sum, pos) => sum + pos.value, 0);
    const totalValue = currentValue + cashBalance;
    const totalGainLoss = currentValue - investedValue;
    const totalGainLossPercent = investedValue > 0 ? (totalGainLoss / investedValue) * 100 : 0;

    // Trier par performance
    const sortedByPerformance = [...positionStats].sort(
      (a, b) => b.gain_loss_percent - a.gain_loss_percent
    );

    // Top 3 performers et losers
    const topPerformers = sortedByPerformance.slice(0, 3).map((pos) => ({
      ticker: pos.stock_ticker,
      gainLossPercent: pos.gain_loss_percent,
      value: pos.value, // Valeur totale de la position (quantité × prix actuel)
    }));

    const topLosers = sortedByPerformance
      .slice(-3)
      .reverse()
      .map((pos) => ({
        ticker: pos.stock_ticker,
        gainLossPercent: pos.gain_loss_percent,
        value: pos.value, // Valeur totale de la position (quantité × prix actuel)
      }));

    const userName = user.name
      ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
      : 'Investisseur';

    // Récupérer le dernier snapshot pour calculer l'évolution
    const lastSnapshot = await getLastBiweeklySnapshot(portfolio.id);
    let biweeklyEvolution: UserPortfolioStats['biweeklyEvolution'] = undefined;

    if (lastSnapshot) {
      const change = totalValue - lastSnapshot.total_value;
      const changePercent = lastSnapshot.total_value > 0
        ? (change / lastSnapshot.total_value) * 100
        : 0;

      biweeklyEvolution = {
        previousValue: lastSnapshot.total_value,
        currentValue: totalValue,
        change,
        changePercent,
      };
    }

    return {
      userId: user.id,
      email: user.email,
      name: userName,
      portfolioId: portfolio.id,
      totalValue,
      cashBalance,
      investedValue,
      totalGainLoss,
      totalGainLossPercent,
      topPerformers,
      topLosers,
      positionsCount: positions.length,
      period: getBiweeklyPeriod(),
      biweeklyEvolution,
    };
  } catch (error) {
    log.error(`[PORTFOLIO SUMMARY] Erreur calcul stats pour user ${userId}:`, error);
    return null;
  }
}

/**
 * Envoie les résumés de portefeuille à tous les utilisateurs avec des positions actives
 */
export async function sendBiweeklyPortfolioSummaries(): Promise<void> {
  log.debug('📊 Début de l\'envoi des résumés bi-hebdomadaires de portefeuille...');

  try {
    // Récupérer tous les utilisateurs avec un portfolio virtuel et des positions
    const users = await prisma.user.findMany({
      where: {
        portfolios: {
          some: {
            is_virtual: true,
            positions: {
              some: {
                quantity: { gt: 0 },
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    log.debug(`📧 ${users.length} utilisateur(s) avec positions actives trouvé(s)`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Calculer les stats du portefeuille
        const stats = await calculateUserPortfolioStats(user.id);

        if (!stats) {
          log.debug(`⏭️  Pas de stats disponibles pour user ${user.id}`);
          continue;
        }

        // Envoyer l'email
        await sendPortfolioSummaryEmail({
          email: stats.email,
          name: stats.name,
          portfolioStats: {
            totalValue: stats.totalValue,
            cashBalance: stats.cashBalance,
            investedValue: stats.investedValue,
            totalGainLoss: stats.totalGainLoss,
            totalGainLossPercent: stats.totalGainLossPercent,
            topPerformers: stats.topPerformers,
            topLosers: stats.topLosers,
            positionsCount: stats.positionsCount,
            period: stats.period,
            biweeklyEvolution: stats.biweeklyEvolution,
          },
        });

        log.debug(`✅ Email envoyé à ${stats.email} (${stats.name})`);
        successCount++;

        // Créer un snapshot pour le prochain calcul d'évolution
        await createPortfolioSnapshot(
          stats.portfolioId,
          {
            totalValue: stats.totalValue,
            cashBalance: stats.cashBalance,
            investedValue: stats.investedValue,
            positionsValue: stats.totalValue - stats.cashBalance,
            gainLoss: stats.totalGainLoss,
            gainLossPercent: stats.totalGainLossPercent,
            positionsCount: stats.positionsCount,
          },
          'bi_weekly_summary'
        );
        log.debug(`📸 Snapshot créé pour portfolio ${stats.portfolioId}`);

        // Petit délai pour éviter de surcharger le serveur SMTP
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        log.error(`❌ Erreur envoi email pour user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    log.debug(`\n📊 Résumé de l'envoi:`);
    log.debug(`   → Succès: ${successCount}`);
    log.debug(`   → Erreurs: ${errorCount}`);
    log.debug(`   → Total: ${users.length}`);
  } catch (error) {
    log.error('[PORTFOLIO SUMMARY] Erreur globale:', error);
    throw error;
  }
}

/**
 * Calcule et retourne les stats d'un utilisateur spécifique (pour tests)
 */
export async function getPortfolioStatsForUser(userId: string): Promise<UserPortfolioStats | null> {
  return calculateUserPortfolioStats(userId);
}
