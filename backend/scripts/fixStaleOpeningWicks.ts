// backend/scripts/fixStaleOpeningWicks.ts
// Répare les fausses mèches des bougies journalières : à l'ouverture, la page
// source affichait encore la clôture + le volume de la veille ; ces relevés
// intraday périmés étaient fusionnés dans high/low (cf. saveIntradaySnapshots).
//
// Usage : npx tsx scripts/fixStaleOpeningWicks.ts [--apply] [--ticker SNTS]
// Simulation par défaut. Ne touche une bougie que si son extrême faussé est
// exactement la clôture de la séance précédente.
import prisma from '../src/config/prisma';

const APPLY = process.argv.includes('--apply');
const tIdx = process.argv.indexOf('--ticker');
const ONLY = tIdx > 0 ? process.argv[tIdx + 1] : undefined;

async function main() {
  const snaps = await prisma.intradaySnapshot.findMany({
    where: ONLY ? { stock_ticker: ONLY } : {},
    orderBy: { timestamp: 'asc' },
    select: { stock_ticker: true, timestamp: true, price: true, volume: true },
  });
  // ticker → jour → relevés
  const byTicker = new Map<string, Map<string, typeof snaps>>();
  for (const s of snaps) {
    const day = s.timestamp.toISOString().slice(0, 10);
    if (!byTicker.has(s.stock_ticker)) byTicker.set(s.stock_ticker, new Map());
    const days = byTicker.get(s.stock_ticker)!;
    if (!days.has(day)) days.set(day, []);
    days.get(day)!.push(s);
  }

  const fixes: { id: string; ticker: string; day: string; high: number; low: number; newHigh: number; newLow: number }[] = [];
  for (const [ticker, days] of byTicker) {
    const history = await prisma.stockHistory.findMany({
      where: { stock_ticker: ticker },
      orderBy: { date: 'asc' },
      select: { id: true, date: true, open: true, high: true, low: true, close: true, volume: true },
    });
    for (let i = 1; i < history.length; i++) {
      const bar = history[i];
      const prev = history[i - 1];
      // date parfois stockée à 22h/23h UTC la veille → jour de séance = +3 h
      const day = new Date(bar.date.getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
      const daySnaps = days.get(day);
      if (!daySnaps || prev.volume <= 0) continue;

      let k = 0;
      while (k < daySnaps.length && daySnaps[k].price === prev.close && daySnaps[k].volume === prev.volume) k++;
      if (k === 0) continue; // aucun relevé périmé ce jour-là
      const clean = daySnaps.slice(k).map(s => s.price);
      const newHigh = Math.max(bar.open, bar.close, ...clean);
      const newLow = Math.min(bar.open, bar.close, ...clean);

      const highWrong = bar.high === prev.close && newHigh < bar.high;
      const lowWrong = bar.low === prev.close && newLow > bar.low;
      if (!highWrong && !lowWrong) continue;
      fixes.push({
        id: bar.id, ticker, day,
        high: bar.high, low: bar.low,
        newHigh: highWrong ? newHigh : bar.high,
        newLow: lowWrong ? newLow : bar.low,
      });
    }
  }

  console.log(`${APPLY ? 'APPLICATION' : 'SIMULATION'} — ${fixes.length} bougies à corriger`);
  const byT = new Map<string, number>();
  fixes.forEach(f => byT.set(f.ticker, (byT.get(f.ticker) ?? 0) + 1));
  console.log([...byT].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}:${n}`).join(' '));
  const biggest = [...fixes].sort((a, b) =>
    Math.max(b.high / b.newHigh, b.newLow / b.low) - Math.max(a.high / a.newHigh, a.newLow / a.low)).slice(0, 12);
  for (const f of biggest) {
    console.log(`  ${f.ticker.padEnd(6)} ${f.day}  high ${f.high} → ${f.newHigh}   low ${f.low} → ${f.newLow}`);
  }

  if (APPLY) {
    for (const f of fixes) {
      await prisma.stockHistory.update({ where: { id: f.id }, data: { high: f.newHigh, low: f.newLow } });
    }
    console.log('✅ Bougies corrigées.');
  } else {
    console.log('Relancer avec --apply pour écrire.');
  }
  await prisma.$disconnect();
}

main().catch(async e => { console.error(e); await prisma.$disconnect(); process.exit(1); });
