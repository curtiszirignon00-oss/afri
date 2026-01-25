/**
 * Job de Backup Automatique - AfriBourse
 *
 * Planifié pour s'exécuter chaque dimanche à 23h00
 * Sauvegarde toutes les données importantes de la base de données
 */

import cron from 'node-cron';
import { runFullBackup } from '../services/backup.service';

// Cron expression: "0 23 * * 0" = À 23h00, chaque dimanche (0 = dimanche)
const BACKUP_SCHEDULE = '0 23 * * 0';

// Pour les tests, vous pouvez utiliser ces expressions:
// Toutes les minutes: '* * * * *'
// Toutes les heures: '0 * * * *'
// Tous les jours à 23h: '0 23 * * *'
// Chaque dimanche à 23h: '0 23 * * 0'

// Calculer la prochaine exécution
function getNextSunday23h(): string {
  const now = new Date();
  const nextSunday = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7;
  nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 && now.getHours() >= 23 ? 7 : daysUntilSunday));
  nextSunday.setHours(23, 0, 0, 0);
  return nextSunday.toLocaleString('fr-FR');
}

// Démarrage automatique du job de backup
console.log('🔄 [BACKUP JOB] Initialisation du job de backup automatique');
console.log(`   📅 Planification: Chaque dimanche à 23h00`);
console.log(`   📆 Prochaine exécution: ${getNextSunday23h()}`);

cron.schedule(BACKUP_SCHEDULE, async () => {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 [BACKUP JOB] Exécution du backup automatique...');
  console.log('='.repeat(60));

  try {
    const backupPath = await runFullBackup();
    console.log(`\n✅ [BACKUP JOB] Backup terminé: ${backupPath}`);
  } catch (error: any) {
    console.error(`\n❌ [BACKUP JOB] Erreur lors du backup:`, error.message);
  }
}, {
  timezone: 'Africa/Abidjan' // GMT+0 - Timezone de la Côte d'Ivoire
});

console.log('✅ [BACKUP JOB] Job de backup activé');

/**
 * Exécute un backup manuellement
 */
export async function runManualBackup(): Promise<string> {
  console.log('🔄 [BACKUP JOB] Exécution manuelle du backup...');
  return await runFullBackup();
}

export default {
  runManualBackup,
};
