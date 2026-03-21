/**
 * AfribourseChatService — Service IA centralisé (SIMBA)
 * Provider principal : Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant)
 * Fallback         : HuggingFace Inference API (si plan Pro actif)
 */

import Groq from 'groq-sdk';
import {
  buildSystemPrompt,
  UserContext,
  EDUCATIONAL_PROMPT,
  PORTFOLIO_ANALYSIS_PROMPT,
  QUIZ_GENERATION_PROMPT,
  PortfolioHolding,
  QuizQuestion,
} from '../ai/systemPrompt';
import { buildContextualPrompt, retrieveStockContext } from '../ai/ragService';

export type { UserContext, PortfolioHolding, QuizQuestion };

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  text: string;
  provider: 'groq' | 'fallback';
  success: boolean;
}

export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
  forceModel?: string;         // forcer un modèle Groq spécifique
  jsonMode?: boolean;          // activer response_format json_object (Groq)
  skipRag?: boolean;           // désactiver l'enrichissement RAG (quiz, portfolio…)
}

class AfribourseChatService {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
  }

  // ─── Routing de modèle ──────────────────────────────────────────────────────

  private selectModel(userMessage: string): string {
    if (userMessage.length < 100) {
      return process.env.GROQ_MODEL_FAST || 'llama-3.1-8b-instant';
    }
    return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  // ─── Appel Groq ─────────────────────────────────────────────────────────────

  private async callGroq(messages: Message[], options: ChatOptions = {}): Promise<string> {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const model = options.forceModel ?? this.selectModel(lastUser?.content ?? '');

    const params: any = {
      model,
      messages,
      max_tokens: options.maxTokens ?? 600,
      temperature: options.temperature ?? 0.7,
      stream: false,
    };

    if (options.jsonMode) {
      params.response_format = { type: 'json_object' };
    }

    const completion = await this.groq.chat.completions.create(params);
    return completion.choices[0]?.message?.content ?? '';
  }

  // ─── Méthode principale avec RAG ────────────────────────────────────────────

  async chat(
    userMessage: string,
    conversationHistory: Message[] = [],
    userContext: UserContext = {},
    options: ChatOptions = {},
  ): Promise<ChatResult> {
    const systemPrompt = buildSystemPrompt(userContext);

    // Enrichissement RAG : injecte les données BRVM pertinentes dans le message
    const augmentedMessage = options.skipRag
      ? userMessage
      : await buildContextualPrompt(userMessage);

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: augmentedMessage },
    ];

    try {
      const text = await this.callGroq(messages, options);
      return { text, provider: 'groq', success: true };
    } catch (groqError) {
      console.error('[SIMBA] Groq failed:', (groqError as Error).message);
      return {
        text: 'Je suis temporairement indisponible. Veuillez réessayer dans quelques instants.',
        provider: 'fallback',
        success: false,
      };
    }
  }

  // ─── A. Explication de Concept Éducatif ─────────────────────────────────────

  async explainConcept(
    concept: string,
    userContext: UserContext = {},
  ): Promise<ChatResult> {
    return this.chat(
      EDUCATIONAL_PROMPT(concept, userContext.user_level),
      [],
      userContext,
      { maxTokens: 400 },
    );
  }

  // ─── B. Analyse de Portefeuille Simulé ──────────────────────────────────────

  async analyzePortfolio(
    portfolio: PortfolioHolding[],
    userContext: UserContext = {},
  ): Promise<ChatResult> {
    return this.chat(
      PORTFOLIO_ANALYSIS_PROMPT(portfolio),
      [],
      userContext,
      { maxTokens: 500, forceModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile' },
    );
  }

  // ─── C. Génération de Quiz ───────────────────────────────────────────────────

  async generateQuiz(
    topic: string,
    userContext: UserContext = {},
    previousScore = 0,
  ): Promise<QuizQuestion> {
    const result = await this.chat(
      QUIZ_GENERATION_PROMPT(topic, userContext.user_level, previousScore),
      [],
      userContext,
      {
        maxTokens: 400,
        temperature: 0.5,
        jsonMode: true,
        forceModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      },
    );
    return JSON.parse(result.text) as QuizQuestion;
  }

  // ─── Analyse de Marché (avec enrichissement RAG DB) ─────────────────────────

  async analyzeMarket(stock: StockData): Promise<ChatResult> {
    const capStr = stock.market_cap
      ? `${(stock.market_cap / 1_000_000_000).toFixed(2)} Mds FCFA`
      : 'N/D';

    // Enrichissement RAG : fondamentaux complets depuis la DB pour ce ticker
    const ragDocs = await retrieveStockContext(stock.symbol);
    const ragContext = ragDocs.length > 0
      ? `\nDONNÉES DB AFRIBOURSE :\n${ragDocs.map((d) => d.content).join('\n')}\n`
      : '';

    const prompt = `${ragContext}Analyse l'action suivante :
- Société : ${stock.company_name} (${stock.symbol})
- Secteur : ${stock.sector ?? 'N/D'}
- Prix actuel : ${stock.current_price ?? 'N/D'} FCFA
- Variation journalière : ${stock.daily_change_percent?.toFixed(2) ?? 'N/D'}%
- Capitalisation : ${capStr}
- Volume : ${stock.volume ? stock.volume.toLocaleString('fr-FR') : 'N/D'}
- Plus haut 52 sem. : ${stock.week_high ?? 'N/D'} FCFA
- Plus bas 52 sem. : ${stock.week_low ?? 'N/D'} FCFA
- PER : ${stock.pe_ratio ?? 'N/D'}
- Description : ${stock.description ? stock.description.slice(0, 400) : 'N/D'}

Fournis :
1. **Tendance** : lecture de la variation et du prix par rapport aux 52 semaines.
2. **Secteur** : dynamique du secteur sur le marché ouest-africain.
3. **Point de vigilance** : un risque concret à surveiller.
4. **Concept clé** : un indicateur ou concept boursier pertinent à approfondir.`;

    return this.chat(prompt, [], {}, {
      maxTokens: 500,
      forceModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      skipRag: true, // RAG déjà injecté manuellement ci-dessus
    });
  }
}

// ─── Types publics ────────────────────────────────────────────────────────────

export interface StockData {
  company_name: string;
  symbol: string;
  sector?: string;
  current_price?: number;
  daily_change_percent?: number;
  market_cap?: number;
  volume?: number;
  week_high?: number;
  week_low?: number;
  pe_ratio?: number;
  description?: string;
}

// ─── Singleton exporté ────────────────────────────────────────────────────────

export const chatService = new AfribourseChatService();

// Exports nommés pour rétrocompatibilité avec le controller
export const coachResponse = (
  question: string,
  userCtx: UserContext = {},
  lessonContext?: string,
) => {
  const history: Message[] = lessonContext
    ? [{ role: 'assistant', content: `Contexte de la leçon : ${lessonContext}` }]
    : [];
  return chatService.chat(question, history, userCtx, { maxTokens: 400 });
};

export const explainConcept = (concept: string, userCtx: UserContext = {}) =>
  chatService.explainConcept(concept, userCtx).then((r) => r.text);

export const analyzePortfolio = (portfolio: PortfolioHolding[], userCtx: UserContext = {}) =>
  chatService.analyzePortfolio(portfolio, userCtx).then((r) => r.text);

export const generateQuiz = (topic: string, userCtx: UserContext = {}, previousScore = 0) =>
  chatService.generateQuiz(topic, userCtx, previousScore);

export const marketAnalysis = (stock: StockData) =>
  chatService.analyzeMarket(stock).then((r) => r.text);
