/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de NEIC (Nouvelles Editions Ivoiriennes - CEDA)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\neic\neic.txt
 * Date: 2026-01-04
 */

async function importNEICFundamentals() {
  console.log('🚀 Import des données fondamentales NEIC...\n');

  const ticker = 'NEIC';

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
    // Note: 2024 a eu un résultat négatif, donc pas de BNPA ni PER
    const fundamentalsData = {
      // Valorisation
      market_cap: 12_000_000_000, // 12 000 MFCFA
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
      revenue: 6_744_000_000, // 6 744 MFCFA
      net_income: -759_000_000, // -759 MFCFA (Perte)
      ebitda: null, // Non disponible
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 12_765_825, // Nombre de titres
      eps: null, // Pas de BNPA en 2024 (résultat négatif)
      book_value: null, // Non disponible
      net_profit: -759_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "Les Nouvelles Editions Ivoirienne (NEI) est une maison d'édition fondée en 1992 en côte d'ivoire. En 2012, NEI réalisent une fusion absorption avec le Centre d'Edition et de Diffusion Africaine (CEDA) pour former NEI-CEDA. Cette nouvelle société est specialisée dans la distribution des titres de manuels de l'enseignement primaire et secondaire et propose des collections de littérature populaire.",
      website: null,
      employees: null,
      founded_year: 1992, // Fondée en 1992
      headquarters: "01 Bd Marseille, Non loin de la ex SONATT, Imm. NEI-CEDA - Zone portua 01 BP 1818 Abidjan 01 Abidjan",
      ceo: "Dominique Le BOULCH", // Directeur général
      industry: "Consommation Discrétionnaire" // Edition et distribution de livres
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
      { name: 'GROUPE HACHETTE LIVRE', percentage: 70.56 },
      { name: 'PUBLIC (BRVM)', percentage: 18.94 },
      { name: 'EDIPRESSE', percentage: 10.50 }
    ];

    // Supprimer les anciens actionnaires NEIC
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
        revenue: 7_301_000_000,
        revenue_growth: null,
        net_income: 801_000_000,
        net_income_growth: null,
        eps: 62.73,
        pe_ratio: 14.98,
        dividend: null
      },
      {
        year: 2021,
        revenue: 8_874_000_000,
        revenue_growth: 21.54,
        net_income: 980_000_000,
        net_income_growth: 22.35,
        eps: 76.79,
        pe_ratio: 12.24,
        dividend: null
      },
      {
        year: 2022,
        revenue: 8_988_000_000,
        revenue_growth: 1.28,
        net_income: 1_212_000_000,
        net_income_growth: 23.67,
        eps: 94.96,
        pe_ratio: 9.90,
        dividend: 35.25
      },
      {
        year: 2023,
        revenue: 8_525_000_000,
        revenue_growth: -5.15,
        net_income: 1_167_000_000,
        net_income_growth: -3.71,
        eps: 91.00,
        pe_ratio: 10.33,
        dividend: 81.78
      },
      {
        year: 2024,
        revenue: 6_744_000_000,
        revenue_growth: -20.89,
        net_income: -759_000_000, // Perte
        net_income_growth: null, // Marqué "-"
        eps: null, // Marqué "-"
        pe_ratio: null, // Marqué "-"
        dividend: null
      }
    ];

    // Supprimer les anciennes données annuelles NEIC
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
    console.log('\n⚠️  Note: Perte significative en 2024 (-759 MFCFA) après baisse du CA (-20.89%)');
    console.log('\n💡 Ces données apparaîtront dans:');
    console.log('  - Onglet "Fondamentaux" de la page NEIC');
    console.log('  - Onglet "Vue d\'ensemble" de la page NEIC');
    console.log('  - Section "Actionnaires" de la page NEIC');
    console.log('  - Section "Données financières annuelles" de la page NEIC\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importNEICFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
