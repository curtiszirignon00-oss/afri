/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de CFAC (CFAO Motors Côte d'Ivoire)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\cfac\cfac.txt
 * Date: 2026-01-15
 */

async function importCFACFundamentals() {
    console.log('🚀 Import des données fondamentales CFAC...\n');

    const ticker = 'CFAC';

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
            market_cap: 288_381_000_000, // 288 381 MFCFA
            pe_ratio: 61.39, // PER 2024
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Peut être calculé: (7.04 / prix) * 100

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (4693/158313) * 100 ≈ 2.96%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 158_313_000_000, // 158 313 MFCFA
            net_income: 4_693_000_000, // 4 693 MFCFA (Résultat net)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 181_371_900, // Nombre de titres
            eps: 25.90, // BNPA 2024
            book_value: null, // Non disponible
            net_profit: 4_693_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "CFAO MOTORS est une filiale du groupe CFAO, détenue à plus de 97% par TTC Japan (Toyota). Le groupe est présent en Côte d'Ivoire depuis 1973 et est le distributeur exclusif de huit marques de renommée mondiale : Citroën, Peugeot, Toyota, Mitsubishi, Yamaha, Suzuki, JCB et Bridgestone. La société est actuellement le leader du marché avec plus de 38% de part de marché au 1er trimestre 2018.",
            website: null,
            employees: null,
            founded_year: 1973,
            headquarters: "Treichville Boulevard de Marseille ABIDJAN",
            ceo: "Edouard ROCHET", // Président Directeur Général
            industry: "Distribution Automobile" // Secteur
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
            { name: 'CFAO', percentage: 95.88 },
            { name: 'PUBLIC (BRVM)', percentage: 4.12 }
        ];

        // Supprimer les anciens actionnaires CFAC
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
                revenue: 99_126_000_000,
                revenue_growth: null,
                net_income: 3_780_000_000,
                net_income_growth: null,
                eps: 20.84,
                pe_ratio: 76.30,
                dividend: 22.15
            },
            {
                year: 2021,
                revenue: 119_731_000_000,
                revenue_growth: 20.79,
                net_income: 6_711_000_000,
                net_income_growth: 77.54,
                eps: 37.00,
                pe_ratio: 42.97,
                dividend: 69.47
            },
            {
                year: 2022,
                revenue: 146_375_000_000,
                revenue_growth: 22.25,
                net_income: 5_534_000_000,
                net_income_growth: -17.54,
                eps: 30.51,
                pe_ratio: 52.11,
                dividend: 28.67
            },
            {
                year: 2023,
                revenue: 180_162_000_000,
                revenue_growth: 23.08,
                net_income: 6_399_000_000,
                net_income_growth: 15.63,
                eps: 35.00,
                pe_ratio: 45.43,
                dividend: 15.88
            },
            {
                year: 2024,
                revenue: 158_313_000_000,
                revenue_growth: -12.13,
                net_income: 4_693_000_000,
                net_income_growth: -26.65,
                eps: 25.90,
                pe_ratio: 61.39,
                dividend: 7.04
            }
        ];

        // Supprimer les anciennes données annuelles CFAC
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
        console.log('  - Onglet "Fondamentaux" de la page CFAC');
        console.log('  - Onglet "Vue d\'ensemble" de la page CFAC');
        console.log('  - Section "Actionnaires" de la page CFAC');
        console.log('  - Section "Données financières annuelles" de la page CFAC\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importCFACFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
