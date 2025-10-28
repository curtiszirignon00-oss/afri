import cron from 'node-cron';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveIndices } from '../services/index.service.prisma';
import { saveStocks } from '../services/stock.service.prisma';

// Tâche cron pour exécuter le scraping tous les jours à minuit

cron.schedule('0 0 * * *', async () => { // Exécute à minuit chaque jour
    console.log('Tâche de scraping exécutée tous les jours à minuit');
    const stocks = await scrapeStock();
    const indices = await scrapeIndex();
    await saveStocks(stocks);
    await saveIndices(indices);
});