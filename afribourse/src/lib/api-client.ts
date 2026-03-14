// src/lib/api-client.ts
import axios from 'axios';
import { fetchCsrfToken, getCsrfToken, invalidateCsrfToken, getAuthToken } from '../config/api';

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

// Intercepteur réponse — gestion 401 + retry CSRF automatique sur 403
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;

        // Retry automatique si token CSRF expiré (403) — renouvelle et retente une fois
        if (status === 403 && !error.config?._csrfRetried) {
            const method = error.config?.method?.toLowerCase();
            if (method && MUTATION_METHODS.includes(method)) {
                error.config._csrfRetried = true;
                invalidateCsrfToken();
                await fetchCsrfToken();
                const newToken = getCsrfToken();
                if (newToken) {
                    error.config.headers['X-CSRF-Token'] = newToken;
                }
                return apiClient.request(error.config);
            }
        }

        if (status === 401) {
            if (!window.location.pathname.includes('/login')) {
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
