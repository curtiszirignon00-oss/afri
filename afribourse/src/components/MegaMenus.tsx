import { GraduationCap, TrendingUp, BarChart3, Newspaper, DollarSign, Eye, MessageCircle, Trophy, Award, Calendar, Users, ChevronRight, Clock, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React from 'react';

// ---------------------------------------------------------------------------
// Vocabulaire visuel commun aux quatre mega menus
//
// Parti pris : un panneau etroit, une seule colonne de liens. Les encarts de
// droite (apercu d'articles, cotations, promotion du challenge) etiraient le
// panneau sur toute la largeur de l'ecran pour trois ou quatre destinations ;
// ils ont ete retires. Ce qui reste est un sous-menu, pas une page.
//
// Le survol est defini ici et nulle part ailleurs, pour que les quatre menus
// reagissent a l'identique.
//
// Palette limitee au logo : brand-navy pour l'accent, echelle ink pour les
// gris et les noirs. Aucune couleur decorative.
// ---------------------------------------------------------------------------

/**
 * Ligne de liste : bande pleine largeur separee de la suivante par un filet,
 * sans coin arrondi. L'aplat de survol occupe toute la ligne, jusqu'au filet.
 * Le fond reste neutre, seul le texte prend l'accent.
 */
const MENU_ROW =
  'group flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm ' +
  'border-b border-ink-100 text-ink-700 transition-colors hover:bg-ink-50 hover:text-brand-navy';

/** Icone de ligne : discrete au repos, elle suit l'accent au survol. */
const MENU_ICON =
  'w-4 h-4 shrink-0 text-ink-400 transition-colors group-hover:text-brand-navy';

/** Intitule de colonne. */
const MENU_HEADING = 'text-[11px] font-semibold text-ink-400 uppercase tracking-wider mb-2';

/**
 * Conteneur exterieur : panneau etroit accroche sous l'onglet.
 * `border-t-0` + `rounded-b-xl` : il reste accole au header, seuls ses trois
 * autres cotes sont dessines.
 */
const MENU_SHELL =
  'w-[264px] bg-white border border-t-0 border-ink-100 rounded-b-xl shadow-xl overflow-hidden';

/** Interieur d'un mega menu. */
const MENU_INNER = 'px-4 py-4';

/** Bouton d'action plein. */
const MENU_BTN =
  'bg-brand-navy text-white rounded-md hover:bg-brand-navy-hover transition-colors font-semibold';

/** Pile de lignes jointives — les filets de MENU_ROW font la separation. */
const MENU_LIST = 'border-t border-ink-100';

type MenuItem = { label: string; icon: React.ElementType; onClick: () => void };

/** Groupe : un intitule, puis ses lignes. */
function MenuGroup({ title, items, className = '' }: { title: string; items: MenuItem[]; className?: string }) {
  return (
    <div className={className}>
      <h3 className={MENU_HEADING}>{title}</h3>
      <div className={MENU_LIST}>
        {items.map(({ label, icon: Icon, onClick }) => (
          <button key={label} onClick={onClick} className={MENU_ROW}>
            <Icon className={MENU_ICON} />
            <span className="flex-1 font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- LearnMegaMenu ---
export function LearnMegaMenu() {
  const navigate = useNavigate();

  const PARCOURS: MenuItem[] = [
    { label: 'Débutant',      icon: GraduationCap, onClick: () => navigate('/learn', { state: { difficulty: 'debutant' } }) },
    { label: 'Intermédiaire', icon: BarChart3,     onClick: () => navigate('/learn', { state: { difficulty: 'intermediaire' } }) },
    { label: 'Avancé',        icon: TrendingUp,    onClick: () => navigate('/learn', { state: { difficulty: 'avance' } }) },
    { label: 'Time Machine',  icon: Clock,         onClick: () => navigate('/time-machine') },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <MenuGroup title="Parcours" items={PARCOURS} />
      </div>
    </div>
  );
}
// --- END LearnMegaMenu ---

// --- NewsMegaMenu ---
export function NewsMegaMenu() {
  const navigate = useNavigate();

  const NAV_CATS: MenuItem[] = [
    { label: 'Tout',       icon: Newspaper,  onClick: () => navigate('/news') },
    { label: 'Marchés',    icon: TrendingUp, onClick: () => navigate('/news') },
    { label: 'Dividendes', icon: DollarSign, onClick: () => navigate('/news') },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <MenuGroup title="Catégories" items={NAV_CATS} />
        <button
          onClick={() => navigate('/news')}
          className={`mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm ${MENU_BTN}`}
        >
          Toutes les actualités <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
// --- END NewsMegaMenu ---

// --- MarketsMegaMenu ---
export function MarketsMegaMenu() {
  const navigate = useNavigate();

  const NAV: MenuItem[] = [
    { label: 'Actions', icon: BarChart3, onClick: () => navigate('/markets') },
    { label: 'Indices', icon: Activity,  onClick: () => navigate('/indices') },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <MenuGroup title="Navigation" items={NAV} />
        <button
          onClick={() => navigate('/markets')}
          className={`mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm ${MENU_BTN}`}
        >
          Voir les cotations <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
// --- END MarketsMegaMenu ---

// --- PortfolioMegaMenu ---
export function PortfolioMegaMenu() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const go = () => navigate(isLoggedIn ? 'dashboard' : 'login');

  const OUTILS: MenuItem[] = [
    { label: 'Mon Portefeuille', icon: BarChart3, onClick: go },
    { label: 'Ma Watchlist',     icon: Eye,       onClick: go },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <MenuGroup title="Mes outils" items={OUTILS} />
        <button onClick={go} className={`mt-4 w-full px-4 py-2 text-sm ${MENU_BTN}`}>
          {isLoggedIn ? 'Accéder au Dashboard' : 'Se connecter'}
        </button>
      </div>
    </div>
  );
}

// --- CommunityMegaMenu ---
export function CommunityMegaMenu() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const gated = (path: string) => () => navigate(isLoggedIn ? path : '/login');

  const COMMUNAUTE: MenuItem[] = [
    { label: 'Feed Social',       icon: MessageCircle, onClick: () => navigate('/community') },
    { label: 'Groupes',           icon: Users,         onClick: () => navigate('/communities') },
    { label: 'Challenge Trading', icon: Trophy,        onClick: gated('/challenge/community') },
  ];

  const ACTIVITES: MenuItem[] = [
    { label: 'Badges & XP',  icon: Award,     onClick: gated('/achievements') },
    { label: 'Événements',   icon: Calendar,  onClick: () => navigate('/events') },
    { label: 'Classement',   icon: BarChart3, onClick: gated('/challenge/community') },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <MenuGroup title="Communauté" items={COMMUNAUTE} />
        <MenuGroup title="Activités" items={ACTIVITES} className="mt-5" />
      </div>
    </div>
  );
}
// --- END CommunityMegaMenu ---
