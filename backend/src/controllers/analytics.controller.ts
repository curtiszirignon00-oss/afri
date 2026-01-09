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
 * Track une page visitée
 */
export const trackPageView = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || null;
    const { sessionId, pagePath, pageTitle, referrer, userAgent, deviceType, browser, os } = req.body;

    await prisma.pageView.create({
      data: {
        userId,
        sessionId,
        page_path: pagePath,
        page_title: pageTitle,
        referrer,
        user_agent: userAgent,
        device_type: deviceType,
        browser,
        os,
      },
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur trackPageView:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Track une action utilisateur
 */
export const trackAction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const { sessionId, actionType, actionName, pagePath, metadata } = req.body;

    await prisma.userActionTracking.create({
      data: {
        userId,
        sessionId,
        action_type: actionType,
        action_name: actionName,
        page_path: pagePath,
        metadata: metadata || {},
      },
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur trackAction:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Track l'utilisation d'une fonctionnalité (premium ou non)
 */
export const trackFeatureUsage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const { featureName, featureType, accessGranted, blockedByPaywall, pagePath, metadata } = req.body;

    await prisma.featureUsage.create({
      data: {
        userId,
        feature_name: featureName,
        feature_type: featureType,
        access_granted: accessGranted,
        blocked_by_paywall: blockedByPaywall || false,
        page_path: pagePath,
        metadata: metadata || {},
      },
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Erreur trackFeatureUsage:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Met à jour la durée d'une page view
 */
export const updatePageDuration = async (req: AuthRequest, res: Response) => {
  try {
    const { pageViewId, duration } = req.body;

    await prisma.pageView.update({
      where: { id: pageViewId },
      data: { duration },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erreur updatePageDuration:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Obtenir les stats d'analytics (ADMIN ONLY)
 */
export const getAnalyticsStats = async (req: AuthRequest, res: Response) => {
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

    // Période (7 derniers jours par défaut)
    const daysAgo = parseInt(req.query.days as string) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // 1. PAGES LES PLUS VISITÉES
    const pageViews = await prisma.pageView.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
      },
      select: {
        page_path: true,
        page_title: true,
        duration: true,
      },
    });

    const pageStats = pageViews.reduce((acc, pv) => {
      const path = pv.page_path;
      if (!acc[path]) {
        acc[path] = {
          path,
          title: pv.page_title || path,
          views: 0,
          totalDuration: 0,
          avgDuration: 0,
        };
      }
      acc[path].views++;
      if (pv.duration) {
        acc[path].totalDuration += pv.duration;
      }
      return acc;
    }, {} as Record<string, any>);

    const topPages = Object.values(pageStats)
      .map((p: any) => ({
        ...p,
        avgDuration: p.views > 0 ? Math.round(p.totalDuration / p.views) : 0,
      }))
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 10);

    // 2. ACTIONS LES PLUS EFFECTUÉES
    const actions = await prisma.userActionTracking.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
      },
      select: {
        action_type: true,
        action_name: true,
      },
    });

    const actionStats = actions.reduce((acc, action) => {
      const type = action.action_type;
      if (!acc[type]) {
        acc[type] = {
          type,
          name: action.action_name,
          count: 0,
        };
      }
      acc[type].count++;
      return acc;
    }, {} as Record<string, any>);

    const topActions = Object.values(actionStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    // 3. UTILISATION DES FONCTIONNALITÉS
    const features = await prisma.featureUsage.findMany({
      where: {
        created_at: {
          gte: startDate,
        },
      },
      select: {
        feature_name: true,
        feature_type: true,
        access_granted: true,
        blocked_by_paywall: true,
      },
    });

    const featureStats = features.reduce((acc, feature) => {
      const name = feature.feature_name;
      if (!acc[name]) {
        acc[name] = {
          name,
          type: feature.feature_type,
          totalUses: 0,
          accessGranted: 0,
          blockedByPaywall: 0,
          conversionRate: 0,
        };
      }
      acc[name].totalUses++;
      if (feature.access_granted) acc[name].accessGranted++;
      if (feature.blocked_by_paywall) acc[name].blockedByPaywall++;
      return acc;
    }, {} as Record<string, any>);

    const featureUsageStats = Object.values(featureStats)
      .map((f: any) => ({
        ...f,
        conversionRate:
          f.blockedByPaywall > 0
            ? Math.round((f.blockedByPaywall / f.totalUses) * 100)
            : 0,
      }))
      .sort((a: any, b: any) => b.totalUses - a.totalUses);

    // 4. UTILISATEURS ACTIFS PAR JOUR
    const dailyActiveUsers = await prisma.pageView.groupBy({
      by: ['userId'],
      where: {
        created_at: {
          gte: startDate,
        },
        userId: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    // 5. DEVICE BREAKDOWN
    const deviceBreakdown = await prisma.pageView.groupBy({
      by: ['device_type'],
      where: {
        created_at: {
          gte: startDate,
        },
        device_type: {
          not: null,
        },
      },
      _count: {
        id: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        period: {
          days: daysAgo,
          startDate,
          endDate: new Date(),
        },
        overview: {
          totalPageViews: pageViews.length,
          totalActions: actions.length,
          totalFeatureUses: features.length,
          uniqueActiveUsers: dailyActiveUsers.length,
        },
        topPages,
        topActions,
        featureUsage: featureUsageStats,
        deviceBreakdown: deviceBreakdown.map((d) => ({
          deviceType: d.device_type,
          count: d._count.id,
        })),
      },
    });
  } catch (error) {
    console.error('Erreur getAnalyticsStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
