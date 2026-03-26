/**
 * Import des données fondamentales depuis les fichiers .txt
 * Lit tous les fichiers dans C:\Users\HP\OneDrive\Desktop\actions brvm\<symbol>\<symbol>.txt
 * et importe :
 *   - AnnualFinancials : P&L, bilan, ratios par année
 *   - StockIndexMembership : indices auxquels appartient chaque titre
 */

import * as fs from 'fs';
import * as path from 'path';
import prisma from '../src/config/prisma';

const BASE_DIR = 'C:/Users/HP/OneDrive/Desktop/actions brvm';

// ─── Parseurs utilitaires ─────────────────────────────────────────────────

/** Nettoie un nombre : "1 234" → 1234 | "12,34%" → 12.34 | "-" → null */
function parseNum(raw: string): number | null {
  const cleaned = raw.trim().replace(/%$/, '').replace(/\s/g, '').replace(',', '.');
  if (!cleaned || cleaned === '-' || cleaned === 'N/A') return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Extrait les années (2020-2029) d'une ligne, en conservant l'ordre d'apparition */
function extractYearsOrdered(line: string): number[] {
  const matches = line.match(/\b(20\d{2})\b/g);
  if (!matches) return [];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const m of matches) {
    const y = parseInt(m);
    if (!seen.has(y)) { seen.add(y); result.push(y); }
  }
  return result;
}

/**
 * Extrait 1 ou 2 nombres d'une cellule.
 * "18 898"        → [18898]
 * "19 125 21 263" → [19125, 21263]   (2024 + 2025 dans la même cellule)
 * "207,00 287,84" → [207.00, 287.84]
 * "112,73 152"    → [112.73, 152]
 * "-90,30"        → [-90.30]
 * "-" ou ""       → [null]
 */
function extractNumbersFromCell(cell: string): (number | null)[] {
  const raw = cell.trim().replace(/%/g, '');
  if (!raw || raw === '-') return [null];

  const tokens = raw.split(/\s+/).filter(t => t !== '');
  const numbers: (number | null)[] = [];
  let current: string[] = [];
  let currentHasDecimal = false;

  function flush() {
    if (current.length === 0) return;
    const n = parseFloat(current.join(''));
    numbers.push(isNaN(n) ? null : n);
    current = [];
    currentHasDecimal = false;
  }

  for (const token of tokens) {
    if (token === '-') { flush(); numbers.push(null); continue; }

    const isDecimal = /^-?\d+[,\.]\d+$/.test(token);
    const isPureDigits = /^\d+$/.test(token);
    const isNegInt = /^-\d+$/.test(token);

    if (!isPureDigits && !isNegInt && !isDecimal) continue;

    if (current.length === 0) {
      currentHasDecimal = isDecimal;
      current.push(token.replace(',', '.'));
    } else if (isPureDigits && token.length === 3 && !currentHasDecimal) {
      // Candidat séparateur milliers (3 chiffres après un premier groupe)
      current.push(token);
    } else {
      // Nouveau nombre
      flush();
      currentHasDecimal = isDecimal;
      current.push(token.replace(',', '.'));
    }
  }
  flush();

  return numbers.length > 0 ? numbers : [null];
}

// ─── Structure de résultat ────────────────────────────────────────────────

interface YearData {
  revenue?: number | null;
  revenueGrowth?: number | null;
  netIncome?: number | null;
  netIncomeGrowth?: number | null;
  eps?: number | null;
  peRatio?: number | null;
  dividend?: number | null;
  totalActif?: number | null;
  totalDettesFinancieres?: number | null;
  totalCapitauxPropres?: number | null;
  roe?: number | null;
  roa?: number | null;
  netMargin?: number | null;
  operatingMargin?: number | null;
  costRatio?: number | null;
}

interface ParsedData {
  byYear: Map<number, YearData>;
  indices: string[];
}

// ─── Parseur principal ────────────────────────────────────────────────────

function parseTxtFile(content: string): ParsedData {
  const lines = content.split('\n').map(l => l.replace(/\r/g, ''));
  const byYear = new Map<number, YearData>();
  const indices: string[] = [];

  function getOrCreate(year: number): YearData {
    if (!byYear.has(year)) byYear.set(year, {});
    return byYear.get(year)!;
  }

  // ── Helpers ──
  function mapValuesToYears(years: number[], flatValues: (number | null)[]) {
    years.forEach((yr, idx) => {
      if (flatValues[idx] !== undefined) return flatValues[idx];
    });
    return (yr: number, idx: number) => flatValues[idx] ?? null;
  }

  // ── Section P&L ──
  // Format : ligne "Les chiffres..." → ligne années (tab, asc) → lignes données
  // 2025 peut être dans la même cellule que 2024 (séparé par espace)
  let i = 0;
  while (i < lines.length) {
    if (lines[i].includes('Les chiffres sont en millions de FCFA')) {
      i++;
      const yearsLine = lines[i] || '';
      // Extraire tous les années dans l'ordre (ex: [2020,2021,2022,2023,2024,2025])
      const plYears = extractYearsOrdered(yearsLine);
      if (plYears.length === 0) { i++; break; }
      i++;
      // Lire les lignes de données P&L
      while (i < lines.length) {
        const line = lines[i];
        const lc = line.toLowerCase().trim();
        if (lc === '' || lc.startsWith('bilan') || lc.startsWith('ratio')) break;

        const cells = line.split('\t');
        const label = (cells[0] || '').toLowerCase().trim();
        // Extraire toutes les valeurs des cellules (chaque cellule peut en contenir 1 ou 2)
        const allVals = cells.slice(1)
          .flatMap(c => extractNumbersFromCell(c));

        if (label.includes("chiffre d'affaires") || label.includes('produit net bancaire') || label.includes('pnb')) {
          plYears.forEach((yr, idx) => { getOrCreate(yr).revenue = allVals[idx] ?? null; });
        } else if (label.startsWith('croissance') && (label.includes('ca') || label.includes('pnb'))) {
          plYears.forEach((yr, idx) => { getOrCreate(yr).revenueGrowth = allVals[idx] ?? null; });
        } else if (label === 'résultat net' || (label.startsWith('résultat') && label.includes('net'))) {
          plYears.forEach((yr, idx) => { getOrCreate(yr).netIncome = allVals[idx] ?? null; });
        } else if (label.startsWith('croissance') && label.includes('rn')) {
          plYears.forEach((yr, idx) => { getOrCreate(yr).netIncomeGrowth = allVals[idx] ?? null; });
        } else if (label === 'bnpa') {
          plYears.forEach((yr, idx) => { getOrCreate(yr).eps = allVals[idx] ?? null; });
        } else if (label === 'per') {
          plYears.forEach((yr, idx) => { getOrCreate(yr).peRatio = allVals[idx] ?? null; });
        } else if (label === 'dividende') {
          plYears.forEach((yr, idx) => { getOrCreate(yr).dividend = allVals[idx] ?? null; });
        }
        i++;
      }
      break;
    }
    i++;
  }

  // ── Section Bilan ──
  // Format : ligne "Bilan..." → lignes headers avec années (desc) → "31-déc..." → lignes données
  // Les années sont réparties sur 1 ou 2 lignes header
  i = 0;
  while (i < lines.length) {
    const lc0 = lines[i].toLowerCase().trim();
    const isBilanHeader = lc0 === 'bilan' || lc0 === 'bilan ' ||
      /^bilan\t/.test(lines[i].toLowerCase()) || /^bilan\s*$/.test(lines[i].toLowerCase());
    if (isBilanHeader) {
      i++;
      // Collecte toutes les années dans les lignes header (jusqu'à "Total Actif")
      const allBilanYears = new Set<number>();
      let scanIdx = i;
      for (let j = scanIdx; j < Math.min(scanIdx + 8, lines.length); j++) {
        if (lines[j].toLowerCase().includes('total actif')) break;
        extractYearsOrdered(lines[j]).forEach(y => allBilanYears.add(y));
      }
      // Trier DESC (les valeurs dans le fichier sont dans l'ordre desc)
      const bilanYears = Array.from(allBilanYears).sort((a, b) => b - a);
      if (bilanYears.length === 0) break;

      // Avancer jusqu'au premier "Total Actif"
      while (i < lines.length && !lines[i].toLowerCase().includes('total actif')) i++;

      // Lire les lignes bilan
      while (i < lines.length) {
        const line = lines[i];
        const lc = line.toLowerCase().trim();
        if (lc === '' || lc.includes('ratio') || lc.startsWith('roe') || lc.startsWith('roa')) break;

        const cells = line.split('\t');
        const label = (cells[0] || '').toLowerCase().trim();
        // Valeurs tab-séparées (un seul nombre par cellule dans le bilan)
        const vals = cells.slice(1).map(c => parseNum(c));

        if (label.includes('total actif')) {
          bilanYears.forEach((yr, idx) => { getOrCreate(yr).totalActif = vals[idx] ?? null; });
        } else if (label.includes('total dettes')) {
          bilanYears.forEach((yr, idx) => { getOrCreate(yr).totalDettesFinancieres = vals[idx] ?? null; });
        } else if (label.includes('total capitaux')) {
          bilanYears.forEach((yr, idx) => { getOrCreate(yr).totalCapitauxPropres = vals[idx] ?? null; });
        }
        i++;
      }
      break;
    }
    i++;
  }

  // ── Section Ratios ──
  // Format : ligne "Ratios d'analyse" ou "ratio" → lignes headers années (desc) → lignes données
  i = 0;
  while (i < lines.length) {
    const lc0 = lines[i].toLowerCase().trim();
    const isRatiosHeader = lc0 === "ratios d'analyse" || lc0 === 'ratio' || lc0 === 'ratios' ||
      lc0 === 'ratio ' || /^ratio\t/.test(lines[i].toLowerCase());
    if (isRatiosHeader) {
      i++;
      // Collecter les années depuis les lignes header
      const allRatioYears = new Set<number>();
      for (let j = i; j < Math.min(i + 6, lines.length); j++) {
        if (lines[j].toLowerCase().includes('roe')) break;
        extractYearsOrdered(lines[j]).forEach(y => allRatioYears.add(y));
      }
      const ratioYears = Array.from(allRatioYears).sort((a, b) => b - a);
      if (ratioYears.length === 0) break;

      // Avancer jusqu'au premier "ROE"
      while (i < lines.length && !lines[i].toLowerCase().startsWith('roe')) i++;

      // Lire les lignes ratios
      while (i < lines.length) {
        const line = lines[i];
        const lc = line.toLowerCase().trim();
        if (lc === '' || lc.startsWith('indice') || lc.startsWith('dividende distribué')) break;

        const cells = line.split('\t');
        const label = (cells[0] || '').toLowerCase().trim();
        const vals = cells.slice(1).map(c => parseNum(c));

        if (label === 'roe') {
          ratioYears.forEach((yr, idx) => { getOrCreate(yr).roe = vals[idx] ?? null; });
        } else if (label === 'roa') {
          ratioYears.forEach((yr, idx) => { getOrCreate(yr).roa = vals[idx] ?? null; });
        } else if (label.includes('marge nette')) {
          ratioYears.forEach((yr, idx) => { getOrCreate(yr).netMargin = vals[idx] ?? null; });
        } else if (label.includes('marge opérat') || label.includes('marge operat')) {
          ratioYears.forEach((yr, idx) => { getOrCreate(yr).operatingMargin = vals[idx] ?? null; });
        } else if (label.includes('coefficient')) {
          ratioYears.forEach((yr, idx) => { getOrCreate(yr).costRatio = vals[idx] ?? null; });
        }
        i++;
      }
      break;
    }
    i++;
  }

  // ── Section Indices ──
  i = 0;
  while (i < lines.length) {
    if (lines[i].trim().toLowerCase() === 'indices') {
      i++;
      while (i < lines.length) {
        const line = lines[i].trim();
        if (line.toUpperCase().startsWith('BRVM')) {
          indices.push(line);
        } else if (indices.length > 0 && line !== '') {
          break;
        }
        i++;
      }
      break;
    }
    i++;
  }

  return { byYear, indices };
}

// ─── Import en base ───────────────────────────────────────────────────────

async function importStock(symbol: string, data: ParsedData): Promise<void> {
  const stock = await prisma.stock.findUnique({ where: { symbol } });
  if (!stock) {
    console.log(`  ⚠️  ${symbol} non trouvé en DB — ignoré`);
    return;
  }

  let updatedYears = 0;
  for (const [year, d] of data.byYear) {
    // Ne pas importer une ligne entièrement vide
    const hasAnyValue = Object.values(d).some(v => v !== null && v !== undefined);
    if (!hasAnyValue) continue;

    const payload = {
      stock_ticker: symbol,
      year,
      stockId: stock.id,
      revenue:                  d.revenue,
      revenue_growth:           d.revenueGrowth,
      net_income:               d.netIncome,
      net_income_growth:        d.netIncomeGrowth,
      eps:                      d.eps,
      pe_ratio:                 d.peRatio,
      dividend:                 d.dividend,
      total_actif:              d.totalActif,
      total_dettes_financieres: d.totalDettesFinancieres,
      total_capitaux_propres:   d.totalCapitauxPropres,
      roe:                      d.roe,
      roa:                      d.roa,
      net_margin:               d.netMargin,
      operating_margin:         d.operatingMargin,
      cost_ratio:               d.costRatio,
    };

    // Pour l'update : seulement les champs non-null
    const updateData = Object.fromEntries(
      Object.entries(payload).filter(([k, v]) =>
        v !== undefined && v !== null && k !== 'stockId' && k !== 'stock_ticker' && k !== 'year'
      )
    );

    await prisma.annualFinancials.upsert({
      where: { stock_ticker_year: { stock_ticker: symbol, year } },
      create: { ...payload },
      update: updateData,
    });
    updatedYears++;
  }

  // Indices (upsert un par un — MongoDB ne supporte pas skipDuplicates)
  if (data.indices.length > 0) {
    for (const indexName of data.indices) {
      await prisma.stockIndexMembership.upsert({
        where: { stock_ticker_index_name: { stock_ticker: symbol, index_name: indexName } },
        create: { stock_ticker: symbol, index_name: indexName },
        update: {},
      });
    }
  }

  console.log(`  ✅ ${symbol} : ${updatedYears} années | ${data.indices.length} indices`);
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Import des données fondamentales depuis les fichiers .txt\n');

  const folders = fs.readdirSync(BASE_DIR).filter(f => {
    const fullPath = path.join(BASE_DIR, f);
    return fs.statSync(fullPath).isDirectory() && f.toLowerCase() !== 'other';
  });

  let total = 0;
  let errors = 0;

  for (const folder of folders) {
    const symbol = folder.toUpperCase();
    const txtPath = path.join(BASE_DIR, folder, `${folder.toLowerCase()}.txt`);

    if (!fs.existsSync(txtPath)) {
      console.log(`⚠️  ${symbol} : txt non trouvé`);
      continue;
    }

    console.log(`📄 ${symbol}`);
    try {
      const content = fs.readFileSync(txtPath, 'utf-8');
      const data = parseTxtFile(content);

      if (data.byYear.size === 0) {
        console.log(`  ⚠️  Aucune donnée parsée — vérifier le format`);
        continue;
      }

      await importStock(symbol, data);
      total++;
    } catch (err) {
      console.error(`  ❌ Erreur :`, err);
      errors++;
    }
  }

  console.log(`\n🎉 Terminé : ${total} actions importées, ${errors} erreurs`);
}

main()
  .catch(e => { console.error('❌ Fatal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
