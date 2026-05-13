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

  // Capital total de cette étape (pfVal hérité + cash restant + dividendes + contribution)
  const totalCapital = (session.capitalByStep as any)?.[String(stepIndex)] ?? scenario.startBudget;
  // Valeur des positions héritées au prix de l'année courante
  const inheritedPfVal = calcPortfolioValue(scenario, year, prevHoldings);
  // Cash disponible = capital total − valeur des positions déjà détenues
  let cash = totalCapital - inheritedPfVal;

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

RÈGLES ABSOLUES — respecte-les à la lettre :
- NE COMMENCE JAMAIS par une salutation ("Bonjour", "Bien joué", "Bravo", "Salut", "Félicitations", etc.). Attaque directement l'analyse.
- Chaque étape a un contexte historique UNIQUE. Ton analyse doit OBLIGATOIREMENT refléter ce contexte précis (l'année, la tendance de marché, la macro).
- NE RÉPÈTE PAS les mêmes conseils génériques d'une étape à l'autre. Si tu as déjà mentionné la diversification à l'étape 1, ne la ressors pas à l'étape 3 sauf si c'est spécifiquement pertinent.
- Cite les chiffres concrets fournis (cours, PER, BNA, dividendes, % de performance). Une analyse sans chiffres est inutile.
- Ne félicites pas si le choix était mauvais — explique pourquoi avec des données.
- Ne critique pas si le choix était bon — valorise la discipline ou la logique démontrée.
- Maximum 3 paragraphes courts et denses. Zéro phrase de remplissage.
- Tu parles en français, ton pédagogique, direct, bienveillant.
- Tu t'adresses directement à l'utilisateur par son prénom quand il est fourni.`;

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
  const macro = (scenario.contextByYear as any)?.[String(year)]?.macro ?? [];
  const news = (scenario.contextByYear as any)?.[String(year)]?.news ?? [];
  const perf = (session.performanceByStep as any)?.[String(stepIndex)];
  const capital = (session.capitalByStep as any)?.[String(stepIndex)] ?? scenario.startBudget;

  // Fetch real DB prices for this year's tickers — same source as the play page
  const allTickers = Object.keys(allocation).filter(t => (allocation[t] as number) > 0);
  const seedFundamentals = (scenario.fundamentalsByYear as any)?.[String(year)] ?? {};
  const dbStockData = allTickers.length > 0
    ? await getStockDataForYear(allTickers, year, scenario.fundamentalsByYear)
    : [];
  const priceMap: Record<string, { cours: number; per?: any; bna?: any; div?: any; roe?: any; note?: string }> = {};
  for (const s of dbStockData) {
    priceMap[s.ticker] = s;
  }
  // Merge with seed for tickers not in DB
  for (const ticker of allTickers) {
    if (!priceMap[ticker] && seedFundamentals[ticker]) {
      priceMap[ticker] = seedFundamentals[ticker];
    }
  }

  const activePositions = Object.entries(allocation).filter(([, qty]) => (qty as number) > 0);
  const nbTitres = activePositions.length;

  const totalInvested = activePositions.reduce((sum, [ticker, qty]) => {
    const cours = priceMap[ticker]?.cours ?? getCours(scenario, year, ticker);
    return sum + (qty as number) * cours;
  }, 0);

  // Previous holdings to compute deltas (buy vs sell vs hold)
  const prevHoldings = stepIndex > 0
    ? ((session.portfolioByStep as any)?.[String(stepIndex - 1)] ?? {})
    : {};

  const allocationStr = activePositions
    .map(([ticker, qty]) => {
      const fund = priceMap[ticker];
      const cours = fund?.cours ?? getCours(scenario, year, ticker);
      const pct = totalInvested > 0 ? (((qty as number) * cours) / totalInvested * 100).toFixed(1) : '0';
      const prevQty = (prevHoldings[ticker] as number) ?? 0;
      const delta = (qty as number) - prevQty;
      const action = delta > 0 ? `[ACHAT +${delta}]` : delta < 0 ? `[VENTE ${delta}]` : '[CONSERVÉ]';
      return `  - ${ticker} ${action}: ${qty} actions × ${cours.toLocaleString()} FCFA = ${Math.round((qty as number) * cours).toLocaleString()} FCFA (${pct}% du PF) | PER: ${fund?.per ?? 'N/A'} | BNA: ${fund?.bna ?? 'N/A'} | Div: ${fund?.div ?? 0} FCFA/an | ROE: ${fund?.roe ?? 'N/A'}`;
    })
    .join('\n');

  // Sold positions (in prev but not in current)
  const soldStr = Object.entries(prevHoldings)
    .filter(([t, prevQty]) => (prevQty as number) > 0 && !((allocation[t] as number) > 0))
    .map(([t, prevQty]) => {
      const cours = priceMap[t]?.cours ?? getCours(scenario, year, t);
      return `  - ${t} [VENDU ENTIÈREMENT]: était ${prevQty} actions × ${cours.toLocaleString()} FCFA`;
    })
    .join('\n');

  const cashRemaining = Math.max(0, capital - totalInvested * (1 + COMMISSION_RATE));

  const totalSteps = scenario.years.length;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  // Year-specific historical significance to anchor each analysis
  const yearContext: Record<number, string> = {
    2008: 'CRISE MONDIALE — la crise des subprimes ravage les marchés mondiaux. La BRVM chute de ~29%. C\'est le pire moment pour investir en bourse — ou le meilleur pour acheter à prix bradés.',
    2009: 'DÉBUT DE REPRISE — après le choc de 2008, les marchés amorcent une reprise fragile (-3% BRVM). Patience et sélectivité sont essentielles.',
    2010: 'BULL RUN EXCEPTIONNEL — la BRVM explose de +68% cette année. C\'est l\'un des meilleurs marchés au monde. L\'euphorie peut conduire à surpayer.',
    2013: 'SOMMET DU CYCLE — la BRVM atteint des records (+26% sur 2013). Les valorisations sont élevées. Les PER élevés signalent une marché cher.',
    2016: 'CORRECTION MODÉRÉE — la BRVM recule de -2% après plusieurs années de hausse. Certains titres restent à des niveaux élevés post-bull run.',
    2019: 'MARCHÉ BAISSIER — la BRVM perd -8.4%. Plusieurs secteurs (banques régionales, agroalimentaire) subissent des restructurations douloureuses.',
    2022: 'CHOC INFLATIONNISTE — inflation à +7.4% (niveau record depuis 10 ans), hausse des taux BCEAO à 3.5%. Les taux élevés pénalisent les actions à PER élevé.',
  };

  const stepContext = yearContext[year] ?? `Année ${year} — étape ${stepIndex + 1} du scénario.`;

  // Previous step performance for comparison
  const prevPerf = stepIndex > 0 ? (session.performanceByStep as any)?.[String(stepIndex - 1)] : null;
  const prevYear = stepIndex > 0 ? scenario.years[stepIndex - 1] : null;
  const prevPerfStr = prevPerf && prevYear
    ? `À l'étape précédente (${prevYear}), performance capital : ${prevPerf.perfCapital.toFixed(1)}%, PF valeur : ${Math.round(prevPerf.pfVal).toLocaleString()} FCFA.`
    : '';

  const stepPosition = isFirstStep
    ? 'PREMIÈRE ÉTAPE — l\'investisseur part de zéro, construire une base solide est prioritaire.'
    : isLastStep
    ? `DERNIÈRE ÉTAPE (${stepIndex + 1}/${totalSteps}) — bilan final en vue. Les décisions ici clôturent le portefeuille.`
    : `ÉTAPE ${stepIndex + 1} SUR ${totalSteps} — l\'investisseur gère un portefeuille en cours de constitution. ${prevPerfStr}`;

  const userPrefix = userName ? `Utilisateur : ${userName}. Adresse-toi à lui directement par son prénom.\n\n` : '';

  const prompt = `${userPrefix}${stepPosition}

=== CONTEXTE HISTORIQUE ${year} ===
SIGNIFICATION DE CETTE ANNÉE : ${stepContext}

INDICATEURS MACRO :
${macro.map((m: any) => `• ${m.label}: ${m.value} — ${m.signal}`).join('\n')}

ACTUALITÉS CLÉS :
${news.slice(0, 3).map((n: any) => `• [${n.sentiment?.toUpperCase() ?? 'NEUTRE'}] ${n.text}`).join('\n')}

=== DÉCISIONS DE L'INVESTISSEUR ===
Capital disponible au début de l'étape : ${capital.toLocaleString()} FCFA
Nombre de titres en portefeuille : ${nbTitres}
Valeur totale investie : ${Math.round(totalInvested).toLocaleString()} FCFA
${cashRemaining > 500 ? `Cash non investi : ${Math.round(cashRemaining).toLocaleString()} FCFA` : 'Cash quasi-totalement déployé.'}

DÉTAIL DES POSITIONS (avec action réalisée vs étape précédente) :
${allocationStr || '  ⚠️ AUCUNE POSITION — tout le capital est resté en cash'}
${soldStr ? `\nPOSITIONS LIQUIDÉES :\n${soldStr}` : ''}

${note ? `JUSTIFICATION DE L'INVESTISSEUR : "${note}"` : 'Aucune note de justification fournie.'}

=== RÉSULTATS CALCULÉS POUR CETTE ÉTAPE ===
${perf ? `• Valeur portefeuille : ${Math.round(perf.pfVal).toLocaleString()} FCFA\n• Performance capital : ${perf.perfCapital.toFixed(1)}%\n• Performance totale (dividendes inclus) : ${perf.perfTotal.toFixed(1)}%\n• Dividendes cumulés depuis le début : ${Math.round(perf.pfDivCum ?? 0).toLocaleString()} FCFA` : 'Performance non encore calculée.'}

=== INSTRUCTIONS POUR CETTE ANALYSE SPÉCIFIQUE ===
Tu es à l'étape ${stepIndex + 1} sur ${totalSteps} (année ${year}). Cette analyse doit être ENTIÈREMENT différente des étapes précédentes.

Commence directement par le fond. En 3 paragraphes courts et denses :
1. Ce que révèlent les positions prises au regard du contexte ${year} — cite les chiffres réels (cours, PER, BNA, %) et explique pourquoi ces choix sont adaptés ou non à cette phase de marché.
2. ${stepIndex === 0 ? 'La logique de construction initiale : diversification sectorielle, valorisations choisies, cash investi vs conservé.' : stepIndex <= 1 ? 'Les ajustements opérés (ACHAT/VENTE/CONSERVÉ) — sont-ils cohérents avec la hausse ou la baisse de marché observée entre les deux étapes ?' : 'La gestion du portefeuille dans ce contexte de marché — les décisions de vente/achat face aux variations de cours réelles.'}
3. ${isLastStep ? `Le bilan de la stratégie sur l'ensemble du scénario — qu'est-ce qui a fonctionné, qu'est-ce qui n'a pas fonctionné ?` : `Une règle BRVM SPÉCIFIQUE à ce moment du cycle (${year}) — pas un conseil générique, quelque chose d'ancré dans les données macro et les cours réels de cette année.`}

${note ? 'Évalue explicitement la qualité du raisonnement fourni dans la justification (solide / partiel / émotionnel / aligné ou non avec les données macro).' : ''}
⚠️ RAPPEL : analyse les positions RÉELLEMENT prises. Ne dis pas que l'utilisateur est en cash si des positions sont listées.`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SIMBA_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 650,
      temperature: 0.5,
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
  const capitalByStep = session.capitalByStep as any;
  const lastStepIndex = scenario.years.length - 1;
  const lastPerf = performanceByStep?.[String(lastStepIndex)];

  // Build detailed step-by-step summary with real position data
  const stepsStr = scenario.years.map((year: number, i: number) => {
    const alloc = portfolioByStep[String(i)] ?? {};
    const note = noteByStep[String(i)] ?? '';
    const perf = performanceByStep?.[String(i)];
    const capital = capitalByStep?.[String(i)] ?? scenario.startBudget;
    const activePositions = Object.entries(alloc).filter(([, qty]) => (qty as number) > 0);
    const nbTitres = activePositions.length;

    const prevAlloc = i > 0 ? (portfolioByStep[String(i - 1)] ?? {}) : {};
    const positionsStr = activePositions.map(([ticker, qty]) => {
      const seedPrice = (scenario.fundamentalsByYear as any)?.[String(year)]?.[ticker]?.cours ?? 0;
      const prevQty = (prevAlloc[ticker] as number) ?? 0;
      const delta = (qty as number) - prevQty;
      const action = delta > 0 ? `achat +${delta}` : delta < 0 ? `vente ${delta}` : 'conservé';
      const valeur = (qty as number) * seedPrice;
      return `${ticker}(${qty}×${seedPrice > 0 ? seedPrice.toLocaleString() : '?'}FCFA=${valeur > 0 ? Math.round(valeur).toLocaleString() : '?'}FCFA, ${action})`;
    }).join(', ');

    return `[Étape ${i + 1} — ${year}] capital=${capital.toLocaleString()}FCFA | ${nbTitres} titre(s): ${positionsStr || 'CASH'} | perf=${perf ? perf.perfCapital.toFixed(1) + '%' : 'N/A'} | divCum=${perf ? Math.round(perf.pfDivCum ?? 0).toLocaleString() + 'FCFA' : 'N/A'}${note ? ` | note="${note}"` : ''}`;
  }).join('\n');

  const userPrefix = userName ? `Investisseur : ${userName}. Adresse-toi à lui directement par son prénom.\n\n` : '';

  const prompt = `${userPrefix}=== BILAN COMPLET DU SCÉNARIO ===
Scénario : "${scenario.title}" (${scenario.years[0]} → ${scenario.years[scenario.years.length - 1]})
Capital initial : ${scenario.startBudget.toLocaleString()} FCFA | Contribution à chaque étape : 500 000 FCFA

=== HISTORIQUE DES DÉCISIONS (données réelles) ===
${stepsStr}

=== PERFORMANCE FINALE ===
• Valeur portefeuille : ${lastPerf ? Math.round(lastPerf.pfVal).toLocaleString() : 'N/A'} FCFA
• Performance totale (capital + dividendes) : ${lastPerf ? lastPerf.perfTotal.toFixed(1) + '%' : 'N/A'}
• CAGR annualisé : ${lastPerf ? lastPerf.cagr.toFixed(1) + '%' : 'N/A'} /an
• Dividendes cumulés totaux : ${lastPerf ? Math.round(lastPerf.pfDivCum ?? 0).toLocaleString() : 'N/A'} FCFA

=== INSTRUCTIONS ===
En te basant UNIQUEMENT sur les décisions réelles listées ci-dessus, génère un récapitulatif personnalisé avec :
1. LA FORCE PRINCIPALE de cet investisseur (ce qu'il a bien fait, avec exemple précis)
2. LA FAIBLESSE PRINCIPALE à corriger (avec exemple précis de décision sous-optimale)
3. LA RÈGLE D'OR personnalisée pour ses prochains investissements BRVM

Sois ultra-concret. Cite les tickers, les années, les montants. Pas de généralités.`;

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

export async function saveUserFeedback(
  sessionId: string,
  userId: string,
  feedback: { rating: number; useful: boolean; tags: string[]; comment?: string },
) {
  const session = await prisma.timeMachineSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new Error('Session not found');

  return prisma.timeMachineSession.update({
    where: { id: sessionId },
    data: {
      userFeedback: {
        ...feedback,
        submittedAt: new Date().toISOString(),
      },
    },
  });
}
