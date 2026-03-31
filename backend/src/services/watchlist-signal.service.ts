import { log } from '../config/logger';
/**
 * AfriBourse — Watchlist Signal CRON Service
 * Runs daily at 18h after BRVM close.
 * For each user's watchlist: checks if any ticker hits a strong signal zone (score ≥ 68 or ≤ 32).
 * Sends an in-app notification (cloche) + awards XP for active surveillance.
 */

import prisma from '../config/prisma';
import { getWatchlistScores } from './watchlist.scores';
import { notifyPriceAlert } from './notification.service';
import { createNotification } from './notification.service';
import * as xpService from './xp.service';

// We track last notified zones in memory to avoid spamming every day.
// In production, persist to DB; here a simple in-memory map is sufficient for daily runs.
const lastNotifiedZone: Map<string, string> = new Map(); // key: `userId:ticker`

export type WatchlistSignalResult = {
  usersProcessed: number;
  notificationsSent: number;
  errors: number;
};

export async function checkWatchlistSignals(): Promise<WatchlistSignalResult> {
  let usersProcessed = 0;
  let notificationsSent = 0;
  let errors = 0;

  try {
    // Get all distinct users that have watchlist items
    const userIds: { userId: string }[] = await prisma.watchlistItem.findMany({
      distinct: ['userId'],
      select: { userId: true },
    });

    for (const { userId } of userIds) {
      try {
        usersProcessed++;
        const scores = await getWatchlistScores(userId);

        for (const s of scores) {
          const key = `${userId}:${s.ticker}`;
          const previousZone = lastNotifiedZone.get(key);

          // Only notify on strong zones, and only when the zone changed
          const isStrongSignal = s.zone === 'Achat Fort' || s.zone === 'Vente Forte';
          const zoneChanged = previousZone !== s.zone;

          if (isStrongSignal && zoneChanged) {
            const isAchat = s.zone === 'Achat Fort';

            await createNotification({
              userId,
              type: 'PRICE_ALERT',
              title: `Signal ${isAchat ? 'Achat Fort 🟢' : 'Vente Forte 🔴'} — ${s.ticker}`,
              message: `${s.ticker} a un score de confiance de ${s.score}/100 (${s.zone}). ${
                isAchat
                  ? 'Les indicateurs suggèrent une opportunité d\'achat.'
                  : 'Les indicateurs suggèrent une pression vendeuse élevée.'
              }`,
              metadata: {
                stockSymbol: s.ticker,
                score: s.score,
                zone: s.zone,
                technical: s.technical,
                fundamental: s.fundamental,
              },
            });

            lastNotifiedZone.set(key, s.zone);
            notificationsSent++;

            // +3 XP for active surveillance (signal triggered on a watched stock)
            try {
              await xpService.addXP(
                userId,
                3,
                'watchlist_signal',
                `Signal ${s.zone} détecté sur ${s.ticker} — Vigilant du marché 👁️`
              );
            } catch {
              // XP error is non-fatal
            }
          } else if (!isStrongSignal) {
            // Reset the zone so we notify again if it re-enters strong zone later
            if (previousZone === 'Achat Fort' || previousZone === 'Vente Forte') {
              lastNotifiedZone.set(key, s.zone);
            }
          }
        }
      } catch (err) {
        log.error(`[WatchlistSignals] Erreur pour userId ${userId}:`, err);
        errors++;
      }
    }
  } catch (err) {
    log.error('[WatchlistSignals] Erreur globale:', err);
    errors++;
  }

  return { usersProcessed, notificationsSent, errors };
}
