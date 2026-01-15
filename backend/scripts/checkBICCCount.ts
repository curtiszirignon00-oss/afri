/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const count = await prisma.stockHistory.count({
    where: { stock_ticker: 'BICC' }
  });
  console.log(`📊 BICC records in database: ${count}`);

  const latest = await prisma.stockHistory.findFirst({
    where: { stock_ticker: 'BICC' },
    orderBy: { date: 'desc' }
  });

  if (latest) {
    console.log(`📅 Latest record: ${latest.date.toLocaleDateString()}`);
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
