import { API_BASE_URL, authFetch } from '../config/api';

// ─── SIMBA — chats en streaming + mémoire des conversations ──────────────────
// Le serveur envoie des événements SSE (status / delta / reset / done) sur une
// requête POST ; l'historique est conservé côté serveur.

export type SimbaKind = 'analyst' | 'portfolio' | 'tutor';

export interface StoredSimbaMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
  messageId?: string;
}

export interface SimbaStreamHandlers {
  onDelta: (text: string) => void;
  onStatus?: (label: string) => void;
  onReset?: () => void;
}

export interface SimbaStreamResult {
  messageId?: string;
  error?: boolean;
  /** Erreur HTTP avant le début du flux (quota, limite, session…) */
  failure?: 'paywall' | 'rate-limit' | 'auth' | 'network' | 'server';
}

const STREAM_PATHS: Record<SimbaKind, string> = {
  analyst: '/ai/analyst/stream',
  portfolio: '/ai/portfolio-advisor/stream',
  tutor: '/ai/tutor/stream',
};

export async function streamSimba(
  kind: SimbaKind,
  body: Record<string, unknown>,
  handlers: SimbaStreamHandlers,
  signal?: AbortSignal,
  /** Route de streaming spécifique (ex. reporting du portefeuille réel). */
  pathOverride?: string,
): Promise<SimbaStreamResult> {
  let response: Response;
  try {
    response = await authFetch(`${API_BASE_URL}${pathOverride ?? STREAM_PATHS[kind]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    return { failure: 'network' };
  }

  if (!response.ok || !response.body) {
    if (response.status === 402) return { failure: 'paywall' };
    if (response.status === 429) return { failure: 'rate-limit' };
    if (response.status === 401) return { failure: 'auth' };
    return { failure: 'server' };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: SimbaStreamResult = {};

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Un événement SSE se termine par une ligne vide
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const raw = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const event = /^event: (.+)$/m.exec(raw)?.[1];
        const dataLine = /^data: (.*)$/m.exec(raw)?.[1];
        if (!event || dataLine == null) continue;
        let data: any = {};
        try { data = JSON.parse(dataLine); } catch { continue; }

        if (event === 'delta' && typeof data.text === 'string') handlers.onDelta(data.text);
        else if (event === 'status' && typeof data.label === 'string') handlers.onStatus?.(data.label);
        else if (event === 'reset') handlers.onReset?.();
        else if (event === 'done') result = { messageId: data.messageId, error: !!data.error };
      }
    }
  } catch {
    if (signal?.aborted) return result;
    return { ...result, failure: result.messageId ? undefined : 'network' };
  }
  return result;
}

export async function fetchSimbaConversation(kind: SimbaKind, key: string): Promise<StoredSimbaMessage[]> {
  try {
    const res = await authFetch(`${API_BASE_URL}/ai/conversations/${kind}?key=${encodeURIComponent(key)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.data?.messages) ? data.data.messages : [];
  } catch {
    return [];
  }
}

export async function clearSimbaConversation(kind: SimbaKind, key: string): Promise<void> {
  try {
    await authFetch(`${API_BASE_URL}/ai/conversations/${kind}?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
  } catch {
    // l'effacement local suffit si le serveur est injoignable
  }
}
