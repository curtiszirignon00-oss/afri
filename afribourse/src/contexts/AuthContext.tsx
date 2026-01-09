import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

// --- Types ---
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  role?: string;
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

// --- Helper pour détecter si on est sur mobile ---
const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// --- Création du Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => {
    // Initialiser le token depuis localStorage si on est sur mobile
    if (isMobileDevice()) {
      return localStorage.getItem('auth_token');
    }
    return null;
  });

  // Fonction pour vérifier l'authentification
  const checkAuth = async (customToken?: string | null) => {
    setLoading(true); // <-- AJOUT : Reset loading à chaque vérification
    try {
      const isMobile = isMobileDevice();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Utiliser customToken si fourni, sinon utiliser token du state
      const authToken = customToken !== undefined ? customToken : token;

      // Sur mobile, ajouter le token dans le header Authorization
      if (isMobile && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
        console.log('🔐 [AUTH] Using token for mobile request');
      }

      const response = await fetch(`${API_BASE_URL}/me`, {
        credentials: 'include', // ✅ Envoie automatiquement le cookie (desktop)
        headers,
      });

      console.log('📥 [AUTH] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AUTH] User authenticated:', data.user?.email);
        setUserProfile(data.user); // <-- Met à jour le profil (le backend retourne { user: {...} })
        setIsLoggedIn(true); // <-- CRITIQUE : Met à jour isLoggedIn
      } else {
        console.log('❌ [AUTH] Authentication failed');
        setIsLoggedIn(false);
        setUserProfile(null);
        // Si la requête échoue sur mobile, supprimer le token
        if (isMobile) {
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
    } catch (error) {
      console.error('❌ [AUTH] Error checking auth:', error);
      setIsLoggedIn(false);
      setUserProfile(null);
    } finally {
      setLoading(false); // <-- CRITIQUE : Arrête le chargement
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      const isMobile = isMobileDevice();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Sur mobile, ajouter le token dans le header Authorization
      if (isMobile && token) {
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
      // Supprimer le token du localStorage sur mobile
      if (isMobileDevice()) {
        localStorage.removeItem('auth_token');
      }
      setToken(null);
    }
  };

  // Sauvegarder le token dans localStorage quand il change (mobile uniquement)
  useEffect(() => {
    if (isMobileDevice()) {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }, [token]);

  // Vérification initiale au montage du composant seulement
  useEffect(() => {
    checkAuth();
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