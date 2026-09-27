/// <reference types="node" />
/**
 * Ajout de BBGC — BRIDGE BANK GROUP COTE D'IVOIRE
 * Nouvelle valeur admise a la cote de la BRVM (cours d'introduction : 6 750 FCFA).
 *
 * Cree/reactive l'action et pose un premier point d'historique au cours d'introduction
 * pour que le graphique de /stock/BBGC ne soit pas vide.
 * Idempotent : ne reecrase pas le cours si le scraper l'a deja mis a jour.
 */
import prisma from '../src/config/prisma';
import { cacheInvalidatePattern } from '../src/services/cache.service';

const SYMBOL = 'BBGC';
const COMPANY_NAME = "BRIDGE BANK GROUP COTE D'IVOIRE";
const SECTOR = 'Services Financiers';
const COUNTRY = "Cote d'Ivoire";
const INTRO_PRICE = 6750;

async function main() {
  const existing = await prisma.stock.findUnique({ where: { symbol: SYMBOL } });

  const stock = await prisma.stock.upsert({
    where: { symbol: SYMBOL },
    // Sur re-execution : on ne touche pas au cours (le scraper en est proprietaire)
    update: {
      company_name: COMPANY_NAME,
      sector: SECTOR,
      country: COUNTRY,
      is_active: true,
    },
    create: {
      symbol: SYMBOL,
      company_name: COMPANY_NAME,
      sector: SECTOR,
      country: COUNTRY,
      is_active: true,
      current_price: INTRO_PRICE,
      previous_close: INTRO_PRICE,
      daily_change_percent: 0,
      volume: 0,
      market_cap: 0,
    },
  });

  console.log(
    existing
      ? `ℹ️  ${SYMBOL} existait deja — infos mises a jour (cours inchange : ${stock.current_price} FCFA)`
      : `✅ ${SYMBOL} (${COMPANY_NAME}) cree a ${INTRO_PRICE} FCFA`
  );

  // Premier point d'historique : cours d'introduction du jour
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const history = await prisma.stockHistory.findFirst({
    where: { stock_ticker: SYMBOL },
  });

  if (!history) {
    await prisma.stockHistory.create({
      data: {
        stock_ticker: SYMBOL,
        stockId: stock.id,
        date: today,
        open: INTRO_PRICE,
        high: INTRO_PRICE,
        low: INTRO_PRICE,
        close: INTRO_PRICE,
        volume: 0,
      },
    });
    console.log(`✅ Point d'historique du ${today.toISOString().slice(0, 10)} pose a ${INTRO_PRICE} FCFA`);
  } else {
    console.log(`ℹ️  Historique deja present pour ${SYMBOL} — aucun point ajoute`);
  }

  // Le cache liste/detail a un TTL de 15 min : on l'invalide pour un affichage immediat
  await cacheInvalidatePattern('stocks:*');
  await cacheInvalidatePattern('stock:*');
  console.log('✅ Cache stocks invalide');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
