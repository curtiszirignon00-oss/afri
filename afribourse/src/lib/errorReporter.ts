// src/lib/errorReporter.ts
// Remonte les erreurs front au backend (POST /api/client-errors) → dashboard admin,
// section « Erreurs client », + alerte email. L'utilisateur reçoit un code court
// (AB-XXXX) qu'il peut citer au support ; l'admin le retrouve par recherche.
import { API_BASE_URL, getAuthToken } from '../config/api';
import { RateLimitError } from './errors';
import { isNetworkError, NETWORK_MESSAGE, UNAVAILABLE_MESSAGE } from './userFacingError';
import { isChunkLoadError } from './chunkErrors';

export type ClientErrorKind = 'render' | 'route' | 'silent' | 'window' | 'unhandledrejection';

const MAX_REPORTS_PER_PAGE = 10;
const sent = new Set<string>();
let reportsCount = 0;

// Sans 0/O/1/I pour être dicté sans ambiguïté au téléphone ou sur WhatsApp
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeErrorCode(): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `AB-${s}`;
}

// Hash du bundle principal : identifie la version déployée sans variable de build
function currentRelease(): string | undefined {
  const src = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/index-"]')?.src;
  return src?.match(/index-([\w-]+)\.js/)?.[1];
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try { return new Error(JSON.stringify(value)); } catch { return new Error(String(value)); }
}

/**
 * Envoie l'erreur (fire-and-forget) et renvoie le code à afficher à l'utilisateur.
 * Ne jette jamais.
 */
export function reportClientError(
  value: unknown,
  kind: ClientErrorKind,
  componentStack?: string | null,
): string {
  const code = makeErrorCode();
  try {
    const error = toError(value);
    const dedupeKey = `${kind}|${error.name}|${error.message}`;
    if (sent.has(dedupeKey) || reportsCount >= MAX_REPORTS_PER_PAGE) return code;
    sent.add(dedupeKey);
    reportsCount++;

    const payload = {
      kind,
      code,
      name: error.name,
      message: error.message || '(sans message)',
      stack: error.stack?.slice(0, 6000),
      componentStack: componentStack?.slice(0, 4000) ?? undefined,
      route: window.location.pathname,
      release: currentRelease(),
      userAgent: navigator.userAgent,
    };

    if (import.meta.env.DEV) {
      console.info('[errorReporter] (dev, non envoyé)', payload);
      return code;
    }

    const token = getAuthToken();
    fetch(`${API_BASE_URL}/client-errors`, {
      method: 'POST',
      keepalive: true, // part même si la page se recharge juste après
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    }).catch(() => { /* hors ligne : tant pis */ });
  } catch { /* le reporter ne doit jamais casser l'app */ }
  return code;
}

// Erreurs attendues (réseau, HTTP, chunk après deploy) : déjà gérées par l'UI, pas des bugs
function isExpected(value: unknown): boolean {
  const e = value as any;
  if (!e) return true;
  if (e instanceof RateLimitError || isNetworkError(e) || isChunkLoadError(e)) return true;
  if (e.name === 'AbortError' || e.name === 'CanceledError') return true;
  if (e.response?.status !== undefined || e.status !== undefined) return true;
  if (e.message === NETWORK_MESSAGE || e.message === UNAVAILABLE_MESSAGE) return true;
  return false;
}

/** À appeler une fois au démarrage (main.tsx). */
export function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    // Les erreurs de chargement de ressources (img, script) ne remontent pas jusqu'ici en bubbling
    const value = event.error ?? event.message;
    if (!value || isExpected(value)) return;
    reportClientError(value, 'window');
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (isExpected(event.reason)) return;
    reportClientError(event.reason, 'unhandledrejection');
  });
}
