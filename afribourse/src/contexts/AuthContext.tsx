import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

// --- Configuration API ---
const API_BASE_URL = 'http://localhost:3000/api';

// --- Provider Component ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour vérifier l'authentification
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include', // ✅ Envoie automatiquement le cookie
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setIsLoggedIn(false);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/users/logout`, {
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