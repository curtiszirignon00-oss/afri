/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de SEMC (Crown SIEM)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\semc\semc.txt
 * Date: 2026-01-16
 */

async function importSEMCFundamentals() {
    console.log('🚀 Import des données fondamentales SEMC...\n');

    const ticker = 'SEMC';

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

        // Données financières basées sur 2023 (dernière année disponible)
        const fundamentalsData = {
            // Valorisation
            market_cap: 17_633_000_000, // 17 633 MFCFA
            pe_ratio: 17.50, // PER 2023
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Pas de dividende en 2023

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (1012/27875) * 100 ≈ 3.63%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2023 - en millions de FCFA)
            revenue: 27_875_000_000, // 27 875 MFCFA
            net_income: 1_012_000_000, // 1 012 MFCFA (Résultat net)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 25_189_600, // Nombre de titres
            eps: 40.00, // BNPA 2023
            book_value: null, // Non disponible
            net_profit: 1_012_000_000, // Même que net_income

            // Année de référence
            year: 2023
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "En Côte-d'Ivoire, CROWN SIEM est leader dans la conception et la fabrication des emballages métalliques. Elle est rattachée à une organisation qui regroupe des unités dans la fabrication de boites alimentaires et non alimentaires. Les produits sont destinés notamment au conditionnement de boissons (limonades, jus de fruits, boissons énergétiques), des produits alimentaires (poissons, fruits, salades, plats préparés, aliments pour bébés, condiments) et des produits divers (chimie, insecticide, peinture, colle, bouchon couronne).",
            website: null,
            employees: null,
            founded_year: null, // Non spécifié
            headquarters: "CROWN SIEM COTE D'IVOIRE Bld Giscard d'Estaing, 01 ABIDJAN",
            ceo: "MOHAMED DAO", // Directeur général
            industry: "Industriels" // Emballage
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
            { name: 'CROWN EUROPE HOLDING', percentage: 85.18 },
            { name: 'PUBLIC (BRVM)', percentage: 10.43 },
            { name: 'FONDATION MASSEYE', percentage: 3.71 },
            { name: 'DIVERS FRANCAIS', percentage: 0.69 }
        ];

        // Supprimer les anciens actionnaires SEMC
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
                    is_public: shareholder.name.includes('BRVM') || shareholder.name.includes('DIVERS')
                }
            });
        }
        console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

        // 4. Créer les données financières annuelles (AnnualFinancials)
        console.log('📈 Import des données financières annuelles...');

        const annualFinancials = [
            {
                year: 2019,
                revenue: 18_686_000_000,
                revenue_growth: null,
                net_income: 690_000_000,
                net_income_growth: null,
                eps: 27.40,
                pe_ratio: 25.55,
                dividend: null
            },
            {
                year: 2020,
                revenue: 19_630_000_000,
                revenue_growth: 5.05,
                net_income: 737_000_000,
                net_income_growth: 6.81,
                eps: 29.24,
                pe_ratio: 23.94,
                dividend: 14.40
            },
            {
                year: 2021,
                revenue: 23_057_000_000,
                revenue_growth: 17.46,
                net_income: 2_384_000_000,
                net_income_growth: 223.47,
                eps: 94.63,
                pe_ratio: 7.40,
                dividend: null
            },
            {
                year: 2022,
                revenue: 29_603_000_000,
                revenue_growth: 28.39,
                net_income: 3_858_000_000, // Note: Le fichier a une ligne incomplète pour "Croissance CA" en 2022 et 2023 ?
                // 31: Croissance CA		5,05%	17,46%	28,39%	-5,84%
                // 2020: 5.05, 2021: 17.46, 2022: 28.39, 2023: -5.84. OK.
                // 33: Croissance RN		6,81%	223,47%	61,83%	-73,77%
                // 2020: 6.81, 2021: 223.47, 2022: 61.83, 2023: -73.77.
                net_income_growth: 61.83,
                eps: 153.15,
                pe_ratio: 4.57,
                dividend: null
            },
            {
                year: 2023,
                revenue: 27_875_000_000,
                revenue_growth: -5.84,
                net_income: 1_012_000_000,
                net_income_growth: -73.77,
                eps: 40.00,
                pe_ratio: 17.50,
                dividend: null // "-" dans le fichier
            }
        ];

        // Supprimer les anciennes données annuelles SEMC
        await prisma.annualFinancials.deleteMany({
            where: { stock_ticker: ticker }
        });

        // Créer les nouvelles
        for (const yearData of annualFinancials) {
            await prisma.annualFinancials.create({
                data: {
                    stock_ticker: ticker,
                    stockId: stock.id, // IMPORTANT: Ajout de stockId
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
        console.log('  - Onglet "Fondamentaux" de la page SEMC');
        console.log('  - Onglet "Vue d\'ensemble" de la page SEMC');
        console.log('  - Section "Actionnaires" de la page SEMC');
        console.log('  - Section "Données financières annuelles" de la page SEMC\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importSEMCFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
