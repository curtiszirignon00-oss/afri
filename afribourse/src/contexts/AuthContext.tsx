import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../config/api';

// --- Types ---
interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  lastname: string | null;
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

  // Fonction pour vérifier l'authentification
  const checkAuth = async () => {
    setLoading(true); // <-- AJOUT : Reset loading à chaque vérification
    try {
      const response = await fetch(`${API_BASE_URL}/me`, { // <-- CORRECTION : Endpoint correct (/api/me)
        credentials: 'include', // ✅ Envoie automatiquement le cookie
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user); // <-- Met à jour le profil (le backend retourne { user: {...} })
        setIsLoggedIn(true); // <-- CRITIQUE : Met à jour isLoggedIn
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setIsLoggedIn(false);
      setUserProfile(null);
    } finally {
      setLoading(false); // <-- CRITIQUE : Arrête le chargement
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      setIsLoggedIn(false);
      setUserProfile(null);
    }
  };

  // Vérification initiale au montage du composant
  useEffect(() => {
    checkAuth();
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