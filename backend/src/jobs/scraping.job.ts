import cron from 'node-cron';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveIndices } from '../services/index.service.prisma';
import { saveStocks } from '../services/stock.service.prisma';

// Tâche cron pour exécuter le scraping toutes les 2 heures

cron.schedule('0 */2 * * *', async () => { // Exécute toutes les 2 heures
    console.log('Tâche de scraping exécutée toutes les 2 heures');
    const stocks = await scrapeStock();
    const indices = await scrapeIndex();
    await saveStocks(stocks);
    await saveIndices(indices);
});