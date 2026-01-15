import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui';
import { useOnboardingRedirect } from '../hooks/useOnboarding';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { isLoggedIn, loading: authLoading } = useAuth();

  // Check onboarding status only if user is authenticated
  const { isLoading: onboardingLoading, needsOnboarding } = useOnboardingRedirect({
    enabled: isLoggedIn && requireOnboarding,
    redirectTo: '/onboarding'
  });

  // Affiche un spinner pendant la vérification de l'authentification
  if (authLoading) {
    return <LoadingSpinner fullScreen text="Vérification de l'authentification..." />;
  }

  // Redirige vers login si non authentifié
  if (!isLoggedIn) {
    console.log('🔒 Accès protégé refusé, redirection vers login');
    return <Navigate to="/login" replace />;
  }

  // Affiche un spinner pendant la vérification de l'onboarding
  if (requireOnboarding && onboardingLoading) {
    return <LoadingSpinner fullScreen text="Chargement de votre profil..." />;
  }

  // Si l'onboarding est requis et non complété, le hook gère la redirection
  // On empêche juste le rendu du contenu protégé
  if (requireOnboarding && needsOnboarding) {
    return null; // La redirection se fait via le hook
  }

  // Autorise l'accès si authentifié et onboarding complété (si requis)
  return <>{children}</>;
}
