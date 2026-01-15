// backend/scripts/backfillStockHistory.ts
// Script pour remplir l'historique avec les données actuelles
// Utile pour avoir un graphique même sans historique réel

/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Remplit l'historique avec des variations simulées autour du prix actuel
 * Pour avoir un graphique fonctionnel en attendant les vraies données
 */
async function backfillHistory(days: number = 365) {
  try {
    console.log(`📊 Démarrage du backfill de l'historique (${days} jours)...`);

    // Récupérer toutes les actions actives
    const stocks = await prisma.stock.findMany({
      where: { is_active: true }
    });

    console.log(`\n📈 ${stocks.length} actions trouvées\n`);

    let totalCreated = 0;

    for (const stock of stocks) {
      console.log(`\n⏳ Traitement de ${stock.symbol} (${stock.company_name})...`);

      if (!stock.current_price || stock.current_price === 0) {
        console.log(`  ⚠️  Pas de prix actuel, ignoré`);
        continue;
      }

      const basePrice = stock.current_price;
      const today = new Date();
      let createdForStock = 0;

      // Générer l'historique jour par jour en remontant
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        // Vérifier si l'historique existe déjà
        const existing = await prisma.stockHistory.findUnique({
          where: {
            stock_ticker_date: {
              stock_ticker: stock.symbol,
              date: date
            }
          }
        });

        if (existing) {
          continue; // Skip si déjà existant
        }

        // Simuler des variations aléatoires légères autour du prix actuel
        // Plus on remonte dans le temps, plus la variation peut être grande
        const daysAgo = days - i;
        const maxVariation = 0.02 * (daysAgo / days); // Max 2% de variation sur 1 an

        const randomVariation = (Math.random() - 0.5) * maxVariation;
        const dayBasePrice = basePrice * (1 + randomVariation);

        // Simuler OHLC pour la journée
        const openVariation = (Math.random() - 0.5) * 0.01; // +/- 1%
        const open = dayBasePrice * (1 + openVariation);

        const closeVariation = (Math.random() - 0.5) * 0.01;
        const close = dayBasePrice * (1 + closeVariation);

        const high = Math.max(open, close) * (1 + Math.random() * 0.005); // +0.5% max
        const low = Math.min(open, close) * (1 - Math.random() * 0.005); // -0.5% max

        // Volume aléatoire
        const avgVolume = stock.volume || 10000;
        const volume = Math.floor(avgVolume * (0.5 + Math.random()));

        // Créer l'entrée d'historique
        await prisma.stockHistory.create({
          data: {
            stockId: stock.id,
            stock_ticker: stock.symbol,
            date: date,
            open: Math.round(open),
            high: Math.round(high),
            low: Math.round(low),
            close: Math.round(close),
            volume: volume
          }
        });

        createdForStock++;
      }

      console.log(`  ✅ ${createdForStock} jours créés pour ${stock.symbol}`);
      totalCreated += createdForStock;
    }

    console.log(`\n🎉 Backfill terminé !`);
    console.log(`  📊 Total: ${totalCreated} entrées créées`);
    console.log(`  📅 Période: ${days} jours`);
    console.log(`  📈 Actions: ${stocks.length}`);

  } catch (error) {
    console.error('❌ Erreur lors du backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
const daysToBackfill = parseInt(process.argv[2]) || 365;

console.log('🚀 Script de backfill de l\'historique boursier\n');
console.log(`Configuration:`);
console.log(`  - Jours à créer: ${daysToBackfill}`);
console.log(`  - Base: Prix actuel de chaque action`);
console.log(`  - Méthode: Variations aléatoires légères\n`);

backfillHistory(daysToBackfill)
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });
