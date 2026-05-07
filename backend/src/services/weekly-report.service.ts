import { log } from '../config/logger';
import { prisma } from '../config/database';
import { sendWeeklyReportEmail } from './email.service';
import { getPortfolioStatsForUser } from './portfolio-summary.service';
import { getLearningStatsForUser } from './learning-summary.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MarketMover {
  symbol: string;
  companyName: string;
  currentPrice: number;
  weeklyChangePercent: number;
}

export interface WeeklyMarketData {
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  weekLabel: string; // ex: "du 14 au 18 avril 2025"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeeklyPeriod(): string {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const fmt = (d: Date) => {
    const day = d.getDate();
    const month = d.toLocaleDateString('fr-FR', { month: 'long' });
    const year = d.getFullYear();
    return `${day === 1 ? '1er' : day} ${month} ${year}`;
  };

  return `du ${fmt(sevenDaysAgo)} au ${fmt(now)}`;
}

/**
 * Calcule le top/flop marché de la semaine à partir de l'historique BRVM.
 * Compare le dernier close de la période aux closes d'il y a 7 jours.
 */
async function getWeeklyMarketData(): Promise<WeeklyMarketData> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Récupérer l'historique de la semaine pour tous les titres actifs
  const history = await prisma.stockHistory.findMany({
    where: { date: { gte: sevenDaysAgo } },
    orderBy: { date: 'asc' },
    select: { stock_ticker: true, date: true, close: true },
  });

  // Grouper par ticker : premier et dernier close de la semaine
  const byTicker = new Map<string, { first: number; last: number }>();
  for (const row of history) {
    const existing = byTicker.get(row.stock_ticker);
    if (!existing) {
      byTicker.set(row.stock_ticker, { first: row.close, last: row.close });
    } else {
      existing.last = row.close; // l'historique est trié par date asc
    }
  }

  // Calculer la variation hebdomadaire
  const changes: Array<{ ticker: string; changePercent: number }> = [];
  for (const [ticker, { first, last }] of byTicker) {
    if (first > 0) {
      changes.push({ ticker, changePercent: ((last - first) / first) * 100 });
    }
  }

  // Si aucune donnée d'historique, fallback sur daily_change_percent
  if (changes.length === 0) {
    log.warn('[WEEKLY REPORT] Pas de données historiques — fallback daily_change_percent');
    const stocks = await prisma.stock.findMany({
      where: { is_active: true },
      select: { symbol: true, company_name: true, current_price: true, daily_change_percent: true },
    });
    for (const s of stocks) {
      changes.push({ ticker: s.symbol, changePercent: s.daily_change_percent });
    }
  }

  // Récupérer les prix courants et noms des titres actifs
  const activeStocks = await prisma.stock.findMany({
    where: { is_active: true },
    select: { symbol: true, company_name: true, current_price: true },
  });
  const stockMap = new Map(activeStocks.map(s => [s.symbol, s]));

  // Trier et prendre top 5 et flop 5
  changes.sort((a, b) => b.changePercent - a.changePercent);

  const mapMover = (c: { ticker: string; changePercent: number }): MarketMover | null => {
    const s = stockMap.get(c.ticker);
    if (!s) return null;
    return {
      symbol: s.symbol,
      companyName: s.company_name,
      currentPrice: s.current_price,
      weeklyChangePercent: c.changePercent,
    };
  };

  const topGainers = changes
    .filter(c => c.changePercent > 0)
    .slice(0, 5)
    .map(mapMover)
    .filter((m): m is MarketMover => m !== null);

  const topLosers = changes
    .filter(c => c.changePercent < 0)
    .slice(-5)
    .reverse()
    .map(mapMover)
    .filter((m): m is MarketMover => m !== null);

  return { topGainers, topLosers, weekLabel: getWeeklyPeriod() };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Segmentation :
 *  A — Learner+Trader : a complété des modules CETTE SEMAINE + a des positions ouvertes
 *  B — Learner only   : a complété des modules, pas de positions ouvertes
 *  C — Trader only    : a des positions ouvertes, n'a pas complété de module cette semaine
 */
function getSegment(
  hasPositions: boolean,
  weeklyModulesCompleted: number,
): 'A' | 'B' | 'C' {
  if (weeklyModulesCompleted > 0 && hasPositions) return 'A';
  if (weeklyModulesCompleted > 0 && !hasPositions) return 'B';
  return 'C'; // hasPositions guaranteed (only eligible users reach here)
}

/**
 * Envoie le bilan hebdo fusionné à tous les utilisateurs éligibles.
 * Vendredi 18h UTC — remplace les anciens emails séparés apprentissage + portefeuille.
 */
export async function sendWeeklyReports(): Promise<void> {
  log.debug('📬 Début de l\'envoi des bilans hebdomadaires fusionnés...');

  try {
    const weekLabel = getWeeklyPeriod();

    // Utilisateurs éligibles : portfolio actif OU activité d'apprentissage cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const [portfolioUsers, learningUsers] = await Promise.all([
      prisma.user.findMany({
        where: {
          portfolios: {
            some: {
              is_virtual: true,
              positions: { some: { quantity: { gt: 0 } } },
            },
          },
        },
        select: { id: true },
      }),
      prisma.user.findMany({
        where: {
          learningProgress: {
            some: { completed_at: { gte: oneWeekAgo } },
          },
        },
        select: { id: true },
      }),
    ]);

    const allUserIds = new Set([
      ...portfolioUsers.map(u => u.id),
      ...learningUsers.map(u => u.id),
    ]);

    const portfolioUserIdSet = new Set(portfolioUsers.map(u => u.id));

    log.debug(`👥 ${allUserIds.size} utilisateur(s) éligible(s) au bilan hebdo`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userId of allUserIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            name: true,
            lastname: true,
            profile: { select: { global_rank: true } },
          },
        });

        if (!user) { skippedCount++; continue; }

        const displayName = user.name
          ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}`
          : 'Investisseur';

        // Calculer les stats en parallèle
        const [portfolioStats, learningStats] = await Promise.all([
          portfolioUserIdSet.has(userId) ? getPortfolioStatsForUser(userId) : Promise.resolve(null),
          getLearningStatsForUser(userId),
        ]);

        if (!portfolioStats && !learningStats) {
          skippedCount++;
          continue;
        }

        const hasPositions = !!(portfolioStats && portfolioStats.positionsCount > 0);
        const weeklyModules = learningStats?.weeklyModulesCompleted ?? 0;
        const segment = getSegment(hasPositions, weeklyModules);

        // Segment C without any learning data at all — skip (nothing to send)
        if (segment === 'C' && !portfolioStats) { skippedCount++; continue; }

        const portfolioEmailStats = portfolioStats ? {
          totalValue: portfolioStats.totalValue,
          cashBalance: portfolioStats.cashBalance,
          investedValue: portfolioStats.investedValue,
          totalGainLoss: portfolioStats.totalGainLoss,
          totalGainLossPercent: portfolioStats.totalGainLossPercent,
          topPerformers: portfolioStats.topPerformers,
          topLosers: portfolioStats.topLosers,
          positionsCount: portfolioStats.positionsCount,
          biweeklyEvolution: portfolioStats.biweeklyEvolution,
        } : undefined;

        const learningEmailStats = learningStats ? {
          weeklyModulesCompleted: learningStats.weeklyModulesCompleted,
          weeklyXpEarned: learningStats.weeklyXpEarned,
          currentStreak: learningStats.currentStreak,
          currentLevel: learningStats.currentLevel,
          totalXp: learningStats.totalXp,
          completionPercent: learningStats.completionPercent,
          totalModulesCompleted: learningStats.totalModulesCompleted,
          totalModulesAvailable: learningStats.totalModulesAvailable,
          suggestedModules: learningStats.suggestedModules.slice(0, 2),
          recentAchievements: learningStats.recentAchievements.map(a => ({
            name: a.name,
            description: a.description,
          })),
          rank: user.profile?.global_rank ?? undefined,
          isReminder: weeklyModules === 0 && learningStats.totalModulesCompleted > 0,
        } : undefined;

        await sendWeeklyReportEmail({
          email: user.email,
          name: displayName,
          period: weekLabel,
          segment,
          portfolioStats: portfolioEmailStats,
          learningStats: learningEmailStats,
        });

        log.debug(`✅ Bilan hebdo [${segment}] envoyé à ${user.email}`);
        successCount++;

        // Snapshot portefeuille pour suivre l'évolution la semaine prochaine
        if (portfolioStats) {
          await prisma.portfolioSnapshot.create({
            data: {
              portfolioId: portfolioStats.portfolioId,
              total_value: portfolioStats.totalValue,
              cash_balance: portfolioStats.cashBalance,
              invested_value: portfolioStats.investedValue,
              positions_value: portfolioStats.totalValue - portfolioStats.cashBalance,
              gain_loss: portfolioStats.totalGainLoss,
              gain_loss_percent: portfolioStats.totalGainLossPercent,
              positions_count: portfolioStats.positionsCount,
              snapshot_type: 'weekly_report',
            },
          });
        }

        // Throttle SMTP
        await new Promise(r => setTimeout(r, 800));
      } catch (err: any) {
        log.error(`❌ Erreur bilan hebdo pour user ${userId}:`, err.message);
        errorCount++;
      }
    }

    log.debug(`\n📬 Bilan hebdomadaire — résumé:`);
    log.debug(`   → Succès : ${successCount}`);
    log.debug(`   → Ignorés: ${skippedCount}`);
    log.debug(`   → Erreurs: ${errorCount}`);
    log.debug(`   → Total  : ${allUserIds.size}`);
  } catch (error) {
    log.error('[WEEKLY REPORT] Erreur globale:', error);
    throw error;
  }
}
