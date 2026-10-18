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
import { recordAIOutcome } from './aiHealth';

export const SIMBA_ANALYST_MODEL =
  process.env.SIMBA_ANALYST_MODEL || 'openai/gpt-oss-120b';

export const SIMBA_COACH_MODEL =
  process.env.SIMBA_COACH_MODEL || 'qwen/qwen3.8-27b';

/** Modèle de secours du Coach (tuteur) si le modèle principal est indisponible */
export const SIMBA_COACH_FALLBACK_MODEL =
  process.env.SIMBA_COACH_FALLBACK_MODEL || 'openai/gpt-oss-20b';

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
  source = 'analyst',
): Promise<ChatCompletion> {
  try {
    const completion = await groq.chat.completions.create({
      ...params,
      model: SIMBA_ANALYST_MODEL,
      ...reasoningParams(SIMBA_ANALYST_MODEL),
    } as ChatCompletionCreateParamsNonStreaming);
    recordAIOutcome(source, true);
    return completion;
  } catch (err: any) {
    // Échec du modèle principal compté même si le repli réussit : un modèle retiré doit alerter
    recordAIOutcome(`${source} (${SIMBA_ANALYST_MODEL})`, false, err);
    if (SIMBA_ANALYST_FALLBACK_MODEL === SIMBA_ANALYST_MODEL) throw err;
    log.warn(`[SIMBA-Analyst] ${SIMBA_ANALYST_MODEL} a échoué (${err?.status ?? '?'} ${err?.message ?? ''}) — repli sur ${SIMBA_ANALYST_FALLBACK_MODEL}`);
    return trackedCompletion(groq, {
      ...params,
      model: SIMBA_ANALYST_FALLBACK_MODEL,
      ...reasoningParams(SIMBA_ANALYST_FALLBACK_MODEL),
    } as ChatCompletionCreateParamsNonStreaming, `${source} (repli)`);
  }
}

/**
 * Appel Groq instrumenté : enregistre succès / échec pour la surveillance
 * (alerte email admin en cas de panne, cf. aiHealth.ts). Relance l'erreur.
 */
export async function trackedCompletion(
  groq: Groq,
  params: ChatCompletionCreateParamsNonStreaming,
  source: string,
): Promise<ChatCompletion> {
  try {
    const completion = await groq.chat.completions.create(params);
    recordAIOutcome(source, true);
    return completion;
  } catch (err) {
    recordAIOutcome(source, false, err);
    throw err;
  }
}

/** Tokens consommés par un appel (null si non renvoyé par le provider). */
export function tokensOf(completion: ChatCompletion | null | undefined): number | null {
  return completion?.usage?.total_tokens ?? null;
}

/** Filet de sécurité : retire tout bloc <think>…</think> résiduel */
export function stripReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?(<\/think>|$)/gi, '').trim();
}
