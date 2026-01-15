/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImport() {
  const count = await prisma.stockHistory.count({
    where: { stock_ticker: 'ABJC' }
  });

  console.log(`✅ Total ABJC history records in database: ${count}`);

  if (count > 0) {
    const latest = await prisma.stockHistory.findFirst({
      where: { stock_ticker: 'ABJC' },
      orderBy: { date: 'desc' }
    });

    const oldest = await prisma.stockHistory.findFirst({
      where: { stock_ticker: 'ABJC' },
      orderBy: { date: 'asc' }
    });

    console.log(`Latest record: ${latest?.date.toISOString().split('T')[0]} - Close: ${latest?.close}`);
    console.log(`Oldest record: ${oldest?.date.toISOString().split('T')[0]} - Close: ${oldest?.close}`);
  }

  await prisma.$disconnect();
}

checkImport();
