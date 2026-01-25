/// <reference types="node" />
import { importStockHistoryFromExcel } from './import-stock-history-generic';
import prisma from '../config/prisma';

async function importTTLCHistory() {
  try {
    console.log('🚀 Démarrage de l\'import des données historiques TTLC...\n');

    const ticker = 'TTLC';
    const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\ttlc\\TTLC.xlsx';

    // Importer les données historiques
    const result = await importStockHistoryFromExcel(ticker, excelPath, {
      skipExisting: true, // Ne pas écraser les données récentes scrapées
      verbose: true
    });

    // Vérifier le total de données après l'import
    const totalHistory = await prisma.stockHistory.count({
      where: { stock_ticker: ticker }
    });

    console.log(`📊 Total des données historiques ${ticker} dans la base: ${totalHistory}\n`);
    console.log('✅ Import terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importTTLCHistory()
  .then(() => {
    console.log('\n🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Le script a échoué:', error);
    process.exit(1);
  });
