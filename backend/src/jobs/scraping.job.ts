import cron from 'node-cron';
import { scrapeStock, scrapeIndex } from '../services/scraping.service';
import { saveIndices } from '../services/index.service.prisma';
import { saveStocks } from '../services/stock.service.prisma';
import { saveCurrentDayHistory } from '../services/stockHistory.service'; // 🆕 Service pour historique
import {
  getActiveAlerts,
  shouldTriggerAlert,
  markAlertAsTriggered,
  createPriceAlertNotification
} from '../services/price-alert.service.prisma';
import { sendPriceAlertEmail } from '../services/email.service';
import prisma from '../config/prisma';

// Tâche cron pour exécuter le scraping toutes les 2 heures

cron.schedule('0 */2 * * *', async () => { // Exécute toutes les 2 heures
    console.log('🔄 Tâche de scraping exécutée toutes les 2 heures');

    try {
        const stocks = await scrapeStock();
        const indices = await scrapeIndex();

        // Sauvegarder les données actuelles
        await saveStocks(stocks);
        await saveIndices(indices);

        // 🆕 Sauvegarder aussi dans l'historique (une fois par jour seulement)
        const currentHour = new Date().getHours();
        // Sauvegarder l'historique seulement à 18h (après clôture BRVM)
        if (currentHour === 18) {
            console.log('📊 Sauvegarde de l\'historique du jour...');
            await saveCurrentDayHistory();
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