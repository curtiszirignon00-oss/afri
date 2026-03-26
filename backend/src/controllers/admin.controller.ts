import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getAISummary } from '../ai/aiAnalytics.service';

const prisma = new PrismaClient();

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
    console.error('Erreur forceVerifyUser:', error);
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
    console.error('Erreur getPremiumIntents:', error);
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

    // 1. STATISTIQUES UTILISATEURS
    const totalUsers = await prisma.user.count();

    const confirmedUsers = await prisma.user.count({
      where: {
        email_verified_at: {
          not: null
        }
      },
    });

    const unconfirmedUsers = totalUsers - confirmedUsers;

    // Utilisateurs actifs (dernière semaine)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsersLast7Days = await prisma.user.count({
      where: {
        updated_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Derniers utilisateurs inscrits
    const latestUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        email_verified_at: true,
        role: true,
        created_at: true,
      },
    });

    // 2. STATISTIQUES PORTEFEUILLES
    const totalPortfolios = await prisma.portfolio.count();

    // 3. STATISTIQUES TRANSACTIONS
    const totalTransactions = await prisma.transaction.count();

    // 4. STATISTIQUES INTENTIONS D'ABONNEMENT
    const totalIntents = await prisma.subscriptionIntent.count();

    // Récupérer tous les intents pour calculer manuellement
    const allIntents = await prisma.subscriptionIntent.findMany({
      select: {
        planId: true,
        userId: true,
        paymentMethod: true,
      },
    });

    // Calculer les stats manuellement
    const intentsByPlanMap = new Map<string, number>();
    const intentsByPaymentMethodMap = new Map<string, number>();
    const uniqueUserIds = new Set<string>();

    allIntents.forEach((intent) => {
      // Count par plan
      intentsByPlanMap.set(intent.planId, (intentsByPlanMap.get(intent.planId) || 0) + 1);

      // Count par méthode de paiement
      const method = intent.paymentMethod || 'Non spécifié';
      intentsByPaymentMethodMap.set(method, (intentsByPaymentMethodMap.get(method) || 0) + 1);

      // Utilisateurs uniques
      uniqueUserIds.add(intent.userId);
    });

    const intentsByPlan = Array.from(intentsByPlanMap.entries()).map(([planId, count]) => ({
      planId,
      count,
    }));

    const intentsByPaymentMethod = Array.from(intentsByPaymentMethodMap.entries()).map(([method, count]) => ({
      method,
      count,
    }));

    // Taux de conversion
    const conversionRate = totalUsers > 0 ? (uniqueUserIds.size / totalUsers) * 100 : 0;

    // 5. TRANSACTIONS - Volume et 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactionsLast30Days = await prisma.transaction.count({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const allTransactions = await prisma.transaction.findMany({
      select: {
        type: true,
        quantity: true,
        price_per_share: true,
      },
    });

    const transactionsByTypeMap = new Map<string, number>();
    let totalVolume = 0;

    allTransactions.forEach((tx) => {
      transactionsByTypeMap.set(tx.type, (transactionsByTypeMap.get(tx.type) || 0) + 1);
      totalVolume += tx.quantity * tx.price_per_share;
    });

    const transactionsByType = Array.from(transactionsByTypeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    // 6. TOP UTILISATEURS (par nombre de transactions)
    const topUsersData = await prisma.portfolio.findMany({
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            email: true,
            created_at: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Agréger par utilisateur
    const userTransactionMap = new Map<string, { user: any; transactionCount: number }>();
    topUsersData.forEach((portfolio) => {
      const existing = userTransactionMap.get(portfolio.userId);
      if (existing) {
        existing.transactionCount += portfolio._count.transactions;
      } else {
        userTransactionMap.set(portfolio.userId, {
          user: portfolio.user,
          transactionCount: portfolio._count.transactions,
        });
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
          totalVolume: Math.round(totalVolume),
          last30Days: transactionsLast30Days,
        },
        subscriptions: {
          totalIntents,
          uniqueUsers: uniqueUserIds.size,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          byPlan: intentsByPlan,
          byPaymentMethod: intentsByPaymentMethod,
        },
        topUsers,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats de la plateforme:', error);
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
      (prisma as any).freeTrial.count(),
      // Total activés (lien cliqué)
      (prisma as any).freeTrial.count({ where: { claimed: true } }),
      // Trials actifs en ce moment
      (prisma as any).freeTrial.count({ where: { claimed: true, expiresAt: { gt: now } } }),
      // Trials expirés
      (prisma as any).freeTrial.count({ where: { claimed: true, expiresAt: { lte: now } } }),
      // Non réclamés (email envoyé mais pas cliqué)
      (prisma as any).freeTrial.count({ where: { claimed: false } }),
      // 20 derniers trials avec info utilisateur
      (prisma as any).freeTrial.findMany({
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
    const positive = feedbacks.filter((f) => (f.metadata as any)?.rating === 'positive').length;
    const negative = total - positive;
    const satisfactionRate = total > 0 ? Math.round((positive / total) * 100) : 0;

    // Par endpoint
    const byEndpoint: Record<string, { positive: number; negative: number; total: number }> = {};
    for (const f of feedbacks) {
      const ep = (f.metadata as any)?.endpoint ?? 'unknown';
      if (!byEndpoint[ep]) byEndpoint[ep] = { positive: 0, negative: 0, total: 0 };
      byEndpoint[ep].total++;
      if ((f.metadata as any)?.rating === 'positive') byEndpoint[ep].positive++;
      else byEndpoint[ep].negative++;
    }

    // Évolution par jour (agrégation)
    const byDay: Record<string, { positive: number; negative: number }> = {};
    for (const f of feedbacks) {
      const day = f.created_at!.toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { positive: 0, negative: 0 };
      if ((f.metadata as any)?.rating === 'positive') byDay[day].positive++;
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
