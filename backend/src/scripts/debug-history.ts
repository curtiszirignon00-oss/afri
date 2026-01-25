// Debug script pour tester l'historique du portfolio
// Usage: npx ts-node src/scripts/debug-history.ts

import prisma from '../config/prisma';
import { findPortfolioByUserId, getPortfolioHistory } from '../services/portfolio.service.prisma';

async function debugHistory() {
    console.log('🔍 Debug de l\'historique des portfolios...\n');

    try {
        // Trouver un utilisateur avec les deux wallets
        const concoursPortfolios = await prisma.portfolio.findMany({
            where: { wallet_type: 'CONCOURS' },
            select: { userId: true, id: true }
        });

        if (concoursPortfolios.length === 0) {
            console.log('Aucun portfolio CONCOURS trouvé');
            return;
        }

        const testUserId = concoursPortfolios[0].userId;
        console.log(`Testing userId: ${testUserId}\n`);

        // 1. Vérifier les portfolios de l'utilisateur
        const allPortfolios = await prisma.portfolio.findMany({
            where: { userId: testUserId },
            select: {
                id: true,
                wallet_type: true,
                cash_balance: true,
                created_at: true
            },
            orderBy: { created_at: 'asc' }
        });

        console.log('Portfolios de l\'utilisateur:');
        for (const p of allPortfolios) {
            const txCount = await prisma.transaction.count({ where: { portfolioId: p.id } });
            console.log(`  - ${p.wallet_type}: ID=${p.id}, Balance=${p.cash_balance}, Transactions=${txCount}, Created=${p.created_at?.toISOString()}`);
        }

        // 2. Tester findPortfolioByUserId pour SANDBOX
        console.log('\n--- Test findPortfolioByUserId SANDBOX ---');
        const sandboxPortfolio = await findPortfolioByUserId(testUserId, 'SANDBOX');
        if (sandboxPortfolio) {
            console.log(`  Portfolio trouvé: ID=${sandboxPortfolio.id}, wallet_type=${sandboxPortfolio.wallet_type}`);
        } else {
            console.log('  NON TROUVÉ');
        }

        // 3. Tester findPortfolioByUserId pour CONCOURS
        console.log('\n--- Test findPortfolioByUserId CONCOURS ---');
        const concoursPortfolio = await findPortfolioByUserId(testUserId, 'CONCOURS');
        if (concoursPortfolio) {
            console.log(`  Portfolio trouvé: ID=${concoursPortfolio.id}, wallet_type=${concoursPortfolio.wallet_type}`);
        } else {
            console.log('  NON TROUVÉ');
        }

        // 4. Tester getPortfolioHistory pour SANDBOX
        console.log('\n--- Test getPortfolioHistory SANDBOX ---');
        const sandboxHistory = await getPortfolioHistory(testUserId, 'SANDBOX');
        console.log(`  ${sandboxHistory.length} points d'historique`);
        if (sandboxHistory.length > 0) {
            console.log(`  Premier: ${sandboxHistory[0].date} = ${sandboxHistory[0].value}`);
            console.log(`  Dernier: ${sandboxHistory[sandboxHistory.length - 1].date} = ${sandboxHistory[sandboxHistory.length - 1].value}`);
        }

        // 5. Tester getPortfolioHistory pour CONCOURS
        console.log('\n--- Test getPortfolioHistory CONCOURS ---');
        const concoursHistory = await getPortfolioHistory(testUserId, 'CONCOURS');
        console.log(`  ${concoursHistory.length} points d'historique`);
        if (concoursHistory.length > 0) {
            console.log(`  Premier: ${concoursHistory[0].date} = ${concoursHistory[0].value}`);
            console.log(`  Dernier: ${concoursHistory[concoursHistory.length - 1].date} = ${concoursHistory[concoursHistory.length - 1].value}`);
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugHistory();
