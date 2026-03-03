// Configuration centralisée de l'API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Lit le token depuis localStorage (clé 'auth_token' ou 'token' pour compatibilité)
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token') || localStorage.getItem('token') || null;
};

// Wrapper fetch qui ajoute automatiquement Authorization + credentials:include
// Utiliser partout à la place de fetch() pour les appels API authentifiés
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
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
