// Script de test pour débugger le problème de portfolio
// Usage: npx ts-node src/scripts/test-portfolio-fetch.ts

import prisma from '../config/prisma';
import { findPortfolioByUserId } from '../services/portfolio.service.prisma';

async function testPortfolioFetch() {
    console.log('🔍 Test de récupération des portfolios...\n');

    try {
        // 1. Lister quelques portfolios avec leurs détails bruts
        const allPortfolios = await prisma.portfolio.findMany({
            select: {
                id: true,
                userId: true,
                wallet_type: true,
                cash_balance: true,
                initial_balance: true,
                positions: {
                    select: { stock_ticker: true, quantity: true }
                }
            },
            take: 5
        });

        console.log(`📊 Premiers portfolios dans la base:\n`);

        for (const p of allPortfolios) {
            console.log(`ID: ${p.id}`);
            console.log(`  userId: ${p.userId}`);
            console.log(`  wallet_type: "${p.wallet_type}" (type JS: ${typeof p.wallet_type})`);
            console.log(`  Balance: ${p.cash_balance} / ${p.initial_balance}`);
            console.log(`  Positions: ${p.positions.length}`);
            console.log('');
        }

        // 2. Tester la fonction findPortfolioByUserId avec un userId existant
        if (allPortfolios.length > 0) {
            const testUserId = allPortfolios[0].userId;
            console.log(`\n=== Test de findPortfolioByUserId pour userId: ${testUserId} ===\n`);

            // Test SANDBOX (default)
            console.log('Test 1: findPortfolioByUserId(userId) - SANDBOX par défaut');
            const portfolioDefault = await findPortfolioByUserId(testUserId);
            if (portfolioDefault) {
                console.log(`  ✅ TROUVÉ: ID=${portfolioDefault.id}, wallet_type=${portfolioDefault.wallet_type}`);
                console.log(`     Balance: ${portfolioDefault.cash_balance} / ${portfolioDefault.initial_balance}`);
                console.log(`     Positions: ${(portfolioDefault as any).positions?.length || 0}`);
            } else {
                console.log(`  ❌ NON TROUVÉ`);
            }

            // Test SANDBOX explicite
            console.log('\nTest 2: findPortfolioByUserId(userId, "SANDBOX")');
            const portfolioSandbox = await findPortfolioByUserId(testUserId, 'SANDBOX');
            if (portfolioSandbox) {
                console.log(`  ✅ TROUVÉ: ID=${portfolioSandbox.id}, wallet_type=${portfolioSandbox.wallet_type}`);
                console.log(`     Balance: ${portfolioSandbox.cash_balance} / ${portfolioSandbox.initial_balance}`);
            } else {
                console.log(`  ❌ NON TROUVÉ`);
            }

            // Test CONCOURS
            console.log('\nTest 3: findPortfolioByUserId(userId, "CONCOURS")');
            const portfolioConcours = await findPortfolioByUserId(testUserId, 'CONCOURS');
            if (portfolioConcours) {
                console.log(`  ✅ TROUVÉ: ID=${portfolioConcours.id}, wallet_type=${portfolioConcours.wallet_type}`);
                console.log(`     Balance: ${portfolioConcours.cash_balance} / ${portfolioConcours.initial_balance}`);
            } else {
                console.log(`  ⚠️ NON TROUVÉ (normal si pas de wallet CONCOURS)`);
            }
        }

        // 3. Compter les portfolios par wallet_type (en JS)
        console.log('\n=== Statistiques des portfolios ===\n');
        const allPortfoliosForStats = await prisma.portfolio.findMany({
            select: { wallet_type: true }
        });

        const stats = {
            total: allPortfoliosForStats.length,
            sandbox: allPortfoliosForStats.filter(p => p.wallet_type === 'SANDBOX').length,
            concours: allPortfoliosForStats.filter(p => p.wallet_type === 'CONCOURS').length,
            other: allPortfoliosForStats.filter(p => p.wallet_type !== 'SANDBOX' && p.wallet_type !== 'CONCOURS').length
        };

        console.log(`Total: ${stats.total}`);
        console.log(`SANDBOX: ${stats.sandbox}`);
        console.log(`CONCOURS: ${stats.concours}`);
        console.log(`Autre/null: ${stats.other}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testPortfolioFetch();
