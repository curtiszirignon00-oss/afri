/// <reference types="node" />
/**
 * Import d'historique d'indices BRVM depuis un fichier Excel
 * Usage: npx ts-node scripts/importIndexHistory.ts "<NOM INDICE>" "<chemin/vers/fichier.xlsx>"
 *
 * Exemple: npx ts-node scripts/importIndexHistory.ts "BRVM AGRICULTURE" "./data/brvm_agriculture.xlsx"
 *
 * Colonnes Excel attendues (variantes gérées) :
 *   Date       → Date / date
 *   Clôture    → fermeture / Clôture / Dernier / Close / close
 *   Ouverture  → Ouverture / Ouv. / Open / open
 *   Haut       → +Haut / Haut / Plus Haut / High / high
 *   Bas        → +Bas  / Bas  / Plus Bas  / Low / low
 *   Variation  → Variation / Var. / Change / change (optionnel)
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

function parseDate(val: string | number): Date | null {
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(d.getTime())) return null;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  const m = String(val).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  // ISO format YYYY-MM-DD
  const iso = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function num(row: any, ...keys: string[]): number | null {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '-' && row[k] !== '') {
      const n = parseFloat(String(row[k]).replace(/\s/g, '').replace(',', '.').replace('%', ''));
      if (!isNaN(n)) return n;
    }
  }
  return null;
}

export async function importIndexHistory(indexName: string, excelPath: string) {
  console.log(`\n📊 Import indice "${indexName}" ← ${excelPath}`);

  // Vérifier ou créer l'entrée dans MarketIndex
  let marketIndex = await prisma.marketIndex.findUnique({ where: { index_name: indexName } });
  if (!marketIndex) {
    console.log(`⚠️  Indice "${indexName}" non trouvé en base — création automatique...`);
    marketIndex = await prisma.marketIndex.create({
      data: {
        index_name: indexName,
        index_value: 0,
        daily_change_percent: 0,
        date: new Date(),
      }
    });
    console.log(`   ✅ Entrée MarketIndex créée (id: ${marketIndex.id})`);
  } else {
    console.log(`   ✅ Indice trouvé en base (id: ${marketIndex.id})`);
  }

  const wb = XLSX.readFile(excelPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws);
  console.log(`   ${rows.length} lignes dans l'Excel`);

  let imported = 0, skipped = 0;

  for (const row of rows) {
    const date = parseDate(row.Date ?? row.date ?? '');
    if (!date) { skipped++; continue; }

    const closeVal = num(row, 'fermeture', 'Clôture', 'Dernier', 'Close', 'close', 'Valeur', 'valeur');
    if (closeVal === null || closeVal <= 0) { skipped++; continue; }

    const close = closeVal;
    const open  = num(row, 'Ouverture', 'Ouv.', 'Open', 'open') ?? close;
    const high  = num(row, '+Haut', 'Haut', 'Plus Haut', 'Plus haut', 'High', 'high') ?? close;
    const low   = num(row, '+Bas', 'Bas', 'Plus Bas', 'Plus bas', 'Low', 'low') ?? close;
    const change = num(row, 'Variation', 'Var.', 'Change', 'change', 'Var %') ?? 0;

    try {
      await prisma.marketIndexHistory.upsert({
        where: {
          index_name_date: { index_name: indexName, date }
        },
        update: { open, high, low, close, daily_change_percent: change },
        create: {
          marketIndexId: marketIndex.id,
          index_name: indexName,
          date,
          open,
          high,
          low,
          close,
          daily_change_percent: change,
        }
      });
      imported++;
    } catch (e) {
      console.error(`   ⚠️  Erreur ligne ${date.toISOString().split('T')[0]}:`, e);
      skipped++;
    }
  }

  // Mettre à jour la valeur courante dans MarketIndex avec la dernière entrée
  if (imported > 0) {
    const latest = await prisma.marketIndexHistory.findFirst({
      where: { index_name: indexName },
      orderBy: { date: 'desc' },
    });
    if (latest) {
      await prisma.marketIndex.update({
        where: { index_name: indexName },
        data: {
          index_value: latest.close,
          daily_change_percent: latest.daily_change_percent,
          date: latest.date,
        }
      });
    }
  }

  console.log(`   ✅ Importés/mis à jour : ${imported}`);
  if (skipped) console.log(`   ⚠️  Ignorés : ${skipped}`);
}

async function main() {
  const [,, indexName, excelPath] = process.argv;
  if (!indexName || !excelPath) {
    console.error('Usage: npx ts-node scripts/importIndexHistory.ts "<NOM INDICE>" "<path>"');
    console.error('');
    console.error('Indices sectoriels BRVM:');
    console.error('  "BRVM AGRICULTURE"');
    console.error('  "BRVM AUTRES SECTEURS"');
    console.error('  "BRVM DISTRIBUTION"');
    console.error('  "BRVM FINANCE"');
    console.error('  "BRVM INDUSTRIE"');
    console.error('  "BRVM SERVICES PUBLICS"');
    console.error('  "BRVM TRANSPORT"');
    process.exit(1);
  }
  await importIndexHistory(indexName, excelPath);
}

if (require.main === module) {
  main()
    .catch(e => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
