import { log } from '../config/logger';
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
    } catch (groqError: any) {
      log.error('[SIMBA] Groq failed — status:', groqError?.status, '— message:', groqError?.message, '— error:', JSON.stringify(groqError?.error ?? {}));
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

    // Formater les montants en millions de FCFA
    const fmtM = (v?: number | null) => v != null
      ? (v >= 1000 ? `${(v / 1000).toFixed(0)} Mds` : `${v.toFixed(0)} M`) + ' FCFA'
      : 'N/D';

    // Historique annuel (3 dernières années)
    const annualLines = (stock.annual_data ?? []).slice(0, 3).map((a) => {
      const parts = [`${a.year}`];
      if (a.revenue != null)      parts.push(`CA=${fmtM(a.revenue)}`);
      if (a.net_income != null)   parts.push(`RN=${fmtM(a.net_income)}`);
      if (a.revenue_growth != null) parts.push(`∆CA=${a.revenue_growth > 0 ? '+' : ''}${a.revenue_growth.toFixed(1)}%`);
      if (a.roe != null)          parts.push(`ROE=${a.roe.toFixed(1)}%`);
      if (a.eps != null)          parts.push(`BPA=${a.eps.toFixed(0)} FCFA`);
      if (a.dividend != null)     parts.push(`Div=${a.dividend.toFixed(0)} FCFA`);
      return parts.join(' | ');
    }).join('\n  ');

    const prompt = `Analyse l'action suivante cotée sur la BRVM :

FICHE ACTION :
- Société : ${stock.company_name} (${stock.symbol})
- Secteur : ${stock.sector ?? 'N/D'}
- Description : ${stock.description ? stock.description.slice(0, 300) : 'N/D'}

DONNÉES DE MARCHÉ :
- Prix actuel : ${stock.current_price ?? 'N/D'} FCFA
- Variation journalière : ${stock.daily_change_percent?.toFixed(2) ?? 'N/D'}%
- Volume : ${stock.volume ? stock.volume.toLocaleString('fr-FR') : 'N/D'}
- Capitalisation boursière : ${capStr}
- Plus haut 52 semaines : ${stock.week_high ?? 'N/D'} FCFA
- Plus bas 52 semaines : ${stock.week_low ?? 'N/D'} FCFA

FONDAMENTAUX (dernière année disponible) :
- Chiffre d'affaires : ${fmtM(stock.revenue)}
- Résultat net : ${fmtM(stock.net_income)}
- BPA (BNPA) : ${stock.eps != null ? stock.eps.toFixed(2) + ' FCFA' : 'N/D'}
- PER : ${stock.pe_ratio != null ? stock.pe_ratio.toFixed(2) : 'N/D'}
- ROE : ${stock.roe != null ? stock.roe.toFixed(2) + '%' : 'N/D'}
- ROA : ${stock.roa != null ? stock.roa.toFixed(2) + '%' : 'N/D'}
- Marge nette : ${stock.net_margin != null ? stock.net_margin.toFixed(2) + '%' : 'N/D'}
- Rendement dividende : ${stock.dividend_yield != null ? stock.dividend_yield.toFixed(2) + '%' : 'N/D'}

HISTORIQUE FINANCIER (3 ans) :
  ${annualLines || 'Non disponible'}

Fournis une analyse structurée en 4 points :
1. **Tendance de marché** : lecture du prix actuel vs 52 semaines et la variation journalière.
2. **Santé financière** : commentaire sur les revenus, la rentabilité (ROE/marge) et l'évolution sur 3 ans.
3. **Point de vigilance** : un risque concret identifié à partir des données ci-dessus.
4. **Indicateur clé** : l'indicateur le plus pertinent à surveiller pour cette action et pourquoi.`;

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
  market_cap?: number;  // en FCFA brut
  volume?: number;
  week_high?: number;
  week_low?: number;
  pe_ratio?: number;
  roe?: number;
  roa?: number;
  net_margin?: number;
  eps?: number;
  revenue?: number;       // en millions FCFA
  net_income?: number;    // en millions FCFA
  dividend_yield?: number;
  annual_data?: Array<{
    year: number;
    revenue?: number | null;
    net_income?: number | null;
    revenue_growth?: number | null;
    net_income_growth?: number | null;
    eps?: number | null;
    pe_ratio?: number | null;
    dividend?: number | null;
    roe?: number | null;
    roa?: number | null;
    net_margin?: number | null;
  }>;
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
