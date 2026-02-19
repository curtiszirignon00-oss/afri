import { TrendingUp, BookOpen, User, Menu, X, BarChart3, LogOut, LayoutDashboard, Activity, Users, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LearnMegaMenu, NewsMegaMenu, MarketsMegaMenu, CommunityMegaMenu } from './MegaMenus';
import NotificationDropdown from './notifications/NotificationDropdown';
import { useUnseenCommunityCount } from '../hooks/useCommunityUnseen';

// --- MegaMenu Mapping ---
const MEGA_MENU_COMPONENTS: { [key: string]: React.FC<any> } = {
  learn: LearnMegaMenu,
  news: NewsMegaMenu,
  markets: MarketsMegaMenu,
  community: CommunityMegaMenu,
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  // ✅ Hooks React Router
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.replace('/', '') || 'home';

  // ✅ Utilisation du hook useAuth
  const { isLoggedIn, logout, loading, userProfile } = useAuth();

  // Unseen community posts count
  const { data: unseenCount } = useUnseenCommunityCount();

  // ✅ Fonction de déconnexion simplifiée
  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
    navigate('/');
  };

  const navigation = [
    { name: 'Apprendre', id: 'learn', icon: BookOpen, hasMegaMenu: true },
    { name: 'Marchés', id: 'markets', icon: BarChart3, hasMegaMenu: true },
    { name: 'Actualités', id: 'news', icon: TrendingUp, hasMegaMenu: true },
    { name: 'Communauté', id: 'community', icon: Users, hasMegaMenu: true },
  ];

  const ActiveMegaMenuComponent = activeMegaMenu ? MEGA_MENU_COMPONENTS[activeMegaMenu] : null;

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => { navigate('/'); setActiveMegaMenu(null); }}
                className="flex flex-col items-start"
              >
                <div className="flex items-center space-x-2">
                  <img
                    src="/images/logo_afribourse.png"
                    alt="AfriBourse Logo"
                    className="w-12 h-12 object-contain"
                  />
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
                      onClick={() => { navigate(`/${item.id}`); setActiveMegaMenu(null); }}
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
                      {item.id === 'community' && isLoggedIn && !!unseenCount && unseenCount > 0 && (
                        <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {unseenCount > 99 ? '99+' : unseenCount}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* Action Buttons (Login/Signup/Account/Logout) */}
            <div className="flex items-center space-x-4">

              {/* Notification Bell - Only for logged in users */}
              {!loading && isLoggedIn && (
                <div className="hidden lg:block">
                  <NotificationDropdown />
                </div>
              )}

              {/* Desktop Account/Login Button */}
              {!loading && (
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
                      onClick={() => navigate('/login')}
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
                        onClick={() => { navigate('/dashboard'); setAccountMenuOpen(false); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Tableau de bord</span>
                      </button>

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={() => { navigate('/profile'); setAccountMenuOpen(false); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Mon Profil</span>
                      </button>

                      <button
                        onClick={() => { navigate('/subscriptions'); setAccountMenuOpen(false); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Abonnements</span>
                      </button>

                      {/* Admin Links - Only visible for admin users */}
                      {userProfile?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>

                          <button
                            onClick={() => { navigate('/admin/dashboard'); setAccountMenuOpen(false); }}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                          >
                            <BarChart3 className="w-4 h-4" />
                            <span>Admin Dashboard</span>
                          </button>

                          <button
                            onClick={() => { navigate('/admin/analytics'); setAccountMenuOpen(false); }}
                            className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                          >
                            <Activity className="w-4 h-4" />
                            <span>Analytics</span>
                          </button>
                        </>
                      )}

                      <div className="border-t border-gray-100 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
                
              {/* Mobile Notification Bell - visible next to hamburger */}
              {!loading && isLoggedIn && (
                <div className="lg:hidden">
                  <NotificationDropdown />
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Panel */}
          {mobileMenuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(`/${item.id}`);
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
                    {item.id === 'community' && isLoggedIn && !!unseenCount && unseenCount > 0 && (
                      <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unseenCount > 99 ? '99+' : unseenCount}
                      </span>
                    )}
                  </button>
                );
              })}
              
              {/* Mobile Account Actions */}
              {!loading && (
                <>
                  <button
                    onClick={() => {
                      navigate(isLoggedIn ? '/dashboard' : '/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <User className="w-5 h-5" />
                    <span>{isLoggedIn ? 'Mon Compte' : 'Connexion'}</span>
                  </button>

                  {isLoggedIn && (
                    <>
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                      >
                        <Settings className="w-5 h-5" />
                        <span>Mon Profil</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 border border-red-400 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold mt-2"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Déconnexion</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mega Menus - rendered inside the sticky wrapper so they attach to the header */}
      {ActiveMegaMenuComponent && (
        <div className="relative" onMouseLeave={() => setActiveMegaMenu(null)}>
          <ActiveMegaMenuComponent />
        </div>
      )}
    </div>
  );
}