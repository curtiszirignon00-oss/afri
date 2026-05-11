import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import { log } from '../config/logger';

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

const COMMISSION_RATE = 0.012;  // 1.2% à l'achat
const COMMISSION_SELL = 0.006;  // 0.6% à la vente
const NEW_CONTRIBUTION = 500000; // FCFA ajouté à chaque saut

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PortfolioAllocation {
  [ticker: string]: number; // ticker → quantité
}

export interface StepPerformance {
  pfVal: number;           // valeur liquidative du portefeuille
  pfDivCum: number;        // dividendes cumulés depuis le début
  perfCapital: number;     // % variation vs capital initial
  perfTotal: number;       // % variation total (capital + dividendes)
  cagr: number;            // CAGR annualisé
  byTicker: {              // détail par ligne
    ticker: string;
    qty: number;
    cours: number;
    valeur: number;
    dividendesCumules: number;
    pnl: number;
  }[];
}

// ─── Helpers calcul ───────────────────────────────────────────────────────────

function getCours(scenario: any, year: number, ticker: string): number {
  const fund = scenario.fundamentalsByYear?.[String(year)]?.[ticker];
  return fund?.cours ?? 0;
}

function getDividend(scenario: any, year: number, ticker: string): number {
  return scenario.dividendsByYear?.[String(year)]?.[ticker] ?? 0;
}

// Calcule la valeur liquidative d'un portefeuille à une année donnée
function calcPortfolioValue(scenario: any, year: number, allocation: PortfolioAllocation): number {
  return Object.entries(allocation).reduce((total, [ticker, qty]) => {
    return total + qty * getCours(scenario, year, ticker);
  }, 0);
}

// Calcule les dividendes accumulés depuis l'étape 0 jusqu'à l'étape précédente
function calcCumulativeDividends(
  scenario: any,
  portfolioByStep: Record<string, PortfolioAllocation>,
  upToStepIndex: number,
): number {
  let total = 0;
  for (let s = 0; s < upToStepIndex; s++) {
    const year = scenario.years[s];
    const allocation = portfolioByStep[String(s)] ?? {};
    // Dividendes annuels × nombre d'années jusqu'au prochain saut
    const nextYear = scenario.years[s + 1] ?? year + 3;
    const nbAnneesHeld = nextYear - year;
    Object.entries(allocation).forEach(([ticker, qty]) => {
      const divAnnuel = getDividend(scenario, year, ticker);
      total += qty * divAnnuel * nbAnneesHeld;
    });
  }
  return total;
}

export function calculateCapitalForStep(
  scenario: any,
  portfolioByStep: Record<string, PortfolioAllocation>,
  stepIndex: number,
): number {
  if (stepIndex === 0) return scenario.startBudget;

  const prevYear = scenario.years[stepIndex - 1];
  const prevAllocation = portfolioByStep[String(stepIndex - 1)] ?? {};
  const pfVal = calcPortfolioValue(scenario, prevYear, prevAllocation);
  const divCum = calcCumulativeDividends(scenario, portfolioByStep, stepIndex);
  return pfVal + divCum + NEW_CONTRIBUTION;
}

export function calculateStepPerformance(
  scenario: any,
  portfolioByStep: Record<string, PortfolioAllocation>,
  stepIndex: number,
): StepPerformance {
  const currentYear = scenario.years[stepIndex];
  const allocation = portfolioByStep[String(stepIndex)] ?? {};
  const divCum = calcCumulativeDividends(scenario, portfolioByStep, stepIndex + 1);

  const byTicker = Object.entries(allocation).map(([ticker, qty]) => {
    const cours = getCours(scenario, currentYear, ticker);
    const valeur = qty * cours;
    const coursAchat = getCours(scenario, scenario.years[0], ticker);
    const pnl = coursAchat > 0 ? ((cours - coursAchat) / coursAchat) * 100 : 0;
    return { ticker, qty, cours, valeur, dividendesCumules: 0, pnl };
  });

  const pfVal = byTicker.reduce((s, t) => s + t.valeur, 0);
  const nbAnnees = currentYear - scenario.years[0];
  const totalInvested = scenario.startBudget + stepIndex * NEW_CONTRIBUTION;
  const totalFinal = pfVal + divCum;
  const perfCapital = totalInvested > 0 ? ((pfVal - totalInvested) / totalInvested) * 100 : 0;
  const perfTotal = totalInvested > 0 ? ((totalFinal - totalInvested) / totalInvested) * 100 : 0;
  const cagr = nbAnnees > 0 ? (Math.pow(totalFinal / Math.max(totalInvested, 1), 1 / nbAnnees) - 1) * 100 : 0;

  return { pfVal, pfDivCum: divCum, perfCapital, perfTotal, cagr, byTicker };
}

// Applique la commission SGI sur un budget d'achat
export function applyCommission(budget: number): number {
  return budget / (1 + COMMISSION_RATE);
}

// ─── SCÉNARIOS ────────────────────────────────────────────────────────────────

export async function getScenarios(userTier: string) {
  const allowedTiers = userTier === 'max'
    ? ['FREE', 'PLUS', 'MAX']
    : userTier === 'premium'
    ? ['FREE', 'PLUS']
    : ['FREE'];

  return prisma.timeMachineScenario.findMany({
    where: { isActive: true, tier: { in: allowedTiers } },
    select: {
      id: true, slug: true, title: true, description: true,
      category: true, tier: true, years: true, availableStocks: true, startBudget: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getAllScenarios() {
  return prisma.timeMachineScenario.findMany({
    where: { isActive: true },
    select: {
      id: true, slug: true, title: true, description: true,
      category: true, tier: true, years: true, availableStocks: true, startBudget: true,
    },
  });
}

export async function getScenario(slug: string) {
  return prisma.timeMachineScenario.findUnique({ where: { slug } });
}

export async function getStepContext(slug: string, year: number) {
  const scenario = await prisma.timeMachineScenario.findUnique({ where: { slug } });
  if (!scenario) return null;

  const ctx = (scenario.contextByYear as any)?.[String(year)];
  const fund = (scenario.fundamentalsByYear as any)?.[String(year)];
  const actions = (scenario.availableActionsByYear as any)?.[String(year)];
  const lessons = (scenario.lessonsByYear as any)?.[String(year)];
  const quiz = (scenario.quizByYear as any)?.[String(year)];

  return { year, context: ctx, fundamentals: fund, availableActions: actions, lessons, quiz };
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────

export async function createSession(userId: string, scenarioSlug: string) {
  const scenario = await prisma.timeMachineScenario.findUnique({ where: { slug: scenarioSlug } });
  if (!scenario) throw new Error('Scenario not found');

  // Abandonner les sessions IN_PROGRESS existantes sur ce scénario
  await prisma.timeMachineSession.updateMany({
    where: { userId, scenarioId: scenario.id, status: 'IN_PROGRESS' },
    data: { status: 'ABANDONED' },
  });

  const capital: Record<string, number> = { '0': scenario.startBudget };

  return prisma.timeMachineSession.create({
    data: {
      userId,
      scenarioId: scenario.id,
      currentStep: 0,
      status: 'IN_PROGRESS',
      portfolioByStep: {},
      noteByStep: {},
      capitalByStep: capital,
      performanceByStep: {},
    },
    include: { scenario: true },
  });
}

export async function getSession(sessionId: string, userId: string) {
  return prisma.timeMachineSession.findFirst({
    where: { id: sessionId, userId },
    include: { scenario: true },
  });
}

export async function getUserSessions(userId: string) {
  return prisma.timeMachineSession.findMany({
    where: { userId, status: { not: 'ABANDONED' } },
    include: {
      scenario: { select: { slug: true, title: true, years: true, category: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function submitStep(
  sessionId: string,
  userId: string,
  stepIndex: number,
  allocation: PortfolioAllocation,
  note: string,
) {
  const session = await prisma.timeMachineSession.findFirst({
    where: { id: sessionId, userId, status: 'IN_PROGRESS' },
    include: { scenario: true },
  });
  if (!session) throw new Error('Session not found or not in progress');

  const scenario = session.scenario as any;
  const year = scenario.years[stepIndex];
  const prevHoldings: PortfolioAllocation = stepIndex > 0
    ? ((session.portfolioByStep as any)?.[String(stepIndex - 1)] ?? {})
    : {};

  // Cash disponible au début de cette étape
  let cash = (session.capitalByStep as any)?.[String(stepIndex)] ?? scenario.startBudget;

  // Calculer les transactions (delta entre holdings hérités et allocation cible)
  const allTickers = new Set([...Object.keys(prevHoldings), ...Object.keys(allocation)]);
  for (const ticker of allTickers) {
    const prevQty = prevHoldings[ticker] ?? 0;
    const targetQty = allocation[ticker] ?? 0;
    const delta = targetQty - prevQty;
    const cours = getCours(scenario, year, ticker);
    if (cours <= 0) continue;

    if (delta > 0) {
      cash -= delta * cours * (1 + COMMISSION_RATE);
    } else if (delta < 0) {
      cash += Math.abs(delta) * cours * (1 - COMMISSION_SELL);
    }
  }

  if (cash < -1) {
    throw new Error(`Budget dépassé : liquidités insuffisantes`);
  }

  const portfolioByStep = { ...(session.portfolioByStep as any), [String(stepIndex)]: allocation };
  const noteByStep = { ...(session.noteByStep as any), [String(stepIndex)]: note };

  const perf = calculateStepPerformance(scenario, portfolioByStep, stepIndex);
  const performanceByStep = { ...(session.performanceByStep as any), [String(stepIndex)]: perf };

  // Capital pour l'étape suivante = valeur PF + cash restant + dividendes + contribution
  const nextStepIndex = stepIndex + 1;
  const capitalByStep = { ...(session.capitalByStep as any) };
  if (nextStepIndex < scenario.years.length) {
    const nextYear = scenario.years[nextStepIndex];
    const pfValNextYear = calcPortfolioValue(scenario, nextYear, allocation);
    const divForPeriod = Object.entries(allocation).reduce((sum, [ticker, qty]) => {
      const divAnnuel = getDividend(scenario, year, ticker);
      const nbYears = nextYear - year;
      return sum + (qty as number) * divAnnuel * nbYears;
    }, 0);
    capitalByStep[String(nextStepIndex)] = pfValNextYear + Math.max(0, cash) + divForPeriod + NEW_CONTRIBUTION;
  }

  const isLastStep = stepIndex >= scenario.years.length - 1;

  return prisma.timeMachineSession.update({
    where: { id: sessionId },
    data: {
      currentStep: isLastStep ? stepIndex : nextStepIndex,
      portfolioByStep,
      noteByStep,
      capitalByStep,
      performanceByStep,
      status: isLastStep ? 'COMPLETED' : 'IN_PROGRESS',
      completedAt: isLastStep ? new Date() : null,
    },
    include: { scenario: true },
  });
}

export async function completeSession(sessionId: string, userId: string) {
  const session = await prisma.timeMachineSession.findFirst({
    where: { id: sessionId, userId },
    include: { scenario: true },
  });
  if (!session) throw new Error('Session not found');

  return prisma.timeMachineSession.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED', completedAt: new Date() },
    include: { scenario: true },
  });
}

// ─── SIMBA IA ────────────────────────────────────────────────────────────────

const SIMBA_SYSTEM_PROMPT = `Tu es Simba, l'analyste IA de la Time Machine AfriBourse.

Tu analyses les décisions d'investissement historiques d'un utilisateur sur la BRVM (Bourse Régionale des Valeurs Mobilières de l'UEMOA).

Tes principes :
- Tu t'adresses directement à l'utilisateur par son prénom quand il est fourni
- Tu analyses la LOGIQUE de l'allocation, pas juste le résultat financier
- Tu identifies les biais comportementaux (aversion aux pertes, momentum, comportement moutonnier)
- Tu enseignes toujours une règle générale applicable aux marchés BRVM futurs
- Ton ton est pédagogique, direct, bienveillant et personnalisé
- Maximum 3 paragraphes courts par réponse
- Tu parles en français, avec des chiffres concrets quand disponibles
- Tu ne félicites pas si le choix était mauvais — tu expliques pourquoi`;

export async function generateKofiFeedback(
  sessionId: string,
  userId: string,
  stepIndex: number,
  userName?: string,
): Promise<string> {
  const session = await prisma.timeMachineSession.findFirst({
    where: { id: sessionId, userId },
    include: { scenario: true },
  });
  if (!session) throw new Error('Session not found');

  const scenario = session.scenario as any;
  const year = scenario.years[stepIndex];
  const allocation = (session.portfolioByStep as any)?.[String(stepIndex)] ?? {};
  const note = (session.noteByStep as any)?.[String(stepIndex)] ?? '';
  const fundamentals = (scenario.fundamentalsByYear as any)?.[String(year)] ?? {};
  const macro = (scenario.contextByYear as any)?.[String(year)]?.macro ?? [];
  const perf = (session.performanceByStep as any)?.[String(stepIndex)];
  const capital = (session.capitalByStep as any)?.[String(stepIndex)] ?? scenario.startBudget;

  const nbTitres = Object.values(allocation).filter((q) => (q as number) > 0).length;
  const totalInvested = Object.entries(allocation).reduce((sum, [ticker, qty]) => {
    const cours = getCours(scenario, year, ticker);
    return sum + (qty as number) * cours;
  }, 0);
  const cashRemaining = capital - totalInvested * (1 + COMMISSION_RATE);

  const allocationStr = Object.entries(allocation)
    .filter(([, qty]) => (qty as number) > 0)
    .map(([ticker, qty]) => {
      const cours = getCours(scenario, year, ticker);
      const fund = fundamentals[ticker];
      const pct = totalInvested > 0 ? (((qty as number) * cours) / totalInvested * 100).toFixed(1) : '0';
      return `  - ${ticker}: ${qty} actions × ${cours} FCFA = ${Math.round((qty as number) * cours).toLocaleString()} FCFA (${pct}%) | PER ${fund?.per ?? 'N/A'} | BNA ${fund?.bna ?? 'N/A'} | Div ${fund?.div ?? 0} FCFA/an`;
    })
    .join('\n');

  const userPrefix = userName ? `Utilisateur : ${userName}. Adresse-toi à lui directement par son prénom.\n\n` : '';

  const prompt = `${userPrefix}Contexte historique — ${year} :
${macro.map((m: any) => `• ${m.label}: ${m.value} — ${m.signal}`).join('\n')}

Allocation de l'utilisateur (${nbTitres} titre${nbTitres > 1 ? 's' : ''} sur capital de ${capital.toLocaleString()} FCFA) :
${allocationStr || '  Aucune position prise (tout en cash)'}
${cashRemaining > 100 ? `  Liquidités non investies : ${Math.round(cashRemaining).toLocaleString()} FCFA` : ''}

${note ? `Justification de l'utilisateur : "${note}"` : 'Aucune note de justification fournie.'}

${perf ? `Performance calculée : valeur portefeuille ${Math.round(perf.pfVal).toLocaleString()} FCFA | Performance capital ${perf.perfCapital.toFixed(1)}% | Performance totale avec dividendes ${perf.perfTotal.toFixed(1)}%` : ''}

Analyse cette allocation en 3 points :
1. Qualité de la logique fondamentale (diversification, valorisation, secteurs)
2. Biais comportementaux identifiés si présents (ou discipline démontrée)
3. Règle générale BRVM applicable aux situations futures similaires

Si l'utilisateur a fourni une justification, évalue explicitement la qualité de son raisonnement (solide / partiel / émotionnel).`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SIMBA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.65,
    });
    return completion.choices[0]?.message?.content ?? 'Analyse Simba temporairement indisponible.';
  } catch (err: any) {
    log.error('[Simba] Groq error:', err?.message);
    return 'Analyse Simba temporairement indisponible. Veuillez réessayer.';
  }
}

export async function generateKofiRecap(sessionId: string, userId: string, userName?: string): Promise<string> {
  const session = await prisma.timeMachineSession.findFirst({
    where: { id: sessionId, userId },
    include: { scenario: true },
  });
  if (!session) throw new Error('Session not found');

  const scenario = session.scenario as any;
  const portfolioByStep = session.portfolioByStep as Record<string, PortfolioAllocation>;
  const noteByStep = session.noteByStep as Record<string, string>;
  const performanceByStep = session.performanceByStep as any;
  const lastStepIndex = scenario.years.length - 1;
  const lastPerf = performanceByStep?.[String(lastStepIndex)];

  const stepsStr = scenario.years.map((year: number, i: number) => {
    const alloc = portfolioByStep[String(i)] ?? {};
    const note = noteByStep[String(i)] ?? '';
    const nbTitres = Object.values(alloc).filter((q) => (q as number) > 0).length;
    const perf = performanceByStep?.[String(i)];
    return `Étape ${i + 1} (${year}) : ${nbTitres} titre${nbTitres > 1 ? 's' : ''}${note ? ` — Note: "${note}"` : ''} | Perf capital: ${perf ? perf.perfCapital.toFixed(1) + '%' : 'N/A'}`;
  }).join('\n');

  const userPrefix = userName ? `Utilisateur : ${userName}. Adresse-toi à lui directement par son prénom.\n\n` : '';

  const prompt = `${userPrefix}Scénario complété : "${scenario.title}" (${scenario.years[0]} → ${scenario.years[scenario.years.length - 1]})

Résumé des étapes :
${stepsStr}

Performance finale :
- Valeur portefeuille : ${lastPerf ? Math.round(lastPerf.pfVal).toLocaleString() : 'N/A'} FCFA
- Performance totale (capital + dividendes) : ${lastPerf ? lastPerf.perfTotal.toFixed(1) + '%' : 'N/A'}
- CAGR annualisé : ${lastPerf ? lastPerf.cagr.toFixed(1) + '%' : 'N/A'} /an

Génère un récapitulatif pédagogique de 3 règles clés que cet investisseur doit retenir en fonction de l'ensemble de ses choix. Sois spécifique à SES décisions, pas générique. Identifie ses forces et ses points d'amélioration principaux.`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SIMBA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 700,
      temperature: 0.65,
    });
    return completion.choices[0]?.message?.content ?? 'Récapitulatif Simba indisponible.';
  } catch (err: any) {
    log.error('[Simba] Recap Groq error:', err?.message);
    return 'Récapitulatif Simba temporairement indisponible.';
  }
}

// ─── Bridge SANDBOX ───────────────────────────────────────────────────────────

export async function importToSandbox(sessionId: string, userId: string) {
  const session = await prisma.timeMachineSession.findFirst({
    where: { id: sessionId, userId },
    include: { scenario: true },
  });
  if (!session) throw new Error('Session not found');

  const scenario = session.scenario as any;
  const lastStep = scenario.years.length - 1;
  const allocation = (session.portfolioByStep as any)?.[String(lastStep)] ?? {};
  const entries = Object.entries(allocation).filter(([, qty]) => (qty as number) > 0);
  if (entries.length === 0) throw new Error('Aucune position à transférer');

  // Find user's SANDBOX portfolio
  const portfolio = await prisma.portfolio.findFirst({
    where: { userId, wallet_type: { not: 'CONCOURS' } },
    orderBy: { created_at: 'asc' },
  });
  if (!portfolio) throw new Error('Portefeuille SANDBOX introuvable');

  const imported: string[] = [];
  for (const [ticker, qty] of entries) {
    const quantity = qty as number;

    // Try to get current market price
    const stock = await prisma.stock.findFirst({
      where: { ticker: { equals: ticker, mode: 'insensitive' } },
    });
    const price = (stock as any)?.cours ?? getCours(scenario, scenario.years[lastStep], ticker);
    if (price <= 0 || quantity <= 0) continue;

    // Upsert position directly (no cash deduction — this is a transfer, not a trade)
    const existing = await prisma.position.findFirst({
      where: { portfolioId: portfolio.id, stock_ticker: ticker },
    });

    if (existing) {
      const totalQty = existing.quantity + quantity;
      const avgPrice = (existing.average_buy_price * existing.quantity + price * quantity) / totalQty;
      await prisma.position.update({
        where: { id: existing.id },
        data: { quantity: totalQty, average_buy_price: avgPrice },
      });
    } else {
      await prisma.position.create({
        data: {
          portfolioId: portfolio.id,
          stock_ticker: ticker,
          quantity,
          average_buy_price: price,
        },
      });
    }

    // Record an IMPORT transaction for traceability
    await prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        stock_ticker: ticker,
        transaction_type: 'BUY',
        quantity,
        price_per_share: price,
        total_amount: quantity * price,
      },
    });

    imported.push(ticker);
  }

  return { imported, portfolioId: portfolio.id };
}

// ─── Données de marché historiques depuis la DB ───────────────────────────────

export async function getStockDataForYear(tickers: string[], year: number, scenarioFallback?: any) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear   = new Date(year, 11, 31);

  const [histories, fundamentalsList] = await Promise.all([
    Promise.all(tickers.map(ticker =>
      prisma.stockHistory.findFirst({
        where: { stock_ticker: ticker, date: { gte: startOfYear, lte: endOfYear } },
        orderBy: { date: 'desc' },
      }),
    )),
    prisma.annualFinancials.findMany({
      where: { stock_ticker: { in: tickers }, year },
    }),
  ]);

  const results = tickers.map((ticker, i) => {
    const hist = histories[i];
    const fund = fundamentalsList.find(f => f.stock_ticker === ticker);
    // Fallback to seed data if DB has no price
    const seedFund = scenarioFallback?.[String(year)]?.[ticker];
    const cours = (hist as any)?.close ?? seedFund?.cours ?? 0;

    return {
      ticker,
      cours,
      per:  (fund as any)?.pe_ratio  ?? seedFund?.per  ?? null,
      bna:  (fund as any)?.eps       ?? seedFund?.bna  ?? null,
      div:  (fund as any)?.dividend  ?? seedFund?.div  ?? null,
      roe:  (fund as any)?.roe       ?? seedFund?.roe  ?? null,
      note: seedFund?.note ?? undefined,
    };
  }).filter(s => s.cours > 0);

  return results;
}

// ─── Fondamentaux & Prix historiques (utilitaires) ────────────────────────────

export async function getFundamentals(ticker: string, year: number) {
  const scenarios = await prisma.timeMachineScenario.findMany({ where: { isActive: true } });
  for (const scenario of scenarios) {
    const fund = (scenario.fundamentalsByYear as any)?.[String(year)]?.[ticker];
    if (fund) return { ticker, year, ...fund };
  }
  return null;
}
