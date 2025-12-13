// src/App.tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TrendingUp } from 'lucide-react';
import { useEffect } from 'react';

// Query Client
import { queryClient } from './lib/queryClient';

// Context
import { AuthProvider } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import HomePage from './components/HomePage';
import MarketsPageRefactored from './components/MarketsPageRefactored';
import StockDetailPageEnhanced from './components/StockDetailPageEnhanced';
import LearnPage from './components/LearnPage';
import NewsPage from './components/NewsPage';
import GlossaryPage from './components/GlossaryPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import DashboardPage from './components/DashboardPage';
import TransactionsPage from './components/TransactionsPage';
import ProtectedRoute from './components/ProtectedRoute';
import ConfirmEmailPage from './components/ConfirmEmailPage';
import ResendConfirmationPage from './components/ResendConfirmationPage';
import VerifyEmailPage from './components/VerifyEmailPage';

// Composant pour gérer le scroll automatique lors du changement de route
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return null;
}

// Composant Layout pour le Header et Footer
function Layout() {
  const location = useLocation();

  // Détermine si le Header/Footer doit être affiché
  const showLayout = !['/signup', '/login', '/profile', '/confirmer-inscription', '/renvoyer-confirmation', '/verifier-email'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />
      <ScrollToTop />

      {showLayout && <Header />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/markets" element={<MarketsPageRefactored />} />
          <Route path="/stock/:symbol" element={<StockDetailPageEnhanced />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/confirmer-inscription" element={<ConfirmEmailPage />} />
          <Route path="/renvoyer-confirmation" element={<ResendConfirmationPage />} />
          <Route path="/verifier-email" element={<VerifyEmailPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <TransactionsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
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
                  Plateforme d'investissement pour la BRVM. Apprenez, simulez et investissez en toute confiance.
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
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      À propos
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">
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
                Avertissement : Les investissements en bourse comportent des risques. Informez-vous avant d'investir.
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AuthProvider>
      {/* DevTools React Query (visible uniquement en développement) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;