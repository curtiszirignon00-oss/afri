/// <reference types="node" />
// Statut de cotation d'un titre.
//
//   npx tsx scripts/setStockListingStatus.ts SICC suspend 2026-09-16   -> suspension BRVM (titre visible, ordres bloques)
//   npx tsx scripts/setStockListingStatus.ts SICC resume               -> reprise de cotation
//   npx tsx scripts/setStockListingStatus.ts SVOC delist 2025-06-26    -> radiation (is_active = false)
//   npx tsx scripts/setStockListingStatus.ts SICC                      -> affiche le statut

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const [symbolArg, action, dateArg] = process.argv.slice(2);

async function main() {
  if (!symbolArg) throw new Error('Usage : setStockListingStatus.ts <TICKER> [suspend|resume|delist] [AAAA-MM-JJ]');
  const symbol = symbolArg.toUpperCase();
  const date = dateArg ? new Date(`${dateArg}T00:00:00Z`) : new Date();
  if (Number.isNaN(date.getTime())) throw new Error(`Date invalide : ${dateArg}`);

  const select = { symbol: true, is_active: true, delisted_at: true, trading_suspended_at: true } as const;

  if (action === 'suspend') {
    await prisma.stock.update({ where: { symbol }, data: { trading_suspended_at: date } });
  } else if (action === 'resume') {
    await prisma.stock.update({ where: { symbol }, data: { trading_suspended_at: null } });
  } else if (action === 'delist') {
    await prisma.stock.update({ where: { symbol }, data: { is_active: false, delisted_at: date } });
  } else if (action) {
    throw new Error(`Action inconnue : ${action}`);
  }

  const stock = await prisma.stock.findUnique({ where: { symbol }, select });
  if (!stock) throw new Error(`Titre ${symbol} introuvable`);
  const open = await prisma.position.count({ where: { stock_ticker: symbol, quantity: { gt: 0 } } });
  console.log(JSON.stringify({ ...stock, positions_ouvertes: open }));
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
