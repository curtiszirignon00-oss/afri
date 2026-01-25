/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de SICC (Société Ivoirienne de Coco Râpé - SICOR)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\sicc\sicc.txt
 * Date: 2026-01-04
 */

async function importSICCFundamentals() {
  console.log('🚀 Import des données fondamentales SICC...\n');

  const ticker = 'SICC';

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
    // Note: 2022 a eu un résultat négatif, donc pas de BNPA ni PER
    const fundamentalsData = {
      // Valorisation
      market_cap: 2_184_000_000, // 2 184 MFCFA
      pe_ratio: 113.48, // PER 2023
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Pas de dividende

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (RN / CA) * 100 = (19/701) * 100 ≈ 2.7%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2023 - en millions de FCFA)
      revenue: 701_000_000, // 701 MFCFA
      net_income: 19_000_000, // 19 MFCFA (Résultat net)
      ebitda: null, // Non disponible
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 600_000, // Nombre de titres
      eps: 32.08, // BNPA 2023
      book_value: null, // Non disponible
      net_profit: 19_000_000, // Même que net_income

      // Année de référence
      year: 2023
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "La Société Ivoirienne de Coco Râpé (SICOR) est une entreprise engagée dans le secteur de fabrication de produits alimentaires. Elle commercialise des noix de coco et des produits dérivés, notamment le coco desséché. SICOR est l'unique entreprise de transformation de noix de coco en Afrique de l'ouest.",
      website: null,
      employees: null,
      founded_year: null, // Non spécifié
      headquarters: "SICOR COTE D'IVOIRE Bd Lagunaire, Imm Arc en ciel, angle Av Chardy Pla Abidjan",
      ceo: "SAYEGH Hussein", // Directeur Général
      industry: "Consommation de Base" // Agroalimentaire
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
      { name: 'DEVACO', percentage: 70.44 },
      { name: 'PUBLIC (BRVM)', percentage: 12.56 },
      { name: 'SAYEGH HUSSEIN', percentage: 12.18 },
      { name: 'SAYEGH JAMAL', percentage: 4.82 }
    ];

    // Supprimer les anciens actionnaires SICC
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
        year: 2019,
        revenue: 1_857_000_000,
        revenue_growth: null,
        net_income: 2_000_000,
        net_income_growth: null,
        eps: 3.92,
        pe_ratio: 928.57,
        dividend: null
      },
      {
        year: 2020,
        revenue: 2_360_000_000,
        revenue_growth: 27.09,
        net_income: 110_000_000,
        net_income_growth: 5391.50,
        eps: 183.06,
        pe_ratio: 19.88,
        dividend: null
      },
      {
        year: 2021,
        revenue: 1_381_000_000,
        revenue_growth: -41.48,
        net_income: 119_000_000,
        net_income_growth: 8.56,
        eps: 198.72,
        pe_ratio: 18.32,
        dividend: null
      },
      {
        year: 2022,
        revenue: 1_138_000_000,
        revenue_growth: -17.60,
        net_income: -40_000_000, // Perte
        net_income_growth: null, // Marqué "-"
        eps: null, // Marqué "-"
        pe_ratio: null, // Marqué "-"
        dividend: null
      },
      {
        year: 2023,
        revenue: 701_000_000,
        revenue_growth: -38.39,
        net_income: 19_000_000,
        net_income_growth: null, // Marqué "-" (retour à la rentabilité)
        eps: 32.08,
        pe_ratio: 113.48,
        dividend: null
      }
    ];

    // Supprimer les anciennes données annuelles SICC
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
    console.log('\n⚠️  Note: Baisse continue du CA depuis 2020, perte en 2022, retour à la rentabilité en 2023');
    console.log('\n💡 Ces données apparaîtront dans:');
    console.log('  - Onglet "Fondamentaux" de la page SICC');
    console.log('  - Onglet "Vue d\'ensemble" de la page SICC');
    console.log('  - Section "Actionnaires" de la page SICC');
    console.log('  - Section "Données financières annuelles" de la page SICC\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importSICCFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
