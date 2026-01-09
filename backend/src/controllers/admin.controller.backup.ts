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
 * Obtenir toutes les statistiques de la plateforme (admin uniquement)
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

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true,
      },
    });

    // Utilisateurs par mois (derniers 6 mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentUsers = await prisma.user.findMany({
      where: {
        created_at: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Grouper par mois
    const usersByMonth: { [key: string]: number } = {};
    recentUsers.forEach((user) => {
      if (user.created_at) {
        const monthKey = `${user.created_at.getFullYear()}-${String(user.created_at.getMonth() + 1).padStart(2, '0')}`;
        usersByMonth[monthKey] = (usersByMonth[monthKey] || 0) + 1;
      }
    });

    // 2. STATISTIQUES PORTEFEUILLES
    const totalPortfolios = await prisma.portfolio.count();

    const portfoliosByUser = await prisma.portfolio.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
    });

    const avgPortfoliosPerUser = portfoliosByUser.length > 0
      ? totalPortfolios / portfoliosByUser.length
      : 0;

    // 3. STATISTIQUES TRANSACTIONS
    const totalTransactions = await prisma.transaction.count();

    const transactionsByType = await prisma.transaction.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });

    // Calculer le volume total manuellement car total_amount n'existe pas
    const allTransactions = await prisma.transaction.findMany({
      select: {
        quantity: true,
        price_per_share: true,
      },
    });

    const totalVolume = allTransactions.reduce((sum, t) => {
      return sum + (t.quantity * t.price_per_share);
    }, 0);

    // Transactions récentes (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await prisma.transaction.count({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // 4. STATISTIQUES INTENTIONS D'ABONNEMENT
    const totalIntents = await prisma.subscriptionIntent.count();

    const intentsByPlan = await prisma.subscriptionIntent.groupBy({
      by: ['planId'],
      _count: {
        id: true,
      },
    });

    const uniqueInterestedUsers = await prisma.subscriptionIntent.findMany({
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    const intentsByPaymentMethod = await prisma.subscriptionIntent.groupBy({
      by: ['paymentMethod'],
      _count: {
        id: true,
      },
      where: {
        paymentMethod: {
          not: null,
        },
      },
    });

    // 5. STATISTIQUES D'ENGAGEMENT
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsersLast7Days = await prisma.user.count({
      where: {
        updated_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // 6. TOP UTILISATEURS PAR ACTIVITÉ
    const topUsersByTransactions = await prisma.transaction.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Récupérer les infos des top users
    const topUsersIds = topUsersByTransactions.map((u) => u.userId);
    const topUsers = await prisma.user.findMany({
      where: {
        id: {
          in: topUsersIds,
        },
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        createdAt: true,
      },
    });

    // Mapper les données
    const topUsersWithStats = topUsersByTransactions.map((stat) => {
      const user = topUsers.find((u) => u.id === stat.userId);
      return {
        user,
        transactionCount: stat._count.id,
      };
    });

    // 7. DERNIERS UTILISATEURS INSCRITS
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

    // 8. TAUX DE CONVERSION (utilisateurs qui ont exprimé une intention)
    const conversionRate = totalUsers > 0 ? (uniqueInterestedUsers.length / totalUsers) * 100 : 0;

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          confirmed: confirmedUsers,
          unconfirmed: unconfirmedUsers,
          byRole: usersByRole.map((item) => ({
            role: item.role,
            count: item._count.id,
          })),
          byMonth: Object.entries(usersByMonth).map(([month, count]) => ({
            month,
            count,
          })),
          activeLastWeek: activeUsersLast7Days,
          latest: latestUsers,
        },
        portfolios: {
          total: totalPortfolios,
          averagePerUser: parseFloat(avgPortfoliosPerUser.toFixed(2)),
        },
        transactions: {
          total: totalTransactions,
          byType: transactionsByType.map((item) => ({
            type: item.type,
            count: item._count.id,
          })),
          totalVolume: totalVolume || 0,
          last30Days: recentTransactions,
        },
        subscriptions: {
          totalIntents,
          uniqueUsers: uniqueInterestedUsers.length,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          byPlan: intentsByPlan.map((item) => ({
            planId: item.planId,
            count: item._count.id,
          })),
          byPaymentMethod: intentsByPaymentMethod.map((item) => ({
            method: item.paymentMethod,
            count: item._count.id,
          })),
        },
        topUsers: topUsersWithStats,
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
