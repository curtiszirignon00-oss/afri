/// <reference types="node" />
import { importStockHistoryFromExcel } from './import-stock-history-generic';
import prisma from '../config/prisma';

async function reimportSIVCHistory() {
  try {
    console.log('🚀 Ré-import des données historiques SIVC...\n');

    const ticker = 'SIVC';
    const excelPath = 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\sivc\\sivc.xlsx';

    // Supprimer toutes les anciennes données historiques SIVC
    console.log('🗑️  Suppression des anciennes données historiques SIVC...');
    const deletedCount = await prisma.stockHistory.deleteMany({
      where: { stock_ticker: ticker }
    });
    console.log(`  ✅ ${deletedCount.count} anciennes données supprimées\n`);

    // Importer les nouvelles données historiques
    const result = await importStockHistoryFromExcel(ticker, excelPath, {
      skipExisting: false, // Ne pas ignorer les données existantes car on vient de tout supprimer
      verbose: true
    });

    // Vérifier le total de données après l'import
    const totalHistory = await prisma.stockHistory.count({
      where: { stock_ticker: ticker }
    });

    console.log(`📊 Total des données historiques ${ticker} dans la base: ${totalHistory}\n`);
    console.log('✅ Ré-import terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du ré-import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
reimportSIVCHistory()
  .then(() => {
    console.log('\n🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Le script a échoué:', error);
    process.exit(1);
  });
