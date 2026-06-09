import { useLocation, useNavigate } from 'react-router-dom';
import { Users, BarChart2, LayoutDashboard, Newspaper, GraduationCap } from 'lucide-react';
import { useUnseenCommunityCount } from '../hooks/useCommunityUnseen';
import { useUnseenNewsCount, useUnseenCommunityPublicCount } from '../hooks/useContentUnseen';
import { useAuth } from '../contexts/AuthContext';

const TABS = [
  { key: 'community', label: 'Communauté', icon: Users,            path: '/community' },
  { key: 'markets',   label: 'Marché',      icon: BarChart2,        path: '/markets'   },
  { key: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard,  path: '/dashboard' },
  { key: 'news',      label: 'Actualité',   icon: Newspaper,        path: '/news'      },
  { key: 'learn',     label: 'Apprendre',   icon: GraduationCap,    path: '/learn'     },
];

export default function MobileBottomNav() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isLoggedIn } = useAuth();

  const { data: unseenCommunityCount } = useUnseenCommunityCount(isLoggedIn);
  const unseenCommunityPublic          = useUnseenCommunityPublicCount(!isLoggedIn);
  const unseenNewsCount                = useUnseenNewsCount();

  const communityBadge = isLoggedIn ? (unseenCommunityCount ?? 0) : unseenCommunityPublic;

  const badges: Record<string, number> = {
    community: communityBadge,
    news:      unseenNewsCount,
  };

  const active = TABS.findIndex(t => location.pathname.startsWith(t.path));

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-slate-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {TABS.map((tab, idx) => {
          const isActive    = idx === active;
          const Icon        = tab.icon;
          const badge       = badges[tab.key] ?? 0;
          const isCenter    = tab.key === 'dashboard';

          return (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'dashboard' && !isLoggedIn) {
                  navigate('/login');
                } else {
                  navigate(tab.path);
                }
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 relative cursor-pointer transition-colors duration-150 ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label={tab.label}
            >
              {/* Indicateur actif */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600" />
              )}

              {/* Icône centrale surélevée */}
              {isCenter ? (
                <span className={`w-12 h-12 -mt-5 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 shadow-indigo-200'
                    : 'bg-slate-800 shadow-slate-300'
                }`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
                </span>
              ) : (
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center px-0.5 text-[9px] font-bold leading-none text-white bg-red-500 rounded-full">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
              )}

              <span className={`text-[10px] font-medium leading-none ${isCenter ? 'mt-1' : ''} ${isActive ? 'text-indigo-600' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
