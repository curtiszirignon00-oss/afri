// Script pour envoyer un résumé de portefeuille à contact@africbourse.com avec nom personnalisé
import { sendPortfolioSummaryEmail } from '../services/email.service';
import prisma from '../config/prisma';

async function sendToContactCustom() {
  console.log('📊 Recherche du compte contact@africbourse.com\n');
  console.log('='.repeat(60));

  try {
    // Chercher l'utilisateur contact@africbourse.com
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

    if (!user) {
      console.log('❌ Utilisateur contact@africbourse.com non trouvé');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n✅ Utilisateur trouvé: ${user.email}`);
    console.log(`   → Prénom dans DB: ${user.name}`);
    console.log(`   → Nom dans DB: ${user.lastname}`);

    // Vérifier si l'utilisateur a un portfolio
    if (!user.portfolios || user.portfolios.length === 0) {
      console.log('\n❌ Aucun portfolio trouvé pour cet utilisateur');
      await prisma.$disconnect();
      return;
    }

    const portfolio = user.portfolios[0];
    const positions = portfolio.positions;

    console.log(`\n📊 Portfolio trouvé:`);
    console.log(`   → Liquidités: ${portfolio.cash_balance.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Positions: ${positions.length}`);

    if (positions.length === 0) {
      console.log('\n❌ Aucune position active dans le portfolio');
      await prisma.$disconnect();
      return;
    }

    // Calculer les statistiques de chaque position
    console.log('\n🔄 Calcul des statistiques...\n');

    const positionStats = await Promise.all(
      positions.map(async (position) => {
        const stock = await prisma.stock.findUnique({
          where: { symbol: position.stock_ticker },
          select: { current_price: true },
        });

        const currentPrice = stock?.current_price || 0;
        const value = position.quantity * currentPrice;
        const invested = position.quantity * position.average_buy_price;
        const gainLoss = value - invested;
        const gainLossPercent = invested > 0 ? (gainLoss / invested) * 100 : 0;

        return {
          ticker: position.stock_ticker,
          quantity: position.quantity,
          buyPrice: position.average_buy_price,
          currentPrice,
          value,
          invested,
          gainLoss,
          gainLossPercent,
        };
      })
    );

    // Calculer les totaux
    const totalInvested = positionStats.reduce((sum, pos) => sum + pos.invested, 0);
    const totalValue = positionStats.reduce((sum, pos) => sum + pos.value, 0);
    const totalGainLoss = totalValue - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    const portfolioTotalValue = totalValue + portfolio.cash_balance;

    // Trier par performance
    const sorted = [...positionStats].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
    const topPerformers = sorted.slice(0, 3).map(p => ({
      ticker: p.ticker,
      gainLossPercent: p.gainLossPercent,
      value: p.value,
    }));
    const topLosers = sorted.slice(-3).reverse().map(p => ({
      ticker: p.ticker,
      gainLossPercent: p.gainLossPercent,
      value: p.value,
    }));

    // Afficher les détails
    console.log('📊 Statistiques calculées:');
    console.log('='.repeat(60));
    console.log(`   → Nom: dfsf sde`);
    console.log(`   → Email: contact@africbourse.com`);
    console.log(`   → Valeur totale: ${portfolioTotalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Liquidités: ${portfolio.cash_balance.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Investi: ${totalInvested.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Valeur positions: ${totalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Gain/Perte: ${totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Performance: ${totalGainLossPercent >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%`);
    console.log(`   → Positions: ${positions.length}`);

    console.log('\n📈 Détail des positions:');
    positionStats.forEach((pos, index) => {
      console.log(`   ${index + 1}. ${pos.ticker}:`);
      console.log(`      • Quantité: ${pos.quantity}`);
      console.log(`      • Prix d'achat: ${pos.buyPrice.toLocaleString('fr-FR')} FCFA`);
      console.log(`      • Prix actuel: ${pos.currentPrice.toLocaleString('fr-FR')} FCFA`);
      console.log(`      • Valeur: ${pos.value.toLocaleString('fr-FR')} FCFA`);
      console.log(`      • Performance: ${pos.gainLossPercent >= 0 ? '+' : ''}${pos.gainLossPercent.toFixed(2)}%`);
    });

    if (topPerformers.length > 0) {
      console.log('\n🚀 Top Performers:');
      topPerformers.forEach((perf, index) => {
        console.log(`   ${index + 1}. ${perf.ticker}: ${perf.gainLossPercent >= 0 ? '+' : ''}${perf.gainLossPercent.toFixed(2)}% (Valeur: ${perf.value.toLocaleString('fr-FR')} FCFA)`);
      });
    }

    if (topLosers.length > 0) {
      console.log('\n📉 Top Losers:');
      topLosers.forEach((perf, index) => {
        console.log(`   ${index + 1}. ${perf.ticker}: ${perf.gainLossPercent.toFixed(2)}% (Valeur: ${perf.value.toLocaleString('fr-FR')} FCFA)`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📤 Envoi de l\'email à contact@africbourse.com...\n');

    // Calculer la période
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

    // Envoyer l'email avec le nom personnalisé
    await sendPortfolioSummaryEmail({
      email: 'contact@africbourse.com',
      name: 'dfsf sde',
      portfolioStats: {
        totalValue: portfolioTotalValue,
        cashBalance: portfolio.cash_balance,
        investedValue: totalInvested,
        totalGainLoss,
        totalGainLossPercent,
        topPerformers,
        topLosers,
        positionsCount: positions.length,
        period,
      },
    });

    console.log('✅ Email envoyé avec succès!');
    console.log('\n📬 Détails de l\'envoi:');
    console.log(`   → Destinataire: contact@africbourse.com`);
    console.log(`   → Nom affiché: dfsf sde`);
    console.log(`   → Sujet: 📊 Résumé de Votre Portefeuille - AfriBourse`);
    console.log(`   → Valeur totale: ${portfolioTotalValue.toLocaleString('fr-FR')} FCFA`);
    console.log(`   → Performance: ${totalGainLossPercent >= 0 ? '+' : ''}${totalGainLossPercent.toFixed(2)}%`);
    console.log('\n✉️  Vérifiez la boîte de réception de contact@africbourse.com\n');

  } catch (error: any) {
    console.error('\n❌ Erreur:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter
sendToContactCustom()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
