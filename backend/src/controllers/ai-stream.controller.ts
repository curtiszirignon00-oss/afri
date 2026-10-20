/**
 * Chats SIMBA en streaming + mémoire des conversations.
 *
 *   POST /ai/analyst/stream            { message, symbol, scoreContext? }
 *   POST /ai/portfolio-advisor/stream  { message, walletType }
 *   POST /ai/tutor/stream              { message, userContext }
 *   GET  /ai/conversations/:kind?key=  → historique stocké
 *   DELETE /ai/conversations/:kind?key=
 *
 * L'historique n'est plus envoyé par le navigateur : il est relu en base
 * (simbaMemory) puis complété après chaque réponse.
 */

import { Response, NextFunction } from 'express';
import Groq from 'groq-sdk';
import { log } from '../config/logger';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { buildAnalystPrompt, buildTutorSystemPrompt, TutorUserContext } from '../ai/systemPrompt';
import { preProcessMessage, postProcessResponse, stripTutorIntro } from '../ai/guardrails';
import { trackAICall } from '../ai/aiAnalytics.service';
import { buildContextBlock } from '../ai/tutorRAG';
import {
  SIMBA_ANALYST_MODEL, SIMBA_ANALYST_FALLBACK_MODEL,
  SIMBA_COACH_MODEL, SIMBA_COACH_FALLBACK_MODEL, stripReasoning,
} from '../ai/models';
import { SimbaSSE, StreamResult, streamToolLoop, streamCompletion } from '../ai/simbaStream';
import {
  SimbaKind, loadConversation, toPromptHistory, appendExchange, clearConversation, normalizeKey,
} from '../ai/simbaMemory';
import { loadAdvisorContext, buildPortfolioAdvisorPrompt, buildAnalystUserBlock, AdvisorWalletType } from '../ai/portfolioAdvisor';
import { buildLearnerBlock } from '../ai/learnerContext';
import { buildRealPortfolioReportPrompt } from '../ai/realPortfolioReporter';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });

const UNAVAILABLE = 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.';
const KINDS: SimbaKind[] = ['analyst', 'portfolio', 'tutor'];

// ─── Socle commun ─────────────────────────────────────────────────────────────

interface StreamedChatOptions {
  kind: SimbaKind;
  contextKey: string;
  maxLength: number;
  /** Construit les messages à partir de la question nettoyée et de l'historique stocké. null = réponse directe */
  buildMessages: (question: string, history: { role: 'user' | 'assistant'; content: string }[]) =>
    Promise<{ messages: any[] } | { directReply: string }>;
  /** Lance le modèle ; `emit` diffuse le texte, `status` / `reset` sont optionnels */
  run: (messages: any[], emit: (t: string) => void, status: (l: string) => void, reset: () => void, shouldStop: () => boolean) => Promise<StreamResult>;
  /** Retient les N premiers caractères pour nettoyer l'intro (« Bonjour, je suis SIMBA… ») */
  introFilter?: (text: string) => string;
}

async function handleStreamedChat(req: AuthenticatedRequest, res: Response, next: NextFunction, opts: StreamedChatOptions) {
  const { message } = req.body as { message?: unknown };
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Le champ message est requis.' });
  }
  if (message.length > opts.maxLength) {
    return res.status(400).json({ success: false, message: `Le message est trop long (max ${opts.maxLength} caractères).` });
  }

  const userId = req.user!.id;
  const sessionId = String(req.id ?? req.ip ?? 'unknown');
  const messageId = `${userId}-${opts.kind}-${Date.now()}`;
  const t0 = Date.now();

  let sse: SimbaSSE | null = null;
  try {
    const preCheck = preProcessMessage(message);
    const question = 'processedMessage' in preCheck ? preCheck.processedMessage : message.trim();

    sse = new SimbaSSE(res);

    if (preCheck.blocked) {
      sse.send('delta', { text: preCheck.fallbackMessage });
      sse.send('done', { messageId, toolCallsCount: 0 });
      return sse.end();
    }

    const stored = await loadConversation(userId, opts.kind, opts.contextKey);
    const built = await opts.buildMessages(question, toPromptHistory(stored));

    if ('directReply' in built) {
      sse.send('delta', { text: built.directReply });
      sse.send('done', { messageId, toolCallsCount: 0 });
      return sse.end();
    }

    // Filtre d'intro : on retient le début de la réponse, on le nettoie, puis on passe en direct
    let held = '';
    let passthrough = !opts.introFilter;
    let emitted = '';
    const emit = (piece: string) => {
      if (passthrough) { emitted += piece; sse!.send('delta', { text: piece }); return; }
      held += piece;
      if (held.length >= 160) flushHeld();
    };
    const flushHeld = () => {
      if (passthrough) return;
      passthrough = true;
      const cleaned = opts.introFilter ? opts.introFilter(held) : held;
      held = '';
      if (cleaned) { emitted += cleaned; sse!.send('delta', { text: cleaned }); }
    };
    const status = (label: string) => sse!.send('status', { label });
    const reset = () => { emitted = ''; held = ''; sse!.send('reset', {}); };

    let result: StreamResult;
    try {
      result = await opts.run(built.messages, emit, status, reset, () => sse!.isClosed);
      flushHeld();
    } catch (err: any) {
      log.error(`[SIMBA-Stream:${opts.kind}] échec :`, err?.message);
      trackAICall({
        userId, sessionId, endpoint: opts.kind, provider: 'fallback',
        responseTimeMs: Date.now() - t0, blocked: false, question, success: false,
        errorMessage: err?.message,
      }).catch(() => {});
      if (!emitted) sse.send('delta', { text: UNAVAILABLE });
      sse.send('done', { messageId, toolCallsCount: 0, error: true });
      return sse.end();
    }

    // Client parti en cours de réponse : rien n'est mémorisé (il ne l'a pas vue en entier)
    if (result.aborted) {
      trackAICall({
        userId, sessionId, endpoint: opts.kind, provider: 'aborted',
        responseTimeMs: Date.now() - t0, tokensUsed: result.tokensUsed || undefined,
        blocked: false, question, success: true,
      }).catch(() => {});
      return sse.end();
    }

    let finalText = stripReasoning(emitted);
    const answered = !!finalText;
    if (!answered) {
      finalText = 'La requête est trop complexe. Reformulez ou posez une question plus ciblée.';
      sse.send('delta', { text: finalText });
    }
    // Disclaimer légal éventuel : ajouté en fin de flux
    const safe = postProcessResponse(finalText);
    if (safe.length > finalText.length && safe.startsWith(finalText)) {
      sse.send('delta', { text: safe.slice(finalText.length) });
    }

    sse.send('done', { messageId, toolCallsCount: result.toolCallsCount });
    sse.end();

    // Seuls les échanges réellement aboutis entrent dans la mémoire : une question restée
    // sans vraie réponse pousserait le modèle à y répondre au tour suivant.
    if (answered) await appendExchange(userId, opts.kind, opts.contextKey, question, safe, messageId);
    trackAICall({
      userId, sessionId, endpoint: opts.kind, provider: 'groq',
      responseTimeMs: Date.now() - t0, tokensUsed: result.tokensUsed || undefined,
      blocked: false, question, success: answered,
    }).catch(() => {});
  } catch (error) {
    if (sse) {
      log.error(`[SIMBA-Stream:${opts.kind}] erreur :`, (error as any)?.message);
      sse.send('delta', { text: UNAVAILABLE });
      sse.send('done', { messageId, toolCallsCount: 0, error: true });
      return sse.end();
    }
    next(error);
  }
}

// ─── SIMBA Analyste ───────────────────────────────────────────────────────────

export function streamAnalyst(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { symbol, scoreContext, walletType } = req.body as { symbol?: unknown; scoreContext?: unknown; walletType?: unknown };
  const ticker = typeof symbol === 'string' && symbol.trim() ? symbol.toUpperCase().trim().slice(0, 20) : null;
  // Portefeuille affiché à l'écran : SIMBA distingue la détention dans celui-ci et dans l'autre
  const currentWallet: AdvisorWalletType = walletType === 'CONCOURS' ? 'CONCOURS' : 'SANDBOX';

  return handleStreamedChat(req, res, next, {
    kind: 'analyst',
    contextKey: ticker ?? 'general',
    maxLength: 1500,
    buildMessages: async (question, history) => {
      const userBlock = ticker
        ? await buildAnalystUserBlock(req.user!.id, ticker, currentWallet).catch((err) => {
            log.error('[SIMBA-Analyst] situation portefeuille illisible :', err?.message);
            return `## SITUATION DE L'UTILISATEUR SUR ${ticker}\n- Données de portefeuille temporairement indisponibles : si l'utilisateur demande ce qu'il détient, réponds que tu ne peux pas le vérifier pour le moment.`;
          })
        : null;
      const system = buildAnalystPrompt(ticker, typeof scoreContext === 'string' ? scoreContext : undefined, userBlock);
      return { messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: question }] };
    },
    run: (messages, emit, status, reset, shouldStop) => streamToolLoop(groq, messages, {
      models: [SIMBA_ANALYST_MODEL, SIMBA_ANALYST_FALLBACK_MODEL], maxTokens: 2000, source: 'analyst', shouldStop,
    }, { onDelta: emit, onStatus: status, onReset: reset }),
  });
}

// ─── SIMBA Conseiller Portefeuille ────────────────────────────────────────────

export function streamPortfolio(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const wallet: AdvisorWalletType = (req.body as { walletType?: unknown })?.walletType === 'CONCOURS' ? 'CONCOURS' : 'SANDBOX';

  return handleStreamedChat(req, res, next, {
    kind: 'portfolio',
    contextKey: wallet,
    maxLength: 1000,
    buildMessages: async (question, history) => {
      const ctx = await loadAdvisorContext(req.user!.id, wallet);
      if (!ctx) {
        return { directReply: "Je ne trouve pas encore de portefeuille simulé sur ton compte. Crée-le depuis l'onglet Portefeuille, puis reviens me voir pour un premier diagnostic !" };
      }
      return { messages: [{ role: 'system', content: buildPortfolioAdvisorPrompt(ctx) }, ...history, { role: 'user', content: question }] };
    },
    run: (messages, emit, status, reset, shouldStop) => streamToolLoop(groq, messages, {
      models: [SIMBA_ANALYST_MODEL, SIMBA_ANALYST_FALLBACK_MODEL], maxTokens: 2000, source: 'portfolio', shouldStop,
    }, { onDelta: emit, onStatus: status, onReset: reset }),
  });
}

// ─── SIMBA Reporting — portefeuille réel importé ──────────────────────────────
// Mémoire séparée (clé REAL), prompt de reporting factuel (CREPMG), pas d'outils.

export function streamRealPortfolio(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return handleStreamedChat(req, res, next, {
    kind: 'portfolio',
    contextKey: 'REAL',
    maxLength: 1000,
    buildMessages: async (question, history) => {
      const system = await buildRealPortfolioReportPrompt(req.user!.id);
      if (!system) {
        return { directReply: "Tu n'as pas encore importé de portefeuille réel. Importe tes lignes depuis l'espace Portefeuille réel pour obtenir un reporting chiffré." };
      }
      return { messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: question }] };
    },
    run: (messages, emit, _status, _reset, shouldStop) => streamCompletion(groq, messages, {
      models: [SIMBA_ANALYST_MODEL, SIMBA_ANALYST_FALLBACK_MODEL], maxTokens: 1500, source: 'real-portfolio', temperature: 0.2, shouldStop,
    }, emit),
  });
}

// ─── SIMBA Tuteur ─────────────────────────────────────────────────────────────

export function streamTutor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const raw = (req.body as { userContext?: unknown })?.userContext;
  const ctx: TutorUserContext = typeof raw === 'object' && raw !== null ? raw as TutorUserContext : {};
  const contextKey = ctx.motivationMode ? 'motivation' : (ctx.currentModule ?? 'general');

  return handleStreamedChat(req, res, next, {
    kind: 'tutor',
    contextKey,
    maxLength: 1000,
    buildMessages: async (question, history) => {
      const contextBlock = buildContextBlock(question);
      const learnerBlock = await buildLearnerBlock(req.user!.id, ctx.currentModule).catch(() => null);
      const system = buildTutorSystemPrompt(ctx, contextBlock, learnerBlock);
      return { messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: question }] };
    },
    run: (messages, emit, _status, _reset, shouldStop) => streamCompletion(groq, messages, {
      models: [SIMBA_COACH_MODEL, SIMBA_COACH_FALLBACK_MODEL], maxTokens: 700, source: 'tutor', temperature: 0.6, shouldStop,
    }, emit),
    introFilter: stripTutorIntro,
  });
}

// ─── Mémoire : lecture / effacement ───────────────────────────────────────────

function parseConversationParams(req: AuthenticatedRequest): { kind: SimbaKind; key: string } | null {
  const kind = req.params.kind as SimbaKind;
  const key = typeof req.query.key === 'string' ? req.query.key : '';
  if (!KINDS.includes(kind) || !key) return null;
  return { kind, key: kind === 'analyst' || kind === 'portfolio' ? key.toUpperCase() : key };
}

export async function getConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = parseConversationParams(req);
    if (!params) return res.status(400).json({ success: false, message: 'kind et key sont requis.' });
    const messages = await loadConversation(req.user!.id, params.kind, params.key);
    return res.json({ success: true, data: { key: normalizeKey(params.key), messages } });
  } catch (error) {
    next(error);
  }
}

export async function deleteConversation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = parseConversationParams(req);
    if (!params) return res.status(400).json({ success: false, message: 'kind et key sont requis.' });
    await clearConversation(req.user!.id, params.kind, params.key);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
}
