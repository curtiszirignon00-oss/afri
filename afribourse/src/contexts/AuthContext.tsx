import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

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

  // Fonction pour vérifier l'authentification
  const checkAuth = async (customToken?: string | null) => {
    setLoading(true);
    try {
      const authToken = customToken !== undefined ? customToken : token;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Toujours envoyer le token si disponible — tous navigateurs, tous appareils
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/me`, {
        credentials: 'include',
        headers,
      });

      console.log('📥 [AUTH] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AUTH] User authenticated:', data.user?.email);
        const profile = data.user;
        if (profile?.role === 'admin') {
          profile.subscriptionTier = 'max';
        }
        setUserProfile(profile);
        setIsLoggedIn(true);
      } else {
        console.log('❌ [AUTH] Authentication failed');
        setIsLoggedIn(false);
        setUserProfile(null);
        // Token invalide/expiré — nettoyer sur tous les appareils
        if (authToken) {
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
    } catch (error) {
      console.error('❌ [AUTH] Error checking auth:', error);
      setIsLoggedIn(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Toujours envoyer le token — tous navigateurs, tous appareils
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch (error) {
      console.error('Erreur logout:', error);
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

  // Vérification initiale au montage du composant seulement
  useEffect(() => {
    // Si c'est un retour OAuth, extraire le token de l'URL avant de vérifier l'auth
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
