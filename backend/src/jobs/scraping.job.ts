import cron from 'node-cron';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveIndices } from '../services/index.service.prisma';
import { saveStocks } from '../services/stock.service.prisma';

// Tâche cron pour exécuter le scraping toutes les 10 heures

cron.schedule('0 */10 * * *', async () => { // Exécute toutes les 10 heures
    console.log('Tâche de scraping exécutée toutes les 10 heures');
    const stocks = await scrapeStock();
    const indices = await scrapeIndex();
    await saveStocks(stocks);
    await saveIndices(indices);
});