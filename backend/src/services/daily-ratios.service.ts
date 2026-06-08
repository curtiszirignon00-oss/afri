import { log } from '../config/logger';
import prisma from '../config/prisma';
import { cacheInvalidatePattern } from './cache.service';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

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

      const updates: Record<string, number | null> = {};

      // market_cap = cours × nombre de titres
      if (shares && shares > 0) {
        updates.market_cap = round2(currentPrice * shares);
      }

      // eps : depuis StockFundamental en priorité, sinon dernière année AF
      const eps = fundamental.eps ?? latest?.eps ?? null;

      // pe_ratio = cours / BNPA
      if (eps && eps > 0) {
        const per = round2(currentPrice / eps);
        if (per > 0 && per <= 200) {
          updates.pe_ratio = per;
        }
      }

      // pb_ratio = cours / (capitaux_propres × 1 000 000 / titres)
      // total_capitaux_propres est stocké en millions de FCFA
      if (latest?.total_capitaux_propres && shares && shares > 0) {
        const bookValuePerShare = (latest.total_capitaux_propres * 1_000_000) / shares;
        if (bookValuePerShare > 0) {
          const pb = round2(currentPrice / bookValuePerShare);
          if (pb >= 0.1 && pb <= 100) {
            updates.pb_ratio = pb;
          }
        }
      }

      // dividend_yield = dividende / cours × 100
      // Fallback : si dividende de la dernière année est null, essayer l'année précédente
      let dividend = latest?.dividend ?? null;
      if (dividend == null && af.length >= 2) {
        dividend = af[1].dividend;
      }
      if (dividend != null && dividend > 0) {
        updates.dividend_yield = round2((dividend / currentPrice) * 100);
      }

      if (Object.keys(updates).length === 0) {
        skipped++;
        continue;
      }

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
