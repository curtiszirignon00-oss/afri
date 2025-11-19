import cron from 'node-cron';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveIndices } from '../services/index.service.prisma';
import { saveStocks } from '../services/stock.service.prisma';
import { saveCurrentDayHistory } from '../services/stockHistory.service'; // 🆕 Service pour historique

// Tâche cron pour exécuter le scraping toutes les 2 heures

cron.schedule('0 */2 * * *', async () => { // Exécute toutes les 2 heures
    console.log('🔄 Tâche de scraping exécutée toutes les 2 heures');

    try {
        const stocks = await scrapeStock();
        const indices = await scrapeIndex();

        // Sauvegarder les données actuelles
        await saveStocks(stocks);
        await saveIndices(indices);

        // 🆕 Sauvegarder aussi dans l'historique (une fois par jour seulement)
        const currentHour = new Date().getHours();
        // Sauvegarder l'historique seulement à 18h (après clôture BRVM)
        if (currentHour === 18) {
            console.log('📊 Sauvegarde de l\'historique du jour...');
            await saveCurrentDayHistory();
        }

        console.log('✅ Scraping et sauvegarde terminés avec succès');
    } catch (error) {
        console.error('❌ Erreur lors du scraping:', error);
    }
});