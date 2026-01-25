/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de SLBC (SOLIBRA)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\slbc\slbc.txt
 * Date: 2026-01-15
 */

async function importSLBCFundamentals() {
    console.log('🚀 Import des données fondamentales SLBC...\n');

    const ticker = 'SLBC';

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
            market_cap: 460_904_000_000, // 460 904 MFCFA
            pe_ratio: 21.47, // PER 2024
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Peut être calculé: (1074 / prix) * 100

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (21472/309722) * 100 ≈ 6.93%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 309_722_000_000, // 309 722 MFCFA
            net_income: 21_472_000_000, // 21 472 MFCFA (Résultat net)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 16_460_840, // Nombre de titres
            eps: 1304.00, // BNPA 2024
            book_value: null, // Non disponible
            net_profit: 21_472_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "SOLIBRA (Societé de Limonaderie et Brasserie d'Afrique) produit et distribue de la bière, d'autres boissons alcooliques et non alcoolisées en côte d'ivoire. C'est la société leader sur le marché des boissons alcoolisées, de boissons gazeuses et sur le marché des eaux minérales. En mai 2017, SOLIBRA a procèdé à la fusion absorption de « Les Brasseries Ivoiriennes » (LBI) racheté 2 ans plus tôt par le groupe BGI formant ainsi le groupe SOLIBRA. Le portefeuille de la marque SOLIBRA intègre 16 marques et plus de 92 produits. Le principal produit sur le segment de la bière est «BOCK». Avec une capacité installée de 5,54 millions Hl, SOLIBRA dispose de quatre (4) sites de production dont deux (2) situés à Abidjan Yopougon, un (1) à Abidjan Zone III et un (1) à Bouaflé.",
            website: null,
            employees: null,
            founded_year: null,
            headquarters: "Rue Canal ZONE 3, Abidjan Abidjan",
            ceo: "MARC POZMENTIER", // Directeur Général
            industry: "Boissons et Brasserie" // Secteur
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
            { name: 'BGI', percentage: 76.88 },
            { name: 'PUBLIC (BRVM)', percentage: 18.60 },
            { name: 'DIVERS ACTIONNAIRES PRIVES (BOURSE)', percentage: 4.52 }
        ];

        // Supprimer les anciens actionnaires SLBC
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
                revenue: 229_359_000_000,
                revenue_growth: null,
                net_income: 17_520_000_000,
                net_income_growth: null,
                eps: 1064.34,
                pe_ratio: 26.31,
                dividend: 273.60
            },
            {
                year: 2021,
                revenue: 299_269_000_000,
                revenue_growth: 30.48,
                net_income: 22_020_000_000,
                net_income_growth: 25.68,
                eps: 1337.72,
                pe_ratio: 20.93,
                dividend: 405.00
            },
            {
                year: 2022,
                revenue: 281_880_000_000,
                revenue_growth: -5.81,
                net_income: 1_217_000_000,
                net_income_growth: -94.47,
                eps: 73.93,
                pe_ratio: 378.74,
                dividend: null // Marqué "-" dans le fichier
            },
            {
                year: 2023,
                revenue: 311_395_000_000,
                revenue_growth: 10.47,
                net_income: 15_078_000_000,
                net_income_growth: 1138.95,
                eps: 915.99,
                pe_ratio: 30.57,
                dividend: 270.00
            },
            {
                year: 2024,
                revenue: 309_722_000_000,
                revenue_growth: -0.54,
                net_income: 21_472_000_000,
                net_income_growth: 42.41,
                eps: 1304.00,
                pe_ratio: 21.47,
                dividend: 1074.00
            }
        ];

        // Supprimer les anciennes données annuelles SLBC
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
        console.log('  - Onglet "Fondamentaux" de la page SLBC');
        console.log('  - Onglet "Vue d\'ensemble" de la page SLBC');
        console.log('  - Section "Actionnaires" de la page SLBC');
        console.log('  - Section "Données financières annuelles" de la page SLBC\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importSLBCFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
