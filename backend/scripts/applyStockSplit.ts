/**
 * Applique un fractionnement (split) d'action à toutes les données de la plateforme.
 *
 *   npx tsx scripts/applyStockSplit.ts SNTS 2026-10-26 10            (simulation, lecture seule)
 *   npx tsx scripts/applyStockSplit.ts SNTS 2026-10-26 10 --apply    (écriture)
 *
 * ratio = nombre d'actions nouvelles pour 1 ancienne (1:10 → 10 ; regroupement 10:1 → 0.1).
 * ex_date = première séance cotée dans la nouvelle base.
 *
 * Effets (une seule transaction Mongo) :
 *  - CorporateAction SPLIT vérifiée, history_adjusted=true (la carte de marché et le
 *    portefeuille réel ne rajustent donc pas l'historique une seconde fois) ;
 *  - StockHistory et IntradaySnapshot antérieurs : cours ÷ ratio, volumes × ratio ;
 *  - simulateur : Transaction antérieures (qté × ratio, prix ÷ ratio) et Position
 *    (qté × ratio, PRU ÷ ratio ; les achats/ventes postérieurs sont rejoués) ;
 *  - alertes de prix actives ÷ ratio, alertes déclenchées à tort par le split réarmées ;
 *  - données par action : shares_outstanding × ratio, BNPA / dividende / ANC par action ÷ ratio.
 * Idempotent : refuse de tourner si le split est déjà enregistré avec history_adjusted.
 */
import prisma from '../src/config/prisma';
import { cacheDelete, cacheInvalidatePattern } from '../src/services/cache.service';

const SOURCE_DEFAULT = 'manual';
const round = (x: number, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const srcIdx = args.indexOf('--source');
  const source = srcIdx >= 0 ? args[srcIdx + 1] : SOURCE_DEFAULT;
  const [ticker, exIso, ratioArg] = args.filter((a, i) => !a.startsWith('--') && (srcIdx < 0 || i !== srcIdx + 1));
  const ratio = Number(ratioArg);
  if (!ticker || !/^\d{4}-\d{2}-\d{2}$/.test(exIso ?? '') || !(ratio > 0) || ratio === 1) {
    console.log('Usage : applyStockSplit.ts TICKER AAAA-MM-JJ RATIO [--apply] [--source "Avis BRVM ..."]');
    return;
  }
  const type = ratio > 1 ? 'SPLIT' : 'REVERSE_SPLIT';
  const exDate = new Date(`${exIso}T00:00:00.000Z`);
  // Les imports Excel datent certaines séances à 22:00/23:00 UTC la veille : une ligne
  // à partir de J-1 22:00 UTC appartient déjà à la séance de l'ex-date.
  const historyCut = new Date(exDate.getTime() - 2 * 3600e3);

  console.log(`${apply ? 'APPLICATION' : 'SIMULATION'} — ${ticker} ${type} ×${ratio} au ${exIso}\n`);

  const stock = await prisma.stock.findUnique({ where: { symbol: ticker } });
  if (!stock) throw new Error(`Titre ${ticker} introuvable`);
  const existing = await prisma.corporateAction.findUnique({
    where: { stock_ticker_type_ex_date: { stock_ticker: ticker, type, ex_date: exDate } },
  });
  if (existing?.history_adjusted) {
    console.log('Déjà appliqué (CorporateAction history_adjusted=true). Rien à faire.');
    return;
  }

  // --- Contrôle de cohérence autour de l'ex-date -------------------------------------
  const around = await prisma.stockHistory.findMany({
    where: { stock_ticker: ticker, date: { gte: new Date(exDate.getTime() - 10 * 864e5), lte: new Date(exDate.getTime() + 10 * 864e5) } },
    orderBy: { date: 'asc' },
    select: { date: true, close: true, volume: true },
  });
  console.log('Historique autour de l’ex-date (brut actuel → après) :');
  for (const r of around) {
    const adj = r.date < historyCut;
    console.log(`  ${r.date.toISOString().slice(0, 16)}  ${String(r.close).padStart(9)} → ${adj ? round(r.close / ratio, 2) : r.close}${adj ? '' : '  (inchangé)'}`);
  }
  console.log(`Cours actuel : ${stock.current_price} (clôture préc. ${stock.previous_close})\n`);

  const histCount = await prisma.stockHistory.count({ where: { stock_ticker: ticker, date: { lt: historyCut } } });
  const intraCount = await prisma.intradaySnapshot.count({ where: { stock_ticker: ticker, timestamp: { lt: exDate } } });
  const txBefore = await prisma.transaction.count({ where: { stock_ticker: ticker, created_at: { lt: exDate } } });
  console.log(`StockHistory à ajuster : ${histCount} séances ; IntradaySnapshot : ${intraCount} ; transactions simulateur : ${txBefore}`);

  // --- Positions du simulateur --------------------------------------------------------
  const positions = await prisma.position.findMany({ where: { stock_ticker: ticker } });
  const txAfter = await prisma.transaction.findMany({
    where: { stock_ticker: ticker, created_at: { gte: exDate } },
    orderBy: { created_at: 'asc' },
  });
  const afterBy = new Map<string, typeof txAfter>();
  for (const t of txAfter) afterBy.set(t.portfolioId, [...(afterBy.get(t.portfolioId) ?? []), t]);

  // Prix d'une opération postérieure manifestement exécutée dans l'ancienne base (cours périmé)
  const refNew = stock.current_price || 0;
  const stale = txAfter.filter(t => refNew > 0 && (ratio > 1 ? t.price_per_share > refNew * ratio / 2 : t.price_per_share < refNew * ratio * 2));
  if (stale.length) {
    console.log(`\n⚠ ${stale.length} transaction(s) postérieure(s) à l'ex-date au cours de l'ancienne base (à traiter à la main) :`);
    for (const t of stale) console.log(`  ${t.id} ${t.type} ${t.quantity} @ ${t.price_per_share} le ${t.created_at?.toISOString()} (portefeuille ${t.portfolioId})`);
  }

  const posUpdates: { id: string; quantity: number; average_buy_price: number }[] = [];
  const manual: string[] = [];
  for (const p of positions) {
    // Revenir à l'état d'avant l'ex-date en défaisant les opérations postérieures
    const later = afterBy.get(p.portfolioId) ?? [];
    let q = p.quantity, a = p.average_buy_price;
    for (const t of [...later].reverse()) {
      if (t.type === 'SELL') q += t.quantity;
      else {
        const q0 = q - t.quantity;
        a = q0 > 0 ? (a * q - t.price_per_share * t.quantity) / q0 : 0;
        q = q0;
      }
    }
    if (q < -1e-9 || !Number.isFinite(a) || (q > 0 && a <= 0)) { manual.push(`${p.id} (portefeuille ${p.portfolioId})`); continue; }
    if (q <= 1e-9) continue; // position entièrement ouverte après l'ex-date
    // Ajuster la part d'avant, puis rejouer les opérations postérieures
    q = round(q * ratio, 6); a = a / ratio;
    for (const t of later) {
      if (t.type === 'SELL') q -= t.quantity;
      else { a = (a * q + t.price_per_share * t.quantity) / (q + t.quantity); q += t.quantity; }
    }
    posUpdates.push({ id: p.id, quantity: round(q, 6), average_buy_price: round(a) });
  }
  console.log(`\nPositions simulateur : ${positions.length} (${posUpdates.length} ajustées, ${afterBy.size} portefeuille(s) avec opérations post-split rejouées)`);
  for (const u of posUpdates.slice(0, 5)) {
    const p = positions.find(x => x.id === u.id)!;
    console.log(`  ${p.quantity} @ ${round(p.average_buy_price, 2)} → ${u.quantity} @ ${round(u.average_buy_price, 2)}`);
  }
  if (manual.length) console.log(`⚠ Positions incohérentes, non modifiées : ${manual.join(', ')}`);

  // --- Alertes de prix ----------------------------------------------------------------
  const alerts = await prisma.priceAlert.findMany({ where: { stock_ticker: ticker } });
  const activeAlerts = alerts.filter(al => al.is_active && !al.is_notified);
  const falseTriggers = alerts.filter(al => al.is_notified && al.triggered_at && al.triggered_at >= exDate &&
    al.triggered_price != null && (ratio > 1 ? al.alert_type === 'BELOW' && al.triggered_price * 3 < al.target_price
                                            : al.alert_type === 'ABOVE' && al.triggered_price > al.target_price * 3));
  console.log(`\nAlertes : ${activeAlerts.length} actives à rebaser, ${falseTriggers.length} déclenchées à tort par le split à réarmer`);

  // --- Données par action -------------------------------------------------------------
  const fund = await prisma.stockFundamental.findUnique({ where: { stock_ticker: ticker } });
  const annual = await prisma.annualFinancials.findMany({ where: { stock_ticker: ticker }, orderBy: { year: 'asc' } });
  // book_value : ANC par action si < 1e6 (sinon c'est un total de capitaux propres)
  const bvPerShare = fund?.book_value != null && fund.book_value < 1e6;
  console.log(`\nStock.shares_outstanding : ${stock.shares_outstanding} → ${stock.shares_outstanding != null ? stock.shares_outstanding * ratio : '—'}`);
  if (fund) console.log(`StockFundamental : titres ${fund.shares_outstanding} → ${fund.shares_outstanding != null ? fund.shares_outstanding * ratio : '—'}, BNPA ${fund.eps} → ${fund.eps != null ? round(fund.eps / ratio) : '—'}, book_value ${fund.book_value}${bvPerShare ? ` → ${round(fund.book_value! / ratio)}` : ' (total, inchangé)'}`);
  for (const r of annual) console.log(`  ${r.year} : BNPA ${r.eps} → ${r.eps != null ? round(r.eps / ratio) : '—'} ; dividende ${r.dividend} → ${r.dividend != null ? round(r.dividend / ratio) : '—'}`);

  if (!apply) {
    console.log('\nSimulation terminée. Relancer avec --apply pour écrire.');
    return;
  }

  // --- Écriture (transaction unique) --------------------------------------------------
  const ops = [
    prisma.corporateAction.upsert({
      where: { stock_ticker_type_ex_date: { stock_ticker: ticker, type, ex_date: exDate } },
      update: { ratio, verified: true, history_adjusted: true, source },
      create: { stock_ticker: ticker, type, ex_date: exDate, ratio, verified: true, history_adjusted: true, source },
    }),
    prisma.stockHistory.updateMany({
      where: { stock_ticker: ticker, date: { lt: historyCut } },
      data: { open: { divide: ratio }, high: { divide: ratio }, low: { divide: ratio }, close: { divide: ratio }, volume: { multiply: ratio } },
    }),
    prisma.intradaySnapshot.updateMany({
      where: { stock_ticker: ticker, timestamp: { lt: exDate } },
      data: { price: { divide: ratio }, volume: { multiply: ratio } },
    }),
    prisma.transaction.updateMany({
      where: { stock_ticker: ticker, created_at: { lt: exDate } },
      data: { quantity: { multiply: ratio }, price_per_share: { divide: ratio } },
    }),
    ...posUpdates.map(u => prisma.position.update({ where: { id: u.id }, data: { quantity: u.quantity, average_buy_price: u.average_buy_price } })),
    ...activeAlerts.map(al => prisma.priceAlert.update({ where: { id: al.id }, data: { target_price: round(al.target_price / ratio, 2) } })),
    ...falseTriggers.map(al => prisma.priceAlert.update({
      where: { id: al.id },
      data: { target_price: round(al.target_price / ratio, 2), is_active: true, is_notified: false, triggered_at: null, triggered_price: null },
    })),
    ...(stock.shares_outstanding != null
      ? [prisma.stock.update({ where: { symbol: ticker }, data: { shares_outstanding: stock.shares_outstanding * ratio } })]
      : []),
    ...(fund ? [prisma.stockFundamental.update({
      where: { stock_ticker: ticker },
      data: {
        ...(fund.shares_outstanding != null ? { shares_outstanding: fund.shares_outstanding * ratio } : {}),
        ...(fund.eps != null ? { eps: round(fund.eps / ratio) } : {}),
        ...(bvPerShare ? { book_value: round(fund.book_value! / ratio) } : {}),
      },
    })] : []),
    ...annual.map(r => prisma.annualFinancials.update({
      where: { id: r.id },
      data: {
        ...(r.eps != null ? { eps: round(r.eps / ratio) } : {}),
        ...(r.dividend != null ? { dividend: round(r.dividend / ratio) } : {}),
      },
    })),
    // L'analyse SIMBA en cache commenterait une « chute » de 90 % : régénération
    prisma.stockAIAnalysis.deleteMany({ where: { stock_ticker: ticker } }),
  ];
  await prisma.$transaction(ops);

  await cacheDelete(`stock:${ticker}`);
  await cacheInvalidatePattern('stocks:*');
  console.log(`\n✅ Split appliqué (${ops.length} opérations). Caches stock:${ticker} et stocks:* vidés.`);
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
