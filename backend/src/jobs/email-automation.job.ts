/**
 * Job emails automatisés — Segments comportementaux + Performance portefeuille
 *
 * AU DÉMARRAGE DU SERVEUR (30s après boot) :
 *   → Segments B, C, D-récents : envoi immédiat pour tous les utilisateurs éligibles
 *     (idempotent grâce aux flags segment_*_email_sent — relancer ne re-envoie pas)
 *
 * CRON :
 *   → Segments (B, C, D)  : tous les lundis à 09h00  — rattrape les nouveaux basculements
 *   → Performance         : tous les jours à 09h05  — détecte les franchissements de paliers
 */

import cron from 'node-cron';
import prisma from '../config/prisma';
import { log } from '../config/logger';
import {
  sendSegmentBEmail,
  sendSegmentCEmail,
  sendSegmentDRecentEmail,
  sendPerformanceEmail,
} from '../services/email.service';

// Comptes générés automatiquement à exclure
const GENERATED_EMAIL_REGEX = /^[^@]+\.[^@]*\d+@gmail\.com$/i;
const DELAY_MS = 1500;

type PalierPerf = '+25' | '+50' | '+100' | '-15' | '-30';

const GAIN_PALIERS: { palier: PalierPerf; threshold: number }[] = [
  { palier: '+100', threshold: 100 },
  { palier: '+50',  threshold: 50  },
  { palier: '+25',  threshold: 25  },
];
const LOSS_PALIERS: { palier: PalierPerf; threshold: number }[] = [
  { palier: '-30', threshold: -30 },
  { palier: '-15', threshold: -15 },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Segment B — Apprenants ───────────────────────────────────────────────────

async function runSegmentB(): Promise<{ sent: number; errors: number }> {
  const users = await prisma.user.findMany({
    where: {
      email_verified_at:    { not: null },
      subscriptionTier:     'free',
      segment_b_email_sent: false,
      NOT: { email: { endsWith: '@fake-afribourse.com' } },
      learningProgress: { some: { is_completed: true } },
      portfolios:       { none: { transactions: { some: {} } } },
    },
    select: { id: true, email: true, name: true, lastname: true },
  });

  const eligible = users.filter(u => !GENERATED_EMAIL_REGEX.test(u.email));
  let sent = 0; let errors = 0;

  for (const user of eligible) {
    const name = user.name ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}` : 'Investisseur';
    try {
      await sendSegmentBEmail({ email: user.email, name });
      await prisma.user.update({ where: { id: user.id }, data: { segment_b_email_sent: true } });
      sent++;
    } catch (e: any) {
      errors++;
      log.error(`[EMAIL-AUTO][Segment B] Erreur ${user.email}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }
  return { sent, errors };
}

// ─── Segment C — Impulsifs ────────────────────────────────────────────────────

async function runSegmentC(): Promise<{ sent: number; errors: number }> {
  const users = await prisma.user.findMany({
    where: {
      email_verified_at:    { not: null },
      subscriptionTier:     'free',
      segment_c_email_sent: false,
      NOT: { email: { endsWith: '@fake-afribourse.com' } },
      portfolios:       { some: { transactions: { some: {} } } },
      learningProgress: { none: { is_completed: true } },
    },
    select: { id: true, email: true, name: true, lastname: true },
  });

  const eligible = users.filter(u => !GENERATED_EMAIL_REGEX.test(u.email));
  let sent = 0; let errors = 0;

  for (const user of eligible) {
    const name = user.name ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}` : 'Investisseur';
    try {
      await sendSegmentCEmail({ email: user.email, name });
      await prisma.user.update({ where: { id: user.id }, data: { segment_c_email_sent: true } });
      sent++;
    } catch (e: any) {
      errors++;
      log.error(`[EMAIL-AUTO][Segment C] Erreur ${user.email}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }
  return { sent, errors };
}

// ─── Segment D récents — Dormants < 30 jours ─────────────────────────────────

async function runSegmentDRecent(): Promise<{ sent: number; errors: number }> {
  const cutoff30j = new Date();
  cutoff30j.setDate(cutoff30j.getDate() - 30);

  const users = await prisma.user.findMany({
    where: {
      email_verified_at:          { not: null },
      subscriptionTier:           'free',
      segment_d_recent_email_sent: false,
      created_at:                 { gt: cutoff30j },
      NOT: { email: { endsWith: '@fake-afribourse.com' } },
      learningProgress: { none: { is_completed: true } },
      portfolios:       { none: { transactions: { some: {} } } },
    },
    select: { id: true, email: true, name: true, lastname: true },
  });

  const eligible = users.filter(u => !GENERATED_EMAIL_REGEX.test(u.email));
  let sent = 0; let errors = 0;

  for (const user of eligible) {
    const name = user.name ? `${user.name}${user.lastname ? ' ' + user.lastname : ''}` : 'Investisseur';
    try {
      await sendSegmentDRecentEmail({ email: user.email, name });
      await prisma.user.update({ where: { id: user.id }, data: { segment_d_recent_email_sent: true } });
      sent++;
    } catch (e: any) {
      errors++;
      log.error(`[EMAIL-AUTO][Segment D] Erreur ${user.email}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }
  return { sent, errors };
}

// ─── Runner segments (B + C + D) ─────────────────────────────────────────────

async function runAllSegments(): Promise<void> {
  log.info('[EMAIL-AUTO][Segments] Démarrage — B (Apprenants) · C (Impulsifs) · D (Dormants)');
  try {
    const b = await runSegmentB();
    log.info(`[EMAIL-AUTO][Segment B] Terminé — envoyés: ${b.sent}, erreurs: ${b.errors}`);

    const c = await runSegmentC();
    log.info(`[EMAIL-AUTO][Segment C] Terminé — envoyés: ${c.sent}, erreurs: ${c.errors}`);

    const d = await runSegmentDRecent();
    log.info(`[EMAIL-AUTO][Segment D] Terminé — envoyés: ${d.sent}, erreurs: ${d.errors}`);

    const total = b.sent + c.sent + d.sent;
    log.info(`[EMAIL-AUTO][Segments] Tous terminés — total envoyé: ${total}`);
  } catch (err: any) {
    log.error('[EMAIL-AUTO][Segments] Erreur critique:', err.message);
  }
}

// ─── Performance portefeuille ─────────────────────────────────────────────────

async function runPerformanceEmails(): Promise<void> {
  log.info('[EMAIL-AUTO][Performance] Démarrage — scan des positions ouvertes');

  try {
    const positions = await prisma.position.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        portfolio: {
          include: {
            user: { select: { id: true, email: true, name: true, email_verified_at: true } },
          },
        },
      },
    });

    const tickers = [...new Set(positions.map(p => p.stock_ticker))];
    const stocks  = await prisma.stock.findMany({
      where:  { symbol: { in: tickers }, is_active: true },
      select: { symbol: true, current_price: true, company_name: true },
    });
    const priceMap   = new Map(stocks.map(s => [s.symbol, s.current_price]));
    const companyMap = new Map(stocks.map(s => [s.symbol, s.company_name]));

    let totalSent = 0;
    let totalSkipped = 0;

    for (const pos of positions) {
      const user = pos.portfolio.user;
      if (!user.email_verified_at) { totalSkipped++; continue; }

      const currentPrice = priceMap.get(pos.stock_ticker);
      if (!currentPrice || !pos.average_buy_price || pos.average_buy_price === 0) {
        totalSkipped++;
        continue;
      }

      const rendement = (currentPrice - pos.average_buy_price) / pos.average_buy_price * 100;
      const ticker    = pos.stock_ticker;
      const companyName = companyMap.get(ticker) ?? ticker;
      const userId    = user.id;

      // Un seul email par user+ticker (toute palier confondu)
      const alreadySent = await prisma.performanceEmailLog.findUnique({
        where: { userId_ticker: { userId, ticker } },
      });
      if (alreadySent) { totalSkipped++; continue; }

      // Déterminer le palier le plus significatif actuellement applicable
      let targetPalier: PalierPerf | null = null;

      if (rendement >= 25) {
        for (const { palier, threshold } of GAIN_PALIERS) {
          if (rendement >= threshold) { targetPalier = palier; break; }
        }
      } else if (rendement <= -15) {
        for (const { palier, threshold } of LOSS_PALIERS) {
          if (rendement <= threshold) { targetPalier = palier; break; }
        }
      }

      if (!targetPalier) { totalSkipped++; continue; }

      try {
        await sendPerformanceEmail({
          email: user.email,
          name:  user.name ?? 'Investisseur',
          ticker,
          companyName,
          rendement,
          palier: targetPalier,
        });
        await prisma.performanceEmailLog.create({
          data: { userId, ticker, palier: targetPalier },
        });
        totalSent++;
        log.info(`[EMAIL-AUTO][Performance] ${user.email} · ${ticker} ${rendement >= 0 ? '+' : ''}${rendement.toFixed(1)}% → ${targetPalier} ✅`);
      } catch (e: any) {
        log.error(`[EMAIL-AUTO][Performance] Erreur ${user.email}·${ticker}: ${e.message}`);
      }

      await sleep(DELAY_MS);
    }

    log.info(`[EMAIL-AUTO][Performance] Terminé — envoyés: ${totalSent}, ignorés: ${totalSkipped}`);
  } catch (err: any) {
    log.error('[EMAIL-AUTO][Performance] Erreur critique:', err.message);
  }
}

// ─── Planification ────────────────────────────────────────────────────────────

// Segments : tous les lundis à 09h00 (rattrape les nouveaux basculements de segment)
cron.schedule('0 9 * * 1', () => {
  log.info('[EMAIL-AUTO][Segments] Cron lundi 09h00 — déclenchement');
  runAllSegments();
}, { timezone: 'Africa/Abidjan' });

// Performance : tous les jours à 09h05
cron.schedule('5 9 * * *', () => {
  log.info('[EMAIL-AUTO][Performance] Cron quotidien 09h05 — déclenchement');
  runPerformanceEmails();
}, { timezone: 'Africa/Abidjan' });

log.info('[EMAIL-AUTO] Planifié — Segments: lundi 09h00 · Performance: quotidien 09h05');

// ─── Envoi immédiat au démarrage du serveur ───────────────────────────────────
// Délai de 30s pour laisser le serveur et la DB se stabiliser

setTimeout(() => {
  log.info('[EMAIL-AUTO] Démarrage serveur — lancement immédiat des segments (B · C · D)');
  runAllSegments().then(() => {
    // Après les segments, lancer les emails de performance
    log.info('[EMAIL-AUTO] Segments terminés — lancement des emails performance');
    runPerformanceEmails();
  });
}, 30_000);
