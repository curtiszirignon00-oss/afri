import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { apiClient } from '../lib/api-client';
import { setAuthToken } from '../config/api';

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
  checkAuth: () => Promise<boolean>;
  initAuthFromLogin: (user: UserProfile, token?: string) => void;
  logout: () => Promise<void>;
}

// --- Création du Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Ref pour annuler le checkAuth() initial si un login manuel se produit avant sa complétion
  const initialCheckAborted = useRef(false);

  // Vérifier l'authentification via le cookie httpOnly (envoyé automatiquement)
  // Retourne true si l'utilisateur est authentifié, false sinon
  const checkAuth = async (): Promise<boolean> => {
    // Si un login manuel a déjà alimenté l'état, ne pas écraser le loading
    if (!initialCheckAborted.current) setLoading(true);
    try {
      const response = await apiClient.get('/me');
      const profile = response.data?.user;
      const token = response.data?.token;

      if (profile?.role === 'admin') {
        profile.subscriptionTier = 'max';
      }
      setUserProfile(profile);
      setIsLoggedIn(true);
      // Stocker le token en mémoire pour les clients Safari iOS (ITP bloque les cookies cross-site)
      if (token) setAuthToken(token);
      return true;
    } catch {
      // Ne pas écraser l'état si un login manuel vient d'aboutir
      if (!initialCheckAborted.current) {
        setIsLoggedIn(false);
        setUserProfile(null);
        setAuthToken(null);
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Alimenter l'état auth directement depuis la réponse du login — sans appel réseau supplémentaire.
  // Évite la race condition entre le checkAuth() initial et le login manuel.
  const initAuthFromLogin = (user: UserProfile, token?: string) => {
    initialCheckAborted.current = true;
    if (user?.role === 'admin') {
      user.subscriptionTier = 'max';
    }
    setUserProfile(user);
    setIsLoggedIn(true);
    setLoading(false);
    if (token) setAuthToken(token);
  };

  // Déconnexion — le backend efface le cookie httpOnly
  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch {
      // Ignorer les erreurs réseau au logout
    } finally {
      initialCheckAborted.current = false;
      setIsLoggedIn(false);
      setUserProfile(null);
      setAuthToken(null);
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
    <AuthContext.Provider value={{ isLoggedIn, userProfile, loading, checkAuth, initAuthFromLogin, logout }}>
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
