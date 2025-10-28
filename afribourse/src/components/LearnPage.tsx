import { useEffect, useState } from 'react';
import { BookOpen, Clock, Award, AlertTriangle, ArrowLeft } from 'lucide-react'; // Added ArrowLeft

// --- Type Mis à Jour (Correspond au Schéma Prisma) ---
type LearningModule = {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  content: string | null; // Contenu HTML (sanitized par le backend)
  difficulty_level: string;
  content_type: string;
  duration_minutes: number | null;
  order_index: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  video_url: string | null;
  created_at: string | null; // Dates Prisma peuvent être null
  updated_at: string | null;
};
// --- Fin Type ---

const API_BASE_URL = 'http://localhost:3000/api'; // Ajuster si besoin

export default function LearnPage() {
  const [modules, setModules] = useState<LearningModule[]>([]); // Contient les modules de l'API
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all'); // État du filtre
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // État d'erreur
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null); // Pour la vue détail

  // --- useEffect MIS À JOUR pour charger les modules selon la difficulté ---
  useEffect(() => {
    async function loadModules() {
      setLoading(true);
      setError(null);
      // Construit l'URL avec le paramètre de difficulté si nécessaire
      const url = `${API_BASE_URL}/learning-modules${selectedDifficulty !== 'all' ? `?difficulty=${selectedDifficulty}` : ''}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Impossible de charger les modules.`);
        }
        const data: LearningModule[] = await response.json();
        setModules(data || []); // Met à jour l'état avec les données (déjà filtrées par le backend)
      } catch (err: any) {
        console.error('Erreur chargement modules:', err);
        setError(err.message || "Une erreur est survenue.");
        setModules([]); // Vide les modules en cas d'erreur
      } finally {
        setLoading(false);
      }
    }

    loadModules(); // Appelle la fonction de chargement

  }, [selectedDifficulty]); // Ré-exécute quand selectedDifficulty change
  // --- FIN useEffect MIS À JOUR ---


  // Le filtrage côté client n'est plus nécessaire
  // const filteredModules = ...

  // --- Fonctions Helper (inchangées) ---
  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case 'debutant': return 'bg-green-100 text-green-700';
      case 'intermediaire': return 'bg-yellow-100 text-yellow-700';
      case 'avance': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  const getDifficultyLabel = (level: string): string => {
    switch (level) {
      case 'debutant': return 'Débutant';
      case 'intermediaire': return 'Intermédiaire';
      case 'avance': return 'Avancé';
      default: return level.charAt(0).toUpperCase() + level.slice(1);
    }
  };
  // --- FIN Helper ---

  // --- Affichage Module Sélectionné (Vue Détail) ---
  if (selectedModule) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bouton Retour */}
        <button onClick={() => setSelectedModule(null)} className="text-blue-600 hover:text-blue-700 mb-6 flex items-center space-x-2"><ArrowLeft className="w-4 h-4" /><span>Retour aux cours</span></button>
        {/* Contenu Article */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* En-tête Module */}
          <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedModule.difficulty_level)}`}>{getDifficultyLabel(selectedModule.difficulty_level)}</span>
              <span className="flex items-center space-x-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" /><span>{selectedModule.duration_minutes ? `${selectedModule.duration_minutes} min` : 'N/A'}</span></span>
              <span className="flex items-center space-x-1 text-xs text-gray-500"><BookOpen className="w-3.5 h-3.5" /><span>{selectedModule.content_type === 'article' ? 'Article' : 'Vidéo'}</span></span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedModule.title}</h1>
            {selectedModule.description && <p className="text-base md:text-lg text-gray-600">{selectedModule.description}</p>}
          </div>
          {/* Contenu HTML (Sanitized) */}
          {selectedModule.content ? (
              <div className="prose prose-lg max-w-none prose-indigo" dangerouslySetInnerHTML={{ __html: selectedModule.content }} />
          ) : ( <p className="text-gray-500">Contenu non disponible.</p> )}
          {/* Footer Complétion (Placeholder) */}
          <div className="mt-8 pt-6 border-t border-gray-100"><div className="flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center space-x-2 text-green-600"><Award className="w-5 h-5" /><span className="font-medium">Marquer comme complété (Bientôt !)</span></div><button onClick={() => setSelectedModule(null)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto">Continuer l'apprentissage</button></div></div>
        </article>
      </div>
    );
  }
  // --- Fin Vue Détail ---

  // --- Affichage Liste des Modules ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* En-tête Page */}
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Académie de l'Investissement</h1>
        <p className="text-gray-600 text-lg">Apprenez à investir intelligemment avec nos cours gratuits.</p>
      </div>

      {/* Filtres Catégorie */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8 sticky top-20 z-10">
        <div className="flex flex-wrap gap-2 md:gap-3">
          {['all', 'debutant', 'intermediaire', 'avance'].map((difficulty) => (
              <button key={difficulty} onClick={() => setSelectedDifficulty(difficulty)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-colors ${ selectedDifficulty === difficulty ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }`}>
                {difficulty === 'all' ? 'Tous' : getDifficultyLabel(difficulty)}
              </button>
          ))}
        </div>
      </div>

      {/* Indicateur Chargement */}
       {loading && ( <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div> )}

      {/* Affichage Erreur */}
       {!loading && error && ( <div className="text-center py-12 px-4"><AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-3" /><p className="text-red-600">{error}</p></div> )}

      {/* Grille des Modules */}
       {!loading && !error && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module, index) => ( // Utilise 'modules' directement
                  <button key={module.id} onClick={() => setSelectedModule(module)} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-300 transition-all text-left flex flex-col h-full group">
                    {/* En-tête Carte */}
                    <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-bold text-base flex-shrink-0">{module.order_index ?? index + 1}</div>
                       <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty_level)}`}>{getDifficultyLabel(module.difficulty_level)}</span>
                    </div>
                    {/* Corps Carte */}
                    <div className="flex flex-col flex-grow mb-4">
                        <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{module.title}</h3>
                        {module.description && <p className="text-xs text-gray-600 line-clamp-2 flex-grow">{module.description}</p>}
                    </div>
                    {/* Footer Carte */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 mt-auto">
                      <div className="flex items-center space-x-1"><Clock className="w-3.5 h-3.5" /><span>{module.duration_minutes ? `${module.duration_minutes} min` : 'N/A'}</span></div>
                      <div className="flex items-center space-x-1"><BookOpen className="w-3.5 h-3.5" /><span>{module.content_type === 'article' ? 'Article' : 'Vidéo'}</span></div>
                    </div>
                  </button>
                ))}
            </div>
       )}

      {/* État Aucun Module Trouvé */}
      {!loading && !error && modules.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucun module trouvé pour le niveau "{getDifficultyLabel(selectedDifficulty)}".</p>
        </div>
      )}
    </div> // Fin Conteneur Principal
  );
}