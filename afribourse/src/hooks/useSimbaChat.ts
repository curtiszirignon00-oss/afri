import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SimbaKind,
  streamSimba,
  fetchSimbaConversation,
  clearSimbaConversation,
} from '../services/simbaChat';
import { sendAnalystFeedback } from '../services/geminiService';

export interface SimbaUIMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  messageId?: string;
  rating?: 'up' | 'down';
  paywallHit?: boolean;
  streaming?: boolean;
}

interface UseSimbaChatOptions {
  kind: SimbaKind;
  /** Conversation distincte par contexte : ticker, type de portefeuille, module… */
  contextKey: string;
  welcome: string;
  /** Charge l'historique seulement quand le chat est visible */
  enabled: boolean;
  /** Corps de requête additionnel (symbol, walletType, userContext…) */
  extraBody?: Record<string, unknown>;
  feedbackEndpoint: 'analyst' | 'tutor' | 'portfolio';
  /** Route de streaming spécifique (par défaut : celle du `kind`). */
  streamPath?: string;
}

const FAILURE_TEXT = {
  'rate-limit': "⚠️ Limite d'appels IA atteinte. Réessaie dans une heure.",
  auth: '⚠️ Tu dois être connecté pour utiliser SIMBA.',
  network: 'Une erreur est survenue. Vérifie ta connexion ou réessaie plus tard.',
  server: '⚠️ Une erreur est survenue. Réessaie plus tard.',
} as const;

const welcomeMessage = (text: string): SimbaUIMessage => ({ id: 'welcome', role: 'assistant', text, timestamp: Date.now() });

export function useSimbaChat({ kind, contextKey, welcome, enabled, extraBody, feedbackEndpoint, streamPath }: UseSimbaChatOptions) {
  const [messages, setMessages] = useState<SimbaUIMessage[]>([welcomeMessage(welcome)]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [paywallHit, setPaywallHit] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const extraBodyRef = useRef(extraBody);
  extraBodyRef.current = extraBody;

  // Texte reçu en attente d'affichage : regroupé par frame pour éviter un rendu par morceau
  const pendingRef = useRef('');
  const frameRef = useRef<number | null>(null);

  const patchLast = useCallback((fn: (m: SimbaUIMessage) => SimbaUIMessage) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      return [...prev.slice(0, -1), fn(last)];
    });
  }, []);

  const flushPending = useCallback(() => {
    frameRef.current = null;
    const chunk = pendingRef.current;
    if (!chunk) return;
    pendingRef.current = '';
    patchLast((m) => ({ ...m, text: m.text + chunk }));
  }, [patchLast]);

  // (Re)chargement de l'historique quand le contexte change ou que le chat s'ouvre
  useEffect(() => {
    abortRef.current?.abort();
    setMessages([welcomeMessage(welcome)]);
    setPaywallHit(false);
    setStatus(null);
    setIsStreaming(false);
    setHistoryLoaded(false);
  }, [kind, contextKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled || historyLoaded) return;
    let cancelled = false;
    fetchSimbaConversation(kind, contextKey).then((stored) => {
      if (cancelled) return;
      setHistoryLoaded(true);
      if (!stored.length) return;
      const history: SimbaUIMessage[] = stored.map((m, i) => ({
        id: `h-${i}-${m.at}`,
        role: m.role,
        text: m.content,
        timestamp: new Date(m.at).getTime(),
        messageId: m.messageId,
      }));
      // Une question peut être partie avant la fin du chargement (question initiale) : on la garde après l'historique
      setMessages((prev) => [prev[0] ?? welcomeMessage(welcome), ...history, ...prev.filter((m) => m.id !== 'welcome')]);
    });
    return () => { cancelled = true; };
  }, [enabled, historyLoaded, kind, contextKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    abortRef.current?.abort();
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
  }, []);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message || isStreaming) return;

    const now = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: `u-${now}`, role: 'user', text: message, timestamp: now },
      { id: `a-${now}`, role: 'assistant', text: '', timestamp: now, streaming: true },
    ]);
    setIsStreaming(true);
    setStatus(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const result = await streamSimba(kind, { message, ...extraBodyRef.current }, {
      onDelta: (piece) => {
        setStatus(null);
        pendingRef.current += piece;
        if (frameRef.current == null) frameRef.current = requestAnimationFrame(flushPending);
      },
      onStatus: (label) => setStatus(label),
      onReset: () => {
        pendingRef.current = '';
        patchLast((m) => ({ ...m, text: '' }));
      },
    }, controller.signal, streamPath);

    if (controller.signal.aborted) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    flushPending();

    if (result.failure === 'paywall') {
      setPaywallHit(true);
      patchLast((m) => ({ ...m, text: '', paywallHit: true, streaming: false }));
    } else if (result.failure) {
      const fallback = FAILURE_TEXT[result.failure];
      patchLast((m) => ({ ...m, text: m.text || fallback, streaming: false }));
    } else {
      patchLast((m) => ({ ...m, streaming: false, messageId: result.messageId }));
    }
    setStatus(null);
    setIsStreaming(false);
  }, [kind, isStreaming, flushPending, patchLast, streamPath]);

  const resetConversation = useCallback(async () => {
    abortRef.current?.abort();
    setMessages([welcomeMessage(welcome)]);
    setPaywallHit(false);
    setIsStreaming(false);
    setStatus(null);
    await clearSimbaConversation(kind, contextKey);
  }, [kind, contextKey, welcome]);

  const rate = useCallback((id: string, rating: 'up' | 'down') => {
    setMessages((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      const next = m.rating === rating ? undefined : rating;
      if (next && m.messageId) {
        sendAnalystFeedback(m.messageId, next === 'up' ? 'positive' : 'negative', feedbackEndpoint);
      }
      return { ...m, rating: next };
    }));
  }, [feedbackEndpoint]);

  const hasConversation = messages.some((m) => m.id !== 'welcome');

  return { messages, isStreaming, status, paywallHit, hasConversation, send, resetConversation, rate };
}
