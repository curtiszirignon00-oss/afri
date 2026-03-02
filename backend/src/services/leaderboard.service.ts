// src/services/leaderboard.service.ts
import { prisma } from '../config/database';
import { cacheGet, cacheSet, cacheDelete, cacheInvalidatePattern, CACHE_TTL, CACHE_KEYS } from './cache.service';

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
    top3Streak: number;        // jours consécutifs dans le top 3 (0 si hors top 3)
    streakRank: number | null; // rang tenu lors du streak (1, 2, 3), null si hors top 3
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
            where: { symbol: position.stock_ticker },
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
    // Récupérer tous les participants actifs, triés par date d'inscription (tie-breaker stable)
    const participants = await prisma.challengeParticipant.findMany({
        where: {
            status: 'ACTIVE',
        },
        orderBy: { enrollment_date: 'asc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
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
            // Guard: participant sans utilisateur associé (donnée orpheline)
            if (!participant.user) {
                console.warn(`[Leaderboard] Participant orphelin ignoré: ${participant.userId}`);
                return null;
            }

            const perf = await calculatePortfolioPerformance(participant.userId);

            // Si pas de wallet trouvé, afficher le participant à 0% (état Jour 1 ou wallet manquant)
            return {
                userId: participant.userId,
                name: participant.user.name,
                lastname: participant.user.lastname,
                username: participant.user.profile?.username,
                avatar_url: participant.user.profile?.avatar_url,
                totalValue: perf?.totalValue ?? 1_000_000,
                gainLoss: perf?.gainLoss ?? 0,
                gainLossPercent: perf?.gainLossPercent ?? 0,
                validTransactions: participant.valid_transactions,
                isEligible: participant.is_eligible,
                // Streak : uniquement affiché si le participant est en top 3 ET a un streak actif
                top3Streak: (participant as any).top3_streak ?? 0,
                streakRank: (participant as any).top3_rank ?? null,
            };
        })
    );

    // Filtrer les participants orphelins
    const validPerformances = performances.filter((p): p is NonNullable<typeof p> => p !== null);

    // Trier par performance décroissante (à égalité : ordre stable par date d'inscription)
    const sorted = validPerformances.sort((a, b) => b.gainLossPercent - a.gainLossPercent);

    // Assigner les rangs et masquer le streak si le participant n'est plus dans le top 3
    const rankings: LeaderboardEntry[] = sorted.map((perf, index) => {
        const currentRank = index + 1;
        const isInTop3 = currentRank <= 3;
        return {
            rank: currentRank,
            ...perf,
            // N'afficher le streak que si la personne est actuellement dans le top 3
            top3Streak: isInTop3 ? perf.top3Streak : 0,
            streakRank: isInTop3 ? currentRank : null,
        };
    });

    return rankings.slice(0, limit);
}

/**
 * Récupère le leaderboard Top N (avec cache Redis)
 */
export async function getLeaderboard(limit: number = 20): Promise<LeaderboardEntry[]> {
    const cacheKey = CACHE_KEYS.leaderboard(limit);
    const cached = await cacheGet<LeaderboardEntry[]>(cacheKey);
    if (cached) return cached;

    const rankings = await calculateWeeklyRankings(limit);

    await cacheSet(cacheKey, rankings, CACHE_TTL.LEADERBOARD);

    return rankings;
}

/**
 * Récupère le rang d'un utilisateur spécifique (avec cache Redis)
 */
export async function getUserRank(userId: string): Promise<UserRankInfo> {
    const cacheKey = CACHE_KEYS.userRank(userId);
    const cached = await cacheGet<UserRankInfo>(cacheKey);
    if (cached) return cached;

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

    const result: UserRankInfo = {
        rank: userEntry.rank,
        totalParticipants,
        percentile,
    };

    await cacheSet(cacheKey, result, CACHE_TTL.LEADERBOARD);

    return result;
}

// ============= CACHE (OPTIONNEL - REDIS) =============

/**
 * Force le rafraichissement du cache leaderboard.
 */
export async function cacheLeaderboard() {
    await cacheInvalidatePattern('leaderboard:*');
    return await getLeaderboard(100);
}

// ============= STATISTICS =============

/**
 * Récupère les statistiques globales du challenge (avec cache Redis)
 */
export async function getChallengeStatistics() {
    const cacheKey = CACHE_KEYS.challengeStats();
    const cached = await cacheGet<any>(cacheKey);
    if (cached) return cached;

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

    const stats = {
        totalParticipants,
        activeParticipants,
        eligibleParticipants,
        bannedParticipants,
        totalTransactions,
    };

    await cacheSet(cacheKey, stats, CACHE_TTL.CHALLENGE_STATS);

    return stats;
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
        where: { symbol: { in: tickers } },
        select: {
            symbol: true,
            company_name: true,
            current_price: true,
            daily_change_percent: true,
        },
    });

    const stocksWithActivity = stocks.map((stock) => ({
        ...stock,
        tradingVolume: tickerCount[stock.symbol],
    }));

    // Top 3 = Plus forte hausse
    const top3 = stocksWithActivity
        .sort((a, b) => b.daily_change_percent - a.daily_change_percent)
        .slice(0, 3);

    // Flop 3 = Plus forte baisse
    const flop3 = stocksWithActivity
        .sort((a, b) => a.daily_change_percent - b.daily_change_percent)
        .slice(0, 3);

    return {
        top3,
        flop3,
    };
}
