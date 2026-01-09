import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
      },
    });

    // Calculer les stats manuellement
    const intentsByPlanMap = new Map<string, number>();
    const uniqueUserIds = new Set<string>();

    allIntents.forEach((intent) => {
      // Count par plan
      intentsByPlanMap.set(intent.planId, (intentsByPlanMap.get(intent.planId) || 0) + 1);

      // Utilisateurs uniques
      uniqueUserIds.add(intent.userId);
    });

    const intentsByPlan = Array.from(intentsByPlanMap.entries()).map(([planId, count]) => ({
      planId,
      count,
    }));

    // Taux de conversion
    const conversionRate = totalUsers > 0 ? (uniqueUserIds.size / totalUsers) * 100 : 0;

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
          byType: [],
          totalVolume: 0,
          last30Days: 0,
        },
        subscriptions: {
          totalIntents,
          uniqueUsers: uniqueUserIds.size,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          byPlan: intentsByPlan,
          byPaymentMethod: [], // Payment method not tracked yet
        },
        topUsers: [],
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
