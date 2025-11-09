// src/AppRefactored.tsx
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TrendingUp } from 'lucide-react';

// Query Client
import { queryClient } from './lib/queryClient';

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import HomePage from './components/HomePage';
import MarketsPageRefactored from './components/MarketsPageRefactored';
import StockDetailPage from './components/StockDetailPage';
import LearnPage from './components/LearnPage';
import NewsPage from './components/NewsPage';
import GlossaryPage from './components/GlossaryPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import DashboardPage from './components/DashboardPage';
import TransactionsPage from './components/TransactionsPage';
import { LoadingSpinner } from './components/ui';

// Types
import { Page, Navigation } from './types';

// --- Composant principal avec la logique de navigation ---
function AppContent() {
  const [navigation, setNavigation] = useState<Navigation>({ page: 'home' });
  const { isLoggedIn, loading } = useAuth();

  const handleNavigate = (page: string, data?: any) => {
    const protectedPages: Page[] = ['dashboard', 'profile', 'transactions'];
    
    if (protectedPages.includes(page as Page) && !isLoggedIn) {
      console.log('Accès protégé refusé, redirection vers login.');
      setNavigation({ page: 'login' });
    } else {
      setNavigation({ page: page as Page, data });
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Affiche un spinner pendant la vérification de l'authentification
  if (loading) {
    return <LoadingSpinner fullScreen text="Chargement..." />;
  }

  // --- Rendu conditionnel des pages ---
  const renderPage = () => {
    const { page, data } = navigation;

    switch (page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />;
      case 'markets':
        return <MarketsPageRefactored onNavigate={handleNavigate} />;
      case 'stock-detail':
        return data ? (
          <StockDetailPage stock={data} onNavigate={handleNavigate} />
        ) : (
          <MarketsPageRefactored onNavigate={handleNavigate} />
        );
      case 'news':
        return <NewsPage />;
      case 'learn':
        return <LearnPage />;
      case 'glossary':
        return <GlossaryPage />;
      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionsPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />;
    }
  };

  // Détermine si le Header/Footer doit être affiché
  const showLayout = !['signup', 'login', 'profile'].includes(navigation.page);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-center" />

      {showLayout && (
        <Header currentPage={navigation.page} onNavigate={handleNavigate} />
      )}

      <main className="flex-grow">{renderPage()}</main>

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
                    <button onClick={() => handleNavigate('learn')} className="text-gray-400 hover:text-white transition-colors">
                      Apprendre
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('markets')} className="text-gray-400 hover:text-white transition-colors">
                      Marchés
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('news')} className="text-gray-400 hover:text-white transition-colors">
                      Actualités
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigate('glossary')} className="text-gray-400 hover:text-white transition-colors">
                      Glossaire
                    </button>
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
function AppRefactored() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      {/* DevTools React Query (visible uniquement en développement) */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
    </QueryClientProvider>
  );
}

export default AppRefactored;