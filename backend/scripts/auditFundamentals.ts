/// <reference types="node" />
// Audit en lecture seule des donnees fondamentales (AnnualFinancials + StockFundamental).
// Ne modifie rien. Signale :
//   - unites incoherentes (XOF bruts au lieu de millions, ratios en fraction)
//   - ratios stockes != ratios recalcules depuis les agregats
//   - croissances stockees != croissances recalculees
//   - bilans illogiques (capitaux propres > actif, dettes > actif, CA negatif...)
//   - sauts annuels suspects (x3 ou /3 sur actif, capitaux propres, CA)
//   - photo StockFundamental desalignee du dernier exercice / du cours
//
// Usage :
//   npx tsx scripts/auditFundamentals.ts               -> rapport console
//   npx tsx scripts/auditFundamentals.ts --json out.json -> exporte aussi les donnees + anomalies

import 'dotenv/config';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jsonIdx = process.argv.indexOf('--json');
const JSON_OUT = jsonIdx > 0 ? process.argv[jsonIdx + 1] : null;

type Severity = 'critique' | 'majeur' | 'mineur';
type Issue = { ticker: string; year: number | null; severity: Severity; kind: string; detail: string };

const issues: Issue[] = [];
const flag = (ticker: string, year: number | null, severity: Severity, kind: string, detail: string) =>
  issues.push({ ticker, year, severity, kind, detail });

const pct = (num: number | null, den: number | null) =>
  num === null || den === null || den <= 0 ? null : (num / den) * 100;
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-9);
const r2 = (v: number | null) => (v === null ? '∅' : String(Math.round(v * 100) / 100));

// Ecart tolere entre ratio stocke et recalcule (points de %)
const RATIO_TOL = 1;
// Au-dela de 100 000 000 M FCFA (100 000 Mds) un montant est a coup sur en XOF bruts.
// Ecobank Transnational depasse a lui seul 19 000 Mds de total bilan.
const MAX_MILLIONS = 100_000_000;

async function main() {
  const [stocks, annual, fundamentals] = await Promise.all([
    prisma.stock.findMany({ select: { symbol: true, company_name: true, sector: true, current_price: true } }),
    prisma.annualFinancials.findMany({ orderBy: [{ stock_ticker: 'asc' }, { year: 'asc' }] }),
    prisma.stockFundamental.findMany(),
  ]);

  const byTicker = new Map<string, typeof annual>();
  for (const a of annual) {
    if (!byTicker.has(a.stock_ticker)) byTicker.set(a.stock_ticker, []);
    byTicker.get(a.stock_ticker)!.push(a);
  }
  const sfByTicker = new Map(fundamentals.map((f) => [f.stock_ticker, f]));
  const stockBySymbol = new Map(stocks.map((s) => [s.symbol, s]));

  for (const s of stocks) {
    if (!byTicker.has(s.symbol)) flag(s.symbol, null, 'mineur', 'historique-absent', 'aucune ligne AnnualFinancials');
    if (!sfByTicker.has(s.symbol)) flag(s.symbol, null, 'mineur', 'photo-absente', 'aucune fiche StockFundamental');
  }

  // ---- AnnualFinancials
  for (const [ticker, rows] of byTicker) {
    for (let i = 0; i < rows.length; i++) {
      const a = rows[i];
      const prev = i > 0 && rows[i - 1].year === a.year - 1 ? rows[i - 1] : null;
      const y = a.year;

      if (y < 1990 || y > new Date().getFullYear()) flag(ticker, y, 'critique', 'annee-invalide', `annee ${y}`);
      if (i > 0 && a.year - rows[i - 1].year > 1)
        flag(ticker, y, 'mineur', 'trou', `exercices ${rows[i - 1].year + 1}-${y - 1} absents`);

      // Unites
      for (const f of ['revenue', 'net_income', 'total_actif', 'total_capitaux_propres', 'total_dettes_financieres'] as const) {
        const v = a[f];
        if (v !== null && Math.abs(v) > MAX_MILLIONS)
          flag(ticker, y, 'critique', 'unite', `${f} = ${v} : semble en XOF bruts, attendu en millions`);
      }
      for (const f of ['roe', 'roa', 'net_margin', 'operating_margin'] as const) {
        const v = a[f];
        if (v !== null && v !== 0 && Math.abs(v) < 1 && a.net_income !== null && Math.abs(a.net_income) > 0) {
          const recalc = f === 'roe' ? pct(a.net_income, a.total_capitaux_propres)
            : f === 'roa' ? pct(a.net_income, a.total_actif)
            : f === 'net_margin' ? pct(a.net_income, a.revenue) : null;
          if (recalc !== null && Math.abs(recalc) > 2 && rel(v * 100, recalc) < 0.05)
            flag(ticker, y, 'critique', 'unite', `${f} = ${v} : stocke en fraction, attendu en % (${r2(recalc)})`);
        }
      }

      // Logique de bilan
      if (a.revenue !== null && a.revenue < 0) flag(ticker, y, 'majeur', 'illogique', `CA negatif (${a.revenue})`);
      if (a.total_actif !== null && a.total_actif <= 0) flag(ticker, y, 'critique', 'illogique', `total actif ${a.total_actif}`);
      if (a.total_actif !== null && a.total_capitaux_propres !== null && a.total_capitaux_propres > a.total_actif * 1.001)
        flag(ticker, y, 'critique', 'illogique', `capitaux propres ${a.total_capitaux_propres} > total actif ${a.total_actif}`);
      if (a.total_actif !== null && a.total_dettes_financieres !== null && a.total_dettes_financieres > a.total_actif * 1.001)
        flag(ticker, y, 'critique', 'illogique', `dettes financieres ${a.total_dettes_financieres} > total actif ${a.total_actif}`);
      if (a.total_capitaux_propres !== null && a.total_capitaux_propres < 0)
        flag(ticker, y, 'mineur', 'capitaux-negatifs', `capitaux propres ${a.total_capitaux_propres} (possible si pertes cumulees)`);
      if (a.revenue !== null && a.net_income !== null && a.revenue > 0 && Math.abs(a.net_income) > a.revenue * 1.5)
        flag(ticker, y, 'majeur', 'illogique', `|resultat net| ${a.net_income} > 1,5 x CA ${a.revenue}`);

      // Ratios stockes vs recalcules
      const checks: [string, number | null, number | null][] = [
        ['roe', a.roe, pct(a.net_income, a.total_capitaux_propres)],
        ['roa', a.roa, pct(a.net_income, a.total_actif)],
        ['net_margin', a.net_margin, pct(a.net_income, a.revenue)],
      ];
      for (const [f, stored, recalc] of checks) {
        if (stored !== null && recalc !== null && Math.abs(stored - recalc) > RATIO_TOL)
          flag(ticker, y, Math.abs(stored - recalc) > 5 ? 'majeur' : 'mineur', 'ratio-incoherent',
            `${f} stocke ${r2(stored)} % / recalcule ${r2(recalc)} %`);
      }
      if (a.roe !== null && Math.abs(a.roe) > 80) flag(ticker, y, 'majeur', 'extreme', `ROE ${r2(a.roe)} %`);
      if (a.roa !== null && Math.abs(a.roa) > 40) flag(ticker, y, 'majeur', 'extreme', `ROA ${r2(a.roa)} %`);
      if (a.net_margin !== null && Math.abs(a.net_margin) > 80) flag(ticker, y, 'majeur', 'extreme', `marge nette ${r2(a.net_margin)} %`);
      if (a.operating_margin !== null && Math.abs(a.operating_margin) > 80)
        flag(ticker, y, 'majeur', 'extreme', `marge operationnelle ${r2(a.operating_margin)} %`);
      if (a.cost_ratio !== null && (a.cost_ratio < 0 || a.cost_ratio > 200))
        flag(ticker, y, 'majeur', 'extreme', `coefficient d'exploitation ${r2(a.cost_ratio)} %`);

      // Croissances
      if (prev) {
        const g = (cur: number | null, p: number | null) => (cur === null || p === null || p === 0 ? null : ((cur - p) / Math.abs(p)) * 100);
        for (const [f, stored, recalc] of [
          ['revenue_growth', a.revenue_growth, g(a.revenue, prev.revenue)],
          ['net_income_growth', a.net_income_growth, g(a.net_income, prev.net_income)],
        ] as [string, number | null, number | null][]) {
          if (stored !== null && recalc !== null && Math.abs(stored - recalc) > 1)
            flag(ticker, y, 'mineur', 'croissance-incoherente', `${f} stocke ${r2(stored)} % / recalcule ${r2(recalc)} %`);
        }
        // Sauts suspects
        for (const f of ['revenue', 'total_actif', 'total_capitaux_propres'] as const) {
          const cur = a[f], p = prev[f];
          if (cur !== null && p !== null && cur > 0 && p > 0 && (cur / p > 3 || p / cur > 3))
            flag(ticker, y, 'majeur', 'saut', `${f} ${p} -> ${cur} (x${r2(cur / p)})`);
        }
      }

      // BNPA / PER / dividende
      if (a.eps !== null && a.dividend !== null && a.eps > 0 && a.dividend > a.eps * 1.5)
        flag(ticker, y, 'mineur', 'distribution', `dividende ${a.dividend} > 1,5 x BNPA ${a.eps}`);
      if (a.pe_ratio !== null && (a.pe_ratio < 0 || a.pe_ratio > 150))
        flag(ticker, y, 'mineur', 'extreme', `PER ${r2(a.pe_ratio)}`);
    }
  }

  // ---- StockFundamental (photo courante)
  for (const sf of fundamentals) {
    const t = sf.stock_ticker;
    const stock = stockBySymbol.get(t);
    const px = stock?.current_price ?? null;
    const rows = byTicker.get(t) ?? [];
    const last = rows[rows.length - 1];

    if (last && sf.year !== null && sf.year !== last.year)
      flag(t, sf.year, 'majeur', 'photo-desalignee', `photo exercice ${sf.year} / dernier exercice en base ${last.year}`);
    if (last && sf.year === last.year) {
      for (const [f, a, b] of [
        ['revenue', sf.revenue, last.revenue],
        ['net_income', sf.net_income, last.net_income],
        ['roe', sf.roe, last.roe],
      ] as [string, number | null, number | null][]) {
        if (a !== null && b !== null && rel(a, b) > 0.02)
          flag(t, sf.year, 'majeur', 'photo-desalignee', `${f} photo ${r2(a)} / historique ${r2(b)}`);
      }
    }
    for (const f of ['revenue', 'net_income', 'book_value', 'net_profit'] as const) {
      const v = sf[f];
      if (v !== null && Math.abs(v) > MAX_MILLIONS)
        flag(t, sf.year, 'critique', 'unite', `photo ${f} = ${v} : semble en XOF bruts`);
    }
    if (!sf.shares_outstanding) flag(t, sf.year, 'majeur', 'titres-absents', 'nombre de titres manquant');

    if (sf.shares_outstanding && sf.net_income !== null && sf.eps !== null) {
      const eps = (sf.net_income * 1_000_000) / sf.shares_outstanding;
      if (rel(sf.eps, eps) > 0.03) flag(t, sf.year, 'majeur', 'bnpa-incoherent', `BNPA ${r2(sf.eps)} / RN x 1e6 / titres = ${r2(eps)}`);
    }
    if (px && sf.eps && sf.eps > 0 && sf.pe_ratio !== null && rel(sf.pe_ratio, px / sf.eps) > 0.15)
      flag(t, sf.year, 'mineur', 'per-perime', `PER ${r2(sf.pe_ratio)} / cours ${px} / BNPA ${r2(sf.eps)} = ${r2(px / sf.eps)}`);
    if (px && sf.shares_outstanding && sf.market_cap) {
      const capXof = px * sf.shares_outstanding;
      const ratio = sf.market_cap / capXof;
      if (rel(ratio, 1) > 0.15 && rel(ratio, 1e-6) > 0.15)
        flag(t, sf.year, 'majeur', 'capitalisation', `market_cap ${sf.market_cap} / cours x titres = ${Math.round(capXof)} XOF`);
    }
    if (sf.dividend_yield !== null && (sf.dividend_yield < 0 || sf.dividend_yield > 20))
      flag(t, sf.year, 'majeur', 'extreme', `rendement ${r2(sf.dividend_yield)} %`);
    if (sf.pb_ratio !== null && (sf.pb_ratio < 0 || sf.pb_ratio > 30)) flag(t, sf.year, 'mineur', 'extreme', `PBR ${r2(sf.pb_ratio)}`);
    if (sf.debt_to_equity !== null && (sf.debt_to_equity < 0 || sf.debt_to_equity > 10))
      flag(t, sf.year, 'mineur', 'extreme', `dette/fonds propres ${r2(sf.debt_to_equity)}`);
  }

  // ---- Rapport
  const order: Severity[] = ['critique', 'majeur', 'mineur'];
  issues.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity) || a.ticker.localeCompare(b.ticker) || (a.year ?? 0) - (b.year ?? 0));
  for (const sev of order) {
    const list = issues.filter((i) => i.severity === sev);
    console.log(`\n== ${sev.toUpperCase()} (${list.length}) ==`);
    for (const i of list) console.log(`  ${i.ticker.padEnd(6)} ${String(i.year ?? '').padEnd(4)} [${i.kind}] ${i.detail}`);
  }
  console.log(`\n${stocks.length} titres, ${annual.length} exercices, ${fundamentals.length} photos audites.`);

  if (JSON_OUT) {
    const data = stocks.map((s) => ({
      ticker: s.symbol,
      company: s.company_name,
      sector: s.sector,
      current_price: s.current_price,
      snapshot: sfByTicker.get(s.symbol) ?? null,
      annual: (byTicker.get(s.symbol) ?? []).map(({ id, stockId, created_at, updated_at, ...rest }) => rest),
      issues: issues.filter((i) => i.ticker === s.symbol),
    }));
    fs.writeFileSync(JSON_OUT, JSON.stringify(data, null, 1));
    console.log(`Export : ${JSON_OUT}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
