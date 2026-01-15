/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStock() {
  const stock = await prisma.stock.findUnique({
    where: { symbol: 'ABJC' }
  });

  if (stock) {
    console.log('✅ Stock ABJC found:', stock.company_name);
    console.log('Current price:', stock.current_price);
  } else {
    console.log('❌ Stock ABJC not found in database');
  }

  await prisma.$disconnect();
}

checkStock();
