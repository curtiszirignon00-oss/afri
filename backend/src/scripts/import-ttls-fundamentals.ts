/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de TTLS (Total Sénégal)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\ttls\ttls.txt
 * Date: 2026-01-16
 */

async function importTTLSFundamentals() {
    console.log('🚀 Import des données fondamentales TTLS...\n');

    const ticker = 'TTLS';

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
            market_cap: 81_444_000_000, // 81 444 MFCFA
            pe_ratio: 11.47, // PER 2024
            pb_ratio: null, // Non disponible
            dividend_yield: null, // Peut être calculé: (222.40 / 2500) * 100 ≈ 8.9%

            // Rentabilité
            roe: null, // Non disponible
            roa: null, // Non disponible
            profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (7091/484945) * 100 ≈ 1.46%

            // Endettement
            debt_to_equity: null, // Non disponible

            // Résultats financiers (2024 - en millions de FCFA)
            revenue: 484_945_000_000, // 484 945 MFCFA
            net_income: 7_091_000_000, // 7 091 MFCFA (Résultat net)
            ebitda: null, // Non disponible
            free_cash_flow: null, // Non disponible

            // Actions
            shares_outstanding: 32_577_700, // Nombre de titres
            eps: 218.00, // BNPA 2024
            book_value: null, // Non disponible
            net_profit: 7_091_000_000, // Même que net_income

            // Année de référence
            year: 2024
        };

        // Informations de la compagnie
        const companyInfoData = {
            description: "Présent au Sénégal depuis 1954, TOTAL est le leader du marketing des produits pétroliers dans le pays. La société est cotée à la bourse régionale (BRVM) depuis le 20 février 2015. TOTAL SENEGAL possède le plus grand réseau de stations-service avec 173 stations à l'échelle nationale en 2016. L'ensemble des activités de TOTAL Sénégal comprend l'importation, le stockage et la distribution de produits pétroliers. Ces produits sont répartis entre les métiers suivants: le réseau des stations-service, les clients industriels et commerciaux, les carburants d'aviation, les carburants pour la marine, les lubrifiants et le GPL.",
            website: null,
            employees: null,
            founded_year: 1954,
            headquarters: "Route de l'Aéroport sur la station total NGOR, Sénégal",
            ceo: "Badara Mbacké", // Directeur Général
            industry: "Energie" // Distribution pétrolière
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
            { name: 'TOTAL AFRICA LTD', percentage: 46.00 },
            { name: 'PUBLIC (BRVM)', percentage: 30.91 },
            { name: 'TOTAL OUTRE MER', percentage: 23.00 }
        ];

        // Supprimer les anciens actionnaires TTLS
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
                revenue: 384_493_000_000,
                revenue_growth: null,
                net_income: 6_064_000_000,
                net_income_growth: null,
                eps: 186.14,
                pe_ratio: 13.43,
                dividend: 223.60
            },
            {
                year: 2021,
                revenue: 395_458_000_000,
                revenue_growth: 2.85,
                net_income: 4_693_000_000,
                net_income_growth: -22.61,
                eps: 144.05,
                pe_ratio: 17.36,
                dividend: 187.30
            },
            {
                year: 2022,
                revenue: 477_813_000_000,
                revenue_growth: 20.83,
                net_income: 8_475_000_000,
                net_income_growth: 80.59,
                eps: 260.15,
                pe_ratio: 9.61,
                dividend: 234.13
            },
            {
                year: 2023,
                revenue: 499_194_000_000,
                revenue_growth: 4.47,
                net_income: 4_222_000_000,
                net_income_growth: -50.18,
                eps: 130.00,
                pe_ratio: 19.23,
                dividend: 207.58
            },
            {
                year: 2024,
                revenue: 484_945_000_000,
                revenue_growth: -2.85,
                net_income: 7_091_000_000,
                net_income_growth: 67.95,
                eps: 218.00,
                pe_ratio: 11.47,
                dividend: 222.40
            }
        ];

        // Supprimer les anciennes données annuelles TTLS
        await prisma.annualFinancials.deleteMany({
            where: { stock_ticker: ticker }
        });

        // Créer les nouvelles
        for (const yearData of annualFinancials) {
            await prisma.annualFinancials.create({
                data: {
                    stock_ticker: ticker,
                    stockId: stock.id, // Ajout de stockId
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
        console.log('  - Onglet "Fondamentaux" de la page TTLS');
        console.log('  - Onglet "Vue d\'ensemble" de la page TTLS');
        console.log('  - Section "Actionnaires" de la page TTLS');
        console.log('  - Section "Données financières annuelles" de la page TTLS\n');

    } catch (error) {
        console.error('❌ Erreur lors de l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
importTTLSFundamentals()
    .then(() => {
        console.log('🎉 Script terminé !');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Le script a échoué:', error);
        process.exit(1);
    });
