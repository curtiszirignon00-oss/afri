/// <reference types="node" />
import prisma from '../config/prisma';

async function verifySIVCData() {
  try {
    console.log('🔍 Vérification des données SIVC...\n');

    // Vérifier le stock SIVC
    const stock = await prisma.stock.findUnique({
      where: { symbol: 'SIVC' }
    });

    if (!stock) {
      console.log('❌ SIVC non trouvé dans la base de données');
      return;
    }

    console.log('✅ Stock SIVC trouvé:');
    console.log(`   - Symbole: ${stock.symbol}`);
    console.log(`   - Nom: ${stock.company_name}`);
    console.log(`   - Secteur: ${stock.sector}`);
    console.log(`   - Prix actuel: ${stock.current_price}`);
    console.log(`   - Volume: ${stock.volume}\n`);

    // Compter le nombre total de données historiques
    const totalHistory = await prisma.stockHistory.count({
      where: { stock_ticker: 'SIVC' }
    });

    console.log(`📊 Total de données historiques: ${totalHistory}\n`);

    // Obtenir la première et dernière date
    const oldestRecord = await prisma.stockHistory.findFirst({
      where: { stock_ticker: 'SIVC' },
      orderBy: { date: 'asc' }
    });

    const newestRecord = await prisma.stockHistory.findFirst({
      where: { stock_ticker: 'SIVC' },
      orderBy: { date: 'desc' }
    });

    if (oldestRecord && newestRecord) {
      console.log('📅 Plage de dates:');
      console.log(`   - Plus ancienne: ${oldestRecord.date.toISOString().split('T')[0]}`);
      console.log(`     Open: ${oldestRecord.open}, High: ${oldestRecord.high}, Low: ${oldestRecord.low}, Close: ${oldestRecord.close}, Volume: ${oldestRecord.volume}`);
      console.log(`   - Plus récente: ${newestRecord.date.toISOString().split('T')[0]}`);
      console.log(`     Open: ${newestRecord.open}, High: ${newestRecord.high}, Low: ${newestRecord.low}, Close: ${newestRecord.close}, Volume: ${newestRecord.volume}\n`);
    }

    // Afficher les 5 dernières entrées
    const recentRecords = await prisma.stockHistory.findMany({
      where: { stock_ticker: 'SIVC' },
      orderBy: { date: 'desc' },
      take: 5
    });

    console.log('📈 Les 5 dernières entrées:');
    console.log('─'.repeat(80));
    console.log('Date          │ Open    │ High    │ Low     │ Close   │ Volume');
    console.log('─'.repeat(80));
    recentRecords.forEach(record => {
      const date = record.date.toISOString().split('T')[0];
      console.log(`${date} │ ${String(record.open).padEnd(7)} │ ${String(record.high).padEnd(7)} │ ${String(record.low).padEnd(7)} │ ${String(record.close).padEnd(7)} │ ${record.volume}`);
    });
    console.log('─'.repeat(80));

    console.log('\n✅ Vérification terminée !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifySIVCData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
