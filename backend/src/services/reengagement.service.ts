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
      // Exclure les comptes créés il y a plus de 3 jours (fenêtre maximale)
      AND: [{ created_at: { gte: daysAgo(3) } }],
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
      // Si le token a expiré, on ne peut pas envoyer un lien valide — on skip
      if (!user.email_confirmation_token || !user.email_confirmation_expires) {
        continue;
      }
      if (user.email_confirmation_expires < new Date()) {
        // Token expiré — on marque quand même pour ne pas re-tenter
        await prisma.user.update({
          where: { id: user.id },
          data: { reengagement_email0_sent: true },
        });
        continue;
      }

      await sendReengagementEmail0({
        email: user.email,
        name: user.name,
        confirmationToken: user.email_confirmation_token,
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

  for (const user of targets) {
    try {
      await sendReengagementEmail2({ email: user.email, name: user.name });

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

  for (const user of targets) {
    try {
      await sendReengagementEmail3({ email: user.email, name: user.name });

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
