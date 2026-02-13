import { Request, Response } from 'express';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveStocks } from '../services/stock.service.prisma';
import { saveIndices } from '../services/index.service.prisma';
import { saveCurrentDayHistory } from '../services/stockHistory.service';
import {
    getActiveAlerts,
    shouldTriggerAlert,
    markAlertAsTriggered,
    createPriceAlertNotification
} from '../services/price-alert.service.prisma';
import { sendPriceAlertEmail } from '../services/email.service';
import { sendBiweeklyPortfolioSummaries } from '../services/portfolio-summary.service';
import { sendWeeklyLearningSummaries } from '../services/learning-summary.service';
import { runFullBackup } from '../services/backup.service';
import {
    runStreakCheck,
    runRankingsCalculation,
    runWeeklyChallengesGeneration,
    runCleanup
} from '../jobs/gamification.job';
import prisma from '../config/prisma';
import { cacheInvalidatePattern } from '../services/cache.service';

// ============================================================
// POST /api/cron/scrape-stocks
// Scraping horaire des cotations + alertes de prix
// ============================================================
export async function cronScrapeStocks(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        console.log('[CRON API] Scraping des cotations...');

        const stocks = await scrapeStock();
        const indices = await scrapeIndex();

        await saveStocks(stocks);
        await saveIndices(indices);

        // Verifier les alertes de prix
        await checkPriceAlerts();

        const duration = Date.now() - startTime;
        console.log(`[CRON API] Scraping termine en ${duration}ms`);

        return res.status(200).json({
            success: true,
            message: 'Scraping termine',
            stocks_processed: stocks.length,
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Scraping echoue:', error.message);
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
        console.log('[CRON API] Sauvegarde historique du jour...');
        await saveCurrentDayHistory();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Historique du jour sauvegarde',
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Sauvegarde historique echouee:', error.message);
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
        console.log('[CRON API] Verification des streaks...');
        const result = await runStreakCheck();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Streaks verifies',
            result,
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Verification streaks echouee:', error.message);
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
        console.log('[CRON API] Calcul des classements...');
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
        console.error('[CRON API] Calcul classements echoue:', error.message);
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
        console.log('[CRON API] Generation des defis hebdomadaires...');
        const result = await runWeeklyChallengesGeneration();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Defis hebdomadaires crees',
            result,
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Generation defis echouee:', error.message);
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
        console.log('[CRON API] Nettoyage des donnees anciennes...');
        const result = await runCleanup();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Nettoyage termine',
            result,
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Nettoyage echoue:', error.message);
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
        console.log('[CRON API] Backup en cours...');
        const backupPath = await runFullBackup();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Backup termine',
            path: backupPath,
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Backup echoue:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/send-portfolio-summaries
// Resumes de portefeuille bi-hebdomadaires (Vendredi 18h00)
// ============================================================
export async function cronSendPortfolioSummaries(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        console.log('[CRON API] Envoi des resumes de portefeuille...');
        await sendBiweeklyPortfolioSummaries();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Resumes de portefeuille envoyes',
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Envoi resumes echoue:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

// ============================================================
// POST /api/cron/send-learning-summaries
// Resumes d'apprentissage hebdomadaires (Samedi 10h00 UTC)
// ============================================================
export async function cronSendLearningSummaries(req: Request, res: Response) {
    const startTime = Date.now();
    try {
        console.log('[CRON API] Envoi des resumes d\'apprentissage...');
        await sendWeeklyLearningSummaries();

        const duration = Date.now() - startTime;
        return res.status(200).json({
            success: true,
            message: 'Resumes d\'apprentissage envoyes',
            duration_ms: duration,
        });
    } catch (error: any) {
        console.error('[CRON API] Envoi resumes apprentissage echoue:', error.message);
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
                            console.error(`[CRON] Erreur email alerte ${alert.id}:`, emailError);
                        }
                    }

                    await createPriceAlertNotification(
                        alert.id,
                        currentPrice,
                        notificationMethod,
                        emailSent
                    );

                    triggeredCount++;
                }
            } catch (alertError) {
                console.error(`[CRON] Erreur traitement alerte ${alert.id}:`, alertError);
            }
        }

        if (triggeredCount > 0) {
            console.log(`[CRON] ${triggeredCount} alerte(s) declenchee(s)`);
        }
    } catch (error) {
        console.error('[CRON] Erreur verification alertes de prix:', error);
    }
}
