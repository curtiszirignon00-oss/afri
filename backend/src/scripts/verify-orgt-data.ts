/// <reference types="node" />
import prisma from '../config/prisma';

async function verifyORGTData() {
  try {
    console.log('🔍 Vérification complète des données ORGT...\n');

    const ticker = 'ORGT';

    // 1. Stock
    console.log('📊 Stock ORGT:');
    const stock = await prisma.stock.findUnique({
      where: { symbol: ticker }
    });
    if (stock) {
      console.log(`  ✅ Nom: ${stock.company_name}`);
      console.log(`  ✅ Secteur: ${stock.sector}`);
      console.log(`  ✅ Prix actuel: ${stock.current_price} FCFA`);
      console.log(`  ✅ Volume: ${stock.volume}`);
    } else {
      console.log('  ❌ Non trouvé');
    }
    console.log('');

    // 2. Données historiques
    console.log('📈 Données historiques ORGT:');
    const historyCount = await prisma.stockHistory.count({
      where: { stock_ticker: ticker }
    });
    console.log(`  ✅ Total: ${historyCount} enregistrements`);

    const oldestHistory = await prisma.stockHistory.findFirst({
      where: { stock_ticker: ticker },
      orderBy: { date: 'asc' }
    });
    const newestHistory = await prisma.stockHistory.findFirst({
      where: { stock_ticker: ticker },
      orderBy: { date: 'desc' }
    });

    if (oldestHistory && newestHistory) {
      console.log(`  ✅ Plus ancienne: ${oldestHistory.date.toISOString().split('T')[0]}`);
      console.log(`  ✅ Plus récente: ${newestHistory.date.toISOString().split('T')[0]}`);
    }
    console.log('');

    // 3. Fondamentaux
    console.log('💰 Données fondamentales ORGT:');
    const fundamentals = await prisma.stockFundamental.findUnique({
      where: { stock_ticker: ticker }
    });
    if (fundamentals) {
      console.log(`  ✅ Capitalisation: ${fundamentals.market_cap?.toLocaleString()} FCFA`);
      console.log(`  ✅ PER: ${fundamentals.pe_ratio || 'N/A (perte)'}`);
      console.log(`  ✅ Produit Net Bancaire: ${fundamentals.revenue?.toLocaleString()} FCFA`);
      console.log(`  ✅ Résultat net: ${fundamentals.net_income?.toLocaleString()} FCFA`);
      console.log(`  ✅ BPA: ${fundamentals.eps || 'N/A (perte)'} FCFA`);
      console.log(`  ✅ Nombre d'actions: ${fundamentals.shares_outstanding?.toLocaleString()}`);
      console.log(`  ✅ Année: ${fundamentals.year}`);
    } else {
      console.log('  ❌ Non trouvé');
    }
    console.log('');

    // 4. Informations compagnie
    console.log('🏢 Informations compagnie ORGT:');
    const companyInfo = await prisma.companyInfo.findUnique({
      where: { stock_ticker: ticker }
    });
    if (companyInfo) {
      console.log(`  ✅ Description: ${companyInfo.description?.substring(0, 100)}...`);
      console.log(`  ✅ Fondée: ${companyInfo.founded_year}`);
      console.log(`  ✅ Siège: ${companyInfo.headquarters}`);
      console.log(`  ✅ CEO: ${companyInfo.ceo}`);
      console.log(`  ✅ Industrie: ${companyInfo.industry}`);
    } else {
      console.log('  ❌ Non trouvé');
    }
    console.log('');

    // 5. Actionnaires
    console.log('👥 Actionnaires ORGT:');
    const shareholders = await prisma.shareholder.findMany({
      where: { stock_ticker: ticker },
      orderBy: { percentage: 'desc' }
    });
    if (shareholders.length > 0) {
      console.log(`  ✅ Nombre: ${shareholders.length} actionnaires`);
      shareholders.forEach(sh => {
        console.log(`     - ${sh.name}: ${sh.percentage}%${sh.is_public ? ' (Public)' : ''}`);
      });
    } else {
      console.log('  ❌ Non trouvé');
    }
    console.log('');

    // 6. Données financières annuelles
    console.log('📅 Données financières annuelles ORGT:');
    const annualFinancials = await prisma.annualFinancials.findMany({
      where: { stock_ticker: ticker },
      orderBy: { year: 'desc' }
    });
    if (annualFinancials.length > 0) {
      console.log(`  ✅ Nombre: ${annualFinancials.length} années`);
      console.log('\n  Détails:');
      console.log('  ' + '─'.repeat(100));
      console.log('  Année │ PNB (MFCFA)   │ Croissance    │ RN (MFCFA)    │ Croissance RN │ BPA      │ PER      │ Dividende');
      console.log('  ' + '─'.repeat(100));
      annualFinancials.forEach(af => {
        const pnb = af.revenue ? (af.revenue / 1_000_000).toFixed(0) : 'N/A';
        const rn = af.net_income ? (af.net_income / 1_000_000).toFixed(0) : 'N/A';
        const pnbGrowth = af.revenue_growth ? `${af.revenue_growth.toFixed(2)}%` : 'N/A';
        const rnGrowth = af.net_income_growth ? `${af.net_income_growth.toFixed(2)}%` : 'N/A';
        const eps = af.eps ? af.eps.toFixed(2) : 'N/A';
        const per = af.pe_ratio ? af.pe_ratio.toFixed(2) : 'N/A';
        const div = af.dividend ? af.dividend.toFixed(2) : 'N/A';

        console.log(`  ${af.year} │ ${pnb.padEnd(13)} │ ${pnbGrowth.padEnd(13)} │ ${rn.padEnd(13)} │ ${rnGrowth.padEnd(13)} │ ${eps.padEnd(8)} │ ${per.padEnd(8)} │ ${div}`);
      });
      console.log('  ' + '─'.repeat(100));
    } else {
      console.log('  ❌ Non trouvé');
    }
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Vérification terminée !');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`  ${stock ? '✅' : '❌'} Stock`);
    console.log(`  ${historyCount > 0 ? '✅' : '❌'} Données historiques (${historyCount} enregistrements)`);
    console.log(`  ${fundamentals ? '✅' : '❌'} Fondamentaux`);
    console.log(`  ${companyInfo ? '✅' : '❌'} Informations compagnie`);
    console.log(`  ${shareholders.length > 0 ? '✅' : '❌'} Actionnaires (${shareholders.length})`);
    console.log(`  ${annualFinancials.length > 0 ? '✅' : '❌'} Données financières annuelles (${annualFinancials.length} années)`);
    console.log('\n⚠️  Note: ORGT a des résultats négatifs en 2023 et 2024');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyORGTData();
