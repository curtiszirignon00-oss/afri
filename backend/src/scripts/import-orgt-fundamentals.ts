/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de ORGT (Oragroup Togo)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\orgt\orgt.txt
 * Date: 2026-01-03
 */

async function importORGTFundamentals() {
  console.log('🚀 Import des données fondamentales ORGT...\n');

  const ticker = 'ORGT';

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
    // Note: Pour 2024, le résultat est négatif (-44 363 MFCFA), donc pas de BNPA ni PER
    // On utilise 2022 comme année de référence pour avoir des données complètes
    const fundamentalsData = {
      // Valorisation
      market_cap: 179_091_000_000, // 179 091 MFCFA
      pe_ratio: null, // Pas de PER en 2024 (résultat négatif)
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Pas de dividende

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Négatif en 2024

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2024 - en millions de FCFA)
      revenue: 195_436_000_000, // 195 436 MFCFA (Produit Net Bancaire)
      net_income: -44_363_000_000, // -44 363 MFCFA (Perte nette)
      ebitda: null, // Non applicable pour une banque
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 69_415_031, // Nombre de titres
      eps: null, // Pas de BNPA en 2024 (résultat négatif)
      book_value: null, // Non disponible
      net_profit: -44_363_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "ORAGROUP SA est une holding au capital social de 63,3 milliards de FCFA basée au Togo. C'est la société mère du groupe bancaire ORABANK. Historiquement, ORAGROUP a connu une extraordinaire croissance en l'espace d'une décennie (de 2008 à 2018), multipliant son total bilan par 9 (1 794 milliards de FCFA à fin 2017), étendant sa présence géographique de 5 à 12 pays (Burkina Faso, Bénin, Côte d'Ivoire, Gabon, Guinée, Guinée-Bissau, Mauritanie, Mali, Niger, Sénégal, Tchad, Togo) et revendiquant désormais un demi-million de clients. Le groupe est détenu à 50,01% par ECP Financial Holdings LLC (EFH) qui en est l'actionnaire principal.",
      website: null,
      employees: null,
      founded_year: 2008, // Croissance depuis 2008
      headquarters: "Rue du Gouverneur Général Ponty 01 BP 2700 Cotonou Cotonou",
      ceo: "Ferdinand KEMOUM", // Direction Générale
      industry: "Services Financiers" // Holding bancaire
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
      { name: 'ECP', percentage: 50.01 },
      { name: 'PUBLIC (BRVM)', percentage: 20.00 },
      { name: 'DIVERS ACTIONNAIRES PRIVES (BOURSE)', percentage: 18.50 },
      { name: 'PROPARCO', percentage: 7.43 },
      { name: 'BIO', percentage: 4.06 }
    ];

    // Supprimer les anciens actionnaires ORGT
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
          is_public: shareholder.name.includes('BRVM') || shareholder.name.includes('BOURSE')
        }
      });
    }
    console.log(`  ✅ ${shareholders.length} actionnaires importés\n`);

    // 4. Créer les données financières annuelles (AnnualFinancials)
    console.log('📈 Import des données financières annuelles...');

    const annualFinancials = [
      {
        year: 2020,
        revenue: 155_395_000_000, // Produit Net Bancaire
        revenue_growth: null,
        net_income: 9_440_000_000,
        net_income_growth: null,
        eps: 135.99,
        pe_ratio: 18.97,
        dividend: null
      },
      {
        year: 2021,
        revenue: 187_315_000_000,
        revenue_growth: 20.54,
        net_income: 19_798_000_000,
        net_income_growth: 109.72,
        eps: 285.21,
        pe_ratio: 9.05,
        dividend: null
      },
      {
        year: 2022,
        revenue: 222_431_000_000,
        revenue_growth: 18.75,
        net_income: 19_199_000_000,
        net_income_growth: -3.03,
        eps: 277.00,
        pe_ratio: 9.31,
        dividend: null
      },
      {
        year: 2023,
        revenue: 215_280_000_000,
        revenue_growth: -3.21,
        net_income: -18_186_000_000,
        net_income_growth: null, // Marqué "-" (passage en négatif)
        eps: null, // Marqué "-"
        pe_ratio: null, // Marqué "-"
        dividend: null
      },
      {
        year: 2024,
        revenue: 195_436_000_000,
        revenue_growth: -9.22,
        net_income: -44_363_000_000,
        net_income_growth: null, // Marqué "-"
        eps: null, // Marqué "-"
        pe_ratio: null, // Marqué "-"
        dividend: null
      }
    ];

    // Supprimer les anciennes données annuelles ORGT
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
    console.log('\n⚠️  Note: ORGT a enregistré des pertes en 2023 et 2024');
    console.log('\n💡 Ces données apparaîtront dans:');
    console.log('  - Onglet "Fondamentaux" de la page ORGT');
    console.log('  - Onglet "Vue d\'ensemble" de la page ORGT');
    console.log('  - Section "Actionnaires" de la page ORGT');
    console.log('  - Section "Données financières annuelles" de la page ORGT\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importORGTFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
