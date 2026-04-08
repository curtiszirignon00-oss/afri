import { log } from '../config/logger';
import { Request, Response } from 'express';
import { prisma } from '../config/database';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Renvoie la date N jours avant `from` */
function daysAgo(n: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return d;
}

/** Normalise un path en famille de section pour grouper /stocks/SIVC → /stocks */
function normalizePath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return '/';
  // Garder 2 segments max (ex: /dashboard/simulator → /dashboard/simulator)
  return '/' + segments.slice(0, 2).join('/');
}

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
    log.error('Erreur trackPageView:', error);
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
    log.error('Erreur trackAction:', error);
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
    log.error('Erreur trackFeatureUsage:', error);
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
    log.error('Erreur updatePageDuration:', error);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
};

/**
 * Analyse comportementale par cohortes (ADMIN ONLY)
 *
 * Répond aux 5 questions :
 *  Q1 – Première feature utilisée après inscription
 *  Q2 – Écrans d'abandon (dernière page des utilisateurs churned)
 *  Q3 – Rétention D+1 / D+7 / D+30
 *  Q4 – Temps passé sur modules éducatifs vs simulateur
 *  Q5 – "Aha moment" : actions W1 qui distinguent retained vs churned
 *
 * Query params :
 *   window  (default 90) – fenêtre d'inscription en jours
 */
export const getCohortAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { role: true },
    });
    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin uniquement.' });
    }

    const now = new Date();
    const windowDays = Math.min(parseInt(req.query.window as string) || 90, 365);
    const cohortStart = daysAgo(windowDays, now);

    // ── 0. Charger tous les users de la cohorte ──────────────────────────────
    const users = await prisma.user.findMany({
      where: { created_at: { gte: cohortStart } },
      select: {
        id: true,
        created_at: true,
        last_login_at: true,
        email_verified_at: true,
      },
    });

    const userIds = users.map((u) => u.id);
    const totalSignups = users.length;

    // ── Q3 – RÉTENTION D+1 / D+7 / D+30 ────────────────────────────────────
    function retentionAt(daysThreshold: number) {
      const eligible = users.filter(
        (u) => u.created_at && u.created_at <= daysAgo(daysThreshold, now),
      );
      const retained = eligible.filter((u) => {
        if (!u.last_login_at || !u.created_at) return false;
        return (
          u.last_login_at.getTime() >
          u.created_at.getTime() + daysThreshold * 24 * 3600 * 1000
        );
      });
      return {
        eligible: eligible.length,
        retained: retained.length,
        rate: eligible.length > 0 ? Math.round((retained.length / eligible.length) * 100) : null,
      };
    }

    const retentionFunnel = {
      d1: retentionAt(1),
      d7: retentionAt(7),
      d30: retentionAt(30),
    };

    // ── Charger toutes les actions de la cohorte ─────────────────────────────
    const allActions = userIds.length
      ? await prisma.userActionTracking.findMany({
          where: { userId: { in: userIds } },
          select: {
            userId: true,
            action_type: true,
            action_name: true,
            created_at: true,
          },
          orderBy: { created_at: 'asc' },
        })
      : [];

    // ── Q1 – PREMIÈRE FEATURE UTILISÉE ──────────────────────────────────────
    const firstActionByUser = new Map<string, { action_type: string; action_name: string }>();
    for (const a of allActions) {
      if (!firstActionByUser.has(a.userId)) {
        firstActionByUser.set(a.userId, {
          action_type: a.action_type,
          action_name: a.action_name,
        });
      }
    }

    const firstActionCounts: Record<string, { action_type: string; action_name: string; count: number }> = {};
    for (const v of firstActionByUser.values()) {
      if (!firstActionCounts[v.action_type]) {
        firstActionCounts[v.action_type] = { ...v, count: 0 };
      }
      firstActionCounts[v.action_type].count++;
    }

    const usersWithActions = firstActionByUser.size;
    const firstActionDistribution = Object.values(firstActionCounts)
      .map((a) => ({
        ...a,
        percentage: usersWithActions > 0 ? Math.round((a.count / usersWithActions) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ── Q2 – ÉCRANS D'ABANDON ────────────────────────────────────────────────
    // Utilisateurs eligible D+1 qui ne sont PAS revenus après J+1
    const eligibleD1 = users.filter(
      (u) => u.created_at && u.created_at <= daysAgo(1, now),
    );
    const churnedD1Ids = new Set(
      eligibleD1
        .filter((u) => {
          if (!u.last_login_at || !u.created_at) return true;
          return u.last_login_at.getTime() <= u.created_at.getTime() + 24 * 3600 * 1000;
        })
        .map((u) => u.id),
    );

    let dropoffPages: { page_path: string; users_last_seen_here: number; percentage: number }[] = [];

    if (churnedD1Ids.size > 0) {
      const churnedPageViews = await prisma.pageView.findMany({
        where: { userId: { in: Array.from(churnedD1Ids) } },
        select: { userId: true, page_path: true, created_at: true },
        orderBy: { created_at: 'asc' },
      });

      // Dernière page vue par user churned
      const lastPageByUser = new Map<string, string>();
      for (const pv of churnedPageViews) {
        if (pv.userId) lastPageByUser.set(pv.userId, normalizePath(pv.page_path));
      }

      const pageCounts: Record<string, number> = {};
      for (const page of lastPageByUser.values()) {
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      }

      const totalDropped = lastPageByUser.size;
      dropoffPages = Object.entries(pageCounts)
        .map(([page_path, count]) => ({
          page_path,
          users_last_seen_here: count,
          percentage: totalDropped > 0 ? Math.round((count / totalDropped) * 100) : 0,
        }))
        .sort((a, b) => b.users_last_seen_here - a.users_last_seen_here)
        .slice(0, 10);
    }

    // ── Q4 – TEMPS LEARNING VS SIMULATEUR ───────────────────────────────────
    const [learningPageViews, simulatorPageViews, learningProgressRows] = await Promise.all([
      userIds.length
        ? prisma.pageView.findMany({
            where: {
              userId: { in: userIds },
              page_path: { startsWith: '/learn' },
              duration: { not: null },
            },
            select: { userId: true, duration: true },
          })
        : Promise.resolve([]),

      userIds.length
        ? prisma.pageView.findMany({
            where: {
              userId: { in: userIds },
              page_path: { contains: 'simulator' },
              duration: { not: null },
            },
            select: { userId: true, duration: true },
          })
        : Promise.resolve([]),

      userIds.length
        ? prisma.learningProgress.findMany({
            where: {
              userId: { in: userIds },
              time_spent_minutes: { not: null },
            },
            select: { userId: true, time_spent_minutes: true },
          })
        : Promise.resolve([]),
    ]);

    const simulatorActionCount = allActions.filter(
      (a) => a.action_type === 'SIMULATE_BUY' || a.action_type === 'SIMULATE_SELL',
    ).length;

    const sumDuration = (rows: { duration: number | null }[]) =>
      rows.reduce((s, r) => s + (r.duration ?? 0), 0);
    const uniqueUsers = (rows: { userId: string | null }[]) =>
      new Set(rows.map((r) => r.userId).filter(Boolean)).size;

    const learningTotalSec = sumDuration(learningPageViews);
    const simulatorTotalSec = sumDuration(simulatorPageViews);
    const learningTotalMinFromProgress = learningProgressRows.reduce(
      (s, r) => s + (r.time_spent_minutes ?? 0),
      0,
    );

    const learningUsers = uniqueUsers(learningPageViews);
    const simulatorUsers = uniqueUsers(simulatorPageViews);

    const engagementTime = {
      learning: {
        total_sessions: learningPageViews.length,
        unique_users: learningUsers,
        avg_seconds_per_session:
          learningPageViews.length > 0 ? Math.round(learningTotalSec / learningPageViews.length) : 0,
        total_minutes_from_progress: Math.round(learningTotalMinFromProgress),
        avg_minutes_per_user:
          learningUsers > 0
            ? Math.round((learningTotalMinFromProgress / learningUsers) * 10) / 10
            : 0,
      },
      simulator: {
        total_sessions: simulatorPageViews.length,
        unique_users: simulatorUsers,
        avg_seconds_per_session:
          simulatorPageViews.length > 0
            ? Math.round(simulatorTotalSec / simulatorPageViews.length)
            : 0,
        total_trades: simulatorActionCount,
        avg_trades_per_user:
          simulatorUsers > 0 ? Math.round((simulatorActionCount / simulatorUsers) * 10) / 10 : 0,
      },
    };

    // ── Q5 – AHA MOMENT ──────────────────────────────────────────────────────
    // Cohorte eligible D+7 : on peut calculer retained/churned
    const eligibleD7 = users.filter(
      (u) => u.created_at && u.created_at <= daysAgo(7, now),
    );

    const retainedD7Ids = new Set(
      eligibleD7
        .filter((u) => {
          if (!u.last_login_at || !u.created_at) return false;
          return u.last_login_at.getTime() > u.created_at.getTime() + 7 * 24 * 3600 * 1000;
        })
        .map((u) => u.id),
    );
    const churnedD7Ids = new Set(
      eligibleD7.filter((u) => !retainedD7Ids.has(u.id)).map((u) => u.id),
    );

    // Pour chaque user, actions faites dans les 7 premiers jours
    const userMap = new Map(users.map((u) => [u.id, u]));

    function actionsInW1(userId: string): Set<string> {
      const u = userMap.get(userId);
      if (!u?.created_at) return new Set();
      const w1End = new Date(u.created_at.getTime() + 7 * 24 * 3600 * 1000);
      const types = new Set<string>();
      for (const a of allActions) {
        if (a.userId === userId && a.created_at <= w1End) {
          types.add(a.action_type);
        }
      }
      return types;
    }

    // Calculer le taux d'adoption par action pour chaque groupe
    const allActionTypes = [...new Set(allActions.map((a) => a.action_type))];
    const actionNames = new Map(allActions.map((a) => [a.action_type, a.action_name]));

    const ahaSignals = allActionTypes
      .map((actionType) => {
        const retainedWith =
          retainedD7Ids.size > 0
            ? [...retainedD7Ids].filter((id) => actionsInW1(id).has(actionType)).length
            : 0;
        const churnedWith =
          churnedD7Ids.size > 0
            ? [...churnedD7Ids].filter((id) => actionsInW1(id).has(actionType)).length
            : 0;

        const retainedRate =
          retainedD7Ids.size > 0
            ? Math.round((retainedWith / retainedD7Ids.size) * 100)
            : 0;
        const churnedRate =
          churnedD7Ids.size > 0
            ? Math.round((churnedWith / churnedD7Ids.size) * 100)
            : 0;

        const lift =
          churnedRate > 0
            ? Math.round((retainedRate / churnedRate) * 10) / 10
            : retainedRate > 0
              ? 99 // signal pur : 0 churned mais des retained
              : 0;

        const verdict =
          lift >= 2 && retainedRate >= 20
            ? 'Fort signal'
            : lift >= 1.5 && retainedRate >= 10
              ? 'Signal modéré'
              : 'Faible';

        return {
          action_type: actionType,
          action_name: actionNames.get(actionType) ?? actionType,
          retained_rate: retainedRate,
          churned_rate: churnedRate,
          lift,
          verdict,
        };
      })
      .sort((a, b) => b.lift - a.lift || b.retained_rate - a.retained_rate);

    // ── Réponse ──────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        period: {
          cohortWindowDays: windowDays,
          from: cohortStart,
          to: now,
        },
        overview: {
          totalSignups,
          usersWithActions,
          usersWithPageViews:
            userIds.length
              ? uniqueUsers(
                  await prisma.pageView.findMany({
                    where: { userId: { in: userIds } },
                    select: { userId: true },
                  }),
                )
              : 0,
        },
        // Q3
        retentionFunnel,
        // Q1
        firstActionDistribution,
        // Q2
        dropoffPages,
        churnedD1Count: churnedD1Ids.size,
        // Q4
        engagementTime,
        // Q5
        ahaSignals: {
          methodology:
            'Actions réalisées en W1 (7 premiers jours) — comparaison retained D+7 vs churned D+7',
          eligible_d7: eligibleD7.length,
          retained_d7: retainedD7Ids.size,
          churned_d7: churnedD7Ids.size,
          signals: ahaSignals.slice(0, 15),
        },
      },
    });
  } catch (error) {
    log.error('Erreur getCohortAnalytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
    log.error('Erreur getAnalyticsStats:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
