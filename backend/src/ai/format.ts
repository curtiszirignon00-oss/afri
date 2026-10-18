/**
 * Formatage des nombres et unités pour les prompts SIMBA — source unique.
 *
 * Deux pièges constatés en production :
 *  - Les espaces insécables de toLocaleString('fr-FR') font mal lire les nombres
 *    au modèle (« 43500 » lu « 435 000 ») → espace simple partout.
 *  - Unités hétérogènes en base : revenue / net_income / book_value / ebitda /
 *    free_cash_flow sont en MILLIONS de FCFA ; stockFundamental.market_cap est
 *    tantôt en millions (SNTS, ABJC…), tantôt en FCFA ; stock.market_cap est
 *    incohérent. La capitalisation est donc recalculée : cours × nombre d'actions.
 */

/** Entier avec espaces simples comme séparateurs de milliers. */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR').replace(/[  ]/g, ' ');
}

/** Décimal (virgule française) avec espaces simples. */
export function fmtDec(n: number, digits = 2): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).replace(/[  ]/g, ' ');
}

/** Prix ou montant exprimé en FCFA (ex. 43 500 FCFA). */
export function fmtFCFA(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? 'N/D' : `${fmtInt(n)} FCFA`;
}

/** Montant exprimé en FCFA bruts, mis à l'échelle (ex. 4 350 Mds FCFA). */
export function fmtLargeFCFA(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return 'N/D';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${fmtDec(n / 1e9, abs >= 1e11 ? 0 : 1)} Mds FCFA`;
  if (abs >= 1e6) return `${fmtDec(n / 1e6, abs >= 1e8 ? 0 : 1)} M FCFA`;
  return fmtFCFA(n);
}

/** Montant stocké en MILLIONS de FCFA (revenue, net_income, book_value…). */
export function fmtMillionsFCFA(m: number | null | undefined): string {
  return m == null || !Number.isFinite(m) ? 'N/D' : fmtLargeFCFA(m * 1e6);
}

/**
 * Capitalisation boursière en FCFA : cours × nombre d'actions (fiable),
 * à défaut stockFundamental.market_cap normalisé (< 1e9 ⇒ exprimé en millions).
 */
export function marketCapFCFA(
  price: number | null | undefined,
  shares: number | null | undefined,
  fundamentalCap?: number | null,
): number | null {
  if (price && price > 0 && shares && shares > 0) return price * shares;
  if (fundamentalCap && fundamentalCap > 0) return fundamentalCap < 1e9 ? fundamentalCap * 1e6 : fundamentalCap;
  return null;
}

/** Bornes plausibles des ratios : hors bornes ⇒ erreur de saisie ou d'unité. */
export const PLAUSIBLE_RANGES: Record<string, [number, number]> = {
  pe_ratio: [0, 200],
  pb_ratio: [0, 30],
  roe: [-200, 200],
  roa: [-100, 100],
  profit_margin: [-200, 100],
  dividend_yield: [0, 30],
  debt_to_equity: [0, 50],
};

export function plausibleRatio(metric: string, v: unknown): number | null {
  const range = PLAUSIBLE_RANGES[metric];
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (range && (v < range[0] || v > range[1])) return null;
  return v;
}
