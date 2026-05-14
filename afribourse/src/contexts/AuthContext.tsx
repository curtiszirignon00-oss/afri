import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { apiClient, getIsAxiosRefreshing } from '../lib/api-client';
import { setAuthToken, getAuthToken } from '../config/api';
import * as amplitude from '@amplitude/unified';
import { metaPixelIdentify } from '../utils/metaPixel';

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
  avatar_url?: string | null;
  isNewUser?: boolean;
}

// Événement global émis quand le serveur répond 401 depuis n'importe quel appel API
export const SESSION_EXPIRED_EVENT = 'afribourse:session-expired';

// Clés localStorage pour la coordination du refresh token entre onglets
const REFRESH_LOCK_KEY = 'afribourse:token-refresh-lock';
const REFRESH_DONE_KEY = 'afribourse:token-refresh-done';
// Durée max pendant laquelle un verrou de refresh est considéré valide (10 secondes)
const REFRESH_LOCK_TTL_MS = 10_000;

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
  sessionExpired: boolean;
  checkAuth: () => Promise<boolean>;
  initAuthFromLogin: (user: UserProfile, token?: string) => void;
  logout: () => Promise<void>;
  dismissSessionExpired: () => void;
}

// --- Création du Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Durée access token en ms (doit correspondre à ACCESS_TOKEN_TTL backend, 15m par défaut)
const ACCESS_TOKEN_MS = 15 * 60 * 1000;
// Rafraîchir 3 minutes avant l'expiration (marge plus large pour connexions lentes)
const REFRESH_BEFORE_MS = 3 * 60 * 1000;

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  // Ref pour annuler le checkAuth() initial si un login manuel se produit avant sa complétion
  const initialCheckAborted = useRef(false);
  // Timer pour le refresh proactif du token
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timestamp de la dernière émission du token (pour calculer quand rafraîchir)
  const tokenIssuedAtRef = useRef<number>(Date.now());
  // Évite de déclencher l'événement "session expirée" en boucle
  const sessionExpiredFiredRef = useRef(false);
  // Ref miroir de isLoggedIn pour les closures d'event listeners (évite les dépendances cycliques)
  const isLoggedInRef = useRef(false);

  // Planifie un refresh proactif du token avant son expiration
  const scheduleTokenRefresh = (issuedAt: number = Date.now()) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const elapsed = Date.now() - issuedAt;
    const delay = Math.max(0, ACCESS_TOKEN_MS - REFRESH_BEFORE_MS - elapsed);
    refreshTimerRef.current = setTimeout(() => {
      silentRefresh();
    }, delay);
  };

  // Déclenche l'expiration de session (une seule fois)
  const triggerSessionExpired = () => {
    if (sessionExpiredFiredRef.current) return;
    sessionExpiredFiredRef.current = true;
    isLoggedInRef.current = false;
    setIsLoggedIn(false);
    setUserProfile(null);
    setAuthToken(null);
    setSessionExpired(true);
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  };

  // Rafraîchit silencieusement le token sans bloquer l'UI.
  // Trois protections :
  // 1. Verrou localStorage — évite que deux onglets refreshent simultanément
  // 2. getIsAxiosRefreshing() — évite la race condition avec l'intercepteur axios
  // 3. Distinction erreur réseau / erreur auth — une coupure réseau ne déclenche PAS "session expirée"
  const silentRefresh = async () => {
    const now = Date.now();

    // Protection 2 : l'intercepteur axios est déjà en train de refresher dans ce même onglet
    // (ex : une requête a obtenu 401 en même temps que le timer proactif s'est déclenché)
    if (getIsAxiosRefreshing()) {
      // Attendre que l'intercepteur finisse, puis resynchroniser l'état
      setTimeout(() => {
        if (isLoggedInRef.current) checkAuth();
      }, 3_000);
      return;
    }

    // Protection 1 : un autre onglet tient le verrou
    const lockValue = localStorage.getItem(REFRESH_LOCK_KEY);
    if (lockValue && now - parseInt(lockValue, 10) < REFRESH_LOCK_TTL_MS) {
      setTimeout(() => {
        if (isLoggedInRef.current) checkAuth();
      }, REFRESH_LOCK_TTL_MS);
      return;
    }

    localStorage.setItem(REFRESH_LOCK_KEY, String(now));

    try {
      const response = await apiClient.post('/refresh', {});
      const { token } = response.data;
      if (token) {
        setAuthToken(token);
        tokenIssuedAtRef.current = Date.now();
        scheduleTokenRefresh();
        localStorage.setItem(REFRESH_DONE_KEY, String(Date.now()));
      }
    } catch (err: any) {
      // Protection 3 : distinguer erreur réseau et erreur d'authentification
      const isNetworkError = !err?.response; // pas de réponse = pas de connexion
      const isAuthError = err?.response?.status === 401 || err?.response?.status === 403;

      if (isNetworkError) {
        // Coupure réseau temporaire — réessayer dans 30 secondes, NE PAS expirer la session
        // (le token est potentiellement encore valide, le réseau reviendra)
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
          if (isLoggedInRef.current) silentRefresh();
        }, 30_000);
      } else if (isAuthError) {
        // Token vraiment révoqué ou expiré côté serveur
        if (isLoggedInRef.current) {
          triggerSessionExpired();
        } else {
          isLoggedInRef.current = false;
          setIsLoggedIn(false);
          setUserProfile(null);
          setAuthToken(null);
        }
      }
      // Autres erreurs (5xx serveur) : on ignore — le timer proactif retentera au prochain cycle
    } finally {
      localStorage.removeItem(REFRESH_LOCK_KEY);
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
      isLoggedInRef.current = true;
      setIsLoggedIn(true);
      setSessionExpired(false);
      sessionExpiredFiredRef.current = false;
      if (profile) {
        identifyAmplitudeUser(profile);
        metaPixelIdentify(profile);
      }
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
        isLoggedInRef.current = false;
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
    sessionExpiredFiredRef.current = false;
    if (user?.role === 'admin') {
      user.subscriptionTier = 'max';
    }
    setUserProfile(user);
    isLoggedInRef.current = true;
    setIsLoggedIn(true);
    setLoading(false);
    setSessionExpired(false);
    identifyAmplitudeUser(user);
    metaPixelIdentify(user);
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
      sessionExpiredFiredRef.current = false;
      isLoggedInRef.current = false;
      setIsLoggedIn(false);
      setUserProfile(null);
      setSessionExpired(false);
      amplitude.reset();
      setAuthToken(null);
    }
  };

  // Ferme le modal "session expirée" (ex: l'utilisateur clique sur "Se reconnecter")
  const dismissSessionExpired = () => {
    setSessionExpired(false);
    sessionExpiredFiredRef.current = false;
  };

  // Vérification initiale au montage — le cookie OAuth est déjà set par le backend
  // Dépendances vides : ne s'exécute qu'une seule fois au montage pour éviter la boucle infinie.
  // isLoggedInRef (ref) est utilisé dans les closures pour accéder à l'état courant sans dépendances.
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
        if (elapsed >= ACCESS_TOKEN_MS - REFRESH_BEFORE_MS) {
          silentRefresh();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Écouter les 401 émis par n'importe quel appel API (voir apiFetch)
    const handleGlobalSessionExpired = () => {
      if (isLoggedInRef.current) {
        triggerSessionExpired();
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleGlobalSessionExpired);

    // Quand un autre onglet termine un refresh avec succès, resynchroniser le token en mémoire.
    // Cela évite que cet onglet tente un second refresh avec un refresh token déjà roté.
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === REFRESH_DONE_KEY && e.newValue && isLoggedInRef.current) {
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleGlobalSessionExpired);
      window.removeEventListener('storage', handleStorageEvent);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userProfile, loading, sessionExpired, checkAuth, initAuthFromLogin, logout, dismissSessionExpired }}>
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
