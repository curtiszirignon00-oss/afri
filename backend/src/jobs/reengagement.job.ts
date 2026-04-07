/**
 * Job de réengagement post-inscription
 * Tourne en in-process via node-cron — aucune configuration externe requise.
 *
 * Planification : tous les jours à 09h00 (Africa/Abidjan = GMT+0)
 *
 * Séquence :
 *   Email 0 — Relance confirmation J+1
 *   Email 1 — Réengagement J+1 après confirmation
 *   Email 2 — Marché BRVM J+3
 *   Email 3 — Simulateur & Top 5 J+7
 */

import cron from 'node-cron';
import { sendReengagementEmails } from '../services/reengagement.service';
import { log } from '../config/logger';

// Tous les jours à 09h00 (GMT+0)
cron.schedule('0 9 * * *', async () => {
  log.debug('[REENGAGEMENT JOB] Déclenchement de la séquence de réengagement...');

  try {
    const result = await sendReengagementEmails();
    log.debug(
      `[REENGAGEMENT JOB] Terminé — ${result.total_sent} email(s) envoyé(s), ${result.total_errors} erreur(s)` +
      ` | email0: ${result.email0.sent} | email1: ${result.email1.sent}` +
      ` | email2: ${result.email2.sent} | email3: ${result.email3.sent}`
    );
  } catch (err: any) {
    log.error('[REENGAGEMENT JOB] Erreur:', err.message);
  }
}, {
  timezone: 'Africa/Abidjan', // GMT+0
});

log.debug('[REENGAGEMENT JOB] Planifié — tous les jours à 09h00 (GMT+0)');
