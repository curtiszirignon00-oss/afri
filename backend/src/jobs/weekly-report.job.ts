/**
 * Job bilan hebdomadaire fusionné — AfriBourse
 *
 * Planification : vendredi 18h00 UTC (Afrique/Abidjan = UTC+0)
 * Remplace les anciens bilans séparés (portfolio bi-hebdo + learning hebdo).
 *
 * Ce job est un FALLBACK in-process au cas où QStash ne déclenche pas
 * /api/cron/send-weekly-reports. Les deux systèmes utilisent le même
 * service, mais un garde-fou empêche l'envoi en double le même jour.
 */

import cron from 'node-cron';
import { sendWeeklyReports } from '../services/weekly-report.service';
import { log } from '../config/logger';

let isRunning = false;
let lastRunDate: string | null = null;

export async function runWeeklyReportJob(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  if (isRunning) {
    log.debug('[WEEKLY REPORT JOB] Déjà en cours, ignoré');
    return;
  }
  if (lastRunDate === today) {
    log.debug('[WEEKLY REPORT JOB] Déjà exécuté aujourd\'hui, ignoré');
    return;
  }

  isRunning = true;
  try {
    log.debug('[WEEKLY REPORT JOB] Démarrage du bilan hebdomadaire fusionné...');
    await sendWeeklyReports();
    lastRunDate = today;
    log.debug('[WEEKLY REPORT JOB] Terminé avec succès');
  } catch (err: any) {
    log.error('[WEEKLY REPORT JOB] Erreur:', err.message);
  } finally {
    isRunning = false;
  }
}

// Vendredi 18h00 UTC (Africa/Abidjan = GMT+0)
cron.schedule('0 18 * * 5', runWeeklyReportJob, {
  timezone: 'Africa/Abidjan',
});

log.debug('[WEEKLY REPORT JOB] Planifié — vendredi 18h00 UTC');
