import { TrendingUp, BookOpen, User, Menu, X, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase'; // <-- REMOVE Supabase
import { LearnMegaMenu, NewsMegaMenu, MarketsMegaMenu } from './MegaMenus';

// Base URL for API
const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if needed

// --- MegaMenu Mapping (Remains the same) ---
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

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status
  const [loadingAuth, setLoadingAuth] = useState(true); // Add loading state for initial check

  // --- UPDATED useEffect for checking login status ---
  useEffect(() => {
    // Check user status when the component mounts
    checkUserStatus();

    // OPTIONAL: Add listeners for custom events if you implement
    // login/logout events within your React app's state management
    // (e.g., using Context API or Zustand/Redux)
    // window.addEventListener('login', checkUserStatus);
    // window.addEventListener('logout', checkUserStatus);

    // return () => {
    //   window.removeEventListener('login', checkUserStatus);
    //   window.removeEventListener('logout', checkUserStatus);
    // };
  }, []); // Run only once on mount
  // --- END UPDATED useEffect ---

  // --- NEW checkUserStatus function ---
  async function checkUserStatus() {
    setLoadingAuth(true); // Start loading
    try {
      // Call the '/api/users/me' endpoint to verify the session cookie
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        credentials: 'include', // Crucial: sends the httpOnly cookie
      });

      if (response.ok) {
        // If status is 200 OK, the user is logged in
        setIsLoggedIn(true);
      } else {
        // If status is 401 Unauthorized or any other error, user is not logged in
        setIsLoggedIn(false);
      }
    } catch (error) {
      // Network error or other issues
      console.error("Error checking user status:", error);
      setIsLoggedIn(false); // Assume not logged in on error
    } finally {
      setLoadingAuth(false); // Finish loading
    }
  }
  // --- END NEW checkUserStatus function ---

  const navigation = [
    { name: 'Apprendre', id: 'learn', icon: BookOpen, hasMegaMenu: true },
    { name: 'Marchés', id: 'markets', icon: BarChart3, hasMegaMenu: true },
    { name: 'Actualités', id: 'news', icon: TrendingUp, hasMegaMenu: true },
  ];

  const ActiveMegaMenuComponent = activeMegaMenu ? MEGA_MENU_COMPONENTS[activeMegaMenu] : null;

  // Don't render header content until auth check is complete? (Optional, prevents flicker)
  // if (loadingAuth) {
  //    return <header className="h-20 bg-white border-b border-gray-200"></header>; // Placeholder
  // }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2">
          {/* ... banner content ... */}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => { onNavigate('home'); setActiveMegaMenu(null); }}
                className="flex flex-col items-start"
              >
                 {/* ... logo content ... */}
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
                      onFocus={() => item.hasMegaMenu && setActiveMegaMenu(item.id)} // Keep accessibility
                      onBlur={(e) => { // Improved blur handling for nested focus
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setActiveMegaMenu(null);
                          }
                      }}
                      tabIndex={-1} // Allow div to receive focus for keyboard nav
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

            {/* Action Buttons (Login/Signup/Account) */}
            <div className="flex items-center space-x-4">
              {/* Show loading indicator briefly? or just rely on state change */}
              {!loadingAuth && ( // Only render button when auth status known
                <button
                    onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'login')} // Go to LOGIN if not logged in
                    className="hidden lg:flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                    <User className="w-5 h-5" />
                    <span>{isLoggedIn ? 'Mon Compte' : 'Connexion'}</span> {/* Changed Signup to Connexion */}
                </button>
              )}
               {/* Optional: Add Signup button separately if needed */}
               {/* {!isLoggedIn && !loadingAuth && ( <button onClick={() => onNavigate('signup')} ...>S'inscrire</button> )} */}

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
          {/* Menu Mobile */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              {navigation.map((item) => { // Start of map
                  const Icon = item.icon;
                  // Explicitly return the button element for each item
                  return ( 
                    <button
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
                  ); // End of return
              })} {/* End of map */}
              
              {/* Mobile Account Button (should be outside the map) */}
              {!loadingAuth && ( 
                  <button
                    onClick={() => { onNavigate(isLoggedIn ? 'dashboard' : 'login'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <User className="w-5 h-5" />
                    <span>{isLoggedIn ? 'Mon Compte' : 'Connexion'}</span>
                  </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mega Menus */}
      {/* IMPORTANT: Make sure LearnMegaMenu, NewsMegaMenu, MarketsMegaMenu are also updated */}
      {/* to use fetch instead of Supabase if they load dynamic data */}
      {ActiveMegaMenuComponent && (
        <ActiveMegaMenuComponent
          onNavigate={(page: string) => { onNavigate(page); setActiveMegaMenu(null); }}
          // Pass isLoggedIn status if menus need it
          // isLoggedIn={isLoggedIn} 
        />
      )}
    </>
  );
}