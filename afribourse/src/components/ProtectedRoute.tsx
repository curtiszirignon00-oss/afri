import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from './ui';
import { useOnboardingRedirect } from '../hooks/useOnboarding';

// Contournement de developpement : avec VITE_DEV_BYPASS_AUTH=true dans .env,
// les pages protegees s'affichent sans session. Double garde-fou : le drapeau
// doit etre pose a la main ET import.meta.env.DEV doit etre vrai, donc un build
// de production n'est jamais concerne.
const DEV_BYPASS_AUTH =
  import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { isLoggedIn, loading: authLoading } = useAuth();

  // Check onboarding status only if user is authenticated
  const { isLoading: onboardingLoading, needsOnboarding, error: onboardingError } = useOnboardingRedirect({
    enabled: isLoggedIn && requireOnboarding,
    redirectTo: '/onboarding'
  });

  // Raccourci de developpement, place apres les hooks pour que leur ordre
  // reste identique a chaque rendu.
  if (DEV_BYPASS_AUTH) return <>{children}</>;

  // Affiche un spinner pendant la vérification de l'authentification
  if (authLoading) {
    return <LoadingSpinner fullScreen text="Vérification de l'authentification..." />;
  }

  // Redirige vers login si non authentifié
  if (!isLoggedIn) {
    console.log('🔒 Accès protégé refusé, redirection vers login');
    return <Navigate to="/login" replace />;
  }

  // Affiche un spinner pendant la vérification de l'onboarding (pas si erreur réseau)
  if (requireOnboarding && onboardingLoading && !onboardingError) {
    return <LoadingSpinner fullScreen text="Chargement de votre profil..." />;
  }

  // Si l'onboarding est requis et non complété, rediriger directement
  if (requireOnboarding && needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // Autorise l'accès si authentifié et onboarding complété (si requis)
  return <>{children}</>;
}
