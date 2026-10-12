// backend/src/config/brvmMarket.ts
// Source de vérité unique pour le calendrier et les horaires de séance de la BRVM.
// La BRVM siège à Abidjan (GMT/UTC+0) : les horaires officiels sont donc en UTC.

/** Minutes depuis minuit UTC. */
const at = (hours: number, minutes = 0) => hours * 60 + minutes;

export type BRVMPhaseKey =
  | 'closed'
  | 'pre-open'
  | 'opening-fixing'
  | 'continuous'
  | 'pre-close'
  | 'closing-fixing'
  | 'last-price';

export type BRVMPhase = {
  key: BRVMPhaseKey;
  label: string;
  /** Début inclus, en minutes depuis minuit UTC. */
  start: number;
  /** Fin exclue, en minutes depuis minuit UTC. */
  end: number;
  /** Faux pendant les phases de saisie d'ordres sans transaction (pré-ouverture, pré-clôture) :
   *  le dernier cours n'y bouge pas, inutile d'y créer des bougies. */
  tradeable: boolean;
};

/**
 * Déroulé d'une séance BRVM (heures UTC = heures d'Abidjan).
 *   09h00–09h45  pré-ouverture (saisie des ordres, aucune transaction)
 *   09h45        fixing d'ouverture → premier cours de la séance
 *   09h45–14h00  négociation en continu
 *   14h00–14h30  pré-clôture (saisie des ordres, aucune transaction)
 *   14h30        fixing de clôture → cours de clôture
 *   14h30–15h00  négociation au dernier cours
 *   15h00        fermeture (± 60 s aléatoires)
 */
export const BRVM_PHASES: BRVMPhase[] = [
  { key: 'pre-open',       label: 'Pré-ouverture',                start: at(9),      end: at(9, 45),  tradeable: false },
  { key: 'continuous',     label: 'Négociation en continu',       start: at(9, 45),  end: at(14),     tradeable: true  },
  { key: 'pre-close',      label: 'Pré-clôture',                  start: at(14),     end: at(14, 30), tradeable: false },
  { key: 'last-price',     label: 'Négociation au dernier cours', start: at(14, 30), end: at(15),     tradeable: true  },
];

/** Fixing d'ouverture : premier cours coté de la séance. */
export const BRVM_OPENING_FIXING_MIN = at(9, 45);
/** Fixing de clôture : cours de clôture officiel. */
export const BRVM_CLOSING_FIXING_MIN = at(14, 30);
/** Ouverture de la séance (début de la pré-ouverture). */
export const BRVM_SESSION_OPEN_MIN = at(9);
/** Fermeture du marché (± 60 s aléatoires côté BRVM). */
export const BRVM_SESSION_CLOSE_MIN = at(15);

/**
 * Marge après la fermeture pendant laquelle on accepte encore un snapshot.
 * La source est rafraîchie toutes les 15 min : le cours de clôture de 15h00
 * peut n'apparaître qu'au passage suivant.
 */
const CLOSE_GRACE_MINUTES = 15;

/**
 * Fenêtre de collecte des snapshots intraday : du fixing d'ouverture (09h45,
 * premier cours réel) à la fermeture + marge (15h15).
 *
 * On démarre à 09h45 et non à 09h00 : pendant la pré-ouverture aucune
 * transaction n'a lieu, le « dernier cours » affiché est encore celui de la
 * veille — des snapshots pris là produiraient des bougies plates en début de
 * séance et fausseraient l'ouverture.
 */
export const BRVM_COLLECTION_START_MIN = BRVM_OPENING_FIXING_MIN;
export const BRVM_COLLECTION_END_MIN = BRVM_SESSION_CLOSE_MIN + CLOSE_GRACE_MINUTES;

/**
 * Jours fériés de la BRVM (format 'YYYY-MM-DD', UTC) : aucune cotation, donc
 * aucune bougie. À compléter chaque année à partir du calendrier officiel.
 */
export const BRVM_HOLIDAYS: ReadonlySet<string> = new Set<string>([]);

/** Clé 'YYYY-MM-DD' en UTC. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Vrai si la date est un jour de cotation : lundi–vendredi, hors jour férié. */
export function isBRVMTradingDay(date: Date = new Date()): boolean {
  const day = date.getUTCDay(); // 0 = dimanche, 6 = samedi
  if (day === 0 || day === 6) return false;
  return !BRVM_HOLIDAYS.has(utcDateKey(date));
}

/** Minutes écoulées depuis minuit UTC. */
export function utcMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

/** Phase de séance en cours, ou 'closed' hors séance / week-end / férié. */
export function getBRVMPhase(date: Date = new Date()): BRVMPhase | { key: 'closed'; label: 'Marché fermé'; tradeable: false } {
  if (!isBRVMTradingDay(date)) return { key: 'closed', label: 'Marché fermé', tradeable: false };
  const minutes = utcMinutes(date);
  const phase = BRVM_PHASES.find(p => minutes >= p.start && minutes < p.end);
  return phase ?? { key: 'closed', label: 'Marché fermé', tradeable: false };
}

/**
 * Vrai si l'instant donné appartient à la fenêtre de collecte des snapshots
 * intraday (jour de cotation, 09h45 → 15h15 UTC).
 */
export function isWithinBRVMCollectionWindow(date: Date = new Date()): boolean {
  if (!isBRVMTradingDay(date)) return false;
  const minutes = utcMinutes(date);
  return minutes >= BRVM_COLLECTION_START_MIN && minutes <= BRVM_COLLECTION_END_MIN;
}

/**
 * Ramène un horodatage de snapshot dans la séance pour le calcul des bougies.
 *
 * Le dernier snapshot utile est pris juste après la fermeture (marge de 15 min)
 * car il porte le cours de clôture définitif. Sans recalage il ouvrirait une
 * bougie-moignon à 15h00/15h15, après la fermeture. On le replie donc dans la
 * dernière tranche cotée de la séance (14h45–15h00), où il appartient.
 */
export function clampToSessionEnd(date: Date): Date {
  const minutes = utcMinutes(date);
  if (minutes < BRVM_SESSION_CLOSE_MIN) return date;
  const clamped = new Date(date);
  // Une seconde avant la fermeture : dernier bucket coté, quel que soit l'intervalle
  clamped.setUTCHours(14, 59, 59, 0);
  return clamped;
}

/** Vrai si le marché est ouvert (pré-ouverture incluse), au sens « séance en cours ». */
export function isBRVMMarketOpen(date: Date = new Date()): boolean {
  if (!isBRVMTradingDay(date)) return false;
  const minutes = utcMinutes(date);
  return minutes >= BRVM_SESSION_OPEN_MIN && minutes < BRVM_SESSION_CLOSE_MIN;
}
