/// <reference types="node" />
// Script pour mettre à jour les soldes des portfolios à 1,000,000 FCFA
import prisma from "../config/prisma";

async function updatePortfolioBalances() {
    try {
        console.log('🔍 Recherche des portfolios avec 10,000,000 FCFA...');

        // Trouver tous les portfolios avec initial_balance = 10000000
        const portfoliosToUpdate = await prisma.portfolio.findMany({
            where: {
                initial_balance: 10000000,
                // Ne mettre à jour que ceux qui n'ont pas de positions (nouveaux comptes)
                positions: {
                    none: {}
                }
            },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                        lastname: true,
                    }
                }
            }
        });

        if (portfoliosToUpdate.length === 0) {
            console.log('✅ Aucun portfolio à mettre à jour!');
            return;
        }

        console.log(`📊 ${portfoliosToUpdate.length} portfolio(s) à mettre à jour`);

        // Mettre à jour chaque portfolio
        for (const portfolio of portfoliosToUpdate) {
            try {
                await prisma.portfolio.update({
                    where: { id: portfolio.id },
                    data: {
                        initial_balance: 1000000,
                        cash_balance: 1000000,
                    }
                });
                console.log(`✅ Portfolio mis à jour pour ${portfolio.user.name} ${portfolio.user.lastname} (${portfolio.user.email})`);
            } catch (error) {
                console.error(`❌ Erreur lors de la mise à jour pour ${portfolio.user.email}:`, error);
            }
        }

        console.log('🎉 Terminé!');
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updatePortfolioBalances();
