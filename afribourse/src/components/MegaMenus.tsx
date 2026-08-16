import { GraduationCap, TrendingUp, TrendingDown, BarChart3, Newspaper, DollarSign, Eye, MessageCircle, Trophy, Award, Calendar, Users, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { BRVM_NEWS } from '../data/brvm2026News';

// --- Type Definitions ---
type MarketIndex = {
  id: string;
  index_name: string;
  index_value: number;
  daily_change_percent: number;
  // Add other fields if needed
};
// --- End Types ---

type MegaMenuProps = {};

// ---------------------------------------------------------------------------
// Vocabulaire visuel commun aux quatre mega menus
//
// Parti pris : des listes verticales denses, pas des cartes. Les lignes
// tenaient sur deux niveaux (titre + description) dans une boite de 16px de
// padding, avec une pastille d'icone de 40px ; l'aplat de survol couvrait donc
// toute la largeur de la colonne. Tout est ramene a une ligne simple.
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
 * Conteneur exterieur d'un mega menu : carte centree, pas un bandeau pleine
 * largeur. Le panneau se detache donc du header au lieu de barrer l'ecran.
 * `border-t-0` + `rounded-b-xl` : il reste accole au header, seuls ses trois
 * autres cotes sont dessines.
 */
const MENU_SHELL =
  'mx-auto w-full max-w-5xl bg-white border border-t-0 border-ink-100 ' +
  'rounded-b-xl shadow-xl z-40 overflow-hidden';

/** Interieur d'un mega menu. La largeur est deja bornee par MENU_SHELL. */
const MENU_INNER = 'px-6 py-6';

/** Encart des colonnes de droite. */
const MENU_PANEL = 'bg-ink-50 border border-ink-100 rounded-lg p-5';

/** Bouton d'action plein. */
const MENU_BTN =
  'bg-brand-navy text-white rounded-md hover:bg-brand-navy-hover transition-colors font-semibold';

/** Grille commune : colonnes espacees, lignes serrees. */
const MENU_GRID = 'grid md:grid-cols-3 gap-x-10 gap-y-6';

/** Pile de lignes jointives — les filets de MENU_ROW font la separation. */
const MENU_LIST = 'border-t border-ink-100';

/**
 * Liste repartie en deux colonnes. `columns-2` (multi-colonnes CSS) et non
 * `grid-cols-2` : le flux y est colonne par colonne, on descend la premiere
 * avant de reprendre en haut de la seconde — l'ordre de lecture de l'image de
 * reference. Une grille, elle, remplirait ligne par ligne.
 */
const MENU_LIST_2COL = `${MENU_LIST} sm:columns-2 sm:gap-x-8`;

/** Empeche une ligne d'etre coupee entre deux colonnes. */
const MENU_ROW_NOBREAK = 'break-inside-avoid';

// --- LearnMegaMenu ---
export function LearnMegaMenu() {
  const navigate = useNavigate();

  const PARCOURS: { label: string; icon: React.ElementType; onClick: () => void }[] = [
    { label: 'Débutant',      icon: GraduationCap, onClick: () => navigate('/learn', { state: { difficulty: 'debutant' } }) },
    { label: 'Intermédiaire', icon: BarChart3,     onClick: () => navigate('/learn', { state: { difficulty: 'intermediaire' } }) },
    { label: 'Avancé',        icon: TrendingUp,    onClick: () => navigate('/learn', { state: { difficulty: 'avance' } }) },
    { label: 'Time Machine',  icon: Clock,         onClick: () => navigate('/time-machine') },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        {/* L'encart promotionnel ayant été retiré, les parcours occupent toute
            la largeur du panneau — plus de grille à trois colonnes ici. */}
        <div>
          <h3 className={MENU_HEADING}>Parcours</h3>
          <div className={MENU_LIST_2COL}>
            {PARCOURS.map(({ label, icon: Icon, onClick }) => (
              <button key={label} onClick={onClick} className={`${MENU_ROW} ${MENU_ROW_NOBREAK}`}>
                <Icon className={MENU_ICON} />
                <span className="flex-1 font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END LearnMegaMenu ---

// Les categories ne se distinguent plus par la couleur mais par leur libelle :
// un seul aplat neutre pour toutes, conformement a la palette bleu/gris/noir.
const CAT_BADGE_CLS = 'bg-ink-100 text-ink-700';

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// --- NewsMegaMenu ---
export function NewsMegaMenu() {
  const navigate = useNavigate();

  const previewArticles = [...BRVM_NEWS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  const NAV_CATS: { label: string; icon: React.ElementType }[] = [
    { label: 'Tout',       icon: Newspaper  },
    { label: 'Marchés',    icon: TrendingUp },
    { label: 'Dividendes', icon: DollarSign },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <div className={MENU_GRID}>

          {/* Colonne 1 : navigation catégories */}
          <div>
            <h3 className={MENU_HEADING}>Catégories</h3>
            <div className={MENU_LIST}>
              {NAV_CATS.map(({ label, icon: Icon }) => (
                <button key={label} onClick={() => navigate('/news')} className={MENU_ROW}>
                  <Icon className={MENU_ICON} />
                  <span className="flex-1 font-medium">{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/news')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm ${MENU_BTN}`}
            >
              Toutes les actualités <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Colonnes 2-3 : aperçu des 3 derniers articles BRVM */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`${MENU_HEADING} mb-0`}>Intelligence de marché</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-navy/10 text-brand-navy border border-brand-navy/25">
                BRVM 2026
              </span>
            </div>

            <div className="space-y-1.5">
              {previewArticles.map(article => {
                const posCount = article.tickers.filter(t => t.impact === 'Positif').length;
                const negCount = article.tickers.filter(t => t.impact === 'Négatif').length;

                return (
                  <button
                    key={article.id}
                    onClick={() => navigate('/news')}
                    className="group w-full text-left px-3 py-2.5 bg-ink-50 hover:bg-white border border-transparent hover:border-ink-200 rounded-lg transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${CAT_BADGE_CLS}`}>
                            {article.category.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-ink-400">{fmtDateShort(article.publishedAt)}</span>
                        </div>
                        <p className="text-sm font-semibold text-ink-800 leading-snug line-clamp-2 group-hover:text-brand-navy transition-colors">
                          {article.title}
                        </p>
                      </div>
                      {/* Vert / rouge conserves : ils portent le sens (hausse / baisse),
                          ce ne sont pas des couleurs decoratives. */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {posCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                            <TrendingUp className="w-2.5 h-2.5" />{posCount}
                          </span>
                        )}
                        {negCount > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                            <TrendingDown className="w-2.5 h-2.5" />{negCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-2 text-[10px] text-ink-400 italic">
              Données issues des publications officielles BRVM · Usage éducatif uniquement.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
// --- END NewsMegaMenu ---

// --- MarketsMegaMenu ---
export function MarketsMegaMenu() {
  const navigate = useNavigate();
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch latest indices from backend API
  useEffect(() => {
    async function loadIndices() {
        setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/indices/latest?limit=2`); // Fetch latest 2
        if (response.ok) {
          const data: MarketIndex[] = await response.json();
          setIndices(data);
        } else {
           console.error("Failed to load latest indices");
           setIndices([]);
        }
      } catch (error) {
          console.error("Error fetching latest indices:", error);
          setIndices([]);
      } finally {
          setLoading(false);
      }
    }
    loadIndices();
  }, []); // Run once on mount

  // Helper function
  function formatIndexValue(num: number | null | undefined): string {
      if (num === null || num === undefined) return 'N/A';
      return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  }

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <div className={MENU_GRID}>

          {/* Colonne 1 : navigation */}
          <div>
            <h3 className={MENU_HEADING}>Navigation</h3>
            <div className={MENU_LIST}>
              <button onClick={() => navigate('/markets')} className={MENU_ROW}>
                <BarChart3 className={MENU_ICON} />
                <span className="flex-1 font-medium">Actions</span>
              </button>
              <button onClick={() => navigate('/markets')} className={MENU_ROW}>
                <TrendingUp className={MENU_ICON} />
                <span className="flex-1 font-medium">Screener</span>
              </button>
            </div>
          </div>

          {/* Colonnes 2-3 : indices */}
          <div className="md:col-span-2">
            <div className={MENU_PANEL}>
              <h3 className={MENU_HEADING}>Indices BRVM</h3>
              {loading ? (
                <div className="grid md:grid-cols-2 gap-3 min-h-[80px] items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-navy" />
                </div>
              ) : indices.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {indices.map((index) => (
                    <div key={index.id} className="bg-white rounded-md p-3 shadow-sm">
                      <p className="text-xs text-ink-500 mb-1 truncate">{index.index_name}</p>
                      <div className="flex items-end justify-between">
                        <p className="text-lg font-bold text-ink-900">{formatIndexValue(index.index_value)}</p>
                        {/* Vert / rouge conserves : variation de l'indice, couleur porteuse de sens. */}
                        <div className={`flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${ index.daily_change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' }`}>
                          {index.daily_change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span>{index.daily_change_percent >= 0 ? '+' : ''}{index.daily_change_percent?.toFixed(2) ?? '0.00'}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-500 text-center py-3">Impossible de charger les indices.</p>
              )}
              <button onClick={() => navigate('/markets')} className={`mt-4 w-full px-5 py-2 text-sm ${MENU_BTN}`}>
                Voir toutes les cotations
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
// --- END MarketsMegaMenu ---


// --- StartupsMegaMenu (Can be removed if you removed startups) ---
// export function StartupsMegaMenu({ navigate }: MegaMenuProps) { ... }


// --- PortfolioMegaMenu ---
export function PortfolioMegaMenu() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const go = () => navigate(isLoggedIn ? 'dashboard' : 'login');

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <div className={MENU_GRID}>

          <div>
            <h3 className={MENU_HEADING}>Mes Outils</h3>
            <div className={MENU_LIST}>
              <button onClick={go} className={MENU_ROW}>
                <BarChart3 className={MENU_ICON} />
                <span className="flex-1 font-medium">Mon Portefeuille</span>
              </button>
              <button onClick={go} className={MENU_ROW}>
                <Eye className={MENU_ICON} />
                <span className="flex-1 font-medium">Ma Watchlist</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className={`${MENU_PANEL} h-full flex flex-col justify-between`}>
              <div>
                <h3 className="text-xl font-bold text-ink-900 mb-2">Suivez vos simulations</h3>
                <p className="text-sm text-ink-600 mb-5">Créez votre portefeuille virtuel gratuit...</p>
              </div>
              <button onClick={go} className={`px-5 py-2 text-sm self-start ${MENU_BTN}`}>
                {isLoggedIn ? 'Accéder au Dashboard' : 'Connectez-vous'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- CommunityMegaMenu ---
export function CommunityMegaMenu() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const gated = (path: string) => () => navigate(isLoggedIn ? path : '/login');

  const COMMUNAUTE: { label: string; icon: React.ElementType; onClick: () => void }[] = [
    { label: 'Feed Social',       icon: MessageCircle, onClick: () => navigate('/community') },
    { label: 'Groupes',           icon: Users,         onClick: () => navigate('/communities') },
    { label: 'Challenge Trading', icon: Trophy,        onClick: gated('/challenge/community') },
  ];

  const ACTIVITES: { label: string; icon: React.ElementType; onClick: () => void }[] = [
    { label: 'Badges & XP',  icon: Award,     onClick: gated('/achievements') },
    { label: 'Événements',   icon: Calendar,  onClick: () => navigate('/events') },
    { label: 'Classement',   icon: BarChart3, onClick: gated('/challenge/community') },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className={MENU_INNER}>
        <div className={MENU_GRID}>

          <div>
            <h3 className={MENU_HEADING}>Communauté</h3>
            <div className={MENU_LIST}>
              {COMMUNAUTE.map(({ label, icon: Icon, onClick }) => (
                <button key={label} onClick={onClick} className={MENU_ROW}>
                  <Icon className={MENU_ICON} />
                  <span className="flex-1 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className={MENU_HEADING}>Activités</h3>
            <div className={MENU_LIST}>
              {ACTIVITES.map(({ label, icon: Icon, onClick }) => (
                <button key={label} onClick={onClick} className={MENU_ROW}>
                  <Icon className={MENU_ICON} />
                  <span className="flex-1 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colonne 3 : promotion */}
          <div>
            <div className={`${MENU_PANEL} h-full flex flex-col justify-between`}>
              <div>
                <div className="inline-block px-2.5 py-0.5 bg-brand-navy text-white rounded-full text-xs font-medium mb-3">
                  Challenge 2026
                </div>
                <h3 className="text-base font-bold text-ink-900 mb-2">Participez au Challenge Trading</h3>
                <ul className="space-y-1 text-sm text-ink-600">
                  <li className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-brand-navy" />Classement en temps réel</li>
                  <li className="flex items-center gap-2"><Award className="w-3.5 h-3.5 text-brand-navy" />100+ badges à débloquer</li>
                  <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-brand-navy" />Communauté active</li>
                </ul>
              </div>
              <button onClick={gated('/challenge/community')} className={`mt-4 px-5 py-2 text-sm ${MENU_BTN}`}>
                {isLoggedIn ? 'Rejoindre le Challenge' : 'Se connecter pour participer'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
// --- END CommunityMegaMenu ---

// --- SGIMegaMenu (Can be removed if you removed SGI focus) ---
// export function SGIMegaMenu({ navigate }: MegaMenuProps) { ... }
