/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de ABJC (Servair Abidjan)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\abjc\abjc.txt
 * Date: 2026-01-16
 */

async function importABJCFundamentals() {
    console.log('🚀 Import des données fondamentales ABJC...\n');

    const ticker = 'ABJC';

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
            market_cap: 26_571_000_000, // 26 571 MFCFA
            pe_ratio: 17.49, // PER 2024
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Dividende 2024 non renseigné

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (1519/12467) * 100 ≈ 12.18%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 12_467_000_000, // 12 467 MFCFA
            net_income: 1_519_000_000, // 1 519 MFCFA (Résultat net)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 10_912_000, // Nombre de titres
            eps: 139.22, // BNPA 2024
            book_value: null, // Non disponible
            net_profit: 1_519_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "SERVAIR ABIDJAN anciennement Abidjan Catering, est une société créée en 1968 opérant sur l'avitaillement, la fourniture de repas et le nettoyage des compagnies aériennes qui desservent l'aéroport d'Abidjan. Depuis 2012, SERVAIR ABIDJAN développe aussi des activités Hors Aérienne. En effet, afin de développer son portefeuille clients et tirer profit de la croissance économique du pays, la société a commencé à développer la restauration collective (scolaire, entreprise), son service traiteur événementiel (Grain de Sel) et propose ses services pour le catering et l'avitaillement de Bases Vies (FOXTROT).",
            website: null,
            employees: null,
            founded_year: 1968,
            headquarters: "Aéroport International Félix Houphouet Boigny d'Abidjan 07 BP 08 ABIDJAN 07 Côte d'Ivoire ABIDJAN",
            ceo: "BRAASTAD Mark", // Directeur Général
            industry: "Services aux consommateurs" // Restauration / Services aéroportuaires
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
            { name: 'SIA RESTAURATION PUBLIQUE', percentage: 76.16 },
            { name: 'PUBLIC (BRVM)', percentage: 14.34 },
            { name: 'LSG SKY CHEFS', percentage: 9.50 }
        ];

        // Supprimer les anciens actionnaires ABJC
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
                revenue: 5_708_000_000,
                revenue_growth: null,
                net_income: -985_000_000,
                net_income_growth: null,
                eps: -90.30,
                pe_ratio: null,
                dividend: null
            },
            {
                year: 2021,
                revenue: 8_377_000_000,
                revenue_growth: 46.76,
                net_income: 953_000_000,
                net_income_growth: null,
                eps: 87.37,
                pe_ratio: 27.87,
                dividend: 57.73
            },
            {
                year: 2022,
                revenue: 10_804_000_000,
                revenue_growth: 28.97,
                net_income: 1_268_000_000,
                net_income_growth: 33.05,
                eps: 116.26,
                pe_ratio: 20.94,
                dividend: 82.80
            },
            {
                year: 2023,
                revenue: 11_254_000_000,
                revenue_growth: 4.17,
                net_income: 1_335_000_000,
                net_income_growth: 5.28,
                eps: 122.00,
                pe_ratio: 19.96,
                dividend: 206.00
            },
            {
                year: 2024,
                revenue: 12_467_000_000,
                revenue_growth: 10.78,
                net_income: 1_519_000_000,
                net_income_growth: 13.78,
                eps: 139.22,
                pe_ratio: 17.49,
                dividend: null // Non renseigné
            }
        ];

        // Supprimer les anciennes données annuelles ABJC
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
        console.log('  - Onglet "Fondamentaux" de la page ABJC');
        console.log('  - Onglet "Vue d\'ensemble" de la page ABJC');
        console.log('  - Section "Actionnaires" de la page ABJC');
        console.log('  - Section "Données financières annuelles" de la page ABJC\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importABJCFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
