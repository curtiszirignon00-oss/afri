/// <reference types="node" />
import prisma from '../config/prisma';

async function verifyNEICData() {
  try {
    console.log('🔍 Vérification des données NEIC...\n');

    const ticker = 'NEIC';

    // 1. Stock
    console.log('📊 Stock NEIC:');
    const stock = await prisma.stock.findUnique({
      where: { symbol: ticker }
    });
    if (stock) {
      console.log(`  ✅ Nom: ${stock.company_name}`);
      console.log(`  ✅ Secteur: ${stock.sector}`);
      console.log(`  ✅ Prix actuel: ${stock.current_price} FCFA`);
      console.log(`  ✅ Volume: ${stock.volume}`);
    } else {
      console.log('  ❌ Non trouvé');
    }
    console.log('');

    // 2. Données historiques
    console.log('📈 Données historiques NEIC:');
    const historyCount = await prisma.stockHistory.count({
      where: { stock_ticker: ticker }
    });
    console.log(`  ✅ Nombre total d'entrées historiques: ${historyCount}`);

    if (historyCount > 0) {
      const latestHistory = await prisma.stockHistory.findFirst({
        where: { stock_ticker: ticker },
        orderBy: { date: 'desc' }
      });
      const oldestHistory = await prisma.stockHistory.findFirst({
        where: { stock_ticker: ticker },
        orderBy: { date: 'asc' }
      });

      console.log(`  ✅ Date la plus ancienne: ${oldestHistory?.date.toLocaleDateString('fr-FR')}`);
      console.log(`  ✅ Date la plus récente: ${latestHistory?.date.toLocaleDateString('fr-FR')}`);
      console.log(`  ✅ Prix le plus récent: ${latestHistory?.close} FCFA`);
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Vérification terminée !');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNEICData();
