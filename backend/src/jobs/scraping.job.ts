import cron from 'node-cron';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveIndices, saveCurrentDayIndexHistory } from '../services/index.service.prisma';
import { saveStocks } from '../services/stock.service.prisma';
import { saveCurrentDayHistory } from '../services/stockHistory.service';
import {
    getActiveAlerts,
    shouldTriggerAlert,
    markAlertAsTriggered,
    createPriceAlertNotification
} from '../services/price-alert.service.prisma';
import { sendPriceAlertEmail } from '../services/email.service';
import { notifyPriceAlert } from '../services/notification.service';
import { sendBiweeklyPortfolioSummaries } from '../services/portfolio-summary.service';
import { sendWeeklyLearningSummaries } from '../services/learning-summary.service';
import { updateROIRankStreaks } from '../services/gamification-leaderboard.service';
import prisma from '../config/prisma';

// Tâche cron pour exécuter le scraping toutes les heures

cron.schedule('*/15 * * * *', async () => { // Exécute toutes les 15 minutes
    console.log('🔄 Tâche de scraping exécutée toutes les 15 minutes');

    try {
        const stocks = await scrapeStock();
        const indices = await scrapeIndex();

        // Sauvegarder les données actuelles
        await saveStocks(stocks);
        await saveIndices(indices);

        // Sauvegarder dans l'historique (une fois par jour seulement, à 18h après clôture BRVM)
        const currentHour = new Date().getHours();
        if (currentHour === 18) {
            console.log('📊 Sauvegarde de l\'historique du jour (actions + indices)...');
            await saveCurrentDayHistory();
            await saveCurrentDayIndexHistory();
            // Mettre à jour les streaks de position ROI sandbox (1x/jour après clôture)
            await updateROIRankStreaks();
        }

        console.log('✅ Scraping et sauvegarde terminés avec succès');

        // 🔔 Vérifier les alertes de prix après la mise à jour des données
        await checkPriceAlerts();

    } catch (error) {
        console.error('❌ Erreur lors du scraping:', error);
    }
});

// Fonction pour vérifier et déclencher les alertes de prix
async function checkPriceAlerts() {
    try {
        console.log('🔔 Vérification des alertes de prix...');

        const activeAlerts = await getActiveAlerts();

        if (activeAlerts.length === 0) {
            console.log('ℹ️  Aucune alerte active à vérifier');
            return;
        }

        console.log(`📊 ${activeAlerts.length} alerte(s) active(s) à vérifier`);

        let triggeredCount = 0;

        for (const alert of activeAlerts) {
            try {
                // Récupérer le prix actuel de l'action
                const stock = await prisma.stock.findUnique({
                    where: { symbol: alert.stock_ticker },
                });

                if (!stock) {
                    console.warn(`⚠️  Action ${alert.stock_ticker} non trouvée pour l'alerte ${alert.id}`);
                    continue;
                }

                const currentPrice = stock.current_price;

                // Vérifier si l'alerte doit être déclenchée
                if (shouldTriggerAlert(currentPrice, alert)) {
                    console.log(`🎯 Alerte déclenchée pour ${alert.stock_ticker} (Prix: ${currentPrice})`);

                    // Marquer l'alerte comme déclenchée
                    await markAlertAsTriggered(alert.id, currentPrice);

                    // Déterminer la méthode de notification
                    let notificationMethod: 'EMAIL' | 'IN_APP' | 'BOTH' = 'BOTH';
                    if (alert.notify_email && !alert.notify_in_app) {
                        notificationMethod = 'EMAIL';
                    } else if (!alert.notify_email && alert.notify_in_app) {
                        notificationMethod = 'IN_APP';
                    }

                    // Envoyer l'email si nécessaire
                    let emailSent = false;
                    if (alert.notify_email && alert.user) {
                        try {
                            await sendPriceAlertEmail({
                                email: alert.user.email,
                                name: alert.user.name,
                                stockTicker: alert.stock_ticker,
                                alertType: alert.alert_type as 'ABOVE' | 'BELOW',
                                targetPrice: alert.target_price,
                                currentPrice: currentPrice,
                            });
                            emailSent = true;
                            console.log(`✉️  Email envoyé à ${alert.user.email} pour ${alert.stock_ticker}`);
                        } catch (emailError) {
                            console.error(`❌ Erreur d'envoi d'email pour l'alerte ${alert.id}:`, emailError);
                        }
                    }

                    // Créer un enregistrement de notification
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
                            console.error(`❌ Erreur notif inapp alerte ${alert.id}:`, notifError);
                        }
                    }

                    triggeredCount++;
                } else {
                    // Log optionnel pour le débogage
                    // console.log(`✓ Alerte ${alert.stock_ticker} non déclenchée (Prix: ${currentPrice}, Cible: ${alert.target_price}, Type: ${alert.alert_type})`);
                }
            } catch (alertError) {
                console.error(`❌ Erreur lors du traitement de l'alerte ${alert.id}:`, alertError);
            }
        }

        console.log(`✅ Vérification des alertes terminée: ${triggeredCount} alerte(s) déclenchée(s)`);
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des alertes de prix:', error);
    }
}

// Tâche cron pour envoyer les résumés de portefeuille bi-hebdomadaires
// S'exécute tous les vendredis à 18h00, toutes les 2 semaines
// Commence le vendredi 16 janvier 2026
let lastPortfolioSummaryDate: Date | null = null;

cron.schedule('0 18 * * 5', async () => { // Tous les vendredis à 18h
    try {
        const now = new Date();

        // Date de démarrage : vendredi 16 janvier 2026
        const startDate = new Date('2026-01-16T18:00:00');

        // Vérifier si on est après la date de démarrage
        if (now < startDate) {
            console.log(`ℹ️  Envoi des résumés démarrera le ${startDate.toLocaleDateString('fr-FR')} à 18h`);
            return;
        }

        // Calculer le nombre de jours depuis le démarrage
        const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksSinceStart = Math.floor(daysSinceStart / 7);

        // Envoyer seulement toutes les 2 semaines (semaines paires depuis le démarrage)
        const shouldSend = weeksSinceStart % 2 === 0;

        // Vérifier qu'on n'a pas déjà envoyé aujourd'hui
        const alreadySentToday = lastPortfolioSummaryDate &&
            lastPortfolioSummaryDate.toDateString() === now.toDateString();

        if (shouldSend && !alreadySentToday) {
            console.log('📊 Envoi des résumés bi-hebdomadaires de portefeuille...');
            console.log(`   → Date: ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`);
            console.log(`   → Semaine ${weeksSinceStart + 1} depuis le démarrage`);

            await sendBiweeklyPortfolioSummaries();
            lastPortfolioSummaryDate = now;

            console.log('✅ Résumés de portefeuille envoyés avec succès');
            console.log(`   → Prochain envoi dans 2 semaines`);
        } else if (!shouldSend) {
            console.log('ℹ️  Pas d\'envoi de résumé cette semaine (cycle bi-hebdomadaire)');
            console.log(`   → Prochain envoi le vendredi suivant`);
        } else if (alreadySentToday) {
            console.log('ℹ️  Résumés déjà envoyés aujourd\'hui');
        }
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi des résumés de portefeuille:', error);
    }
});

// Tâche cron pour envoyer les résumés d'apprentissage hebdomadaires
// S'exécute tous les samedis à 10h00 UTC
cron.schedule('0 10 * * 6', async () => { // Tous les samedis à 10h UTC
    try {
        const now = new Date();
        console.log('📚 Envoi des résumés hebdomadaires d\'apprentissage...');
        console.log(`   → Date: ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')} (UTC: ${now.toUTCString()})`);

        await sendWeeklyLearningSummaries();

        console.log('✅ Résumés d\'apprentissage envoyés avec succès');
        console.log(`   → Prochain envoi: samedi prochain à 10h UTC`);
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi des résumés d\'apprentissage:', error);
    }
});