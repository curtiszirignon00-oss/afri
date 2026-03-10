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
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

// --- Création du Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification via le cookie httpOnly (envoyé automatiquement)
  const checkAuth = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/me');
      const profile = response.data?.user;

      if (profile?.role === 'admin') {
        profile.subscriptionTier = 'max';
      }
      setUserProfile(profile);
      setIsLoggedIn(true);
    } catch {
      setIsLoggedIn(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion — le backend efface le cookie httpOnly
  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch {
      // Ignorer les erreurs réseau au logout
    } finally {
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  };

  // Vérification initiale au montage — le cookie OAuth est déjà set par le backend
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthStatus = urlParams.get('oauth');

    checkAuth();

    // Nettoyer les paramètres OAuth de l'URL après le retour OAuth
    if (oauthStatus === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userProfile, loading, checkAuth, logout }}>
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
