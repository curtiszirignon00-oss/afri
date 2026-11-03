import { log } from '../config/logger';
import prisma from '../config/prisma';
import { cacheInvalidatePattern } from './cache.service';
import { computeMarketRatios } from './marketRatios';

export async function calculateAndUpdateDailyRatios(): Promise<{
  updated: number;
  skipped: number;
  errors: number;
}> {
  const stocks = await prisma.stock.findMany({
    where: { is_active: true },
    include: {
      fundamentals: true,
      annualFinancials: { orderBy: { year: 'desc' } },
    },
  });

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const stock of stocks) {
    try {
      const fundamental = stock.fundamentals[0] ?? null;
      const af = stock.annualFinancials; // triés year DESC
      const latest = af[0] ?? null;

      if (!fundamental) {
        skipped++;
        continue;
      }

      const currentPrice = stock.current_price;
      const shares = fundamental.shares_outstanding;

      if (!currentPrice || currentPrice <= 0) {
        skipped++;
        continue;
      }

      // eps : depuis StockFundamental en priorité, sinon dernière année AF
      const eps = fundamental.eps ?? latest?.eps ?? null;

      // Dividende net : si celui du dernier exercice n'est pas encore connu, celui de l'exercice précédent
      let dividend = latest?.dividend ?? null;
      if (dividend == null && af.length >= 2) {
        dividend = af[1].dividend;
      }

      const ratios = computeMarketRatios({
        price: currentPrice,
        shares,
        eps,
        equity: latest?.total_capitaux_propres ?? null,
        dividend,
      });

      // La capitalisation n'est pas effacée faute de nombre de titres : elle reste la dernière connue
      const updates: Record<string, number | null> = { ...ratios };
      if (ratios.market_cap === null) delete updates.market_cap;

      await prisma.stockFundamental.update({
        where: { stock_ticker: stock.symbol },
        data: updates,
      });

      updated++;
    } catch (err: any) {
      log.error(`[DAILY-RATIOS] Erreur ${stock.symbol}: ${err.message}`);
      errors++;
    }
  }

  // Invalider le cache pour que les données fraîches soient servies
  await cacheInvalidatePattern('stocks:*');
  await cacheInvalidatePattern('stock:*');

  log.info(`[DAILY-RATIOS] Terminé — mis à jour: ${updated}, ignorés: ${skipped}, erreurs: ${errors}`);
  return { updated, skipped, errors };
}
