// Script pour nettoyer les portfolios en double
// Un utilisateur ne doit avoir qu'un seul SANDBOX et qu'un seul CONCOURS
// Usage: npx ts-node src/scripts/cleanup-duplicate-portfolios.ts

import prisma from '../config/prisma';

async function cleanupDuplicatePortfolios() {
    console.log('🔍 Recherche des portfolios en double...\n');

    try {
        // Récupérer tous les portfolios groupés par userId
        const allPortfolios = await prisma.portfolio.findMany({
            orderBy: { created_at: 'asc' },
            include: {
                positions: true,
                transactions: true
            }
        });

        // Grouper par userId
        const portfoliosByUser = new Map<string, typeof allPortfolios>();
        for (const p of allPortfolios) {
            const existing = portfoliosByUser.get(p.userId) || [];
            existing.push(p);
            portfoliosByUser.set(p.userId, existing);
        }

        let duplicatesFound = 0;
        const toDelete: string[] = [];

        for (const [userId, portfolios] of portfoliosByUser) {
            // Séparer SANDBOX et CONCOURS
            const sandboxPortfolios = portfolios.filter(p => p.wallet_type !== 'CONCOURS');
            const concoursPortfolios = portfolios.filter(p => p.wallet_type === 'CONCOURS');

            // Vérifier les doublons SANDBOX
            if (sandboxPortfolios.length > 1) {
                console.log(`\n⚠️  Utilisateur ${userId} a ${sandboxPortfolios.length} portfolios SANDBOX:`);

                // Garder le plus ancien (premier dans la liste triée)
                const [keep, ...remove] = sandboxPortfolios;
                console.log(`   ✅ Garder: ID=${keep.id}, Balance=${keep.cash_balance}, Positions=${keep.positions.length}, Transactions=${keep.transactions.length}`);

                for (const dup of remove) {
                    console.log(`   ❌ Supprimer: ID=${dup.id}, Balance=${dup.cash_balance}, Positions=${dup.positions.length}, Transactions=${dup.transactions.length}`);
                    toDelete.push(dup.id);
                    duplicatesFound++;
                }
            }

            // Vérifier les doublons CONCOURS
            if (concoursPortfolios.length > 1) {
                console.log(`\n⚠️  Utilisateur ${userId} a ${concoursPortfolios.length} portfolios CONCOURS:`);

                // Garder le plus ancien
                const [keep, ...remove] = concoursPortfolios;
                console.log(`   ✅ Garder: ID=${keep.id}, Balance=${keep.cash_balance}`);

                for (const dup of remove) {
                    console.log(`   ❌ Supprimer: ID=${dup.id}, Balance=${dup.cash_balance}`);
                    toDelete.push(dup.id);
                    duplicatesFound++;
                }
            }
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📊 Résumé: ${duplicatesFound} portfolios en double trouvés`);

        if (toDelete.length > 0) {
            console.log(`\n🗑️  Portfolios à supprimer: ${toDelete.join(', ')}`);

            // Demander confirmation
            console.log('\n⚠️  Pour supprimer ces portfolios, exécutez avec --confirm');

            if (process.argv.includes('--confirm')) {
                console.log('\n🔄 Suppression en cours...');

                for (const id of toDelete) {
                    // Supprimer d'abord les positions et transactions liées
                    await prisma.position.deleteMany({ where: { portfolioId: id } });
                    await prisma.transaction.deleteMany({ where: { portfolioId: id } });
                    await prisma.portfolio.delete({ where: { id } });
                    console.log(`   ✅ Portfolio ${id} supprimé`);
                }

                console.log('\n✅ Nettoyage terminé !');
            }
        } else {
            console.log('\n✅ Aucun doublon à nettoyer');
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDuplicatePortfolios();
