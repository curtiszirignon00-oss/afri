/**
 * Service de réengagement post-inscription
 *
 * Séquence de 4 emails selon AFRIBOURSE_Email_Sequence_V1_2026.docx :
 *
 * Email 0 : Relance confirmation        — J+1 si email non confirmé
 * Email 1 : Réengagement               — J+1 après confirmation, sans nouvelle session
 * Email 2 : Marché BRVM                — J+3 après confirmation, sans session
 * Email 3 : Simulateur & Top 5         — J+7 après confirmation, sans session
 */

import prisma from '../config/prisma';
import { log } from '../config/logger';
import {
  sendReengagementEmail0,
  sendReengagementEmail1,
  sendReengagementEmail2,
  sendReengagementEmail3,
} from './email.service';
import { generateConfirmationToken, getTokenExpirationDate } from '../utils/token.utils';
import { updateConfirmationToken } from './users.service.prisma';

// ─── Helpers données marché / classement ─────────────────────────────────────

async function getWeeklyTopMovers(): Promise<
  { symbol: string; companyName: string; weeklyChangePercent: number }[]
> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const histories = await prisma.stockHistory.findMany({
    where: { date: { gte: sevenDaysAgo } },
    select: { stock_ticker: true, close: true, date: true },
    orderBy: { date: 'asc' },
  });

  const oldestByTicker = new Map<string, number>();
  for (const h of histories) {
    if (!oldestByTicker.has(h.stock_ticker)) {
      oldestByTicker.set(h.stock_ticker, h.close);
    }
  }

  if (oldestByTicker.size === 0) return [];

  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: [...oldestByTicker.keys()] }, current_price: { gt: 0 } },
    select: { symbol: true, company_name: true, current_price: true },
  });
  const stockMap = new Map(stocks.map(s => [s.symbol, s]));

  const movers: { symbol: string; companyName: string; weeklyChangePercent: number }[] = [];
  for (const [ticker, oldClose] of oldestByTicker) {
    const stock = stockMap.get(ticker);
    if (!stock || oldClose === 0) continue;
    movers.push({
      symbol: ticker,
      companyName: stock.company_name,
      weeklyChangePercent: ((stock.current_price - oldClose) / oldClose) * 100,
    });
  }

  return movers.sort((a, b) => b.weeklyChangePercent - a.weeklyChangePercent);
}

async function getTop3Leaders(): Promise<
  { rank: number; displayName: string; totalValue: number; roi: number }[]
> {
  try {
    // Récupère les portfolios SANDBOX actifs avec leurs positions
    const portfolios = await prisma.portfolio.findMany({
      where: { wallet_type: 'SANDBOX', status: 'ACTIVE' },
      select: {
        cash_balance: true,
        initial_balance: true,
        positions: { select: { stock_ticker: true, quantity: true } },
        user: { select: { name: true, lastname: true } },
      },
    });

    if (portfolios.length === 0) return [];

    // Prix courants en une seule requête
    const allTickers = [...new Set(portfolios.flatMap(p => p.positions.map(pos => pos.stock_ticker)))];
    const stockRows = allTickers.length > 0
      ? await prisma.stock.findMany({
          where: { symbol: { in: allTickers } },
          select: { symbol: true, current_price: true },
        })
      : [];
    const priceMap = new Map(stockRows.map(s => [s.symbol, s.current_price]));

    const ranked = portfolios
      .map(p => {
        let positionsValue = 0;
        for (const pos of p.positions) {
          const price = priceMap.get(pos.stock_ticker);
          if (price !== undefined) positionsValue += pos.quantity * price;
        }
        const totalValue = p.cash_balance + positionsValue;
        const roi = p.initial_balance > 0
          ? ((totalValue - p.initial_balance) / p.initial_balance) * 100
          : 0;
        const firstName = p.user?.name ?? '';
        const lastInitial = p.user?.lastname ? p.user.lastname.charAt(0) + '.' : '';
        return {
          displayName: `${firstName} ${lastInitial}`.trim() || 'Anonyme',
          totalValue: Math.round(totalValue),
          roi,
        };
      })
      .filter(p => !isNaN(p.roi))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 3)
      .map((p, i) => ({ rank: i + 1, ...p }));

    return ranked;
  } catch {
    return [];
  }
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days: number): Date {
  return hoursAgo(days * 24);
}

/**
 * Email 0 — Relance confirmation (envoyé 24h après inscription si email non confirmé)
 * Condition : email_verified_at IS NULL + created_at < now - 24h + email0 pas encore envoyé
 * Fréquence : 1 seul envoi
 */
async function processEmail0(): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  const candidates = await prisma.user.findMany({
    where: {
      email_verified_at: null,
      created_at: { lte: hoursAgo(24) },
      reengagement_email0_sent: false,
      // Exclure les comptes créés il y a plus de 7 jours (fenêtre maximale)
      AND: [{ created_at: { gte: daysAgo(7) } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      email_confirmation_token: true,
      email_confirmation_expires: true,
    },
  });

  log.debug(`[REENGAGEMENT] Email 0 — ${candidates.length} candidat(s)`);

  for (const user of candidates) {
    try {
      // Si le token manque complètement, on ne peut rien faire
      if (!user.email_confirmation_token && !user.email_confirmation_expires) {
        continue;
      }

      // Si le token a expiré, on en génère un nouveau avant d'envoyer
      let activeToken = user.email_confirmation_token!;
      if (!user.email_confirmation_expires || user.email_confirmation_expires < new Date()) {
        activeToken = generateConfirmationToken();
        const newExpiry = getTokenExpirationDate(72); // 72h de validité
        await updateConfirmationToken(user.id, activeToken, newExpiry);
      }

      await sendReengagementEmail0({
        email: user.email,
        name: user.name,
        confirmationToken: activeToken,
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { reengagement_email0_sent: true },
      });

      sent++;
      log.debug(`[REENGAGEMENT] Email 0 envoyé → ${user.email}`);
    } catch (err: any) {
      errors++;
      log.error(`[REENGAGEMENT] Email 0 erreur → ${user.email}: ${err.message}`);
    }
  }

  return { sent, errors };
}

/**
 * Email 1 — Réengagement J+1 (24h après confirmation sans nouvelle session)
 * Condition : email_verified_at < now - 24h + last_login_at IS NULL ou avant email_verified_at + email1 pas encore envoyé
 */
async function processEmail1(): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  const candidates = await prisma.user.findMany({
    where: {
      email_verified_at: { not: null, lte: hoursAgo(24) },
      reengagement_email1_sent: false,
      reengagement_email2_sent: false, // pas encore progressé dans la séquence
      // Fenêtre : confirmé dans les 7 derniers jours
      AND: [{ email_verified_at: { gte: daysAgo(7) } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      email_verified_at: true,
      last_login_at: true,
    },
  });

  // Filtrer : pas de connexion depuis la confirmation (ou jamais connecté)
  const targets = candidates.filter((u) => {
    if (!u.last_login_at) return true; // jamais connecté
    if (!u.email_verified_at) return false;
    return u.last_login_at <= u.email_verified_at; // connecté avant la confirmation
  });

  log.debug(`[REENGAGEMENT] Email 1 — ${targets.length} candidat(s)`);

  for (const user of targets) {
    try {
      await sendReengagementEmail1({ email: user.email, name: user.name });

      await prisma.user.update({
        where: { id: user.id },
        data: { reengagement_email1_sent: true },
      });

      sent++;
      log.debug(`[REENGAGEMENT] Email 1 envoyé → ${user.email}`);
    } catch (err: any) {
      errors++;
      log.error(`[REENGAGEMENT] Email 1 erreur → ${user.email}: ${err.message}`);
    }
  }

  return { sent, errors };
}

/**
 * Email 2 — Marché BRVM J+3 (3 jours après confirmation sans session)
 * Condition : email_verified_at < now - 3j + pas de session depuis + email2 pas encore envoyé
 */
async function processEmail2(): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  const candidates = await prisma.user.findMany({
    where: {
      email_verified_at: { not: null, lte: daysAgo(3) },
      reengagement_email1_sent: true, // a déjà reçu Email 1
      reengagement_email2_sent: false,
      AND: [{ email_verified_at: { gte: daysAgo(14) } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      email_verified_at: true,
      last_login_at: true,
    },
  });

  // Filtrer : pas de connexion depuis la confirmation
  const targets = candidates.filter((u) => {
    if (!u.last_login_at) return true;
    if (!u.email_verified_at) return false;
    return u.last_login_at <= u.email_verified_at;
  });

  log.debug(`[REENGAGEMENT] Email 2 — ${targets.length} candidat(s)`);

  // Fetch market data once for all targets
  const allMovers = await getWeeklyTopMovers();
  const stocks = [
    ...allMovers.filter(s => s.weeklyChangePercent > 0).slice(0, 2),
    ...allMovers.filter(s => s.weeklyChangePercent < 0).slice(-1),
  ];

  for (const user of targets) {
    try {
      await sendReengagementEmail2({ email: user.email, name: user.name, stocks });

      await prisma.user.update({
        where: { id: user.id },
        data: { reengagement_email2_sent: true },
      });

      sent++;
      log.debug(`[REENGAGEMENT] Email 2 envoyé → ${user.email}`);
    } catch (err: any) {
      errors++;
      log.error(`[REENGAGEMENT] Email 2 erreur → ${user.email}: ${err.message}`);
    }
  }

  return { sent, errors };
}

/**
 * Email 3 — Simulateur & Top 5 J+7 (7 jours après confirmation sans session)
 * Condition : email_verified_at < now - 7j + pas de session depuis + email3 pas encore envoyé
 */
async function processEmail3(): Promise<{ sent: number; errors: number }> {
  let sent = 0;
  let errors = 0;

  const candidates = await prisma.user.findMany({
    where: {
      email_verified_at: { not: null, lte: daysAgo(7) },
      reengagement_email2_sent: true, // a déjà reçu Email 2
      reengagement_email3_sent: false,
      AND: [{ email_verified_at: { gte: daysAgo(30) } }],
    },
    select: {
      id: true,
      name: true,
      email: true,
      email_verified_at: true,
      last_login_at: true,
    },
  });

  // Filtrer : pas de connexion depuis la confirmation
  const targets = candidates.filter((u) => {
    if (!u.last_login_at) return true;
    if (!u.email_verified_at) return false;
    return u.last_login_at <= u.email_verified_at;
  });

  log.debug(`[REENGAGEMENT] Email 3 — ${targets.length} candidat(s)`);

  // Fetch real leaderboard once for all targets
  const leaders = await getTop3Leaders();

  for (const user of targets) {
    try {
      await sendReengagementEmail3({ email: user.email, name: user.name, leaders });

      await prisma.user.update({
        where: { id: user.id },
        data: { reengagement_email3_sent: true },
      });

      sent++;
      log.debug(`[REENGAGEMENT] Email 3 envoyé → ${user.email}`);
    } catch (err: any) {
      errors++;
      log.error(`[REENGAGEMENT] Email 3 erreur → ${user.email}: ${err.message}`);
    }
  }

  return { sent, errors };
}

/**
 * Point d'entrée principal — appelé par le cron
 */
export async function sendReengagementEmails(): Promise<{
  email0: { sent: number; errors: number };
  email1: { sent: number; errors: number };
  email2: { sent: number; errors: number };
  email3: { sent: number; errors: number };
  total_sent: number;
  total_errors: number;
}> {
  log.debug('[REENGAGEMENT] Démarrage de la séquence de réengagement...');

  const [email0, email1, email2, email3] = await Promise.all([
    processEmail0(),
    processEmail1(),
    processEmail2(),
    processEmail3(),
  ]);

  const total_sent = email0.sent + email1.sent + email2.sent + email3.sent;
  const total_errors = email0.errors + email1.errors + email2.errors + email3.errors;

  log.debug(
    `[REENGAGEMENT] Terminé — ${total_sent} email(s) envoyé(s), ${total_errors} erreur(s)`
  );

  return { email0, email1, email2, email3, total_sent, total_errors };
}
