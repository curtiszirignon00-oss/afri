// Script de vérification des portfolios
// Usage: npx ts-node src/scripts/check-portfolios.ts

import prisma from '../config/prisma';

async function checkPortfolios() {
    console.log('🔍 Vérification des portfolios...\n');

    try {
        // Compter tous les portfolios
        const totalCount = await prisma.portfolio.count();
        console.log(`📊 Total portfolios: ${totalCount}`);

        // Compter par wallet_type
        const sandboxCount = await prisma.portfolio.count({
            where: { wallet_type: 'SANDBOX' }
        });
        const concoursCount = await prisma.portfolio.count({
            where: { wallet_type: 'CONCOURS' }
        });

        console.log(`   - SANDBOX: ${sandboxCount}`);
        console.log(`   - CONCOURS: ${concoursCount}`);

        // Afficher quelques portfolios avec leurs détails
        const samplePortfolios = await prisma.portfolio.findMany({
            take: 10,
            include: {
                user: {
                    select: { email: true, name: true }
                },
                positions: {
                    select: { stock_ticker: true, quantity: true }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        console.log('\n📋 Derniers portfolios:');
        for (const p of samplePortfolios) {
            console.log(`\n  ID: ${p.id}`);
            console.log(`  User: ${p.user?.email || 'N/A'}`);
            console.log(`  Type: ${p.wallet_type}`);
            console.log(`  Balance: ${p.cash_balance.toLocaleString()} / ${p.initial_balance.toLocaleString()} FCFA`);
            console.log(`  Positions: ${p.positions.length}`);
            if (p.positions.length > 0) {
                console.log(`  Actions: ${p.positions.map(pos => `${pos.stock_ticker}(${pos.quantity})`).join(', ')}`);
            }
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPortfolios();
