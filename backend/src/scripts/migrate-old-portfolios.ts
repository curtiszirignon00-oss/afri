// Script de migration: Ajoute wallet_type = 'SANDBOX' aux anciens portfolios
// Usage: npx ts-node src/scripts/migrate-old-portfolios.ts

import prisma from '../config/prisma';

async function migrateOldPortfolios() {
    console.log('🔄 Migration des anciens portfolios...');

    try {
        // Trouver tous les portfolios sans wallet_type défini
        const oldPortfolios = await prisma.portfolio.findMany({
            where: {
                OR: [
                    { wallet_type: null },
                    { wallet_type: undefined as any },
                ]
            },
            select: {
                id: true,
                userId: true,
                name: true,
                cash_balance: true,
                initial_balance: true,
                wallet_type: true,
            }
        });

        console.log(`📊 Trouvé ${oldPortfolios.length} portfolios sans wallet_type`);

        if (oldPortfolios.length === 0) {
            console.log('✅ Aucun portfolio à migrer');
            return;
        }

        // Afficher les portfolios trouvés
        console.log('\nPortfolios à migrer:');
        for (const p of oldPortfolios) {
            console.log(`  - ID: ${p.id}, User: ${p.userId}, Balance: ${p.cash_balance}/${p.initial_balance} FCFA`);
        }

        // Mettre à jour tous ces portfolios avec wallet_type = 'SANDBOX'
        const updateResult = await prisma.portfolio.updateMany({
            where: {
                id: { in: oldPortfolios.map(p => p.id) }
            },
            data: {
                wallet_type: 'SANDBOX'
            }
        });

        console.log(`\n✅ Migration terminée: ${updateResult.count} portfolios mis à jour avec wallet_type = 'SANDBOX'`);

        // Vérification
        const verifyCount = await prisma.portfolio.count({
            where: { wallet_type: null }
        });

        if (verifyCount === 0) {
            console.log('✅ Vérification OK: Tous les portfolios ont maintenant un wallet_type');
        } else {
            console.log(`⚠️ Attention: ${verifyCount} portfolios n'ont toujours pas de wallet_type`);
        }

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter
migrateOldPortfolios()
    .then(() => {
        console.log('\n🎉 Script terminé');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script échoué:', error);
        process.exit(1);
    });
