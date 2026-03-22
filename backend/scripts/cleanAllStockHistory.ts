/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTicker(ticker: string): Promise<{ deleted: number; remaining: number }> {
  const all = await prisma.stockHistory.findMany({ where: { stock_ticker: ticker } });

  const badIds = all
    .filter(r => {
      const d = new Date(r.date);
      const hours = d.getUTCHours();
      const day = d.getUTCDay();
      return hours !== 0 || day === 0 || day === 6; // mauvais timestamp OU weekend
    })
    .map(r => r.id);

  if (badIds.length === 0) return { deleted: 0, remaining: all.length };

  await prisma.stockHistory.deleteMany({ where: { id: { in: badIds } } });

  return { deleted: badIds.length, remaining: all.length - badIds.length };
}

async function main() {
  console.log('🧹 Nettoyage historique boursier — tous les tickers\n');

  const stocks = await prisma.stock.findMany({ select: { symbol: true }, orderBy: { symbol: 'asc' } });
  console.log(`📋 ${stocks.length} actions trouvées\n`);

  let totalDeleted = 0;
  let cleanCount = 0;
  let affectedCount = 0;

  for (const { symbol } of stocks) {
    const { deleted, remaining } = await cleanTicker(symbol);
    if (deleted > 0) {
      console.log(`🗑️  ${symbol.padEnd(10)} supprimés: ${String(deleted).padStart(5)}  restants: ${remaining}`);
      totalDeleted += deleted;
      affectedCount++;
    } else {
      console.log(`✅ ${symbol.padEnd(10)} propre (${remaining} records)`);
      cleanCount++;
    }
  }

  console.log('\n' + '='.repeat(55));
  console.log('📊 RÉSUMÉ');
  console.log('='.repeat(55));
  console.log(`✅ Actions déjà propres    : ${cleanCount}`);
  console.log(`🗑️  Actions nettoyées       : ${affectedCount}`);
  console.log(`🔢 Total enregistrements supprimés : ${totalDeleted}`);
  console.log('='.repeat(55));
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
