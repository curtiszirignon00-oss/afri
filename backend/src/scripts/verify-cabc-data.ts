/// <reference types="node" />
import prisma from '../config/prisma';

/**
 * Script de vérification des données CABC (SICABLE)
 * Vérifie que toutes les données ont bien été importées
 */

async function verifyCABCData() {
  console.log('🔍 Vérification des données CABC (SICABLE)...\n');

  const ticker = 'CABC';

  try {
    // 1. Vérifier l'action
    console.log('1️⃣ Vérification de l\'action...');
    const stock = await prisma.stock.findUnique({
      where: { symbol: ticker }
    });

    if (!stock) {
      console.log('❌ Action CABC non trouvée\n');
      return;
    }
    console.log(`✅ Action trouvée: ${stock.company_name}`);
    console.log(`   Prix actuel: ${stock.current_price} FCFA\n`);

    // 2. Vérifier les fondamentaux
    console.log('2️⃣ Vérification des fondamentaux...');
    const fundamentals = await prisma.stockFundamental.findUnique({
      where: { stock_ticker: ticker }
    });

    if (!fundamentals) {
      console.log('❌ Fondamentaux non trouvés\n');
    } else {
      console.log('✅ Fondamentaux trouvés:');
      console.log(`   Market Cap: ${fundamentals.market_cap?.toLocaleString()} FCFA`);
      console.log(`   PER: ${fundamentals.pe_ratio}`);
      console.log(`   CA 2024: ${fundamentals.revenue?.toLocaleString()} FCFA`);
      console.log(`   Résultat Net 2024: ${fundamentals.net_income?.toLocaleString()} FCFA`);
      console.log(`   BNPA 2024: ${fundamentals.eps} FCFA`);
      console.log(`   Nombre de titres: ${fundamentals.shares_outstanding?.toLocaleString()}\n`);
    }

    // 3. Vérifier les infos compagnie
    console.log('3️⃣ Vérification des infos compagnie...');
    const companyInfo = await prisma.companyInfo.findUnique({
      where: { stock_ticker: ticker }
    });

    if (!companyInfo) {
      console.log('❌ Infos compagnie non trouvées\n');
    } else {
      console.log('✅ Infos compagnie trouvées:');
      console.log(`   Secteur: ${companyInfo.industry}`);
      console.log(`   CEO: ${companyInfo.ceo}`);
      console.log(`   Année de création: ${companyInfo.founded_year}`);
      console.log(`   Siège: ${companyInfo.headquarters}`);
      console.log(`   Description: ${companyInfo.description?.substring(0, 100)}...\n`);
    }

    // 4. Vérifier les actionnaires
    console.log('4️⃣ Vérification des actionnaires...');
    const shareholders = await prisma.shareholder.findMany({
      where: { stock_ticker: ticker },
      orderBy: { percentage: 'desc' }
    });

    if (shareholders.length === 0) {
      console.log('❌ Aucun actionnaire trouvé\n');
    } else {
      console.log(`✅ ${shareholders.length} actionnaires trouvés:`);
      shareholders.forEach(sh => {
        console.log(`   - ${sh.name}: ${sh.percentage}%`);
      });
      console.log();
    }

    // 5. Vérifier les données annuelles
    console.log('5️⃣ Vérification des données financières annuelles...');
    const annualData = await prisma.annualFinancials.findMany({
      where: { stock_ticker: ticker },
      orderBy: { year: 'desc' }
    });

    if (annualData.length === 0) {
      console.log('❌ Aucune donnée annuelle trouvée\n');
    } else {
      console.log(`✅ ${annualData.length} années de données trouvées:`);
      console.log('\n   Année | CA (MFCFA) | Croiss. | RN (MFCFA) | Croiss. | BNPA | PER | Dividende');
      console.log('   ' + '-'.repeat(85));
      annualData.forEach(data => {
        const ca = (data.revenue! / 1_000_000).toFixed(0);
        const rn = (data.net_income! / 1_000_000).toFixed(0);
        const caGrowth = data.revenue_growth ? `${data.revenue_growth.toFixed(2)}%` : '-';
        const rnGrowth = data.net_income_growth ? `${data.net_income_growth.toFixed(2)}%` : '-';
        const bnpa = data.eps || '-';
        const per = data.pe_ratio || '-';
        const div = data.dividend || '-';

        console.log(`   ${data.year} | ${ca.padStart(10)} | ${caGrowth.padStart(7)} | ${rn.padStart(10)} | ${rnGrowth.padStart(8)} | ${String(bnpa).padStart(4)} | ${String(per).padStart(6)} | ${String(div).padStart(6)}`);
      });
      console.log();
    }

    // Résumé final
    console.log('='.repeat(60));
    console.log('📊 RÉSUMÉ DE LA VÉRIFICATION');
    console.log('='.repeat(60));
    console.log(`Action: ${stock ? '✅' : '❌'}`);
    console.log(`Fondamentaux: ${fundamentals ? '✅' : '❌'}`);
    console.log(`Infos compagnie: ${companyInfo ? '✅' : '❌'}`);
    console.log(`Actionnaires: ${shareholders.length > 0 ? `✅ (${shareholders.length})` : '❌'}`);
    console.log(`Données annuelles: ${annualData.length > 0 ? `✅ (${annualData.length} années)` : '❌'}`);
    console.log('='.repeat(60));

    const allDataPresent = stock && fundamentals && companyInfo && shareholders.length > 0 && annualData.length > 0;
    if (allDataPresent) {
      console.log('\n✅ Toutes les données CABC sont présentes !\n');
    } else {
      console.log('\n⚠️  Certaines données CABC sont manquantes\n');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
verifyCABCData()
  .then(() => {
    console.log('🎉 Vérification terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 La vérification a échoué:', error);
    process.exit(1);
  });
