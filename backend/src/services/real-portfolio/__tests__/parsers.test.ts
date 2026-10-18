import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseNumber, parseDate, parseSide, suggestMapping, parseStatementFile, toDraftRows } from '../parsers';

describe('normalisation', () => {
  it('lit les nombres au format français et anglais', () => {
    expect(parseNumber('1 234,50')).toBe(1234.5);
    expect(parseNumber('1.234.567')).toBe(1234567);
    expect(parseNumber('1,234.5')).toBe(1234.5);
    expect(parseNumber('20 000 F')).toBe(20000);
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber('')).toBeNull();
  });
  it('lit les dates', () => {
    expect(parseDate('03/06/2024')).toBe('2024-06-03');
    expect(parseDate('2024-06-03')).toBe('2024-06-03');
    expect(parseDate('3-6-24')).toBe('2024-06-03');
    expect(parseDate(45446)).toBe('2024-06-03');
  });
  it('lit le sens', () => {
    expect(parseSide('Achat', 'TRANSACTIONS')).toBe('BUY');
    expect(parseSide('V', 'TRANSACTIONS')).toBe('SELL');
    expect(parseSide('', 'SNAPSHOT')).toBe('OPENING');
  });
});

describe('suggestMapping', () => {
  it('mappe un snapshot en privilégiant le PRU au cours', () => {
    expect(suggestMapping(['Valeur', 'Nombre de titres', 'Cours', 'PRU', 'Valorisation'])).toEqual({
      ticker: 'Valeur', quantity: 'Nombre de titres', price: 'PRU',
    });
  });
  it('mappe un relevé de transactions', () => {
    expect(suggestMapping(['Date opération', 'Sens', 'Libellé', 'Qté', "Cours d'exécution", 'Commission', 'Montant net'])).toEqual({
      date: 'Date opération', side: 'Sens', ticker: 'Libellé', quantity: 'Qté', price: "Cours d'exécution", fees: 'Commission', amount: 'Montant net',
    });
  });
});

describe('parseStatementFile', () => {
  it('lit un CSV point-virgule avec bandeau au-dessus de l’en-tête', () => {
    const csv = 'Relevé SGI XYZ;;;\nClient : 123;;;\nDate;Sens;Titre;Quantité;Cours\n03/06/2024;Achat;SNTS;10;20 000\n\n';
    const t = parseStatementFile('releve.csv', Buffer.from(csv, 'utf8'));
    expect(t.headers).toEqual(['Date', 'Sens', 'Titre', 'Quantité', 'Cours']);
    expect(t.suggestedMode).toBe('TRANSACTIONS');
    const rows = toDraftRows(t.rows, t.suggestedMapping, 'TRANSACTIONS', '2026-10-16');
    expect(rows).toEqual([{ rowId: 'r1', ticker: 'SNTS', side: 'BUY', date: '2024-06-03', quantity: 10, price: 20000, fees: null }]);
  });

  it('lit un Excel de snapshot et date les lignes au jour du snapshot', () => {
    const ws = XLSX.utils.aoa_to_sheet([['Titre', 'Quantité', 'PRU'], ['ORAC', 50, 14800]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const t = parseStatementFile('pf.xlsx', buf);
    expect(t.suggestedMode).toBe('SNAPSHOT');
    const rows = toDraftRows(t.rows, t.suggestedMapping, 'SNAPSHOT', '2026-10-16');
    expect(rows[0]).toMatchObject({ ticker: 'ORAC', side: 'OPENING', date: '2026-10-16', quantity: 50, price: 14800 });
  });

  it('déduit le cours du montant quand la colonne cours manque', () => {
    const rows = toDraftRows([{ T: 'SNTS', Q: '10', M: '-200 000' }], { ticker: 'T', quantity: 'Q', amount: 'M' }, 'SNAPSHOT', '2026-10-16');
    expect(rows[0].price).toBe(20000);
  });
});
