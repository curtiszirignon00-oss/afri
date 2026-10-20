import { describe, it, expect, vi, beforeEach } from 'vitest';

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  featureAnnouncement: { findUnique: vi.fn(), upsert: vi.fn() },
  realPortfolio: { findFirst: vi.fn() },
}));
vi.mock('../../../config/prisma', () => ({ default: db }));

import { getDiscoveryState, recordDiscoveryEvent, REAL_PORTFOLIO_LAUNCHED_AT } from '../discovery.service';

describe('discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.featureAnnouncement.findUnique.mockResolvedValue(null);
    db.realPortfolio.findFirst.mockResolvedValue(null);
  });

  it('classe les comptes selon la date de lancement', async () => {
    db.user.findUnique.mockResolvedValueOnce({ created_at: new Date(REAL_PORTFOLIO_LAUNCHED_AT.getTime() + 3600e3) });
    expect(await getDiscoveryState('u1')).toMatchObject({ audience: 'new', hasPortfolio: false, guideSeen: false, bannerDismissed: false });

    db.user.findUnique.mockResolvedValueOnce({ created_at: new Date('2025-03-01') });
    expect((await getDiscoveryState('u1')).audience).toBe('existing');

    // Anciens comptes sans date de création
    db.user.findUnique.mockResolvedValueOnce({ created_at: null });
    expect((await getDiscoveryState('u1')).audience).toBe('existing');
  });

  it('reflète guide vu, encart fermé et portefeuille existant', async () => {
    db.user.findUnique.mockResolvedValue({ created_at: new Date('2025-03-01') });
    db.featureAnnouncement.findUnique.mockResolvedValue({ guide_seen_at: new Date(), guide_completed: false, banner_dismissed_at: new Date() });
    db.realPortfolio.findFirst.mockResolvedValue({ id: 'p1' });
    expect(await getDiscoveryState('u1')).toMatchObject({ hasPortfolio: true, guideSeen: true, bannerDismissed: true, guideCompleted: false });
  });

  it('enregistre les événements par upsert (utilisateur × fonctionnalité)', async () => {
    db.user.findUnique.mockResolvedValue({ created_at: new Date('2025-03-01') });
    await recordDiscoveryEvent('u1', 'guide_completed');
    const arg = db.featureAnnouncement.upsert.mock.calls[0][0];
    expect(arg.where).toEqual({ userId_feature: { userId: 'u1', feature: 'real-portfolio' } });
    expect(arg.update).toMatchObject({ guide_completed: true });
    expect(arg.update.guide_seen_at).toBeInstanceOf(Date);

    await recordDiscoveryEvent('u1', 'banner_dismissed');
    expect(db.featureAnnouncement.upsert.mock.calls[1][0].update.banner_dismissed_at).toBeInstanceOf(Date);
  });
});
