// src/lib/api-client.ts
import axios from 'axios';
import { fetchCsrfToken, getCsrfToken } from '../config/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Cookie httpOnly envoyé automatiquement par le navigateur
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur CSRF — ajoute X-CSRF-Token sur toutes les mutations
const MUTATION_METHODS = ['post', 'put', 'patch', 'delete'];
apiClient.interceptors.request.use(async (config) => {
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
    return config;
});

// Intercepteur pour gérer les erreurs globalement
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Ne pas rediriger si on est déjà sur la page de login
            if (!window.location.pathname.includes('/login')) {
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
