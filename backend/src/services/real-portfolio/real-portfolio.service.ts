// backend/src/services/real-portfolio/real-portfolio.service.ts
// Portefeuille réel importé : persistance, valorisation et historique.
// Toute écriture de transaction repasse par le moteur de cohérence
// (validateRows) côté serveur ; rien n'est enregistré s'il reste un ⛔.
//
// Reporting factuel uniquement (performance, allocation, exposition) :
// aucune recommandation d'achat ou de vente (contrainte CREPMG).

import prisma from '../../config/prisma';
import type { RealPortfolio, RealTransaction } from '@prisma/client';
import type { DraftRow, ImportMode, LedgerTx, ValidationReport } from './types';
import { validateRows, resolveTicker } from './validation-engine';
import { replay, buildValueSeries, sortTxs } from './ledger';
import { loadMarketContext, loadStockRefs, BarRequest } from './market-data';
import { fromIso, toIso } from './dates';

export class RealPortfolioError extends Error {
  constructor(public status: number, message: string, public report?: ValidationReport) {
    super(message);
  }
}

export interface DraftOptions {
  mode?: ImportMode;
  declaredCapital?: number | null;
  cash?: number | null;
  deletedIds?: string[];
  /** Passage snapshot → relevé : les lignes d'ouverture existantes sont remplacées. */
  replaceOpenings?: boolean;
}

const MAX_ROWS = 1000;

// ─── Accès ─────────────────────────────────────────────────────────────────

export async function findPortfolio(userId: string) {
  return prisma.realPortfolio.findFirst({
    where: { userId },
    orderBy: { created_at: 'asc' },
    include: { cash: true },
  });
}

async function requirePortfolio(userId: string) {
  const p = await findPortfolio(userId);
  if (!p) throw new RealPortfolioError(404, 'Aucun portefeuille réel.');
  return p;
}

function toLedger(t: RealTransaction): LedgerTx {
  return { id: t.id, ticker: t.stock_ticker, side: t.side as LedgerTx['side'], date: toIso(t.trade_date), quantity: t.quantity, price: t.price, fees: t.fees };
}

async function loadTxs(portfolioId: string) {
  return prisma.realTransaction.findMany({ where: { portfolioId }, orderBy: [{ trade_date: 'asc' }, { created_at: 'asc' }] });
}

// ─── Validation (simulation) ───────────────────────────────────────────────

async function buildReport(rows: DraftRow[], existing: LedgerTx[], opts: DraftOptions, cashFallback: number | null, declaredFallback: number | null) {
  if (rows.length > MAX_ROWS) throw new RealPortfolioError(400, `Trop de lignes (max ${MAX_ROWS}).`);
  const stocks = await loadStockRefs();
  const requests: BarRequest[] = [];
  for (const r of rows) {
    const sym = resolveTicker(r.ticker, stocks).symbol;
    if (sym) requests.push({ ticker: sym, from: r.side === 'OPENING' ? null : r.date || null });
  }
  for (const t of existing) requests.push({ ticker: t.ticker, from: t.date });
  const ctx = await loadMarketContext(requests, stocks);
  const report = validateRows(rows, ctx, {
    existing,
    deletedIds: opts.deletedIds,
    declaredCapital: opts.declaredCapital ?? declaredFallback,
    cash: opts.cash ?? cashFallback,
  });
  return { report, ctx };
}

function openingIds(txs: RealTransaction[]): string[] {
  return txs.filter(t => t.side === 'OPENING').map(t => t.id);
}

export async function validateDraft(userId: string, rows: DraftRow[], opts: DraftOptions = {}) {
  const portfolio = await findPortfolio(userId);
  const txs = portfolio ? await loadTxs(portfolio.id) : [];
  const deletedIds = [...(opts.deletedIds ?? []), ...(opts.replaceOpenings ? openingIds(txs) : [])];
  const { report } = await buildReport(rows, txs.map(toLedger), { ...opts, deletedIds }, portfolio?.cash?.amount ?? null, portfolio?.declared_capital ?? null);
  return report;
}

// ─── Écritures ─────────────────────────────────────────────────────────────

export interface CommitInput extends DraftOptions {
  rows: DraftRow[];
  source?: 'MANUAL' | 'CSV' | 'XLSX';
  fileName?: string | null;
  name?: string;
  broker?: string | null;
}

/**
 * Enregistre un lot (import ou saisie manuelle, création ou modification).
 * Revalide côté serveur : refuse (422 + rapport) s'il reste une ligne ⛔.
 */
export async function commitRows(userId: string, input: CommitInput) {
  let portfolio = await findPortfolio(userId);
  const txs = portfolio ? await loadTxs(portfolio.id) : [];

  // Une modification ne peut viser qu'une transaction de ce portefeuille.
  const ownIds = new Set(txs.map(t => t.id));
  for (const r of input.rows) {
    if (r.existingId && !ownIds.has(r.existingId)) throw new RealPortfolioError(404, 'Transaction introuvable.');
  }
  for (const id of input.deletedIds ?? []) {
    if (!ownIds.has(id)) throw new RealPortfolioError(404, 'Transaction introuvable.');
  }

  const deletedIds = [...(input.deletedIds ?? []), ...(input.replaceOpenings ? openingIds(txs) : [])];
  const { report, ctx } = await buildReport(
    input.rows, txs.map(toLedger), { ...input, deletedIds },
    input.cash ?? portfolio?.cash?.amount ?? null, input.declaredCapital ?? portfolio?.declared_capital ?? null,
  );
  if (!report.canCommit) throw new RealPortfolioError(422, 'Des lignes bloquantes subsistent.', report);

  if (!portfolio) {
    portfolio = await prisma.realPortfolio.create({
      data: {
        userId,
        name: input.name?.trim() || 'Mon portefeuille BRVM',
        broker: input.broker?.trim() || null,
        import_mode: input.mode ?? 'SNAPSHOT',
        declared_capital: input.declaredCapital ?? null,
        cash: { create: { amount: input.cash ?? 0 } },
      },
      include: { cash: true },
    });
  }
  const portfolioId = portfolio.id;
  const source = input.source ?? 'MANUAL';
  const byRow = new Map(report.rows.map(r => [r.rowId, r]));

  await prisma.$transaction(async (tx) => {
    const batch = input.rows.some(r => !r.existingId) && source !== 'MANUAL'
      ? await tx.realImportBatch.create({
          data: {
            portfolioId,
            mode: input.mode ?? portfolio!.import_mode,
            source,
            file_name: input.fileName ?? null,
            row_count: input.rows.length,
            warning_count: report.summary.warning,
          },
        })
      : null;

    if (deletedIds.length) await tx.realTransaction.deleteMany({ where: { id: { in: deletedIds }, portfolioId } });

    for (const row of input.rows) {
      const res = byRow.get(row.rowId)!;
      const data = {
        stock_ticker: res.resolvedTicker!,
        side: row.side,
        trade_date: fromIso(row.date),
        quantity: row.quantity!,
        price: row.price!,
        fees: row.fees ?? 0,
        validation_status: res.status,
        validation_flags: res.issues.map(i => ({ code: i.code, severity: i.severity, message: i.message })),
        split_adjusted: !!row.splitAdjusted,
        original_quantity: row.originalQuantity ?? null,
        original_price: row.originalPrice ?? null,
        note: row.note?.slice(0, 500) ?? null,
      };
      if (row.existingId) {
        await tx.realTransaction.update({ where: { id: row.existingId }, data });
      } else {
        await tx.realTransaction.create({ data: { ...data, portfolioId, source, import_batch_id: batch?.id ?? null } });
      }
    }

    const settings: Partial<RealPortfolio> = {};
    // Un relevé complet fait basculer le portefeuille en mode transactions (jamais l'inverse).
    if (input.mode === 'TRANSACTIONS' && portfolio!.import_mode !== 'TRANSACTIONS') settings.import_mode = 'TRANSACTIONS';
    if (input.declaredCapital !== undefined) settings.declared_capital = input.declaredCapital;
    if (Object.keys(settings).length) await tx.realPortfolio.update({ where: { id: portfolioId }, data: settings });
    if (input.cash != null) {
      await tx.realCashPosition.upsert({
        where: { portfolioId },
        update: { amount: input.cash, as_of: new Date() },
        create: { portfolioId, amount: input.cash },
      });
    }
  }, { timeout: 30000 });

  await rebuildPositions(portfolioId, ctx.splits, ctx.dividends);
  return { portfolioId, report };
}

/** Recalcule le cache RealPosition à partir des transactions. */
async function rebuildPositions(portfolioId: string, splitsOf?: Parameters<typeof replay>[1], dividendsOf?: Parameters<typeof replay>[2]) {
  const txs = await loadTxs(portfolioId);
  let splits = splitsOf, divs = dividendsOf;
  if (!splits) {
    const ctx = await loadMarketContext(txs.map(t => ({ ticker: t.stock_ticker, from: toIso(t.trade_date) })), undefined, false);
    splits = ctx.splits;
    divs = ctx.dividends;
  }
  const { positions } = replay(txs.map(toLedger), splits, divs);
  await prisma.$transaction([
    prisma.realPosition.deleteMany({ where: { portfolioId } }),
    prisma.realPosition.createMany({
      data: positions.map(p => ({
        portfolioId,
        stock_ticker: p.ticker,
        quantity: p.quantity,
        average_cost: p.averageCost,
        realized_pnl: p.realizedPnl,
        first_date: fromIso(p.firstDate),
      })),
    }),
  ]);
}

export async function deleteTransaction(userId: string, txId: string) {
  return commitRows(userId, { rows: [], deletedIds: [txId] });
}

export async function updateCash(userId: string, amount: number) {
  if (!Number.isFinite(amount) || amount < 0) throw new RealPortfolioError(400, 'Liquidité invalide.');
  const p = await requirePortfolio(userId);
  return prisma.realCashPosition.upsert({
    where: { portfolioId: p.id },
    update: { amount, as_of: new Date() },
    create: { portfolioId: p.id, amount },
  });
}

export async function updateSettings(userId: string, data: { name?: string; broker?: string | null; declaredCapital?: number | null; mode?: ImportMode }) {
  const p = await requirePortfolio(userId);
  return prisma.realPortfolio.update({
    where: { id: p.id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim().slice(0, 80) || p.name } : {}),
      ...(data.broker !== undefined ? { broker: data.broker?.trim().slice(0, 80) || null } : {}),
      ...(data.declaredCapital !== undefined ? { declared_capital: data.declaredCapital } : {}),
      ...(data.mode ? { import_mode: data.mode } : {}),
    },
  });
}

export async function deletePortfolio(userId: string) {
  const p = await requirePortfolio(userId);
  // Suppression explicite des enfants : la cascade Prisma n'est pas émulée sur deleteMany.
  await prisma.$transaction([
    prisma.realTransaction.deleteMany({ where: { portfolioId: p.id } }),
    prisma.realPosition.deleteMany({ where: { portfolioId: p.id } }),
    prisma.realImportBatch.deleteMany({ where: { portfolioId: p.id } }),
    prisma.realCashPosition.deleteMany({ where: { portfolioId: p.id } }),
    prisma.realPortfolio.delete({ where: { id: p.id } }),
  ]);
}

// ─── Lecture : dashboard ───────────────────────────────────────────────────

export async function getDashboard(userId: string) {
  const portfolio = await findPortfolio(userId);
  if (!portfolio) return null;
  const txs = await loadTxs(portfolio.id);
  const ctx = await loadMarketContext(txs.map(t => ({ ticker: t.stock_ticker, from: toIso(t.trade_date) })), undefined, false);
  const { positions } = replay(txs.map(toLedger), ctx.splits, ctx.dividends);
  const refOf = new Map(ctx.stocks.map(s => [s.symbol, s]));

  const lines = positions.filter(p => p.quantity > 0).map(p => {
    const ref = refOf.get(p.ticker);
    const price = ref?.lastPrice || p.averageCost;
    const prev = ref?.previousClose || price;
    const marketValue = p.quantity * price;
    return {
      ticker: p.ticker,
      name: ref?.name ?? p.ticker,
      sector: ref?.sector ?? 'Autre',
      quantity: p.quantity,
      averageCost: p.averageCost,
      costBasis: p.costBasis,
      lastPrice: price,
      previousClose: prev,
      marketValue,
      unrealizedPnl: marketValue - p.costBasis,
      unrealizedPct: p.costBasis > 0 ? ((marketValue - p.costBasis) / p.costBasis) * 100 : 0,
      dayChange: p.quantity * (price - prev),
      dayChangePct: prev > 0 ? ((price - prev) / prev) * 100 : 0,
      realizedPnl: p.realizedPnl,
      dividends: p.dividends,
      firstDate: p.firstDate,
      weight: 0,
    };
  });

  const cash = portfolio.cash?.amount ?? 0;
  const securitiesValue = lines.reduce((s, l) => s + l.marketValue, 0);
  const totalValue = securitiesValue + cash;
  for (const l of lines) l.weight = totalValue > 0 ? (l.marketValue / totalValue) * 100 : 0;
  lines.sort((a, b) => b.marketValue - a.marketValue);

  const costBasis = lines.reduce((s, l) => s + l.costBasis, 0);
  const unrealized = securitiesValue - costBasis;
  const realized = positions.reduce((s, p) => s + p.realizedPnl, 0);
  const dividends = positions.reduce((s, p) => s + p.dividends, 0);
  const dayChange = lines.reduce((s, l) => s + l.dayChange, 0);
  const prevSecurities = securitiesValue - dayChange;

  const sectorMap = new Map<string, number>();
  for (const l of lines) sectorMap.set(l.sector, (sectorMap.get(l.sector) ?? 0) + l.marketValue);
  if (cash > 0) sectorMap.set('Liquidités', cash);
  const allocationBySector = Array.from(sectorMap, ([name, value]) => ({ name, value, weight: totalValue > 0 ? (value / totalValue) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  const sorted = sortTxs(txs.map(toLedger));
  const flagged = txs.filter(t => t.validation_status === 'WARNING').length;
  return {
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      broker: portfolio.broker,
      importMode: portfolio.import_mode,
      declaredCapital: portfolio.declared_capital,
      createdAt: portfolio.created_at,
    },
    cash: { amount: cash, asOf: portfolio.cash?.as_of ?? null },
    totals: {
      totalValue,
      securitiesValue,
      costBasis,
      unrealizedPnl: unrealized,
      unrealizedPct: costBasis > 0 ? (unrealized / costBasis) * 100 : 0,
      realizedPnl: realized,
      dividends,
      dayChange,
      dayChangePct: prevSecurities > 0 ? (dayChange / prevSecurities) * 100 : 0,
      positionsCount: lines.length,
      // Concentration : poids de la 1re ligne et indice de Herfindahl (exposition, pas une reco)
      topWeight: lines[0]?.weight ?? 0,
      herfindahl: lines.reduce((s, l) => s + (l.weight / 100) ** 2, 0),
    },
    positions: lines,
    allocationBySector,
    transactionsCount: txs.length,
    flaggedCount: flagged,
    firstTradeDate: sorted[0]?.date ?? null,
    priceDate: ctx.today,
  };
}

export async function getTransactions(userId: string) {
  const p = await requirePortfolio(userId);
  const txs = await prisma.realTransaction.findMany({ where: { portfolioId: p.id }, orderBy: [{ trade_date: 'desc' }, { created_at: 'desc' }] });
  return txs.map(t => ({
    id: t.id,
    ticker: t.stock_ticker,
    side: t.side,
    date: toIso(t.trade_date),
    quantity: t.quantity,
    price: t.price,
    fees: t.fees,
    source: t.source,
    status: t.validation_status,
    flags: t.validation_flags,
    splitAdjusted: t.split_adjusted,
    note: t.note,
  }));
}

export async function getHistory(userId: string) {
  const p = await requirePortfolio(userId);
  const txs = await loadTxs(p.id);
  if (txs.length === 0) return { points: [], cash: p.cash?.amount ?? 0 };
  const ctx = await loadMarketContext(txs.map(t => ({ ticker: t.stock_ticker, from: toIso(t.trade_date) })));
  const priceOf = (t: string) => ctx.stocks.find(s => s.symbol === t)?.lastPrice ?? 0;
  const points = buildValueSeries(txs.map(toLedger), ctx.bars, ctx.splits, ctx.today, priceOf);
  return { points, cash: p.cash?.amount ?? 0 };
}
