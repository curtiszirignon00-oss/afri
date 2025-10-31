import { useEffect, useState, useCallback } from 'react';
import { BookOpen, Clock, Award, AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// --- 1. Types Mis à Jour (Modules et Progression) ---
import { LearningModule, LearningProgress } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export default function LearnPage() {
    const { isLoggedIn } = useAuth();
    const [modules, setModules] = useState<LearningModule[]>([]);
    const [progress, setProgress] = useState<LearningProgress[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);

    // --- Fonctions Helper ---
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

    const isModuleCompleted = useCallback((moduleSlug: string): boolean => {
        return progress.some(p => p.module.slug === moduleSlug && p.is_completed);
    }, [progress]);

    // --- Logique de Chargement (Modules + Progression) ---
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const moduleUrl = `${API_BASE_URL}/learning-modules${selectedDifficulty !== 'all' ? `?difficulty=${selectedDifficulty}` : ''}`;
        const progressUrl = `${API_BASE_URL}/learning-modules/progress`;

        try {
            // 1. Récupération des modules
            const modulesPromise = fetch(moduleUrl).then(res => {
                if (!res.ok) throw new Error(`Erreur ${res.status}: Impossible de charger les modules.`);
                return res.json();
            });

            // 2. Récupération de la progression (le cookie est envoyé automatiquement)
            const progressPromise = fetch(progressUrl, {
                credentials: 'include',
            }).then(res => {
                if (res.status === 401) return [];
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                return res.json();
            });

            const [modulesData, progressData] = await Promise.all([modulesPromise, progressPromise]);

            setModules(modulesData || []);
            setProgress(progressData || []);

        } catch (err: any) {
            console.error('Erreur chargement données:', err);
            setError(err.message || "Une erreur est survenue.");
            setModules([]);
            setProgress([]);
        } finally {
            setLoading(false);
        }
    }, [selectedDifficulty]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Fonction de Marquage comme Complété ---
    const handleMarkAsCompleted = useCallback(async (moduleSlug: string) => {
    if (!isLoggedIn) {
        toast.error("Connectez-vous pour marquer un module comme terminé."); // ✅
        return;
    }

    const toastId = toast.loading('Marquage en cours...'); // ✅ Toast de chargement

    try {
        const response = await fetch(`${API_BASE_URL}/learning-modules/${moduleSlug}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: Impossible de marquer comme complété.`);
        }

        await loadData();
        toast.success('Module terminé avec succès ! 🎉', { id: toastId }); // ✅ Toast de succès

    } catch (err) {
        console.error('Erreur complétion:', err);
        toast.error("Erreur lors du marquage du module.", { id: toastId }); // ✅ Toast d'erreur
    }
},[isLoggedIn, loadData]);

    // --- Affichage Module Sélectionné (Vue Détail) ---
    if (selectedModule) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <button onClick={() => setSelectedModule(null)} className="text-blue-600 hover:text-blue-700 mb-6 flex items-center space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour aux cours</span>
                </button>

                <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <div className="mb-6 border-b border-gray-100 pb-6">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedModule.difficulty_level)}`}>
                                {getDifficultyLabel(selectedModule.difficulty_level)}
                            </span>
                            <span className="flex items-center space-x-1 text-xs text-gray-500">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{selectedModule.duration_minutes ? `${selectedModule.duration_minutes} min` : 'N/A'}</span>
                            </span>
                            <span className="flex items-center space-x-1 text-xs text-gray-500">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{selectedModule.content_type === 'article' ? 'Article' : 'Vidéo'}</span>
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{selectedModule.title}</h1>
                        {selectedModule.description && <p className="text-base md:text-lg text-gray-600">{selectedModule.description}</p>}
                    </div>

                    {selectedModule.content ? (
                        <div className="prose prose-lg max-w-none prose-indigo" dangerouslySetInnerHTML={{ __html: selectedModule.content }} />
                    ) : (
                        <p className="text-gray-500">Contenu non disponible.</p>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {isModuleCompleted(selectedModule.slug) ? (
                                <div className="flex items-center space-x-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Module Terminé !</span>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleMarkAsCompleted(selectedModule.slug)}
                                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium w-full sm:w-auto flex items-center justify-center space-x-2"
                                >
                                    <Award className="w-5 h-5" />
                                    <span>Marquer comme complété</span>
                                </button>
                            )}

                            <button onClick={() => setSelectedModule(null)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto">
                                Continuer l'apprentissage
                            </button>
                        </div>
                    </div>
                </article>
            </div>
        );
    }

    // --- Affichage Liste des Modules ---
    const completedCount = progress.filter(p => p.is_completed).length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Académie de l'Investissement</h1>
                <p className="text-gray-600 text-lg mb-4">Apprenez à investir intelligemment avec nos cours gratuits.</p>

                {isLoggedIn ? (
                    <p className="text-lg font-medium">
                        Votre progression :
                        <span className="font-semibold text-blue-600 ml-2">
                            {completedCount} / {modules.length} Modules Complétés
                        </span>
                    </p>
                ) : (
                    <p className="text-yellow-600 font-medium text-sm">Connectez-vous pour suivre votre progression !</p>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 mb-8 sticky top-20 z-10">
                <div className="flex flex-wrap gap-2 md:gap-3">
                    {['all', 'debutant', 'intermediaire', 'avance'].map((difficulty) => (
                        <button
                            key={difficulty}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-medium text-sm transition-colors ${
                                selectedDifficulty === difficulty ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {difficulty === 'all' ? 'Tous' : getDifficultyLabel(difficulty)}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {!loading && error && (
                <div className="text-center py-12 px-4">
                    <AlertTriangle className="w-10 h-10 mx-auto text-red-400 mb-3" />
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, index) => {
                        const isCompleted = isModuleCompleted(module.slug);

                        return (
                            <button
                                key={module.id}
                                onClick={() => setSelectedModule(module)}
                                className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-lg transition-all text-left flex flex-col h-full group ${
                                    isCompleted ? 'border-green-400 bg-green-50' : 'border-gray-100 hover:border-blue-300'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-lg font-bold text-base flex-shrink-0">
                                        {module.order_index ?? index + 1}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty_level)}`}>
                                        {getDifficultyLabel(module.difficulty_level)}
                                    </span>
                                </div>

                                <div className="flex flex-col flex-grow mb-4">
                                    <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {module.title}
                                    </h3>
                                    {module.description && <p className="text-xs text-gray-600 line-clamp-2 flex-grow">{module.description}</p>}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500 mt-auto">
                                    <div className="flex items-center space-x-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{module.duration_minutes ? `${module.duration_minutes} min` : 'N/A'}</span>
                                    </div>
                                    {isCompleted ? (
                                        <div className="flex items-center space-x-1 text-green-600 font-semibold">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Terminé</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-1">
                                            <BookOpen className="w-3.5 h-3.5" />
                                            <span>{module.content_type === 'article' ? 'Article' : 'Vidéo'}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {!loading && !error && modules.length === 0 && (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Aucun module trouvé pour le niveau "{getDifficultyLabel(selectedDifficulty)}".</p>
                </div>
            )}
        </div>
    );
}