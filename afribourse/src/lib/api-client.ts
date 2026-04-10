// src/lib/api-client.ts
import axios from 'axios';
import { fetchCsrfToken, getCsrfToken, invalidateCsrfToken, getAuthToken, setAuthToken } from '../config/api';

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
let refreshQueue: Array<(token: string) => void> = [];

function processRefreshQueue(newToken: string) {
    refreshQueue.forEach(cb => cb(newToken));
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
                    return new Promise<string>((resolve) => {
                        refreshQueue.push((token: string) => resolve(token));
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
                } catch {
                    // Refresh token expiré ou révoqué → déconnecter proprement
                    refreshQueue = [];
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

        return Promise.reject(error);
    }
);
