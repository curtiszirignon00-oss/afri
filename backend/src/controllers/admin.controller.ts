import { log } from '../config/logger';
import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { getAISummary } from '../ai/aiAnalytics.service';
import { sendWebinarLaunchEmail } from '../services/email.service';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
}

/**
 * Forcer la vérification d'email d'un utilisateur (admin uniquement)
 */
export const forceVerifyUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const admin = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé. Admin uniquement.' });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis.' });
    }

    const target = await prisma.user.findUnique({ where: { email } });
    if (!target) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    }

    if (target.email_verified_at) {
      return res.status(200).json({ success: true, message: 'Email déjà vérifié.', alreadyVerified: true });
    }

    await prisma.user.update({
      where: { email },
      data: {
        email_verified_at: new Date(),
        email_confirmation_token: null,
        email_confirmation_expires: null,
      },
    });

    return res.status(200).json({ success: true, message: `Email de ${email} vérifié avec succès.` });
  } catch (error) {
    log.error('Erreur forceVerifyUser:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Obtenir la liste des utilisateurs avec des intentions premium (admin uniquement)
 */
export const getPremiumIntents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé. Admin uniquement.' });
    }

    const intents = await prisma.subscriptionIntent.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        planId: true,
        planName: true,
        price: true,
        paymentMethod: true,
        feature: true,
        source: true,
        created_at: true,
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: intents });
  } catch (error) {
    log.error('Erreur getPremiumIntents:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Obtenir toutes les statistiques de la plateforme (admin uniquement) - VERSION SIMPLIFIÉE
 */
export const getPlatformStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // Vérifier que l'utilisateur est admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Admin uniquement.',
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Toutes les requêtes en parallèle — aucun findMany sur table entière
    const [
      totalUsers,
      confirmedUsers,
      activeUsersLast7Days,
      latestUsers,
      totalPortfolios,
      totalTransactions,
      transactionsLast30Days,
      totalIntents,
      // groupBy intentions : par plan, par méthode de paiement, par userId (→ count = unique users)
      intentsByPlanRaw,
      intentsByPaymentRaw,
      uniqueIntentUsersRaw,
      // groupBy transactions : par type
      transactionsByTypeRaw,
      // Agrégation volume : SUM(quantity * price_per_share) via pipeline MongoDB
      volumeRaw,
      // Top 10 portfolios triés par count de transactions — limité à 50 pour la dé-duplication user
      topPortfolios,
    ] = await Promise.all([
      // 1. UTILISATEURS
      prisma.user.count(),
      prisma.user.count({ where: { email_verified_at: { not: null } } }),
      prisma.user.count({ where: { updated_at: { gte: sevenDaysAgo } } }),
      prisma.user.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        select: { id: true, name: true, lastname: true, email: true, email_verified_at: true, role: true, created_at: true },
      }),
      // 2. PORTEFEUILLES
      prisma.portfolio.count(),
      // 3. TRANSACTIONS
      prisma.transaction.count(),
      prisma.transaction.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      // 4. INTENTIONS
      prisma.subscriptionIntent.count(),
      prisma.subscriptionIntent.groupBy({ by: ['planId'], _count: { _all: true } }),
      prisma.subscriptionIntent.groupBy({ by: ['paymentMethod'], _count: { _all: true } }),
      prisma.subscriptionIntent.groupBy({ by: ['userId'], _count: { _all: true } }),
      // 5. TRANSACTIONS — groupBy type + volume via agrégation MongoDB
      prisma.transaction.groupBy({ by: ['type'], _count: { _all: true } }),
      prisma.$runCommandRaw({
        aggregate: 'transactions',
        pipeline: [
          { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$price_per_share'] } } } },
        ],
        cursor: {},
      }),
      // 6. TOP UTILISATEURS — limité, pas de scan complet
      prisma.portfolio.findMany({
        take: 50,
        orderBy: { transactions: { _count: 'desc' } },
        select: {
          userId: true,
          user: { select: { id: true, name: true, lastname: true, email: true, created_at: true } },
          _count: { select: { transactions: true } },
        },
      }),
    ]);

    // Mise en forme des résultats d'agrégation
    const unconfirmedUsers = totalUsers - confirmedUsers;

    const intentsByPlan = intentsByPlanRaw.map((r) => ({ planId: r.planId, count: r._count._all }));
    const intentsByPaymentMethod = intentsByPaymentRaw.map((r) => ({
      method: r.paymentMethod || 'Non spécifié',
      count: r._count._all,
    }));
    const uniqueUserCount = uniqueIntentUsersRaw.length;
    const conversionRate = totalUsers > 0 ? (uniqueUserCount / totalUsers) * 100 : 0;

    const transactionsByType = transactionsByTypeRaw.map((r) => ({ type: r.type, count: r._count._all }));
    const totalVolume = Math.round(
      ((volumeRaw as Record<string, any>)?.cursor?.firstBatch?.[0]?.total ?? 0)
    );

    // Dé-duplication par userId (un user peut avoir plusieurs portfolios SANDBOX/CONCOURS)
    const userTransactionMap = new Map<string, { user: any; transactionCount: number }>();
    topPortfolios.forEach((portfolio) => {
      const existing = userTransactionMap.get(portfolio.userId);
      if (existing) {
        existing.transactionCount += portfolio._count.transactions;
      } else {
        userTransactionMap.set(portfolio.userId, { user: portfolio.user, transactionCount: portfolio._count.transactions });
      }
    });
    const topUsers = Array.from(userTransactionMap.values())
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          confirmed: confirmedUsers,
          unconfirmed: unconfirmedUsers,
          byRole: [],
          byMonth: [],
          activeLastWeek: activeUsersLast7Days,
          latest: latestUsers,
        },
        portfolios: {
          total: totalPortfolios,
          averagePerUser: totalUsers > 0 ? parseFloat((totalPortfolios / totalUsers).toFixed(2)) : 0,
        },
        transactions: {
          total: totalTransactions,
          byType: transactionsByType,
          totalVolume,
          last30Days: transactionsLast30Days,
        },
        subscriptions: {
          totalIntents,
          uniqueUsers: uniqueUserCount,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          byPlan: intentsByPlan,
          byPaymentMethod: intentsByPaymentMethod,
        },
        topUsers,
      },
    });
  } catch (error) {
    log.error('Erreur lors de la récupération des stats de la plateforme:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/trial-stats
// Statistiques du free trial IA
// ─────────────────────────────────────────────────────────────────
export const getTrialStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();

    const [total, claimed, active, expired, unclaimed, recent] = await Promise.all([
      // Total tokens générés
      prisma.freeTrial.count(),
      // Total activés (lien cliqué)
      prisma.freeTrial.count({ where: { claimed: true } }),
      // Trials actifs en ce moment
      prisma.freeTrial.count({ where: { claimed: true, expiresAt: { gt: now } } }),
      // Trials expirés
      prisma.freeTrial.count({ where: { claimed: true, expiresAt: { lte: now } } }),
      // Non réclamés (email envoyé mais pas cliqué)
      prisma.freeTrial.count({ where: { claimed: false } }),
      // 20 derniers trials avec info utilisateur
      prisma.freeTrial.findMany({
        orderBy: { created_at: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, lastname: true, email: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: {
        total,
        claimed,
        active,
        expired,
        unclaimed,
        claimRate: total > 0 ? Math.round((claimed / total) * 100) : 0,
        recent,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/ai-feedback-stats
// Statistiques pouces levé/baissé par endpoint + évolution 30j
// ─────────────────────────────────────────────────────────────────
export const getAIFeedbackStats = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt((req.query.days as string) ?? '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Récupérer tous les feedbacks sur la période
    const feedbacks = await prisma.userActionTracking.findMany({
      where: { action_type: 'ai_feedback', created_at: { gte: since } },
      select: { metadata: true, created_at: true },
      orderBy: { created_at: 'asc' },
    });

    const total = feedbacks.length;
    const positive = feedbacks.filter((f) => ((f.metadata ?? {}) as Record<string, unknown>)?.rating === 'positive').length;
    const negative = total - positive;
    const satisfactionRate = total > 0 ? Math.round((positive / total) * 100) : 0;

    // Par endpoint
    const byEndpoint: Record<string, { positive: number; negative: number; total: number }> = {};
    for (const f of feedbacks) {
      const ep = ((f.metadata ?? {}) as Record<string, unknown>)?.endpoint ?? 'unknown';
      if (!byEndpoint[ep]) byEndpoint[ep] = { positive: 0, negative: 0, total: 0 };
      byEndpoint[ep].total++;
      if (((f.metadata ?? {}) as Record<string, unknown>)?.rating === 'positive') byEndpoint[ep].positive++;
      else byEndpoint[ep].negative++;
    }

    // Évolution par jour (agrégation)
    const byDay: Record<string, { positive: number; negative: number }> = {};
    for (const f of feedbacks) {
      const day = f.created_at!.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { positive: 0, negative: 0 };
      if (((f.metadata ?? {}) as Record<string, unknown>)?.rating === 'positive') byDay[day].positive++;
      else byDay[day].negative++;
    }
    const dailyTrend = Object.entries(byDay).map(([date, v]) => ({ date, ...v }));

    // Résumé IA complet (appels, temps réponse, etc.)
    const aiSummary = await getAISummary(since);

    return res.json({
      success: true,
      data: {
        period: `${days}j`,
        feedback: { total, positive, negative, satisfactionRate, byEndpoint, dailyTrend },
        aiSummary,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// ─── Campagne email : lancement webinaires ────────────────────────────────────

const FAKE_EMAIL_PATTERNS = [
  'afribourse', 'africbourse', 'yopmail', 'mailinator',
  'guerrillamail', 'tempmail', 'throwam', 'sharklasers',
  'dispostable', 'trashmail', 'fakeinbox', 'spamgourmet',
];

export const sendWebinarLaunchCampaign = async (req: AuthRequest, res: Response) => {
  try {
    // Fetch all users with email + name
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });

    // Filter out fake/internal accounts
    const realUsers = users.filter((u) => {
      const e = u.email.toLowerCase();
      return !FAKE_EMAIL_PATTERNS.some((p) => e.includes(p));
    });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send in batches of 50 with 2s delay between batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < realUsers.length; i += BATCH_SIZE) {
      const batch = realUsers.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (u) => {
          try {
            await sendWebinarLaunchEmail({ email: u.email, name: u.name || 'Investisseur' });
            sent++;
          } catch (err: any) {
            failed++;
            errors.push(`${u.email}: ${err?.message ?? 'unknown'}`);
          }
        })
      );
      // Rate limit pause between batches (except last)
      if (i + BATCH_SIZE < realUsers.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    log.info({ sent, failed, total: realUsers.length }, '[CAMPAIGN] Webinar launch emails sent');

    return res.json({
      success: true,
      data: {
        total: realUsers.length,
        filtered: users.length - realUsers.length,
        sent,
        failed,
        errors: errors.slice(0, 20), // max 20 errors returned
      },
    });
  } catch (error) {
    log.error(error, '[CAMPAIGN] Error sending webinar launch emails');
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de la campagne' });
  }
};
