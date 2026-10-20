// backend/src/services/real-portfolio/discovery.service.ts
// Découverte de la fonctionnalité « portefeuille réel » : guide pour les
// nouveaux inscrits, encart « Nouveau » + guide pour les comptes existants.

import prisma from '../../config/prisma';

const FEATURE = 'real-portfolio';

/** Mise en ligne : un compte créé après cette date est un « nouvel utilisateur ». */
export const REAL_PORTFOLIO_LAUNCHED_AT = new Date('2026-10-20T00:00:00.000Z');

export type DiscoveryEvent = 'guide_seen' | 'guide_completed' | 'banner_dismissed';

export async function getDiscoveryState(userId: string) {
  const [user, announcement, portfolio] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { created_at: true } }),
    prisma.featureAnnouncement.findUnique({ where: { userId_feature: { userId, feature: FEATURE } } }),
    prisma.realPortfolio.findFirst({ where: { userId }, select: { id: true } }),
  ]);
  const createdAt = user?.created_at ?? null;
  return {
    audience: createdAt && createdAt >= REAL_PORTFOLIO_LAUNCHED_AT ? ('new' as const) : ('existing' as const),
    hasPortfolio: !!portfolio,
    guideSeen: !!announcement?.guide_seen_at,
    guideCompleted: !!announcement?.guide_completed,
    bannerDismissed: !!announcement?.banner_dismissed_at,
  };
}

export async function recordDiscoveryEvent(userId: string, event: DiscoveryEvent) {
  const now = new Date();
  const data =
    event === 'guide_seen' ? { guide_seen_at: now }
    : event === 'guide_completed' ? { guide_seen_at: now, guide_completed: true }
    : { banner_dismissed_at: now };
  await prisma.featureAnnouncement.upsert({
    where: { userId_feature: { userId, feature: FEATURE } },
    update: data,
    create: { userId, feature: FEATURE, ...data },
  });
  return getDiscoveryState(userId);
}
