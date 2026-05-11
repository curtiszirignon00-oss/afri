import { BookOpen, GraduationCap, TrendingUp, TrendingDown, BarChart3, Newspaper, Globe, DollarSign, Eye, MessageCircle, Trophy, Award, Calendar, Users, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
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

// --- LearnMegaMenu (No changes needed, it's static) ---
export function LearnMegaMenu() {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-white shadow-xl border-t border-gray-200 z-40"> {/* Added max-w-full */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ... Learn menu content ... */}
         <div className="grid md:grid-cols-3 gap-8">
             {/* Column 1: Links */}
             <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Parcours</h3>
               {/* Beginner */}
               <button onClick={() => navigate('/learn', { state: { difficulty: 'debutant' } })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors"><GraduationCap className="w-6 h-6 text-green-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Débutant</h4> <p className="text-sm text-gray-600">Les bases de la BRVM.</p> </div> </button>
               {/* Intermediate */}
               <button onClick={() => navigate('/learn', { state: { difficulty: 'intermediaire' } })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-colors"><BarChart3 className="w-6 h-6 text-yellow-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Intermédiaire</h4> <p className="text-sm text-gray-600">Approfondir.</p> </div> </button>
               {/* Advanced */}
               <button onClick={() => navigate('/learn', { state: { difficulty: 'avance' } })} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors"><TrendingUp className="w-6 h-6 text-red-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Avancé</h4> <p className="text-sm text-gray-600">Maîtriser.</p> </div> </button>
               {/* Time Machine */}
               <button onClick={() => navigate('/time-machine')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left border border-indigo-100 bg-indigo-50/40"> <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors"><Clock className="w-6 h-6 text-indigo-600" /></div> <div> <div className="flex items-center gap-2 mb-0.5"><h4 className="font-semibold text-gray-900">Time Machine</h4><span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full">NOUVEAU</span></div> <p className="text-sm text-gray-600">Rejouer l'histoire BRVM.</p> </div> </button>
             </div>
             {/* Column 2 & 3: Promotion */}
             <div className="md:col-span-2"> <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 h-full flex flex-col justify-between"> <div> <div className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium mb-4">Populaire</div> <h3 className="text-2xl font-bold text-gray-900 mb-4">Commencez votre voyage</h3> <p className="text-gray-700 mb-6">Rejoignez des milliers d'investisseurs...</p> </div> <div className="flex items-center space-x-4"> <button onClick={() => navigate('/learn')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">Démarrer</button> <div className="flex items-center space-x-2 text-sm text-gray-600"><BookOpen className="w-5 h-5" /><span>15+ modules gratuits</span></div> </div> </div> </div>
         </div>
      </div>
    </div>
  );
}
// --- END LearnMegaMenu ---

// Couleurs de catégorie pour le mega menu
const CAT_BADGE: Record<string, string> = {
  'Marché':             'bg-blue-100 text-blue-700',
  'Macroéconomie':      'bg-violet-100 text-violet-700',
  'Matières premières': 'bg-amber-100 text-amber-700',
  'Secteur bancaire':   'bg-emerald-100 text-emerald-700',
  'Télécoms':           'bg-cyan-100 text-cyan-700',
  'Dividendes':         'bg-teal-100 text-teal-700',
  'Réglementation':     'bg-slate-200 text-slate-600',
  'Agro-industrie':     'bg-lime-100 text-lime-700',
};

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// --- NewsMegaMenu ---
export function NewsMegaMenu() {
  const navigate = useNavigate();

  const previewArticles = [...BRVM_NEWS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);

  const NAV_CATS = [
    { label: 'Tout',          icon: Newspaper,  bg: 'bg-slate-100', fg: 'text-slate-600' },
    { label: 'Marchés',       icon: TrendingUp, bg: 'bg-blue-100',  fg: 'text-blue-600'  },
    { label: 'Analyse',       icon: BarChart3,  bg: 'bg-green-100', fg: 'text-green-600' },
    { label: 'Économie',      icon: Globe,      bg: 'bg-orange-100',fg: 'text-orange-600'},
    { label: 'Dividendes',    icon: DollarSign, bg: 'bg-teal-100',  fg: 'text-teal-600', isNew: true },
    { label: 'Résultats 2025',icon: BarChart3,  bg: 'bg-purple-100',fg: 'text-purple-600'},
  ] as const;

  return (
    <div className="w-full bg-white shadow-xl border-t border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid md:grid-cols-3 gap-8">

          {/* Colonne 1 : navigation catégories */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Catégories</h3>
            <div className="space-y-0.5">
              {NAV_CATS.map(({ label, icon: Icon, bg, fg, isNew }) => (
                <button
                  key={label}
                  onClick={() => navigate('/news')}
                  className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-all text-left"
                >
                  <div className={`flex-shrink-0 w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${fg}`} />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-gray-900">{label}</span>
                  {isNew && (
                    <span className="text-[9px] font-bold bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">
                      NOUVEAU
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/news')}
              className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
            >
              Toutes les actualités <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Colonnes 2-3 : aperçu des 3 derniers articles BRVM */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Intelligence de marché</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#00D4A8]/10 text-[#00868A] border border-[#00D4A8]/25">
                BRVM 2026
              </span>
            </div>

            <div className="space-y-2">
              {previewArticles.map(article => {
                const posCount = article.tickers.filter(t => t.impact === 'Positif').length;
                const negCount = article.tickers.filter(t => t.impact === 'Négatif').length;
                const badgeCls = CAT_BADGE[article.category] ?? 'bg-slate-100 text-slate-600';

                return (
                  <button
                    key={article.id}
                    onClick={() => navigate('/news')}
                    className="group w-full text-left px-4 py-3 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeCls}`}>
                            {article.category.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400">{fmtDateShort(article.publishedAt)}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-[#00868A] transition-colors">
                          {article.title}
                        </p>
                      </div>
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

            <p className="mt-3 text-[10px] text-slate-400 italic">
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
    <div className="w-full bg-white shadow-xl border-t border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
           {/* Column 1: Links */}
           <div className="space-y-4">
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Navigation</h3>
             {/* All Stocks */}
             <button onClick={() => navigate('/markets')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors"><BarChart3 className="w-6 h-6 text-blue-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Actions</h4> <p className="text-sm text-gray-600">Toutes les valeurs.</p> </div> </button>
             {/* Screener */}
             <button onClick={() => navigate('/markets')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors"><TrendingUp className="w-6 h-6 text-green-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Screener</h4> <p className="text-sm text-gray-600">Filtrer & Trier.</p> </div> </button>
             {/* Obligations (Link might go elsewhere) */}
             {/* <button onClick={() => navigate('/bonds')} className="..."> ... Obligations ... </button> */}
           </div>
           {/* Column 2 & 3: Indices */}
           <div className="md:col-span-2">
             <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
               <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Indices BRVM</h3>
               {loading ? (
                    <div className="grid md:grid-cols-2 gap-4 min-h-[100px] items-center justify-center"> <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div> </div>
               ) : indices.length > 0 ? (
                 <div className="grid md:grid-cols-2 gap-4">
                   {indices.map((index) => (
                     <div key={index.id} className="bg-white rounded-lg p-4 shadow-sm">
                       <p className="text-xs text-gray-600 mb-1 truncate">{index.index_name}</p>
                       <div className="flex items-end justify-between">
                         <p className="text-xl font-bold text-gray-900">{formatIndexValue(index.index_value)}</p>
                         <div className={`flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${ index.daily_change_percent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' }`}>
                           {index.daily_change_percent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                           <span>{index.daily_change_percent >= 0 ? '+' : ''}{index.daily_change_percent?.toFixed(2) ?? '0.00'}%</span>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Impossible de charger les indices.</p>
               )}
               <button onClick={() => navigate('/markets')} className="mt-6 w-full px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm">Voir toutes les cotations</button>
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
     <div className="w-full bg-white shadow-xl border-t border-gray-200 z-40">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         <div className="grid md:grid-cols-3 gap-8">
             {/* Links */}
             <div className="space-y-4">
               <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Mes Outils</h3>
               <button onClick={() => navigate(isLoggedIn ? 'dashboard' : 'login')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors"><BarChart3 className="w-6 h-6 text-blue-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Mon Portefeuille</h4> <p className="text-sm text-gray-600">Suivi simulation.</p> </div> </button>
               <button onClick={() => navigate(isLoggedIn ? 'dashboard' : 'login')} /* Point to watchlist section? */ className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left"> <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors"><Eye className="w-6 h-6 text-green-600" /></div> <div> <h4 className="font-semibold text-gray-900 mb-1">Ma Watchlist</h4> <p className="text-sm text-gray-600">Actions suivies.</p> </div> </button>
             </div>
             {/* Promotion */}
             <div className="md:col-span-2"> <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 h-full flex flex-col justify-between"> <div> <h3 className="text-2xl font-bold text-gray-900 mb-4">Suivez vos simulations</h3> <p className="text-gray-700 mb-6">Créez votre portefeuille virtuel gratuit...</p> </div> <button onClick={() => navigate(isLoggedIn ? 'dashboard' : 'login')} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold self-start">{isLoggedIn ? 'Accéder au Dashboard' : 'Connectez-vous'}</button> </div> </div>
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
    <div className="w-full bg-white shadow-xl border-t border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Column 1: Navigation */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Communauté</h3>
            {/* Feed Social */}
            <button onClick={() => navigate('/community')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors"><MessageCircle className="w-6 h-6 text-blue-600" /></div>
              <div> <h4 className="font-semibold text-gray-900 mb-1">Feed Social</h4> <p className="text-sm text-gray-600">Publications et analyses.</p> </div>
            </button>
            {/* Groupes */}
            <button onClick={() => navigate('/communities')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors"><Users className="w-6 h-6 text-purple-600" /></div>
              <div> <h4 className="font-semibold text-gray-900 mb-1">Groupes</h4> <p className="text-sm text-gray-600">Rejoignez des communautés.</p> </div>
            </button>
            {/* Challenge */}
            <button onClick={() => navigate(isLoggedIn ? '/challenge/community' : '/login')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors"><Trophy className="w-6 h-6 text-amber-600" /></div>
              <div> <h4 className="font-semibold text-gray-900 mb-1">Challenge Trading</h4> <p className="text-sm text-gray-600">Compétition & classement.</p> </div>
            </button>
          </div>

          {/* Column 2: More links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Activités</h3>
            {/* Achievements */}
            <button onClick={() => navigate(isLoggedIn ? '/achievements' : '/login')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left">
              <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors"><Award className="w-6 h-6 text-emerald-600" /></div>
              <div> <h4 className="font-semibold text-gray-900 mb-1">Badges & XP</h4> <p className="text-sm text-gray-600">Vos récompenses.</p> </div>
            </button>
            {/* Events */}
            <button onClick={() => navigate('/events')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left">
              <div className="flex-shrink-0 w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center group-hover:bg-rose-200 transition-colors"><Calendar className="w-6 h-6 text-rose-600" /></div>
              <div> <h4 className="font-semibold text-gray-900 mb-1">Événements</h4> <p className="text-sm text-gray-600">Webinaires & meetups.</p> </div>
            </button>
            {/* Leaderboard */}
            <button onClick={() => navigate(isLoggedIn ? '/challenge/community' : '/login')} className="group w-full flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-all text-left">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors"><BarChart3 className="w-6 h-6 text-indigo-600" /></div>
              <div> <h4 className="font-semibold text-gray-900 mb-1">Classement</h4> <p className="text-sm text-gray-600">Top investisseurs.</p> </div>
            </button>
          </div>

          {/* Column 3: Promotion */}
          <div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 h-full flex flex-col justify-between">
              <div>
                <div className="inline-block px-3 py-1 bg-amber-500 text-white rounded-full text-sm font-medium mb-4">Challenge 2026</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Participez au Challenge Trading</h3>
                <p className="text-sm text-gray-700 mb-4">Affrontez d'autres investisseurs, grimpez dans le classement et gagnez des récompenses exclusives.</p>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Classement en temps réel</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mb-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>100+ badges à débloquer</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Communauté active</span>
                </div>
              </div>
              <button
                onClick={() => navigate(isLoggedIn ? '/challenge/community' : '/login')}
                className="mt-6 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-semibold text-sm"
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