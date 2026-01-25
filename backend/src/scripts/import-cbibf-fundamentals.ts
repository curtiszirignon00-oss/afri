/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Import des données fondamentales et informations de CBIBF (Coris Bank International Burkina Faso)
 * Source: C:\Users\HP\OneDrive\Desktop\actions brvm\cbibf\cbibf.txt
 * Date: 2026-01-04
 */

async function importCBIBFFundamentals() {
  console.log('🚀 Import des données fondamentales CBIBF...\n');

  const ticker = 'CBIBF';

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
      market_cap: 352_000_000_000, // 352 000 MFCFA
      pe_ratio: 7.34, // PER 2024
      pb_ratio: null, // Non disponible
      dividend_yield: null, // Peut être calculé: (Dividende / Prix) * 100

      // Rentabilité
      roe: null, // Non disponible
      roa: null, // Non disponible
      profit_margin: null, // Peut être calculé: (RN / PNB) * 100 = (47937/130987) * 100 ≈ 36.6%

      // Endettement
      debt_to_equity: null, // Non disponible

      // Résultats financiers (2024 - en millions de FCFA)
      revenue: 130_987_000_000, // 130 987 MFCFA (Produit Net Bancaire)
      net_income: 47_937_000_000, // 47 937 MFCFA (Résultat net)
      ebitda: null, // Non applicable pour une banque
      free_cash_flow: null, // Non disponible

      // Actions
      shares_outstanding: 32_000_000, // Nombre de titres
      eps: 1498.00, // BNPA 2024
      book_value: null, // Non disponible
      net_profit: 47_937_000_000, // Même que net_income

      // Année de référence
      year: 2024
    };

    // Informations de la compagnie
    const companyInfoData = {
      description: "Coris Bank International (CBI) est une banque commerciale fortement orientée vers le financement des activités agricoles et des petites et moyennes entreprises (PME). Fondé en 2008 sur une ancienne institution financière non bancaire « l'ex Financière du Burkina » (FIB-SA), Coris Bank International est le premier groupe bancaire burkinabé avec un total bilan de 1 132 milliards FCFA à fin 2017. Déjà présente en Côte d'Ivoire, au Benin, au Mali, au Sénégal et au Togo, la banque continue de poursuivre sa stratégie de croissance en Afrique de l'ouest.",
      website: null,
      employees: null,
      founded_year: 2008, // Fondé en 2008
      headquarters: "1242 Avenue du Dr Kwamé N'krumah 01 BP : 6585 Ouagadougou 01 Ouagadougou",
      ceo: "Gisèle GUMEDZOE OUEDRAOGO", // Directeur Général
      industry: "Services Financiers" // Banque commerciale
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
      { name: 'CORIS HOLDING', percentage: 56.00 },
      { name: 'BRVM (DIVERS PORTEURS)', percentage: 20.00 },
      { name: 'PORTEURS A', percentage: 6.12 },
      { name: 'LA POSTE BURKINA FASO', percentage: 4.25 },
      { name: 'SOCIETE INTERN. D\'INVEST.', percentage: 3.72 },
      { name: 'BOAD', percentage: 3.33 },
      { name: 'UNION DES ASSURANCES DU BURKINA (UAB)', percentage: 2.95 },
      { name: 'SOCIETE FINANCIERE DU FASO', percentage: 2.02 },
      { name: 'CAISSE NATIONALE DE SECURITE SOCIALE (CNSS)', percentage: 1.60 }
    ];

    // Supprimer les anciens actionnaires CBIBF
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
        revenue: 75_784_000_000, // Produit Net Bancaire
        revenue_growth: null,
        net_income: 34_373_000_000,
        net_income_growth: null,
        eps: 1074.16,
        pe_ratio: 10.24,
        dividend: 406.00
      },
      {
        year: 2021,
        revenue: 90_298_000_000,
        revenue_growth: 19.15,
        net_income: 46_549_000_000,
        net_income_growth: 35.42,
        eps: 1454.66,
        pe_ratio: 7.56,
        dividend: 448.00
      },
      {
        year: 2022,
        revenue: 111_106_000_000,
        revenue_growth: 23.04,
        net_income: 56_478_000_000,
        net_income_growth: 21.33,
        eps: 1764.94,
        pe_ratio: 6.23,
        dividend: 525.00
      },
      {
        year: 2023,
        revenue: 129_203_000_000,
        revenue_growth: 16.29,
        net_income: 64_247_000_000,
        net_income_growth: 13.76,
        eps: 2007.72,
        pe_ratio: 5.48,
        dividend: 790.00
      },
      {
        year: 2024,
        revenue: 130_987_000_000,
        revenue_growth: 1.38,
        net_income: 47_937_000_000,
        net_income_growth: -25.39,
        eps: 1498.00,
        pe_ratio: 7.34,
        dividend: 555.00
      }
    ];

    // Supprimer les anciennes données annuelles CBIBF
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
    console.log('\n⚠️  Note: Baisse du résultat net en 2024 (-25.39%)');
    console.log('\n💡 Ces données apparaîtront dans:');
    console.log('  - Onglet "Fondamentaux" de la page CBIBF');
    console.log('  - Onglet "Vue d\'ensemble" de la page CBIBF');
    console.log('  - Section "Actionnaires" de la page CBIBF');
    console.log('  - Section "Données financières annuelles" de la page CBIBF\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
importCBIBFFundamentals()
  .then(() => {
    console.log('🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Le script a échoué:', error);
    process.exit(1);
  });
