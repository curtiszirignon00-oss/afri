/**
 * Analyse rapide SIMBA (fiche titre) — cache + contrôles de cohérence + pré-calcul.
 *
 *  - Une analyse par titre, stockée dans StockAIAnalysis, valable CACHE_TTL_MS.
 *  - Pré-calculée chaque soir après la clôture pour tous les titres actifs
 *    (cron dans scraping.job.ts) → la fiche titre s'affiche instantanément.
 *  - Les données sources passent par des contrôles de cohérence : une valeur
 *    aberrante est retirée du prompt et signalée, au lieu d'être commentée par l'IA.
 */

import { log } from '../config/logger';
import { prisma } from '../config/database';
import { chatService, StockData } from './ai-coach.service';
import { SIMBA_ANALYST_MODEL } from '../ai/models';

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export interface StockAnalysisResult {
  text: string;
  generatedAt: Date;
  cached: boolean;
  dataWarnings: string[];
}

// ─── Données + contrôles de cohérence ─────────────────────────────────────────

/** Charge les données du titre et écarte les valeurs incohérentes. null si titre inconnu. */
export async function buildStockData(ticker: string): Promise<{ data: StockData; warnings: string[] } | null> {
  const [dbStock, fundamental, annualData, history52w] = await Promise.all([
    prisma.stock.findUnique({
      where: { symbol: ticker },
      select: {
        symbol: true, company_name: true, sector: true, description: true,
        current_price: true, daily_change_percent: true, volume: true, market_cap: true,
      },
    }),
    prisma.stockFundamental.findUnique({
      where: { stock_ticker: ticker },
      select: {
        market_cap: true, pe_ratio: true, pb_ratio: true, dividend_yield: true,
        eps: true, roe: true, roa: true, profit_margin: true,
        revenue: true, net_income: true, book_value: true, year: true,
      },
    }),
    prisma.annualFinancials.findMany({
      where: { stock_ticker: ticker },
      orderBy: { year: 'desc' },
      take: 5,
      select: {
        year: true, revenue: true, net_income: true, revenue_growth: true,
        net_income_growth: true, eps: true, pe_ratio: true, dividend: true,
        roe: true, roa: true, net_margin: true,
      },
    }),
    prisma.stockHistory.findMany({
      where: {
        stock_ticker: ticker,
        date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
      },
      select: { high: true, low: true },
    }),
  ]);
  if (!dbStock) return null;

  const warnings: string[] = [];
  const price = dbStock.current_price > 0 ? dbStock.current_price : undefined;
  if (!price) warnings.push('Cours actuel indisponible (0 ou absent).');

  let week_high = history52w.length > 0 ? Math.max(...history52w.map((h) => h.high)) : undefined;
  let week_low  = history52w.length > 0 ? Math.min(...history52w.map((h) => h.low))  : undefined;

  // Un cours hors de [plus bas × 0,8 ; plus haut × 1,2] signale une erreur d'unité ou d'historique
  if (price && week_high != null && week_low != null && (price > week_high * 1.2 || price < week_low * 0.8)) {
    warnings.push(
      `Cours actuel (${price.toLocaleString('fr-FR')} FCFA) incohérent avec la fourchette 52 semaines `
      + `(${week_low.toLocaleString('fr-FR')} – ${week_high.toLocaleString('fr-FR')} FCFA) : fourchette écartée.`,
    );
    week_high = undefined;
    week_low = undefined;
  }

  // Ratios hors bornes plausibles → retirés
  const plausible = (label: string, v: number | null | undefined, min: number, max: number): number | undefined => {
    if (v == null || !Number.isFinite(v)) return undefined;
    if (v < min || v > max) {
      warnings.push(`${label} = ${v} hors bornes plausibles : valeur écartée.`);
      return undefined;
    }
    return v;
  };

  // market_cap du fundamental est en M FCFA → convertir en FCFA pour cohérence
  const marketCapFCFA = fundamental?.market_cap != null
    ? fundamental.market_cap * 1_000_000
    : dbStock.market_cap || undefined;

  const data: StockData = {
    company_name:         dbStock.company_name.slice(0, 100),
    symbol:               ticker,
    sector:               dbStock.sector ?? undefined,
    description:          dbStock.description?.slice(0, 500) ?? undefined,
    current_price:        price,
    daily_change_percent: plausible('Variation journalière (%)', dbStock.daily_change_percent, -50, 50),
    volume:               dbStock.volume ?? undefined,
    market_cap:           marketCapFCFA,
    pe_ratio:             plausible('PER', fundamental?.pe_ratio, 0, 200),
    roe:                  plausible('ROE (%)', fundamental?.roe, -200, 200),
    roa:                  plausible('ROA (%)', fundamental?.roa, -100, 100),
    net_margin:           plausible('Marge nette (%)', fundamental?.profit_margin, -200, 100),
    eps:                  fundamental?.eps ?? undefined,
    revenue:              fundamental?.revenue ?? undefined,
    net_income:           fundamental?.net_income ?? undefined,
    dividend_yield:       plausible('Rendement du dividende (%)', fundamental?.dividend_yield, 0, 30),
    annual_data:          annualData ?? [],
    week_high,
    week_low,
    data_warnings:        warnings,
  };

  if (warnings.length) log.warn(`[StockAI] ${ticker} — données incohérentes : ${warnings.join(' | ')}`);
  return { data, warnings };
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export async function getCachedAnalysis(ticker: string, maxAgeMs = CACHE_TTL_MS): Promise<StockAnalysisResult | null> {
  const row = await prisma.stockAIAnalysis.findUnique({ where: { stock_ticker: ticker } });
  if (!row || Date.now() - row.generated_at.getTime() > maxAgeMs) return null;
  return { text: row.content, generatedAt: row.generated_at, cached: true, dataWarnings: row.data_warnings };
}

// Évite deux générations simultanées du même titre (visiteurs concurrents / cron)
const inFlight = new Map<string, Promise<StockAnalysisResult | null>>();

/** Génère (sans regarder le cache) et enregistre l'analyse. null si titre inconnu ou échec IA. */
export function generateAndStore(ticker: string): Promise<StockAnalysisResult | null> {
  const pending = inFlight.get(ticker);
  if (pending) return pending;

  const job = (async () => {
    const built = await buildStockData(ticker);
    if (!built) return null;

    const result = await chatService.analyzeMarket(built.data);
    if (!result.success || !result.text) return null;

    const generatedAt = new Date();
    await prisma.stockAIAnalysis.upsert({
      where: { stock_ticker: ticker },
      create: {
        stock_ticker: ticker, content: result.text, model: SIMBA_ANALYST_MODEL,
        data_warnings: built.warnings, generated_at: generatedAt,
      },
      update: {
        content: result.text, model: SIMBA_ANALYST_MODEL,
        data_warnings: built.warnings, generated_at: generatedAt,
      },
    });
    return { text: result.text, generatedAt, cached: false, dataWarnings: built.warnings };
  })().finally(() => inFlight.delete(ticker));

  inFlight.set(ticker, job);
  return job;
}

/** Cache s'il est frais, sinon génération. */
export async function getOrGenerateAnalysis(ticker: string): Promise<StockAnalysisResult | null> {
  return (await getCachedAnalysis(ticker)) ?? generateAndStore(ticker);
}

// ─── Pré-calcul du soir ───────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Régénère l'analyse de tous les titres actifs, un par un.
 * Espacement par défaut 30 s : la limite Groq gratuite (8 000 tokens/min sur
 * gpt-oss-120b) est partagée avec les utilisateurs. À réduire via
 * AI_PRECOMPUTE_DELAY_MS une fois en Dev Tier.
 */
export async function precomputeStockAnalyses(): Promise<{ done: number; failed: string[]; skipped: number }> {
  const delayMs = Number(process.env.AI_PRECOMPUTE_DELAY_MS ?? 30_000);
  // Une analyse générée il y a moins de 6 h (après la clôture du jour) est conservée
  const freshMs = 6 * 60 * 60 * 1000;

  const stocks = await prisma.stock.findMany({ where: { is_active: true }, select: { symbol: true } });
  let done = 0;
  let skipped = 0;
  const failed: string[] = [];

  for (const { symbol } of stocks) {
    if (await getCachedAnalysis(symbol, freshMs)) { skipped++; continue; }
    try {
      const r = await generateAndStore(symbol);
      if (r) done++; else failed.push(symbol);
    } catch (err: any) {
      log.error(`[StockAI] Pré-calcul ${symbol} échoué :`, err?.message);
      failed.push(symbol);
    }
    await sleep(delayMs);
  }

  log.info(`[StockAI] Pré-calcul terminé : ${done} générées, ${skipped} déjà fraîches, ${failed.length} échecs${failed.length ? ` (${failed.join(', ')})` : ''}`);
  return { done, failed, skipped };
}
