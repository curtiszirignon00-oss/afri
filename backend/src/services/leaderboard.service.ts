// src/services/leaderboard.service.ts
import { prisma } from '../config/database';

// ============= TYPES =============

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    name: string;
    lastname: string;
    username?: string;
    avatar_url?: string;
    totalValue: number;
    gainLoss: number;
    gainLossPercent: number;
    validTransactions: number;
    isEligible: boolean;
}

export interface UserRankInfo {
    rank: number | null;
    totalParticipants: number;
    percentile?: number;
}

// ============= HELPER FUNCTIONS =============

/**
 * Calcule la performance d'un portfolio Challenge
 */
async function calculatePortfolioPerformance(userId: string) {
    const wallet = await prisma.portfolio.findFirst({
        where: {
            userId,
            wallet_type: 'CONCOURS',
            status: 'ACTIVE',
        },
        include: {
            positions: true,
        },
    });

    if (!wallet) {
        return null;
    }

    // Calculer la valeur totale (cash + positions)
    let totalPositionValue = 0;

    // Récupérer les prix actuels des actions
    for (const position of wallet.positions) {
        const stock = await prisma.stock.findUnique({
            where: { ticker: position.stock_ticker },
        });

        if (stock) {
            totalPositionValue += position.quantity * stock.current_price;
        }
    }

    const totalValue = wallet.cash_balance + totalPositionValue;
    const gainLoss = totalValue - wallet.initial_balance;
    const gainLossPercent = (gainLoss / wallet.initial_balance) * 100;

    return {
        userId,
        totalValue,
        gainLoss,
        gainLossPercent,
    };
}

// ============= LEADERBOARD =============

/**
 * Calcule et retourne le leaderboard complet
 */
export async function calculateWeeklyRankings(limit: number = 100) {
    // Récupérer tous les participants actifs et éligibles
    const participants = await prisma.challengeParticipant.findMany({
        where: {
            status: 'ACTIVE',
            // is_eligible: true, // Optionnel: uniquement les éligibles
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                },
                include: {
                    profile: {
                        select: {
                            username: true,
                            avatar_url: true,
                        },
                    },
                },
            },
        },
    });

    // Calculer la performance de chaque participant
    const performances = await Promise.all(
        participants.map(async (participant) => {
            const perf = await calculatePortfolioPerformance(participant.userId);

            if (!perf) {
                return null;
            }

            return {
                userId: participant.userId,
                name: participant.user.name,
                lastname: participant.user.lastname,
                username: participant.user.profile?.username,
                avatar_url: participant.user.profile?.avatar_url,
                totalValue: perf.totalValue,
                gainLoss: perf.gainLoss,
                gainLossPercent: perf.gainLossPercent,
                validTransactions: participant.valid_transactions,
                isEligible: participant.is_eligible,
            };
        })
    );

    // Filtrer les nulls et trier par performance
    const validPerformances = performances
        .filter((p) => p !== null)
        .sort((a, b) => b!.gainLossPercent - a!.gainLossPercent);

    // Assigner les rangs
    const rankings: LeaderboardEntry[] = validPerformances.map((perf, index) => ({
        rank: index + 1,
        ...perf!,
    }));

    return rankings.slice(0, limit);
}

/**
 * Récupère le leaderboard Top N
 */
export async function getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    return await calculateWeeklyRankings(limit);
}

/**
 * Récupère le rang d'un utilisateur spécifique
 */
export async function getUserRank(userId: string): Promise<UserRankInfo> {
    // Vérifier si participant
    const participant = await prisma.challengeParticipant.findUnique({
        where: { userId },
    });

    if (!participant) {
        return {
            rank: null,
            totalParticipants: 0,
        };
    }

    // Calculer tous les classements
    const rankings = await calculateWeeklyRankings(1000); // Limiter à 1000 pour performance

    const totalParticipants = rankings.length;
    const userEntry = rankings.find((r) => r.userId === userId);

    if (!userEntry) {
        return {
            rank: null,
            totalParticipants,
        };
    }

    const percentile = ((totalParticipants - userEntry.rank) / totalParticipants) * 100;

    return {
        rank: userEntry.rank,
        totalParticipants,
        percentile,
    };
}

// ============= CACHE (OPTIONNEL - REDIS) =============

/**
 * Cache le leaderboard (si Redis disponible)
 * À implémenter si vous avez Redis configuré
 */
export async function cacheLeaderboard() {
    const rankings = await calculateWeeklyRankings(100);

    // TODO: Implémenter cache Redis
    // await redis.setex('challenge:leaderboard:weekly', 300, JSON.stringify(rankings));

    return rankings;
}

// ============= STATISTICS =============

/**
 * Récupère les statistiques globales du challenge
 */
export async function getChallengeStatistics() {
    const [
        totalParticipants,
        activeParticipants,
        eligibleParticipants,
        bannedParticipants,
    ] = await Promise.all([
        prisma.challengeParticipant.count(),
        prisma.challengeParticipant.count({ where: { status: 'ACTIVE' } }),
        prisma.challengeParticipant.count({ where: { is_eligible: true } }),
        prisma.challengeParticipant.count({ where: { status: 'BANNED' } }),
    ]);

    // Calculer le volume total de transactions
    const challengeWallets = await prisma.portfolio.findMany({
        where: { wallet_type: 'CONCOURS' },
        select: { id: true },
    });

    const walletIds = challengeWallets.map((w) => w.id);

    const totalTransactions = await prisma.transaction.count({
        where: {
            portfolioId: { in: walletIds },
        },
    });

    return {
        totalParticipants,
        activeParticipants,
        eligibleParticipants,
        bannedParticipants,
        totalTransactions,
    };
}

/**
 * Récupère les Top 3 et Flop 3 actions de la semaine
 */
export async function getWeeklyStockPerformance() {
    // Date il y a 7 jours
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Récupérer toutes les transactions de la semaine (wallet Concours)
    const challengeWallets = await prisma.portfolio.findMany({
        where: { wallet_type: 'CONCOURS' },
        select: { id: true },
    });

    const walletIds = challengeWallets.map((w) => w.id);

    const recentTransactions = await prisma.transaction.findMany({
        where: {
            portfolioId: { in: walletIds },
            created_at: { gte: weekAgo },
        },
        select: {
            stock_ticker: true,
            type: true,
        },
    });

    // Compter la fréquence de trading par ticker
    const tickerCount: Record<string, number> = {};

    recentTransactions.forEach((tx) => {
        tickerCount[tx.stock_ticker] = (tickerCount[tx.stock_ticker] || 0) + 1;
    });

    // Récupérer les infos des actions et leur performance
    const tickers = Object.keys(tickerCount);
    const stocks = await prisma.stock.findMany({
        where: { ticker: { in: tickers } },
        select: {
            ticker: true,
            company_name: true,
            current_price: true,
            change_percent: true,
        },
    });

    const stocksWithActivity = stocks.map((stock) => ({
        ...stock,
        tradingVolume: tickerCount[stock.ticker],
    }));

    // Top 3 = Plus forte hausse
    const top3 = stocksWithActivity
        .sort((a, b) => b.change_percent - a.change_percent)
        .slice(0, 3);

    // Flop 3 = Plus forte baisse
    const flop3 = stocksWithActivity
        .sort((a, b) => a.change_percent - b.change_percent)
        .slice(0, 3);

    return {
        top3,
        flop3,
    };
}
