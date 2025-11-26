import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, loading } = useAuth();

  // Affiche un spinner pendant la vérification de l'authentification
  if (loading) {
    return <LoadingSpinner fullScreen text="Vérification de l'authentification..." />;
  }

  // Redirige vers login si non authentifié
  if (!isLoggedIn) {
    console.log('🔒 Accès protégé refusé, redirection vers login');
    return <Navigate to="/login" replace />;
  }

  // Autorise l'accès si authentifié
  return <>{children}</>;
}
