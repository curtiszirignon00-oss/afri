// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TrendingUp } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { lazyWithRetry as lazy } from './lib/lazyWithRetry';

// Query Client
import { queryClient } from './lib/queryClient';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChallengeProvider } from './contexts/ChallengeContext';
import { CelebrationProvider } from './contexts/CelebrationContext';
import { OnboardingGuideProvider } from './context/OnboardingGuideContext';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';
import SilentErrorBoundary from './components/SilentErrorBoundary';

// Composants chemin critique (eager) — visibles dès le premier paint
import Header from './components/Header';
import HomePage from './components/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import WelcomePopup from './components/WelcomePopup';
import { OfflineBanner } from './components/pwa/OfflineBanner';
import { SessionExpiredModal } from './components/ui/SessionExpiredModal';

// Routes lazy — chargées à la demande
const MarketsPageRefactored = lazy(() => import('./components/MarketsPageRefactored'));
const IndicesPage = lazy(() => import('./components/IndicesPage'));
const StockDetailPageEnhanced = lazy(() => import('./components/StockDetailPageEnhanced'));
const UniWaxDashboardPage = lazy(() => import('./pages/UniWaxDashboardPage'));
const NewsPage = lazy(() => import('./components/NewsPage'));
const LearnPage = lazy(() => import('./components/LearnPage'));
const GlossaryPage = lazy(() => import('./components/GlossaryPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const HelpCenterPage = lazy(() => import('./components/HelpCenterPage'));
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const TransactionsPage = lazy(() => import('./components/TransactionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'));
const CommunityDetailPage = lazy(() => import('./pages/CommunityDetailPage'));
const TrialClaimPage = lazy(() => import('./pages/TrialClaimPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const ChallengeCommunityPage = lazy(() => import('./pages/ChallengeCommunityPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const SurveyPage = lazy(() => import('./pages/SurveyPage'));
const OnboardingFlow = lazy(() => import('./components/onboarding/OnboardingFlow'));
const DiscoverySurvey = lazy(() => import('./components/onboarding/DiscoverySurvey'));
const WebinarPage = lazy(() => import('./pages/WebinarPage'));

// Pages auth lazy — l'utilisateur accepte un délai au moment du clic
const SignupPage = lazy(() => import('./components/SignupPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const ConfirmEmailPage = lazy(() => import('./components/ConfirmEmailPage'));
const ResendConfirmationPage = lazy(() => import('./components/ResendConfirmationPage'));
const VerifyEmailPage = lazy(() => import('./components/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./components/ResetPasswordPage'));

// Routes admin lazy — bundles séparés (très peu d'utilisateurs)
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminAnalyticsDashboard = lazy(() => import('./components/AdminAnalyticsDashboard'));
const AdminSubscriptionStats = lazy(() => import('./components/AdminSubscriptionStats'));

// Composants globaux non critiques (modals/popups différés) — fallback null
const SurveyPopup = lazy(() => import('./components/survey/SurveyPopup'));
const OnboardingChecklist = lazy(() => import('./components/onboarding/OnboardingChecklist'));
const CelebrationModal = lazy(() => import('./components/onboarding/CelebrationModal'));

// Hooks
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';
import { usePageTracking } from './hooks/useAnalytics';

// Debug utilities (only in development)
if (import.meta.env.DEV) {
  import('./utils/testOnboarding');
}

// Composant pour gérer le scroll automatique lors du changement de route
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
}

// Fallback pour les routes lazy
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Chargement">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Composant Layout pour le Header et Footer
function Layout() {
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  // Initialiser Google Analytics pour tracker toutes les pages
  useGoogleAnalytics();

  // Initialiser le tracking automatique des pages
  usePageTracking();

  // Détermine si le Header/Footer doit être affiché
  const showLayout = !['/signup', '/login', '/survey', '/confirmer-inscription', '/renvoyer-confirmation', '/verifier-email', '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* PWA Offline Banner */}
      <OfflineBanner />
      <Toaster position="top-center" />
      <ScrollToTop />

      {/* Popup de bienvenue pour les utilisateurs récupérés */}
      {isLoggedIn && showWelcomePopup && (
        <WelcomePopup onClose={() => setShowWelcomePopup(false)} />
      )}

      {/* Modal session expirée — affiché globalement, hors flux de pages */}
      <SessionExpiredModal />

      {/* Onboarding guidé nouveaux utilisateurs — global, persistant entre les pages */}
      <SilentErrorBoundary name="OnboardingChecklist">
        <Suspense fallback={null}>
          <OnboardingChecklist />
        </Suspense>
      </SilentErrorBoundary>
      <SilentErrorBoundary name="CelebrationModal">
        <Suspense fallback={null}>
          <CelebrationModal />
        </Suspense>
      </SilentErrorBoundary>

      {isLoggedIn && <EmailVerificationBanner />}
      {showLayout && <Header />}

      {/* Discovery survey popup for users who haven't completed it */}
      <SilentErrorBoundary name="SurveyPopup">
        <Suspense fallback={null}>
          <SurveyPopup />
        </Suspense>
      </SilentErrorBoundary>

      <main className="flex-grow">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<HomePage />} />
          <Route path="/markets" element={<MarketsPageRefactored />} />
          <Route path="/indices" element={<IndicesPage />} />
          <Route path="/stock/UNXC/UNIWAX_Dashboard_Analytique" element={<UniWaxDashboardPage />} />
          <Route path="/stock/:symbol" element={<StockDetailPageEnhanced />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/webinaires" element={<WebinarPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/subscriptions" element={<SubscriptionPage />} />
          <Route path="/essai-gratuit" element={<TrialClaimPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/:slug" element={<CommunityDetailPage />} />

          {/* Challenge AfriBourse 2026 - Protected route */}
          <Route
            path="/challenge/community"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <ChallengeCommunityPage />
              </ProtectedRoute>
            }
          />

          {/* Achievements - Badges */}
          <Route
            path="/achievements"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <AchievementsPage />
              </ProtectedRoute>
            }
          />

          {/* Classement - Public */}
          <Route path="/classement" element={<LeaderboardPage />} />

          {/* Discovery survey — 3 questions post-inscription, déverrouille l'accès */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <DiscoverySurvey />
              </ProtectedRoute>
            }
          />

          {/* KYC complet (ADN Investisseur) — accessible via /profile */}
          <Route
            path="/onboarding/kyc"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <OnboardingFlow />
              </ProtectedRoute>
            }
          />

          {/* Profil public (avec userId optionnel) - Accessible sans onboarding */}
          <Route path="/profile/:userId?" element={<ProfilePage />} />

          {/* Checkout - Protégé avec vérification onboarding */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          {/* Routes d'authentification */}
          {/* Survey onboarding nouveaux utilisateurs — sans header */}
          <Route path="/survey" element={<SurveyPage />} />

          {/* Routes d'authentification */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/confirmer-inscription" element={<ConfirmEmailPage />} />
          <Route path="/renvoyer-confirmation" element={<ResendConfirmationPage />} />
          <Route path="/verifier-email" element={<VerifyEmailPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
          <Route path="/reinitialiser-mot-de-passe" element={<ResetPasswordPage />} />

          {/* Dashboard - Protégé (pas de vérif onboarding — le profil gère ça) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Mon Profil - Protégé (KYC géré dans la page elle-même) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requireOnboarding={false}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Transactions - Protégé avec vérification onboarding */}
          <Route
            path="/transactions"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />

          {/* Notifications - Protégé */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Watchlist - Protégé */}
          <Route
            path="/watchlist"
            element={
              <ProtectedRoute requireOnboarding={true}>
                <WatchlistPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/subscription-stats"
            element={
              <AdminRoute>
                <AdminSubscriptionStats />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalyticsDashboard />
              </AdminRoute>
            }
          />
          </Routes>
        </Suspense>
      </main>

      {showLayout && (
        <footer className="bg-gray-900 text-white mt-auto">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Section AfriBourse */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                  <h3 className="text-xl font-bold">AfriBourse</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Apprenez, simulez et investissez en toute confiance.
                </p>
              </div>

              {/* Section Navigation */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Navigation</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/learn" className="text-gray-400 hover:text-white transition-colors">
                      Apprendre
                    </a>
                  </li>
                  <li>
                    <a href="/webinaires" className="text-gray-400 hover:text-white transition-colors">
                      Webinaires
                    </a>
                  </li>
                  <li>
                    <a href="/markets" className="text-gray-400 hover:text-white transition-colors">
                      Marchés
                    </a>
                  </li>
                  <li>
                    <a href="/news" className="text-gray-400 hover:text-white transition-colors">
                      Actualités
                    </a>
                  </li>
                  <li>
                    <a href="/glossary" className="text-gray-400 hover:text-white transition-colors">
                      Glossaire
                    </a>
                  </li>
                </ul>
              </div>

              {/* Section Informations */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Informations</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/about" className="text-gray-400 hover:text-white transition-colors">
                      À propos
                    </a>
                  </li>
                  <li>
                    <a href="/contact" className="text-gray-400 hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                      Confidentialité
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section Copyright et Avertissement */}
            <div className="border-t border-gray-800 pt-8 space-y-4">
              <p className="text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} AfriBourse. Tous droits réservés.
              </p>
              <p className="text-center text-xs text-gray-500 italic">
                Avertissement : AfriBourse est une plateforme d'éducation financière indépendante et n'est pas une Société de Gestion et d'Intermédiation (SGI). Les investissements simulés ne constituent pas des transactions réelles.
              </p>
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

// --- Composant racine avec tous les Providers ---
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChallengeProvider>
            <CelebrationProvider>
              <BrowserRouter>
                <OnboardingGuideProvider>
                  <Layout />
                </OnboardingGuideProvider>
              </BrowserRouter>
            </CelebrationProvider>
          </ChallengeProvider>
        </AuthProvider>
        {/* DevTools React Query (visible uniquement en développement) */}
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;