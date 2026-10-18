/// <reference types="node" />
// Import generique des etats financiers annuels (FY) depuis les classeurs de valorisation
// "historique etat fin" vers le modele FinancialStatement.
//
// Source : C:\Users\HP\Downloads\nsia\...\historique etat fin\<SOCIETE>.xlsx, feuille "Etats Financiers".
// Montants en millions de FCFA (entete "En millions de FCFA" de la feuille source).
//
// Conventions reprises des imports deja audites (SODECI / SONATEL) :
//   - `depreciation` est stockee en POSITIF (certains classeurs la portent en negatif) ;
//   - `income_tax` et `hao_income` gardent le signe de la source.
//
// Les classeurs bancaires (BOA*, BICICI, CORIS, ECOBANK, SIB, ALIOS) n'ont pas de feuille
// "Etats Financiers" (ils exposent "Agregats" / "IS original") et ne sont pas traites ici.
//
// Usage :
//   node scripts/.importAll.cjs            -> dry-run (aucune ecriture)
//   node scripts/.importAll.cjs --apply    -> ecrit en base

import 'dotenv/config';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient, StatementPeriod } from '@prisma/client';

const prisma = new PrismaClient();
const APPLY = process.argv.includes('--apply');
const DIR = 'C:/Users/HP/Downloads/nsia/Fichier valorisation 2026 cz/Valo_sur la base des chiffres au 1er TRIMESTRE_2026/historique etat fin';
const SHEET = 'Etats Financiers';

// Classeur -> ticker BRVM (verifie contre stocks.company_name en base)
const FILE_TO_TICKER: Record<string, string> = {
  'BERNABE': 'BNBC',
  'Bolloré': 'SDSC', // Africa Global Logistics (ex Bollore Africa Logistics CI)
  'CIE': 'CIEC',
  'ERIUM (Ex AIR LIQUIDE)': 'SIVC',
  'FILTISAC': 'FTSC',
  'NEI-CEDA': 'NEIC',
  'NESTLE': 'NTLC',
  'ONATEL': 'ONTBF',
  'PALM CI': 'PALC',
  'SAPH': 'SPHC',
  'Servair': 'ABJC',
  'SETAO': 'STAC',
  'SICABLE': 'CABC',
  'SITAB': 'STBC',
  'SMB': 'SMBC',
  'SODECI': 'SDCC',
  'SONATEL': 'SNTS',
  'SUCRIVOIRE': 'SCRC',
  'TOTAL CI': 'TTLC',
  'UNIWAX': 'UNXC',
  'Vivo Energy': 'SHEC',
};

// Deja importes par des scripts dedies et audites a partir de sources plus recentes
// (ettat fin SODECI_T-1_2026, etat fin SONATEL _PREV_T-1-2026) : on ne les ecrase pas,
// on compare seulement et on signale les ecarts.
const CURATED = new Set(['SDCC', 'SNTS']);

const norm = (s: unknown) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Libelles source -> champs FinancialStatement, par ordre de priorite
const FIELDS: Record<string, string[]> = {
  revenue: ['chiffre d affaires'],
  value_added: ['valeur ajoutee'],
  ebe: ['ebe'],
  depreciation: [
    'dotation aux amortissements',
    'dotation aux amort prov',
    'dotation aux amortissement',
    'dotations aus amort prov',
    'dotation aux amort provisions',
  ],
  operating_income: ['resultat d exploitation'],
  financial_income: ['resultat financier'],
  ordinary_income: ['resultat activites ordinaires'],
  hao_income: ['resultat hao'],
  income_tax: ['impot sur le resultat', 'impot sur resultat', 'impots sur le resultat'],
  net_income: ['resultat net', 'resultat net consolide'],
  fixed_assets: ['actif immobilise'],
  intangible_assets: ['immobilisation incorporelle'],
  tangible_assets: ['immobilisation corporelles'],
  financial_assets: ['immobilisation financieres'],
  current_assets: ['actif circulant'],
  inventory: ['stocks'],
  receivables: ['creances et emploi assimiles'],
  other_receivables: ['autres creances'],
  cash_assets: ['tresorerie de l actif', 'tresorerie actif'],
  total_assets: ['total actif'],
  equity: ['capitaux propres'],
  financial_debt_total: ['dettes financieres et ressources assimilees'],
  borrowings: ['emprunts et dettes financieres'],
  other_financial_debt: ['dettes financieres diverses'],
  financial_provisions: ['provisions financieres pour risques et charges'],
  current_liabilities: ['passifs circulants'],
  customer_advances: ['clients avances recues'],
  trade_payables: [
    'fournisseurs d exploitation',
    'fournisseurs et comptes rattaches',
    'fournisseurs d exploitation investissement',
  ],
  tax_social_payables: ['dettes fiscales sociales et autres dettes', 'autres dettes'],
  cash_liabilities: ['tresorerie passif'],
  total_liabilities: ['total passif'],
};

type Cell = string | number | null;
type Grid = Cell[][];

/** Colonne -> annee, a partir du premier entete : on ne garde que la serie contigue
 *  croissante partant de la premiere annee (les classeurs portent des tableaux
 *  annexes a droite, cf. ERIUM / SAPH). */
function yearColumns(grid: Grid): { col: number; year: number }[] {
  for (const row of grid) {
    const idx = row.findIndex(
      (v) => typeof v === 'number' && Number.isInteger(v) && v >= 2000 && v <= 2040
    );
    if (idx === -1) continue;
    const out: { col: number; year: number }[] = [];
    let expected = row[idx] as number;
    for (let c = idx; c < row.length; c++) {
      if (row[c] === expected) {
        out.push({ col: c, year: expected });
        expected++;
      } else if (out.length) break;
    }
    if (out.length >= 3) return out;
  }
  return [];
}

function findRow(grid: Grid, labels: string[]): Cell[] | null {
  for (const want of labels) {
    for (const row of grid) {
      if (typeof row[0] === 'string' && norm(row[0]) === want) return row;
    }
  }
  return null;
}

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

type Issue = { ticker: string; kind: string; detail: string };
const issues: Issue[] = [];

async function main() {
  console.log(`\nImport etats financiers annuels - ${APPLY ? 'ECRITURE' : 'DRY-RUN (aucune ecriture)'}\n`);

  const dbTickers = new Set(
    (await prisma.stock.findMany({ select: { symbol: true } })).map((s) => s.symbol)
  );
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.xlsx'));
  let written = 0;
  let rowsTotal = 0;
  const done: string[] = [];
  const skippedNoSheet: string[] = [];

  for (const file of files.sort()) {
    const base = file.replace(/\.xlsx$/, '');
    const wb = XLSX.readFile(path.join(DIR, file), { cellDates: false });
    if (!wb.SheetNames.includes(SHEET)) {
      skippedNoSheet.push(base);
      continue;
    }

    const ticker = FILE_TO_TICKER[base];
    if (!ticker) {
      issues.push({ ticker: '?', kind: 'ticker-inconnu', detail: `${base} : pas de ticker mappe` });
      continue;
    }
    if (!dbTickers.has(ticker)) {
      issues.push({ ticker, kind: 'absent-en-base', detail: `${base} -> ${ticker} introuvable dans stocks` });
      continue;
    }

    const grid = XLSX.utils.sheet_to_json<Cell[]>(wb.Sheets[SHEET], {
      header: 1,
      raw: true,
      defval: null,
    });
    const cols = yearColumns(grid);
    if (!cols.length) {
      issues.push({ ticker, kind: 'entete-annees', detail: `${base} : aucune ligne d'annees detectee` });
      continue;
    }

    // Lignes source trouvees / manquantes
    const rowFor: Record<string, Cell[] | null> = {};
    const missing: string[] = [];
    for (const [field, labels] of Object.entries(FIELDS)) {
      rowFor[field] = findRow(grid, labels);
      if (!rowFor[field]) missing.push(field);
    }
    if (missing.length) {
      issues.push({
        ticker,
        kind: 'lignes-absentes',
        detail: `${missing.length} champ(s) sans ligne source : ${missing.join(', ')}`,
      });
    }

    let flippedDep = 0;
    const balanceWarn: string[] = [];
    const yearsWritten: number[] = [];

    for (const { col, year } of cols) {
      const data: Record<string, number | null> = {};
      let filled = 0;
      for (const field of Object.keys(FIELDS)) {
        const row = rowFor[field];
        let v = row ? num(row[col]) : null;
        if (v !== null && field === 'depreciation' && v < 0) {
          v = Math.abs(v);
          flippedDep++;
        }
        data[field] = v;
        if (v !== null) filled++;
      }
      if (filled === 0) continue; // colonne vide pour ce titre
      if (data.revenue === null && data.total_assets === null) continue;

      // Controle d'equilibre du bilan
      if (data.total_assets !== null && data.total_liabilities !== null) {
        const d = Math.abs(data.total_assets - data.total_liabilities);
        const scale = Math.max(Math.abs(data.total_assets), 1);
        if (d / scale > 0.005) balanceWarn.push(`${year} (ecart ${d.toFixed(1)})`);
      }

      rowsTotal++;
      yearsWritten.push(year);

      if (APPLY && !CURATED.has(ticker)) {
        await prisma.financialStatement.upsert({
          where: {
            stock_ticker_year_period: { stock_ticker: ticker, year, period: StatementPeriod.FY },
          },
          create: {
            stock_ticker: ticker,
            year,
            period: StatementPeriod.FY,
            ...data,
            source: `historique etat fin/${file} - feuille "${SHEET}"`,
            note: 'Import generique importAllStatementsFromExcel.ts (millions FCFA)',
          },
          update: {
            ...data,
            source: `historique etat fin/${file} - feuille "${SHEET}"`,
            note: 'Import generique importAllStatementsFromExcel.ts (millions FCFA)',
          },
        });
        written++;
      }
    }

    if (flippedDep) {
      issues.push({
        ticker,
        kind: 'signe-amortissement',
        detail: `${flippedDep} annee(s) d'amortissement remises en positif`,
      });
    }
    if (balanceWarn.length) {
      issues.push({
        ticker,
        kind: 'bilan-desequilibre',
        detail: `TOTAL ACTIF != TOTAL PASSIF : ${balanceWarn.join(', ')}`,
      });
    }

    const tag = CURATED.has(ticker) ? ' [CURE - non ecrase]' : '';
    console.log(
      `  ${ticker.padEnd(6)} ${base.padEnd(24)} ${yearsWritten.length} ans (${yearsWritten[0]}-${yearsWritten[yearsWritten.length - 1]})${tag}`
    );
    done.push(ticker);
  }

  console.log(`\n-- Resume --`);
  console.log(`  Classeurs traites      : ${done.length}`);
  console.log(`  Lignes FY preparees    : ${rowsTotal}`);
  console.log(`  Lignes ecrites en base : ${APPLY ? written : 0}${APPLY ? '' : ' (dry-run)'}`);
  console.log(`  Classeurs sans feuille "${SHEET}" : ${skippedNoSheet.length}`);
  if (skippedNoSheet.length) console.log(`     ${skippedNoSheet.join(', ')}`);

  if (issues.length) {
    console.log(`\n-- Points a signaler (${issues.length}) --`);
    for (const i of issues) console.log(`  [${i.kind}] ${i.ticker} : ${i.detail}`);
  }

  // Tickers en base sans aucun classeur source
  const covered = new Set(done);
  const uncovered = [...dbTickers].filter((t) => !covered.has(t)).sort();
  console.log(`\n-- Tickers en base sans etats financiers importes (${uncovered.length}) --`);
  console.log(`  ${uncovered.join(', ')}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('ERREUR', e);
  await prisma.$disconnect();
  process.exit(1);
});
