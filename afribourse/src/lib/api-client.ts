// src/lib/api-client.ts
import axios from 'axios';
import { fetchCsrfToken, getCsrfToken, invalidateCsrfToken, getAuthToken, setAuthToken } from '../config/api';

// ── Token bucket ──────────────────────────────────────────────────────────────
// Plafonne le débit sortant à 80 req/min, en-dessous de la limite serveur (100/min).
// Principe : chaque requête consomme un « jeton ». Si le seau est vide, la requête
// attend silencieusement qu'un jeton se régénère — jamais d'erreur visible pour l'user.
//
// Maths : 1 jeton / 750 ms = 80 jetons / min. Le seau contient jusqu'à 80 jetons,
// ce qui autorise un burst initial de 80 requêtes simultanées (ex : premier chargement)
// puis régule à 80/min ensuite.
const BUCKET_CAPACITY = 80;
const REFILL_MS = 750; // 1 jeton toutes les 750 ms

let _tokens = BUCKET_CAPACITY;
const _pendingRequests: Array<() => void> = [];

setInterval(() => {
  _tokens = Math.min(BUCKET_CAPACITY, _tokens + 1);
  // Débloquer la prochaine requête en attente dès qu'un jeton arrive
  if (_pendingRequests.length > 0 && _tokens > 0) {
    _tokens--;
    _pendingRequests.shift()!();
  }
}, REFILL_MS);

function acquireToken(): Promise<void> {
  if (_tokens > 0) { _tokens--; return Promise.resolve(); }
  // Seau vide — rejoindre la file, sera résolu à la prochaine régénération
  return new Promise(resolve => _pendingRequests.push(resolve));
}

// ── Retry 429 (fallback si le token bucket n'a pas suffi) ─────────────────────
// Lit le header Retry-After du serveur, plafonné à 30s pour ne pas bloquer l'UI.
function get429RetryDelay(headers: Record<string, string> | undefined): number {
  const raw = headers?.['retry-after'];
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed)) return Math.min(parsed * 1000, 30_000);
  }
  return 2_000;
}

// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];

// Intercepteur requête — token bucket + CSRF + Authorization Bearer
apiClient.interceptors.request.use(async (config) => {
  // Attendre un jeton avant de partir — garantit qu'on ne dépasse jamais 80 req/min
  await acquireToken();

  if (config.method && MUTATION_METHODS.includes(config.method.toLowerCase())) {
    let token = getCsrfToken();
    if (!token) {
      await fetchCsrfToken();
      token = getCsrfToken();
    }
    if (token) config.headers['X-CSRF-Token'] = token;
  }

  const authToken = getAuthToken();
  if (authToken && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }

  return config;
});

// Flag pour éviter les boucles infinies de refresh
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

// Exposé à AuthContext pour éviter la race condition entre refresh proactif et intercepteur
export const getIsAxiosRefreshing = () => isRefreshing;

function processRefreshQueue(newToken: string) {
  refreshQueue.forEach(({ resolve }) => resolve(newToken));
  refreshQueue = [];
}

function rejectRefreshQueue(err: any) {
  refreshQueue.forEach(({ reject }) => reject(err));
  refreshQueue = [];
}

// Intercepteur réponse — 401 (refresh token) + 403 (CSRF) + 429 (rate limit)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalConfig = error.config;

    // ── CSRF expiré (403) — renouvelle et retente une fois ───────────────────
    if (status === 403 && !originalConfig?._csrfRetried) {
      const method = originalConfig?.method?.toLowerCase();
      if (method && MUTATION_METHODS.includes(method)) {
        originalConfig._csrfRetried = true;
        invalidateCsrfToken();
        await fetchCsrfToken();
        const newToken = getCsrfToken();
        if (newToken) originalConfig.headers['X-CSRF-Token'] = newToken;
        return apiClient.request(originalConfig);
      }
    }

    // ── Token expiré (401) — refresh automatique + file d'attente ────────────
    if (status === 401 && !originalConfig?._authRetried) {
      const isAuthRoute = originalConfig?.url?.includes('/login') ||
        originalConfig?.url?.includes('/refresh') ||
        originalConfig?.url?.includes('/logout');

      if (!isAuthRoute) {
        originalConfig._authRetried = true;

        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          }).then((newToken) => {
            originalConfig.headers['Authorization'] = `Bearer ${newToken}`;
            return apiClient.request(originalConfig);
          });
        }

        isRefreshing = true;
        try {
          const refreshResponse = await apiClient.post('/refresh', {});
          const { token: newToken } = refreshResponse.data;
          if (newToken) {
            setAuthToken(newToken);
            processRefreshQueue(newToken);
            originalConfig.headers['Authorization'] = `Bearer ${newToken}`;
          }
          return apiClient.request(originalConfig);
        } catch (refreshErr) {
          rejectRefreshQueue(refreshErr);
          setAuthToken(null);
          const PUBLIC_PATHS = ['/', '/markets', '/indices', '/stock', '/news', '/learn',
            '/glossary', '/about', '/contact', '/privacy', '/help', '/subscriptions',
            '/community', '/communities', '/classement', '/login', '/signup',
            '/confirmer-inscription', '/renvoyer-confirmation', '/verifier-email',
            '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe'];
          const currentPath = window.location.pathname;
          const isPublic = PUBLIC_PATHS.some(p => currentPath === p || currentPath.startsWith(p + '/'));
          if (!isPublic) window.location.href = '/login';
        } finally {
          isRefreshing = false;
        }
      }
    }

    // ── Rate limit (429) — retry avec backoff, 2 tentatives maximum ──────────
    // Le token bucket empêche ce cas en temps normal.
    // Si on arrive ici c'est un cas extrême (autre appareil connecté en parallèle, etc.).
    // On retente silencieusement sans jamais afficher le message d'erreur du serveur.
    const retryCount: number = originalConfig?._rateLimitRetries ?? 0;
    if (status === 429 && retryCount < 2) {
      originalConfig._rateLimitRetries = retryCount + 1;
      const delay = get429RetryDelay(error.response?.headers);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient.request(originalConfig);
    }

    return Promise.reject(error);
  }
);
