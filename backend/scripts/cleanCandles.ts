/**
 * Nettoyage des bougies journalieres (collection `stock_history`).
 *
 * Deux operations, independantes :
 *
 *   --weekend  Supprime les bougies datees d'un samedi ou d'un dimanche.
 *              La BRVM ne cote que du lundi au vendredi : ces lignes sont soit
 *              des copies de la seance du vendredi, soit des dechets d'anciens
 *              imports (valeurs a l'echelle fausse qui creent un pic sur le
 *              graphique long terme).
 *
 *   --ohlc     Recadre les bougies dont l'OHLC est impossible :
 *              high = max(O,H,L,C) et low = min(O,H,L,C).
 *              Corrige le defaut systematique ou `low` a ete ecrit egal a
 *              `high`, ce qui place le plus-bas au-dessus de la cloture.
 *              N'invente aucune donnee : on ne fait que rendre la bougie
 *              coherente avec les prix deja presents.
 *
 * MODE PAR DEFAUT : DRY-RUN. Rien n'est ecrit sans `--apply`.
 * En mode --apply, les lignes touchees sont d'abord sauvegardees dans
 * backend/exports/clean-candles-backup-<horodatage>.json.
 *
 * Build & run :
 *   npx esbuild scripts/cleanCandles.ts --bundle --platform=node \
 *     --packages=external --outfile=scripts/.cleanCandles.cjs --format=cjs
 *   node scripts/.cleanCandles.cjs                  # dry-run, les deux operations
 *   node scripts/.cleanCandles.cjs --weekend        # dry-run, week-end seul
 *   node scripts/.cleanCandles.cjs --apply          # applique
 */
/// <reference types="node" />
import dns from 'dns';
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';
import path from 'path';
import fs from 'fs';

// --- Contournements DNS pour le cluster Atlas M0 (cf. exportAllStockHistory.ts) ---
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  dns.promises.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch { /* noop */ }
const enodata = Object.assign(new Error('queryTxt ENODATA'), { code: 'ENODATA' });
(dns as any).resolveTxt = (_n: string, cb: Function) => process.nextTick(() => cb(enodata));
(dns.promises as any).resolveTxt = async () => { throw enodata; };

/**
 * Neutraliser la resolution TXT fait perdre les options portees par le record
 * SRV d'Atlas, dont `authSource=admin`. Sans elle le driver authentifie contre
 * la base du chemin (`afribourse`), ou l'utilisateur n'existe pas -> "bad auth".
 */
function withAuthSource(uri: string): string {
  if (/[?&]authSource=/.test(uri)) return uri;
  return uri + (uri.includes('?') ? '&' : '?') + 'authSource=admin';
}

type Candle = {
  _id: ObjectId;
  stock_ticker: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const DOW = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
const key = (d: Date) => d.toISOString().slice(0, 10);
const isWeekend = (d: Date) => d.getUTCDay() === 0 || d.getUTCDay() === 6;
const CHUNK = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const onlyWeekend = argv.includes('--weekend');
  const onlyOhlc = argv.includes('--ohlc');
  // Aucun filtre -> les deux operations
  const doWeekend = onlyWeekend || !onlyOhlc;
  const doOhlc = onlyOhlc || !onlyWeekend;

  console.log('');
  console.log(apply ? '*** MODE APPLICATION — ECRITURE EN BASE ***' : '--- MODE DRY-RUN — aucune ecriture ---');
  console.log('operations : ' + [doWeekend && 'week-end', doOhlc && 'ohlc'].filter(Boolean).join(' + '));
  console.log('');

  const raw = process.env.DATABASE_URI;
  if (!raw) throw new Error('DATABASE_URI manquant dans .env');
  const client = new MongoClient(withAuthSource(raw), { serverSelectionTimeoutMS: 30000 });
  await client.connect();
  const db = client.db();
  const col = db.collection('stock_history');

  const before = await col.countDocuments();
  const hist = (await col
    .find({}, { projection: { stock_ticker: 1, date: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 } })
    .sort({ stock_ticker: 1, date: 1 })
    .toArray()) as unknown as Candle[];
  console.log('bougies en base : ' + before);

  // ---------- Operation 1 : bougies de week-end ----------
  const weekendRows = doWeekend ? hist.filter(h => isWeekend(h.date)) : [];

  // Repere les lignes dont les valeurs ne sont pas une copie de la seance
  // precedente : anciens imports a l'echelle fausse, qui creent un pic.
  const byTickerDate = new Map<string, Candle>();
  for (const h of hist) byTickerDate.set(h.stock_ticker + '|' + key(h.date), h);
  const prevTradingDay = (d: Date): Date => {
    const x = new Date(d);
    do { x.setUTCDate(x.getUTCDate() - 1); } while (isWeekend(x));
    return x;
  };

  if (doWeekend) {
    let copies = 0;
    const oddballs: Candle[] = [];
    for (const h of weekendRows) {
      const ref = byTickerDate.get(h.stock_ticker + '|' + key(prevTradingDay(h.date)));
      if (ref && ref.open === h.open && ref.high === h.high && ref.low === h.low && ref.close === h.close) copies++;
      else oddballs.push(h);
    }
    const dates = Array.from(new Set(weekendRows.map(h => key(h.date)))).sort();
    console.log('');
    console.log('='.repeat(74));
    console.log('1. SUPPRESSION DES BOUGIES DE WEEK-END');
    console.log('='.repeat(74));
    console.log('a supprimer                      : ' + weekendRows.length);
    console.log('  copies de la seance precedente : ' + copies);
    console.log('  valeurs divergentes            : ' + oddballs.length + '  (anciens imports)');
    console.log('dates concernees (' + dates.length + ') :');
    for (const d of chunk(dates, 7)) console.log('   ' + d.join('  '));
    if (oddballs.length) {
      console.log('  -- lignes divergentes (echantillon) --');
      for (const h of oddballs.slice(0, 10)) {
        const ref = byTickerDate.get(h.stock_ticker + '|' + key(prevTradingDay(h.date)));
        console.log('     ' + h.stock_ticker.padEnd(7) + ' ' + key(h.date) + ' ' + DOW[h.date.getUTCDay()] +
          '  O' + h.open + ' H' + h.high + ' L' + h.low + ' C' + h.close +
          (ref ? '   | seance precedente: C' + ref.close : '   | pas de seance precedente'));
      }
    }
  }

  // ---------- Operation 2 : recadrage OHLC ----------
  type Fix = { row: Candle; high: number; low: number };
  const fixes: Fix[] = [];
  if (doOhlc) {
    const weekendIds = new Set(weekendRows.map(h => String(h._id)));
    for (const h of hist) {
      // Inutile de corriger une ligne qui va etre supprimee
      if (weekendIds.has(String(h._id))) continue;
      const high = Math.max(h.open, h.high, h.low, h.close);
      const low = Math.min(h.open, h.high, h.low, h.close);
      if (high !== h.high || low !== h.low) fixes.push({ row: h, high, low });
    }
    console.log('');
    console.log('='.repeat(74));
    console.log('2. RECADRAGE DES OHLC IMPOSSIBLES');
    console.log('='.repeat(74));
    console.log('a corriger : ' + fixes.length);
    const perTicker = new Map<string, number>();
    for (const f of fixes) perTicker.set(f.row.stock_ticker, (perTicker.get(f.row.stock_ticker) ?? 0) + 1);
    const top = Array.from(perTicker.entries()).sort((a, b) => b[1] - a[1]);
    console.log('  par ticker : ' + top.map(([t, n]) => t + ':' + n).join(', '));
    console.log('  -- echantillon --');
    for (const f of fixes.slice(0, 10)) {
      console.log('     ' + f.row.stock_ticker.padEnd(7) + ' ' + key(f.row.date) +
        '  O' + f.row.open + ' C' + f.row.close +
        '   H ' + f.row.high + '->' + f.high + '   L ' + f.row.low + '->' + f.low);
    }
  }

  // ---------- Execution ----------
  if (!apply) {
    console.log('');
    console.log('='.repeat(74));
    console.log('DRY-RUN — rien n\'a ete ecrit.');
    console.log('  suppressions prevues : ' + weekendRows.length);
    console.log('  corrections prevues  : ' + fixes.length);
    console.log('  total apres          : ' + (before - weekendRows.length) + ' bougies');
    console.log('Relancer avec --apply pour executer.');
    console.log('='.repeat(74));
    await client.close();
    return;
  }

  // Sauvegarde locale des lignes touchees avant toute ecriture
  const exportsDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(exportsDir, 'clean-candles-backup-' + stamp + '.json');
  fs.writeFileSync(backupPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    deleted_weekend: weekendRows,
    clamped_ohlc: fixes.map(f => ({ before: f.row, after: { high: f.high, low: f.low } })),
  }, null, 2), 'utf-8');
  console.log('');
  console.log('sauvegarde ecrite : ' + backupPath);

  let deleted = 0;
  for (const batch of chunk(weekendRows.map(h => h._id), CHUNK)) {
    const res = await col.deleteMany({ _id: { $in: batch } });
    deleted += res.deletedCount ?? 0;
    process.stdout.write('\r  suppression : ' + deleted + '/' + weekendRows.length);
  }
  if (weekendRows.length) console.log('');

  let updated = 0;
  for (const batch of chunk(fixes, CHUNK)) {
    const ops = batch.map(f => ({
      updateOne: { filter: { _id: f.row._id }, update: { $set: { high: f.high, low: f.low } } },
    }));
    const res = await col.bulkWrite(ops, { ordered: false });
    updated += res.modifiedCount ?? 0;
    process.stdout.write('\r  correction  : ' + updated + '/' + fixes.length);
  }
  if (fixes.length) console.log('');

  const after = await col.countDocuments();
  console.log('');
  console.log('='.repeat(74));
  console.log('TERMINE');
  console.log('  supprimees : ' + deleted);
  console.log('  corrigees  : ' + updated);
  console.log('  bougies    : ' + before + ' -> ' + after);
  console.log('='.repeat(74));

  // Verification : plus aucune ligne de week-end ni d'OHLC impossible
  const check = (await col
    .find({}, { projection: { stock_ticker: 1, date: 1, open: 1, high: 1, low: 1, close: 1 } })
    .toArray()) as unknown as Candle[];
  const leftWeekend = check.filter(h => isWeekend(h.date)).length;
  const leftBad = check.filter(h =>
    h.high < Math.max(h.open, h.close) || h.low > Math.min(h.open, h.close) || h.high < h.low).length;
  console.log('verification — week-end restants : ' + leftWeekend + ' | OHLC impossibles restants : ' + leftBad);

  await client.close();
}

main().catch((e) => { console.error('ERREUR:', e?.message ?? e); process.exit(1); });
