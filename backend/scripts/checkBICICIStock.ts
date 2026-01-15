/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStock() {
  // Chercher BICICI avec différentes variations
  const variations = ['BICICI', 'BICC', 'BICI'];

  for (const symbol of variations) {
    const stock = await prisma.stock.findUnique({
      where: { symbol }
    });

    if (stock) {
      console.log(`✅ Trouvé: ${symbol}`);
      console.log(JSON.stringify(stock, null, 2));
    } else {
      console.log(`❌ Non trouvé: ${symbol}`);
    }
  }

  // Chercher tous les stocks avec "BIC" dans le symbole ou nom
  const allBicStocks = await prisma.stock.findMany({
    where: {
      OR: [
        { symbol: { contains: 'BIC' } },
        { company_name: { contains: 'BICICI' } },
        { company_name: { contains: 'Commerce et Industrie' } }
      ]
    }
  });

  console.log('\n📊 Tous les stocks avec "BIC" dans le symbole ou nom:');
  allBicStocks.forEach(stock => {
    console.log(`  - ${stock.symbol}: ${stock.company_name}`);
  });
}

checkStock()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
