import cron from 'node-cron';
import { calculateAndUpdateDailyRatios } from '../services/daily-ratios.service';

// Lun–ven 17:00 UTC (= 17h00 heure Abidjan, UTC+0, après clôture BRVM ~15h30)
cron.schedule('0 17 * * 1-5', async () => {
  console.log('📊 Recalcul des ratios journaliers (fin de cotation BRVM)...');
  try {
    const result = await calculateAndUpdateDailyRatios();
    console.log(`✅ Ratios journaliers mis à jour: ${result.updated} actions (${result.skipped} ignorées, ${result.errors} erreurs)`);
  } catch (error) {
    console.error('❌ Erreur recalcul ratios journaliers:', error);
  }
});
