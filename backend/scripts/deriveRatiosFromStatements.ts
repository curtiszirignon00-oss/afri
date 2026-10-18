/// <reference types="node" />
// Derive les ratios de valorisation et de rentabilite a partir des etats financiers
// (FinancialStatement, importes par importAllStatementsFromExcel.ts) et alimente :
//   - AnnualFinancials   : historique annuel complet (jusqu'a 12 ans) des agregats + ratios
//   - StockFundamental   : photo du dernier exercice (ratios courants, cours du jour)
//
// Sources des donnees par action :
//   - agregats comptables  -> FinancialStatement (periode FY)
//   - nombre de titres     -> StockFundamental.shares_outstanding (reference en base ;
//                             le classeur SETAO porte une valeur erronee recopiee de SITAB)
//   - dividende par action -> feuille "Valorisation" du classeur, ligne DPA, alignee en
//                             ancrant la ligne "Resultat net" sur la serie deja en base
//   - cours de fin d'annee -> StockHistory (derniere seance de l'annee) pour le PER/PBR/
//                             rendement historiques ; Stock.current_price pour la photo courante
//
// Exclusions volontaires (pour ne pas exposer de mauvaises valeurs) :
//   - les banques et assimiles : aucun etat financier exploitable dans les classeurs
//   - les exercices dont le bilan ne boucle pas (TOTAL ACTIF != TOTAL PASSIF > 0,5 %)
//
// Usage :
//   node scripts/.derive.cjs            -> dry-run
//   node scripts/.derive.cjs --apply    -> ecrit en base

import 'dotenv/config';
import * as XLSX from 'xlsx';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const DIR = 'C:/Users/HP/Downloads/nsia/Fichier valorisation 2026 cz/Valo_sur la base des chiffres au 1er TRIMESTRE_2026/historique etat fin';

// ticker -> classeur source (pour la ligne DPA)
const TICKER_TO_FILE: Record<string, string> = {
  BNBC: 'BERNABE',
  SDSC: 'Bolloré',
  CIEC: 'CIE',
  SIVC: 'ERIUM (Ex AIR LIQUIDE)',
  FTSC: 'FILTISAC',
  NEIC: 'NEI-CEDA',
  NTLC: 'NESTLE',
  ONTBF: 'ONATEL',
  PALC: 'PALM CI',
  SPHC: 'SAPH',
  ABJC: 'Servair',
  STAC: 'SETAO',
  CABC: 'SICABLE',
  STBC: 'SITAB',
  SMBC: 'SMB',
  SDCC: 'SODECI',
  SNTS: 'SONATEL',
  SCRC: 'SUCRIVOIRE',
  TTLC: 'TOTAL CI',
  UNXC: 'UNIWAX',
  SHEC: 'Vivo Energy',
};

const norm = (s: unknown) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const pct = (num: number | null, den: number | null): number | null =>
  num === null || den === null || den === 0 ? null : (num / den) * 100;

const round = (v: number | null, d = 4): number | null =>
  v === null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d;

type Issue = { ticker: string; kind: string; detail: string };
const issues: Issue[] = [];

/** Serie DPA du classeur, alignee par ANNEE via la ligne "Resultat net".
 *  `all` est la liste complete des exercices (ordre croissant, sans trou retire),
 *  pour que l'ancrage reste valide meme si un exercice est ecarte ensuite. */
function readDpa(ticker: string, all: { year: number; net_income: number | null }[]): Map<number, number> {
  const years = all.map((s) => s.year);
  const netIncome = all.map((s) => s.net_income);
  const out = new Map<number, number>();
  const file = TICKER_TO_FILE[ticker];
  if (!file) return out;
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.readFile(path.join(DIR, `${file}.xlsx`));
  } catch {
    return out;
  }
  const sheet = wb.SheetNames.find((s) => /valo/i.test(s));
  if (!sheet) {
    issues.push({ ticker, kind: 'dpa-absent', detail: `pas de feuille Valorisation dans ${file}.xlsx` });
    return out;
  }
  const grid = XLSX.utils.sheet_to_json<(string | number | null)[]>(wb.Sheets[sheet], {
    header: 1,
    raw: true,
    defval: null,
  });

  const rowOf = (labels: string[]) => {
    for (const want of labels) {
      for (const r of grid) {
        if (typeof r[0] === 'string' && norm(r[0]) === want) {
          const nums = r.map((v) => (typeof v === 'number' ? v : null));
          if (nums.filter((x) => x !== null).length >= 5) return nums;
        }
      }
    }
    return null;
  };

  const rnRow = rowOf(['resultat net', 'rn', 'resultat net consolide']);
  const dpaRow = rowOf(['dpa', 'dividende par action']);
  if (!rnRow || !dpaRow) {
    issues.push({ ticker, kind: 'dpa-absent', detail: `ligne RN ou DPA introuvable dans ${file}.xlsx` });
    return out;
  }

  // Offset tel que rnRow[offset + i] correspond a netIncome[i]
  const ref = years.map((_, i) => netIncome[i]).filter((v) => v !== null) as number[];
  let offset = -1;
  for (let k = 0; k < 20 && offset === -1; k++) {
    let hits = 0;
    let tested = 0;
    for (let i = 0; i < years.length; i++) {
      const exp = netIncome[i];
      const got = rnRow[k + i];
      if (exp === null || got === null || got === undefined) continue;
      tested++;
      const scale = Math.max(Math.abs(exp), 1);
      if (Math.abs(got - exp) / scale < 0.01) hits++;
    }
    if (tested >= Math.min(5, ref.length) && hits === tested) offset = k;
  }
  if (offset === -1) {
    issues.push({ ticker, kind: 'dpa-non-aligne', detail: `impossible d'ancrer la ligne RN de ${file}.xlsx -> DPA ignore` });
    return out;
  }

  for (let i = 0; i < years.length; i++) {
    const v = dpaRow[offset + i];
    if (typeof v === 'number' && Number.isFinite(v)) out.set(years[i], v);
  }
  return out;
}

async function main() {
  console.log(`\nDerivation des ratios - ${APPLY ? 'ECRITURE' : 'DRY-RUN (aucune ecriture)'}\n`);

  const tickers = Object.keys(TICKER_TO_FILE).sort();

  // Cours de cloture de fin d'annee + cours du jour
  const hist = await prisma.stockHistory.findMany({
    where: { stock_ticker: { in: tickers } },
    select: { stock_ticker: true, date: true, close: true },
    orderBy: { date: 'asc' },
  });
  const yearEnd = new Map<string, number>(); // "TICKER:YYYY" -> dernier close de l'annee
  for (const h of hist) yearEnd.set(`${h.stock_ticker}:${h.date.getUTCFullYear()}`, h.close);

  const stocks = await prisma.stock.findMany({
    where: { symbol: { in: tickers } },
    select: { symbol: true, current_price: true },
  });
  const price = new Map(stocks.map((s) => [s.symbol, s.current_price]));

  const funds = await prisma.stockFundamental.findMany({
    where: { stock_ticker: { in: tickers } },
    select: { stock_ticker: true, shares_outstanding: true, stockId: true },
  });
  const sharesOf = new Map(funds.map((f) => [f.stock_ticker, f.shares_outstanding]));

  const stockIds = new Map(
    (await prisma.stock.findMany({ where: { symbol: { in: tickers } }, select: { symbol: true, id: true } }))
      .map((s) => [s.symbol, s.id])
  );

  let afWritten = 0;
  let sfWritten = 0;
  const summary: string[] = [];

  for (const ticker of tickers) {
    const fs = await prisma.financialStatement.findMany({
      where: { stock_ticker: ticker, period: 'FY' },
      orderBy: { year: 'asc' },
    });
    if (!fs.length) {
      issues.push({ ticker, kind: 'aucun-etat', detail: 'aucun FinancialStatement FY' });
      continue;
    }

    const shares = sharesOf.get(ticker) ?? null;
    if (!shares) {
      issues.push({ ticker, kind: 'titres-inconnus', detail: 'shares_outstanding absent -> BPA/PER/PBR non calcules' });
    }

    // Exercices ecartes : bilan qui ne boucle pas sans explication.
    // Un ecart entierement imputable a une composante absente de la source
    // (Tresorerie passif non publiee) est conserve : `total_liabilities`
    // n'entre dans aucun ratio calcule ici.
    const kept = fs.filter((s) => {
      if (s.revenue === null && s.net_income === null) return false;
      if (s.total_assets !== null && s.total_liabilities !== null) {
        const d = Math.abs(s.total_assets - s.total_liabilities);
        if (d / Math.max(Math.abs(s.total_assets), 1) > 0.005) {
          if (s.cash_liabilities === null) {
            issues.push({ ticker, kind: 'bilan-composante-absente', detail: `${s.year} : ecart ${d.toFixed(1)} M, Tresorerie passif non publiee -> exercice conserve` });
          } else {
            issues.push({ ticker, kind: 'exercice-ecarte', detail: `${s.year} : bilan non equilibre (ecart ${d.toFixed(1)} M)` });
            return false;
          }
        }
      }
      return true;
    });
    if (!kept.length) continue;

    const years = kept.map((s) => s.year);
    const dpa = readDpa(ticker, fs.map((s) => ({ year: s.year, net_income: s.net_income })));

    const stockId = stockIds.get(ticker)!;
    let wrote = 0;

    for (let i = 0; i < kept.length; i++) {
      const s = kept[i];
      const prev = i > 0 && kept[i - 1].year === s.year - 1 ? kept[i - 1] : null;

      const eps =
        shares && s.net_income !== null ? (s.net_income * 1_000_000) / shares : null;
      const close = yearEnd.get(`${ticker}:${s.year}`) ?? null;
      const peRatio = eps !== null && eps > 0 && close !== null ? close / eps : null;
      const div = dpa.get(s.year) ?? null;

      const data = {
        revenue: round(s.revenue, 3),
        revenue_growth: round(prev && prev.revenue && s.revenue !== null ? ((s.revenue - prev.revenue) / Math.abs(prev.revenue)) * 100 : null, 2),
        net_income: round(s.net_income, 3),
        net_income_growth: round(prev && prev.net_income && s.net_income !== null ? ((s.net_income - prev.net_income) / Math.abs(prev.net_income)) * 100 : null, 2),
        eps: round(eps, 2),
        pe_ratio: round(peRatio, 2),
        dividend: round(div, 2),
        total_actif: round(s.total_assets, 3),
        total_dettes_financieres: round(s.financial_debt_total, 3),
        total_capitaux_propres: round(s.equity, 3),
        roe: round(s.equity !== null && s.equity > 0 ? pct(s.net_income, s.equity) : null, 2),
        roa: round(pct(s.net_income, s.total_assets), 2),
        net_margin: round(s.revenue !== null && s.revenue > 0 ? pct(s.net_income, s.revenue) : null, 2),
        operating_margin: round(s.revenue !== null && s.revenue > 0 ? pct(s.operating_income, s.revenue) : null, 2),
      };

      // On ne remplace jamais un dividende deja en base par null : le DPA n'est pas
      // toujours disponible dans le classeur, et l'ancienne valeur peut etre bonne.
      const update: Record<string, unknown> = { ...data };
      if (data.dividend === null) delete update.dividend;

      if (APPLY) {
        await prisma.annualFinancials.upsert({
          where: { stock_ticker_year: { stock_ticker: ticker, year: s.year } },
          create: { stock_ticker: ticker, year: s.year, stockId, ...data },
          update,
        });
      }
      wrote++;
      afWritten++;
    }

    // ---- Photo du dernier exercice -> StockFundamental
    const last = kept[kept.length - 1];
    const px = price.get(ticker) ?? null;
    const epsLast = shares && last.net_income !== null ? (last.net_income * 1_000_000) / shares : null;
    const bvps = shares && last.equity !== null ? (last.equity * 1_000_000) / shares : null;
    const divLast = dpa.get(last.year) ?? null;

    const sf = {
      year: last.year,
      market_cap: round(px && shares ? (px * shares) / 1_000_000 : null, 3), // en millions FCFA
      pe_ratio: round(epsLast !== null && epsLast > 0 && px ? px / epsLast : null, 2),
      pb_ratio: round(bvps !== null && bvps > 0 && px ? px / bvps : null, 2),
      dividend_yield: round(divLast !== null && divLast > 0 && px ? (divLast / px) * 100 : null, 2),
      roe: round(last.equity !== null && last.equity > 0 ? pct(last.net_income, last.equity) : null, 2),
      roa: round(pct(last.net_income, last.total_assets), 2),
      profit_margin: round(last.revenue !== null && last.revenue > 0 ? pct(last.net_income, last.revenue) : null, 2),
      debt_to_equity: round(last.equity !== null && last.equity > 0 ? (last.financial_debt_total ?? 0) / last.equity : null, 3),
      revenue: round(last.revenue, 3),
      net_income: round(last.net_income, 3),
      net_profit: round(last.net_income, 3),
      ebitda: round(last.ebe, 3),
      eps: round(epsLast, 2),
      book_value: round(last.equity, 3),
    };

    // Valeurs arithmetiquement exactes mais peu lisibles : on les publie en
    // signalant qu'elles refletent des fonds propres quasi nuls / des pertes.
    if (sf.pb_ratio !== null && sf.pb_ratio > 20)
      issues.push({ ticker, kind: 'valeur-extreme', detail: `PBR ${sf.pb_ratio} (fonds propres tres faibles : ${sf.book_value} M)` });
    if (sf.roe !== null && Math.abs(sf.roe) > 100)
      issues.push({ ticker, kind: 'valeur-extreme', detail: `ROE ${sf.roe} %` });

    const sfUpdate: Record<string, unknown> = { ...sf };
    if (sf.dividend_yield === null) delete sfUpdate.dividend_yield;

    if (APPLY) {
      await prisma.stockFundamental.upsert({
        where: { stock_ticker: ticker },
        create: { stock_ticker: ticker, stockId, shares_outstanding: shares, ...sf },
        update: sfUpdate,
      });
      sfWritten++;
    }

    summary.push(
      `  ${ticker.padEnd(6)} ${String(wrote).padStart(2)} ans (${years[0]}-${years[years.length - 1]})  ` +
      `PER ${sf.pe_ratio ?? '-'}  PBR ${sf.pb_ratio ?? '-'}  rdt ${sf.dividend_yield ?? '-'}%  ` +
      `ROE ${sf.roe ?? '-'}%  ROA ${sf.roa ?? '-'}%  marge ${sf.profit_margin ?? '-'}%  DPA ${dpa.size} ans`
    );
  }

  console.log(summary.join('\n'));
  console.log(`\n-- Resume --`);
  console.log(`  Lignes AnnualFinancials  : ${afWritten}${APPLY ? ' ecrites' : ' (dry-run)'}`);
  console.log(`  Fiches StockFundamental  : ${sfWritten}${APPLY ? ' ecrites' : ' (dry-run)'}`);
  console.log(`  Banques et assimiles     : non traites (aucun etat financier exploitable)`);

  if (issues.length) {
    console.log(`\n-- Points a signaler (${issues.length}) --`);
    for (const i of issues) console.log(`  [${i.kind}] ${i.ticker} : ${i.detail}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('ERREUR', e);
  await prisma.$disconnect();
  process.exit(1);
});
