import { TrendingUp, BookOpen, User, Menu, X, BarChart3, LogOut, LayoutDashboard } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react'; // <-- Ajout de useCallback
import { LearnMegaMenu, NewsMegaMenu, MarketsMegaMenu } from './MegaMenus';
import { Settings } from 'lucide-react'; // Ajout d'une icône pour les paramètres/profil

// Base URL for API (maintenir 3000 si c'est le port du backend)
const API_BASE_URL = 'http://localhost:3000/api'; 

// --- MegaMenu Mapping (Reste inchangé) ---
const MEGA_MENU_COMPONENTS: { [key: string]: React.FC<any> } = {
  learn: LearnMegaMenu,
  news: NewsMegaMenu,
  markets: MarketsMegaMenu,
};
// ------------------------------------------

type HeaderProps = {
  currentPage: string;
  onNavigate: (page: string) => void;
};

// --- LOGIQUE DE DÉCONNEXION CENTRALISÉE ---
const handleLogout = async (onNavigate: (page: string) => void) => {
    try {
        // 1. Appel API: POST /api/logout (demande au backend d'effacer le cookie)
        const response = await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include', // Important pour envoyer le cookie
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok || response.status === 401) {
             console.log("Déconnexion réussie côté serveur (cookie effacé).");
        } else {
             console.error(`Échec de l'appel /logout avec statut ${response.status}.`);
        }
        
        // 2. Nettoyage de l'état local du frontend (nettoyer tout état stocké localement)
        localStorage.removeItem('jwtToken'); 
        
        // 3. Redirection vers l'accueil pour rafraîchir l'état de l'application
        onNavigate('home'); 
        
        // Pour être certain que l'état global du Header se met à jour :
        window.location.reload(); 
        
    } catch (error) {
        console.error("Erreur réseau lors de la déconnexion:", error);
        // On force la déconnexion locale même si l'API est injoignable
        localStorage.removeItem('jwtToken'); 
        onNavigate('home'); 
        window.location.reload();
    }
};


export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [loadingAuth, setLoadingAuth] = useState(true); 
  // État pour afficher le menu déroulant du compte
  const [accountMenuOpen, setAccountMenuOpen] = useState(false); 


  // --- checkUserStatus function (vérifie le cookie via /me) ---
  const checkUserStatus = useCallback(async () => {
    setLoadingAuth(true); 
    try {
      // Utilisation de la route correcte: /api/users/me
      const response = await fetch(`${API_BASE_URL}/users/me`, { 
        credentials: 'include', 
      });

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Error checking user status:", error);
      setIsLoggedIn(false);
    } finally {
      setLoadingAuth(false); 
    }
  }, []);


  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]); 

    // Gestion du clic en dehors du menu déroulant (peut être ignoré pour l'instant)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Logique complète requise si vous voulez fermer le menu en cliquant en dehors.
        };
        // window.addEventListener('mousedown', handleClickOutside);
        // return () => window.removeEventListener('mousedown', handleClickOutside);
    }, []);
 

  const navigation = [
    { name: 'Apprendre', id: 'learn', icon: BookOpen, hasMegaMenu: true },
    { name: 'Marchés', id: 'markets', icon: BarChart3, hasMegaMenu: true },
    { name: 'Actualités', id: 'news', icon: TrendingUp, hasMegaMenu: true },
  ];

  const ActiveMegaMenuComponent = activeMegaMenu ? MEGA_MENU_COMPONENTS[activeMegaMenu] : null;

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2">
          {/* Message de la bannière ici */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => { onNavigate('home'); setActiveMegaMenu(null); }}
                className="flex flex-col items-start"
              >
                  <div className="flex items-center space-x-2">
                     <TrendingUp className="w-8 h-8 text-blue-600" />
                     <span className="text-2xl font-bold text-gray-900">AfriBourse</span>
                  </div>
                 <span className="text-xs text-blue-600 font-semibold ml-10">INVESTIR MIEUX</span>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {navigation.map((item) => {
                 const Icon = item.icon;
                 return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => item.hasMegaMenu && setActiveMegaMenu(item.id)}
                      onMouseLeave={() => setActiveMegaMenu(null)}
                      onFocus={() => item.hasMegaMenu && setActiveMegaMenu(item.id)}
                      onBlur={(e) => { 
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setActiveMegaMenu(null);
                          }
                      }}
                      tabIndex={-1} 
                    >
                      <button
                        onClick={() => { onNavigate(item.id); setActiveMegaMenu(null); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                            currentPage === item.id || activeMegaMenu === item.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        aria-haspopup={item.hasMegaMenu ? "true" : "false"}
                        aria-expanded={activeMegaMenu === item.id}
                      >
                         <Icon className="w-4 h-4" />
                         <span>{item.name}</span>
                      </button>
                    </div>
                 );
              })}
            </nav>

            {/* Action Buttons (Login/Signup/Account/Logout) */}
            <div className="flex items-center space-x-4">
              
              {/* Desktop Account/Login Button */}
              {!loadingAuth && ( 
                <div className="hidden lg:relative lg:flex items-center"> 
                  {isLoggedIn ? (
             
                    <button
                      onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                      className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                    >
                       <User className="w-5 h-5" />
                       <span>Mon Compte</span>
                    </button>
                  ) : (
    
                    <button
                      onClick={() => onNavigate('login')} 
                      className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                    >
                       <User className="w-5 h-5" />
                       <span>Connexion</span>
                    </button>
                  )}
                  
                  {/* Dropdown Menu (Desktop) */}
                  {isLoggedIn && accountMenuOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                      onMouseLeave={() => setAccountMenuOpen(false)}
                    >

                      <button
                        onClick={() => { onNavigate('dashboard'); setAccountMenuOpen(false); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LayoutDashboard className="w-4 h-4" /> <span>Tableau de bord</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                       {/* 2. Mon Profil (NOUVEAU LIEN) */}
                      <button
                        onClick={() => { onNavigate('profile'); setAccountMenuOpen(false); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4" /> <span>Mon Profil</span>
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>
                      {/* BOUTON DE DÉCONNEXION CORRIGÉ */}
                      <button
                        onClick={() => handleLogout(onNavigate)}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" /> <span>Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
                
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Panel */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              
              {navigation.map((item) => { 
                  const Icon = item.icon;
                  return ( 
                    <button // <-- L'erreur TS2304 devrait être résolue ici
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === item.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  ); 
              })} 
              
              {/* Mobile Account Actions */}
              {!loadingAuth && ( 
                  <>
                    <button
                      onClick={() => { onNavigate(isLoggedIn ? 'dashboard' : 'login'); setMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                       <User className="w-5 h-5" />
                       <span>{isLoggedIn ? 'Mon Compte' : 'Connexion'}</span>
                    </button>

                    {/* Mon Profil Mobile (NOUVEAU) */}
                    {isLoggedIn && (
                        <button
                            onClick={() => { onNavigate('profile'); setMobileMenuOpen(false); }}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Mon Profil</span>
                        </button>
                    )}
                    
                    {/* Bouton Déconnexion Mobile (Séparé) */}
                    {isLoggedIn && (
                      <button
                        onClick={() => handleLogout(onNavigate)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold mt-2"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Déconnexion</span>
                      </button>
                    )}
                  </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mega Menus */}
      {ActiveMegaMenuComponent && (
        <div onMouseLeave={() => setActiveMegaMenu(null)}>
          <ActiveMegaMenuComponent
            onNavigate={(page: string) => { onNavigate(page); setActiveMegaMenu(null); }}
          />
        </div>
      )}
    </>
  );
}