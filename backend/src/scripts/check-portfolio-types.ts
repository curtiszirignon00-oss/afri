// Script de vérification des wallet_type
// Usage: npx ts-node src/scripts/check-portfolio-types.ts

import prisma from '../config/prisma';

async function checkPortfolioTypes() {
    console.log('🔍 Vérification des wallet_types...\n');

    try {
        // Récupérer tous les portfolios avec le raw query pour voir le wallet_type brut
        const portfolios = await prisma.portfolio.findMany({
            select: {
                id: true,
                wallet_type: true,
                cash_balance: true,
                initial_balance: true,
            }
        });

        // Grouper par wallet_type
        const byType: Record<string, number> = {};
        for (const p of portfolios) {
            const type = String(p.wallet_type || 'UNDEFINED/NULL');
            byType[type] = (byType[type] || 0) + 1;
        }

        console.log('📊 Distribution des wallet_types:');
        for (const [type, count] of Object.entries(byType)) {
            console.log(`   - ${type}: ${count}`);
        }

        // Vérifier les portfolios qui ne sont pas SANDBOX ou CONCOURS
        const nonStandard = portfolios.filter(
            p => p.wallet_type !== 'SANDBOX' && p.wallet_type !== 'CONCOURS'
        );

        if (nonStandard.length > 0) {
            console.log(`\n⚠️ ${nonStandard.length} portfolios avec wallet_type non-standard:`);
            for (const p of nonStandard.slice(0, 5)) {
                console.log(`   - ID: ${p.id}, Type: "${p.wallet_type}", Balance: ${p.cash_balance}`);
            }
        }

        // Mettre à jour les portfolios sans wallet_type standard vers SANDBOX
        console.log('\n🔄 Mise à jour des portfolios sans wallet_type valide...');

        const updateResult = await prisma.portfolio.updateMany({
            where: {
                NOT: {
                    OR: [
                        { wallet_type: 'SANDBOX' },
                        { wallet_type: 'CONCOURS' }
                    ]
                }
            },
            data: {
                wallet_type: 'SANDBOX'
            }
        });

        console.log(`✅ ${updateResult.count} portfolios mis à jour avec wallet_type = 'SANDBOX'`);

        // Vérification finale
        const finalSandbox = await prisma.portfolio.count({ where: { wallet_type: 'SANDBOX' } });
        const finalConcours = await prisma.portfolio.count({ where: { wallet_type: 'CONCOURS' } });
        console.log(`\n📊 Après migration:`);
        console.log(`   - SANDBOX: ${finalSandbox}`);
        console.log(`   - CONCOURS: ${finalConcours}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPortfolioTypes();
