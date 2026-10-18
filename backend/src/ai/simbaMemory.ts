/**
 * Mémoire des conversations SIMBA — une conversation par (utilisateur, assistant, contexte).
 *
 *  - analyst   → context_key = ticker (ex. SNTS)
 *  - portfolio → context_key = SANDBOX | CONCOURS
 *  - tutor     → context_key = titre du module (ou « motivation »)
 *
 * Le serveur est la source de vérité de l'historique : le navigateur n'a plus
 * à le renvoyer, et la conversation survit au rafraîchissement / changement d'appareil.
 */

import { log } from '../config/logger';
import { prisma } from '../config/database';

export type SimbaKind = 'analyst' | 'portfolio' | 'tutor';

export interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;          // ISO
  messageId?: string;  // id utilisé pour le feedback 👍/👎
}

const MAX_STORED = 40;       // messages conservés par conversation
const PROMPT_HISTORY = 12;   // messages réinjectés dans le prompt

export function normalizeKey(key: string): string {
  return key.trim().slice(0, 120) || 'default';
}

export async function loadConversation(userId: string, kind: SimbaKind, key: string): Promise<StoredMessage[]> {
  const row = await prisma.simbaConversation.findUnique({
    where: { userId_kind_context_key: { userId, kind, context_key: normalizeKey(key) } },
  });
  return Array.isArray(row?.messages) ? (row!.messages as unknown as StoredMessage[]) : [];
}

/** Historique à réinjecter dans le prompt (format chat completions). */
export function toPromptHistory(messages: StoredMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages.slice(-PROMPT_HISTORY).map((m) => ({ role: m.role, content: m.content }));
}

/** Ajoute un échange question/réponse. Ne bloque jamais la réponse en cas d'erreur. */
export async function appendExchange(
  userId: string,
  kind: SimbaKind,
  key: string,
  question: string,
  answer: string,
  messageId: string,
): Promise<void> {
  try {
    const context_key = normalizeKey(key);
    const existing = await loadConversation(userId, kind, context_key);
    const now = new Date().toISOString();
    const messages: StoredMessage[] = [
      ...existing,
      { role: 'user' as const, content: question.slice(0, 2000), at: now },
      { role: 'assistant' as const, content: answer.slice(0, 8000), at: now, messageId },
    ].slice(-MAX_STORED);

    await prisma.simbaConversation.upsert({
      where: { userId_kind_context_key: { userId, kind, context_key } },
      create: { userId, kind, context_key, messages: messages as any },
      update: { messages: messages as any },
    });
  } catch (err: any) {
    log.error('[SIMBA-Memory] Sauvegarde impossible :', err?.message);
  }
}

export async function clearConversation(userId: string, kind: SimbaKind, key: string): Promise<void> {
  await prisma.simbaConversation.deleteMany({ where: { userId, kind, context_key: normalizeKey(key) } });
}
