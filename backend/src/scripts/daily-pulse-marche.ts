/// <reference types="node" />
/**
 * Script manuel : Pulse du marché
 *
 * Lance immédiatement un Pulse du marché (sans attendre le cron).
 * Le job automatique est dans src/jobs/pulse-marche.job.ts (17h00 UTC lun–ven).
 *
 * Usage : npx tsx src/scripts/daily-pulse-marche.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockSummary {
  symbol: string;
  company_name: string | null;
  current_price: number | null;
  daily_change_percent: number | null;
  volume: number | null;
}

interface MarketData {
  topVolume: StockSummary[];
  topGainers: StockSummary[];
  topLosers: StockSummary[];
  date: string; // "lundi 14 avril 2025"
}

// ─── 1. Données de marché ─────────────────────────────────────────────────────

async function fetchMarketData(): Promise<MarketData> {
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

  // Date du jour (données BRVM du jour, script lancé à 17h GMT après clôture)
  const today = new Date();
  const date = today.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return { topVolume, topGainers, topLosers, date };
}

// ─── 2. Question SIMBA via Groq ───────────────────────────────────────────────

async function generateSimbaQuestion(stock: StockSummary): Promise<string> {
  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const change = stock.daily_change_percent != null
      ? `${stock.daily_change_percent >= 0 ? '+' : ''}${stock.daily_change_percent.toFixed(2)}%`
      : 'en mouvement';
    const price = stock.current_price != null
      ? `${stock.current_price.toLocaleString('fr-FR')} FCFA`
      : '';

    const chat = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      max_tokens: 120,
      messages: [
        {
          role: 'system',
          content:
            'Tu es SIMBA, coach financier BRVM. Pose une seule question courte et engageante en français (max 2 phrases) pour lancer la discussion sur ce titre. Ton bienveillant, pas de conseils d\'achat/vente directs.',
        },
        {
          role: 'user',
          content: `${stock.symbol} (${stock.company_name ?? 'N/D'}) est à ${change} aujourd'hui${price ? `, coté ${price}` : ''}. Pose une question pour la communauté.`,
        },
      ],
    });

    return chat.choices[0]?.message?.content?.trim() ?? fallbackQuestion(stock);
  } catch {
    return fallbackQuestion(stock);
  }
}

function fallbackQuestion(stock: StockSummary): string {
  const change = stock.daily_change_percent != null
    ? `${stock.daily_change_percent >= 0 ? '+' : ''}${stock.daily_change_percent.toFixed(2)}%`
    : 'en mouvement';
  return `${stock.symbol} est à ${change} aujourd'hui — est-ce le moment d'agir ou préférez-vous attendre une confirmation ? 👇`;
}

// ─── 3. Formatage du post ─────────────────────────────────────────────────────

function formatVolume(v: number | null): string {
  if (v == null) return 'N/D';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

function buildPostContent(data: MarketData, simbaQuestion: string): string {
  const { topVolume, topGainers, topLosers, date } = data;

  const volumeLines = topVolume.map((s, i) =>
    `${['🥇', '🥈', '🥉'][i]} **${s.symbol}** — ${formatVolume(s.volume)} titres échangés`
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
    `🌅 **PULSE DU MARCHÉ** — ${date.charAt(0).toUpperCase() + date.slice(1)}`,
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

// ─── 4. Publication ───────────────────────────────────────────────────────────

const PULSE_TAG = 'pulse_du_marche';

async function publishToCommunity(
  communityId: string,
  communityName: string,
  adminId: string,
  content: string,
  topGainer: StockSummary,
): Promise<void> {
  // Dépingler les anciens posts Pulse de cette communauté
  const oldPulse = await prisma.communityPost.findFirst({
    where: {
      community_id: communityId,
      tags: { has: PULSE_TAG },
      is_pinned: true,
    },
    orderBy: { created_at: 'desc' },
  });

  if (oldPulse) {
    await prisma.communityPost.update({
      where: { id: oldPulse.id },
      data: { is_pinned: false },
    });
    console.log(`   📌 Dépinglé : post du ${oldPulse.created_at.toLocaleDateString('fr-FR')}`);
  }

  // Créer le nouveau post épinglé
  await prisma.communityPost.create({
    data: {
      community_id: communityId,
      author_id: adminId,
      type: 'ANALYSIS',
      title: `Pulse du marché — ${new Date().toLocaleDateString('fr-FR', { timeZone: 'UTC' })}`,
      content,
      stock_symbol: topGainer.symbol ?? null,
      stock_price: topGainer.current_price ?? null,
      stock_change: topGainer.daily_change_percent ?? null,
      tags: [PULSE_TAG],
      is_pinned: true,
      is_approved: true,
    },
  });

  // Incrémenter le compteur de posts de la communauté
  await prisma.community.update({
    where: { id: communityId },
    data: { posts_count: { increment: 1 } },
  });

  console.log(`   ✅ Post épinglé publié dans "${communityName}"`);
}

// ─── 5. Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📊 PULSE DU MARCHÉ — AfriBourse');
  console.log('='.repeat(60));

  try {
    // a. Données BRVM
    console.log('\n🔍 Récupération des données BRVM...');
    const data = await fetchMarketData();

    if (data.topVolume.length === 0 && data.topGainers.length === 0) {
      console.log('⚠️  Aucune donnée de marché disponible. Arrêt.');
      return;
    }

    console.log(`   Volume  : ${data.topVolume.map(s => s.symbol).join(', ') || 'N/D'}`);
    console.log(`   Hausses : ${data.topGainers.map(s => `${s.symbol} +${s.daily_change_percent?.toFixed(2)}%`).join(', ') || 'N/D'}`);
    console.log(`   Baisses : ${data.topLosers.map(s => `${s.symbol} ${s.daily_change_percent?.toFixed(2)}%`).join(', ') || 'N/D'}`);

    // b. Question SIMBA sur la meilleure hausse (ou premier volume si pas de hausse)
    const featuredStock = data.topGainers[0] ?? data.topVolume[0];
    console.log(`\n🤖 Génération de la question SIMBA pour ${featuredStock?.symbol ?? '—'}...`);
    const simbaQuestion = featuredStock
      ? await generateSimbaQuestion(featuredStock)
      : 'Quelle valeur BRVM surveillez-vous en ce moment ? Partagez votre analyse ! 👇';
    console.log(`   Question : "${simbaQuestion}"`);

    // c. Contenu du post
    const content = buildPostContent(data, simbaQuestion);

    // d. Admin système
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' },
      select: { id: true, name: true },
    });

    if (!admin) {
      console.log('❌ Aucun admin trouvé. Impossible de publier.');
      return;
    }

    console.log(`\n👤 Auteur : ${admin.name ?? admin.id} (admin)`);

    // e. Toutes les communautés publiques actives
    const communities = await prisma.community.findMany({
      where: { visibility: 'PUBLIC' },
      select: { id: true, name: true, slug: true },
      orderBy: { members_count: 'desc' },
    });

    console.log(`\n🏘️  ${communities.length} communauté(s) publique(s) trouvée(s)\n`);
    console.log('='.repeat(60));

    let success = 0;
    let errors = 0;

    for (const community of communities) {
      process.stdout.write(`📌 ${community.name} (${community.slug})... `);
      try {
        // S'assurer que l'admin est bien membre (upsert silencieux)
        await prisma.communityMember.upsert({
          where: {
            community_id_user_id: {
              community_id: community.id,
              user_id: admin.id,
            },
          },
          update: {},
          create: {
            community_id: community.id,
            user_id: admin.id,
            role: 'ADMIN',
          },
        });

        await publishToCommunity(
          community.id,
          community.name,
          admin.id,
          content,
          featuredStock ?? data.topVolume[0],
        );
        success++;
      } catch (err: any) {
        console.log(`❌ ERREUR : ${err.message}`);
        errors++;
      }
    }

    // f. Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(60));
    console.log(`Communautés : ${communities.length}`);
    console.log(`✅ Succès   : ${success}`);
    console.log(`❌ Erreurs  : ${errors}`);
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\n💥 Erreur fatale :', err);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n👋 Terminé');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Erreur critique :', err);
    process.exit(1);
  });
