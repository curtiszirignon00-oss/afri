import { BookOpen, GraduationCap, TrendingUp, TrendingDown, BarChart3, Newspaper, Globe, DollarSign, Eye, MessageCircle, Trophy, Award, Calendar, Users, ChevronRight, Clock } from 'lucide-react';
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
// Le survol est defini ici et nulle part ailleurs : les menus reprenaient
// chacun leur propre teinte (hover:bg-blue-50 d'un cote, hover:bg-slate-50 de
// l'autre). La reference est la ligne de categorie d'Actualites — aplat
// discret, texte qui se fonce, aucun deplacement.
//
// Palette limitee au logo : brand-navy pour l'accent, echelle ink pour les
// gris et les noirs. Aucune couleur decorative (vert, ambre, violet, teal).
// ---------------------------------------------------------------------------

/** Ligne cliquable d'un mega menu. Completer par l'alignement et le padding. */
const MENU_ROW =
  'group w-full flex text-left rounded-lg transition-colors hover:bg-brand-navy/10';

/** Ligne sur deux niveaux (titre + description). */
const MENU_ROW_STACKED = `${MENU_ROW} items-start gap-3 p-4`;

/** Ligne compacte sur un seul niveau — le format d'Actualites. */
const MENU_ROW_COMPACT = `${MENU_ROW} items-center gap-3 px-3 py-2.5`;

/** Pastille d'icone : neutre au repos, teintee du bleu du logo au survol. */
const MENU_TILE =
  'flex-shrink-0 rounded-lg flex items-center justify-center bg-ink-100 text-brand-navy transition-colors group-hover:bg-brand-navy/15';

/** Intitule de colonne. */
const MENU_HEADING = 'text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3';

/** Conteneur exterieur d'un mega menu. */
const MENU_SHELL = 'w-full bg-white shadow-xl border-t border-ink-100 z-40';

/** Encart promotionnel des colonnes de droite. */
const MENU_PANEL = 'bg-ink-50 border border-ink-100 rounded-xl p-6';

/** Bouton d'action plein. */
const MENU_BTN =
  'bg-brand-navy text-white rounded-lg hover:bg-brand-navy-hover transition-colors font-semibold';

/** Pastille "NOUVEAU" et autres marqueurs discrets. */
const MENU_CHIP = 'text-[9px] font-bold bg-brand-navy/10 text-brand-navy px-1.5 py-0.5 rounded-full';

// --- LearnMegaMenu (No changes needed, it's static) ---
export function LearnMegaMenu() {
  const navigate = useNavigate();
  return (
    <div className={MENU_SHELL}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... Learn menu content ... */}
         <div className="grid md:grid-cols-3 gap-8">
             {/* Column 1: Links */}
             <div className="space-y-1">
               <h3 className={MENU_HEADING}>Parcours</h3>
               {/* Beginner */}
               <button onClick={() => navigate('/learn', { state: { difficulty: 'debutant' } })} className={MENU_ROW_STACKED}> <div className={`${MENU_TILE} w-10 h-10`}><GraduationCap className="w-6 h-6" /></div> <div> <h4 className="font-semibold text-ink-900 mb-1">Débutant</h4> <p className="text-sm text-ink-600">Les bases de la BRVM.</p> </div> </button>
               {/* Intermediate */}
               <button onClick={() => navigate('/learn', { state: { difficulty: 'intermediaire' } })} className={MENU_ROW_STACKED}> <div className={`${MENU_TILE} w-10 h-10`}><BarChart3 className="w-6 h-6" /></div> <div> <h4 className="font-semibold text-ink-900 mb-1">Intermédiaire</h4> <p className="text-sm text-ink-600">Approfondir.</p> </div> </button>
               {/* Advanced */}
               <button onClick={() => navigate('/learn', { state: { difficulty: 'avance' } })} className={MENU_ROW_STACKED}> <div className={`${MENU_TILE} w-10 h-10`}><TrendingUp className="w-6 h-6" /></div> <div> <h4 className="font-semibold text-ink-900 mb-1">Avancé</h4> <p className="text-sm text-ink-600">Maîtriser.</p> </div> </button>
               {/* Time Machine */}
               <button onClick={() => navigate('/time-machine')} className={`${MENU_ROW_STACKED} border border-ink-200 bg-ink-50`}> <div className={`${MENU_TILE} w-10 h-10`}><Clock className="w-6 h-6" /></div> <div> <div className="flex items-center gap-2 mb-0.5"><h4 className="font-semibold text-ink-900">Time Machine</h4><span className={MENU_CHIP}>NOUVEAU</span></div> <p className="text-sm text-ink-600">Rejouer l'histoire BRVM.</p> </div> </button>
             </div>
             {/* Column 2 & 3: Promotion */}
             <div className="md:col-span-2"> <div className={`${MENU_PANEL} h-full flex flex-col justify-between`}> <div> <div className="inline-block px-3 py-1 bg-brand-navy text-white rounded-full text-sm font-medium mb-4">Populaire</div> <h3 className="text-2xl font-bold text-ink-900 mb-4">Commencez votre voyage</h3> <p className="text-ink-700 mb-6">Rejoignez des milliers d'investisseurs...</p> </div> <div className="flex items-center space-x-4"> <button onClick={() => navigate('/learn')} className={`px-6 py-3 ${MENU_BTN}`}>Démarrer</button> <div className="flex items-center space-x-2 text-sm text-ink-600"><BookOpen className="w-5 h-5" /><span>15+ modules gratuits</span></div> </div> </div> </div>
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

  const NAV_CATS: { label: string; icon: React.ElementType; isNew?: boolean }[] = [
    { label: 'Tout',           icon: Newspaper  },
    { label: 'Marchés',        icon: TrendingUp },
    { label: 'Analyse',        icon: BarChart3  },
    { label: 'Économie',       icon: Globe      },
    { label: 'Dividendes',     icon: DollarSign, isNew: true },
    { label: 'Résultats 2025', icon: BarChart3  },
  ];

  return (
    <div className={MENU_SHELL}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Colonne 1 : navigation catégories */}
          <div>
            <h3 className={MENU_HEADING}>Catégories</h3>
            <div className="space-y-0.5">
              {NAV_CATS.map(({ label, icon: Icon, isNew }) => (
                <button
                  key={label}
                  onClick={() => navigate('/news')}
                  className={MENU_ROW_COMPACT}
                >
                  <div className={`${MENU_TILE} w-8 h-8`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-ink-800 group-hover:text-ink-900">{label}</span>
                  {isNew && <span className={MENU_CHIP}>NOUVEAU</span>}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/news')}
              className={`mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm ${MENU_BTN}`}
            >
              Toutes les actualités <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Colonnes 2-3 : aperçu des 3 derniers articles BRVM */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <h3 className={`${MENU_HEADING} mb-0`}>Intelligence de marché</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-brand-navy/10 text-brand-navy border border-brand-navy/25">
                BRVM 2026
              </span>
            </div>

            <div className="space-y-2">
              {previewArticles.map(article => {
                const posCount = article.tickers.filter(t => t.impact === 'Positif').length;
                const negCount = article.tickers.filter(t => t.impact === 'Négatif').length;

                return (
                  <button
                    key={article.id}
                    onClick={() => navigate('/news')}
                    className="group w-full text-left px-4 py-3 bg-ink-50 hover:bg-white border border-transparent hover:border-ink-200 rounded-xl transition-all hover:shadow-sm"
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

            <p className="mt-3 text-[10px] text-ink-400 italic">
              Données issues des publications officielles BRVM · Usage éducatif uniquement.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
// --- END NewsMegaMenu ---

// --- UPDATED MarketsMegaMenu ---
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
           {/* Column 1: Links */}
           <div className="space-y-1">
             <h3 className={MENU_HEADING}>Navigation</h3>
             {/* All Stocks */}
             <button onClick={() => navigate('/markets')} className={MENU_ROW_STACKED}> <div className={`${MENU_TILE} w-10 h-10`}><BarChart3 className="w-6 h-6" /></div> <div> <h4 className="font-semibold text-ink-900 mb-1">Actions</h4> <p className="text-sm text-ink-600">Toutes les valeurs.</p> </div> </button>
             {/* Screener */}
             <button onClick={() => navigate('/markets')} className={MENU_ROW_STACKED}> <div className={`${MENU_TILE} w-10 h-10`}><TrendingUp className="w-6 h-6" /></div> <div> <h4 className="font-semibold text-ink-900 mb-1">Screener</h4> <p className="text-sm text-ink-600">Filtrer & Trier.</p> </div> </button>
             {/* Obligations (Link might go elsewhere) */}
             {/* <button onClick={() => navigate('/bonds')} className="..."> ... Obligations ... </button> */}
           </div>
           {/* Column 2 & 3: Indices */}
           <div className="md:col-span-2">
             <div className={MENU_PANEL}>
               <h3 className={MENU_HEADING}>Indices BRVM</h3>
               {loading ? (
                    <div className="grid md:grid-cols-2 gap-4 min-h-[100px] items-center justify-center"> <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-navy"></div> </div>
               ) : indices.length > 0 ? (
                 <div className="grid md:grid-cols-2 gap-4">
                   {indices.map((index) => (
                     <div key={index.id} className="bg-white rounded-lg p-4 shadow-sm">
                       <p className="text-xs text-ink-600 mb-1 truncate">{index.index_name}</p>
                       <div className="flex items-end justify-between">
                         <p className="text-xl font-bold text-ink-900">{formatIndexValue(index.index_value)}</p>
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
                    <p className="text-sm text-ink-500 text-center py-4">Impossible de charger les indices.</p>
               )}
               <button onClick={() => navigate('/markets')} className={`mt-6 w-full px-6 py-2.5 text-sm ${MENU_BTN}`}>Voir toutes les cotations</button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
// --- END UPDATED MarketsMegaMenu ---


// --- StartupsMegaMenu (Can be removed if you removed startups) ---
// export function StartupsMegaMenu({ navigate }: MegaMenuProps) { ... }


// --- PortfolioMegaMenu (No changes needed, it's static) ---
export function PortfolioMegaMenu() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
     <div className={MENU_SHELL}>
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="grid md:grid-cols-3 gap-8">
             {/* Links */}
             <div className="space-y-1">
               <h3 className={MENU_HEADING}>Mes Outils</h3>
               <button onClick={() => navigate(isLoggedIn ? 'dashboard' : 'login')} className={MENU_ROW_STACKED}> <div className={`${MENU_TILE} w-10 h-10`}><BarChart3 className="w-6 h-6" /></div> <div> <h4 className="font-semibold text-ink-900 mb-1">Mon Portefeuille</h4> <p className="text-sm text-ink-600">Suivi simulation.</p> </div> </button>
               <button onClick={() => navigate(isLoggedIn ? 'dashboard' : 'login')} /* Point to watchlist section? */ className={MENU_ROW_STACKED}> <div className={`${MENU_TILE} w-10 h-10`}><Eye className="w-6 h-6" /></div> <div> <h4 className="font-semibold text-ink-900 mb-1">Ma Watchlist</h4> <p className="text-sm text-ink-600">Actions suivies.</p> </div> </button>
             </div>
             {/* Promotion */}
             <div className="md:col-span-2"> <div className={`${MENU_PANEL} h-full flex flex-col justify-between`}> <div> <h3 className="text-2xl font-bold text-ink-900 mb-4">Suivez vos simulations</h3> <p className="text-ink-700 mb-6">Créez votre portefeuille virtuel gratuit...</p> </div> <button onClick={() => navigate(isLoggedIn ? 'dashboard' : 'login')} className={`px-6 py-3 self-start ${MENU_BTN}`}>{isLoggedIn ? 'Accéder au Dashboard' : 'Connectez-vous'}</button> </div> </div>
         </div>
       </div>
     </div>
    );
}

// --- CommunityMegaMenu ---
export function CommunityMegaMenu() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <div className={MENU_SHELL}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Column 1: Navigation */}
          <div className="space-y-1">
            <h3 className={MENU_HEADING}>Communauté</h3>
            {/* Feed Social */}
            <button onClick={() => navigate('/community')} className={MENU_ROW_STACKED}>
              <div className={`${MENU_TILE} w-10 h-10`}><MessageCircle className="w-6 h-6" /></div>
              <div> <h4 className="font-semibold text-ink-900 mb-1">Feed Social</h4> <p className="text-sm text-ink-600">Publications et analyses.</p> </div>
            </button>
            {/* Groupes */}
            <button onClick={() => navigate('/communities')} className={MENU_ROW_STACKED}>
              <div className={`${MENU_TILE} w-10 h-10`}><Users className="w-6 h-6" /></div>
              <div> <h4 className="font-semibold text-ink-900 mb-1">Groupes</h4> <p className="text-sm text-ink-600">Rejoignez des communautés.</p> </div>
            </button>
            {/* Challenge */}
            <button onClick={() => navigate(isLoggedIn ? '/challenge/community' : '/login')} className={MENU_ROW_STACKED}>
              <div className={`${MENU_TILE} w-10 h-10`}><Trophy className="w-6 h-6" /></div>
              <div> <h4 className="font-semibold text-ink-900 mb-1">Challenge Trading</h4> <p className="text-sm text-ink-600">Compétition & classement.</p> </div>
            </button>
          </div>

          {/* Column 2: More links */}
          <div className="space-y-1">
            <h3 className={MENU_HEADING}>Activités</h3>
            {/* Achievements */}
            <button onClick={() => navigate(isLoggedIn ? '/achievements' : '/login')} className={MENU_ROW_STACKED}>
              <div className={`${MENU_TILE} w-10 h-10`}><Award className="w-6 h-6" /></div>
              <div> <h4 className="font-semibold text-ink-900 mb-1">Badges & XP</h4> <p className="text-sm text-ink-600">Vos récompenses.</p> </div>
            </button>
            {/* Events */}
            <button onClick={() => navigate('/events')} className={MENU_ROW_STACKED}>
              <div className={`${MENU_TILE} w-10 h-10`}><Calendar className="w-6 h-6" /></div>
              <div> <h4 className="font-semibold text-ink-900 mb-1">Événements</h4> <p className="text-sm text-ink-600">Webinaires & meetups.</p> </div>
            </button>
            {/* Leaderboard */}
            <button onClick={() => navigate(isLoggedIn ? '/challenge/community' : '/login')} className={MENU_ROW_STACKED}>
              <div className={`${MENU_TILE} w-10 h-10`}><BarChart3 className="w-6 h-6" /></div>
              <div> <h4 className="font-semibold text-ink-900 mb-1">Classement</h4> <p className="text-sm text-ink-600">Top investisseurs.</p> </div>
            </button>
          </div>

          {/* Column 3: Promotion */}
          <div>
            <div className={`${MENU_PANEL} h-full flex flex-col justify-between`}>
              <div>
                <div className="inline-block px-3 py-1 bg-brand-navy text-white rounded-full text-sm font-medium mb-4">Challenge 2026</div>
                <h3 className="text-xl font-bold text-ink-900 mb-3">Participez au Challenge Trading</h3>
                <p className="text-sm text-ink-700 mb-4">Affrontez d'autres investisseurs, grimpez dans le classement et gagnez des récompenses exclusives.</p>
                <div className="flex items-center space-x-3 text-sm text-ink-600 mb-2">
                  <Trophy className="w-4 h-4 text-brand-navy" />
                  <span>Classement en temps réel</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-ink-600 mb-2">
                  <Award className="w-4 h-4 text-brand-navy" />
                  <span>100+ badges à débloquer</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-ink-600">
                  <Users className="w-4 h-4 text-brand-navy" />
                  <span>Communauté active</span>
                </div>
              </div>
              <button
                onClick={() => navigate(isLoggedIn ? '/challenge/community' : '/login')}
                className={`mt-6 px-6 py-3 text-sm ${MENU_BTN}`}
              >
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
