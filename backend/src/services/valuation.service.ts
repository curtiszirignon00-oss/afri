// Service de valorisation fondamentale.
//
// Le backend ne rejoue jamais les formules de valorisation : celles-ci vivent dans
// afribourse/src/lib/valuation et tournent cote client pour que chaque modification
// d'hypothese se recalcule en direct. Ici on ne fait que :
//   - servir les inputs des couches 1 et 2 (etats financiers, fiches Damodaran, hypotheses)
//   - calculer le beta de regression, qui a besoin de l'historique complet des cotations
//   - persister des ValuationRun versionnes, instantanes traçables d'un calcul
//   - agreger les runs publies d'un meme secteur pour la valorisation relative

import prisma from '../config/prisma';
import { Prisma, StatementPeriod } from '@prisma/client';

/**
 * Mapping secteur AfriBourse -> libelle de fiche sectorielle Damodaran.
 * Les cles doivent correspondre EXACTEMENT aux libelles stockes dans Stock.sector,
 * accents compris (ex. "Télécommunications", "Consommation Discrétionnaire") :
 * une cle non accentuee renvoie null et prive le titre de toute fiche Damodaran.
 * Reste surchargeable par titre via ValuationAssumptions.damodaran_sector.
 */
const DAMODARAN_SECTOR_MAP: Record<string, string> = {
  'Services Publics': 'Utility (Water)',
  'Services Financiers': 'Bank (Money Center)',
  Energie: 'Oil/Gas (Integrated)',
  Industriels: 'Machinery',
  'Consommation de Base': 'Food Processing',
  'Consommation Discrétionnaire': 'Retail (General)',
  Télécommunications: 'Telecom (Wireless)'
};

/**
 * Pays par defaut des titres BRVM quand la fiche du titre ne le renseigne pas.
 * Le libelle doit correspondre exactement a celui des fiches CountryRiskPremium.
 */
export const DEFAULT_COUNTRY = "Cote d'Ivoire";

export function mapSectorToDamodaran(sector: string | null | undefined): string | null {
  if (!sector) return null;
  return DAMODARAN_SECTOR_MAP[sector] ?? null;
}

/**
 * Inputs complets d'une valorisation : tout ce que le moteur client a besoin de
 * connaitre pour calculer, et rien de plus.
 */
export async function getValuationInputs(symbol: string) {
  const ticker = symbol.toUpperCase();

  const stock = await prisma.stock.findUnique({ where: { symbol: ticker } });
  if (!stock) return null;

  const [statements, assumptions, latestRun] = await Promise.all([
    prisma.financialStatement.findMany({
      where: { stock_ticker: ticker },
      orderBy: [{ year: 'asc' }, { period: 'asc' }]
    }),
    prisma.valuationAssumptions.findUnique({ where: { stock_ticker: ticker } }),
    prisma.valuationRun.findFirst({
      where: { stock_ticker: ticker },
      orderBy: { version: 'desc' }
    })
  ]);

  const damodaranSector = assumptions?.damodaran_sector ?? mapSectorToDamodaran(stock.sector);

  const sectorBetas = damodaranSector
    ? await prisma.sectorBeta.findMany({
        where: { sector: damodaranSector },
        orderBy: { as_of: 'desc' }
      })
    : [];

  // On ne garde que la fiche la plus recente de chaque jeu de donnees.
  const latestBySet = new Map<string, (typeof sectorBetas)[number]>();
  for (const b of sectorBetas) {
    if (!latestBySet.has(b.dataset)) latestBySet.set(b.dataset, b);
  }

  // On cherche la fiche du pays du titre puis, a defaut, celle du pays par defaut :
  // la plupart des fiches Stock ne renseignent pas le pays.
  let countryPremium = await prisma.countryRiskPremium.findFirst({
    where: { country: stock.country ?? DEFAULT_COUNTRY },
    orderBy: { as_of: 'desc' }
  });
  if (!countryPremium && stock.country && stock.country !== DEFAULT_COUNTRY) {
    countryPremium = await prisma.countryRiskPremium.findFirst({
      where: { country: DEFAULT_COUNTRY },
      orderBy: { as_of: 'desc' }
    });
  }

  return {
    stock: {
      symbol: stock.symbol,
      companyName: stock.company_name,
      sector: stock.sector,
      country: stock.country,
      currency: stock.currency ?? 'XOF',
      currentPrice: stock.current_price,
      sharesOutstanding: stock.shares_outstanding
    },
    statements,
    assumptions,
    damodaranSector,
    sectorBetas: [...latestBySet.values()],
    countryPremium,
    latestVersion: latestRun?.version ?? 0
  };
}

/**
 * Beta de regression du titre contre le composite BRVM, sur les rendements
 * quotidiens des seances communes aux deux series. Calcule ici plutot que cote
 * client : il faut l'historique complet des cotations, qui n'a pas a transiter.
 *
 * La correlation est renvoyee avec le beta car sur un marche frontiere elle est
 * souvent trop faible pour que le beta soit exploitable — c'est le cas de SODECI.
 */
export async function computeRegressionBeta(
  symbol: string,
  options: { indexName?: string; from?: Date } = {}
) {
  const ticker = symbol.toUpperCase();
  // Libelle exact tel qu'il figure en base (market_indices.index_name), casse comprise.
  const indexName = options.indexName ?? 'BRVM COMPOSITE';
  const from = options.from ?? new Date('2019-12-31');

  const [stockHistory, indexHistory] = await Promise.all([
    prisma.stockHistory.findMany({
      where: { stock_ticker: ticker, date: { gte: from } },
      orderBy: { date: 'asc' },
      select: { date: true, close: true }
    }),
    prisma.marketIndexHistory.findMany({
      where: { index_name: indexName, date: { gte: from } },
      orderBy: { date: 'asc' },
      select: { date: true, close: true }
    })
  ]);

  const key = (d: Date) => d.toISOString().slice(0, 10);
  const indexByDate = new Map(indexHistory.map((h) => [key(h.date), h.close]));

  // Seances communes uniquement : un titre peu liquide ne cote pas tous les jours,
  // et apparier des dates decalees fabriquerait un beta artificiel.
  const aligned: { stock: number; index: number }[] = [];
  for (const h of stockHistory) {
    const idx = indexByDate.get(key(h.date));
    if (typeof idx === 'number') aligned.push({ stock: h.close, index: idx });
  }

  if (aligned.length < 30) {
    return { beta: null, correlation: null, points: aligned.length, indexName };
  }

  const stockReturns: number[] = [];
  const indexReturns: number[] = [];
  for (let i = 1; i < aligned.length; i += 1) {
    const p0 = aligned[i - 1];
    const p1 = aligned[i];
    if (p0.stock === 0 || p0.index === 0) continue;
    stockReturns.push(p1.stock / p0.stock - 1);
    indexReturns.push(p1.index / p0.index - 1);
  }

  const n = stockReturns.length;
  if (n < 30) return { beta: null, correlation: null, points: n, indexName };

  const meanS = stockReturns.reduce((a, b) => a + b, 0) / n;
  const meanI = indexReturns.reduce((a, b) => a + b, 0) / n;

  let covariance = 0;
  let varianceI = 0;
  let varianceS = 0;
  for (let i = 0; i < n; i += 1) {
    const ds = stockReturns[i] - meanS;
    const di = indexReturns[i] - meanI;
    covariance += ds * di;
    varianceI += di * di;
    varianceS += ds * ds;
  }

  if (varianceI === 0 || varianceS === 0) {
    return { beta: null, correlation: null, points: n, indexName };
  }

  return {
    beta: covariance / varianceI,
    correlation: covariance / Math.sqrt(varianceI * varianceS),
    points: n,
    indexName
  };
}

export type UpsertAssumptionsInput = Omit<
  Prisma.ValuationAssumptionsUncheckedCreateInput,
  'stock_ticker' | 'created_at' | 'updated_at' | 'id'
>;

/** Cree ou met a jour les hypotheses pilotables d'un titre. */
export async function upsertAssumptions(
  symbol: string,
  data: UpsertAssumptionsInput,
  updatedBy?: string
) {
  const ticker = symbol.toUpperCase();
  return prisma.valuationAssumptions.upsert({
    where: { stock_ticker: ticker },
    create: { stock_ticker: ticker, ...data, updated_by: updatedBy },
    update: { ...data, updated_by: updatedBy }
  });
}

export type SaveRunInput = {
  assumptionsSnapshot: Prisma.InputJsonValue;
  projectionSnapshot: Prisma.InputJsonValue;
  results: Prisma.InputJsonValue;
  diagnostics?: Prisma.InputJsonValue;
  priceAtRun?: number | null;
  isPublished?: boolean;
};

/**
 * Persiste un run. La version est attribuee ici et jamais reutilisee : un run
 * passe reste retrouvable a l'identique, ce qu'exige la tracabilite CREPMF.
 */
export async function saveRun(symbol: string, input: SaveRunInput, createdBy?: string) {
  const ticker = symbol.toUpperCase();
  const stock = await prisma.stock.findUnique({ where: { symbol: ticker } });
  if (!stock) throw new Error(`Action ${ticker} inconnue`);

  const last = await prisma.valuationRun.findFirst({
    where: { stock_ticker: ticker },
    orderBy: { version: 'desc' },
    select: { version: true }
  });

  return prisma.valuationRun.create({
    data: {
      stock_ticker: ticker,
      version: (last?.version ?? 0) + 1,
      assumptions_snapshot: input.assumptionsSnapshot,
      projection_snapshot: input.projectionSnapshot,
      results: input.results,
      diagnostics: input.diagnostics,
      price_at_run: input.priceAtRun ?? stock.current_price,
      sector: stock.sector,
      is_published: input.isPublished ?? false,
      created_by: createdBy
    }
  });
}

export async function listRuns(symbol: string, limit = 20) {
  return prisma.valuationRun.findMany({
    where: { stock_ticker: symbol.toUpperCase() },
    orderBy: { version: 'desc' },
    take: limit
  });
}

/** Le run publie le plus recent — celui que voit un lecteur premium. */
export async function getPublishedRun(symbol: string) {
  return prisma.valuationRun.findFirst({
    where: { stock_ticker: symbol.toUpperCase(), is_published: true },
    orderBy: { version: 'desc' }
  });
}

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export type SectorPeer = {
  symbol: string;
  companyName: string;
  price: number;
  /** Multiples de marche, nuls quand le fondamental manque. */
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  /** Valeur intrinseque issue de la synthese du dernier run publie. */
  intrinsicValue: number | null;
  /** Potentiel vs cours, issu de la valeur intrinseque. */
  upside: number | null;
  /** Ecart de chaque multiple a la mediane du secteur, en relatif. */
  vsMedian: { pe: number | null; pb: number | null; yield: number | null };
};

/**
 * Valorisation sectorielle relative — la methode transverse. Elle ne rend pas une
 * valeur par action mais un classement : chaque titre du secteur est compare a la
 * mediane de ses pairs sur ses multiples de marche, et a sa propre valeur
 * intrinseque quand un run a ete publie.
 *
 * Elle ne s'active qu'a partir de deux titres, sinon la mediane est le titre lui-meme.
 */
export async function getSectorComparison(sector: string) {
  const stocks = await prisma.stock.findMany({
    where: { sector, is_active: true },
    select: { symbol: true, company_name: true, current_price: true }
  });

  if (stocks.length < 2) {
    return {
      sector,
      peerCount: stocks.length,
      available: false,
      reason: 'La comparaison sectorielle demande au moins deux titres du meme secteur.',
      medians: null,
      peers: [] as SectorPeer[]
    };
  }

  const tickers = stocks.map((s) => s.symbol);
  const [fundamentals, runs] = await Promise.all([
    prisma.stockFundamental.findMany({ where: { stock_ticker: { in: tickers } } }),
    prisma.valuationRun.findMany({
      where: { stock_ticker: { in: tickers }, is_published: true },
      orderBy: { version: 'desc' }
    })
  ]);

  const fundByTicker = new Map(fundamentals.map((f) => [f.stock_ticker, f]));
  // Un seul run par titre : le plus recent publie.
  const runByTicker = new Map<string, (typeof runs)[number]>();
  for (const r of runs) if (!runByTicker.has(r.stock_ticker)) runByTicker.set(r.stock_ticker, r);

  const rows = stocks.map((s) => {
    const f = fundByTicker.get(s.symbol);
    const run = runByTicker.get(s.symbol);
    // La synthese ponderee du run, si elle a ete enregistree sous cette forme.
    const results = run?.results as { weighted?: { weighted?: number } } | null;
    const intrinsicValue =
      typeof results?.weighted?.weighted === 'number' ? results.weighted.weighted : null;

    return {
      symbol: s.symbol,
      companyName: s.company_name,
      price: s.current_price,
      peRatio: f?.pe_ratio ?? null,
      pbRatio: f?.pb_ratio ?? null,
      dividendYield: f?.dividend_yield ?? null,
      intrinsicValue,
      upside:
        intrinsicValue !== null && s.current_price > 0 ? intrinsicValue / s.current_price - 1 : null
    };
  });

  const nums = (pick: (r: (typeof rows)[number]) => number | null) =>
    rows.map(pick).filter((x): x is number => typeof x === 'number' && Number.isFinite(x));

  const medians = {
    peRatio: median(nums((r) => r.peRatio)),
    pbRatio: median(nums((r) => r.pbRatio)),
    dividendYield: median(nums((r) => r.dividendYield)),
    upside: median(nums((r) => r.upside))
  };

  const relative = (value: number | null, med: number | null) =>
    value !== null && med !== null && med !== 0 ? value / med - 1 : null;

  const peers: SectorPeer[] = rows.map((r) => ({
    ...r,
    vsMedian: {
      pe: relative(r.peRatio, medians.peRatio),
      pb: relative(r.pbRatio, medians.pbRatio),
      yield: relative(r.dividendYield, medians.dividendYield)
    }
  }));

  // Les plus decotes en tete : PER le plus bas d'abord, puis les titres sans PER.
  peers.sort((a, b) => (a.peRatio ?? Number.POSITIVE_INFINITY) - (b.peRatio ?? Number.POSITIVE_INFINITY));

  return {
    sector,
    peerCount: stocks.length,
    available: true,
    reason: null,
    medians,
    modelledCount: runByTicker.size,
    peers
  };
}

/** Periodes acceptees a l'ecriture, pour valider une saisie d'etats financiers. */
export const STATEMENT_PERIODS = Object.values(StatementPeriod);
