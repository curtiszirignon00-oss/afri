/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de SIVC (Air Liquide Côte d'Ivoire)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\sivc\sivc.txt
 * Date: 2026-01-03
 */

async function importSIVCFundamentals() {
  console.log('🚀 Import des données fondamentales SIVC...\n');

  const ticker = 'SIVC';

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
      market_cap: 6_026_000_000, // 6 026 MFCFA
      pe_ratio: 6.73, // PER 2023
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Pas de dividende

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (895/8512) * 100 ≈ 10.5%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2023 - en millions de FCFA)
      revenue: 8_512_000_000, // 8 512 MFCFA
      net_income: 895_000_000, // 895 MFCFA (Résultat net)
      ebitda: null, // Non disponible
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 8_734_000, // Nombre de titres
      eps: 102.60, // BNPA 2023
      book_value: null, // Non disponible
      net_profit: 895_000_000, // Même que net_income

      // Année de référence
      year: 2023
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "Air Liquide est présent en Côte d'Ivoire depuis bientôt 70 ans. La société est spécialisée dans la production et la distribution de gaz industriels et médicaux (azote gazeux, azote liquide, oxygène gazeux, oxygène liquide, acétylène, argon, propane, butane, protoxyde d'azote, monoxyde d'azote, etc.). La société opère dans différents secteurs d'activités : Gaz et pétrole, mines et carrières, Agro-alimentaires, fabrication métallique et construction, santé, industrie pharmaceutique, laboratoires et centres de recherche.",
      website: null,
      employees: null,
      founded_year: null, // Environ 1954 (70 ans en 2024)
      headquarters: "131, boulevard de Marseille BP 1753 Abidjan Abidjan",
      ceo: "Phillipe Martinez", // Président Directeur Général
      industry: "Industriels" // Secteur
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
      { name: 'AIR LIQUIDE INTERNATIONNAL SA', percentage: 72.08 },
      { name: 'PUBLIC (BRVM)', percentage: 27.92 }
    ];

    // Supprimer les anciens actionnaires SIVC
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
        year: 2019,
        revenue: 7_170_000_000,
        revenue_growth: null,
        net_income: -27_000_000,
        net_income_growth: null,
        eps: null, // Marqué "-" dans le fichier
        pe_ratio: null,
        dividend: null
      },
      {
        year: 2020,
        revenue: 6_349_000_000,
        revenue_growth: -11.45,
        net_income: -2_463_000_000,
        net_income_growth: null,
        eps: -282.00,
        pe_ratio: null, // Marqué "-" car EPS négatif
        dividend: null
      },
      {
        year: 2021,
        revenue: 7_647_000_000,
        revenue_growth: 20.44,
        net_income: 727_000_000,
        net_income_growth: null, // Marqué "-" (passage de négatif à positif)
        eps: 83.00,
        pe_ratio: 8.31,
        dividend: null
      },
      {
        year: 2022,
        revenue: 8_689_000_000,
        revenue_growth: 13.63,
        net_income: 403_000_000,
        net_income_growth: -44.57,
        eps: 46.10,
        pe_ratio: 14.97,
        dividend: null
      },
      {
        year: 2023,
        revenue: 8_512_000_000,
        revenue_growth: -2.04,
        net_income: 895_000_000,
        net_income_growth: 122.08,
        eps: 102.60,
        pe_ratio: 6.73,
        dividend: null
      }
    ];

    // Supprimer les anciennes données annuelles SIVC
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
    console.log('  - Onglet "Fondamentaux" de la page SIVC');
    console.log('  - Onglet "Vue d\'ensemble" de la page SIVC');
    console.log('  - Section "Actionnaires" de la page SIVC');
    console.log('  - Section "Données financières annuelles" de la page SIVC\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importSIVCFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
