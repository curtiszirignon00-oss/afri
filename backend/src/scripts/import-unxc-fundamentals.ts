/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de UNXC (UNIWAX)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\unxc\unxc.txt
 * Date: 2026-01-16
 */

async function importUNXCFundamentals() {
    console.log('🚀 Import des données fondamentales UNXC...\n');

    const ticker = 'UNXC';

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
            market_cap: 32_681_000_000, // 32 681 MFCFA
            pe_ratio: null, // Pas de PER en 2024 (résultat négatif)
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Pas de dividende en 2024

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Négatif en 2024

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 27_333_000_000, // 27 333 MFCFA
            net_income: -2_218_000_000, // -2 218 MFCFA (Perte)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 20_750_000, // Nombre de titres
            eps: null, // Pas de BNPA en 2024 (résultat négatif)
            book_value: null, // Non disponible
            net_profit: -2_218_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "La société : UNIWAX, leader de l'industrie textile en Côte d'Ivoire conçoit, produit et commercialise des tissus uniques et colorés. Ces textiles expressifs de haute qualité sont distribués dans les pays africains. UNIWAX, un véritable leader du marché, a inspiré la mode ivoirienne depuis de nombreuses années avec le tissu \"Wax Hollandais\", symbole de la culture africaine. UNIWAX fait partie de Vlisco Helmond BV aux côtés de deux autres filiales; GTP et Woodin. Le groupe, précédemment détenu par GAMMA holding, a été racheté par ACTIS, un fonds d'investissement axé sur les marchés émergents en septembre 2010.",
            website: null,
            employees: null,
            founded_year: null, // Non spécifié
            headquarters: "Zone Industrielle - Yopougon, Côte d'Ivoire Abidjan",
            ceo: "Ersin Güney", // Directeur Général
            industry: "Consommation Discrétionnaire" // Textile
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
            { name: 'FRAGECI', percentage: 70.50 },
            { name: 'PUBLIC (BRVM)', percentage: 27.70 },
            { name: 'CFCI', percentage: 1.30 },
            { name: 'VLISCO BV', percentage: 0.50 }
        ];

        // Supprimer les anciens actionnaires UNXC
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
                    is_public: shareholder.name.includes('BRVM')
                }
            });
        }
        console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

        // 4. Créer les données financières annuelles (AnnualFinancials)
        console.log('📈 Import des données financières annuelles...');

        const annualFinancials = [
            {
                year: 2020,
                revenue: 34_917_000_000,
                revenue_growth: null,
                net_income: 370_000_000,
                net_income_growth: null,
                eps: 17.82,
                pe_ratio: 88.38,
                dividend: 18.00
            },
            {
                year: 2021,
                revenue: 38_191_000_000,
                revenue_growth: 9.38,
                net_income: 1_401_000_000,
                net_income_growth: 278.65,
                eps: 67.50,
                pe_ratio: 23.33,
                dividend: 60.75
            },
            {
                year: 2022,
                revenue: 36_373_000_000,
                revenue_growth: -4.76,
                net_income: -1_299_000_000,
                net_income_growth: null, // Marqué "-" (perte)
                eps: null,
                pe_ratio: null,
                dividend: null
            },
            {
                year: 2023,
                revenue: 29_687_000_000,
                revenue_growth: -18.38,
                net_income: -2_035_000_000,
                net_income_growth: null,
                eps: null,
                pe_ratio: null,
                dividend: null
            },
            {
                year: 2024,
                revenue: 27_333_000_000,
                revenue_growth: -7.93,
                net_income: -2_218_000_000,
                net_income_growth: null,
                eps: null,
                pe_ratio: null,
                dividend: null
            }
        ];

        // Supprimer les anciennes données annuelles UNXC
        await prisma.annualFinancials.deleteMany({
            where: { stock_ticker: ticker }
        });

        // Créer les nouvelles
        for (const yearData of annualFinancials) {
            await prisma.annualFinancials.create({
                data: {
                    stock_ticker: ticker,
                    stockId: stock.id, // Ajout du stockId pour la relation
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
        console.log('\n⚠️  Note: UNXC est en perte depuis 2022 et le CA diminue.');
        console.log('\n💡 Ces données apparaîtront dans:');
        console.log('  - Onglet "Fondamentaux" de la page UNXC');
        console.log('  - Onglet "Vue d\'ensemble" de la page UNXC');
        console.log('  - Section "Actionnaires" de la page UNXC');
        console.log('  - Section "Données financières annuelles" de la page UNXC\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importUNXCFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
