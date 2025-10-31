import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';

// Import du AuthProvider et useAuth
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Imports des composants de page
import Header from './components/Header';
import HomePage from './components/HomePage';
import MarketsPage from './components/MarketsPage';
import StockDetailPage from './components/StockDetailPage';
import LearnPage from './components/LearnPage';
import NewsPage from './components/NewsPage';
import GlossaryPage from './components/GlossaryPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import DashboardPage from './components/DashboardPage';
import TransactionsPage from './components/TransactionsPage';

// Définir les pages possibles
import { Page, Navigation } from './types';

// --- Composant principal avec la logique de navigation ---
function AppContent() {
  const [navigation, setNavigation] = useState<Navigation>({ page: 'home' });
  
  // Utilise le hook useAuth pour accéder à l'état d'authentification
  const { isLoggedIn, loading } = useAuth();

  const handleNavigate = (page: string, data?: any) => {
    // Pages protégées
    const protectedPages: Page[] = ['dashboard', 'profile', 'transactions'];
    
    if (protectedPages.includes(page as Page) && !isLoggedIn) {
      console.log("Accès protégé refusé, redirection vers login.");
      setNavigation({ page: 'login' });
    } else {
      setNavigation({ page: page as Page, data });
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Affiche un spinner pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- Rendu conditionnel des pages ---
  const renderPage = () => {
    const { page, data } = navigation;

    switch (page) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />;
      case 'markets':
        return <MarketsPage onNavigate={handleNavigate} />;
      case 'stock-detail':
        return data ? (
          <StockDetailPage stock={data} onNavigate={handleNavigate} />
        ) : (
          <MarketsPage onNavigate={handleNavigate} />
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

      {showLayout && <Header currentPage={navigation.page} onNavigate={handleNavigate} />}

      <main className="flex-grow">{renderPage()}</main>

      {showLayout && (
        <footer className="bg-gray-900 text-white mt-auto">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400">
              &copy; {new Date().getFullYear()} AfriBourse. Tous droits réservés.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

// --- Composant racine avec le Provider ---
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;