// ── Promotion à durée limitée (packs cohorte) ────────────────────────────────
// Doit rester synchronisé avec backend/src/config/promo.ts
// Starter -50%, Parcours/Investisseur -30%. Fenêtre de 24h.
// Lancée le 31 juillet 2026 — se termine le 1er août à 12h00 (UTC/Abidjan).
export const PROMO_END_ISO = '2026-08-01T12:00:00Z';

export const PROMO_RATES: Record<string, number> = {
  starter: 0.5,
  parcours: 0.3,
  investisseur: 0.3,
};

export function promoEndMs(): number {
  return new Date(PROMO_END_ISO).getTime();
}

export function isPromoActive(now: number = Date.now()): boolean {
  return now < promoEndMs();
}

/** Taux de remise actif pour un pack (0 si promo terminée / pack inconnu). */
export function promoRate(tier: string, now: number = Date.now()): number {
  return isPromoActive(now) ? (PROMO_RATES[tier] ?? 0) : 0;
}

/** Pourcentage de remise entier pour affichage (ex. 50). */
export function promoPercent(tier: string, now: number = Date.now()): number {
  return Math.round(promoRate(tier, now) * 100);
}

/** Applique la remise à un montant, arrondi aux 100 XOF. */
export function applyPromo(tier: string, amount: number, now: number = Date.now()): number {
  const r = promoRate(tier, now);
  return r ? Math.round((amount * (1 - r)) / 100) * 100 : amount;
}

/** Millisecondes restantes avant la fin de la promo (0 si terminée). */
export function promoRemainingMs(now: number = Date.now()): number {
  return Math.max(0, promoEndMs() - now);
}

/** Formatte un compte à rebours en "HHh MMm SSs". */
export function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}
