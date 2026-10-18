/**
 * Référentiel du portefeuille réel : splits et dates de cotation.
 *
 *   npx tsx scripts/realPortfolioReferential.ts detect [sortie.json]
 *     Lecture seule. Détecte dans StockHistory les changements de niveau
 *     persistants (splits probables) et propose des dates de cotation pour les
 *     titres dont l'historique commence après le début de la collecte.
 *
 *   npx tsx scripts/realPortfolioReferential.ts apply fichier.json
 *     Insère / met à jour UNIQUEMENT les entrées marquées "approved": true
 *     (après vérification humaine : avis BRVM, communiqués émetteurs).
 *     Les splits sont alors enregistrés verified=true et utilisés par le moteur.
 */
import fs from 'fs';
import prisma from '../src/config/prisma';

const NICE_RATIOS = [2, 3, 4, 5, 6, 8, 10, 20, 25, 50, 100];
const COLLECTION_START = '2014-06-01'; // la plupart des historiques démarrent en février 2014

type SplitCandidate = {
  approved: boolean;
  stock_ticker: string;
  type: 'SPLIT' | 'REVERSE_SPLIT';
  ex_date: string;
  ratio: number;
  observed_ratio: number;
  level_before: number;
  level_after: number;
  noisy_rows_around: number;
  note: string;
};
type ListingCandidate = { approved: boolean; stock_ticker: string; listed_at: string; note: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

function nearestNice(r: number): number | null {
  const inv = r < 1;
  const x = inv ? 1 / r : r;
  const best = NICE_RATIOS.reduce((b, n) => (Math.abs(n / x - 1) < Math.abs(b / x - 1) ? n : b), NICE_RATIOS[0]);
  if (Math.abs(best / x - 1) > 0.1) return null;
  return inv ? 1 / best : best;
}

async function detect(out: string) {
  const stocks = await prisma.stock.findMany({ select: { symbol: true, listed_at: true } });
  const splits: SplitCandidate[] = [];
  const listings: ListingCandidate[] = [];
  const W = 10;

  for (const { symbol, listed_at } of stocks) {
    const rows = await prisma.stockHistory.findMany({
      where: { stock_ticker: symbol, close: { gt: 0 } },
      select: { date: true, close: true },
      orderBy: { date: 'asc' },
    });
    if (rows.length === 0) continue;

    const first = iso(rows[0].date);
    if (!listed_at && first > COLLECTION_START) {
      listings.push({ approved: false, stock_ticker: symbol, listed_at: first, note: 'Première cotation en base — confirmer la date d’introduction BRVM.' });
    }

    let lastIdx = -W;
    for (let i = W; i < rows.length - W; i++) {
      if (i - lastIdx < W) continue;
      const before = median(rows.slice(i - W, i).map(r => r.close));
      const after = median(rows.slice(i, i + W).map(r => r.close));
      if (!before || !after) continue;
      const r = before / after; // >1 : split (le cours baisse)
      // Seuil 1,85 : en deçà, les « sauts » de titres peu liquides sont des mouvements de marché.
      if (r < 1.85 && r > 1 / 1.85) continue;
      // Le saut doit se produire exactement ici : la séance précédente est encore au niveau « avant ».
      const prevClose = rows[i - 1].close, curClose = rows[i].close;
      if (Math.abs(prevClose / before - 1) > 0.35 || Math.abs(curClose / after - 1) > 0.35) continue;
      const nice = nearestNice(r);
      if (!nice) continue;
      const day = rows[i].date.getTime();
      const noisy = rows.filter((x, k) => k > 0 && Math.abs(x.date.getTime() - day) < 45 * 864e5 &&
        (x.close / rows[k - 1].close > 3 || x.close / rows[k - 1].close < 1 / 3)).length;
      splits.push({
        approved: false,
        stock_ticker: symbol,
        type: nice >= 1 ? 'SPLIT' : 'REVERSE_SPLIT',
        ex_date: iso(rows[i].date),
        ratio: nice,
        observed_ratio: +r.toFixed(3),
        level_before: before,
        level_after: after,
        noisy_rows_around: noisy,
        note: noisy > 2 ? 'Zone bruitée (lignes parasites) : vérifier la date exacte.' : '',
      });
      lastIdx = i;
    }
  }

  fs.writeFileSync(out, JSON.stringify({ generated_at: new Date().toISOString(), splits, listings }, null, 2));
  console.log(`${splits.length} splits candidats, ${listings.length} dates de cotation candidates → ${out}`);
  for (const s of splits) console.log(`  ${s.stock_ticker.padEnd(6)} ${s.ex_date}  ${s.type} ×${s.ratio}  (observé ${s.observed_ratio}, bruit ${s.noisy_rows_around})`);
  for (const l of listings) console.log(`  ${l.stock_ticker.padEnd(6)} coté depuis ~${l.listed_at}`);
}

async function apply(file: string) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as { splits?: SplitCandidate[]; listings?: ListingCandidate[] };
  let s = 0, l = 0;
  for (const c of data.splits ?? []) {
    if (!c.approved) continue;
    if (!(c.ratio > 0)) throw new Error(`Ratio invalide pour ${c.stock_ticker} ${c.ex_date}`);
    const ex_date = new Date(`${c.ex_date}T00:00:00.000Z`);
    await prisma.corporateAction.upsert({
      where: { stock_ticker_type_ex_date: { stock_ticker: c.stock_ticker, type: c.type, ex_date } },
      update: { ratio: c.ratio, verified: true, note: c.note || null, source: 'manual-review' },
      create: { stock_ticker: c.stock_ticker, type: c.type, ex_date, ratio: c.ratio, verified: true, note: c.note || null, source: 'manual-review' },
    });
    s++;
  }
  for (const c of data.listings ?? []) {
    if (!c.approved) continue;
    await prisma.stock.update({ where: { symbol: c.stock_ticker }, data: { listed_at: new Date(`${c.listed_at}T00:00:00.000Z`) } });
    l++;
  }
  console.log(`${s} opérations sur titres et ${l} dates de cotation enregistrées.`);
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  try {
    if (cmd === 'detect') await detect(arg || 'real-portfolio-referential.json');
    else if (cmd === 'apply' && arg) await apply(arg);
    else console.log('Usage : detect [sortie.json] | apply fichier.json');
  } finally {
    await prisma.$disconnect();
  }
})();
