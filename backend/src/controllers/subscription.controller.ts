import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Logger une intention d'abonnement
 */
export const logSubscriptionIntent = async (req: AuthRequest, res: Response) => {
  try {
    const { planId, planName, price, feature, source } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }

    if (!planId || !planName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Données manquantes (planId, planName, price)',
      });
    }

    // Créer l'intention d'abonnement
    const intent = await prisma.subscriptionIntent.create({
      data: {
        planId,
        planName,
        price,
        feature: feature || null,
        source: source || 'unknown',
        userId,
      },
    });

    console.log(`📊 Nouvelle intention d'abonnement: ${planName} par user ${userId}`);

    return res.status(201).json({
      success: true,
      message: 'Intention enregistrée',
      data: intent,
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'intention:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Obtenir les statistiques des intentions d'abonnement (admin)
 */
export const getSubscriptionStats = async (req: AuthRequest, res: Response) => {
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

    // Statistiques globales
    const totalIntents = await prisma.subscriptionIntent.count();

    const intentsByPlan = await prisma.subscriptionIntent.groupBy({
      by: ['planId'],
      _count: {
        id: true,
      },
    });

    const intentsByFeature = await prisma.subscriptionIntent.groupBy({
      by: ['feature'],
      _count: {
        id: true,
      },
      where: {
        feature: {
          not: null,
        },
      },
    });

    const intentsBySource = await prisma.subscriptionIntent.groupBy({
      by: ['source'],
      _count: {
        id: true,
      },
    });

    // Utilisateurs uniques qui ont exprimé une intention
    const uniqueUsers = await prisma.subscriptionIntent.findMany({
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    // Dernières intentions
    const recentIntents = await prisma.subscriptionIntent.findMany({
      take: 20,
      orderBy: {
        created_at: 'desc',
      },
      include: {
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

    // Intentions par jour (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const intentsByDay = await prisma.subscriptionIntent.findMany({
      where: {
        created_at: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        created_at: 'asc',
      },
      select: {
        created_at: true,
        planId: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalIntents,
        uniqueUsers: uniqueUsers.length,
        intentsByPlan: intentsByPlan.map((item) => ({
          planId: item.planId,
          count: item._count.id,
        })),
        intentsByFeature: intentsByFeature.map((item) => ({
          feature: item.feature,
          count: item._count.id,
        })),
        intentsBySource: intentsBySource.map((item) => ({
          source: item.source,
          count: item._count.id,
        })),
        recentIntents,
        intentsByDay,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Obtenir les intentions d'un utilisateur spécifique
 */
export const getUserIntents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
    }

    const intents = await prisma.subscriptionIntent.findMany({
      where: {
        userId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      data: intents,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des intentions utilisateur:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
