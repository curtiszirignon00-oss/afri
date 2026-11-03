/// <reference types="node" />
// Importe les donnees financieres annuelles copiees depuis madisinvest.com
// (page https://madisinvest.com/valeurs/<TICKER>, onglet "Donnees financieres")
// et alimente :
//   - AnnualFinancials : une ligne par exercice (agregats + ratios)
//   - StockFundamental : photo du dernier exercice
//
// Saisie : un fichier texte par titre dans scripts/madis/<TICKER>.txt, contenant
// le copier-coller brut de l'onglet (Compte de resultat, Bilan, Ratios d'analyse).
// Montants en millions de FCFA, ratios en % : memes unites qu'en base.
//
// Les ratios publies par Madis ne sont pas toujours coherents avec leurs propres
// agregats (SDSC 2025 : ROA affiche 1,22 % pour 785 / 259 448 = 0,30 %). On
// recalcule donc ROE, ROA, marge nette et marge operationnelle a partir des
// agregats et on signale tout ecart > 0,5 point avec la valeur Madis. Seul le
// coefficient d'exploitation, non calculable ici, est repris tel quel.
//
// Champs non touches : BNPA historique, PER historique, dividende (absents de Madis).
//
// Usage :
//   npx tsx scripts/importMadisFinancials.ts              -> dry-run, tous les fichiers
//   npx tsx scripts/importMadisFinancials.ts SDSC SNTS    -> dry-run, titres choisis
//   npx tsx scripts/importMadisFinancials.ts --apply      -> ecrit en base
//   ... --apply --force                                   -> impose Madis meme en cas de conflit

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--')).map((a) => a.toUpperCase());
const DIR = path.join(__dirname, 'madis');
const FORCE = process.argv.includes('--force');
const RATIO_TOLERANCE = 0.5; // points de %
const CONFLICT_THRESHOLD = 0.5; // ecart relatif avec la base au-dela duquel la base est gardee

type Field =
  | 'revenue' | 'operating_income' | 'net_income'
  | 'total_actif' | 'total_dettes_financieres' | 'total_capitaux_propres'
  | 'roe' | 'roa' | 'net_margin' | 'operating_margin' | 'cost_ratio';

// Libelles Madis (normalises) -> champ. Les banques publient un PNB a la place du CA.
const LABELS: Record<string, Field> = {
  "chiffres d'affaires": 'revenue',
  "chiffre d'affaires": 'revenue',
  'produit net bancaire': 'revenue',
  "resultat d'exploitation": 'operating_income',
  'resultat net': 'net_income',
  'total actif': 'total_actif',
  'total bilan': 'total_actif',
  'total dettes financieres': 'total_dettes_financieres',
  'total capitaux propres': 'total_capitaux_propres',
  'roe': 'roe',
  'roa': 'roa',
  'marge nette': 'net_margin',
  'marge operationnelle': 'operating_margin',
  "coefficient d'exploitation": 'cost_ratio',
};

const IGNORED = new Set(['compte de resultat', 'bilan', "ratios d'analyse", 'm xof', 'crown', '31/12']);

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** "92 004" -> 92004, "-2 271" -> -2271, "1,07%" -> 1.07, "-" / "N/A" -> null */
function parseValue(raw: string): number | null {
  const s = raw.replace(/[\s  %]/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (s === '' || s === '-' || /^n\/?a$/i.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const isValueToken = (t: string) => /^\s*[-−–]?[\d\s  ]*[\d]([,.]\d+)?\s*%?\s*$|^\s*(-|n\/?a)\s*$/i.test(t);

type Parsed = { years: number[]; rows: Partial<Record<Field, (number | null)[]>>; unknown: string[] };

function parseMadis(text: string): Parsed {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim() !== '');
  const years: number[] = [];
  const rows: Parsed['rows'] = {};
  const unknown: string[] = [];
  let pendingLabel: string | null = null;

  const store = (label: string, tokens: string[]) => {
    const field = LABELS[norm(label)];
    if (!field) { unknown.push(label.trim()); return; }
    rows[field] = tokens.map(parseValue);
  };

  for (const line of lines) {
    const t = line.trim();
    if (/^\d{4}$/.test(t)) {
      // Chaque tableau repete l'en-tete des annees : on ne garde que le premier
      const y = Number(t);
      if (!years.includes(y)) years.push(y);
      continue;
    }
    if (IGNORED.has(norm(t))) continue;

    const tokens = line.split('\t');
    const values = tokens.slice(1);
    if (tokens.length > 1 && !isValueToken(tokens[0]) && values.every(isValueToken)) {
      // "Libelle<TAB>v1<TAB>v2..." (comptes et bilan)
      store(tokens[0], values);
      pendingLabel = null;
    } else if (pendingLabel && tokens.every(isValueToken)) {
      // Ratios : libelle seul sur sa ligne, valeurs sur la suivante
      store(pendingLabel, tokens);
      pendingLabel = null;
    } else {
      pendingLabel = t;
    }
  }

  for (const [field, vals] of Object.entries(rows)) {
    if (vals!.length !== years.length)
      throw new Error(`${field} : ${vals!.length} valeurs pour ${years.length} exercices`);
  }
  return { years, rows, unknown };
}

const round = (v: number | null, d: number) => (v === null ? null : Math.round(v * 10 ** d) / 10 ** d);
const pct = (num: number | null, den: number | null) =>
  num === null || den === null || den <= 0 ? null : (num / den) * 100;
const growth = (cur: number | null, prev: number | null) =>
  cur === null || prev === null || prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100;

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith('.txt'));
  const tickers = files.map((f) => path.basename(f, path.extname(f)).toUpperCase())
    .filter((t) => !ONLY.length || ONLY.includes(t));
  if (!tickers.length) throw new Error(`Aucun fichier a traiter dans ${DIR}`);

  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: tickers } },
    select: { id: true, symbol: true, current_price: true },
  });
  const stockBySymbol = new Map(stocks.map((s) => [s.symbol, s]));
  const fundamentals = await prisma.stockFundamental.findMany({
    where: { stock_ticker: { in: tickers } },
    select: { stock_ticker: true, shares_outstanding: true },
  });
  const sharesBySymbol = new Map(fundamentals.map((f) => [f.stock_ticker, f.shares_outstanding]));

  const warnings: string[] = [];
  const conflicts: string[] = [];
  let afWritten = 0;
  let sfWritten = 0;

  for (const ticker of tickers) {
    const stock = stockBySymbol.get(ticker);
    if (!stock) { warnings.push(`${ticker} : titre absent de la table Stock, ignore`); continue; }

    const file = files.find((f) => path.basename(f, path.extname(f)).toUpperCase() === ticker)!;
    let parsed: Parsed;
    try {
      parsed = parseMadis(fs.readFileSync(path.join(DIR, file), 'utf8'));
    } catch (err) {
      warnings.push(`${ticker} : fichier illisible (${(err as Error).message})`);
      continue;
    }
    for (const u of parsed.unknown) warnings.push(`${ticker} : libelle non reconnu "${u}"`);

    const existing = await prisma.annualFinancials.findMany({ where: { stock_ticker: ticker } });
    const existingByYear = new Map(existing.map((e) => [e.year, e]));

    // Ordre chronologique pour les croissances
    const order = parsed.years.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
    const get = (f: Field, i: number) => parsed.rows[f]?.[i] ?? null;

    console.log(`\n=== ${ticker} (${order[0].y}-${order[order.length - 1].y}) ===`);
    let last: { year: number; data: Record<string, number | null> } | null = null;

    for (let k = 0; k < order.length; k++) {
      const { y, i } = order[k];
      const prevI = k > 0 && order[k - 1].y === y - 1 ? order[k - 1].i : null;

      const before = existingByYear.get(y);

      // Un ecart de plus de 50 % avec la base est plus souvent une coquille Madis
      // (SDSC 2024 : capitaux propres 10 887 M entre 61 747 et 73 552) qu'une
      // correction : on garde la base et on signale, sauf --force.
      const resolve = (field: keyof NonNullable<typeof before>, madis: number | null) => {
        const db = (before?.[field] as number | null | undefined) ?? null;
        if (madis === null || db === null || FORCE) return madis;
        if (Math.abs(madis - db) / Math.max(Math.abs(db), 1e-9) <= CONFLICT_THRESHOLD) return madis;
        conflicts.push(`${ticker} ${y} : ${String(field)} base ${db} / Madis ${madis} -> base conservee`);
        return db;
      };

      const revenue = resolve('revenue', get('revenue', i));
      const net = resolve('net_income', get('net_income', i));
      const actif = resolve('total_actif', get('total_actif', i));
      const equity = resolve('total_capitaux_propres', get('total_capitaux_propres', i));
      const prevRevenue = prevI === null ? null : get('revenue', prevI);
      const prevNet = prevI === null ? null : get('net_income', prevI);

      const data = {
        revenue: round(revenue, 3),
        revenue_growth: round(growth(revenue, prevRevenue), 2),
        net_income: round(net, 3),
        net_income_growth: round(growth(net, prevNet), 2),
        total_actif: round(actif, 3),
        total_dettes_financieres: round(resolve('total_dettes_financieres', get('total_dettes_financieres', i)), 3),
        total_capitaux_propres: round(equity, 3),
        roe: round(pct(net, equity), 2),
        roa: round(pct(net, actif), 2),
        net_margin: round(pct(net, revenue), 2),
        // Le resultat d'exploitation n'est pas stocke : on arbitre sur la marge
        operating_margin: round(resolve('operating_margin', pct(get('operating_income', i), revenue)), 2),
        cost_ratio: round(resolve('cost_ratio', get('cost_ratio', i)), 2),
      };

      // Ratios Madis incoherents avec leurs propres agregats
      for (const f of ['roe', 'roa', 'net_margin', 'operating_margin'] as const) {
        const madis = get(f, i);
        const ours = data[f];
        if (madis !== null && ours !== null && Math.abs(madis - ours) > RATIO_TOLERANCE)
          warnings.push(`${ticker} ${y} : ${f} Madis ${madis} % / recalcule ${ours} %`);
      }
      if (data.roe !== null && Math.abs(data.roe) > 100)
        warnings.push(`${ticker} ${y} : ROE ${data.roe} % (capitaux propres ${equity} M a verifier)`);

      // Diff avec la base pour voir ce que l'import corrige
      const changes = before
        ? (Object.keys(data) as (keyof typeof data)[])
            .filter((f) => data[f] !== null && (before[f] === null || Math.abs((before[f] as number) - data[f]!) > Math.max(0.01, Math.abs(data[f]!) * 0.001)))
            .map((f) => `${f} ${before[f] ?? '∅'} -> ${data[f]}`)
        : ['nouvel exercice'];
      console.log(`  ${y}  ${changes.length ? changes.join(' | ') : 'inchange'}`);

      // On ne remplace jamais une valeur en base par null (champ absent du copier-coller)
      const update = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null));
      if (APPLY) {
        await prisma.annualFinancials.upsert({
          where: { stock_ticker_year: { stock_ticker: ticker, year: y } },
          create: { stock_ticker: ticker, year: y, stockId: stock.id, ...data },
          update,
        });
      }
      afWritten++;
      last = { year: y, data };
    }

    // ---- Photo du dernier exercice -> StockFundamental
    if (last) {
      const d = last.data;
      const shares = sharesBySymbol.get(ticker) ?? null;
      const px = stock.current_price ?? null;
      const eps = shares && d.net_income !== null ? (d.net_income * 1_000_000) / shares : null;
      const bvps = shares && d.total_capitaux_propres !== null ? (d.total_capitaux_propres * 1_000_000) / shares : null;

      const sf = {
        year: last.year,
        revenue: d.revenue,
        net_income: d.net_income,
        net_profit: d.net_income,
        book_value: d.total_capitaux_propres,
        roe: d.roe,
        roa: d.roa,
        profit_margin: d.net_margin,
        debt_to_equity: round(
          d.total_capitaux_propres !== null && d.total_capitaux_propres > 0
            ? (d.total_dettes_financieres ?? 0) / d.total_capitaux_propres
            : null,
          3,
        ),
        eps: round(eps, 2),
        pe_ratio: round(eps !== null && eps > 0 && px ? px / eps : null, 2),
        pb_ratio: round(bvps !== null && bvps > 0 && px ? px / bvps : null, 2),
      };
      if (!shares) warnings.push(`${ticker} : nombre de titres absent, BNPA/PER/PBR non recalcules`);

      console.log(
        `  photo ${last.year} : ROE ${sf.roe ?? '-'}%  ROA ${sf.roa ?? '-'}%  marge ${sf.profit_margin ?? '-'}%  ` +
        `BNPA ${sf.eps ?? '-'}  PER ${sf.pe_ratio ?? '-'}  PBR ${sf.pb_ratio ?? '-'}`,
      );

      if (APPLY) {
        await prisma.stockFundamental.upsert({
          where: { stock_ticker: ticker },
          create: { stock_ticker: ticker, stockId: stock.id, ...sf },
          update: Object.fromEntries(Object.entries(sf).filter(([, v]) => v !== null)),
        });
      }
      sfWritten++;
    }
  }

  console.log(`\n-- Resume --`);
  console.log(`  Lignes AnnualFinancials : ${afWritten}${APPLY ? ' ecrites' : ' (dry-run)'}`);
  console.log(`  Fiches StockFundamental : ${sfWritten}${APPLY ? ' ecrites' : ' (dry-run)'}`);
  if (conflicts.length) {
    console.log(`\n-- Conflits base / Madis (${conflicts.length}) : verifier, puis --force pour imposer Madis --`);
    for (const c of conflicts) console.log(`  ${c}`);
  }
  if (warnings.length) {
    console.log(`\n-- Points a signaler (${warnings.length}) --`);
    for (const w of warnings) console.log(`  ${w}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
