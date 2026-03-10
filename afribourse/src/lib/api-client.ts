// src/lib/api-client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Cookie httpOnly envoyé automatiquement par le navigateur
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
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
