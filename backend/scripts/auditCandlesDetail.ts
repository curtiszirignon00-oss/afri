/**
 * AUDIT LECTURE SEULE — second niveau : quantifie l'effet de chaque nettoyage
 * envisage avant de l'appliquer. N'ecrit RIEN.
 *
 *   npx esbuild scripts/auditCandlesDetail.ts --bundle --platform=node \
 *     --packages=external --outfile=scripts/.auditCandlesDetail.cjs --format=cjs
 *   node scripts/.auditCandlesDetail.cjs
 */
/// <reference types="node" />
import dns from 'dns';
import 'dotenv/config';
import { MongoClient } from 'mongodb';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.promises.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch { /* noop */ }
const enodata = Object.assign(new Error('queryTxt ENODATA'), { code: 'ENODATA' });
(dns as any).resolveTxt = (_n: string, cb: Function) => process.nextTick(() => cb(enodata));
(dns.promises as any).resolveTxt = async () => { throw enodata; };

function withAuthSource(uri: string): string {
  if (/[?&]authSource=/.test(uri)) return uri;
  return uri + (uri.includes('?') ? '&' : '?') + 'authSource=admin';
}

type Candle = { stock_ticker: string; date: Date; open: number; high: number; low: number; close: number; volume: number };
type Snap = { stock_ticker: string; timestamp: Date; price: number; volume: number };

const DOW = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const key = (d: Date) => d.toISOString().slice(0, 10);
const mins = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes();
const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;

async function main() {
  const raw = process.env.DATABASE_URI;
  if (!raw) throw new Error('DATABASE_URI manquant');
  const client = new MongoClient(withAuthSource(raw), { serverSelectionTimeoutMS: 30000 });
  await client.connect();
  const db = client.db();

  const hist = (await db.collection('stock_history')
    .find({}, { projection: { stock_ticker: 1, date: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 } })
    .sort({ stock_ticker: 1, date: 1 }).toArray()) as unknown as Candle[];

  // ---------- 1. Les bougies de week-end sont-elles des copies du vendredi ? ----------
  const byTickerDate = new Map<string, Candle>();
  for (const h of hist) byTickerDate.set(h.stock_ticker + '|' + key(h.date), h);

  const prevTradingDay = (d: Date): Date => {
    const x = new Date(d);
    do { x.setUTCDate(x.getUTCDate() - 1); } while (isWeekend(x));
    return x;
  };

  const weekend = hist.filter(h => isWeekend(h.date));
  let wkCopy = 0, wkDiff = 0;
  const wkDiffSamples: string[] = [];
  for (const h of weekend) {
    const ref = byTickerDate.get(h.stock_ticker + '|' + key(prevTradingDay(h.date)));
    if (ref && ref.open === h.open && ref.high === h.high && ref.low === h.low && ref.close === h.close) wkCopy++;
    else {
      wkDiff++;
      if (wkDiffSamples.length < 8) {
        wkDiffSamples.push(`${h.stock_ticker.padEnd(7)} ${key(h.date)} ${DOW[h.date.getUTCDay()]} ` +
          `O${h.open} H${h.high} L${h.low} C${h.close}` +
          (ref ? `  | vendredi: O${ref.open} H${ref.high} L${ref.low} C${ref.close}` : '  | pas de seance precedente'));
      }
    }
  }
  console.log('='.repeat(74));
  console.log('1. BOUGIES DE WEEK-END');
  console.log('='.repeat(74));
  console.log('total                      : ' + weekend.length);
  console.log('  copie exacte du vendredi : ' + wkCopy);
  console.log('  differentes du vendredi  : ' + wkDiff);
  if (wkDiffSamples.length) {
    console.log('  -- echantillon des differentes --');
    for (const s of wkDiffSamples) console.log('     ' + s);
  }
  const wkDates = Array.from(new Set(weekend.map(h => key(h.date)))).sort();
  console.log('  dates concernees (' + wkDates.length + ') : ' + wkDates.join(', '));

  // ---------- 2. Jours ouvres ou TOUT le marche est identique a la veille (feries probables) ----------
  const perDate = new Map<string, Candle[]>();
  for (const h of hist) {
    const k = key(h.date);
    if (!perDate.has(k)) perDate.set(k, []);
    perDate.get(k)!.push(h);
  }
  console.log('');
  console.log('='.repeat(74));
  console.log('2. JOURS OUVRES SUSPECTS (tout le marche identique a la veille)');
  console.log('='.repeat(74));
  const suspects: { d: string; dow: string; n: number }[] = [];
  for (const [k, rows] of perDate) {
    const d = new Date(k + 'T00:00:00.000Z');
    if (isWeekend(d)) continue;
    if (rows.length < 20) continue; // besoin d'un echantillon representatif
    const prev = key(prevTradingDay(d));
    let same = 0, cmp = 0;
    for (const h of rows) {
      const ref = byTickerDate.get(h.stock_ticker + '|' + prev);
      if (!ref) continue;
      cmp++;
      if (ref.open === h.open && ref.high === h.high && ref.low === h.low && ref.close === h.close) same++;
    }
    if (cmp >= 20 && same === cmp) suspects.push({ d: k, dow: DOW[d.getUTCDay()], n: cmp });
  }
  suspects.sort((a, b) => a.d.localeCompare(b.d));
  console.log('jours trouves : ' + suspects.length + '  (candidats jours feries / absence de cotation)');
  for (const s of suspects) console.log('   ' + s.d + ' ' + s.dow + '  (' + s.n + ' tickers identiques a la seance precedente)');

  // ---------- 3. Effet du backfill des meches depuis les snapshots ----------
  const snaps = (await db.collection('intraday_snapshots')
    .find({}, { projection: { stock_ticker: 1, timestamp: 1, price: 1, volume: 1 } })
    .sort({ timestamp: 1 }).toArray()) as unknown as Snap[];

  // Snapshots retenus : jour ouvre, 09h45 -> 15h15
  const inWindow = snaps.filter(s => !isWeekend(s.timestamp) && mins(s.timestamp) >= 585 && mins(s.timestamp) <= 915);
  const extremes = new Map<string, { min: number; max: number; n: number }>();
  for (const s of inWindow) {
    const k = s.stock_ticker + '|' + key(s.timestamp);
    const e = extremes.get(k);
    if (!e) extremes.set(k, { min: s.price, max: s.price, n: 1 });
    else { e.min = Math.min(e.min, s.price); e.max = Math.max(e.max, s.price); e.n++; }
  }

  console.log('');
  console.log('='.repeat(74));
  console.log('3. BACKFILL DES MECHES DEPUIS LES SNAPSHOTS INTRADAY');
  console.log('='.repeat(74));
  console.log('snapshots retenus (09h45-15h15, jours ouvres) : ' + inWindow.length);
  console.log('couples ticker/jour couverts                  : ' + extremes.size);

  let wouldChange = 0, wouldGainWick = 0, noChange = 0, noSnap = 0;
  const samples: string[] = [];
  for (const h of hist) {
    const e = extremes.get(h.stock_ticker + '|' + key(h.date));
    if (!e) { noSnap++; continue; }
    const newHigh = Math.max(h.open, h.close, h.high, e.max);
    const newLow = Math.min(h.open, h.close, h.low, e.min);
    const hadWick = !(h.high === Math.max(h.open, h.close) && h.low === Math.min(h.open, h.close));
    const willHaveWick = !(newHigh === Math.max(h.open, h.close) && newLow === Math.min(h.open, h.close));
    if (newHigh !== h.high || newLow !== h.low) {
      wouldChange++;
      if (!hadWick && willHaveWick) wouldGainWick++;
      if (samples.length < 10) {
        samples.push(`${h.stock_ticker.padEnd(7)} ${key(h.date)}  O${h.open} C${h.close}  ` +
          `H ${h.high}->${newHigh}  L ${h.low}->${newLow}  (${e.n} snapshots)`);
      }
    } else noChange++;
  }
  console.log('bougies journalieres modifiees                : ' + wouldChange);
  console.log('  dont qui gagnent une vraie meche            : ' + wouldGainWick);
  console.log('bougies couvertes mais inchangees             : ' + noChange);
  console.log('bougies sans snapshot (hors periode)          : ' + noSnap);
  if (samples.length) {
    console.log('  -- echantillon --');
    for (const s of samples) console.log('     ' + s);
  }

  // ---------- 4. Snapshots hors fenetre (candidats suppression) ----------
  const outPre = snaps.filter(s => !isWeekend(s.timestamp) && mins(s.timestamp) < 585);
  const outPost = snaps.filter(s => !isWeekend(s.timestamp) && mins(s.timestamp) > 915);
  const outWk = snaps.filter(s => isWeekend(s.timestamp));
  console.log('');
  console.log('='.repeat(74));
  console.log('4. SNAPSHOTS HORS FENETRE (candidats suppression)');
  console.log('='.repeat(74));
  console.log('avant 09h45 : ' + outPre.length);
  console.log('apres 15h15 : ' + outPost.length);
  console.log('week-end    : ' + outWk.length);
  console.log('TOTAL       : ' + (outPre.length + outPost.length + outWk.length) + ' / ' + snaps.length);

  // ---------- 5. OHLC incoherent : effet du recadrage ----------
  let clamp = 0;
  const clampSamples: string[] = [];
  for (const h of hist) {
    const nh = Math.max(h.open, h.high, h.low, h.close);
    const nl = Math.min(h.open, h.high, h.low, h.close);
    if (nh !== h.high || nl !== h.low) {
      clamp++;
      if (clampSamples.length < 8) {
        clampSamples.push(`${h.stock_ticker.padEnd(7)} ${key(h.date)}  O${h.open} C${h.close}  H ${h.high}->${nh}  L ${h.low}->${nl}`);
      }
    }
  }
  console.log('');
  console.log('='.repeat(74));
  console.log('5. OHLC INCOHERENT : effet du recadrage high=max / low=min');
  console.log('='.repeat(74));
  console.log('bougies corrigees : ' + clamp);
  for (const s of clampSamples) console.log('     ' + s);

  await client.close();
}

main().catch((e) => { console.error('ERREUR:', e?.message ?? e); process.exit(1); });
