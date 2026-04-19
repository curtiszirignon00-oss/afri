// src/lib/api-client.ts
import axios from 'axios';
import toast from 'react-hot-toast';
import { fetchCsrfToken, getCsrfToken, invalidateCsrfToken, getAuthToken, setAuthToken } from '../config/api';

// Endpoints de polling en arrière-plan — les erreurs 429 sur ces routes sont silencieuses
const POLLING_ENDPOINTS = [
  '/notifications/unread-count',
  '/notifications',
  '/communities/unseen-count',
  '/achievements/me/new',
  '/gamification/streak/me',
  '/gamification/xp/me',
];

// Anti-spam du toast 429 — au maximum un toast par minute
let lastRateLimitToastAt = 0;
function showRateLimitToast() {
  const now = Date.now();
  if (now - lastRateLimitToastAt < 60_000) return;
  lastRateLimitToastAt = now;
  toast.error('Trop de requêtes. Patientez un instant avant de continuer.', {
    duration: 5000,
    id: 'rate-limit',
  });
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Cookie httpOnly envoyé automatiquement par le navigateur
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur requête — CSRF + Authorization Bearer (fallback Safari iOS ITP)
const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];
apiClient.interceptors.request.use(async (config) => {
    // CSRF sur toutes les mutations
    if (config.method && MUTATION_METHODS.includes(config.method.toLowerCase())) {
        let token = getCsrfToken();
        if (!token) {
            await fetchCsrfToken();
            token = getCsrfToken();
        }
        if (token) {
            config.headers['X-CSRF-Token'] = token;
        }
    }
    // Authorization Bearer si token en mémoire (Safari iOS bloque les cookies cross-site)
    const authToken = getAuthToken();
    if (authToken && !config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    return config;
});

// Flag pour éviter les boucles infinies de refresh
let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function processRefreshQueue(newToken: string) {
    refreshQueue.forEach(({ resolve }) => resolve(newToken));
    refreshQueue = [];
}

function rejectRefreshQueue(err: any) {
    refreshQueue.forEach(({ reject }) => reject(err));
    refreshQueue = [];
}

// Intercepteur réponse — gestion 401 (refresh token) + retry CSRF automatique sur 403
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const originalConfig = error.config;

        // Retry automatique si token CSRF expiré (403) — renouvelle et retente une fois
        if (status === 403 && !originalConfig?._csrfRetried) {
            const method = originalConfig?.method?.toLowerCase();
            if (method && MUTATION_METHODS.includes(method)) {
                originalConfig._csrfRetried = true;
                invalidateCsrfToken();
                await fetchCsrfToken();
                const newToken = getCsrfToken();
                if (newToken) {
                    originalConfig.headers['X-CSRF-Token'] = newToken;
                }
                return apiClient.request(originalConfig);
            }
        }

        // Auto-refresh sur 401 — utilise le refresh token (cookie rtk ou body mobile)
        if (status === 401 && !originalConfig?._authRetried) {
            // Ne pas tenter de refresh sur les routes d'auth elles-mêmes
            const isAuthRoute = originalConfig?.url?.includes('/login') ||
                originalConfig?.url?.includes('/refresh') ||
                originalConfig?.url?.includes('/logout');
            if (!isAuthRoute) {
                originalConfig._authRetried = true;

                if (isRefreshing) {
                    // Mettre en file d'attente les requêtes pendant le refresh en cours
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
                    // Refresh token expiré ou révoqué → rejeter toutes les requêtes en attente
                    rejectRefreshQueue(refreshErr);
                    setAuthToken(null);
                    // Ne rediriger vers login que sur les pages protégées (pas les pages publiques)
                    const PUBLIC_PATHS = ['/', '/markets', '/indices', '/stock', '/news', '/learn',
                        '/glossary', '/about', '/contact', '/privacy', '/help', '/subscriptions',
                        '/community', '/communities', '/classement', '/login', '/signup',
                        '/confirmer-inscription', '/renvoyer-confirmation', '/verifier-email',
                        '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe'];
                    const currentPath = window.location.pathname;
                    const isPublic = PUBLIC_PATHS.some(p => currentPath === p || currentPath.startsWith(p + '/'));
                    if (!isPublic) {
                        window.location.href = '/login';
                    }
                } finally {
                    isRefreshing = false;
                }
            }
        }

        // Gestion 429 — rate limit atteint
        if (status === 429) {
          const url: string = originalConfig?.url ?? '';
          const isPolling = POLLING_ENDPOINTS.some(ep => url.includes(ep));
          if (!isPolling) {
            // Action utilisateur (navigation, formulaire, etc.) → toast informatif
            showRateLimitToast();
          }
          // Dans tous les cas on rejette — React Query gardera les données stale
          // et ne retentera pas immédiatement (retry: 1 dans queryClient avec back-off)
          return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);
