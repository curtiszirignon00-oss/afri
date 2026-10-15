// src/utils/brvmSession.ts
// Horaires et phases de séance de la BRVM, côté front.
// Miroir de `backend/src/config/brvmMarket.ts` : toute correction d'horaire doit
// être reportée dans les deux fichiers.
//
// La BRVM siège à Abidjan (fuseau GMT/UTC+0) : les horaires officiels sont donc
// des horaires UTC, et tout est calculé en UTC quel que soit le fuseau du
// visiteur. Séances du lundi au vendredi.
//
//   09h00–09h45  pré-ouverture (saisie des ordres, aucune transaction)
//   09h45        fixing d'ouverture → premier cours de la séance
//   09h45–14h00  négociation en continu
//   14h00–14h30  pré-clôture (saisie des ordres, aucune transaction)
//   14h30        fixing de clôture → cours de clôture
//   14h30–15h00  négociation au dernier cours
//   15h00        fermeture (± 60 s aléatoires)

/** Minutes depuis minuit UTC. */
const at = (hours: number, minutes = 0) => hours * 60 + minutes;

/** 'live' = transactions en cours · 'auction' = saisie d'ordres sans transaction */
export type BRVMTone = 'live' | 'auction' | 'closed';

export type BRVMSegment = {
  label: string;
  /** Début inclus, minutes depuis minuit UTC */
  start: number;
  /** Fin exclue, minutes depuis minuit UTC */
  end: number;
  /** Ce qui démarre à la fin de ce segment */
  next: string;
  tone: BRVMTone;
};

export const BRVM_SEGMENTS: BRVMSegment[] = [
  { label: 'Pré-ouverture',                start: at(9),      end: at(9, 45),  next: "Fixing d'ouverture", tone: 'auction' },
  { label: 'Négociation en continu',       start: at(9, 45),  end: at(14),     next: 'Pré-clôture',        tone: 'live'    },
  { label: 'Pré-clôture',                  start: at(14),     end: at(14, 30), next: 'Fixing de clôture',  tone: 'auction' },
  { label: 'Négociation au dernier cours', start: at(14, 30), end: at(15),     next: 'Fermeture',          tone: 'live'    },
];

/** Ouverture de la séance (début de la pré-ouverture). */
export const BRVM_SESSION_OPEN_MIN = at(9);
/** Fixing d'ouverture : premier cours coté de la séance. */
export const BRVM_OPENING_FIXING_MIN = at(9, 45);
/** Fermeture du marché. */
export const BRVM_SESSION_CLOSE_MIN = at(15);

export type BRVMMarketState = {
  label: string;
  next: string;
  tone: BRVMTone;
  /** Instant de la prochaine transition */
  target: Date;
};

/** Date UTC à minuit, décalée de `offsetDays`. */
function utcMidnight(from: Date, offsetDays = 0): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + offsetDays));
}

/** Minutes écoulées depuis minuit UTC. */
export function utcMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/** Vrai si la date est un jour de cotation (lundi–vendredi). */
export function isBRVMTradingDay(date: Date): boolean {
  const d = date.getUTCDay(); // 0 = dimanche, 6 = samedi
  return d !== 0 && d !== 6;
}

/**
 * Vrai si la séance du jour a dépassé le fixing d'ouverture (09h45 UTC), donc
 * s'il existe au moins un cours coté aujourd'hui.
 *
 * À utiliser avant de construire une bougie du jour : en pré-ouverture aucune
 * transaction n'a lieu et le « dernier cours » est encore celui de la veille —
 * une bougie construite là duplique la séance précédente.
 */
export function hasBRVMSessionStarted(date: Date = new Date()): boolean {
  return isBRVMTradingDay(date) && utcMinutes(date) >= BRVM_OPENING_FIXING_MIN;
}

/** Prochaine ouverture de séance (09h00 UTC du prochain jour ouvré). */
function nextSessionOpen(now: Date): Date {
  // Aujourd'hui si la séance n'a pas encore commencé, sinon à partir de demain
  const startOffset = isBRVMTradingDay(now) && utcMinutes(now) < BRVM_SESSION_OPEN_MIN ? 0 : 1;
  for (let i = startOffset; i < 10; i++) {
    const day = utcMidnight(now, i);
    if (isBRVMTradingDay(day)) return new Date(day.getTime() + BRVM_SESSION_OPEN_MIN * 60_000);
  }
  return new Date(utcMidnight(now, 1).getTime() + BRVM_SESSION_OPEN_MIN * 60_000);
}

/** Phase en cours et instant de la transition suivante. */
export function getBRVMMarketState(now: Date = new Date()): BRVMMarketState {
  if (isBRVMTradingDay(now)) {
    const minutes = utcMinutes(now);
    const segment = BRVM_SEGMENTS.find(s => minutes >= s.start && minutes < s.end);
    if (segment) {
      return {
        label: segment.label,
        next: segment.next,
        tone: segment.tone,
        target: new Date(utcMidnight(now).getTime() + segment.end * 60_000),
      };
    }
  }
  return {
    label: 'Marché fermé',
    next: 'Pré-ouverture',
    tone: 'closed',
    target: nextSessionOpen(now),
  };
}
