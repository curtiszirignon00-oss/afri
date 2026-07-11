/**
 * Emails automatiques — Performance de portefeuille
 *
 * Parcourt toutes les positions ouvertes (quantity > 0), calcule le rendement
 * vs le cours actuel, et envoie l'email au palier le plus élevé non encore envoyé.
 *
 * Paliers gérés :
 *   Gains  : +25% · +50% · +100%
 *   Pertes : -15% · -30%
 *
 * Déduplication : table PerformanceEmailLog (@@unique [userId, ticker, palier])
 * → re-lancer le script ne renvoie jamais un email déjà envoyé.
 *
 * Logique de priorité par position :
 *   On envoie UN seul email par position par exécution, au palier le plus significatif
 *   non encore envoyé. Les paliers inférieurs sont également marqués comme envoyés
 *   pour éviter de les envoyer lors des runs suivants.
 *
 * Usage    : npx tsx src/scripts/send-performance-emails.ts
 * Dry-run  : DRY_RUN=true npx tsx src/scripts/send-performance-emails.ts
 * Ticker   : TICKER=SNTS npx tsx src/scripts/send-performance-emails.ts  (1 seul ticker)
 *
 * Ctrl+C arrête proprement (aucune progression à sauvegarder — dédup via DB).
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../config/prisma';
import { sendPerformanceEmail } from '../services/email.service';

const DELAY_MS = 1500;
const DRY_RUN  = process.env.DRY_RUN  === 'true';
const ONLY_TICKER = process.env.TICKER ?? null; // optionnel : restreindre à 1 ticker

type Palier = '+25' | '+50' | '+100' | '-15' | '-30';

// Paliers gain du plus élevé au plus bas (priorité décroissante)
const GAIN_PALIERS: { palier: Palier; threshold: number }[] = [
  { palier: '+100', threshold: 100 },
  { palier: '+50',  threshold: 50  },
  { palier: '+25',  threshold: 25  },
];

// Paliers perte du plus bas au plus haut (priorité décroissante)
const LOSS_PALIERS: { palier: Palier; threshold: number }[] = [
  { palier: '-30', threshold: -30 },
  { palier: '-15', threshold: -15 },
];

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let interrupted = false;
process.on('SIGINT', () => {
  console.log('\n\n⏸️  Interruption reçue — arrêt propre après le message en cours.\n');
  interrupted = true;
});

async function alreadySent(userId: string, ticker: string): Promise<boolean> {
  const existing = await prisma.performanceEmailLog.findUnique({
    where: { userId_ticker: { userId, ticker } },
  });
  return existing !== null;
}

async function markSent(userId: string, ticker: string, palier: Palier): Promise<void> {
  await prisma.performanceEmailLog.create({
    data: { userId, ticker, palier },
  });
}

async function run() {
  console.log('='.repeat(65));
  console.log(`📊  Emails performance portefeuille${DRY_RUN ? ' [DRY-RUN]' : ''}${ONLY_TICKER ? ` · ticker=${ONLY_TICKER}` : ''}`);
  console.log('    Paliers : +25% · +50% · +100% · -15% · -30%');
  console.log('='.repeat(65) + '\n');

  // 1. Charger toutes les positions ouvertes avec user + stock
  const wherePosition: any = { quantity: { gt: 0 } };
  if (ONLY_TICKER) wherePosition.stock_ticker = ONLY_TICKER;

  const positions = await prisma.position.findMany({
    where: wherePosition,
    include: {
      portfolio: {
        include: {
          user: {
            select: { id: true, email: true, name: true, email_verified_at: true },
          },
        },
      },
    },
  });

  // 2. Charger tous les cours actuels en une requête
  const tickers = [...new Set(positions.map(p => p.stock_ticker))];
  const stocks  = await prisma.stock.findMany({
    where:  { symbol: { in: tickers }, is_active: true },
    select: { symbol: true, current_price: true, company_name: true },
  });
  const priceMap    = new Map(stocks.map(s => [s.symbol, s.current_price]));
  const companyMap  = new Map(stocks.map(s => [s.symbol, s.company_name]));

  console.log(`🏦  Positions chargées : ${positions.length}`);
  console.log(`📈  Tickers actifs     : ${tickers.length}\n`);

  let totalSent    = 0;
  let totalSkipped = 0;
  let totalErrors  = 0;
  let idx          = 0;

  for (const pos of positions) {
    if (interrupted) break;
    idx++;

    const user = pos.portfolio.user;
    if (!user.email_verified_at) { totalSkipped++; continue; } // email non vérifié

    const currentPrice = priceMap.get(pos.stock_ticker);
    if (!currentPrice || !pos.average_buy_price || pos.average_buy_price === 0) {
      totalSkipped++;
      continue;
    }

    const rendement = (currentPrice - pos.average_buy_price) / pos.average_buy_price * 100;
    const ticker    = pos.stock_ticker;
    const companyName = companyMap.get(ticker) ?? ticker;
    const userId    = user.id;

    // ── Un seul email par user+ticker (tous paliers confondus) ──────────────
    if (await alreadySent(userId, ticker)) { totalSkipped++; continue; }

    // Palier le plus significatif applicable au rendement actuel
    let targetPalier: Palier | null = null;

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

    const pctDisplay = rendement >= 0 ? `+${rendement.toFixed(1)}%` : `${rendement.toFixed(1)}%`;
    process.stdout.write(
      `   [${idx}/${positions.length}] ${user.email} · ${ticker} ${pctDisplay} → palier ${targetPalier} ... `
    );

    try {
      if (!DRY_RUN) {
        await sendPerformanceEmail({
          email:       user.email,
          name:        user.name ?? 'Investisseur',
          ticker,
          companyName,
          rendement,
          palier:      targetPalier,
        });
        await markSent(userId, ticker, targetPalier);
      }
      totalSent++;
      console.log(DRY_RUN ? '✅ (dry-run)' : '✅');
    } catch (e: any) {
      totalErrors++;
      console.log(`❌ ${e.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log('\n' + '='.repeat(65));
  console.log(`✅  Envoyés  : ${totalSent}`);
  console.log(`⏭️  Ignorés  : ${totalSkipped}`);
  console.log(`❌  Échoués  : ${totalErrors}`);
  console.log('='.repeat(65) + '\n');

  await prisma.$disconnect();
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('💥 Erreur fatale:', err); process.exit(1); });
