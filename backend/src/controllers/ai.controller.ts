import { log } from '../config/logger';
import { Response, NextFunction } from 'express';
import Groq from 'groq-sdk';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import {
  chatService,
  explainConcept,
  analyzePortfolio,
  generateQuiz,
  Message,
  PortfolioHolding,
} from '../services/ai-coach.service';
import { UserContext, buildAnalystPrompt, TutorUserContext, buildTutorSystemPrompt } from '../ai/systemPrompt';
import { getUserContext } from '../ai/userContext';
import { preProcessMessage, postProcessResponse, stripTutorIntro } from '../ai/guardrails';
import { trackAICall, trackAIFeedback, getAISummary } from '../ai/aiAnalytics.service';
import { getAIHealth } from '../ai/aiHealth';
import { getCachedAnalysis, getOrGenerateAnalysis } from '../services/stock-ai-analysis.service';
import { ANALYST_TOOLS } from '../ai/analystTools';
import { TOOL_EXECUTORS } from '../services/brvmDataService';
import { buildContextBlock } from '../ai/tutorRAG';
import { SIMBA_COACH_MODEL, createAnalystCompletion, trackedCompletion, tokensOf, reasoningParams, stripReasoning } from '../ai/models';
import { loadAdvisorContext, buildPortfolioAdvisorPrompt, AdvisorWalletType } from '../ai/portfolioAdvisor';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

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
    let completion;
    try {
      completion = await trackedCompletion(groq, {
        model: SIMBA_COACH_MODEL,
        messages,
        max_tokens: 700,
        temperature: 0.6,
        ...reasoningParams(SIMBA_COACH_MODEL),
      } as any, 'tutor');
    } catch (err: any) {
      log.error('[TUTOR] Groq failed:', err?.message);
      trackAICall({
        userId: req.user!.id,
        sessionId: String(req.id ?? req.ip ?? 'unknown'),
        endpoint: 'tutor',
        provider: 'fallback',
        responseTimeMs: Date.now() - t0,
        blocked: false,
        question: cleanMessage,
        success: false,
        errorMessage: err?.message,
      }).catch(() => {});
      return res.json({
        success: true,
        data: { reply: 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.', provider: 'fallback' },
      });
    }
    const rawText = stripReasoning(completion.choices[0]?.message?.content ?? '');
    const text = stripTutorIntro(rawText);
    const responseTimeMs = Date.now() - t0;

    trackAICall({
      userId: req.user!.id,
      sessionId: String(req.id ?? req.ip ?? 'unknown'),
      endpoint: 'tutor',
      provider: 'groq',
      responseTimeMs,
      tokensUsed: tokensOf(completion) ?? undefined,
      blocked: false,
      question: cleanMessage,
      success: !!text,
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

    // Modèle de raisonnement : budget de tokens élargi (la réflexion masquée consomme aussi des tokens)
    const completion = await createAnalystCompletion(groq, {
      messages: [
        { role: 'system', content: buildAnalystPrompt(String(symbol).slice(0, 20)) },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
      temperature: 0.5,
    }, 'stock-analysis');
    const text = stripReasoning(completion.choices[0]?.message?.content ?? '');

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
    const sessionId = String(req.id ?? req.ip ?? 'unknown');
    trackAICall({
      userId: req.user!.id,
      sessionId,
      endpoint: 'coach',
      provider: result.provider,
      responseTimeMs,
      tokensUsed: result.tokensUsed,
      blocked: false,
      question: cleanMessage,
      success: result.success,
      errorMessage: result.errorMessage,
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

// ─── Analyste de marché (SIMBA Analyste) — servi depuis le cache ──────────────

function marketTicker(req: AuthenticatedRequest): string | null {
  const symbol = (req.body as { stock?: { symbol?: unknown } })?.stock?.symbol;
  return symbol ? String(symbol).toUpperCase().trim().slice(0, 20) : null;
}

/**
 * Placé AVANT le rate limiter : une analyse en cache (pré-calculée le soir)
 * est servie instantanément et ne consomme ni quota utilisateur ni tokens.
 */
export async function serveCachedMarketAnalysis(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ticker = marketTicker(req);
    if (!ticker) return next();
    const cached = await getCachedAnalysis(ticker);
    if (!cached) return next();
    return res.json({
      success: true,
      data: { text: cached.text, generatedAt: cached.generatedAt, cached: true, dataWarnings: cached.dataWarnings },
    });
  } catch {
    return next(); // en cas d'erreur de lecture du cache, on génère normalement
  }
}

export async function analyzeMarket(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const ticker = marketTicker(req);
    if (!ticker) {
      return res.status(400).json({ success: false, message: 'symbol est requis.' });
    }

    const t0 = Date.now();
    const result = await getOrGenerateAnalysis(ticker);

    trackAICall({
      userId: req.user!.id,
      sessionId: String(req.id ?? req.ip ?? 'unknown'),
      endpoint: 'market-analysis',
      provider: result ? 'groq' : 'fallback',
      responseTimeMs: Date.now() - t0,
      blocked: false,
      question: ticker,
      success: !!result,
    }).catch(() => {});

    if (!result) {
      return res.json({ success: true, data: { text: 'L\'analyse n\'est pas disponible pour le moment.' } });
    }
    return res.json({
      success: true,
      data: { text: result.text, generatedAt: result.generatedAt, cached: result.cached, dataWarnings: result.dataWarnings },
    });
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

// ─── Boucle tool-calling partagée (SIMBA Analyste & Conseiller Portefeuille) ──

/** Fait dialoguer le modèle analyste avec les outils BRVM jusqu'à la réponse finale. */
async function runAnalystToolLoop(
  messages: any[],
  maxTokens: number,
  source: string,
): Promise<{ finalText: string; toolCallsCount: number; tokensUsed: number }> {
  const MAX_ITER = 6;
  let toolCallsCount = 0;
  let tokensUsed = 0;

  for (let iterations = 0; iterations < MAX_ITER; iterations++) {
    const response = await createAnalystCompletion(groq, {
      messages,
      tools: ANALYST_TOOLS,
      tool_choice: 'auto',
      max_tokens: maxTokens,
      temperature: 0.5,
    }, source);
    tokensUsed += tokensOf(response) ?? 0;

    const choice = response.choices[0];

    // Le modèle appelle des outils
    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
      messages.push(choice.message);
      toolCallsCount += choice.message.tool_calls.length;

      await Promise.all(
        choice.message.tool_calls.map(async (toolCall: any) => {
          const toolName = toolCall.function.name as keyof typeof TOOL_EXECUTORS;
          let toolArgs: any = {};
          try { toolArgs = JSON.parse(toolCall.function.arguments); } catch {}

          log.debug(`[SIMBA Tool] ${toolName}(${JSON.stringify(toolArgs)})`);

          let result: any;
          try {
            if (!TOOL_EXECUTORS[toolName]) {
              result = { error: `Outil "${toolName}" non disponible.` };
            } else {
              result = await TOOL_EXECUTORS[toolName](toolArgs);
            }
          } catch (err: any) {
            log.error(`[SIMBA Tool Error] ${toolName}:`, err?.message);
            result = { error: `Erreur technique sur ${toolName}: ${err?.message}` };
          }

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        }),
      );
      continue;
    }

    // Réponse finale (stop) ou finish_reason inattendu — on sort
    return { finalText: stripReasoning(choice.message.content ?? ''), toolCallsCount, tokensUsed };
  }

  return { finalText: '', toolCallsCount, tokensUsed };
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

    const systemPrompt = buildAnalystPrompt(currentSymbol, typeof scoreContext === 'string' ? scoreContext : undefined);

    // any[] requis : la boucle tool-calling ajoute des messages role:'tool' non couverts par Message
    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: cleanMessage },
    ];

    const t0 = Date.now();
    let finalText = '';
    let toolCallsCount = 0;
    let tokensUsed = 0;

    try {
      ({ finalText, toolCallsCount, tokensUsed } = await runAnalystToolLoop(messages, 2000, 'analyst'));
    } catch (err: any) {
      log.error('[SIMBA-Analyst] Groq failed:', err?.message);
      trackAICall({
        userId: req.user!.id,
        sessionId: String(req.id ?? req.ip ?? 'unknown'),
        endpoint: 'analyst',
        provider: 'fallback',
        responseTimeMs: Date.now() - t0,
        blocked: false,
        question: cleanMessage,
        success: false,
        errorMessage: err?.message,
      }).catch(() => {});
      return res.json({
        success: true,
        data: {
          reply: 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.',
          provider: 'fallback',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const answered = !!finalText;
    if (!finalText) {
      finalText = 'La requête est trop complexe. Reformulez ou posez des questions plus ciblées.';
    }

    const safeReply = postProcessResponse(finalText);
    const responseTimeMs = Date.now() - t0;
    const messageId = `${req.user!.id}-analyst-${Date.now()}`;

    trackAICall({
      userId: req.user!.id,
      sessionId: String(req.id ?? req.ip ?? 'unknown'),
      endpoint: 'analyst',
      provider: 'groq',
      responseTimeMs,
      tokensUsed,
      blocked: false,
      question: cleanMessage,
      success: answered,
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

// ─── SIMBA Conseiller Portefeuille — données serveur + profil + outils BRVM ──

export async function portfolioAdvisorIA(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { message, conversationHistory, walletType } = req.body as {
      message?: string;
      conversationHistory?: Message[];
      walletType?: string;
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

    // Contexte rechargé côté serveur depuis l'utilisateur authentifié (plus de confiance au client)
    const wallet: AdvisorWalletType = walletType === 'CONCOURS' ? 'CONCOURS' : 'SANDBOX';
    const advisorCtx = await loadAdvisorContext(req.user!.id, wallet);
    if (!advisorCtx) {
      return res.json({
        success: true,
        data: {
          reply: "Je ne trouve pas encore de portefeuille simulé sur ton compte. Crée-le depuis l'onglet Portefeuille, puis reviens me voir pour un premier diagnostic !",
          provider: 'guardrail',
        },
      });
    }

    const cleanMessage = 'processedMessage' in preCheck ? preCheck.processedMessage : message.trim();
    const history = Array.isArray(conversationHistory) ? conversationHistory.slice(-8) : [];

    const messages: any[] = [
      { role: 'system', content: buildPortfolioAdvisorPrompt(advisorCtx) },
      ...history,
      { role: 'user', content: cleanMessage },
    ];

    const t0 = Date.now();
    let finalText = '';
    let toolCallsCount = 0;
    let tokensUsed = 0;
    try {
      ({ finalText, toolCallsCount, tokensUsed } = await runAnalystToolLoop(messages, 2000, 'portfolio'));
    } catch (err: any) {
      log.error('[SIMBA-Portfolio] Groq failed:', err?.message);
      trackAICall({
        userId: req.user!.id,
        sessionId: String(req.id ?? req.ip ?? 'unknown'),
        endpoint: 'portfolio',
        provider: 'fallback',
        responseTimeMs: Date.now() - t0,
        blocked: false,
        question: cleanMessage,
        success: false,
        errorMessage: err?.message,
      }).catch(() => {});
      return res.json({
        success: true,
        data: {
          reply: 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.',
          provider: 'fallback',
        },
      });
    }

    const safeReply = postProcessResponse(finalText || "Désolé, je n'ai pas pu analyser ton portefeuille. Reformule ta question.");
    const responseTimeMs = Date.now() - t0;
    const messageId = `portfolio-advisor-${req.user!.id}-${Date.now()}`;

    trackAICall({
      userId: req.user!.id,
      sessionId: String(req.id ?? req.ip ?? 'unknown'),
      endpoint: 'portfolio',
      provider: 'groq',
      responseTimeMs,
      tokensUsed,
      blocked: false,
      question: cleanMessage,
      success: !!finalText,
    }).catch(() => {});

    return res.json({
      success: true,
      data: { reply: safeReply, provider: 'groq', messageId, toolCallsCount, responseTimeMs },
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

    const sessionId = String(req.id ?? req.ip ?? 'unknown');
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
    // health : fenêtre glissante 1 h en mémoire de l'instance (pannes en cours, dernières erreurs)
    return res.json({ success: true, data: { ...summary, health: getAIHealth() } });
  } catch (error) {
    next(error);
  }
}
