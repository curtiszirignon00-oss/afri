/// <reference types="node" />
// Applique des corrections sourcees aux fondamentaux, puis recalcule tous les
// ratios derives a partir des agregats.
//
// Entree : fichiers JSON d'un dossier (par defaut scripts/corrections/2026-11),
// chacun un tableau d'entrees :
//   { ticker, year, field, value, source, note? }    -> corrige un champ d'AnnualFinancials
//   { ticker, field: "shares_outstanding", value, source }
//   { ticker, year, action: "delete", source, note? } -> supprime un exercice errone
// Champs : revenue, net_income, total_actif, total_capitaux_propres,
// total_dettes_financieres, eps, dividend (NET par action, exercice remunere),
// cost_ratio, operating_income (non stocke : sert a la marge operationnelle).
//
// Recalcule ensuite, pour TOUS les titres :
//   - ROE (null si capitaux propres <= 0), ROA, marge nette, marge operationnelle
//     quand le resultat d'exploitation est fourni, croissances CA et RN
//   - BNPA a 0 alors que le resultat n'est pas nul (RN x 1e6 / titres)
//   - PER historique quand le BNPA change (cours de fin d'annee implicite conserve)
//   - la photo StockFundamental, alignee sur le dernier exercice
//
// Usage :
//   npx tsx scripts/applyFundamentalsCorrections.ts                -> dry-run
//   npx tsx scripts/applyFundamentalsCorrections.ts --apply        -> sauvegarde puis ecrit
//   npx tsx scripts/applyFundamentalsCorrections.ts --dir <dossier>

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, AnnualFinancials } from '@prisma/client';
import { computeMarketRatios } from '../src/services/marketRatios';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const dirIdx = process.argv.indexOf('--dir');
const DIR = dirIdx > 0 ? path.resolve(process.argv[dirIdx + 1]) : path.join(__dirname, 'corrections', '2026-11');

const AF_FIELDS = [
  'revenue', 'net_income', 'total_actif', 'total_capitaux_propres',
  'total_dettes_financieres', 'eps', 'dividend', 'cost_ratio',
] as const;
type AfField = (typeof AF_FIELDS)[number];
const ALL_FIELDS = new Set<string>([...AF_FIELDS, 'operating_income', 'shares_outstanding']);

// Champs recalcules, compares pour le rapport
const DERIVED = [
  'roe', 'roa', 'net_margin', 'operating_margin', 'revenue_growth', 'net_income_growth', 'pe_ratio',
] as const;

type Correction = {
  ticker: string;
  year?: number | null;
  field?: string;
  value?: number | null;
  action?: 'delete';
  source: string;
  note?: string;
  file: string;
};

type Row = Pick<AnnualFinancials, AfField | (typeof DERIVED)[number] | 'year'> & { id?: string };

const round = (v: number | null, d: number) => (v === null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const pct = (num: number | null, den: number | null) => (num === null || den === null || den <= 0 ? null : (num / den) * 100);
const growth = (cur: number | null, prev: number | null) =>
  cur === null || prev === null || prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100;
const same = (a: number | null | undefined, b: number | null | undefined) =>
  (a ?? null) === (b ?? null) ||
  (a != null && b != null && Math.abs(a - b) <= Math.max(0.005, Math.abs(b) * 1e-6));

function loadCorrections(): Correction[] {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_') && !f.startsWith('backup'));
  const all: Correction[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const list = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8')) as Omit<Correction, 'file'>[];
    if (!Array.isArray(list)) throw new Error(`${file} : un tableau est attendu`);
    list.forEach((c, i) => {
      const where = `${file}[${i}] ${c.ticker ?? '?'}`;
      if (!c.ticker || !c.source) errors.push(`${where} : ticker et source obligatoires`);
      else if (c.action === 'delete') {
        if (!c.year) errors.push(`${where} : year obligatoire pour delete`);
      } else if (!c.field || !ALL_FIELDS.has(c.field)) errors.push(`${where} : champ inconnu "${c.field}"`);
      else if (c.field !== 'shares_outstanding' && !c.year) errors.push(`${where} : year obligatoire pour ${c.field}`);
      else if (c.value !== null && (typeof c.value !== 'number' || !Number.isFinite(c.value)))
        errors.push(`${where} : value non numerique (${c.value})`);
      all.push({ ...c, ticker: c.ticker?.toUpperCase(), file });
    });
  }
  if (errors.length) throw new Error(`Corrections invalides :\n  ${errors.join('\n  ')}`);
  return all;
}

async function main() {
  const corrections = loadCorrections();
  console.log(`${corrections.length} corrections lues dans ${DIR}`);

  const [stocks, annual, fundamentals] = await Promise.all([
    prisma.stock.findMany({ select: { id: true, symbol: true, current_price: true } }),
    prisma.annualFinancials.findMany({ orderBy: [{ stock_ticker: 'asc' }, { year: 'asc' }] }),
    prisma.stockFundamental.findMany(),
  ]);
  const stockBySymbol = new Map(stocks.map((s) => [s.symbol, s]));
  const sfByTicker = new Map(fundamentals.map((f) => [f.stock_ticker, f]));

  const unknown = [...new Set(corrections.map((c) => c.ticker))].filter((t) => !stockBySymbol.has(t));
  if (unknown.length) throw new Error(`Titres absents de Stock : ${unknown.join(', ')}`);

  // Etat initial et etat corrige, par titre puis exercice
  const original = new Map<string, Map<number, AnnualFinancials>>();
  const model = new Map<string, Map<number, Row>>();
  for (const a of annual) {
    if (!original.has(a.stock_ticker)) {
      original.set(a.stock_ticker, new Map());
      model.set(a.stock_ticker, new Map());
    }
    original.get(a.stock_ticker)!.set(a.year, a);
    model.get(a.stock_ticker)!.set(a.year, { ...a });
  }

  const emptyRow = (year: number): Row => ({
    year, revenue: null, net_income: null, total_actif: null, total_capitaux_propres: null,
    total_dettes_financieres: null, eps: null, dividend: null, cost_ratio: null, roe: null, roa: null,
    net_margin: null, operating_margin: null, revenue_growth: null, net_income_growth: null, pe_ratio: null,
  });

  const operatingIncome = new Map<string, number | null>(); // "TICKER:annee"
  const explicitEps = new Set<string>();
  const sharesOverride = new Map<string, number | null>();
  const deleted = new Map<string, Set<number>>();

  for (const c of corrections) {
    if (c.action === 'delete') {
      if (!deleted.has(c.ticker)) deleted.set(c.ticker, new Set());
      deleted.get(c.ticker)!.add(c.year!);
      model.get(c.ticker)?.delete(c.year!);
      continue;
    }
    if (c.field === 'shares_outstanding') {
      sharesOverride.set(c.ticker, c.value ?? null);
      continue;
    }
    if (!model.has(c.ticker)) model.set(c.ticker, new Map());
    const rows = model.get(c.ticker)!;
    if (deleted.get(c.ticker)?.has(c.year!)) throw new Error(`${c.ticker} ${c.year} : corrige et supprime a la fois`);
    if (!rows.has(c.year!)) rows.set(c.year!, emptyRow(c.year!));
    if (c.field === 'operating_income') {
      operatingIncome.set(`${c.ticker}:${c.year}`, c.value ?? null);
      continue;
    }
    if (c.field === 'eps') explicitEps.add(`${c.ticker}:${c.year}`);
    (rows.get(c.year!) as Record<string, unknown>)[c.field!] = c.value ?? null;
  }

  // ---- Recalcul des ratios derives
  for (const [ticker, rows] of model) {
    const shares = sharesOverride.has(ticker) ? sharesOverride.get(ticker)! : sfByTicker.get(ticker)?.shares_outstanding ?? null;
    const years = [...rows.keys()].sort((a, b) => a - b);
    for (const y of years) {
      const r = rows.get(y)!;
      const prev = rows.get(y - 1) ?? null;
      const before = original.get(ticker)?.get(y);

      if (!explicitEps.has(`${ticker}:${y}`) && r.eps === 0 && r.net_income && shares)
        r.eps = round((r.net_income * 1_000_000) / shares, 2);

      r.roe = round(pct(r.net_income, r.total_capitaux_propres), 2);
      r.roa = round(pct(r.net_income, r.total_actif), 2);
      r.net_margin = round(r.revenue !== null && r.revenue > 0 ? pct(r.net_income, r.revenue) : null, 2);
      const opKey = `${ticker}:${y}`;
      if (operatingIncome.has(opKey))
        r.operating_margin = round(r.revenue !== null && r.revenue > 0 ? pct(operatingIncome.get(opKey)!, r.revenue) : null, 2);
      if (prev) {
        r.revenue_growth = round(growth(r.revenue, prev.revenue), 2);
        r.net_income_growth = round(growth(r.net_income, prev.net_income), 2);
      }
      // Le PER historique suit le BNPA, au cours de fin d'annee implicite
      if (before && !same(before.eps, r.eps)) {
        const yearEndPrice = before.pe_ratio && before.eps && before.eps > 0 ? before.pe_ratio * before.eps : null;
        const per = yearEndPrice && r.eps && r.eps > 0 ? yearEndPrice / r.eps : null;
        // Meme seuil que la photo courante : au-dela, le benefice est quasi nul
        r.pe_ratio = per !== null && per <= 200 ? round(per, 2) : null;
      }
    }
  }

  // ---- Diff AnnualFinancials
  type Change = { ticker: string; year: number; field: string; from: unknown; to: unknown };
  const changes: Change[] = [];
  const toWrite: { ticker: string; year: number; data: Row; create: boolean }[] = [];
  const COMPARED = [...AF_FIELDS, ...DERIVED];

  for (const [ticker, rows] of model) {
    for (const [year, r] of rows) {
      const before = original.get(ticker)?.get(year);
      const diff = COMPARED.filter((f) => !same(before?.[f] as number | null | undefined, r[f] as number | null));
      if (!before) {
        changes.push({ ticker, year, field: 'exercice', from: '∅', to: 'cree' });
        toWrite.push({ ticker, year, data: r, create: true });
      } else if (diff.length) {
        for (const f of diff) changes.push({ ticker, year, field: f, from: before[f], to: r[f] });
        toWrite.push({ ticker, year, data: r, create: false });
      }
    }
  }
  for (const [ticker, years] of deleted) {
    for (const y of years) {
      if (original.get(ticker)?.has(y)) changes.push({ ticker, year: y, field: 'exercice', from: 'present', to: 'supprime' });
    }
  }

  // ---- Photo StockFundamental
  const sfWrites: { ticker: string; data: Record<string, number | null>; create: boolean }[] = [];
  const sfChanges: string[] = [];
  for (const [ticker, rows] of model) {
    const years = [...rows.keys()].sort((a, b) => a - b);
    if (!years.length) continue;
    const last = rows.get(years[years.length - 1])!;
    const prevRow = years.length > 1 ? rows.get(years[years.length - 2])! : null;
    const stock = stockBySymbol.get(ticker)!;
    const sf = sfByTicker.get(ticker);
    const shares = sharesOverride.has(ticker) ? sharesOverride.get(ticker)! : sf?.shares_outstanding ?? null;

    const data: Record<string, number | null> = {
      year: last.year,
      revenue: last.revenue,
      net_income: last.net_income,
      net_profit: last.net_income,
      book_value: last.total_capitaux_propres,
      roe: last.roe,
      roa: last.roa,
      profit_margin: last.net_margin,
      // Banques : pas de dettes financieres publiees, le ratio reste vide plutot qu'a 0
      debt_to_equity: round(
        last.total_dettes_financieres !== null && last.total_capitaux_propres !== null && last.total_capitaux_propres > 0
          ? last.total_dettes_financieres / last.total_capitaux_propres
          : null,
        3,
      ),
      eps: last.eps,
      shares_outstanding: shares,
    };
    if (stock.current_price > 0) {
      const ratios = computeMarketRatios({
        price: stock.current_price,
        shares,
        eps: last.eps,
        equity: last.total_capitaux_propres,
        dividend: last.dividend ?? prevRow?.dividend ?? null,
      });
      Object.assign(data, ratios);
      if (ratios.market_cap === null) delete data.market_cap;
    }

    const diff = Object.keys(data).filter((k) => !same((sf as Record<string, any> | undefined)?.[k], data[k]));
    if (diff.length) {
      sfWrites.push({ ticker, data, create: !sf });
      sfChanges.push(`  ${ticker.padEnd(6)} ${diff.map((k) => `${k} ${(sf as any)?.[k] ?? '∅'} -> ${data[k] ?? '∅'}`).join(' | ')}`);
    }
  }

  // ---- Rapport
  const sourced = new Set(corrections.map((c) => `${c.ticker}:${c.year ?? ''}`));
  console.log(`\n== AnnualFinancials : ${changes.length} changements sur ${toWrite.length} exercices ==`);
  let current = '';
  for (const c of changes.sort((a, b) => a.ticker.localeCompare(b.ticker) || a.year - b.year)) {
    const head = `${c.ticker} ${c.year}`;
    if (head !== current) {
      console.log(`  ${head}${sourced.has(`${c.ticker}:${c.year}`) ? '' : '  (recalcul)'}`);
      current = head;
    }
    console.log(`      ${c.field.padEnd(24)} ${String(c.from ?? '∅')} -> ${String(c.to ?? '∅')}`);
  }
  console.log(`\n== StockFundamental : ${sfWrites.length} photos ==`);
  console.log(sfChanges.join('\n'));

  if (!APPLY) {
    console.log('\nDry-run : rien n\'a ete ecrit. Relancer avec --apply.');
    return;
  }

  // ---- Sauvegarde puis ecriture
  const backupFile = path.join(DIR, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({ annual, fundamentals }, null, 1));
  console.log(`\nSauvegarde : ${backupFile}`);

  for (const [ticker, years] of deleted) {
    await prisma.annualFinancials.deleteMany({ where: { stock_ticker: ticker, year: { in: [...years] } } });
  }
  for (const w of toWrite) {
    const { id, year, ...fields } = w.data as Row & { id?: string };
    const data = Object.fromEntries(
      [...AF_FIELDS, ...DERIVED].map((f) => [f, (fields as Record<string, unknown>)[f] ?? null]),
    );
    if (w.create) {
      await prisma.annualFinancials.create({
        data: { stock_ticker: w.ticker, year: w.year, stockId: stockBySymbol.get(w.ticker)!.id, ...data },
      });
    } else {
      await prisma.annualFinancials.update({
        where: { stock_ticker_year: { stock_ticker: w.ticker, year: w.year } },
        data,
      });
    }
  }
  for (const w of sfWrites) {
    if (w.create) {
      await prisma.stockFundamental.create({
        data: { stock_ticker: w.ticker, stockId: stockBySymbol.get(w.ticker)!.id, ...w.data },
      });
    } else {
      await prisma.stockFundamental.update({ where: { stock_ticker: w.ticker }, data: w.data });
    }
  }
  console.log(`Ecrit : ${toWrite.length} exercices, ${[...deleted.values()].reduce((n, s) => n + s.size, 0)} suppressions, ${sfWrites.length} photos.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
