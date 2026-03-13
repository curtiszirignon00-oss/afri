// Configuration centralisée de l'API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Token JWT en mémoire — fallback pour Safari iOS qui bloque les cookies cross-site
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

// Token CSRF en mémoire (jamais exposé dans le DOM ni dans le localStorage)
let csrfToken: string | null = null;

/** Expose le token CSRF en cache (lecture seule) */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/** Invalide le token en cache pour forcer un re-fetch */
export function invalidateCsrfToken(): void {
  csrfToken = null;
}

/**
 * Récupère le token CSRF depuis le backend et le met en cache en mémoire.
 * À appeler au démarrage de l'app et après chaque login.
 */
export async function fetchCsrfToken(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/csrf-token`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken ?? null;
    }
  } catch {
    // Silencieux — la protection CSRF sera activée dès que le token sera disponible
  }
}

/**
 * Wrapper fetch avec credentials:include et token CSRF automatique.
 * Le cookie httpOnly JWT est envoyé automatiquement par le navigateur.
 * Le token CSRF est ajouté en header X-CSRF-Token pour les mutations.
 * En cas de 403 (token expiré/invalide), renouvelle le token et retente une fois.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  if (isMutation && !csrfToken) {
    await fetchCsrfToken();
  }

  const buildHeaders = () => ({
    ...(options.headers as Record<string, string>),
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(isMutation && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  });

  const res = await fetch(url, { ...options, credentials: 'include', headers: buildHeaders() });

  // Si 403 CSRF, renouveler le token et retenter une seule fois
  if (res.status === 403 && isMutation) {
    csrfToken = null;
    await fetchCsrfToken();
    return fetch(url, { ...options, credentials: 'include', headers: buildHeaders() });
  }

  return res;
}

// Configuration de l'application
export const APP_CONFIG = {
  apiUrl: API_BASE_URL,
  appName: import.meta.env.VITE_APP_NAME || 'AfriBourse',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
};
