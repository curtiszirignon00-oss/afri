import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

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

// Imports des types (remplacer par vos propres types si définis ailleurs)
// type Stock = { /* ...définition... */ }; // Supposé défini dans les pages elles-mêmes
// type Startup = { /* ...définition... */ }; // Supprimé

// Définir les pages possibles
type Page =
  | 'home'
  | 'markets'
  | 'stock-detail'
  | 'news'
  | 'learn'
  // | 'startups' // Supprimé
  // | 'startup-detail' // Supprimé
  | 'glossary'
  | 'signup'
  | 'login'
  | 'dashboard'
  | 'guide-sgi' // Supprimé car focus sur la bourse
  | 'profile'
  | 'transactions';

type Navigation = {
  page: Page;
  data?: any; // Garder any pour flexibilité (ex: stock data pour StockDetailPage)
};

const API_BASE_URL = 'http://localhost:3000/api'; // Ajuster si besoin

function App() {
  const [navigation, setNavigation] = useState<Navigation>({ page: 'home' });
  const [isLoggedIn, setIsLoggedIn] = useState(false); // État pour la connexion
  const [authChecked, setAuthChecked] = useState(false); // Pour savoir si la vérification initiale est faite

  // Vérifie l'état de connexion au chargement
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch(`${API_BASE_URL}/users/me`, { credentials: 'include' });
        setIsLoggedIn(response.ok);
      } catch (error) {
        console.error("Erreur vérification connexion:", error);
        setIsLoggedIn(false);
      } finally {
        setAuthChecked(true); // Indique que la vérification est terminée
      }
    }
    checkAuthStatus();
  }, []);

  // Met à jour l'état isLoggedIn après connexion/déconnexion réussie
  // (Appelé depuis LoginPage, SignupPage ou Header/DashboardPage pour logout)
  const handleAuthChange = (loggedIn: boolean) => {
    setIsLoggedIn(loggedIn);
    // Navigue vers le dashboard si connexion réussie, ou home si déconnexion
    if (loggedIn) {
      handleNavigate('dashboard');
    } else {
      handleNavigate('home');
    }
  };

  const handleNavigate = (page: string, data?: any) => {
    // Si l'utilisateur essaie d'accéder à une page protégée sans être connecté, redirige vers login
    const protectedPages: Page[] = ['dashboard', 'profile', 'transactions'];
    if (protectedPages.includes(page as Page) && !isLoggedIn) {
        console.log("Accès protégé refusé, redirection vers login.");
        setNavigation({ page: 'login' });
    } else {
        setNavigation({ page: page as Page, data });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // N'affiche rien ou un spinner simple tant que l'état auth n'est pas vérifié
  if (!authChecked) {
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
        // Assure-toi que 'data' est bien du type Stock avant de le passer
        return data ? <StockDetailPage stock={data as any} onNavigate={handleNavigate} /> : <MarketsPage onNavigate={handleNavigate} />; // Fallback si pas de data
      case 'news':
        return <NewsPage />;
      case 'learn':
        return <LearnPage />;
      case 'glossary':
        return <GlossaryPage />;
      case 'signup':
        return <SignupPage onNavigate={handleNavigate} />;
      case 'login':
        // Passe handleAuthChange à LoginPage pour mettre à jour l'état après succès
        return <LoginPage onNavigate={handleNavigate /* Pass handleAuthChange if needed */} />;
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'transactions':
        return <TransactionsPage onNavigate={handleNavigate} />;
      // case 'guide-sgi': // Section SGI retirée
      //   return <div>Guide SGI (enlevé)</div>;
      default:
        // Redirige vers 'home' si la page n'est pas reconnue
        return <HomePage onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />;
    }
  };
  // --- Fin rendu conditionnel ---


  // Détermine si le Header/Footer doit être affiché (pas sur login/signup/profile initial?)
  const showLayout = !['signup', 'login', 'profile'].includes(navigation.page);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col"> {/* Ajout flex flex-col */}
      <Toaster position="top-center" />

      {/* Affiche le Header si showLayout est true */}
      {showLayout && (
          // Passe isLoggedIn au Header
          <Header currentPage={navigation.page} onNavigate={handleNavigate} /* isLoggedIn={isLoggedIn} <- Header le fait déjà via /users/me */ />
      )}

      {/* Contenu principal qui prend l'espace restant */}
      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Affiche le Footer si showLayout est true */}
      {showLayout && (
        <footer className="bg-gray-900 text-white mt-auto"> {/* mt-auto pousse le footer en bas */}
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400">&copy; {new Date().getFullYear()} AfriBourse. Tous droits réservés.</p>
            {/* Ajouter d'autres liens de footer si nécessaire */}
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;