// src/lib/userFacingError.ts
// Traduit une erreur (fetch, axios, parse, HTTP) en phrase compréhensible pour
// l'utilisateur. Les messages techniques (« Failed to fetch », « Unexpected token '<' »,
// « Internal Server Error », « Erreur 500 »…) ne doivent jamais atteindre un toast.
import { RateLimitError } from './errors';

export const NETWORK_MESSAGE = 'Connexion impossible. Vérifiez votre réseau et réessayez.';
export const UNAVAILABLE_MESSAGE = 'Le service est momentanément indisponible. Réessayez dans quelques instants.';
export const SESSION_MESSAGE = 'Votre session a expiré. Reconnectez-vous pour continuer.';

// Messages bruts de navigateur / serveur / librairies : jamais montrés tels quels
const TECHNICAL_PATTERNS = [
  /failed to fetch/i,
  /load failed/i, // Safari
  /networkerror/i, // Firefox
  /network error/i, // axios
  /network request failed/i,
  /timeout/i,
  /aborted/i,
  /unexpected token/i,
  /json/i,
  /internal server error/i,
  /bad gateway/i,
  /service unavailable/i,
  /^erreur \d{3}/i,
  /^request failed with status code/i, // axios
  /^(unauthorized|forbidden|not found|invalid token)$/i,
  /is not a function|is not defined|cannot read propert|undefined|null/i,
];

function statusOf(err: any): number | undefined {
  return err?.response?.status ?? err?.status;
}

export function isNetworkError(err: unknown): boolean {
  const e = err as any;
  if (!e) return false;
  if (e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return true;
  if (e.isAxiosError && !e.response) return true;
  // fetch() rejette avec un TypeError quand le réseau tombe
  return e.name === 'TypeError' && /fetch|load failed|network/i.test(e.message || '');
}

/** Phrase à afficher à l'utilisateur. `fallback` décrit l'action qui a échoué. */
export function toUserMessage(err: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string {
  if (err instanceof RateLimitError) return 'Trop de requêtes. Patientez quelques instants.';
  if (isNetworkError(err)) return NETWORK_MESSAGE;

  const e = err as any;
  if (e?.name === 'SyntaxError') return UNAVAILABLE_MESSAGE; // HTML reçu au lieu de JSON

  const status = statusOf(e);
  if (status !== undefined && status >= 500) return UNAVAILABLE_MESSAGE;
  if (status === 401) return SESSION_MESSAGE;

  // Message métier du serveur (« Solde insuffisant »…) ou déjà traduit : on le garde
  const raw: unknown = e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message;
  if (typeof raw === 'string' && raw.trim() && !TECHNICAL_PATTERNS.some((re) => re.test(raw))) {
    return raw;
  }
  return fallback;
}
