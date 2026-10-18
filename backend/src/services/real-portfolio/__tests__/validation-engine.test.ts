import { describe, it, expect } from 'vitest';
import { validateRows, resolveTicker, priceRangeAt } from '../validation-engine';
import { replay, cleanBars, buildValueSeries } from '../ledger';
import type { Bar, DraftRow, MarketContext, SplitEvent, StockRef } from '../types';

const stocks: StockRef[] = [
  { symbol: 'SNTS', name: 'SONATEL SN', listedAt: '1998-10-02', delistedAt: null, firstHistoryDate: '2014-02-17', lastPrice: 25000 },
  { symbol: 'ORAC', name: "ORANGE COTE D'IVOIRE", listedAt: '2022-12-12', delistedAt: null, firstHistoryDate: '2023-01-10', lastPrice: 15000 },
  { symbol: 'ONTBF', name: 'ONATEL BF', listedAt: null, delistedAt: null, firstHistoryDate: '2014-02-05', lastPrice: 2500 },
  { symbol: 'BOAB', name: 'BANK OF AFRICA BN', listedAt: null, delistedAt: null, firstHistoryDate: '2014-04-25', lastPrice: 6000 },
  { symbol: 'BOAC', name: "BANK OF AFRICA CI", listedAt: null, delistedAt: null, firstHistoryDate: '2010-05-12', lastPrice: 7000 },
  { symbol: 'TTLC', name: 'TOTAL CI', listedAt: null, delistedAt: null, firstHistoryDate: '2014-02-21', lastPrice: 2200 },
  { symbol: 'TTLS', name: 'TOTAL SENEGAL', listedAt: null, delistedAt: null, firstHistoryDate: '2015-02-20', lastPrice: 2400 },
];

// ONTBF : split 1:2 fictif le 2021-03-01 (cours ~5000 avant, ~2500 après)
const ontbfBars: Bar[] = [
  { date: '2021-02-24', low: 4950, high: 5050, close: 5000 },
  { date: '2021-02-26', low: 4900, high: 5000, close: 4950 },
  { date: '2021-03-01', low: 2450, high: 2520, close: 2500 },
  { date: '2021-03-02', low: 2480, high: 2520, close: 2500 },
];
const ontbfSplits: SplitEvent[] = [{ exDate: '2021-03-01', ratio: 2 }];

const snts: Bar[] = [
  { date: '2024-06-03', low: 19800, high: 20200, close: 20000 },
  { date: '2024-06-04', low: 19900, high: 20400, close: 20300 },
  { date: '2024-06-06', low: 20100, high: 20500, close: 20400 },
];

const ctx: MarketContext = {
  today: '2026-10-16',
  stocks,
  bars: t => (t === 'ONTBF' ? ontbfBars : t === 'SNTS' ? snts : []),
  splits: t => (t === 'ONTBF' ? ontbfSplits : []),
};

const row = (p: Partial<DraftRow>): DraftRow => ({ rowId: Math.random().toString(36), ticker: 'SNTS', side: 'BUY', date: '2024-06-03', quantity: 10, price: 20000, ...p });

describe('resolveTicker', () => {
  it('résout symbole, nom exact et mot entier sans alerte', () => {
    expect(resolveTicker('snts', stocks)).toMatchObject({ symbol: 'SNTS', exact: true });
    expect(resolveTicker('Sonatel', stocks)).toMatchObject({ symbol: 'SNTS', exact: true });
    expect(resolveTicker('Orange Côte d’Ivoire', stocks)).toMatchObject({ symbol: 'ORAC', exact: true });
  });
  it('signale les ambiguïtés', () => {
    const r = resolveTicker('Bank of Africa', stocks);
    expect(r.symbol).toBeNull();
    expect(r.candidates.map(c => c.symbol)).toEqual(expect.arrayContaining(['BOAB', 'BOAC']));
  });
  it('ne résout pas silencieusement un nom partagé (TOTAL CI / TOTAL SENEGAL)', () => {
    expect(resolveTicker('Total', stocks)).toMatchObject({ symbol: 'TTLC', exact: false });
    expect(resolveTicker('Total Côte d’Ivoire', stocks)).toMatchObject({ symbol: 'TTLC', exact: false });
    expect(resolveTicker('Total Senegal', stocks)).toMatchObject({ symbol: 'TTLS', exact: true });
  });
});

describe('validateRows', () => {
  it('valide une transaction dans la fourchette du jour', () => {
    const r = validateRows([row({})], ctx);
    expect(r.rows[0].status).toBe('VALID');
    expect(r.canCommit).toBe(true);
  });

  it('bloque un titre avant sa date de cotation (Orange CI)', () => {
    const r = validateRows([row({ ticker: 'ORAC', date: '2020-05-04', price: 10000 })], ctx);
    expect(r.rows[0].status).toBe('BLOCKING');
    expect(r.rows[0].issues[0].code).toBe('NOT_LISTED_YET');
    expect(r.canCommit).toBe(false);
  });

  it('bloque titre inconnu, date future, quantité fractionnaire', () => {
    const r = validateRows([
      row({ ticker: 'XXXX' }),
      row({ date: '2027-01-04' }),
      row({ quantity: 2.5 }),
    ], ctx);
    expect(r.rows.map(x => x.issues[0].code)).toEqual(['TICKER_UNKNOWN', 'DATE_FUTURE', 'QTY_FRACTIONAL']);
    expect(r.summary.blocking).toBe(3);
  });

  it('signale un cours légèrement hors fourchette, bloque un cours absurde', () => {
    const r = validateRows([row({ price: 21500 }), row({ price: 60000 })], ctx);
    expect(r.rows[0]).toMatchObject({ status: 'WARNING' });
    expect(r.rows[0].issues[0].code).toBe('PRICE_OUT_OF_RANGE');
    expect(r.rows[1].issues[0].code).toBe('PRICE_IMPLAUSIBLE');
    expect(r.rows[1].issues[0].fixes?.[0].patch.price).toBe(20000);
  });

  it('ouvre la fourchette à ±7,5 % quand la séance n’a que la clôture', () => {
    const flat: Bar[] = [{ date: '2024-06-03', low: 2050, high: 2050, close: 2050 }];
    expect(priceRangeAt(flat, '2024-06-03')).toMatchObject({ exact: true, low: 2050 * 0.925, high: 2050 * 1.075 });
  });

  it('accepte un jour sans cotation avec la tolérance de séance', () => {
    // 2024-06-05 : pas d'échange, séances encadrantes 06-04 et 06-06
    const r = validateRows([row({ date: '2024-06-05', price: 20450 })], ctx);
    expect(r.rows[0].status).toBe('VALID');
  });

  it('propose l’ajustement quand le cours saisi est dans la base post-split', () => {
    // Avant le split, 100 titres à 5000 ; saisis en base ajustée : 200 à 2500
    const r = validateRows([row({ ticker: 'ONTBF', date: '2021-02-24', quantity: 200, price: 2500 })], ctx);
    const issue = r.rows[0].issues[0];
    expect(issue.code).toBe('SPLIT_ADJUSTED_INPUT');
    expect(r.rows[0].status).toBe('WARNING');
    expect(issue.fixes?.[0].patch).toEqual({ quantity: 100, price: 5000 });
  });

  it('propose l’ajustement quand le cours saisi est dans la base pré-split', () => {
    const r = validateRows([row({ ticker: 'ONTBF', date: '2021-03-02', quantity: 50, price: 5000 })], ctx);
    expect(r.rows[0].issues[0].code).toBe('PRE_SPLIT_INPUT');
    expect(r.rows[0].issues[0].fixes?.[0].patch).toEqual({ quantity: 100, price: 2500 });
  });

  it('bloque une vente supérieure à la position, splits pris en compte', () => {
    const ok = validateRows([
      row({ ticker: 'ONTBF', date: '2021-02-24', quantity: 100, price: 5000 }),
      row({ ticker: 'ONTBF', side: 'SELL', date: '2021-03-02', quantity: 200, price: 2500 }),
    ], ctx);
    expect(ok.canCommit).toBe(true);

    const ko = validateRows([
      row({ ticker: 'ONTBF', date: '2021-02-24', quantity: 100, price: 5000 }),
      row({ ticker: 'ONTBF', side: 'SELL', date: '2021-03-02', quantity: 201, price: 2500 }),
    ], ctx);
    expect(ko.rows[1].issues.map(i => i.code)).toContain('OVERSELL');
    expect(ko.canCommit).toBe(false);
  });

  it('signale le week-end avec correction vers le vendredi', () => {
    const r = validateRows([row({ date: '2024-06-08' })], ctx);
    const issue = r.rows[0].issues.find(i => i.code === 'DATE_NON_TRADING');
    expect(issue?.fixes?.[0].patch.date).toBe('2024-06-07');
  });

  it('contrôle le snapshot (PRU) sur l’historique et le capital déclaré', () => {
    const r = validateRows(
      [row({ side: 'OPENING', date: '2026-10-16', quantity: 10, price: 20200 })],
      ctx,
      { declaredCapital: 400000, cash: 50000 },
    );
    expect(r.rows[0].status).toBe('VALID');
    // 10 × 25 000 + 50 000 = 300 000 au marché ; 252 000 au coût → écart > 2 %
    expect(r.checks[0].code).toBe('CAPITAL_MISMATCH');
    expect(r.canCommit).toBe(true);

    const ok = validateRows([row({ side: 'OPENING', date: '2026-10-16', quantity: 10, price: 20200 })], ctx, { declaredCapital: 300000, cash: 50000 });
    expect(ok.checks).toHaveLength(0);
  });

  it('détecte les doublons avec l’existant', () => {
    const r = validateRows([row({})], ctx, { existing: [{ id: 'a', ticker: 'SNTS', side: 'BUY', date: '2024-06-03', quantity: 10, price: 20000, fees: 0 }] });
    expect(r.rows[0].issues[0].code).toBe('DUPLICATE');
  });
});

describe('ledger', () => {
  it('calcule PRU, PV réalisée et applique les splits', () => {
    const { positions } = replay([
      { ticker: 'ONTBF', side: 'BUY', date: '2021-02-24', quantity: 100, price: 5000, fees: 1000 },
      { ticker: 'ONTBF', side: 'SELL', date: '2021-03-02', quantity: 50, price: 2600, fees: 0 },
    ], t => (t === 'ONTBF' ? ontbfSplits : []));
    const p = positions[0];
    expect(p.quantity).toBe(150);
    expect(p.averageCost).toBeCloseTo(2505);
    expect(p.realizedPnl).toBeCloseTo(50 * (2600 - 2505));
  });

  it('écarte les lignes parasites de l’historique brut', () => {
    const dirty: Bar[] = [
      { date: '2016-01-29', low: 2700, high: 2800, close: 2768 },
      { date: '2016-01-30', low: 135000, high: 135000, close: 135000 },
      { date: '2016-02-01', low: 2800, high: 2850, close: 2819 },
      { date: '2016-02-02', low: 2800, high: 2850, close: 2820 },
    ];
    expect(cleanBars(dirty).map(b => b.close)).toEqual([2768, 2819, 2820]);
    expect(priceRangeAt(cleanBars(dirty), '2016-01-30')?.exact).toBe(false);
  });

  it('valorise la série dans la base de chaque date', () => {
    const s = buildValueSeries(
      [{ ticker: 'ONTBF', side: 'BUY', date: '2021-02-24', quantity: 100, price: 5000, fees: 0 }],
      () => ontbfBars, () => ontbfSplits, '2021-03-02', () => 2500,
    );
    expect(s[0]).toMatchObject({ date: '2021-02-24', value: 500000 });
    expect(s[s.length - 1]).toMatchObject({ date: '2021-03-02', value: 500000, invested: 500000 });
  });
});
