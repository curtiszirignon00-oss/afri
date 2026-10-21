import { log } from '../config/logger';
// backend/src/services/stock.service.prisma.ts

import prisma from "../config/prisma";
import { Prisma } from '@prisma/client';
import { StockData } from "./scraping.service";
import { cacheGet, cacheSet, cacheInvalidatePattern, hashFilters, CACHE_TTL, CACHE_KEYS } from './cache.service';
import { isWithinBRVMCollectionWindow, clampToSessionEnd } from '../config/brvmMarket';
import { marketCapFCFA } from '../ai/format';

// <-- AJOUT : Mapping des secteurs pour assignation automatique lors du scraping
const SECTOR_MAPPING: Record<string, string> = {
  // === CONSOMMATION DE BASE ===
  'NTLC': 'Consommation de Base',
  'PALC': 'Consommation de Base',
  'SCRC': 'Consommation de Base',
  'SICC': 'Consommation de Base',
  'SLBC': 'Consommation de Base',
  'SOGC': 'Consommation de Base',
  'SPHC': 'Consommation de Base',
  'STBC': 'Consommation de Base',
  'UNLC': 'Consommation de Base',

  // === CONSOMMATION DISCRÉTIONNAIRE ===
  'ABJC': 'Consommation Discrétionnaire',
  'BNBC': 'Consommation Discrétionnaire',
  'CFAC': 'Consommation Discrétionnaire',
  'LNBB': 'Consommation Discrétionnaire',
  'NEIC': 'Consommation Discrétionnaire',
  'PRSC': 'Consommation Discrétionnaire',
  'UNXC': 'Consommation Discrétionnaire',

  // === ENERGIE ===
  'SHEC': 'Energie',
  'SMBC': 'Energie',
  'TTLC': 'Energie',
  'TTLS': 'Energie',

  // === INDUSTRIELS ===
  'CABC': 'Industriels',
  'FTSC': 'Industriels',
  'SDSC': 'Industriels',
  'SVOC': 'Industriels', // MOVIS CI — desactivee en base, mappee pour ne pas alerter a chaque scrape
  'SEMC': 'Industriels',
  'SIVC': 'Industriels',
  'STAC': 'Industriels',

  // === SERVICES FINANCIERS ===
  'BBGC': 'Services Financiers',
  'BICB': 'Services Financiers',
  'BICC': 'Services Financiers',
  'BOAB': 'Services Financiers',
  'BOABF': 'Services Financiers',
  'BOAC': 'Services Financiers',
  'BOAM': 'Services Financiers',
  'BOAN': 'Services Financiers',
  'BOAS': 'Services Financiers',
  'CBIBF': 'Services Financiers',
  'ECOC': 'Services Financiers',
  'ETIT': 'Services Financiers',
  'NSBC': 'Services Financiers',
  'ORGT': 'Services Financiers',
  'SAFC': 'Services Financiers',
  'SGBC': 'Services Financiers',
  'SIBC': 'Services Financiers',

  // === SERVICES PUBLICS ===
  'CIEC': 'Services Publics',
  'SDCC': 'Services Publics',

  // === TÉLÉCOMMUNICATIONS ===
  'ONTBF': 'Télécommunications',
  'ORAC': 'Télécommunications',
  'SNTS': 'Télécommunications',
};

/**
 * Symboles alternatifs -> symbole canonique utilise chez nous.
 *
 * Le scraper deduit le symbole depuis l'URL Sikafinance. Si la source publie une
 * valeur sous un code different du notre, l'upsert (qui matche sur `symbol`)
 * creerait une SECONDE ligne pour la meme societe : deux fiches, deux pages, et
 * les positions des utilisateurs eclatees entre les deux. Cette table normalise
 * le symbole scrape avant tout acces base.
 *
 * BBGC a ete ajoute a la main (admis a la cote le 2026-09-24, non encore publie
 * par la source). A verifier / ajuster des que Sikafinance le cotera.
 */
const SYMBOL_ALIASES: Record<string, string> = {
  // Vide a ce jour : verifie le 2026-09-24 sur les 49 valeurs cotees, tous les
  // codes de la source correspondent aux notres (BBGC inclus). Le garde-fou
  // reste en place pour les prochaines admissions a la cote.
};

export function normalizeSymbol(symbol: string): string {
  const upper = symbol.trim().toUpperCase();
  return SYMBOL_ALIASES[upper] ?? upper;
}

export async function saveStocks(stocksData: StockData[]) {
  try {
    for (const data of stocksData) {
      if (!data.symbol || data.lastPrice === null) continue;

      // Un code alternatif cote source ne doit pas creer un doublon de fiche
      const symbol = normalizeSymbol(data.symbol);

      // Calcule le "previous_close" en inversant la variation.
      // `last - last * pct` est faux : la variation se rapporte au cours de la
      // veille, pas au cours du jour. L'ecart est invisible a +0,5% mais reel
      // des que la valeur bouge (BBGC a +7,48% : 6712 au lieu de 6750).
      const previousClose = data.change
        ? data.lastPrice / (1 + data.change / 100)
        : data.lastPrice;

      // <-- AJOUT : Récupérer le secteur depuis le mapping
      const sector = SECTOR_MAPPING[symbol] || null;

      // Une valeur absente du mapping (nouvelle admission a la cote) doit etre
      // signalee : sans secteur elle sort des filtres de /markets.
      if (!sector) {
        log.warn(`⚠️  ${symbol} (${data.name}) n'est pas dans SECTOR_MAPPING — secteur existant conserve`);
      }

      await prisma.stock.upsert({
        where: { symbol },
        update: {
          company_name: data.name,
          current_price: data.lastPrice,
          daily_change_percent: data.change ?? 0,
          volume: data.volume ?? 0,
          previous_close: previousClose,
          // Secteur ecrit uniquement si le mapping le connait : sinon on preserve
          // la valeur en base (sans ce garde-fou, chaque scrape la remettait a null)
          ...(sector ? { sector } : {}),
          updated_at: new Date(),
        },
        create: {
          symbol,
          company_name: data.name,
          current_price: data.lastPrice,
          daily_change_percent: data.change ?? 0,
          volume: data.volume ?? 0,
          previous_close: previousClose,
          // volumeXOF = capitaux echanges dans la journee, PAS la capitalisation.
          // On laisse 0 (= inconnu, masque a l'affichage) : calculateAndUpdateDailyRatios
          // le calculera correctement des que les fondamentaux seront saisis.
          market_cap: 0,
          sector: sector, // <-- AJOUT : Assignation du secteur lors de la création
        }
      });
    }
    log.debug(`✅ ${stocksData.length} actions traitées par Prisma.`);

    // Invalider le cache des stocks apres mise a jour
    await cacheInvalidatePattern('stocks:*');
    await cacheInvalidatePattern('stock:*');
  } catch (error) {
    log.error('❌ Erreur lors de la sauvegarde Prisma des actions:', error);
    throw error;
  }
}

export async function getAllStocks(filters: {
  searchTerm?: string,
  sector?: string,
  sortBy?: string,
  minMarketCap?: number,
  maxMarketCap?: number,
  minPE?: number,
  maxPE?: number,
  minDividend?: number,
  maxDividend?: number
}) {
  try {
    const { searchTerm, sector, sortBy, minMarketCap, maxMarketCap, minPE, maxPE, minDividend, maxDividend } = filters;

    // Cache: verifier le cache
    const cacheKey = CACHE_KEYS.stocks(hashFilters(filters));
    const cached = await cacheGet<any[]>(cacheKey);
    if (cached) return cached;

    // Build WHERE clause dynamically
    const whereClause: Prisma.StockWhereInput = {
      is_active: true, // Always filter for active stocks
    };
    if (searchTerm) {
      whereClause.OR = [ // Search in symbol OR company name
        { symbol: { contains: searchTerm, mode: 'insensitive' } },
        { company_name: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (sector && sector !== 'all') {
      whereClause.sector = sector;
    }

    // Market cap filters
    const marketCapFilter: Prisma.FloatNullableFilter = {};
    if (minMarketCap !== undefined) {
      marketCapFilter.gte = minMarketCap;
    }
    if (maxMarketCap !== undefined) {
      marketCapFilter.lte = maxMarketCap;
    }
    if (Object.keys(marketCapFilter).length > 0) {
      whereClause.market_cap = marketCapFilter;
    }

    // Fetch stocks with fundamentals and annual financials
    const stocks = await prisma.stock.findMany({
      where: whereClause,
      include: {
        fundamentals: {
          take: 1,
          orderBy: { year: 'desc' }
        },
        annualFinancials: {
          orderBy: { year: 'desc' },
          take: 1
        }
      }
    });

    // Calculate P/E ratio and dividend yield for each stock
    const stocksWithCalculations = stocks.map(stock => {
      // Get latest BNPA (EPS) from annual financials or fundamentals
      const latestFinancial = stock.annualFinancials[0];
      const bnpa = latestFinancial?.eps || stock.fundamentals[0]?.eps || null;

      // Calculate P/E Ratio: Current Price / BNPA
      const pe_ratio = bnpa && bnpa > 0 ? stock.current_price / bnpa : null;

      // Get latest dividend from annual financials
      const latestDividend = latestFinancial?.dividend || null;

      // Calculate Dividend Yield: (Dividend / Current Price) * 100
      const dividend_yield = latestDividend && stock.current_price > 0
        ? (latestDividend / stock.current_price) * 100
        : null;

      return {
        ...stock,
        pe_ratio,
        dividend_yield
      };
    });

    // Apply P/E and dividend filters
    let filteredStocks = stocksWithCalculations;

    if (minPE !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.pe_ratio !== null && s.pe_ratio >= minPE);
    }
    if (maxPE !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.pe_ratio !== null && s.pe_ratio <= maxPE);
    }
    if (minDividend !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.dividend_yield !== null && s.dividend_yield >= minDividend);
    }
    if (maxDividend !== undefined) {
      filteredStocks = filteredStocks.filter(s => s.dividend_yield !== null && s.dividend_yield <= maxDividend);
    }

    // Sort by P/E or dividend if requested
    if (sortBy === 'pe') {
      filteredStocks.sort((a, b) => {
        if (a.pe_ratio === null) return 1;
        if (b.pe_ratio === null) return -1;
        return a.pe_ratio - b.pe_ratio;
      });
    } else if (sortBy === 'dividend') {
      filteredStocks.sort((a, b) => {
        if (a.dividend_yield === null) return 1;
        if (b.dividend_yield === null) return -1;
        return b.dividend_yield - a.dividend_yield; // Descending order for dividend
      });
    } else {
      // Apply original sorting
      switch (sortBy) {
        case 'change':
          filteredStocks.sort((a, b) => b.daily_change_percent - a.daily_change_percent);
          break;
        case 'price':
          filteredStocks.sort((a, b) => b.current_price - a.current_price);
          break;
        case 'volume':
          filteredStocks.sort((a, b) => b.volume - a.volume);
          break;
        case 'name':
          filteredStocks.sort((a, b) => a.company_name.localeCompare(b.company_name));
          break;
      }
    }

    // Cache: stocker le resultat (TTL 1h)
    await cacheSet(cacheKey, filteredStocks, CACHE_TTL.STOCKS);

    return filteredStocks;
  } catch (error) {
    log.error('❌ Erreur lors de la récupération Prisma des actions:', error);
    throw error;
  }
}

export async function getStockBySymbol(symbol: string) {
  try {
    const stock = await prisma.stock.findUnique({
      where: { symbol },
    });
    return stock;
  } catch (error) {
    log.error(`❌ Erreur lors de la récupération de ${symbol}:`, error);
    throw error;
  }
}

export async function getTopStocks(limit: number = 6) {
  try {
    const stocks = await prisma.stock.findMany({
      where: { is_active: true },
      orderBy: {
        daily_change_percent: 'desc',
      },
      take: limit,
    });
    return stocks;
  } catch (error) {
    log.error('❌ Erreur lors de la récupération des top stocks:', error);
    throw error;
  }
}

// ========================================
// NOUVELLES FONCTIONS POUR STOCK DETAILS
// ========================================

/**
 * Récupère l'historique des prix d'une action
 * @param symbol - Le symbole de l'action (ex: SLBC)
 * @param period - Période: '1M' | '3M' | '6M' | '1Y' | 'ALL'
 */
/**
 * Bougie journalière de la séance en cours, agrégée depuis les snapshots intraday.
 *
 * La bougie du jour n'est écrite en base qu'à 18h00 (cron saveCurrentDayHistory).
 * Sans ce calcul, de l'ouverture jusqu'à 18h le graphique J1 n'avait pas de
 * bougie du jour : le front la fabriquait avec la clôture de la veille et le
 * cours courant, sans plus haut ni plus bas de séance — un décrochage intraday
 * (ex. SNTS 41 880 → 39 995 → 41 745) était visible en H1 mais pas en J1.
 *
 * Mêmes conventions que getIntradayHourly() : snapshots hors séance écartés,
 * ouverture = premier prix observé (fixing 09h45), volume = dernier cumul du jour.
 */
export async function getLiveSessionBar(symbol: string, now: Date = new Date()) {
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const rawSnapshots = await prisma.intradaySnapshot.findMany({
    where: { stock_ticker: symbol, timestamp: { gte: dayStart, lte: now } },
    orderBy: { timestamp: 'asc' },
  });
  const snapshots = rawSnapshots.filter(s => isWithinBRVMCollectionWindow(s.timestamp));
  if (snapshots.length === 0) return null;

  const prices = snapshots.map(s => s.price);
  return {
    dateKey: dayStart.toISOString().slice(0, 10),
    open: prices[0],
    high: Math.max(...prices),
    low: Math.min(...prices),
    close: prices[prices.length - 1],
    volume: snapshots[snapshots.length - 1].volume,
  };
}

export async function getStockHistory(
  symbol: string,
  period: '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL' = '1Y'
) {
  try {
    // Calculer la date de début selon la période
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1D':
        // J-7 calendaires pour garantir au moins 2 séances (weekends/fériés)
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
        break;
      case '5D':
        // J-14 calendaires ≈ 5-10 séances de cotation
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 14));
        break;
      case '1M':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, now.getUTCDate()));
        break;
      case '3M':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, now.getUTCDate()));
        break;
      case '6M':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 6, now.getUTCDate()));
        break;
      case '1Y':
        startDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
        break;
      case 'ALL':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
    }

    const history = await prisma.stockHistory.findMany({
      where: {
        stock_ticker: symbol,
        date: {
          gte: startDate,
          lte: now // Ne jamais retourner de dates futures
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Normaliser les dates et dédupliquer
    // Les imports Excel ont créé des dates à 22:00/23:00 UTC (timezone locale)
    // On normalise en prenant la date calendaire locale (jour suivant pour 22:00/23:00 UTC)
    const dateMap = new Map<string, typeof history[0]>();

    for (const record of history) {
      const utcHours = record.date.getUTCHours();
      let dateKey: string;

      if (utcHours >= 22) {
        // 22:00 ou 23:00 UTC = lendemain en timezone locale (UTC+1/+2)
        const nextDay = new Date(record.date);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        dateKey = `${nextDay.getUTCFullYear()}-${String(nextDay.getUTCMonth() + 1).padStart(2, '0')}-${String(nextDay.getUTCDate()).padStart(2, '0')}`;
      } else {
        dateKey = `${record.date.getUTCFullYear()}-${String(record.date.getUTCMonth() + 1).padStart(2, '0')}-${String(record.date.getUTCDate()).padStart(2, '0')}`;
      }

      // Garder l'entree la plus recente (la plus precise, souvent du scraper)
      if (!dateMap.has(dateKey) || record.date > dateMap.get(dateKey)!.date) {
        dateMap.set(dateKey, record);
      }
    }

    // Séance en cours : bougie provisoire tirée de l'intraday tant que la
    // bougie officielle de 18h00 n'existe pas ; si elle existe déjà, on
    // s'assure seulement qu'elle couvre les extrêmes de séance.
    try {
      const live = await getLiveSessionBar(symbol, now);
      if (live) {
        const existing = dateMap.get(live.dateKey);
        if (existing) {
          dateMap.set(live.dateKey, {
            ...existing,
            high: Math.max(existing.high, live.high),
            low: Math.min(existing.low, live.low),
          });
        } else {
          dateMap.set(live.dateKey, {
            id: `live-${symbol}-${live.dateKey}`,
            stock_ticker: symbol,
            date: new Date(live.dateKey + 'T00:00:00.000Z'),
            open: live.open,
            high: live.high,
            low: live.low,
            close: live.close,
            volume: live.volume,
            created_at: now,
            stockId: history[history.length - 1]?.stockId ?? '',
          } as typeof history[0]);
        }
      }
    } catch (err) {
      // L'historique reste servi même si l'intraday est indisponible
      log.error(`⚠️ Bougie de séance indisponible pour ${symbol}:`, err);
    }

    // Retourner avec des dates normalisées (YYYY-MM-DD à minuit UTC)
    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, record]) => ({
        ...record,
        date: new Date(dateKey + 'T00:00:00.000Z')
      }));
  } catch (error) {
    log.error(`❌ Erreur lors de la récupération de l'historique de ${symbol}:`, error);
    throw error;
  }
}

export type IntradayInterval = '15m' | '1h';

/** Taille du bucket d'agrégation, en secondes. */
const INTRADAY_BUCKET_SECONDS: Record<IntradayInterval, number> = {
  '15m': 15 * 60,
  '1h': 60 * 60,
};

/**
 * Agrège les snapshots intraday en bougies de 15 min ou 1 h.
 * @param symbol - Symbole de l'action (ex: SLBC)
 * @param days - Nombre de jours calendaires à couvrir (défaut 30)
 * @param interval - Taille des bougies ('15m' ou '1h', défaut '1h')
 * @returns Bougies { time: Unix s (début du bucket UTC), open, high, low, close, volume }
 *
 * Deux calibrages importants :
 *
 * 1. Les snapshots hors séance sont écartés (week-end, férié, pré-ouverture,
 *    après-clôture). Cela nettoie aussi à la lecture les données déjà
 *    collectées avant le recalibrage de la fenêtre.
 *
 * 2. L'ouverture d'une bougie est chaînée sur la clôture de la bougie
 *    précédente de la MÊME séance. La source n'est rafraîchie que toutes les
 *    15 min : en bougies de 15 min chaque bucket ne contient qu'un seul
 *    snapshot, donc open = high = low = close et toutes les bougies seraient
 *    des doji plats. Le chaînage rend le corps des bougies visible et la série
 *    continue (pas de trou entre deux bougies consécutives). La première
 *    bougie de la séance garde son propre prix en ouverture : c'est le fixing
 *    d'ouverture de 09h45.
 *
 * Le volume des snapshots est le volume CUMULÉ du jour : le volume d'une bougie
 * est donc la différence entre le dernier cumul du bucket et celui du bucket
 * précédent du même jour (premier bucket du jour = cumul tel quel).
 */
export async function getIntradayHourly(
  symbol: string,
  days: number = 30,
  interval: IntradayInterval = '1h'
) {
  try {
    const bucketSeconds = INTRADAY_BUCKET_SECONDS[interval] ?? INTRADAY_BUCKET_SECONDS['1h'];
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - days);

    const rawSnapshots = await prisma.intradaySnapshot.findMany({
      where: {
        stock_ticker: symbol,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Ne garder que les snapshots pris pendant une séance de cotation réelle
    const snapshots = rawSnapshots.filter(s => isWithinBRVMCollectionWindow(s.timestamp));

    if (snapshots.length === 0) return [];

    // Grouper par bucket (clé = timestamp Unix du début de bucket UTC).
    // Le snapshot de clôture, pris dans la marge d'après-fermeture, est replié
    // dans la dernière tranche cotée au lieu d'ouvrir une bougie après 15h00.
    const buckets = new Map<number, typeof snapshots>();
    for (const snap of snapshots) {
      const effective = clampToSessionEnd(snap.timestamp);
      const bucketStart = Math.floor(effective.getTime() / 1000 / bucketSeconds) * bucketSeconds;
      if (!buckets.has(bucketStart)) buckets.set(bucketStart, []);
      buckets.get(bucketStart)!.push(snap);
    }

    const candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
    // Dernier volume cumulé vu, par jour (clé YYYY-MM-DD)
    let prevDayKey = '';
    let prevCumulVolume = 0;
    // Clôture de la bougie précédente, pour chaîner l'ouverture
    let prevClose: number | null = null;

    for (const [time, snaps] of Array.from(buckets.entries()).sort(([a], [b]) => a - b)) {
      const prices = snaps.map(s => s.price);
      const lastCumul = snaps[snaps.length - 1].volume;
      const dayKey = new Date(time * 1000).toISOString().slice(0, 10);
      const sameSession = dayKey === prevDayKey;

      const volume = sameSession
        ? Math.max(0, lastCumul - prevCumulVolume)
        : lastCumul;

      // Chaînage intra-séance : l'ouverture reprend la clôture précédente.
      // Nouvelle séance → le premier prix observé EST l'ouverture (fixing 09h45).
      const open = sameSession && prevClose !== null ? prevClose : prices[0];
      const close = prices[prices.length - 1];

      candles.push({
        time,
        open,
        // L'ouverture chaînée fait partie de l'amplitude de la bougie
        high: Math.max(open, ...prices),
        low: Math.min(open, ...prices),
        close,
        volume,
      });

      prevDayKey = dayKey;
      prevCumulVolume = lastCumul;
      prevClose = close;
    }

    return candles;
  } catch (error) {
    log.error(`❌ Erreur lors de l'agrégation intraday de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Calcule le plus haut et le plus bas sur 52 semaines (365 jours calendaires)
 * à partir de l'historique des prix
 */
export async function get52WeekHighLow(symbol: string): Promise<{ high52w: number | null; low52w: number | null }> {
  try {
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));

    const result = await prisma.stockHistory.aggregate({
      where: {
        stock_ticker: symbol,
        date: { gte: startDate, lte: now }
      },
      _max: { high: true },
      _min: { low: true }
    });

    return {
      high52w: result._max.high ?? null,
      low52w: result._min.low ?? null
    };
  } catch (error) {
    log.error(`❌ Erreur lors du calcul 52 semaines de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les données fondamentales d'une action
 * @param symbol - Le symbole de l'action
 */
export async function getStockFundamentals(symbol: string) {
  try {
    const fundamentals = await prisma.stockFundamental.findUnique({
      where: { stock_ticker: symbol }
    });
    return fundamentals;
  } catch (error) {
    log.error(`❌ Erreur lors de la récupération des fondamentaux de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les informations sur la compagnie
 * @param symbol - Le symbole de l'action
 */
export async function getCompanyInfo(symbol: string) {
  try {
    const [companyInfo, memberships] = await Promise.all([
      prisma.companyInfo.findUnique({ where: { stock_ticker: symbol } }),
      prisma.stockIndexMembership.findMany({
        where: { stock_ticker: symbol },
        select: { index_name: true },
        orderBy: { index_name: 'asc' }
      })
    ]);
    if (!companyInfo && memberships.length === 0) return null;
    return {
      ...(companyInfo ?? { stock_ticker: symbol }),
      indices: memberships.map((m: { index_name: string }) => m.index_name)
    };
  } catch (error) {
    log.error(`❌ Erreur lors de la récupération des infos de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les actualités liées à une action
 * @param symbol - Le symbole de l'action
 * @param limit - Nombre d'actualités à retourner
 */
export async function getStockNews(symbol: string, limit: number = 10) {
  try {
    const news = await prisma.stockNews.findMany({
      where: { stock_ticker: symbol },
      orderBy: { published_at: 'desc' },
      take: limit
    });
    return news;
  } catch (error) {
    log.error(`❌ Erreur lors de la récupération des news de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les actionnaires d'une action
 * @param symbol - Le symbole de l'action
 */
export async function getShareholders(symbol: string) {
  try {
    const shareholders = await prisma.shareholder.findMany({
      where: { stock_ticker: symbol },
      orderBy: { percentage: 'desc' }
    });
    return shareholders;
  } catch (error) {
    log.error(`❌ Erreur lors de la récupération des actionnaires de ${symbol}:`, error);
    throw error;
  }
}

/**
 * Récupère les données financières annuelles d'une action
 * @param symbol - Le symbole de l'action
 * @param yearsBack - Nombre d'années à retourner (par défaut 5)
 */
export async function getAnnualFinancials(symbol: string, yearsBack: number = 5) {
  try {
    // On prend les N derniers exercices REELLEMENT disponibles plutot qu'une fenetre
    // calculee sur l'annee civile : les comptes de l'exercice en cours ne sont pas
    // encore publies, et l'ancienne borne (currentYear - yearsBack + 1) faisait
    // perdre une annee d'historique.
    const financials = await prisma.annualFinancials.findMany({
      where: { stock_ticker: symbol },
      orderBy: { year: 'desc' },
      take: yearsBack
    });
    return financials.reverse();
  } catch (error) {
    log.error(`❌ Erreur lors de la récupération des données financières de ${symbol}:`, error);
    throw error;
  }
}
// ─── Carte de marché : variations par période ────────────────────────────────

export const MARKET_MAP_PERIODS = ['1D', '1W', '1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y'] as const;
export type MarketMapPeriod = typeof MARKET_MAP_PERIODS[number];

export function isMarketMapPeriod(v: unknown): v is MarketMapPeriod {
  return typeof v === 'string' && (MARKET_MAP_PERIODS as readonly string[]).includes(v);
}

export interface MarketMapItem {
  symbol: string;
  change_percent: number | null; // null = historique insuffisant (pas 0 : un titre inchangé n'est pas un titre inconnu)
  base_price: number | null;     // cours de référence, ajusté des splits vérifiés
  base_date: string | null;      // YYYY-MM-DD de la clôture de référence
  current_price: number;
  market_cap: number | null;     // FCFA, cours × nombre de titres
  adjusted: boolean;             // un split / une attribution vérifié(e) a été appliqué(e)
  suspect: boolean;              // écart de cours anormal sans opération référencée
}

export interface MarketMapData {
  period: MarketMapPeriod;
  reference_date: string | null;
  as_of: string | null;
  items: MarketMapItem[];
}

const DAY_MS = 86_400_000;
const SPLIT_TYPES = ['SPLIT', 'REVERSE_SPLIT', 'BONUS'];

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Recule de n mois civils ; le jour est borné au dernier jour du mois cible (31 mars − 1 M → 28/29 févr.). */
function subMonthsUTC(d: Date, n: number): Date {
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - n, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d.getUTCDate(), lastDay)));
}

/**
 * Date de référence d'une période. La variation se mesure contre la dernière
 * clôture connue À cette date (incluse) : prendre la première séance qui suit
 * ferait perdre le mouvement de cette séance.
 */
export function periodReferenceDate(period: Exclude<MarketMapPeriod, '1D'>, now = new Date()): Date {
  const today = utcMidnight(now);
  switch (period) {
    case '1W':  return new Date(today.getTime() - 7 * DAY_MS);
    case '1M':  return subMonthsUTC(today, 1);
    case '3M':  return subMonthsUTC(today, 3);
    case '6M':  return subMonthsUTC(today, 6);
    case 'YTD': return new Date(Date.UTC(today.getUTCFullYear() - 1, 11, 31));
    case '1Y':  return subMonthsUTC(today, 12);
    case '3Y':  return subMonthsUTC(today, 36);
    case '5Y':  return subMonthsUTC(today, 60);
  }
}

/**
 * Variation de chaque action sur la période + capitalisation fiable.
 *
 * - 1D : variation officielle du jour (daily_change_percent), comme le reste du site.
 * - Autres : cours actuel vs dernière clôture ≤ date de référence, cherchée dans une
 *   fenêtre bornée (jours fériés, séances manquantes). Au-delà, ou si le titre n'était
 *   pas encore coté : change_percent = null.
 * - Les cours de référence antérieurs à un split / une attribution vérifié(e) sont
 *   divisés par le ratio (même règle que le moteur du portefeuille réel).
 */
export async function getMarketMapData(period: MarketMapPeriod): Promise<MarketMapData> {
  const cacheKey = `stocks:market-map:${period}`;
  const cached = await cacheGet<MarketMapData>(cacheKey);
  if (cached) return cached;

  const stocks = await prisma.stock.findMany({
    where: { is_active: true },
    select: {
      symbol: true, current_price: true, previous_close: true, daily_change_percent: true,
      shares_outstanding: true, updated_at: true,
      fundamentals: { select: { shares_outstanding: true, market_cap: true }, take: 1 },
    },
  });
  const symbols = stocks.map(s => s.symbol);

  const asOf = stocks.reduce<Date | null>(
    (max, s) => (s.updated_at && (!max || s.updated_at > max) ? s.updated_at : max), null,
  );

  const capOf = (s: typeof stocks[number]) => {
    const fund = s.fundamentals[0];
    return marketCapFCFA(s.current_price, fund?.shares_outstanding ?? s.shares_outstanding, fund?.market_cap);
  };

  let data: MarketMapData;

  if (period === '1D') {
    data = {
      period,
      reference_date: null,
      as_of: asOf?.toISOString() ?? null,
      items: stocks.map(s => ({
        symbol: s.symbol,
        change_percent: s.current_price > 0 ? s.daily_change_percent : null,
        base_price: s.previous_close > 0 ? s.previous_close : null,
        base_date: null,
        current_price: s.current_price,
        market_cap: capOf(s),
        adjusted: false,
        suspect: false,
      })),
    };
  } else {
    const now = new Date();
    const ref = periodReferenceDate(period, now);
    const spanDays = (utcMidnight(now).getTime() - ref.getTime()) / DAY_MS;
    const toleranceDays = Math.max(10, Math.min(31, Math.round(spanDays * 0.1)));

    const [rows, actions] = await Promise.all([
      prisma.stockHistory.findMany({
        where: {
          stock_ticker: { in: symbols },
          date: { gte: new Date(ref.getTime() - toleranceDays * DAY_MS), lt: new Date(ref.getTime() + DAY_MS) },
          close: { gt: 0 },
        },
        orderBy: { date: 'desc' },
        select: { stock_ticker: true, date: true, close: true },
      }),
      prisma.corporateAction.findMany({
        where: { stock_ticker: { in: symbols }, verified: true, type: { in: SPLIT_TYPES }, ex_date: { lte: now } },
        select: { stock_ticker: true, ex_date: true, ratio: true },
      }),
    ]);

    // Tri décroissant → la première ligne rencontrée est la dernière clôture ≤ référence
    const base = new Map<string, { date: Date; close: number }>();
    for (const r of rows) if (!base.has(r.stock_ticker)) base.set(r.stock_ticker, { date: r.date, close: r.close });

    data = {
      period,
      reference_date: ref.toISOString().slice(0, 10),
      as_of: asOf?.toISOString() ?? null,
      items: stocks.map(s => {
        const b = base.get(s.symbol);
        const cap = capOf(s);
        if (!b || !(s.current_price > 0)) {
          return {
            symbol: s.symbol, change_percent: null, base_price: null, base_date: null,
            current_price: s.current_price, market_cap: cap, adjusted: false, suspect: false,
          };
        }
        const factor = actions
          .filter(a => a.stock_ticker === s.symbol && a.ratio && a.ratio > 0 && a.ex_date > b.date)
          .reduce((f, a) => f * (a.ratio as number), 1);
        const basePrice = b.close / factor;
        const growth = s.current_price / basePrice;
        return {
          symbol: s.symbol,
          change_percent: Math.round((growth - 1) * 10_000) / 100,
          base_price: Math.round(basePrice * 100) / 100,
          base_date: b.date.toISOString().slice(0, 10),
          current_price: s.current_price,
          market_cap: cap,
          adjusted: factor !== 1,
          // Division / multiplication du cours par ~3+ sans opération vérifiée : split probable non référencé
          suspect: factor === 1 && (growth < 0.35 || growth > 4),
        };
      }),
    };
  }

  await cacheSet(cacheKey, data, CACHE_TTL.STOCKS);
  return data;
}

/** Ancien format (tableau symbol / change_percent) conservé pour les clients déjà déployés. */
export async function getMarketPeriodChanges(period: Exclude<MarketMapPeriod, '1D'>) {
  const { items } = await getMarketMapData(period);
  return items.map(({ symbol, change_percent }) => ({ symbol, change_percent }));
}

export async function getHistoryForComparison(symbols: string[], period: number) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    const history = await prisma.stockHistory.findMany({
      where: { stock_ticker: { in: symbols }, date: { gte: startDate } },
      orderBy: { date: 'asc' },
      select: { stock_ticker: true, date: true, close: true }
    });
    const groupedByDate: Record<string, any> = {};
    history.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = { date: dateKey };
      groupedByDate[dateKey][record.stock_ticker] = record.close;
    });
    const sorted = Object.values(groupedByDate).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Thin data for large periods to cap at ~150 points
    const MAX_POINTS = 150;
    if (sorted.length > MAX_POINTS) {
      const step = Math.ceil(sorted.length / MAX_POINTS);
      return sorted.filter((_: any, i: number) => i % step === 0 || i === sorted.length - 1);
    }
    return sorted;
  } catch (error) {
    log.error('Erreur historique:', error);
    throw error;
  }
}
