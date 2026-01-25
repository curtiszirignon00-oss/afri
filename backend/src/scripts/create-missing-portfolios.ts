/// <reference types="node" />
// Script pour créer des portfolios pour les utilisateurs existants qui n'en ont pas
import prisma from "../config/prisma";

async function createMissingPortfolios() {
    try {
        console.log('🔍 Recherche des utilisateurs sans portfolio...');

        // Trouver tous les utilisateurs qui n'ont pas de portfolio
        const usersWithoutPortfolio = await prisma.user.findMany({
            where: {
                portfolios: {
                    none: {}
                }
            },
            select: {
                id: true,
                email: true,
                name: true,
                lastname: true,
            }
        });

        if (usersWithoutPortfolio.length === 0) {
            console.log('✅ Tous les utilisateurs ont déjà un portfolio!');
            return;
        }

        console.log(`📊 ${usersWithoutPortfolio.length} utilisateur(s) sans portfolio trouvé(s)`);

        // Créer un portfolio pour chaque utilisateur
        for (const user of usersWithoutPortfolio) {
            try {
                await prisma.portfolio.create({
                    data: {
                        userId: user.id,
                        name: 'Mon Portefeuille',
                        initial_balance: 1000000, // 1,000,000 FCFA
                        cash_balance: 1000000,
                        is_virtual: true,
                    }
                });
                console.log(`✅ Portfolio créé pour ${user.name} ${user.lastname} (${user.email})`);
            } catch (error) {
                console.error(`❌ Erreur lors de la création du portfolio pour ${user.email}:`, error);
            }
        }

        console.log('🎉 Terminé!');
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createMissingPortfolios();
