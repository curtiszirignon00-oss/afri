import { log } from '../config/logger';
import { Response, NextFunction } from 'express';
import Groq from 'groq-sdk';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  chatService,
  marketAnalysis,
  explainConcept,
  analyzePortfolio,
  generateQuiz,
  StockData,
  Message,
} from '../services/ai-coach.service';
import { UserContext, buildAnalystPrompt, TutorUserContext, buildTutorSystemPrompt } from '../ai/systemPrompt';
import { getUserContext } from '../ai/userContext';
import { preProcessMessage, postProcessResponse, stripTutorIntro } from '../ai/guardrails';
import { trackAICall, trackAIFeedback, getAISummary } from '../ai/aiAnalytics.service';
import { ANALYST_TOOLS } from '../ai/analystTools';
import { TOOL_EXECUTORS } from '../services/brvmDataService';
import { buildContextBlock } from '../ai/tutorRAG';
import { prisma } from '../config/database';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export async function askTutor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { message, conversationHistory, userContext } = req.body as {
      message?: string;
      conversationHistory?: Message[];
      userContext?: TutorUserContext;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ message est requis.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: 'Le message est trop long (max 1000 caractères).' });
    }

    // Guardrail
    const preCheck = preProcessMessage(message);
    if (preCheck.blocked) {
      return res.json({ success: true, data: { reply: preCheck.fallbackMessage, provider: 'guardrail' } });
    }

    const cleanMessage = 'processedMessage' in preCheck ? preCheck.processedMessage : message.trim();
    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-12) : [];
    const ctx: TutorUserContext = typeof userContext === 'object' && userContext !== null ? userContext : {};

    // RAG : recherche du contenu de module pertinent
    const contextBlock = buildContextBlock(cleanMessage);
    if (contextBlock) {
      log.debug(`[TUTOR RAG] Contexte injecté pour : "${cleanMessage.slice(0, 60)}"`);
    }

    const systemPrompt = buildTutorSystemPrompt(ctx, contextBlock);
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: cleanMessage },
    ];

    const t0 = Date.now();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 700,
      temperature: 0.6,
    });
    const rawText = completion.choices[0]?.message?.content ?? '';
    const text = stripTutorIntro(rawText);
    const responseTimeMs = Date.now() - t0;

    trackAICall({
      userId: req.user!.id,
      sessionId: req.id ?? req.ip ?? 'unknown',
      endpoint: 'tutor',
      provider: 'groq',
      responseTimeMs,
      blocked: false,
      question: cleanMessage,
      success: true,
    }).catch(() => {});

    const messageId = `${req.user!.id}-tutor-${Date.now()}`;

    return res.json({
      success: true,
      data: {
        reply: text || 'Désolé, je n\'ai pas pu générer de réponse.',
        hasModuleContext: !!contextBlock,
        provider: 'groq',
        messageId,
      },
    });
  } catch (error) {
    log.error('[TUTOR ERROR]', error);
    next(error);
  }
}

export async function analyzeStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { stock } = req.body as { stock?: Record<string, unknown> };
    if (!stock || typeof stock !== 'object') {
      return res.status(400).json({ success: false, message: 'Les données de l\'action sont requises.' });
    }

    const { company_name, symbol, sector, current_price, daily_change_percent, market_cap, volume, description } = stock as Record<string, unknown>;

    if (!company_name || !symbol) {
      return res.status(400).json({ success: false, message: 'company_name et symbol sont requis.' });
    }

    const prompt = `
      Agis comme un expert financier senior spécialisé dans la Bourse Régionale des Valeurs Mobilières (BRVM).

      Analyse brièvement l'entreprise suivante pour un investisseur débutant :
      Nom: ${String(company_name).slice(0, 100)} (${String(symbol).slice(0, 20)})
      Secteur: ${sector ? String(sector).slice(0, 100) : 'Non spécifié'}
      Prix Actuel: ${Number(current_price) || 0} FCFA
      Variation: ${Number(daily_change_percent)?.toFixed(2) || '0'}%
      Capitalisation: ${market_cap ? (Number(market_cap) / 1_000_000_000).toFixed(2) + ' Mds FCFA' : 'Non disponible'}
      Volume: ${volume ? Number(volume).toLocaleString() : 'Non disponible'}
      Description: ${description ? String(description).slice(0, 500) : 'Non disponible'}

      Fournis une "Note d'Analyse Rapide" (max 150 mots) structurée ainsi :
      1. **Contexte**: Qu'est-ce qui pourrait influencer ce secteur actuellement ?
      2. **Point de Vigilance**: Un risque potentiel.
      3. **Conseil Éducatif**: Un concept clé à surveiller pour cette action spécifique.

      Reste neutre, professionnel, mais encourageant pour l'apprentissage. Formate la réponse en Markdown.
    `;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
    });
    const text = completion.choices[0]?.message?.content ?? '';

    return res.json({ success: true, data: { text: text || 'L\'analyse n\'est pas disponible pour le moment.' } });
  } catch (error) {
    next(error);
  }
}

// ─── Coach IA SIMBA (Groq) ─────────────────────────────────────────────────────

export async function coachIA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { message, conversationHistory } = req.body as {
      message?: string;
      conversationHistory?: Message[];
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ message est requis.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: 'Le message est trop long (max 1000 caractères).' });
    }

    // 1. Guardrail pre-processing
    const preCheck = preProcessMessage(message);
    if (preCheck.blocked) {
      return res.json({
        success: true,
        data: {
          reply: preCheck.fallbackMessage,
          provider: 'guardrail',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Contexte utilisateur + historique
    const userCtx = await getUserContext(req.user!.id);
    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-6) : [];

    // 3. Appel SIMBA avec mesure du temps de réponse
    const cleanMessage = 'processedMessage' in preCheck ? preCheck.processedMessage : message.trim();
    const t0 = Date.now();
    const result = await chatService.chat(cleanMessage, history, userCtx);
    const responseTimeMs = Date.now() - t0;

    // 4. Guardrail post-processing (disclaimer légal si nécessaire)
    const safeReply = postProcessResponse(result.text || 'Désolé, je n\'ai pas pu générer de réponse.');

    // 5. Analytics (fire-and-forget)
    const sessionId = req.id ?? req.ip ?? 'unknown';
    trackAICall({
      userId: req.user!.id,
      sessionId,
      endpoint: 'coach',
      provider: result.provider,
      responseTimeMs,
      blocked: false,
      question: cleanMessage,
      success: result.success,
    }).catch(() => {});

    const messageId = `${req.user!.id}-${Date.now()}`;

    return res.json({
      success: true,
      data: {
        reply: safeReply,
        provider: result.provider,
        messageId,                          // Utilisé par le frontend pour le feedback
        responseTimeMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Analyste de marché (Groq/HuggingFace) ───────────────────────────────────

export async function analyzeMarket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { stock } = req.body as { stock?: Record<string, unknown> };

    if (!stock || typeof stock !== 'object') {
      return res.status(400).json({ success: false, message: 'Les données de l\'action sont requises.' });
    }

    const { symbol } = stock;
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'symbol est requis.' });
    }

    // Charger les données complètes depuis la DB
    const ticker = String(symbol).slice(0, 20);

    const [dbStock, fundamental, annualData, history52w] = await Promise.all([
      prisma.stock.findUnique({
        where: { symbol: ticker },
        select: {
          symbol: true, company_name: true, sector: true, description: true,
          current_price: true, daily_change_percent: true, volume: true, market_cap: true,
        },
      }),
      prisma.stockFundamental.findUnique({
        where: { stock_ticker: ticker },
        select: {
          market_cap: true, pe_ratio: true, pb_ratio: true, dividend_yield: true,
          eps: true, roe: true, roa: true, profit_margin: true,
          revenue: true, net_income: true, book_value: true, year: true,
        },
      }),
      prisma.annualFinancials.findMany({
        where: { stock_ticker: ticker },
        orderBy: { year: 'desc' },
        take: 5,
        select: {
          year: true, revenue: true, net_income: true, revenue_growth: true,
          net_income_growth: true, eps: true, pe_ratio: true, dividend: true,
          roe: true, roa: true, net_margin: true,
        },
      }),
      prisma.stockHistory.findMany({
        where: {
          stock_ticker: ticker,
          date: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        select: { high: true, low: true },
      }),
    ]);

    const week_high = history52w.length > 0 ? Math.max(...history52w.map((h) => h.high)) : undefined;
    const week_low  = history52w.length > 0 ? Math.min(...history52w.map((h) => h.low))  : undefined;

    // market_cap du fundamental est en M FCFA → convertir en FCFA pour cohérence
    const marketCapFCFA = fundamental?.market_cap != null
      ? fundamental.market_cap * 1_000_000
      : dbStock?.market_cap ?? undefined;

    const stockData: StockData = {
      company_name:         String(dbStock?.company_name || stock.company_name || '').slice(0, 100),
      symbol:               ticker,
      sector:               dbStock?.sector ?? undefined,
      description:          dbStock?.description?.slice(0, 500) ?? undefined,
      current_price:        dbStock?.current_price ?? Number(stock.current_price) ?? undefined,
      daily_change_percent: dbStock?.daily_change_percent ?? undefined,
      volume:               dbStock?.volume ?? undefined,
      market_cap:           marketCapFCFA,
      pe_ratio:             fundamental?.pe_ratio ?? undefined,
      roe:                  fundamental?.roe ?? undefined,
      roa:                  fundamental?.roa ?? undefined,
      net_margin:           fundamental?.profit_margin ?? undefined,
      eps:                  fundamental?.eps ?? undefined,
      revenue:              fundamental?.revenue ?? undefined,
      net_income:           fundamental?.net_income ?? undefined,
      dividend_yield:       fundamental?.dividend_yield ?? undefined,
      annual_data:          annualData ?? [],
      week_high,
      week_low,
    };

    const text = await marketAnalysis(stockData);

    return res.json({ success: true, data: { text: text || 'L\'analyse n\'est pas disponible pour le moment.' } });
  } catch (error) {
    next(error);
  }
}

// ─── A. Explication de Concept ────────────────────────────────────────────────

export async function explainConceptHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { concept, userContext } = req.body as { concept?: string; userContext?: UserContext };

    if (!concept || typeof concept !== 'string' || concept.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ concept est requis.' });
    }
    if (concept.length > 200) {
      return res.status(400).json({ success: false, message: 'Le concept est trop long (max 200 caractères).' });
    }

    const text = await explainConcept(concept.trim(), userContext ?? {});

    return res.json({ success: true, data: { text } });
  } catch (error) {
    next(error);
  }
}

// ─── B. Analyse de Portefeuille Simulé ───────────────────────────────────────

export async function analyzePortfolioHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { portfolio, userContext } = req.body as { portfolio?: PortfolioHolding[]; userContext?: UserContext };

    if (!Array.isArray(portfolio) || portfolio.length === 0) {
      return res.status(400).json({ success: false, message: 'Le portefeuille est requis (tableau non vide).' });
    }
    if (portfolio.length > 50) {
      return res.status(400).json({ success: false, message: 'Le portefeuille ne peut pas dépasser 50 lignes.' });
    }

    const text = await analyzePortfolio(portfolio, userContext ?? {});

    return res.json({ success: true, data: { text } });
  } catch (error) {
    next(error);
  }
}

// ─── C. Génération de Quiz ────────────────────────────────────────────────────

export async function generateQuizHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { topic, userContext, previousScore } = req.body as {
      topic?: string;
      userContext?: UserContext;
      previousScore?: number;
    };

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ topic est requis.' });
    }

    const quiz = await generateQuiz(topic.trim(), userContext ?? {}, previousScore ?? 0);

    return res.json({ success: true, data: quiz });
  } catch (error) {
    next(error);
  }
}

// ─── SIMBA Analyste — Chat contextuel BRVM avec tool-calling ──────────────────

export async function coachAnalyst(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { message, conversationHistory, symbol, scoreContext } = req.body as {
      message?: string;
      conversationHistory?: Message[];
      symbol?: string;
      scoreContext?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ message est requis.' });
    }
    if (message.length > 1500) {
      return res.status(400).json({ success: false, message: 'Le message est trop long (max 1500 caractères).' });
    }

    // Guardrail pre-processing
    const preCheck = preProcessMessage(message);
    if (preCheck.blocked) {
      return res.json({
        success: true,
        data: {
          reply: preCheck.fallbackMessage,
          provider: 'guardrail',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-14) : [];
    const cleanMessage = 'processedMessage' in preCheck ? preCheck.processedMessage : message.trim();
    const currentSymbol = typeof symbol === 'string' ? symbol.toUpperCase().trim() : null;

    const systemPrompt = buildAnalystPrompt(currentSymbol ?? '', typeof scoreContext === 'string' ? scoreContext : undefined);

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: cleanMessage },
    ];

    const t0 = Date.now();
    const MAX_ITER = 6;
    let iterations = 0;
    let finalText = '';
    let toolCallsCount = 0;

    try {
      while (iterations < MAX_ITER) {
        iterations++;

        const response = await groq.chat.completions.create({
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          messages,
          tools: ANALYST_TOOLS,
          tool_choice: 'auto',
          max_tokens: 2000,
          temperature: 0.2,
        });

        const choice = response.choices[0];

        // Réponse finale — plus d'outils à appeler
        if (choice.finish_reason === 'stop') {
          finalText = choice.message.content ?? '';
          break;
        }

        // Le modèle appelle des outils
        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
          messages.push(choice.message);
          toolCallsCount += choice.message.tool_calls.length;

          await Promise.all(
            choice.message.tool_calls.map(async (toolCall: any) => {
              const toolName = toolCall.function.name as keyof typeof TOOL_EXECUTORS;
              let toolArgs: any = {};
              try { toolArgs = JSON.parse(toolCall.function.arguments); } catch {}

              log.debug(`[SIMBA-Analyst Tool] ${toolName}(${JSON.stringify(toolArgs)})`);

              let result: any;
              try {
                if (!TOOL_EXECUTORS[toolName]) {
                  result = { error: `Outil "${toolName}" non disponible.` };
                } else {
                  result = await TOOL_EXECUTORS[toolName](toolArgs);
                }
              } catch (err: any) {
                log.error(`[SIMBA-Analyst Tool Error] ${toolName}:`, err?.message);
                result = { error: `Erreur technique sur ${toolName}: ${err?.message}` };
              }

              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              });
            }),
          );
        } else {
          // finish_reason inattendu — on sort
          finalText = choice.message.content ?? '';
          break;
        }
      }
    } catch (err: any) {
      log.error('[SIMBA-Analyst] Groq failed:', err?.message);
      return res.json({
        success: true,
        data: {
          reply: 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.',
          provider: 'fallback',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!finalText) {
      finalText = 'La requête est trop complexe. Reformulez ou posez des questions plus ciblées.';
    }

    const safeReply = postProcessResponse(finalText);
    const responseTimeMs = Date.now() - t0;
    const messageId = `${req.user!.id}-analyst-${Date.now()}`;

    trackAICall({
      userId: req.user!.id,
      sessionId: req.id ?? req.ip ?? 'unknown',
      endpoint: 'analyst',
      provider: 'groq',
      responseTimeMs,
      blocked: false,
      question: cleanMessage,
      success: true,
    }).catch(() => {});

    return res.json({
      success: true,
      data: {
        reply: safeReply,
        provider: 'groq',
        messageId,
        toolCallsCount,
        responseTimeMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── SIMBA Conseiller Portefeuille — Chat avec contexte portfolio ─────────────

interface PortfolioPositionCtx {
  ticker: string;
  companyName?: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortfolioCtx {
  totalValue: number;
  cashBalance: number;
  initialBalance: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  unrealizedGainLoss: number;
  unrealizedPercent: number;
  realizedGainLoss: number;
  realizedPercent: number;
  positions: PortfolioPositionCtx[];
  historyPoints?: { date: string; value: number }[];
}

function buildPortfolioAdvisorPrompt(ctx: PortfolioCtx): string {
  const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  const sign = (n: number) => (n >= 0 ? '+' : '');

  const posTable = ctx.positions.length === 0
    ? 'Aucune position ouverte.'
    : ctx.positions.map(p =>
        `- **${p.ticker}**${p.companyName ? ` (${p.companyName})` : ''} : ${p.quantity} titres · PRU ${fmt(p.avgBuyPrice)} F · Cours ${fmt(p.currentPrice)} F · Valeur ${fmt(p.currentValue)} F · P/L ${sign(p.gainLoss)}${fmt(p.gainLoss)} F (${sign(p.gainLossPercent)}${p.gainLossPercent.toFixed(2)}%)`
      ).join('\n');

  // Résumé historique : tendance sur les 5 derniers points
  let histSummary = 'Non disponible.';
  if (ctx.historyPoints && ctx.historyPoints.length >= 2) {
    const pts = ctx.historyPoints.slice(-5);
    const trend = pts.map(p => `${p.date}: ${fmt(p.value)} F`).join(' → ');
    histSummary = trend;
  }

  return `Tu es SIMBA, le conseiller pédagogique de portefeuille d'Afribourse. Tu es en mode BÊTA.

## TON RÔLE
Analyser le portefeuille simulé de l'utilisateur et donner des avis pédagogiques sur sa gestion.
Tu bases tes analyses UNIQUEMENT sur les données ci-dessous. Tu ne connais pas d'autres données.

## PORTEFEUILLE SIMULÉ (données temps réel)

### Vue d'ensemble
- Capital initial : ${fmt(ctx.initialBalance)} F
- Valeur totale actuelle : ${fmt(ctx.totalValue)} F
- Liquidités disponibles : ${fmt(ctx.cashBalance)} F
- Gain/Perte total : ${sign(ctx.totalGainLoss)}${fmt(ctx.totalGainLoss)} F (${sign(ctx.totalGainLossPercent)}${ctx.totalGainLossPercent.toFixed(2)}%)
  - Plus-value latente (positions ouvertes) : ${sign(ctx.unrealizedGainLoss)}${fmt(ctx.unrealizedGainLoss)} F (${sign(ctx.unrealizedPercent)}${ctx.unrealizedPercent.toFixed(2)}%)
  - Plus-value réalisée (ventes clôturées) : ${sign(ctx.realizedGainLoss)}${fmt(ctx.realizedGainLoss)} F (${sign(ctx.realizedPercent)}${ctx.realizedPercent.toFixed(2)}%)

### Positions ouvertes
${posTable}

### Tendance récente du portefeuille
${histSummary}

## RÈGLES ABSOLUES
1. Baser tes avis UNIQUEMENT sur les données ci-dessus — ne jamais inventer de chiffres
2. Ne jamais recommander d'acheter ou vendre un titre spécifique avec certitude
3. Rester pédagogique : expliquer les concepts (diversification, P/L, risque...) avec des exemples BRVM
4. Être honnête si le portefeuille présente des risques (concentration, perte importante)
5. 150-300 mots max sauf si l'utilisateur demande explicitement plus
6. Terminer par une question ou une action concrète pour l'utilisateur

## TON ET FORMAT
- Français, chaleureux, direct, pédagogique
- 1-2 emojis max par réponse
- Markdown léger (gras pour les chiffres clés, tirets pour les listes)

⚠️ Rappeler discrètement en fin de réponse : "Ceci est une analyse sur portefeuille simulé — pas un conseil en investissement réel."`;
}

export async function portfolioAdvisorIA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { message, conversationHistory, portfolioContext } = req.body as {
      message?: string;
      conversationHistory?: Message[];
      portfolioContext?: PortfolioCtx;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Le champ message est requis.' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ success: false, message: 'Le message est trop long (max 1000 caractères).' });
    }
    if (!portfolioContext || typeof portfolioContext !== 'object') {
      return res.status(400).json({ success: false, message: 'portfolioContext est requis.' });
    }

    // Guardrail
    const preCheck = preProcessMessage(message);
    if (preCheck.blocked) {
      return res.json({ success: true, data: { reply: preCheck.fallbackMessage, provider: 'guardrail' } });
    }

    const cleanMessage = 'processedMessage' in preCheck ? preCheck.processedMessage : message.trim();
    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-8) : [];

    const systemPrompt = buildPortfolioAdvisorPrompt(portfolioContext);
    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: cleanMessage },
    ];

    const t0 = Date.now();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 600,
      temperature: 0.65,
    });
    const rawText = completion.choices[0]?.message?.content ?? '';
    const safeReply = postProcessResponse(rawText || 'Désolé, je n\'ai pas pu analyser ton portefeuille.');
    const responseTimeMs = Date.now() - t0;

    const messageId = `portfolio-advisor-${req.user!.id}-${Date.now()}`;

    trackAICall({
      userId: req.user!.id,
      sessionId: req.id ?? req.ip ?? 'unknown',
      endpoint: 'coach',
      provider: 'groq',
      responseTimeMs,
      blocked: false,
      question: cleanMessage,
      success: true,
    }).catch(() => {});

    return res.json({
      success: true,
      data: { reply: safeReply, provider: 'groq', messageId, responseTimeMs },
    });
  } catch (error) {
    next(error);
  }
}

// ─── Feedback utilisateur (👍 / 👎) ──────────────────────────────────────────

export async function aiFeedbackHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { messageId, rating, endpoint } = req.body as {
      messageId?: string;
      rating?: 'positive' | 'negative';
      endpoint?: string;
    };

    if (!messageId || !rating || !['positive', 'negative'].includes(rating)) {
      return res.status(400).json({ success: false, message: 'messageId et rating (positive|negative) sont requis.' });
    }

    const sessionId = req.id ?? req.ip ?? 'unknown';
    await trackAIFeedback({
      userId: req.user!.id,
      sessionId,
      endpoint: endpoint ?? 'coach',
      messageId,
      rating,
    });

    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ─── Analytics Admin ──────────────────────────────────────────────────────────

export async function aiAnalyticsHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { days } = req.query as { days?: string };
    const since = days
      ? new Date(Date.now() - parseInt(days, 10) * 24 * 60 * 60 * 1000)
      : undefined;

    const summary = await getAISummary(since);
    return res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
}
