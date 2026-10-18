/**
 * SIMBA Conseiller Portefeuille — contexte chargé côté serveur + system prompt.
 *
 * Le contexte n'est plus envoyé par le navigateur : il est reconstruit depuis la
 * base à partir de l'utilisateur authentifié (positions, secteurs, transactions,
 * profil investisseur), puis enrichi par les outils BRVM de SIMBA Analyste.
 */

import { prisma } from '../config/database';
import { CONVERSATION_RULES } from './systemPrompt';

export type AdvisorWalletType = 'SANDBOX' | 'CONCOURS';

interface AdvisorPosition {
  ticker: string;
  companyName: string;
  sector: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  weightPercent: number; // poids dans la valeur totale (liquidités incluses)
}

export interface AdvisorContext {
  walletType: AdvisorWalletType;
  initialBalance: number;
  cashBalance: number;
  stocksValue: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  unrealizedGainLoss: number;
  unrealizedPercent: number;
  realizedGainLoss: number;
  cashPercent: number;
  positions: AdvisorPosition[];
  sectors: { sector: string; value: number; weightPercent: number }[];
  recentTransactions: { date: string; type: string; ticker: string; quantity: number; price: number }[];
  snapshots: { date: string; totalValue: number; gainLossPercent: number }[];
  profile: {
    riskProfile?: string | null;
    horizon?: string | null;
    goals: string[];
    lifeGoal?: string | null;
    favoriteSectors: string[];
    experienceLevel?: string | null;
    investmentStyle?: string | null;
    monthlyBudget?: number | null;
  } | null;
}

const RISK_LABELS: Record<string, string> = {
  CONSERVATIVE: 'Conservateur (priorité à la sécurité)',
  MODERATE: 'Modéré',
  BALANCED: 'Équilibré (diversification)',
  GROWTH: 'Croissance (accepte plus de risque)',
  AGGRESSIVE: 'Agressif (recherche de rendements élevés)',
};

const HORIZON_LABELS: Record<string, string> = {
  SHORT_TERM: 'Court terme (< 1 an)',
  MEDIUM_TERM: 'Moyen terme (1-5 ans)',
  LONG_TERM: 'Long terme (5-10 ans)',
  VERY_LONG_TERM: 'Très long terme (> 10 ans)',
};

/** Charge le portefeuille de l'utilisateur authentifié. null si aucun portefeuille. */
export async function loadAdvisorContext(
  userId: string,
  walletType: AdvisorWalletType = 'SANDBOX',
): Promise<AdvisorContext | null> {
  // Même sélection que le dashboard (portfolio.service › findPortfolioByUserId) : le plus ancien du type
  const portfolio = await prisma.portfolio.findFirst({
    where: { userId, wallet_type: walletType },
    orderBy: { created_at: 'asc' },
    include: {
      positions: true,
      transactions: { orderBy: { created_at: 'desc' }, take: 15 },
      snapshots: { orderBy: { created_at: 'desc' }, take: 6 },
    },
  });
  if (!portfolio) return null;

  const tickers = portfolio.positions.map((p) => p.stock_ticker);
  const [stocks, investorProfile] = await Promise.all([
    tickers.length
      ? prisma.stock.findMany({
          where: { symbol: { in: tickers } },
          select: { symbol: true, company_name: true, sector: true, current_price: true },
        })
      : Promise.resolve([]),
    prisma.investorProfile.findUnique({ where: { user_id: userId } }),
  ]);
  const stockBySymbol = new Map(stocks.map((s) => [s.symbol, s]));

  // Même logique de calcul que le dashboard (DashboardPage.tsx)
  const rawPositions = portfolio.positions
    .filter((p) => p.quantity > 0 && stockBySymbol.has(p.stock_ticker))
    .map((p) => {
      const s = stockBySymbol.get(p.stock_ticker)!;
      const currentValue = p.quantity * s.current_price;
      const costBasis = p.quantity * p.average_buy_price;
      const gainLoss = currentValue - costBasis;
      return {
        ticker: p.stock_ticker,
        companyName: s.company_name,
        sector: s.sector || 'Non classé',
        quantity: p.quantity,
        avgBuyPrice: p.average_buy_price,
        currentPrice: s.current_price,
        currentValue,
        costBasis,
        gainLoss,
        gainLossPercent: costBasis > 0 ? (gainLoss / costBasis) * 100 : 0,
      };
    });

  const stocksValue = rawPositions.reduce((acc, p) => acc + p.currentValue, 0);
  const costBasisTotal = rawPositions.reduce((acc, p) => acc + p.costBasis, 0);
  const totalValue = portfolio.cash_balance + stocksValue;
  const initialBalance = portfolio.initial_balance || 0;
  const totalGainLoss = totalValue - initialBalance;
  const unrealizedGainLoss = stocksValue - costBasisTotal;
  const pct = (v: number) => (totalValue > 0 ? (v / totalValue) * 100 : 0);

  const positions: AdvisorPosition[] = rawPositions
    .map((p) => ({ ...p, weightPercent: pct(p.currentValue) }))
    .sort((a, b) => b.currentValue - a.currentValue);

  const sectorMap = new Map<string, number>();
  for (const p of positions) sectorMap.set(p.sector, (sectorMap.get(p.sector) ?? 0) + p.currentValue);
  const sectors = [...sectorMap.entries()]
    .map(([sector, value]) => ({ sector, value, weightPercent: pct(value) }))
    .sort((a, b) => b.value - a.value);

  return {
    walletType,
    initialBalance,
    cashBalance: portfolio.cash_balance,
    stocksValue,
    totalValue,
    totalGainLoss,
    totalGainLossPercent: initialBalance > 0 ? (totalGainLoss / initialBalance) * 100 : 0,
    unrealizedGainLoss,
    unrealizedPercent: costBasisTotal > 0 ? (unrealizedGainLoss / costBasisTotal) * 100 : 0,
    realizedGainLoss: totalGainLoss - unrealizedGainLoss,
    cashPercent: pct(portfolio.cash_balance),
    positions,
    sectors,
    recentTransactions: portfolio.transactions.map((t) => ({
      date: t.created_at ? t.created_at.toISOString().slice(0, 10) : 'N/D',
      type: t.type,
      ticker: t.stock_ticker,
      quantity: t.quantity,
      price: t.price_per_share,
    })),
    snapshots: portfolio.snapshots
      .map((s) => ({
        date: s.created_at.toISOString().slice(0, 10),
        totalValue: s.total_value,
        gainLossPercent: s.gain_loss_percent,
      }))
      .reverse(),
    profile: investorProfile
      ? {
          riskProfile: investorProfile.risk_profile,
          horizon: investorProfile.investment_horizon,
          goals: investorProfile.investment_goals ?? [],
          lifeGoal: investorProfile.life_goal,
          favoriteSectors: investorProfile.favorite_sectors ?? [],
          experienceLevel: investorProfile.experience_level,
          investmentStyle: investorProfile.investment_style,
          monthlyBudget: investorProfile.monthly_budget,
        }
      : null,
  };
}

// ─── System prompt ────────────────────────────────────────────────────────────

// Espace simple comme séparateur de milliers : le modèle lit mal les espaces insécables (« 43500 » lu 435 000)
const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ');
const sign = (n: number) => (n >= 0 ? '+' : '');
const pctStr = (n: number) => `${sign(n)}${n.toFixed(2)}%`;

export function buildPortfolioAdvisorPrompt(ctx: AdvisorContext): string {
  const posTable = ctx.positions.length === 0
    ? 'Aucune position ouverte (100 % en liquidités).'
    : [
        '| Titre | Secteur | Qté | PRU | Cours | Valeur | Poids | P/L latent |',
        '|---|---|---|---|---|---|---|---|',
        ...ctx.positions.map((p) =>
          `| ${p.ticker} (${p.companyName}) | ${p.sector} | ${p.quantity} | ${fmt(p.avgBuyPrice)} F | ${fmt(p.currentPrice)} F | ${fmt(p.currentValue)} F | ${p.weightPercent.toFixed(1)} % | ${sign(p.gainLoss)}${fmt(p.gainLoss)} F (${pctStr(p.gainLossPercent)}) |`),
      ].join('\n');

  const sectorLines = ctx.sectors.length === 0
    ? 'Aucune exposition sectorielle.'
    : ctx.sectors.map((s) => `- ${s.sector} : ${s.weightPercent.toFixed(1)} % (${fmt(s.value)} F)`).join('\n');

  const txLines = ctx.recentTransactions.length === 0
    ? 'Aucune transaction.'
    : ctx.recentTransactions
        .map((t) => `- ${t.date} · ${t.type === 'BUY' ? 'Achat' : 'Vente'} ${t.quantity} ${t.ticker} à ${fmt(t.price)} F`)
        .join('\n');

  const snapLines = ctx.snapshots.length === 0
    ? 'Non disponible.'
    : ctx.snapshots.map((s) => `${s.date} : ${fmt(s.totalValue)} F (${pctStr(s.gainLossPercent)})`).join(' → ');

  const p = ctx.profile;
  const profileBlock = !p
    ? "Profil investisseur non renseigné. Invite l'utilisateur à compléter son profil (onboarding) pour des avis personnalisés, sans bloquer la réponse."
    : [
        `- Profil de risque : ${p.riskProfile ? RISK_LABELS[p.riskProfile] ?? p.riskProfile : 'N/D'}`,
        `- Horizon : ${p.horizon ? HORIZON_LABELS[p.horizon] ?? p.horizon : 'N/D'}`,
        `- Objectif de vie : ${p.lifeGoal ?? 'N/D'}`,
        `- Objectifs d'investissement : ${p.goals.length ? p.goals.join(', ') : 'N/D'}`,
        `- Secteurs préférés : ${p.favoriteSectors.length ? p.favoriteSectors.join(', ') : 'N/D'}`,
        `- Expérience : ${p.experienceLevel ?? 'N/D'} · Style : ${p.investmentStyle ?? 'N/D'}`,
        `- Budget mensuel : ${p.monthlyBudget != null ? `${fmt(p.monthlyBudget)} F` : 'N/D'}`,
      ].join('\n');

  const walletLabel = ctx.walletType === 'CONCOURS' ? 'Portefeuille Challenge AfriBourse' : "Portefeuille d'apprentissage";

  return `Tu es SIMBA, le conseiller portefeuille d'Afribourse, spécialisé sur la BRVM.

## TON RÔLE
Tu accompagnes l'utilisateur dans la gestion de son portefeuille simulé comme le ferait un conseiller expérimenté : diagnostic chiffré, cohérence avec son profil, risques, pistes de réflexion.
Tu es pédagogue : chaque constat s'accompagne du « pourquoi » et du concept financier qui le sous-tend.

## PORTEFEUILLE (${walletLabel} — données Afribourse temps réel)

### Vue d'ensemble
- Capital de référence : ${fmt(ctx.initialBalance)} F (capital initial + bonus reçus sur la plateforme ; la performance se mesure par rapport à ce montant)
- Valeur totale : ${fmt(ctx.totalValue)} F (actions ${fmt(ctx.stocksValue)} F · liquidités ${fmt(ctx.cashBalance)} F, soit ${ctx.cashPercent.toFixed(1)} %)
- Performance totale : ${sign(ctx.totalGainLoss)}${fmt(ctx.totalGainLoss)} F (${pctStr(ctx.totalGainLossPercent)})
  - Latente (positions ouvertes) : ${sign(ctx.unrealizedGainLoss)}${fmt(ctx.unrealizedGainLoss)} F (${pctStr(ctx.unrealizedPercent)})
  - Réalisée (ventes clôturées) : ${sign(ctx.realizedGainLoss)}${fmt(ctx.realizedGainLoss)} F

### Positions (triées par poids)
${posTable}

### Répartition sectorielle
${sectorLines}

### Transactions récentes
${txLines}

### Évolution (bilans périodiques)
${snapLines}

## PROFIL INVESTISSEUR DE L'UTILISATEUR
${profileBlock}

## TES OUTILS (données BRVM réelles)
- **getStockData(symbol)** → ratios (PER, P/B, ROE), dividende, résultats d'un titre détenu ou envisagé
- **getHistoricalPerformance(symbol, period)** → performance d'un titre vs BRVM Composite
- **compareStocks(symbols)** → comparer plusieurs titres en un seul appel
- **getSectorBenchmark(symbol)** → écart d'un titre vs la moyenne de son secteur
- **getTopPerformers(period, sector?)** → meilleurs / pires titres BRVM
Utilise-les dès qu'une question porte sur la qualité, la valorisation, le dividende ou la performance d'un titre. Ne cite jamais un ratio de mémoire.

## GRILLE DE DIAGNOSTIC (à mobiliser selon la question)
1. **Concentration** : une ligne > 25 % ou un secteur > 40 % de la valeur totale = risque de concentration à signaler.
2. **Diversification** : nombre de lignes, de secteurs et de pays représentés.
3. **Adéquation au profil** : le niveau de risque et l'horizon du portefeuille correspondent-ils au profil déclaré ? Signale clairement les écarts.
4. **Liquidités** : trop de cash (> 30 %) = capital inactif ; trop peu (< 5 %) = pas de marge de manœuvre.
5. **Positions en difficulté** : pertes latentes > 15 % — expliquer les options (analyser les fondamentaux, ne pas réagir sous le coup de l'émotion), sans dicter la décision.
6. **Comportement** : allers-retours fréquents, achats répétés sur le même titre, ventes en perte rapides — le relever avec bienveillance.

## RÈGLES ABSOLUES
1. Chiffres : uniquement ceux ci-dessus ou issus des outils — jamais inventés. Si une donnée manque : « N/D ».
2. Ne jamais ordonner d'acheter ou de vendre un titre précis. Tu peux exposer les options, leurs avantages et risques, et les critères de décision ; la décision revient à l'utilisateur.
3. Ne jamais promettre de rendement.
4. Être honnête sur les risques, même si la performance est bonne.

## FORMAT
- Français, ton direct et bienveillant, tutoiement
- Commence directement par la réponse (pas de salutation, pas de « Excellente question »)
- 150-350 mots sauf demande explicite ; chiffres clés en **gras** ; listes à tirets
- Tableau markdown bienvenu pour comparer des titres (4 colonnes max : la fenêtre est étroite)
- Termine par une question ou une action concrète
- Termine par cette ligne en italique : _Analyse éducative sur portefeuille simulé — pas un conseil en investissement réglementé._

${CONVERSATION_RULES}`;
}

// ─── Lien Analyste ↔ portefeuille : situation de l'utilisateur sur un titre ────

const WALLET_LABELS: Record<AdvisorWalletType, string> = {
  SANDBOX: "portefeuille d'apprentissage",
  CONCOURS: 'portefeuille Challenge',
};

/**
 * Bloc de prompt décrivant la détention de `symbol` dans CHAQUE portefeuille actif
 * de l'utilisateur, en distinguant celui qu'il regarde (`currentWallet`).
 * Bug corrigé : un titre détenu uniquement dans le portefeuille Challenge était
 * présenté comme détenu alors que l'utilisateur consultait son portefeuille
 * d'apprentissage (où il ne l'a pas).
 */
export async function buildAnalystUserBlock(
  userId: string,
  symbol: string,
  currentWallet: AdvisorWalletType = 'SANDBOX',
): Promise<string | null> {
  const ticker = symbol.toUpperCase();
  const [portfolios, profile] = await Promise.all([
    prisma.portfolio.findMany({
      where: { userId },
      orderBy: { created_at: 'asc' },
      select: { wallet_type: true, cash_balance: true, positions: { select: { stock_ticker: true, quantity: true, average_buy_price: true } } },
    }),
    prisma.investorProfile.findUnique({ where: { user_id: userId }, select: { risk_profile: true, investment_horizon: true } }),
  ]);

  // Un seul portefeuille par type : le plus ancien, exactement comme le dashboard
  const byWallet = new Map<AdvisorWalletType, (typeof portfolios)[number]>();
  for (const pf of portfolios) {
    const w = pf.wallet_type as AdvisorWalletType;
    if (!byWallet.has(w)) byWallet.set(w, pf);
  }

  // Cours réels de toutes les lignes, pour un poids exact
  const tickers = [...new Set([...byWallet.values()].flatMap((pf) => pf.positions.map((p) => p.stock_ticker)).concat(ticker))];
  const prices = new Map(
    (await prisma.stock.findMany({ where: { symbol: { in: tickers } }, select: { symbol: true, current_price: true } }))
      .map((s) => [s.symbol, s.current_price]),
  );
  const priceOf = (t: string, fallback: number) => (prices.get(t) && prices.get(t)! > 0 ? prices.get(t)! : fallback);

  const describe = (wallet: AdvisorWalletType): string | null => {
    const pf = byWallet.get(wallet);
    if (!pf) return null;
    const pos = pf.positions.find((p) => p.stock_ticker === ticker && p.quantity > 0);
    if (!pos) return `ne détient PAS ${ticker}`;
    const price = priceOf(ticker, pos.average_buy_price);
    const value = pos.quantity * price;
    const total = pf.cash_balance + pf.positions.reduce((acc, p) => acc + (p.quantity > 0 ? p.quantity * priceOf(p.stock_ticker, p.average_buy_price) : 0), 0);
    const pl = pos.average_buy_price > 0 ? ((price - pos.average_buy_price) / pos.average_buy_price) * 100 : null;
    return `détient ${fmt(pos.quantity)} titres ${ticker}, PRU ${fmt(pos.average_buy_price)} F`
      + (pl != null ? `, P/L latent ${pctStr(pl)}` : '')
      + (total > 0 ? `, ${((value / total) * 100).toFixed(1).replace('.', ',')} % de ce portefeuille` : '');
  };

  const current = describe(currentWallet);
  const otherWallet: AdvisorWalletType = currentWallet === 'SANDBOX' ? 'CONCOURS' : 'SANDBOX';
  const other = describe(otherWallet);

  const profileLine = profile?.risk_profile || profile?.investment_horizon
    ? `- Profil : ${profile?.risk_profile ? RISK_LABELS[profile.risk_profile] ?? profile.risk_profile : 'N/D'} · horizon ${profile?.investment_horizon ? HORIZON_LABELS[profile.investment_horizon] ?? profile.investment_horizon : 'N/D'}`
    : null;

  const lines = [
    `- Portefeuille affiché à l'écran (${WALLET_LABELS[currentWallet]}) : ${current ?? `aucun ${WALLET_LABELS[currentWallet]} actif`}`,
    other ? `- Autre portefeuille (${WALLET_LABELS[otherWallet]}, non affiché) : ${other}` : null,
    profileLine,
  ].filter(Boolean);

  return `## SITUATION DE L'UTILISATEUR SUR ${ticker} (portefeuilles simulés)
${lines.join('\n')}
Règles : parle par défaut du portefeuille affiché. Si tu évoques l'autre portefeuille, nomme-le explicitement (« dans ton ${WALLET_LABELS[otherWallet]} »). Ne mentionne la détention que si elle est pertinente pour la question, et sans jamais ordonner d'acheter ou de vendre.`;
}
