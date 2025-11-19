import { PrismaClient } from '@prisma/client';
import {
  getShareholders,
  getAnnualFinancials
} from '../src/services/stock.service.prisma';

const prisma = new PrismaClient();

async function testNewData() {
  console.log('🧪 Test des nouvelles données pour ABJC\n');

  try {
    // Test 1: Actionnaires
    console.log('1️⃣ Test getShareholders...');
    const shareholders = await getShareholders('ABJC');

    if (shareholders && shareholders.length > 0) {
      console.log(`   ✅ ${shareholders.length} actionnaires trouvés`);
      shareholders.forEach(sh => {
        console.log(`   - ${sh.name}: ${sh.percentage}% ${sh.is_public ? '(Public)' : '(Privé)'}`);
      });

      // Vérifier que la somme fait ~100%
      const total = shareholders.reduce((sum, sh) => sum + sh.percentage, 0);
      console.log(`   Total: ${total.toFixed(2)}%`);
    } else {
      console.log(`   ❌ Aucun actionnaire trouvé`);
    }

    // Test 2: Données financières annuelles
    console.log('\n2️⃣ Test getAnnualFinancials (5 ans)...');
    const financials = await getAnnualFinancials('ABJC', 5);

    if (financials && financials.length > 0) {
      console.log(`   ✅ ${financials.length} années de données trouvées`);
      console.log('\n   Années disponibles:');
      financials.forEach(f => {
        console.log(`   - ${f.year}:`);
        console.log(`     CA: ${(f.revenue! / 1_000_000).toFixed(0)} M FCFA (${f.revenue_growth ? `+${f.revenue_growth}%` : 'N/A'})`);
        console.log(`     RN: ${(f.net_income! / 1_000_000).toFixed(0)} M FCFA (${f.net_income_growth ? `+${f.net_income_growth}%` : 'N/A'})`);
        console.log(`     BNPA: ${f.eps} FCFA`);
        console.log(`     PER: ${f.pe_ratio || 'N/A'}`);
        console.log(`     Dividende: ${f.dividend || 'N/A'} FCFA`);
      });
    } else {
      console.log(`   ❌ Aucune donnée financière trouvée`);
    }

    // Test 3: Vérifier les données dans la base directement
    console.log('\n3️⃣ Vérification directe dans la base...');

    const shareholderCount = await prisma.shareholder.count({
      where: { stock_ticker: 'ABJC' }
    });
    console.log(`   Actionnaires dans la DB: ${shareholderCount}`);

    const financialCount = await prisma.annualFinancials.count({
      where: { stock_ticker: 'ABJC' }
    });
    console.log(`   Années financières dans la DB: ${financialCount}`);

    console.log('\n✅ Tous les tests sont terminés!');

  } catch (error) {
    console.error('\n❌ Erreur pendant les tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewData();
