// backend/src/test-scraper.ts

import { connectPrismaDatabase, disconnectPrismaDatabase } from './config/database.prisma';
import { scrapeStock, scrapeIndex } from './services/scraping.service';

// On importe les services corrigés
import { saveStocks } from './services/stock.service.prisma';
import { saveIndices } from './services/index.service.prisma';

async function runTest() {
  console.log('🧪 Démarrage du test de scraping...');

  try {
    // 1. Connexion à la BDD
    await connectPrismaDatabase();

    // 2. Lancement du scraping
    console.log('...Scraping des actions...');
    const stocks = await scrapeStock();

    console.log('...Scraping des indices...');
    const indices = await scrapeIndex();

    if (stocks.length === 0 && indices.length === 0) {
        console.log('❌ TEST ÉCHOUÉ : Le scraper n\'a rien retourné. Les sélecteurs CSS sont cassés.');
        return; // On arrête tout
    }

    // 3. Sauvegarde dans la BDD
    console.log('...Sauvegarde des actions dans Prisma...');
    await saveStocks(stocks);

    console.log('...Sauvegarde des indices dans Prisma...');
    await saveIndices(indices);

    console.log('✅ TEST TERMINÉ AVEC SUCCÈS !');

  } catch (error) {
    console.error('❌ ERREUR LORS DU TEST:', error);
  } finally {
    // 4. Déconnexion
    await disconnectPrismaDatabase();
  }
}

runTest();