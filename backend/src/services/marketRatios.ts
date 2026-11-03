/**
 * Ratios de marché d'une valeur (cours × données du dernier exercice).
 *
 * Partagé par le job quotidien et les scripts de correction des fondamentaux.
 * Un ratio non calculable ou non significatif vaut null : le laisser intact
 * figeait d'anciennes valeurs (rendement de 95 % pour FTSC après l'arrêt du
 * dividende, PER d'un exercice bénéficiaire conservé après une perte).
 */

export interface MarketRatioInputs {
  price: number;
  /** Nombre de titres */
  shares: number | null;
  /** BNPA en FCFA */
  eps: number | null;
  /** Capitaux propres en millions de FCFA */
  equity: number | null;
  /** Dividende net par action en FCFA ; 0 = pas de dividende, null = inconnu */
  dividend: number | null;
}

export interface MarketRatios {
  market_cap: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Au-delà, le ratio traduit un bénéfice ou des fonds propres quasi nuls
const MAX_PER = 200;
const PBR_RANGE: [number, number] = [0.1, 100];

export function computeMarketRatios({ price, shares, eps, equity, dividend }: MarketRatioInputs): MarketRatios {
  const per = eps && eps > 0 ? round2(price / eps) : null;

  const bookValuePerShare = equity && shares && shares > 0 ? (equity * 1_000_000) / shares : null;
  const pb = bookValuePerShare && bookValuePerShare > 0 ? round2(price / bookValuePerShare) : null;

  return {
    market_cap: shares && shares > 0 ? round2(price * shares) : null,
    pe_ratio: per !== null && per <= MAX_PER ? per : null,
    pb_ratio: pb !== null && pb >= PBR_RANGE[0] && pb <= PBR_RANGE[1] ? pb : null,
    dividend_yield: dividend == null ? null : dividend > 0 ? round2((dividend / price) * 100) : 0,
  };
}
