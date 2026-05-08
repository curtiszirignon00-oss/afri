/**
 * Job : Pulse du marché — Post quotidien épinglé BRVM
 *
 * Lance automatiquement chaque jour de bourse à 17h00 UTC
 * (après la clôture BRVM ~15h30 WAT / 14h30 UTC).
 *
 * Publié dans toutes les communautés PUBLIC avec :
 *   • Top 3 volumes du jour
 *   • Top 3 hausses du jour
 *   • Flop 3 baisses du jour
 *   • Question d'engagement générée par SIMBA (Groq)
 */

import cron from 'node-cron';
import prisma from '../config/prisma';
import { log } from '../config/logger';
import { generatePulseQuestion } from '../services/simba-micro';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PULSE_TAG = 'pulse_du_marche';

interface StockSummary {
  symbol: string;
  company_name: string | null;
  current_price: number | null;
  daily_change_percent: number | null;
  volume: number | null;
}

function formatVolume(v: number | null): string {
  if (v == null) return 'N/D';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

// ─── Core ─────────────────────────────────────────────────────────────────────


function buildPostContent(
  topVolume: StockSummary[],
  topGainers: StockSummary[],
  topLosers: StockSummary[],
  simbaQuestion: string,
  dateLabel: string,
): string {
  const volumeLines = topVolume.map((s, i) =>
    `${['🥇', '🥈', '🥉'][i]} **${s.symbol}** — ${formatVolume(s.volume)} titres échangés`,
  ).join('\n');

  const gainersLines = topGainers.map((s) => {
    const pct = s.daily_change_percent != null ? `+${s.daily_change_percent.toFixed(2)}%` : '';
    const price = s.current_price != null ? `${s.current_price.toLocaleString('fr-FR')} FCFA` : '';
    return `▲ **${s.symbol}** ${pct}${price ? ` → ${price}` : ''}`;
  }).join('\n');

  const losersLines = topLosers.map((s) => {
    const pct = s.daily_change_percent != null ? `${s.daily_change_percent.toFixed(2)}%` : '';
    const price = s.current_price != null ? `${s.current_price.toLocaleString('fr-FR')} FCFA` : '';
    return `▼ **${s.symbol}** ${pct}${price ? ` → ${price}` : ''}`;
  }).join('\n');

  return [
    `🌅 **PULSE DU MARCHÉ** — ${dateLabel}`,
    '',
    '📊 **TOP 3 VOLUMES**',
    volumeLines || '_Aucune donnée_',
    '',
    '📈 **TOP 3 HAUSSES**',
    gainersLines || '_Aucune donnée_',
    '',
    '📉 **FLOP 3 BAISSES**',
    losersLines || '_Aucune donnée_',
    '',
    '━━━━━━━━━━━━━━━━━━━━━',
    '💬 **Question du jour — SIMBA**',
    simbaQuestion,
    '',
    '👇 _Partagez votre analyse en commentaire !_',
  ].join('\n');
}

export async function runPulseMarche(): Promise<void> {
  log.info('[PulseMarché] Démarrage du post quotidien BRVM...');

  // 1. Données du jour
  const [topVolume, topGainers, topLosers] = await Promise.all([
    prisma.stock.findMany({
      where: { is_active: true, volume: { gt: 0 } },
      orderBy: { volume: 'desc' },
      take: 3,
      select: { symbol: true, company_name: true, current_price: true, daily_change_percent: true, volume: true },
    }),
    prisma.stock.findMany({
      where: { is_active: true, daily_change_percent: { gt: 0 } },
      orderBy: { daily_change_percent: 'desc' },
      take: 3,
      select: { symbol: true, company_name: true, current_price: true, daily_change_percent: true, volume: true },
    }),
    prisma.stock.findMany({
      where: { is_active: true, daily_change_percent: { lt: 0 } },
      orderBy: { daily_change_percent: 'asc' },
      take: 3,
      select: { symbol: true, company_name: true, current_price: true, daily_change_percent: true, volume: true },
    }),
  ]);

  if (topVolume.length === 0 && topGainers.length === 0) {
    log.warn('[PulseMarché] Aucune donnée BRVM disponible — post annulé.');
    return;
  }

  // 2. Admin auteur
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true },
  });

  if (!admin) {
    log.error('[PulseMarché] Aucun admin trouvé — post annulé.');
    return;
  }

  // 3. Question SIMBA
  const featuredStock = topGainers[0] ?? topVolume[0];
  const simbaQuestion = await generatePulseQuestion(featuredStock);

  // 4. Contenu
  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const title = `Pulse du marché — ${new Date().toLocaleDateString('fr-FR', { timeZone: 'UTC' })}`;
  const content = buildPostContent(topVolume, topGainers, topLosers, simbaQuestion, dateLabel);

  // 5. Dépingler l'ancien Pulse social s'il existe
  const oldSocialPulse = await prisma.post.findFirst({
    where: { tags: { has: PULSE_TAG }, is_pinned: true },
    orderBy: { created_at: 'desc' },
  });
  if (oldSocialPulse) {
    await prisma.post.update({ where: { id: oldSocialPulse.id }, data: { is_pinned: false } });
  }

  // 6. Publier dans le feed social public (/community)
  await prisma.post.create({
    data: {
      author_id: admin.id,
      type: 'ANALYSIS',
      title,
      content,
      stock_symbol: featuredStock.symbol ?? null,
      stock_price: featuredStock.current_price ?? null,
      stock_change: featuredStock.daily_change_percent ?? null,
      tags: [PULSE_TAG],
      visibility: 'PUBLIC',
      is_pinned: true,
    },
  });

  log.info('[PulseMarché] ✅ Post publié dans le feed social public (/community).');
}

// ─── Planification ────────────────────────────────────────────────────────────
// Lun–ven à 17h00 UTC (clôture BRVM ~14h30 UTC, données fraîches à 17h)

cron.schedule('0 17 * * 1-5', async () => {
  try {
    await runPulseMarche();
  } catch (err) {
    log.error('[PulseMarché] Erreur fatale dans le job cron :', err);
  }
}, { timezone: 'UTC' });

log.info('[PulseMarché] Job planifié — lun–ven à 17h00 UTC');

// ─── Rattrapage au démarrage ──────────────────────────────────────────────────
// Si le serveur a redémarré après 17h un jour de bourse et que le Pulse du jour
// n'a pas encore été publié, on le publie immédiatement.

async function catchUpIfMissed(): Promise<void> {
  try {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=dim, 6=sam
    const hourUTC = now.getUTCHours();

    // Uniquement lun–ven après 17h UTC
    if (dayOfWeek === 0 || dayOfWeek === 6 || hourUTC < 17) return;

    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));

    const alreadyPosted = await prisma.communityPost.findFirst({
      where: {
        tags: { has: PULSE_TAG },
        created_at: { gte: todayStart },
      },
      select: { id: true },
    });

    if (alreadyPosted) {
      log.info('[PulseMarché] Rattrapage : post du jour déjà publié.');
      return;
    }

    log.info('[PulseMarché] Rattrapage : post manqué détecté, publication immédiate...');
    await runPulseMarche();
  } catch (err) {
    log.error('[PulseMarché] Erreur dans le rattrapage au démarrage :', err);
  }
}

// Délai de 10s pour laisser le serveur et Prisma se connecter complètement
setTimeout(catchUpIfMissed, 10_000);
