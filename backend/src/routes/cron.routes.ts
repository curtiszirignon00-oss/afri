import { Router } from 'express';
import { verifyCronAuth } from '../middlewares/cron.middleware';
import {
    cronScrapeStocks,
    cronSaveDailyHistory,
    cronVerifyStreaks,
    cronCalculateRankings,
    cronResetWeeklyChallenges,
    cronCleanup,
    cronBackup,
    cronSendPortfolioSummaries,
    cronSendLearningSummaries,
} from '../controllers/cron.controller';

const router = Router();

// Toutes les routes CRON necessitent une authentification
router.use(verifyCronAuth);

// Horaire: Scraping des cotations + alertes de prix
router.post('/scrape-stocks', cronScrapeStocks);

// Quotidien 18h00: Sauvegarde historique du jour
router.post('/save-daily-history', cronSaveDailyHistory);

// Quotidien 01h00: Verification des streaks
router.post('/verify-streaks', cronVerifyStreaks);

// Quotidien 02h00: Calcul des classements
router.post('/calculate-rankings', cronCalculateRankings);

// Lundi 00h00: Generation des defis hebdomadaires
router.post('/reset-weekly-challenges', cronResetWeeklyChallenges);

// 1er du mois 03h00: Nettoyage des anciennes donnees
router.post('/cleanup', cronCleanup);

// Dimanche 23h00: Backup de la base de donnees
router.post('/backup', cronBackup);

// Vendredi 18h00 (bi-hebdomadaire): Resumes de portefeuille
router.post('/send-portfolio-summaries', cronSendPortfolioSummaries);

// Samedi 10h00 UTC: Resumes d'apprentissage
router.post('/send-learning-summaries', cronSendLearningSummaries);

export default router;
