// src/services/article-email.service.ts
import { prisma } from '../config/database';
import { log } from '../config/logger';
import { sendNewArticleEmail } from './email.service';

interface BroadcastOptions {
  /** Délai entre deux envois (ms) — respecte les limites SMTP (Brevo). Défaut 1500. */
  delayMs?: number;
  /** Si true, ne fait qu'énumérer sans envoyer. Défaut false. */
  dryRun?: boolean;
  /** Filtre optionnel : n'envoyer qu'aux comptes avec email vérifié. Défaut false (tous). */
  verifiedOnly?: boolean;
  /** Si true, inclut les comptes de démonstration (prenom.nomNNNN@gmail.com). Défaut false. */
  includeSeedAccounts?: boolean;
}

interface BroadcastResult {
  articleId: string;
  slug: string | null;
  total: number;
  sent: number;
  failed: number;
  /** Comptes de démonstration écartés de la diffusion. */
  skippedSeed: number;
}

/**
 * Comptes de démonstration créés pour peupler la plateforme : adresses de la
 * forme « prenom.nomNNNN@gmail.com ». Elles ne correspondent à aucune boîte
 * réelle — les inclure dans une diffusion génère des rebonds qui dégradent la
 * réputation d'envoi du domaine. Exclues par défaut.
 */
const SEED_ACCOUNT_EMAIL = /^[a-z]+\.[a-z]+\d+@gmail\.com$/i;

export function isSeedAccountEmail(email: string | null | undefined): boolean {
  return !!email && SEED_ACCOUNT_EMAIL.test(email.trim());
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Diffuse par email « nouvel article » à tous les utilisateurs.
 * Séquentiel avec délai pour ne pas saturer le SMTP. Non bloquant côté appelant
 * (à lancer en fire-and-forget). Idempotence : à gérer par l'appelant si besoin.
 */
export async function broadcastNewArticleEmail(
  articleId: string,
  opts: BroadcastOptions = {},
): Promise<BroadcastResult> {
  const delayMs = opts.delayMs ?? 1500;
  const dryRun = opts.dryRun ?? false;

  const article = await prisma.newsArticle.findUnique({
    where: { id: articleId },
    select: { id: true, title: true, slug: true, summary: true, category: true, image_url: true },
  });

  if (!article) {
    log.warn(`[ArticleEmail] Article ${articleId} introuvable — diffusion annulée.`);
    return { articleId, slug: null, total: 0, sent: 0, failed: 0, skippedSeed: 0 };
  }

  const allUsers = await prisma.user.findMany({
    where: opts.verifiedOnly ? { email_verified_at: { not: null } } : undefined,
    select: { name: true, email: true },
    orderBy: { created_at: 'asc' },
  });

  // Le filtre se fait en mémoire : MongoDB via Prisma ne prend pas de regex en `where`.
  const users = opts.includeSeedAccounts
    ? allUsers
    : allUsers.filter(u => !isSeedAccountEmail(u.email));
  const skippedSeed = allUsers.length - users.length;

  log.info(
    `[ArticleEmail] Diffusion « ${article.title} » → ${users.length} destinataire(s)` +
    (skippedSeed ? ` (${skippedSeed} compte(s) de démo écarté(s))` : '') +
    (dryRun ? ' [DRY-RUN]' : ''),
  );

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (!u.email) continue;
    try {
      if (!dryRun) {
        await sendNewArticleEmail({
          email: u.email,
          name: u.name,
          title: article.title,
          summary: article.summary,
          slug: article.slug,
          category: article.category,
          imageUrl: article.image_url,
        });
      }
      sent++;
    } catch (err: any) {
      failed++;
      log.warn(`[ArticleEmail] Échec envoi à ${u.email} : ${err?.message ?? err}`);
    }
    if (!dryRun && i < users.length - 1) await sleep(delayMs);
  }

  log.info(`[ArticleEmail] Diffusion terminée « ${article.title} » — envoyés: ${sent}, échecs: ${failed}, démo écartés: ${skippedSeed}`);
  return { articleId: article.id, slug: article.slug, total: users.length, sent, failed, skippedSeed };
}
