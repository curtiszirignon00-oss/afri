// Configuration centralisée de l'API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Wrapper fetch avec credentials:include — le cookie httpOnly est envoyé automatiquement
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.headers as Record<string, string>),
    },
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
