// Debug script pour les utilisateurs avec 2 wallets (SANDBOX + CONCOURS)
// Usage: npx ts-node src/scripts/debug-dual-wallet.ts

import prisma from '../config/prisma';
import { findPortfolioByUserId } from '../services/portfolio.service.prisma';

async function debugDualWallet() {
    console.log('🔍 Recherche des utilisateurs avec wallet CONCOURS...\n');

    try {
        // Trouver tous les portfolios CONCOURS
        const concoursPortfolios = await prisma.portfolio.findMany({
            where: { wallet_type: 'CONCOURS' },
            select: {
                id: true,
                userId: true,
                wallet_type: true,
                cash_balance: true,
                initial_balance: true,
            }
        });

        console.log(`📊 Portfolios CONCOURS trouvés: ${concoursPortfolios.length}\n`);

        for (const concours of concoursPortfolios) {
            console.log(`\n=== Utilisateur: ${concours.userId} ===`);

            // Récupérer TOUS les portfolios de cet utilisateur
            const allUserPortfolios = await prisma.portfolio.findMany({
                where: { userId: concours.userId },
                select: {
                    id: true,
                    wallet_type: true,
                    cash_balance: true,
                    initial_balance: true,
                    positions: {
                        select: { stock_ticker: true, quantity: true }
                    }
                }
            });

            console.log(`\nPortfolios dans la base (${allUserPortfolios.length}):`);
            for (const p of allUserPortfolios) {
                console.log(`  - ID: ${p.id}`);
                console.log(`    wallet_type: "${p.wallet_type}"`);
                console.log(`    Balance: ${p.cash_balance} / ${p.initial_balance}`);
                console.log(`    Positions: ${p.positions.length}`);
            }

            // Tester findPortfolioByUserId pour SANDBOX
            console.log('\n>>> Test findPortfolioByUserId(userId, "SANDBOX"):');
            const sandboxResult = await findPortfolioByUserId(concours.userId, 'SANDBOX');
            if (sandboxResult) {
                console.log(`    ✅ TROUVÉ: ID=${sandboxResult.id}, wallet_type=${sandboxResult.wallet_type}`);
                console.log(`    Balance: ${sandboxResult.cash_balance} / ${sandboxResult.initial_balance}`);
            } else {
                console.log(`    ❌ NON TROUVÉ - PROBLÈME!`);
            }

            // Tester findPortfolioByUserId pour CONCOURS
            console.log('\n>>> Test findPortfolioByUserId(userId, "CONCOURS"):');
            const concoursResult = await findPortfolioByUserId(concours.userId, 'CONCOURS');
            if (concoursResult) {
                console.log(`    ✅ TROUVÉ: ID=${concoursResult.id}, wallet_type=${concoursResult.wallet_type}`);
                console.log(`    Balance: ${concoursResult.cash_balance} / ${concoursResult.initial_balance}`);
            } else {
                console.log(`    ❌ NON TROUVÉ`);
            }

            console.log('\n' + '='.repeat(50));
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugDualWallet();
