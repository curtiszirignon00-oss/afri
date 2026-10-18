/**
 * Modèles IA de SIMBA — source de vérité unique.
 *
 *  - SIMBA Analyste       → modèle de raisonnement (tool-calling BRVM, analyses de titres)
 *  - SIMBA Coach éducatif → tuteur, coach, concepts, quiz, portefeuille
 *
 * Surchargeables via .env sans redéploiement de code.
 */

import Groq from 'groq-sdk';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from 'groq-sdk/resources/chat/completions';
import { log } from '../config/logger';

export const SIMBA_ANALYST_MODEL =
  process.env.SIMBA_ANALYST_MODEL || 'openai/gpt-oss-120b';

export const SIMBA_COACH_MODEL =
  process.env.SIMBA_COACH_MODEL || 'qwen/qwen3.8-27b';

/** Modèle de secours si le modèle analyste est indisponible / déprécié côté Groq */
export const SIMBA_ANALYST_FALLBACK_MODEL =
  process.env.SIMBA_ANALYST_FALLBACK_MODEL || 'qwen/qwen3.8-27b';

/** Modèles de raisonnement qui émettent un bloc <think> si on ne le masque pas (gpt-oss renvoie déjà un contenu propre) */
export function isReasoningModel(model: string): boolean {
  return /deepseek-r1|qwq|qwen3/i.test(model);
}

/**
 * Paramètres spécifiques aux modèles de raisonnement Groq :
 * `reasoning_format: 'hidden'` retire la chaîne de pensée de la réponse
 * (obligatoire avec tool-calling : 'raw' n'y est pas supporté).
 */
export function reasoningParams(model: string): Record<string, unknown> {
  return isReasoningModel(model) ? { reasoning_format: 'hidden' } : {};
}

/**
 * Appel Groq pour SIMBA Analyste : modèle de raisonnement, puis repli
 * automatique sur SIMBA_ANALYST_FALLBACK_MODEL si l'appel échoue
 * (modèle déprécié, indisponible, tool-calling refusé…).
 */
export async function createAnalystCompletion(
  groq: Groq,
  params: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>,
): Promise<ChatCompletion> {
  try {
    return await groq.chat.completions.create({
      ...params,
      model: SIMBA_ANALYST_MODEL,
      ...reasoningParams(SIMBA_ANALYST_MODEL),
    } as ChatCompletionCreateParamsNonStreaming);
  } catch (err: any) {
    if (SIMBA_ANALYST_FALLBACK_MODEL === SIMBA_ANALYST_MODEL) throw err;
    log.warn(`[SIMBA-Analyst] ${SIMBA_ANALYST_MODEL} a échoué (${err?.status ?? '?'} ${err?.message ?? ''}) — repli sur ${SIMBA_ANALYST_FALLBACK_MODEL}`);
    return groq.chat.completions.create({
      ...params,
      model: SIMBA_ANALYST_FALLBACK_MODEL,
      ...reasoningParams(SIMBA_ANALYST_FALLBACK_MODEL),
    } as ChatCompletionCreateParamsNonStreaming);
  }
}

/** Filet de sécurité : retire tout bloc <think>…</think> résiduel */
export function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
}
