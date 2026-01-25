/// <reference types="node" />
// Script pour tester l'email avec évolution bi-hebdomadaire
import { sendPortfolioSummaryEmail } from '../services/email.service';
import prisma from '../config/prisma';

async function testEvolutionEmail() {
  console.log('📊 Test de l\'email avec évolution bi-hebdomadaire\n');
  console.log('='.repeat(60));

  try {
    // Chercher le portfolio de contact@africbourse.com
    const user = await prisma.user.findUnique({
      where: { email: 'contact@africbourse.com' },
      select: {
        id: true,
        email: true,
        name: true,
        lastname: true,
        portfolios: {
          where: { is_virtual: true },
          select: {
            id: true,
            cash_balance: true,
            positions: {
              where: { quantity: { gt: 0 } },
              select: {
                stock_ticker: true,
                quantity: true,
                average_buy_price: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!user || !user.portfolios || user.portfolios.length === 0) {
      console.log('❌ Utilisateur ou portfolio non trouvé');
      await prisma.$disconnect();
      return;
    }

    const portfolio = user.portfolios[0];

    // Calculer la valeur actuelle
    let totalValue = portfolio.cash_balance;
    let invested = 0;
    let currentPositionsValue = 0;

    for (const position of portfolio.positions) {
      const stock = await prisma.stock.findUnique({
        where: { symbol: position.stock_ticker },
        select: { current_price: true },
      });

      const currentPrice = stock?.current_price || 0;
      const posValue = position.quantity * currentPrice;
      const posInvested = position.quantity * position.average_buy_price;

      totalValue += posValue;
      invested += posInvested;
      currentPositionsValue += posValue;
    }

    const gainLoss = currentPositionsValue - invested;
    const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;

    console.log('\n📊 Valeur actuelle du portefeuille:');
    console.log(`   → Valeur totale: ${totalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Liquidités: ${portfolio.cash_balance.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Investi: ${invested.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Performance: ${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%`);

    // Créer un snapshot fictif d'il y a 2 semaines (valeur légèrement différente pour montrer l'évolution)
    const previousValue = totalValue * 0.98; // 2% de moins qu'avant
    const evolutionChange = totalValue - previousValue;
    const evolutionPercent = (evolutionChange / previousValue) * 100;

    console.log('\n📈 Snapshot fictif créé (il y a 2 semaines):');
    console.log(`   → Valeur précédente: ${previousValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Évolution: ${evolutionChange >= 0 ? '+' : ''}${evolutionChange.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Évolution %: ${evolutionPercent >= 0 ? '+' : ''}${evolutionPercent.toFixed(2)}%`);

    // Créer réellement le snapshot dans la base
    await prisma.portfolioSnapshot.create({
      data: {
        portfolioId: portfolio.id,
        total_value: previousValue,
        cash_balance: portfolio.cash_balance,
        invested_value: invested * 0.98,
        positions_value: currentPositionsValue * 0.98,
        gain_loss: gainLoss * 0.98,
        gain_loss_percent: gainLossPercent,
        positions_count: portfolio.positions.length,
        snapshot_type: 'bi_weekly_summary',
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Il y a 2 semaines
      },
    });

    console.log('\n✅ Snapshot créé dans la base de données');

    // Créer les données pour l'email
    const topPerformers = [
      { ticker: 'SIVC', gainLossPercent: -0.59, value: 337000 },
      { ticker: 'SDCC', gainLossPercent: 0.00, value: 580000 },
    ];

    const topLosers = [
      { ticker: 'SIVC', gainLossPercent: -0.59, value: 337000 },
      { ticker: 'SDCC', gainLossPercent: 0.00, value: 580000 },
    ];

    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const formatDate = (date: Date): string => {
      const day = date.getDate();
      const month = date.toLocaleDateString('fr-FR', { month: 'long' });
      const year = date.getFullYear();
      return day === 1 ? `1er ${month} ${year}` : `${day} ${month} ${year}`;
    };

    const period = `du ${formatDate(twoWeeksAgo)} au ${formatDate(now)}`;

    console.log('\n📤 Envoi de l\'email à contact@africbourse.com...\n');

    await sendPortfolioSummaryEmail({
      email: 'contact@africbourse.com',
      name: `${user.name} ${user.lastname || ''}`.trim(),
      portfolioStats: {
        totalValue,
        cashBalance: portfolio.cash_balance,
        investedValue: invested,
        totalGainLoss: gainLoss,
        totalGainLossPercent: gainLossPercent,
        topPerformers,
        topLosers,
        positionsCount: portfolio.positions.length,
        period,
        biweeklyEvolution: {
          previousValue,
          currentValue: totalValue,
          change: evolutionChange,
          changePercent: evolutionPercent,
        },
      },
    });

    console.log('✅ Email envoyé avec succès!');
    console.log('\n📬 Détails de l\'envoi:');
    console.log(`   → Destinataire: contact@africbourse.com`);
    console.log(`   → Nom: ${user.name} ${user.lastname || ''}`);
    console.log(`   → Valeur actuelle: ${totalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Évolution: ${evolutionPercent >= 0 ? '+' : ''}${evolutionPercent.toFixed(2)}%`);
    console.log('\n✉️  Vérifiez la boîte de réception pour voir la nouvelle section d\'évolution!\n');

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testEvolutionEmail()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
