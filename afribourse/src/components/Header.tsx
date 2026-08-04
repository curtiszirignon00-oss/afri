import { TrendingUp, BookOpen, User, BarChart3, LogOut, LayoutDashboard, Activity, Users, Settings, Star, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import React, { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LearnMegaMenu, NewsMegaMenu, MarketsMegaMenu, CommunityMegaMenu } from './MegaMenus';
import NotificationDropdown from './notifications/NotificationDropdown';
import EmailVerificationBanner from './EmailVerificationBanner';
import { useUnseenCommunityCount } from '../hooks/useCommunityUnseen';
import { BTN_BASE, BTN_VARIANTS } from './ui/buttonStyles';
import {
  useUnseenNewsCount,
  markNewsVisited,
  useUnseenCommunityPublicCount,
  markCommunityVisited,
} from '../hooks/useContentUnseen';

// Badge compact pour les indicateurs de nouveauté
function Badge({ count }: { count: number }) {
  const label = count > 99 ? '99+' : String(count);
  return (
    <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full ring-2 ring-white">
      {label}
    </span>
  );
}

// Boutons d'action du header. La forme et les couleurs viennent de
// ui/buttonStyles, partage avec <Button> : le header et les CTA du hero
// forment ainsi une seule paire orange + aplat contrastant. Ne reste ici que
// la taille, plus compacte que celle du hero.
const HEADER_BTN = `${BTN_BASE} gap-2 h-10 px-5 text-sm cursor-pointer`;

// --- MegaMenu Mapping ---
const MEGA_MENU_COMPONENTS: { [key: string]: React.FC<any> } = {
  learn: LearnMegaMenu,
  news: NewsMegaMenu,
  markets: MarketsMegaMenu,
  community: CommunityMegaMenu,
};

export default function Header() {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileAccountOpen, setMobileAccountOpen] = useState(false);

  // ✅ Hooks React Router
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.replace('/', '') || 'home';

  // ✅ Utilisation du hook useAuth
  const { isLoggedIn, logout, loading, userProfile } = useAuth();

  // Badges de nouveauté
  const { data: unseenCommunityCount } = useUnseenCommunityCount(isLoggedIn);
  const unseenCommunityPublic          = useUnseenCommunityPublicCount(!isLoggedIn);
  const unseenNewsCount                = useUnseenNewsCount();

  // Compte effectif selon l'état de connexion
  const communityBadge = isLoggedIn ? (unseenCommunityCount ?? 0) : unseenCommunityPublic;

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

  // Mesure la hauteur réelle du bloc fixe (bannière + header) et l'expose en variable CSS.
  // Le <main> l'utilise comme padding-top → pas de chevauchement ni de saut quand la bannière
  // apparaît/disparaît. useLayoutEffect + ResizeObserver garantissent une mesure avant paint.
  const topBlockRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = topBlockRef.current;
    if (!el) return;
    const setHeight = () => {
      document.documentElement.style.setProperty('--app-top-h', `${el.offsetHeight}px`);
    };
    setHeight();
    const ro = new ResizeObserver(setHeight);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--app-top-h');
    };
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-50" translate="no">
      {/* Bloc mesuré = bannière + header uniquement (exclut les mega menus pour ne pas gonfler --app-top-h) */}
      <div ref={topBlockRef}>
      {/* Bandeau vérification email — dans le bloc fixe, au-dessus du header (retourne null si email vérifié) */}
      {isLoggedIn && <EmailVerificationBanner />}

      <header className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => { navigate('/'); setActiveMegaMenu(null); }}
                className="flex items-center gap-0.5 cursor-pointer"
                aria-label="AfriBourse — accueil"
              >
                <img
                  src="/images/logo_afribourse.png"
                  alt=""
                  aria-hidden="true"
                  className="w-11 h-11 object-contain"
                />
                {/* Logotype : bicolore d'apres le logo (silhouette orange / barres bleu nuit) */}
                <span className="font-display text-2xl font-bold tracking-tight leading-none">
                  <span className="text-brand-navy">Afri</span><span className="text-brand-orange">Bourse</span>
                </span>
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
                      onClick={() => {
                        navigate(`/${item.id}`);
                        setActiveMegaMenu(null);
                        if (item.id === 'news')      markNewsVisited();
                        if (item.id === 'community') markCommunityVisited();
                      }}
                      className={`relative px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 cursor-pointer hover:bg-brand-navy/10 hover:text-brand-navy ${
                        currentPage === item.id
                          ? 'text-ink-900 font-semibold'
                          : activeMegaMenu === item.id
                            ? 'bg-brand-navy/10 text-brand-navy font-medium'
                            : 'text-ink-600 font-medium'
                      }`}
                      aria-haspopup={item.hasMegaMenu ? "true" : "false"}
                      aria-expanded={activeMegaMenu === item.id}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                      {item.id === 'news' && unseenNewsCount > 0 && (
                        <Badge count={unseenNewsCount} />
                      )}
                      {item.id === 'community' && communityBadge > 0 && (
                        <Badge count={communityBadge} />
                      )}
                      {/* Seul accent orange du header : il dit ou l'on se trouve.
                          Absent au survol d'un mega menu, qui est une exploration
                          et non une position. */}
                      {currentPage === item.id && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-brand-orange-dark"
                        />
                      )}
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* Action Buttons (Login/Signup/Account/Logout) */}
            <div className="flex items-center space-x-4">

              {/* Bouton Webinaire - Desktop */}
              <Link
                to="/webinaires"
                className={`${HEADER_BTN} ${BTN_VARIANTS.orange} hidden lg:inline-flex`}
              >
                <Video className="w-4 h-4" />
                <span>Webinaires</span>
              </Link>

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
                    <div className="flex items-center space-x-2">
                      {/* Bouton Profil */}
                      <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-brand-navy/25 hover:border-brand-navy transition-all shadow-sm cursor-pointer"
                        title="Mon Profil"
                      >
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand-navy/10 flex items-center justify-center">
                            <User className="w-5 h-5 text-brand-navy" />
                          </div>
                        )}
                      </button>
                      {/* Bouton Mon Compte */}
                      <button
                        onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                        className={`${HEADER_BTN} ${BTN_VARIANTS.navyOutline}`}
                      >
                        <span>Mon Compte</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className={`${HEADER_BTN} ${BTN_VARIANTS.navy}`}
                    >
                      <User className="w-4 h-4 opacity-70" />
                      <span>Se connecter</span>
                    </button>
                  )}
                  
                  {/* Dropdown Menu (Desktop) */}
                  {isLoggedIn && accountMenuOpen && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-ink-100 rounded-lg shadow-lg py-1"
                      onMouseLeave={() => setAccountMenuOpen(false)}
                    >
                      <button
                        onClick={() => { navigate('/dashboard'); setAccountMenuOpen(false); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Tableau de bord</span>
                      </button>

                      <button
                        onClick={() => { navigate('/watchlist'); setAccountMenuOpen(false); }}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <Star className="w-4 h-4 text-amber-400" />
                        <span>Ma Watchlist</span>
                      </button>

                      {/* Admin Links - Only visible for admin users */}
                      {userProfile?.role === 'admin' && (
                        <>
                          <div className="border-t border-ink-100 my-1"></div>

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

                      <div className="border-t border-ink-100 my-1"></div>

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
                
              {/* Mobile — cloche notifs si connecté */}
              {!loading && isLoggedIn && (
                <div className="lg:hidden">
                  <NotificationDropdown />
                </div>
              )}

              {/* Mobile — bouton Se connecter / avatar profil */}
              {!loading && (
                <div className="lg:hidden relative">
                  {isLoggedIn ? (
                    <>
                      <button
                        onClick={() => setMobileAccountOpen(o => !o)}
                        className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-ink-200 active:border-brand-navy transition-all cursor-pointer"
                        aria-label="Mon compte"
                      >
                        {userProfile?.avatar_url ? (
                          <img src={userProfile.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-ink-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-brand-navy" />
                          </div>
                        )}
                      </button>

                      {/* Mini-menu mobile */}
                      {mobileAccountOpen && (
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setMobileAccountOpen(false)}
                          />
                          <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-ink-100 rounded-xl shadow-xl py-1 z-50">
                            <button
                              onClick={() => { navigate('/profile'); setMobileAccountOpen(false); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 cursor-pointer"
                            >
                              <User className="w-4 h-4 text-ink-400" />
                              Mon profil
                            </button>
                            <button
                              onClick={() => { navigate('/webinaires'); setMobileAccountOpen(false); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 cursor-pointer"
                            >
                              <Video className="w-4 h-4 text-ink-400" />
                              Webinaires
                            </button>
                            <div className="border-t border-ink-100 my-1" />
                            <button
                              onClick={() => { handleLogout(); setMobileAccountOpen(false); }}
                              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              Déconnexion
                            </button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-ink-300 text-ink-700 bg-transparent rounded-lg text-sm font-semibold hover:border-brand-navy hover:text-brand-navy transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      Se connecter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </header>
      </div>

      {/* Mega Menus - rendered inside the sticky wrapper so they attach to the header */}
      {ActiveMegaMenuComponent && (
        <div className="relative" onMouseLeave={() => setActiveMegaMenu(null)}>
          <ActiveMegaMenuComponent />
        </div>
      )}
    </div>
  );
}