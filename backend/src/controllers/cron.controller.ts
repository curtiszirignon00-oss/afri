import { log } from '../config/logger';
import { Request, Response } from 'express';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveStocks } from '../services/stock.service.prisma';
import { saveIndices, saveCurrentDayIndexHistory } from '../services/index.service.prisma';
import { saveCurrentDayHistory } from '../services/stockHistory.service';
import {
    getActiveAlerts,
    shouldTriggerAlert,
    markAlertAsTriggered,
    createPriceAlertNotification
} from '../services/price-alert.service.prisma';
import { sendPriceAlertEmail } from '../services/email.service';
import { notifyPriceAlert } from '../services/notification.service';
import { sendWeeklyReports } from '../services/weekly-report.service';
import { runFullBackup } from '../services/backup.service';
import {
    runStreakCheck,
    runRankingsCalculation,
    runWeeklyChallengesGeneration,
    runCleanup
} from '../jobs/gamification.job';
import { updateROIRankStreaks } from '../services/gamification-leaderboard.service';
import prisma from '../config/prisma';
import { cacheInvalidatePattern } from '../services/cache.service';
import { checkWatchlistSignals } from '../services/watchlist-signal.service';
import { sendWeeklyWatchlistSummaries } from '../services/watchlist-summary.service';
import { sendReengagementEmails } from '../services/reengagement.service';
import { runPulseMarche } from '../jobs/pulse-marche.job';

// ============================================================
// POST /api/cron/scrape-stocks
// Scraping horaire des cotations + alertes de prix
// ============================================================
export async function cronScrapeStocks(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Scraping des cotations...');

        const stocks = await scrapeStock();
        const indices = await scrapeIndex();

        await saveStocks(stocks);
        await saveIndices(indices);

        // Verifier les alertes de prix
        await checkPriceAlerts();

        // Mettre à jour les streaks de position ROI (top 3)
        await updateROIRankStreaks();

        const duration = Date.now() - startTime;
        log.debug(`[CRON API] Scraping termine en ${duration}ms`);

        return res.status(200).json({
            success: true,
            message: 'Scraping termine',
            stocks_processed: stocks.length,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Scraping echoue:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/save-daily-history
// Sauvegarde quotidienne de l'historique (18h00 apres cloture BRVM)
// ============================================================
export async function cronSaveDailyHistory(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Sauvegarde historique du jour (actions + indices)...');
        await saveCurrentDayHistory();
        await saveCurrentDayIndexHistory();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Historique du jour sauvegarde (actions + indices)',
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Sauvegarde historique echouee:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/verify-streaks
// Verification quotidienne des streaks (01h00)
// ============================================================
export async function cronVerifyStreaks(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Verification des streaks...');
        const result = await runStreakCheck();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Streaks verifies',
            result,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Verification streaks echouee:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/calculate-rankings
// Calcul quotidien des classements (02h00)
// ============================================================
export async function cronCalculateRankings(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Calcul des classements...');
        const result = await runRankingsCalculation();

        // Invalider le cache leaderboard apres recalcul
        await cacheInvalidatePattern('leaderboard:*');

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Classements calcules',
            result,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Calcul classements echoue:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/reset-weekly-challenges
// Generation hebdomadaire des defis (Lundi 00h00)
// ============================================================
export async function cronResetWeeklyChallenges(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Generation des defis hebdomadaires...');
        const result = await runWeeklyChallengesGeneration();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Defis hebdomadaires crees',
            result,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Generation defis echouee:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/cleanup
// Nettoyage mensuel des anciennes donnees (1er du mois 03h00)
// ============================================================
export async function cronCleanup(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Nettoyage des donnees anciennes...');
        const result = await runCleanup();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Nettoyage termine',
            result,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Nettoyage echoue:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/backup
// Backup hebdomadaire (Dimanche 23h00)
// ============================================================
export async function cronBackup(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Backup en cours...');
        const backupPath = await runFullBackup();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Backup termine',
            path: backupPath,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Backup echoue:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/send-weekly-reports
// Rapport hebdomadaire combiné : marché BRVM + portefeuille + apprentissage
// (Vendredi 18h00 UTC)
// ============================================================
export async function cronSendWeeklyReports(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Envoi des rapports hebdomadaires combinés...');
        await sendWeeklyReports();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Rapports hebdomadaires envoyés',
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Envoi rapports hebdomadaires échoué:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/send-reengagement-emails
// Séquence réengagement post-inscription (quotidien 09h00)
// Email 0: relance confirmation J+1 | Email 1: J+1 post-confirm | Email 2: J+3 | Email 3: J+7
// ============================================================
export async function cronSendReengagementEmails(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Envoi des emails de réengagement...');
        const result = await sendReengagementEmails();

        const duration = Date.now() - startTime;
        log.debug(`[CRON API] Réengagement: ${result.total_sent} email(s) envoyé(s)`);
        return res.status(200).json({
            success: true,
            message: 'Emails de réengagement envoyés',
            ...result,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Erreur réengagement:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/pulse-marche
// Post quotidien Pulse du marché (lun–ven 17h00 UTC)
// ============================================================
export async function cronPulseMarche(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Pulse du marché — publication...');
        await runPulseMarche();
        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Pulse du marché publié',
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Erreur Pulse du marché:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// INTERNE: Verification des alertes de prix
// (logique extraite de scraping.job.ts)
// ============================================================
async function checkPriceAlerts() {
    try {
        const activeAlerts = await getActiveAlerts();

        if (activeAlerts.length === 0) return;

        let triggeredCount = 0;

        for (const alert of activeAlerts) {
            try {
                const stock = await prisma.stock.findUnique({
                    where: { symbol: alert.stock_ticker },
                });

                if (!stock) continue;

                const currentPrice = stock.current_price;

                if (shouldTriggerAlert(currentPrice, alert)) {
                    await markAlertAsTriggered(alert.id, currentPrice);

                    let notificationMethod: 'EMAIL' | 'IN_APP' | 'BOTH' = 'BOTH';
                    if (alert.notify_email && !alert.notify_in_app) {
                        notificationMethod = 'EMAIL';
                    } else if (!alert.notify_email && alert.notify_in_app) {
                        notificationMethod = 'IN_APP';
                    }

                    let emailSent = false;
                    if (alert.notify_email && alert.user) {
                        try {
                            await sendPriceAlertEmail({
                                email: alert.user.email,
                                name: alert.user.name,
                                stockTicker: alert.stock_ticker,
                                alertType: alert.alert_type as 'ABOVE' | 'BELOW',
                                targetPrice: alert.target_price,
                                currentPrice,
                            });
                            emailSent = true;
                        } catch (emailError) {
                            log.error(`[CRON] Erreur email alerte ${alert.id}:`, emailError);
                        }
                    }

                    await createPriceAlertNotification(
                        alert.id,
                        currentPrice,
                        notificationMethod,
                        emailSent
                    );

                    // Créer la notification inapp (cloche)
                    if (alert.notify_in_app) {
                        try {
                            await notifyPriceAlert(
                                alert.userId,
                                alert.stock_ticker,
                                stock.name || alert.stock_ticker,
                                currentPrice,
                                alert.target_price,
                                alert.alert_type as 'ABOVE' | 'BELOW'
                            );
                        } catch (notifError) {
                            log.error(`[CRON] Erreur notif inapp alerte ${alert.id}:`, notifError);
                        }
                    }

                    triggeredCount++;
                }
            } catch (alertError) {
                log.error(`[CRON] Erreur traitement alerte ${alert.id}:`, alertError);
            }
        }

        if (triggeredCount > 0) {
            log.debug(`[CRON] ${triggeredCount} alerte(s) declenchee(s)`);
        }
    } catch (error) {
        log.error('[CRON] Erreur verification alertes de prix:', error);
    }
}

// ============================================================
// POST /api/cron/check-watchlist-signals
// Vérification quotidienne des signaux watchlist (18h après clôture BRVM)
// ============================================================
export async function cronCheckWatchlistSignals(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Vérification des signaux watchlist...');
        const result = await checkWatchlistSignals();

        const duration = Date.now() - startTime;
        log.debug(`[CRON API] Signaux watchlist: ${result.notificationsSent} notifications envoyées sur ${result.usersProcessed} utilisateurs`);
        return res.status(200).json({
            success: true,
            message: 'Signaux watchlist vérifiés',
            ...result,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Erreur signaux watchlist:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/send-watchlist-summaries
// Résumés hebdomadaires watchlist IA (Lundi 08h00)
// ============================================================
export async function cronSendWatchlistSummaries(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        log.debug('[CRON API] Envoi des résumés watchlist hebdomadaires...');
        const result = await sendWeeklyWatchlistSummaries();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Résumés watchlist envoyés',
            ...result,
            duration_ms: duration,
        });
    } catch (error: any) {
        log.error('[CRON API] Erreur résumés watchlist:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}
