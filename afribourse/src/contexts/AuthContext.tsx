import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { apiClient } from '../lib/api-client';
import { setAuthToken, getAuthToken } from '../config/api';
import * as amplitude from '@amplitude/unified';

// --- Types ---
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
  role?: string;
  subscriptionTier?: string;
  hasTrial?: boolean;
  trialExpiresAt?: string;
  email_verified_at?: string | null;
  created_at?: string | null;
  telephone?: string | null;
}

// --- Amplitude identify helper ---
function identifyAmplitudeUser(profile: UserProfile) {
  amplitude.setUserId(profile.email);

  const identify = new amplitude.Identify();
  identify.set('email', profile.email);
  identify.set('name', `${profile.name ?? ''} ${profile.lastname ?? ''}`.trim());
  identify.set('plan', profile.subscriptionTier ?? 'free');
  identify.set('role', profile.role ?? 'user');
  if (profile.telephone) identify.set('phone', profile.telephone);

  amplitude.identify(identify);
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

// Durée access token en ms (doit correspondre à ACCESS_TOKEN_TTL backend, 15m par défaut)
const ACCESS_TOKEN_MS = 15 * 60 * 1000;
// Rafraîchir 2 minutes avant l'expiration
const REFRESH_BEFORE_MS = 2 * 60 * 1000;

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Ref pour annuler le checkAuth() initial si un login manuel se produit avant sa complétion
  const initialCheckAborted = useRef(false);
  // Timer pour le refresh proactif du token
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timestamp de la dernière émission du token (pour calculer quand rafraîchir)
  const tokenIssuedAtRef = useRef<number>(Date.now());

  // Planifie un refresh proactif du token avant son expiration
  const scheduleTokenRefresh = (issuedAt: number = Date.now()) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const elapsed = Date.now() - issuedAt;
    const delay = Math.max(0, ACCESS_TOKEN_MS - REFRESH_BEFORE_MS - elapsed);
    refreshTimerRef.current = setTimeout(() => {
      silentRefresh();
    }, delay);
  };

  // Rafraîchit silencieusement le token sans bloquer l'UI
  const silentRefresh = async () => {
    try {
      const response = await apiClient.post('/refresh', {});
      const { token } = response.data;
      if (token) {
        setAuthToken(token);
        tokenIssuedAtRef.current = Date.now();
        scheduleTokenRefresh();
      }
    } catch {
      // Si le refresh échoue (refresh token expiré ou révoqué), déconnecter
      setIsLoggedIn(false);
      setUserProfile(null);
      setAuthToken(null);
    }
  };

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
      if (profile) identifyAmplitudeUser(profile);
      // Stocker le token en mémoire pour les clients Safari iOS (ITP bloque les cookies cross-site)
      if (token) {
        setAuthToken(token);
        tokenIssuedAtRef.current = Date.now();
        scheduleTokenRefresh();
      }
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
    identifyAmplitudeUser(user);
    if (token) {
      setAuthToken(token);
      tokenIssuedAtRef.current = Date.now();
      scheduleTokenRefresh();
    }
  };

  // Déconnexion — le backend efface le cookie httpOnly
  const logout = async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    try {
      await apiClient.post('/logout');
    } catch {
      // Ignorer les erreurs réseau au logout
    } finally {
      initialCheckAborted.current = false;
      setIsLoggedIn(false);
      setUserProfile(null);
      amplitude.reset();
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

    // Rafraîchir quand l'onglet redevient visible après une longue absence
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - tokenIssuedAtRef.current;
        // Si le token est expiré ou expire dans moins de 2 min, rafraîchir
        if (elapsed >= ACCESS_TOKEN_MS - REFRESH_BEFORE_MS && getAuthToken()) {
          silentRefresh();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
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
