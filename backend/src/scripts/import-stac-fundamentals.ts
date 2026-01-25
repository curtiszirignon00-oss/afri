/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de STAC (SETAO Côte d'Ivoire)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\stac\stac.txt
 * Date: 2026-01-15
 */

async function importSTACFundamentals() {
    console.log('🚀 Import des données fondamentales STAC...\n');

    const ticker = 'STAC';

    try {
        // Vérifier que l'action existe
        const stock = await prisma.stock.findUnique({
            where: { symbol: ticker }
        });

        if (!stock) {
            console.log(`⚠️  Action ${ticker} non trouvée dans la base de données`);
            return;
        }

        console.log(`✅ Action trouvée: ${stock.company_name}\n`);

        // Données financières basées sur 2024 (dernière année disponible)
        const fundamentalsData = {
            // Valorisation
            market_cap: 14_784_000_000, // 14 784 MFCFA
            pe_ratio: null, // Non disponible (RN négatif en 2024)
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Pas de dividende

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Négatif en 2024

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 1_793_000_000, // 1 793 MFCFA
            net_income: -348_000_000, // -348 MFCFA (Résultat net)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 13_440_000, // Nombre de titres
            eps: null, // Non disponible (RN négatif)
            book_value: null, // Non disponible
            net_profit: -348_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "La SETAO est une filiale du groupe Bouygues dont les activités en Côte d'Ivoire ont débuté en 1950. La société est spécialisée dans les prestations de conseil et d'ingénierie dans le domaine du BTP. Plusieurs réalisations sont à son actif notamment: la construction du 3ème pont d'Abidjan, l'extension du centre commercial CAP SUD, la construction du complexe universitaire de Yamoussoukro (ex-INSET ou actuel INPHB).",
            website: null,
            employees: null,
            founded_year: 1950,
            headquarters: "SETAO COTE D'IVOIRE Zone 3, 22 Rue Foreurs CI BP 925 CI-2360 Abidjan 01, Région des lagunes Côte Abidjan",
            ceo: "Manuel BAZAN", // Administrateur et Directeur Général
            industry: "BTP" // Secteur
        };

        // 1. Importer/Mettre à jour les fondamentaux
        console.log('📊 Import des données fondamentales...');
        const existingFundamentals = await prisma.stockFundamental.findUnique({
            where: { stock_ticker: ticker }
        });

        if (existingFundamentals) {
            await prisma.stockFundamental.update({
                where: { stock_ticker: ticker },
                data: fundamentalsData
            });
            console.log('  ✅ Fondamentaux mis à jour\n');
        } else {
            await prisma.stockFundamental.create({
                data: {
                    stockId: stock.id,
                    stock_ticker: ticker,
                    ...fundamentalsData
                }
            });
            console.log('  ✅ Fondamentaux créés\n');
        }

        // 2. Importer/Mettre à jour les infos compagnie
        console.log('🏢 Import des informations de la compagnie...');
        const existingCompanyInfo = await prisma.companyInfo.findUnique({
            where: { stock_ticker: ticker }
        });

        if (existingCompanyInfo) {
            await prisma.companyInfo.update({
                where: { stock_ticker: ticker },
                data: companyInfoData
            });
            console.log('  ✅ Informations compagnie mises à jour\n');
        } else {
            await prisma.companyInfo.create({
                data: {
                    stock_ticker: ticker,
                    ...companyInfoData
                }
            });
            console.log('  ✅ Informations compagnie créées\n');
        }

        // 3. Créer les données d'actionnaires (Shareholders)
        console.log('👥 Import des actionnaires...');

        const shareholders = [
            { name: 'SOCIETE BOUYGUES', percentage: 79.17 },
            { name: 'PUBLIC (BRVM)', percentage: 20.83 }
        ];

        // Supprimer les anciens actionnaires STAC
        await prisma.shareholder.deleteMany({
            where: { stock_ticker: ticker }
        });

        // Créer les nouveaux
        for (const shareholder of shareholders) {
            await prisma.shareholder.create({
                data: {
                    stock_ticker: ticker,
                    name: shareholder.name,
                    percentage: shareholder.percentage,
                    is_public: shareholder.name === 'PUBLIC (BRVM)'
                }
            });
        }
        console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

        // 4. Créer les données financières annuelles (AnnualFinancials)
        console.log('📈 Import des données financières annuelles...');

        const annualFinancials = [
            {
                year: 2020,
                revenue: 15_901_000_000,
                revenue_growth: null,
                net_income: 2_321_000_000,
                net_income_growth: null,
                eps: 173.00,
                pe_ratio: 6.36,
                dividend: 66.15
            },
            {
                year: 2021,
                revenue: 10_274_000_000,
                revenue_growth: -35.39,
                net_income: 1_119_000_000,
                net_income_growth: -51.79,
                eps: 83.29,
                pe_ratio: 13.21,
                dividend: 66.15
            },
            {
                year: 2022,
                revenue: 14_654_000_000,
                revenue_growth: 42.63,
                net_income: -70_000_000,
                net_income_growth: null, // Marqué "-" (passage à négatif)
                eps: null,
                pe_ratio: null,
                dividend: null
            },
            {
                year: 2023,
                revenue: 9_264_000_000,
                revenue_growth: -36.78,
                net_income: -1_118_000_000,
                net_income_growth: null, // Marqué "-" (RN négatif)
                eps: null,
                pe_ratio: null,
                dividend: null
            },
            {
                year: 2024,
                revenue: 1_793_000_000,
                revenue_growth: -80.64,
                net_income: -348_000_000,
                net_income_growth: null, // Marqué "-" (RN négatif)
                eps: null,
                pe_ratio: null,
                dividend: null
            }
        ];

        // Supprimer les anciennes données annuelles STAC
        await prisma.annualFinancials.deleteMany({
            where: { stock_ticker: ticker }
        });

        // Créer les nouvelles
        for (const yearData of annualFinancials) {
            await prisma.annualFinancials.create({
                data: {
                    stock_ticker: ticker,
                    stockId: stock.id,
                    year: yearData.year,
                    revenue: yearData.revenue,
                    revenue_growth: yearData.revenue_growth,
                    net_income: yearData.net_income,
                    net_income_growth: yearData.net_income_growth,
                    eps: yearData.eps,
                    pe_ratio: yearData.pe_ratio,
                    dividend: yearData.dividend
                }
            });
        }
        console.log(`  ✅ ${annualFinancials.length} années de données financières importées\n`);

        console.log('='.repeat(60));
        console.log('✅ Import terminé avec succès !');
        console.log('='.repeat(60));
        console.log('\n📊 Résumé:');
        console.log('  ✅ Données fondamentales (StockFundamental)');
        console.log('  ✅ Informations compagnie (CompanyInfo)');
        console.log(`  ✅ ${shareholders.length} actionnaires (Shareholder)`);
        console.log(`  ✅ ${annualFinancials.length} années de données financières (AnnualFinancials)`);
        console.log('\n💡 Ces données apparaîtront dans:');
        console.log('  - Onglet "Fondamentaux" de la page STAC');
        console.log('  - Onglet "Vue d\'ensemble" de la page STAC');
        console.log('  - Section "Actionnaires" de la page STAC');
        console.log('  - Section "Données financières annuelles" de la page STAC\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importSTACFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
