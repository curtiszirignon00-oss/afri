// src/lib/api-client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper pour récupérer le token
const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
};

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important pour les cookies JWT
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token aux requêtes
apiClient.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs globalement
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Ne pas rediriger si on est déjà sur la page de login
            if (!window.location.pathname.includes('/login')) {
                console.warn('🔒 Session expirée, redirection vers login');
                // window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
