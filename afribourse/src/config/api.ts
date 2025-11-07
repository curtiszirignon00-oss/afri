// Configuration centralisée de l'API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
