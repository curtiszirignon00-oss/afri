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
}

interface BroadcastResult {
  articleId: string;
  slug: string | null;
  total: number;
  sent: number;
  failed: number;
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
    return { articleId, slug: null, total: 0, sent: 0, failed: 0 };
  }

  const users = await prisma.user.findMany({
    where: opts.verifiedOnly ? { email_verified_at: { not: null } } : undefined,
    select: { name: true, email: true },
    orderBy: { created_at: 'asc' },
  });

  log.info(
    `[ArticleEmail] Diffusion « ${article.title} » → ${users.length} destinataire(s)` +
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

  log.info(`[ArticleEmail] Diffusion terminée « ${article.title} » — envoyés: ${sent}, échecs: ${failed}`);
  return { articleId: article.id, slug: article.slug, total: users.length, sent, failed };
}
