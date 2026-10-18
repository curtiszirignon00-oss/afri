// backend/src/services/real-portfolio/validation-engine.ts
// Moteur de cohérence unique du portefeuille réel : utilisé à l'import
// (snapshot ou relevé), à la saisie manuelle et à chaque mise à jour.
//
// Fonction pure : le référentiel marché est injecté (MarketContext), ce qui
// la rend testable et garantit que client et serveur appliquent les mêmes règles.
// Statuts : VALID ✅ / WARNING ⚠️ (importable, signalé) / BLOCKING ⛔.

import type {
  Bar, DraftRow, FixSuggestion, Issue, LedgerTx, MarketContext, RowResult, SplitEvent, StockRef, ValidationReport,
} from './types';
import { addDays, isIsoDate, isWeekend, previousWeekday } from './dates';
import { cleanBars, replay } from './ledger';

export interface ValidationOptions {
  /** Tolérance autour de la fourchette du jour (frais SGI inclus dans le cours). */
  priceTolerance?: number;
  /** Au-delà : cours jugé implausible (⛔) s'il n'est expliqué par aucun split. */
  hardTolerance?: number;
  /** Écart toléré entre Σ lignes + liquidité et le capital déclaré. */
  capitalTolerance?: number;
  declaredCapital?: number | null;
  cash?: number | null;
  /** Transactions déjà enregistrées (pour la séquence, les doublons, le capital). */
  existing?: LedgerTx[];
  /** Transactions enregistrées supprimées dans cette opération. */
  deletedIds?: string[];
}

const DEFAULTS = { priceTolerance: 0.02, hardTolerance: 0.15, capitalTolerance: 0.02 };
/** Variation journalière maximale à la BRVM (±7,5 %). */
const BRVM_DAILY_LIMIT = 0.075;
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');

// ─── Résolution du titre ───────────────────────────────────────────────────

export function normalizeName(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\bCOTE D IVOIRE\b/g, ' ')
    .replace(/\b(SA|S A|CI|SN|BF|ML|NG|TG|BN|PLC)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface TickerResolution {
  symbol: string | null;
  exact: boolean;
  candidates: StockRef[];
}

export function resolveTicker(input: string, stocks: StockRef[]): TickerResolution {
  const raw = (input ?? '').trim().toUpperCase();
  if (!raw) return { symbol: null, exact: false, candidates: [] };
  const bySymbol = stocks.find(s => s.symbol.toUpperCase() === raw);
  if (bySymbol) return { symbol: bySymbol.symbol, exact: true, candidates: [bySymbol] };

  const q = normalizeName(raw);
  if (!q) return { symbol: null, exact: false, candidates: [] };
  const byName = stocks.filter(s => normalizeName(s.name) === q);
  // Mot entier (« SONATEL ») : résolu sans alerte s'il est unique.
  const wordRe = new RegExp(`(^| )${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`);
  const byWord = stocks.filter(s => wordRe.test(normalizeName(s.name)));
  if (byName.length === 1) {
    // « TOTAL » = TOTAL CI une fois le pays retiré, mais TOTAL SENEGAL existe aussi.
    if (byWord.length <= 1) return { symbol: byName[0].symbol, exact: true, candidates: byName };
    return { symbol: byName[0].symbol, exact: false, candidates: [byName[0], ...byWord.filter(s => s !== byName[0])].slice(0, 4) };
  }
  if (byWord.length === 1) return { symbol: byWord[0].symbol, exact: true, candidates: byWord };

  const partial = stocks.filter(s => {
    const n = normalizeName(s.name);
    return n.includes(q) || (q.length >= 4 && q.includes(n));
  });
  const candidates = (byWord.length > 1 ? byWord : partial).slice(0, 4);
  return { symbol: candidates.length === 1 ? candidates[0].symbol : null, exact: false, candidates };
}

// ─── Fourchette de cours autour d'une date ─────────────────────────────────

interface PriceRange { low: number; high: number; close: number; exact: boolean; refDate: string }

function barLow(b: Bar) { return b.low > 0 ? Math.min(b.low, b.close) : b.close; }
function barHigh(b: Bar) { return b.high > 0 ? Math.max(b.high, b.close) : b.close; }

/** Fourchette du jour si le titre a coté, sinon séances encadrantes (≤ 10 jours). */
export function priceRangeAt(bars: Bar[], date: string): PriceRange | null {
  let lo = 0, hi = bars.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (bars[mid].date < date) lo = mid + 1; else hi = mid; }
  const exact = bars[lo]?.date === date ? bars[lo] : null;
  if (exact) {
    const low = barLow(exact), high = barHigh(exact);
    // Séance sans fourchette enregistrée (bas = haut = clôture) : on ouvre à la
    // variation maximale autorisée dans la séance.
    if (high <= low) return { low: low * (1 - BRVM_DAILY_LIMIT), high: high * (1 + BRVM_DAILY_LIMIT), close: exact.close, exact: true, refDate: exact.date };
    return { low, high, close: exact.close, exact: true, refDate: exact.date };
  }

  const prev = lo > 0 && bars[lo - 1].date >= addDays(date, -10) ? bars[lo - 1] : null;
  const next = bars[lo] && bars[lo].date <= addDays(date, 10) ? bars[lo] : null;
  const around = [prev, next].filter(Boolean) as Bar[];
  if (around.length === 0) return null;
  // Titre non échangé ce jour-là : le cours a pu évoluer de ±7,5 % par séance.
  return {
    low: Math.min(...around.map(barLow)) * (1 - BRVM_DAILY_LIMIT),
    high: Math.max(...around.map(barHigh)) * (1 + BRVM_DAILY_LIMIT),
    close: (prev ?? next)!.close,
    exact: false,
    refDate: (prev ?? next)!.date,
  };
}

function within(price: number, low: number, high: number, tol: number): boolean {
  return price >= low * (1 - tol) && price <= high * (1 + tol);
}

function product(splits: SplitEvent[]): number {
  return splits.reduce((p, s) => p * s.ratio, 1);
}

function ratioLabel(r: number): string {
  return r >= 1 ? `1:${+r.toFixed(4)}` : `${+(1 / r).toFixed(4)}:1`;
}

function roundPrice(p: number): number {
  return Math.round(p * 100) / 100;
}

// ─── Contrôles d'une ligne ─────────────────────────────────────────────────

function checkPrice(row: DraftRow, ref: StockRef, bars: Bar[], splits: SplitEvent[], today: string, opt: typeof DEFAULTS): Issue[] {
  const price = row.price!;
  const qty = row.quantity!;

  if (row.side === 'OPENING') return checkOpeningPrice(row, ref, bars, splits, opt);

  const range = priceRangeAt(bars, row.date);
  if (!range) {
    const beforeData = ref.firstHistoryDate && row.date < ref.firstHistoryDate;
    return [{
      code: 'PRICE_UNVERIFIABLE',
      severity: 'WARNING',
      field: 'price',
      message: beforeData
        ? `Cours non vérifiable : notre historique ${ref.symbol} commence le ${ref.firstHistoryDate}.`
        : `Aucune cotation ${ref.symbol} autour du ${row.date} : cours non vérifiable.`,
    }];
  }

  const where = range.exact ? `le ${range.refDate}` : `autour du ${row.date} (séance de réf. ${range.refDate})`;
  const span = `${fmt(range.low)} – ${fmt(range.high)} F`;
  if (within(price, range.low, range.high, opt.priceTolerance)) return [];

  // Hypothèse split : cours saisi dans une autre base que celle du jour.
  const after = splits.filter(s => s.exDate > row.date && s.exDate <= today);
  const before = splits.filter(s => s.exDate <= row.date);
  const fAfter = product(after);
  if (after.length && within(price * fAfter, range.low, range.high, opt.priceTolerance)) {
    return [{
      code: 'SPLIT_ADJUSTED_INPUT',
      severity: 'WARNING',
      field: 'price',
      message: `Cours ${fmt(price)} F cohérent avec la base après split ${after.map(s => `${ratioLabel(s.ratio)} du ${s.exDate}`).join(', ')}. Le ${row.date}, ${ref.symbol} cotait ${span}.`,
      fixes: [{
        label: `Convertir en valeurs du ${row.date} (${fmt(qty / fAfter)} titres à ${fmt(price * fAfter)} F)`,
        patch: { quantity: qty / fAfter, price: roundPrice(price * fAfter) },
        splitAdjusted: true,
      }],
    }];
  }
  for (let i = before.length - 1; i >= 0; i--) {
    const f = product(before.slice(i));
    if (within(price / f, range.low, range.high, opt.priceTolerance)) {
      return [{
        code: 'PRE_SPLIT_INPUT',
        severity: 'WARNING',
        field: 'price',
        message: `Cours ${fmt(price)} F dans la base d'avant le split ${ratioLabel(f)} (${before[i].exDate}). Le ${row.date}, ${ref.symbol} cotait ${span}.`,
        fixes: [{
          label: `Ajuster au split (${fmt(qty * f)} titres à ${fmt(price / f)} F)`,
          patch: { quantity: qty * f, price: roundPrice(price / f) },
          splitAdjusted: true,
        }],
      }];
    }
  }

  const fix: FixSuggestion = { label: `Utiliser le cours de clôture (${fmt(range.close)} F)`, patch: { price: range.close } };
  if (within(price, range.low, range.high, opt.hardTolerance)) {
    return [{
      code: 'PRICE_OUT_OF_RANGE',
      severity: 'WARNING',
      field: 'price',
      message: `Cours ${fmt(price)} F hors de la fourchette ${where} (${span}). Frais inclus ou erreur de saisie ?`,
      fixes: [fix],
    }];
  }
  return [{
    code: 'PRICE_IMPLAUSIBLE',
    severity: 'BLOCKING',
    field: 'price',
    message: `Cours ${fmt(price)} F incompatible avec la cotation ${ref.symbol} ${where} (${span}).`,
    fixes: [fix],
  }];
}

/** Snapshot : le PRU est une moyenne d'achats à dates inconnues → contrôle sur l'historique. */
function checkOpeningPrice(row: DraftRow, ref: StockRef, bars: Bar[], splits: SplitEvent[], opt: typeof DEFAULTS): Issue[] {
  const price = row.price!;
  const qty = row.quantity!;
  const past = bars.filter(b => b.date <= row.date);
  if (past.length === 0) {
    return [{ code: 'PRICE_UNVERIFIABLE', severity: 'WARNING', field: 'price', message: `Aucun historique ${ref.symbol} avant le ${row.date} : PRU non vérifiable.` }];
  }
  // Cours historiques ramenés dans la base du jour du snapshot.
  const adj = past.map(b => b.close / product(splits.filter(s => s.exDate > b.date && s.exDate <= row.date)));
  const min = Math.min(...adj);
  const max = Math.max(...adj);
  const span = `${fmt(min)} – ${fmt(max)} F`;
  if (within(price, min, max, 0.1)) return [];

  for (const s of splits.filter(x => x.exDate <= row.date)) {
    if (within(price / s.ratio, min, max, 0.1)) {
      return [{
        code: 'PRE_SPLIT_INPUT',
        severity: 'WARNING',
        field: 'price',
        message: `PRU ${fmt(price)} F dans la base d'avant le split ${ratioLabel(s.ratio)} du ${s.exDate}. Fourchette historique ajustée : ${span}.`,
        fixes: [{
          label: `Ajuster au split (${fmt(qty * s.ratio)} titres, PRU ${fmt(price / s.ratio)} F)`,
          patch: { quantity: qty * s.ratio, price: roundPrice(price / s.ratio) },
          splitAdjusted: true,
        }],
      }];
    }
  }
  const severity = within(price, min, max, 1) ? 'WARNING' : 'BLOCKING';
  return [{
    code: severity === 'WARNING' ? 'PRU_OUT_OF_RANGE' : 'PRU_IMPLAUSIBLE',
    severity,
    field: 'price',
    message: `PRU ${fmt(price)} F hors de la fourchette historique ${ref.symbol} jusqu'au ${row.date} (${span}).`,
  }];
}

function checkRow(row: DraftRow, ctx: MarketContext, opt: typeof DEFAULTS): { issues: Issue[]; symbol: string | null } {
  const issues: Issue[] = [];

  // Titre
  const res = resolveTicker(row.ticker, ctx.stocks);
  if (!res.symbol) {
    issues.push({
      code: res.candidates.length ? 'TICKER_AMBIGUOUS' : 'TICKER_UNKNOWN',
      severity: 'BLOCKING',
      field: 'ticker',
      message: res.candidates.length
        ? `« ${row.ticker} » correspond à plusieurs titres.`
        : `Titre « ${row.ticker || '—'} » introuvable à la BRVM.`,
      fixes: res.candidates.map(c => ({ label: `${c.symbol} — ${c.name}`, patch: { ticker: c.symbol } })),
    });
  } else if (!res.exact) {
    const c = res.candidates[0];
    issues.push({
      code: 'TICKER_FUZZY',
      severity: 'WARNING',
      field: 'ticker',
      message: `« ${row.ticker} » interprété comme ${c.symbol} (${c.name})${res.candidates.length > 1 ? ' — autres titres possibles' : ''}.`,
      fixes: res.candidates.map((x, i) => ({ label: i === 0 ? `Confirmer ${x.symbol}` : `${x.symbol} — ${x.name}`, patch: { ticker: x.symbol } })),
    });
  }

  // Sens
  if (!['OPENING', 'BUY', 'SELL'].includes(row.side)) {
    issues.push({ code: 'SIDE_INVALID', severity: 'BLOCKING', field: 'side', message: 'Sens invalide (achat ou vente attendu).' });
  }

  // Date
  const dateOk = isIsoDate(row.date);
  if (!dateOk) {
    issues.push({ code: 'DATE_INVALID', severity: 'BLOCKING', field: 'date', message: `Date « ${row.date || '—'} » invalide.` });
  } else if (row.date > ctx.today) {
    issues.push({ code: 'DATE_FUTURE', severity: 'BLOCKING', field: 'date', message: 'Date dans le futur.' });
  } else if (row.side !== 'OPENING' && isWeekend(row.date)) {
    const fri = previousWeekday(row.date);
    issues.push({
      code: 'DATE_NON_TRADING',
      severity: 'WARNING',
      field: 'date',
      message: `Le ${row.date} est un week-end : pas de séance BRVM. Date de règlement plutôt que de négociation ?`,
      fixes: [{ label: `Utiliser le ${fri}`, patch: { date: fri } }],
    });
  }

  // Quantité / cours / frais
  if (row.quantity == null || !Number.isFinite(row.quantity) || row.quantity <= 0) {
    issues.push({ code: 'QTY_INVALID', severity: 'BLOCKING', field: 'quantity', message: 'Quantité manquante ou nulle.' });
  } else if (Math.abs(row.quantity - Math.round(row.quantity)) > 1e-6) {
    issues.push({
      code: 'QTY_FRACTIONAL',
      severity: 'BLOCKING',
      field: 'quantity',
      message: `Quantité ${row.quantity} non entière : les actions BRVM ne sont pas fractionnables.`,
      fixes: [{ label: `Arrondir à ${Math.round(row.quantity)}`, patch: { quantity: Math.round(row.quantity) } }],
    });
  }
  if (row.price == null || !Number.isFinite(row.price) || row.price <= 0) {
    issues.push({ code: 'PRICE_INVALID', severity: 'BLOCKING', field: 'price', message: 'Cours manquant ou nul.' });
  }
  if (row.fees != null && (!Number.isFinite(row.fees) || row.fees < 0)) {
    issues.push({ code: 'FEES_INVALID', severity: 'BLOCKING', field: 'fees', message: 'Frais négatifs ou invalides.' });
  }

  // Existence du titre à la date + plausibilité du cours
  const ref = res.symbol ? ctx.stocks.find(s => s.symbol === res.symbol)! : null;
  if (ref && dateOk && row.date <= ctx.today) {
    if (ref.listedAt && row.date < ref.listedAt) {
      issues.push({
        code: 'NOT_LISTED_YET',
        severity: 'BLOCKING',
        field: 'date',
        message: `${ref.symbol} n'est coté à la BRVM que depuis le ${ref.listedAt}.`,
        fixes: row.side === 'OPENING' ? [{ label: `Dater au ${ref.listedAt}`, patch: { date: ref.listedAt } }] : undefined,
      });
    } else if (ref.delistedAt && row.date > ref.delistedAt) {
      issues.push({ code: 'DELISTED', severity: 'BLOCKING', field: 'date', message: `${ref.symbol} est radié de la cote depuis le ${ref.delistedAt}.` });
    } else if (!ref.listedAt && ref.firstHistoryDate && row.date < ref.firstHistoryDate && row.side !== 'OPENING') {
      // Date de cotation non renseignée : on ne peut ni confirmer ni infirmer.
      issues.push({
        code: 'LISTING_UNVERIFIABLE',
        severity: 'WARNING',
        field: 'date',
        message: `Date antérieure à notre historique ${ref.symbol} (${ref.firstHistoryDate}) : cotation à cette date non vérifiable.`,
      });
    } else if (row.quantity && row.quantity > 0 && row.price && row.price > 0) {
      const splits = ctx.splits(ref.symbol);
      issues.push(...checkPrice(row, ref, cleanBars(ctx.bars(ref.symbol), splits), splits, ctx.today, opt));
    }
  }
  return { issues, symbol: res.symbol };
}

// ─── Validation d'un lot ───────────────────────────────────────────────────

function statusOf(issues: Issue[]): RowResult['status'] {
  if (issues.some(i => i.severity === 'BLOCKING')) return 'BLOCKING';
  return issues.length ? 'WARNING' : 'VALID';
}

function dupKey(t: { ticker: string; side: string; date: string; quantity: number; price: number }) {
  return `${t.ticker}|${t.side}|${t.date}|${t.quantity}|${t.price}`;
}

export function validateRows(rows: DraftRow[], ctx: MarketContext, options: ValidationOptions = {}): ValidationReport {
  const opt = {
    priceTolerance: options.priceTolerance ?? DEFAULTS.priceTolerance,
    hardTolerance: options.hardTolerance ?? DEFAULTS.hardTolerance,
    capitalTolerance: options.capitalTolerance ?? DEFAULTS.capitalTolerance,
  };

  const results: RowResult[] = rows.map(row => {
    const { issues, symbol } = checkRow(row, ctx, opt);
    return { rowId: row.rowId, status: statusOf(issues), resolvedTicker: symbol, issues };
  });

  // Transactions retenues pour les contrôles de séquence : lignes exploitables + existant non modifié.
  const editedIds = new Set(rows.map(r => r.existingId).filter(Boolean) as string[]);
  const deleted = new Set(options.deletedIds ?? []);
  const existing = (options.existing ?? []).filter(t => !t.id || (!editedIds.has(t.id) && !deleted.has(t.id)));
  const draftTx: (LedgerTx & { rowIndex: number })[] = [];
  rows.forEach((row, i) => {
    const sym = results[i].resolvedTicker;
    if (!sym || !isIsoDate(row.date) || !(row.quantity! > 0) || !(row.price! > 0)) return;
    draftTx.push({ id: `draft:${row.rowId}`, ticker: sym, side: row.side, date: row.date, quantity: row.quantity!, price: row.price!, fees: row.fees ?? 0, rowIndex: i });
  });

  // Doublons (dans le lot et avec l'existant)
  const seen = new Map<string, number>();
  for (const t of existing) seen.set(dupKey(t), (seen.get(dupKey(t)) ?? 0) + 1);
  for (const t of draftTx) {
    const k = dupKey(t);
    if (seen.has(k)) {
      results[t.rowIndex].issues.push({
        code: 'DUPLICATE',
        severity: 'WARNING',
        message: 'Transaction identique déjà présente (même titre, date, sens, quantité et cours).',
      });
    }
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }

  // Séquence : vente supérieure à la quantité détenue à la date (splits appliqués)
  const checks: Issue[] = [];
  const all: LedgerTx[] = [...existing, ...draftTx];
  const { positions, oversells } = replay(all, ctx.splits, ctx.dividends);
  for (const o of oversells) {
    const draft = draftTx.find(d => d.id === o.tx.id);
    const msg = `Vente de ${fmt(o.tx.quantity)} ${o.tx.ticker} le ${o.tx.date} alors que seulement ${fmt(o.held)} titres sont détenus à cette date.`;
    if (draft) {
      results[draft.rowIndex].issues.push({
        code: 'OVERSELL',
        severity: 'BLOCKING',
        field: 'quantity',
        message: msg,
        fixes: o.held > 0 ? [{ label: `Limiter à ${fmt(o.held)}`, patch: { quantity: o.held } }] : undefined,
      });
    } else {
      checks.push({ code: 'OVERSELL', severity: 'BLOCKING', message: `${msg} (transaction existante rendue incohérente par cette modification)` });
    }
  }

  // Cohérence arithmétique : Σ lignes + liquidité vs capital déclaré
  const declared = options.declaredCapital;
  if (declared && declared > 0) {
    const cash = options.cash ?? 0;
    const priceOf = (t: string) => ctx.stocks.find(s => s.symbol === t)?.lastPrice ?? 0;
    const market = positions.reduce((s, p) => s + p.quantity * priceOf(p.ticker), 0) + cash;
    const cost = positions.reduce((s, p) => s + p.costBasis, 0) + cash;
    const gap = Math.min(Math.abs(market - declared), Math.abs(cost - declared)) / declared;
    if (gap > opt.capitalTolerance) {
      checks.push({
        code: 'CAPITAL_MISMATCH',
        severity: 'WARNING',
        message: `Capital déclaré ${fmt(declared)} F ≠ lignes + liquidité : ${fmt(market)} F au dernier cours, ${fmt(cost)} F au coût de revient (écart ${(gap * 100).toFixed(1)} %). Une ligne ou la liquidité manque peut-être.`,
      });
    }
  }

  for (const r of results) r.status = statusOf(r.issues);
  const summary = {
    valid: results.filter(r => r.status === 'VALID').length,
    warning: results.filter(r => r.status === 'WARNING').length,
    blocking: results.filter(r => r.status === 'BLOCKING').length,
  };
  return {
    rows: results,
    checks,
    summary,
    canCommit: summary.blocking === 0 && !checks.some(c => c.severity === 'BLOCKING'),
  };
}
