import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../lib/api-client';

// --- Types ---
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  role?: string;
  subscriptionTier?: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  userProfile: UserProfile | null;
  loading: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  checkAuth: (customToken?: string | null) => Promise<void>;
  logout: () => Promise<void>;
}

// --- Création du Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });

  // Vérifier l'authentification via apiClient (gère le token automatiquement)
  const checkAuth = async (customToken?: string | null) => {
    setLoading(true);
    try {
      // Si un token custom est fourni (ex: retour OAuth), l'injecter temporairement
      const headers: Record<string, string> = {};
      if (customToken !== undefined && customToken !== null) {
        headers['Authorization'] = `Bearer ${customToken}`;
      }

      const response = await apiClient.get('/me', { headers });
      const profile = response.data?.user;

      if (profile?.role === 'admin') {
        profile.subscriptionTier = 'max';
      }
      setUserProfile(profile);
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
      setUserProfile(null);
      // Token invalide/expiré — nettoyer
      if (token || customToken) {
        localStorage.removeItem('auth_token');
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch {
      // Ignorer les erreurs réseau au logout
    } finally {
      setIsLoggedIn(false);
      setUserProfile(null);
      localStorage.removeItem('auth_token');
      setToken(null);
    }
  };

  // Sauvegarder le token dans localStorage quand il change
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  // Vérification initiale au montage — gère le retour OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    const oauthStatus = urlParams.get('oauth');

    if (oauthStatus === 'success' && oauthToken) {
      localStorage.setItem('auth_token', oauthToken);
      setToken(oauthToken);
      checkAuth(oauthToken);
    } else {
      checkAuth();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userProfile, loading, token, setToken, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook personnalisé pour utiliser le context ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
