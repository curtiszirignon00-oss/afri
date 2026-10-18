/**
 * Streaming SIMBA — réponses affichées mot à mot (Server-Sent Events sur POST).
 *
 * Protocole (une ligne `event:` + une ligne `data:` JSON par message) :
 *   status  { label }                 outil en cours (« Consultation des données de SNTS… »)
 *   delta   { text }                  morceau de réponse à ajouter
 *   reset   {}                        texte déjà affiché à effacer (le modèle a finalement appelé un outil)
 *   done    { messageId, toolCallsCount, error? }
 */

import type { Response } from 'express';
import Groq from 'groq-sdk';
import { log } from '../config/logger';
import { recordAIOutcome } from './aiHealth';
import { reasoningParams } from './models';
import { ANALYST_TOOLS } from './analystTools';
import { TOOL_EXECUTORS } from '../services/brvmDataService';

// ─── Canal SSE ────────────────────────────────────────────────────────────────

export class SimbaSSE {
  private closed = false;

  constructor(private res: Response) {
    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // désactive le buffering des proxys (nginx / Render)
    res.flushHeaders?.();
    res.on('close', () => { this.closed = true; });
  }

  get isClosed(): boolean {
    return this.closed;
  }

  send(event: 'status' | 'delta' | 'reset' | 'done', data: Record<string, unknown>): void {
    if (this.closed) return;
    this.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    // compression() met les réponses en tampon : flush() force l'envoi immédiat
    (this.res as any).flush?.();
  }

  end(): void {
    if (!this.closed) this.res.end();
    this.closed = true;
  }
}

// ─── Ouverture d'un flux avec repli de modèle ─────────────────────────────────

async function openStream(
  groq: Groq,
  params: Record<string, unknown>,
  models: string[],
  source: string,
): Promise<AsyncIterable<any>> {
  let lastErr: unknown;
  for (const model of [...new Set(models)]) {
    try {
      const stream = await groq.chat.completions.create({
        ...params,
        model,
        ...reasoningParams(model),
        stream: true,
      } as any);
      recordAIOutcome(source, true);
      return stream as unknown as AsyncIterable<any>;
    } catch (err: any) {
      recordAIOutcome(`${source} (${model})`, false, err);
      log.warn(`[SIMBA-Stream] ${model} a échoué (${err?.status ?? '?'} ${err?.message ?? ''})`);
      lastErr = err;
    }
  }
  throw lastErr;
}

// ─── Exécution des outils BRVM ────────────────────────────────────────────────

const TOOL_LABELS: Record<string, (a: any) => string> = {
  getStockData: (a) => `Consultation des données de ${a?.symbol ?? 'ce titre'}`,
  getHistoricalPerformance: (a) => `Analyse de la performance de ${a?.symbol ?? 'ce titre'}`,
  compareStocks: (a) => `Comparaison de ${Array.isArray(a?.symbols) ? a.symbols.join(', ') : 'plusieurs titres'}`,
  getSectorBenchmark: (a) => `Comparaison de ${a?.symbol ?? 'ce titre'} à son secteur`,
  getTopPerformers: () => 'Recherche des meilleurs et pires titres BRVM',
};

export function toolStatusLabel(name: string, args: unknown): string {
  return (TOOL_LABELS[name]?.(args) ?? 'Consultation des données BRVM') + '…';
}

export async function executeAnalystTool(name: string, rawArgs: string): Promise<unknown> {
  const toolName = name as keyof typeof TOOL_EXECUTORS;
  let args: any = {};
  try { args = JSON.parse(rawArgs || '{}'); } catch {}
  log.debug(`[SIMBA Tool] ${toolName}(${JSON.stringify(args)})`);
  try {
    if (!TOOL_EXECUTORS[toolName]) return { error: `Outil "${toolName}" non disponible.` };
    return await TOOL_EXECUTORS[toolName](args);
  } catch (err: any) {
    log.error(`[SIMBA Tool Error] ${toolName}:`, err?.message);
    return { error: `Erreur technique sur ${toolName}: ${err?.message}` };
  }
}

// ─── Boucle tool-calling en streaming ─────────────────────────────────────────

export interface StreamResult {
  text: string;
  toolCallsCount: number;
  tokensUsed: number;
}

interface StreamCallbacks {
  onDelta: (text: string) => void;
  onStatus?: (label: string) => void;
  onReset?: () => void;
}

/**
 * Fait dialoguer le modèle avec les outils BRVM ; seule la réponse finale est
 * diffusée mot à mot. `messages` est complété en place (tool calls + résultats).
 */
export async function streamToolLoop(
  groq: Groq,
  messages: any[],
  opts: { models: string[]; maxTokens: number; source: string; temperature?: number },
  cb: StreamCallbacks,
): Promise<StreamResult> {
  const MAX_ITER = 6;
  let toolCallsCount = 0;
  let tokensUsed = 0;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const stream = await openStream(groq, {
      messages,
      tools: ANALYST_TOOLS,
      tool_choice: 'auto',
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.5,
    }, opts.models, opts.source);

    let content = '';
    const calls: { id: string; name: string; args: string }[] = [];

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      const delta = choice?.delta;
      if (delta?.content) {
        content += delta.content;
        cb.onDelta(delta.content);
      }
      for (const tc of delta?.tool_calls ?? []) {
        const slot = (calls[tc.index ?? 0] ??= { id: '', name: '', args: '' });
        if (tc.id) slot.id = tc.id;
        if (tc.function?.name) slot.name += tc.function.name;
        if (tc.function?.arguments) slot.args += tc.function.arguments;
      }
      const usage = chunk.x_groq?.usage ?? chunk.usage;
      if (usage?.total_tokens) tokensUsed += usage.total_tokens;
    }

    const toolCalls = calls.filter((c) => c && c.name);
    if (!toolCalls.length) return { text: content, toolCallsCount, tokensUsed };

    // Le modèle a commencé à écrire puis appelle un outil : on efface ce brouillon
    if (content) cb.onReset?.();

    messages.push({
      role: 'assistant',
      content: content || null,
      tool_calls: toolCalls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.args } })),
    });
    toolCallsCount += toolCalls.length;

    await Promise.all(toolCalls.map(async (c) => {
      let parsed: unknown = {};
      try { parsed = JSON.parse(c.args || '{}'); } catch {}
      cb.onStatus?.(toolStatusLabel(c.name, parsed));
      const result = await executeAnalystTool(c.name, c.args);
      messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(result) });
    }));
  }

  return { text: '', toolCallsCount, tokensUsed };
}

/** Complétion simple (sans outils) diffusée mot à mot. */
export async function streamCompletion(
  groq: Groq,
  messages: any[],
  opts: { models: string[]; maxTokens: number; source: string; temperature?: number },
  onDelta: (text: string) => void,
): Promise<StreamResult> {
  const stream = await openStream(groq, {
    messages,
    max_tokens: opts.maxTokens,
    temperature: opts.temperature ?? 0.6,
  }, opts.models, opts.source);

  let text = '';
  let tokensUsed = 0;
  for await (const chunk of stream) {
    const piece = chunk.choices?.[0]?.delta?.content;
    if (piece) { text += piece; onDelta(piece); }
    const usage = chunk.x_groq?.usage ?? chunk.usage;
    if (usage?.total_tokens) tokensUsed += usage.total_tokens;
  }
  return { text, toolCallsCount: 0, tokensUsed };
}
