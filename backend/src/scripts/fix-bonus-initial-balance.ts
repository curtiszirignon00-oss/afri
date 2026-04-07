/**
 * Script de correction : aligner initial_balance avec les bonus reçus.
 *
 * Problème : les bonus XP/level-up ont incrémenté cash_balance sans toucher
 * initial_balance, créant un écart fictif qui apparaissait comme un gain
 * permanent dans l'historique du portefeuille (ex: +250 000 FCFA).
 *
 * Correction : pour chaque portfolio SANDBOX dont le cash_balance actuel
 * est supérieur à ce que les seules transactions BUY/SELL peuvent expliquer,
 * on recalcule le cash attendu depuis initial_balance et on aligne initial_balance.
 *
 * ATTENTION : ce script est idempotent — re-exécuter ne causera pas de double correction.
 *
 * Usage : npx ts-node src/scripts/fix-bonus-initial-balance.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`🔧 fix-bonus-initial-balance [${DRY_RUN ? 'DRY-RUN' : 'LIVE'}]`);

  const portfolios = await prisma.portfolio.findMany({
    where: { wallet_type: 'SANDBOX', status: 'ACTIVE' },
    include: {
      transactions: {
        select: { type: true, quantity: true, price_per_share: true }
      }
    }
  });

  console.log(`Found ${portfolios.length} SANDBOX portfolios`);

  let fixed = 0;
  let skipped = 0;

  for (const portfolio of portfolios) {
    // Recalculer le cash attendu depuis le solde initial + transactions
    let expectedCash = portfolio.initial_balance;
    for (const tx of portfolio.transactions) {
      const amount = tx.quantity * tx.price_per_share;
      if (tx.type === 'BUY') expectedCash -= amount;
      else if (tx.type === 'SELL') expectedCash += amount;
    }

    const bonus = portfolio.cash_balance - expectedCash;

    if (bonus <= 0) {
      skipped++;
      continue;
    }

    console.log(
      `Portfolio ${portfolio.id} (user ${portfolio.userId}): ` +
      `cash_balance=${portfolio.cash_balance}, expected=${expectedCash}, ` +
      `bonus=${bonus} → initial_balance ${portfolio.initial_balance} → ${portfolio.initial_balance + bonus}`
    );

    if (!DRY_RUN) {
      await prisma.portfolio.update({
        where: { id: portfolio.id },
        data: { initial_balance: { increment: bonus } }
      });
    }

    fixed++;
  }

  console.log(`\nDone: ${fixed} fixed, ${skipped} already correct`);
  if (DRY_RUN) console.log('(dry-run, no changes made)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
