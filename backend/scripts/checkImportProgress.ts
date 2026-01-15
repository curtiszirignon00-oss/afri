/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProgress() {
  console.log('📊 Vérification de la progression de l\'import...\n');

  // Compter le total d'enregistrements historiques
  const totalHistory = await prisma.stockHistory.count();
  console.log(`📈 Total d'enregistrements historiques: ${totalHistory.toLocaleString()}`);

  // Compter par action (top 10)
  const historyByStock = await prisma.stockHistory.groupBy({
    by: ['stock_ticker'],
    _count: {
      stock_ticker: true
    },
    orderBy: {
      _count: {
        stock_ticker: 'desc'
      }
    },
    take: 10
  });

  console.log('\n🏆 Top 10 actions avec le plus de données historiques:');
  historyByStock.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.stock_ticker}: ${item._count.stock_ticker.toLocaleString()} enregistrements`);
  });

  // Compter combien d'actions ont des données historiques
  const stocksWithHistory = await prisma.stock.count({
    where: {
      history: {
        some: {}
      }
    }
  });

  const totalStocks = await prisma.stock.count();
  console.log(`\n📊 Actions avec données historiques: ${stocksWithHistory}/${totalStocks}`);

  // Dernière mise à jour
  const latestUpdate = await prisma.stockHistory.findFirst({
    orderBy: {
      id: 'desc'
    },
    select: {
      stock_ticker: true,
      date: true
    }
  });

  if (latestUpdate) {
    console.log(`\n⏰ Dernière mise à jour: ${latestUpdate.stock_ticker} (${latestUpdate.date.toLocaleDateString()})`);
  }
}

checkProgress()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
