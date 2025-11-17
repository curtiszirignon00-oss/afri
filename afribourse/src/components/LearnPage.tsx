// src/components/LearnPage.tsx - VERSION REFONTE COMPLÈTE
import { useEffect, useState, useCallback } from 'react';
import { 
  BookOpen, 
  Clock, 
  Award, 
  AlertTriangle, 
  ArrowLeft, 
  CheckCircle,
  Lock, // <-- AJOUT: Pour les modules verrouillés
  Unlock, // <-- AJOUT: Pour les modules déverrouillés
  Play, // <-- AJOUT: Pour le lecteur audio
  Pause, // <-- AJOUT: Pour pause audio
  Volume2, // <-- AJOUT: Pour l'icône audio
  Brain, // <-- AJOUT: Pour les quiz
  Target, // <-- AJOUT: Pour le score
  TrendingUp, // <-- AJOUT: Pour la progression
  Star, // <-- AJOUT: Pour la réussite
  XCircle // <-- AJOUT: Pour les erreurs
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

// --- Types ---
import { LearningModule, LearningProgress } from '../types';

// <-- AJOUT: Type pour le quiz (temporaire, à remplacer par les vrais types)
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizState {
  isActive: boolean;
  answers: { [questionId: string]: number }; // Map questionId -> answerIndex
  score: number | null;
  passed: boolean | null;
  showResults: boolean;
  detailedResults?: any[]; // Résultats détaillés de l'API
}

export default function LearnPage() {
    const { isLoggedIn } = useAuth();
    const [modules, setModules] = useState<LearningModule[]>([]);
    const [progress, setProgress] = useState<LearningProgress[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
    
    // <-- AJOUT: États pour le quiz
    const [quizState, setQuizState] = useState<QuizState>({
      isActive: false,
      answers: {},
      score: null,
      passed: null,
      showResults: false
    });

    // <-- AJOUT: États pour l'audio
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    // <-- AJOUT: États pour les slides
    const [currentSlide, setCurrentSlide] = useState(1);
    const [totalSlides, setTotalSlides] = useState(1);

    // <-- AJOUT: États pour le quiz récupéré de l'API
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizPassingScore, setQuizPassingScore] = useState(70);

    // <-- AJOUT: Fonction pour charger le quiz depuis l'API
    const loadModuleQuiz = useCallback(async (moduleSlug: string) => {
      setQuizLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/learning-modules/${moduleSlug}/quiz`);
        if (!response.ok) {
          throw new Error('Impossible de charger le quiz');
        }
        const quizData = await response.json();

        // Extraire les questions et le passing score
        setQuizQuestions(quizData.questions || []);
        setQuizPassingScore(quizData.passing_score || 70);
      } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        toast.error('Impossible de charger le quiz');
        setQuizQuestions([]);
      } finally {
        setQuizLoading(false);
      }
    }, []);

    // --- Fonctions Helper ---
    const getDifficultyColor = (level: string): string => {
        switch (level) {
            case 'debutant': return 'bg-green-100 text-green-700 border-green-200';
            case 'intermediaire': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'avance': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

    // <-- AJOUT: Fonction pour vérifier si un module est déverrouillé
    const isModuleUnlocked = useCallback((module: LearningModule): boolean => {
      // Module 0 et 1 sont toujours déverrouillés
      if (!module.order_index || module.order_index <= 1) {
        return true;
      }

      // Trouver le module précédent
      const previousModule = modules.find(m => m.order_index === (module.order_index! - 1));
      if (!previousModule) return true; // Si pas de module précédent, déverrouiller

      // Vérifier si le module précédent est complété
      return isModuleCompleted(previousModule.slug);
    }, [modules, isModuleCompleted]);

    // <-- AJOUT: Fonction pour obtenir le module précédent non complété
    const getPreviousIncompleteModule = useCallback((module: LearningModule): LearningModule | null => {
      if (!module.order_index || module.order_index <= 1) return null;

      const previousModule = modules.find(m => m.order_index === (module.order_index! - 1));
      if (!previousModule) return null;

      return isModuleCompleted(previousModule.slug) ? null : previousModule;
    }, [modules, isModuleCompleted]);

    // --- Logique de Chargement (Modules + Progression) ---
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const moduleUrl = `${API_BASE_URL}/learning-modules${selectedDifficulty !== 'all' ? `?difficulty=${selectedDifficulty}` : ''}`;
        const progressUrl = `${API_BASE_URL}/learning-modules/progress`;

        try {
            const modulesPromise = fetch(moduleUrl).then(res => {
                if (!res.ok) throw new Error(`Erreur ${res.status}: Impossible de charger les modules.`);
                return res.json();
            });

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

    // <-- AJOUT: useEffect pour gérer les slides
    useEffect(() => {
        if (!selectedModule) return;

        // Compter le nombre total de slides dans le contenu
        const slideElements = document.querySelectorAll('.slide[data-slide]');
        const count = slideElements.length;
        setTotalSlides(count > 0 ? count : 1);

        // Masquer tous les slides
        slideElements.forEach(slide => {
            (slide as HTMLElement).style.display = 'none';
        });

        // Afficher uniquement le slide actuel
        const currentSlideElement = document.querySelector(`.slide[data-slide="${currentSlide}"]`);
        if (currentSlideElement) {
            (currentSlideElement as HTMLElement).style.display = 'block';
        }

        // Scroll vers le haut lors du changement de slide
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedModule, currentSlide]);

    // <-- AJOUT: Reset du slide au changement de module
    useEffect(() => {
        setCurrentSlide(1);
    }, [selectedModule?.slug]);

    // <-- AJOUT: Fonction pour démarrer le quiz
    const startQuiz = useCallback(() => {
      if (!isLoggedIn) {
        toast.error("Connectez-vous pour passer le quiz.");
        return;
      }

      setQuizState({
        isActive: true,
        answers: {},
        score: null,
        passed: null,
        showResults: false,
        detailedResults: []
      });

      // Scroll vers le quiz
      setTimeout(() => {
        document.getElementById('quiz-container')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, [isLoggedIn]);

    // <-- AJOUT: Fonction pour répondre à une question
    const answerQuestion = useCallback((answerIndex: number) => {
      // Calculer l'index actuel basé sur le nombre de réponses
      const currentIndex = Object.keys(quizState.answers).length;
      const currentQuestionId = quizQuestions[currentIndex]?.id;

      if (!currentQuestionId) {
        console.error('ID de question manquant');
        return;
      }

      setQuizState(prev => ({
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestionId]: answerIndex
        }
      }));
    }, [quizQuestions, quizState.answers]);

    // <-- AJOUT: Fonction pour soumettre le quiz via l'API
    const submitQuiz = useCallback(async () => {
      if (!selectedModule) return;

      const toastId = toast.loading('Validation du quiz en cours...');

      try {
        // Soumettre le quiz à l'API
        const response = await fetch(`${API_BASE_URL}/learning-modules/${selectedModule.slug}/submit-quiz`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ answers: quizState.answers })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erreur lors de la soumission du quiz');
        }

        const result = await response.json();

        setQuizState(prev => ({
          ...prev,
          score: result.score,
          passed: result.passed,
          showResults: true,
          isActive: false,
          detailedResults: result.detailedResults || []
        }));

        // Recharger la progression
        await loadData();

        // Afficher le résultat
        if (result.passed) {
          toast.success(`🎉 Quiz réussi ! Score: ${result.score}%`, { id: toastId });
        } else {
          toast.error(`Score insuffisant: ${result.score}%. Minimum requis: ${result.passingScore}%`, { id: toastId });
        }

        // Scroll vers les résultats
        setTimeout(() => {
          document.getElementById('quiz-results')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

      } catch (error: any) {
        console.error('Erreur lors de la soumission du quiz:', error);
        toast.error(error.message || 'Erreur lors de la soumission du quiz', { id: toastId });
      }
    }, [selectedModule, quizState.answers, loadData]);

    // <-- AJOUT: Fonction pour rejouer le quiz
    const retryQuiz = useCallback(() => {
      if (selectedModule) {
        // Recharger le quiz pour avoir de nouvelles questions aléatoires
        loadModuleQuiz(selectedModule.slug);
      }

      setQuizState({
        isActive: true,
        answers: {},
        score: null,
        passed: null,
        showResults: false,
        detailedResults: []
      });

      setTimeout(() => {
        document.getElementById('quiz-container')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, [selectedModule, loadModuleQuiz]);

    // <-- AJOUT: Fonction pour gérer le lecteur audio
    const toggleAudio = useCallback(() => {
      if (!audioElement) {
        // Créer un élément audio (exemple - à remplacer par la vraie URL)
        const audio = new Audio('/audio/example-module.mp3');
        audio.onended = () => setIsAudioPlaying(false);
        audio.onpause = () => setIsAudioPlaying(false);
        audio.onplay = () => setIsAudioPlaying(true);
        setAudioElement(audio);
        audio.play();
        setIsAudioPlaying(true);
      } else {
        if (isAudioPlaying) {
          audioElement.pause();
        } else {
          audioElement.play();
        }
      }
    }, [audioElement, isAudioPlaying]);

    // Cleanup audio on unmount
    useEffect(() => {
      return () => {
        if (audioElement) {
          audioElement.pause();
          audioElement.src = '';
        }
      };
    }, [audioElement]);

    // --- Fonction de Marquage comme Complété (conservée pour compatibilité) ---
    const handleMarkAsCompleted = useCallback(async (moduleSlug: string) => {
      if (!isLoggedIn) {
        toast.error("Connectez-vous pour marquer un module comme terminé.");
        return;
      }

      const toastId = toast.loading('Marquage en cours...');

      try {
        const response = await fetch(`${API_BASE_URL}/learning-modules/${moduleSlug}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: Impossible de marquer comme complété.`);
        }

        await loadData();
        toast.success('Module terminé avec succès ! 🎉', { id: toastId });

      } catch (err) {
        console.error('Erreur complétion:', err);
        toast.error("Erreur lors du marquage du module.", { id: toastId });
      }
    }, [isLoggedIn, loadData]);

    // --- useEffect: Charger le quiz quand un module est sélectionné ---
    useEffect(() => {
        if (selectedModule && (selectedModule.order_index ?? 0) >= 1 && (selectedModule.order_index ?? 0) <= 4) {
            // Charger le quiz depuis l'API pour les modules 1, 2, 3 et 4
            loadModuleQuiz(selectedModule.slug);
        }
    }, [selectedModule, loadModuleQuiz]);

    // --- AFFICHAGE DU MODULE SÉLECTIONNÉ ---
    if (selectedModule) {
        const isCompleted = isModuleCompleted(selectedModule.slug);
        const moduleProgress = progress.find(p => p.module.slug === selectedModule.slug);
        const hasQuiz = (selectedModule.order_index ?? 0) >= 1 && (selectedModule.order_index ?? 0) <= 4; // <-- Quiz pour les modules 1, 2, 3 et 4

        // Extraire l'objectif pédagogique du contenu HTML
        const extractPedagogicalObjective = (htmlContent: string): string | null => {
            if (!htmlContent) return null;

            // Créer un élément temporaire pour parser le HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Chercher spécifiquement la div de l'objectif pédagogique
            // Elle a une classe bg-gradient et contient "🎯 Objectif Pédagogique"
            const divs = tempDiv.querySelectorAll('div');
            for (let div of Array.from(divs)) {
                const h2 = div.querySelector('h2');
                if (h2 && h2.textContent?.includes('🎯 Objectif Pédagogique')) {
                    // Vérifier que c'est une div avec un fond coloré (bg-gradient)
                    if (div.className.includes('bg-gradient')) {
                        return div.innerHTML;
                    }
                }
            }
            return null;
        };

        const pedagogicalObjective = extractPedagogicalObjective(selectedModule.content || '');

        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* <-- CORRECTION: Bouton retour amélioré */}
                <button
                    onClick={() => {
                      setSelectedModule(null);
                      setQuizState({
                        isActive: false,
                        answers: {},
                        score: null,
                        passed: null,
                        showResults: false
                      });
                      if (audioElement) {
                        audioElement.pause();
                        setIsAudioPlaying(false);
                      }
                    }}
                    className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Retour aux modules</span>
                </button>

                {/* <-- CORRECTION: En-tête du module amélioré et agrandi */}
                <article className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-12 text-white">
                        <div className="flex items-start justify-between mb-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getDifficultyColor(selectedModule.difficulty_level)} bg-white`}>
                                {getDifficultyLabel(selectedModule.difficulty_level)}
                            </span>

                            {isCompleted && (
                                <div className="flex items-center space-x-2 bg-green-500 px-4 py-2 rounded-full">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-semibold">Terminé</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                            {selectedModule.title}
                        </h1>

                        {/* <-- AJOUT: Métadonnées du module */}
                        <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-blue-400/30">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5" />
                                <span>{selectedModule.duration_minutes || '15'} minutes</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <BookOpen className="w-5 h-5" />
                                <span>{selectedModule.content_type === 'video' ? 'Vidéo' : 'Article'}</span>
                            </div>

                            {hasQuiz && (
                                <div className="flex items-center space-x-2">
                                    <Brain className="w-5 h-5" />
                                    <span>Quiz inclus</span>
                                </div>
                            )}

                            {/* <-- AJOUT: Indicateur audio (même si pas encore disponible) */}
                            <div className="flex items-center space-x-2 opacity-50 cursor-not-allowed" title="Audio bientôt disponible">
                                <Volume2 className="w-5 h-5" />
                                <span>Audio (bientôt)</span>
                            </div>
                        </div>

                        {/* Objectif pédagogique extrait du contenu */}
                        {pedagogicalObjective && (
                            <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20 shadow-lg">
                                <div
                                    className="text-white pedagogical-objective"
                                    dangerouslySetInnerHTML={{ __html: pedagogicalObjective }}
                                    style={{
                                        fontSize: '1rem',
                                        lineHeight: '1.75'
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* <-- AJOUT: Barre de progression si quiz déjà tenté */}
                    {moduleProgress?.quiz_score !== null && moduleProgress?.quiz_score !== undefined && (
                        <div className="bg-blue-50 px-8 py-4 border-b border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Meilleur score au quiz</span>
                                <span className={`text-lg font-bold ${moduleProgress.quiz_score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                    {moduleProgress.quiz_score}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                        moduleProgress.quiz_score >= 70 ? 'bg-green-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${moduleProgress.quiz_score}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Contenu du module avec support des slides */}
                    <div className="px-8 py-10">
                        {selectedModule.content ? (
                            <div className="module-content-wrapper">
                                <div className="prose prose-lg max-w-none prose-indigo prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900"
                                     dangerouslySetInnerHTML={{ __html: selectedModule.content }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">Contenu du module en préparation...</p>
                            </div>
                        )}

                        {/* Navigation entre les slides */}
                        {totalSlides > 1 && (
                            <div className="mt-8 pt-8 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
                                        disabled={currentSlide === 1}
                                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                                            currentSlide === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                        }`}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        <span>Précédent</span>
                                    </button>

                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600 font-medium">
                                            Slide {currentSlide} / {totalSlides}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
                                        disabled={currentSlide === totalSlides}
                                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                                            currentSlide === totalSlides
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                                        }`}
                                    >
                                        <span>Suivant</span>
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* <-- AJOUT: Section Quiz */}
                    {hasQuiz && !isCompleted && (
                        <div className="px-8 py-10 bg-gradient-to-br from-indigo-50 to-purple-50 border-t-4 border-indigo-500">
                            <div className="max-w-3xl mx-auto">
                                {!quizState.isActive && !quizState.showResults && (
                                    // Bouton pour démarrer le quiz
                                    <div className="text-center">
                                        {quizLoading ? (
                                            <div className="py-12">
                                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                                                <p className="text-gray-600">Chargement du quiz...</p>
                                            </div>
                                        ) : quizQuestions.length > 0 ? (
                                            <>
                                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6 shadow-lg">
                                                    <Brain className="w-10 h-10 text-white" />
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                                    Testez vos connaissances
                                                </h3>
                                                <p className="text-gray-600 mb-6">
                                                    Répondez à {quizQuestions.length} questions pour valider ce module. Score minimum requis: <strong>{quizPassingScore}%</strong>
                                                </p>
                                                <button
                                                    onClick={startQuiz}
                                                    className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                                >
                                                    <Brain className="w-6 h-6" />
                                                    <span>Commencer le quiz</span>
                                                </button>
                                                <p className="text-sm text-gray-500 mt-4">
                                                    Vous avez 2 tentatives toutes les 8 heures
                                                </p>
                                            </>
                                        ) : (
                                            <p className="text-gray-500">Aucun quiz disponible pour ce module.</p>
                                        )}
                                    </div>
                                )}

                                {/* Quiz en cours */}
                                {(() => {
                                    const currentIndex = Object.keys(quizState.answers).length;
                                    return quizState.isActive && currentIndex < quizQuestions.length && (
                                        <div id="quiz-container" className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-200">
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-sm font-medium text-gray-600">
                                                        Question {currentIndex + 1} sur {quizQuestions.length}
                                                    </span>
                                                    <span className="text-sm font-medium text-indigo-600">
                                                        {Math.round((currentIndex / quizQuestions.length) * 100)}% complété
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${(currentIndex / quizQuestions.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <h4 className="text-xl font-bold text-gray-900 mb-6 leading-relaxed">
                                                {quizQuestions[currentIndex].question}
                                            </h4>

                                            <div className="space-y-3">
                                                {quizQuestions[currentIndex].options.map((option, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => answerQuestion(index)}
                                                    className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center font-bold text-gray-600 group-hover:text-indigo-600 transition-colors">
                                                            {String.fromCharCode(65 + index)}
                                                        </div>
                                                        <span className="text-gray-700 group-hover:text-gray-900 font-medium">
                                                            {option}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    );
                                })()}

                                {/* Bouton soumettre quand toutes les questions sont répondues */}
                               {/*quizState.isActive && quizState.currentQuestion === quizQuestions.length && */}
                                {quizState.isActive && Object.keys(quizState.answers).length === quizQuestions.length && (
                                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-green-200">
                                        <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                                        <h4 className="text-2xl font-bold text-gray-900 mb-3">
                                            Quiz terminé !
                                        </h4>
                                        <p className="text-gray-600 mb-6">
                                            Vous avez répondu à toutes les questions. Cliquez ci-dessous pour voir votre score.
                                        </p>
                                        <button
                                            onClick={submitQuiz}
                                            className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-lg shadow-lg"
                                        >
                                            <Target className="w-6 h-6" />
                                            <span>Voir mon score</span>
                                        </button>
                                    </div>
                                )}

                                {/* Résultats du quiz */}
                                {quizState.showResults && quizState.score !== null && (
                                    <div id="quiz-results" className={`bg-white rounded-2xl shadow-xl p-8 border-4 ${quizState.passed ? 'border-green-500' : 'border-red-500'}`}>
                                        <div className="text-center mb-8">
                                            {quizState.passed ? (
                                                <>
                                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-xl">
                                                        <Star className="w-12 h-12 text-white" />
                                                    </div>
                                                    <h3 className="text-3xl font-bold text-green-600 mb-3">
                                                        Félicitations ! 🎉
                                                    </h3>
                                                    <p className="text-gray-700 text-lg mb-4">
                                                        Vous avez réussi le quiz avec un score de
                                                    </p>
                                                    <div className="text-6xl font-extrabold text-green-600 mb-6">
                                                        {quizState.score}%
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-red-400 to-pink-500 rounded-full mb-6 shadow-xl">
                                                        <XCircle className="w-12 h-12 text-white" />
                                                    </div>
                                                    <h3 className="text-3xl font-bold text-red-600 mb-3">
                                                        Score insuffisant
                                                    </h3>
                                                    <p className="text-gray-700 text-lg mb-4">
                                                        Votre score :
                                                    </p>
                                                    <div className="text-6xl font-extrabold text-red-600 mb-2">
                                                        {quizState.score}%
                                                    </div>
                                                    <p className="text-gray-600">
                                                        Minimum requis: <strong>70%</strong>
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* Détails des réponses */}
                                        {quizState.detailedResults && quizState.detailedResults.length > 0 && (
                                            <div className="space-y-4 mb-8">
                                                {quizState.detailedResults.map((result, index) => {
                                                    const isCorrect = result.isCorrect;

                                                    return (
                                                        <div key={result.questionId || index} className={`p-5 rounded-xl border-2 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                                            <div className="flex items-start space-x-3 mb-3">
                                                                {isCorrect ? (
                                                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                                                ) : (
                                                                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                                                )}
                                                                <div className="flex-1">
                                                                    <p className="font-semibold text-gray-900 mb-2">
                                                                        {result.question}
                                                                    </p>
                                                                    {result.explanation && (
                                                                        <p className="text-sm text-gray-600 italic mt-2 pt-2 border-t border-gray-300">
                                                                            💡 {result.explanation}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Boutons d'action */}
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            {!quizState.passed && (
                                                <button
                                                    onClick={retryQuiz}
                                                    className="inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                                                >
                                                    <Brain className="w-5 h-5" />
                                                    <span>Réessayer le quiz</span>
                                                </button>
                                            )}

                                            {quizState.passed && (() => {
                                                // Trouver le prochain module
                                                const currentOrder = selectedModule.order_index ?? 0;
                                                const nextModule = modules.find(m => (m.order_index ?? 0) === currentOrder + 1);

                                                return nextModule ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedModule(nextModule);
                                                            setQuizState({
                                                                isActive: false,
                                                                answers: {},
                                                                score: null,
                                                                passed: null,
                                                                showResults: false
                                                            });
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                                                    >
                                                        <span>Continuer vers le Module {currentOrder + 1}</span>
                                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                                    </button>
                                                ) : null;
                                            })()}

                                            <button
                                                onClick={() => {
                                                    setSelectedModule(null);
                                                    setQuizState({
                                                        isActive: false,
                                                        answers: {},
                                                        score: null,
                                                        passed: null,
                                                        showResults: false
                                                    });
                                                }}
                                                className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                                <span>Retour aux modules</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer du module */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            {!hasQuiz && !isCompleted && (
                                <button
                                    onClick={() => handleMarkAsCompleted(selectedModule.slug)}
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium w-full sm:w-auto flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                                >
                                    <Award className="w-5 h-5" />
                                    <span>Marquer comme complété</span>
                                </button>
                            )}

                            {isCompleted && (
                                <div className="flex items-center space-x-2 text-green-600">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Module validé !</span>
                                </div>
                            )}

                            <button 
                                onClick={() => setSelectedModule(null)} 
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto shadow-md hover:shadow-lg"
                            >
                                Continuer l'apprentissage
                            </button>
                        </div>
                    </div>
                </article>
            </div>
        );
    }

    // --- AFFICHAGE LISTE DES MODULES ---
    const completedCount = progress.filter(p => p.is_completed).length;
    const totalModules = modules.length;
    const progressPercentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* <-- CORRECTION: En-tête amélioré */}
            <div className="mb-12">
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Académie de l'Investissement
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                        Apprenez à investir intelligemment avec nos modules interactifs. Quiz,  contenu progressif et audio pour une expérience d'apprentissage complète.
                    </p>
                </div>

                {/* <-- AJOUT: Barre de progression globale */}
                {isLoggedIn && (
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Votre Progression</h3>
                                    <p className="text-sm text-gray-600">{completedCount} / {totalModules} modules complétés</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-extrabold text-blue-600">{progressPercentage}%</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {!isLoggedIn && (
                    <div className="max-w-2xl mx-auto bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8">
                        <div className="flex items-start space-x-4">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-yellow-900 mb-1">
                                    Connectez-vous pour suivre votre progression
                                </p>
                                <p className="text-yellow-700 text-sm">
                                    Créez un compte gratuit pour débloquer les quiz, sauvegarder votre progression et obtenir des certificats.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* <-- CORRECTION: Filtres de difficulté améliorés */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-10 sticky top-20 z-10">
                <div className="flex flex-wrap gap-3">
                    {['all', 'debutant', 'intermediaire', 'avance'].map((difficulty) => (
                        <button
                            key={difficulty}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all transform hover:scale-105 ${
                                selectedDifficulty === difficulty 
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {difficulty === 'all' ? '📚 Tous les modules' : `${getDifficultyLabel(difficulty)}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 font-medium">Chargement des modules...</p>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h3>
                    <p className="text-red-600 mb-6">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {/* <-- CORRECTION: Grille de modules améliorée */}
            {!loading && !error && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, index) => {
                        const isCompleted = isModuleCompleted(module.slug);
                        const isUnlocked = isModuleUnlocked(module);
                        const previousModule = getPreviousIncompleteModule(module);
                        const hasQuiz = (module.order_index ?? 0) >= 1;

                        return (
                            <button
                                key={module.id}
                                onClick={() => {
                                  if (!isUnlocked) {
                                    toast.error(`Veuillez d'abord compléter "${previousModule?.title}"`);
                                    return;
                                  }
                                  setSelectedModule(module);
                                }}
                                disabled={!isUnlocked}
                                className={`bg-white rounded-2xl shadow-lg border-2 p-6 transition-all text-left flex flex-col h-full group relative overflow-hidden ${
                                    isCompleted 
                                        ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl hover:-translate-y-1' 
                                        : isUnlocked
                                        ? 'border-gray-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1'
                                        : 'border-gray-200 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                {/* <-- AJOUT: Overlay de verrouillage */}
                                {!isUnlocked && (
                                    <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] flex items-center justify-center z-10">
                                        <div className="bg-white rounded-full p-4 shadow-xl">
                                            <Lock className="w-8 h-8 text-gray-600" />
                                        </div>
                                    </div>
                                )}

                                {/* Badge de statut en haut */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-md">
                                        {module.order_index ?? index + 1}
                                    </div>
                                    
                                    <div className="flex flex-col items-end space-y-2">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getDifficultyColor(module.difficulty_level)}`}>
                                            {getDifficultyLabel(module.difficulty_level)}
                                        </span>
                                        
                                        {isCompleted && (
                                            <div className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                <span>Terminé</span>
                                            </div>
                                        )}

                                        {!isUnlocked && (
                                            <div className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                <Lock className="w-3.5 h-3.5" />
                                                <span>Verrouillé</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Contenu de la carte */}
                                <div className="flex flex-col flex-grow mb-4">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                                        {module.title}
                                    </h3>
                                    {module.description && (
                                        <p className="text-sm text-gray-600 line-clamp-3 flex-grow leading-relaxed">
                                            {module.description}
                                        </p>
                                    )}
                                </div>

                                {/* Footer de la carte */}
                                <div className="pt-4 border-t-2 border-gray-100 space-y-3">
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <div className="flex items-center space-x-1.5">
                                            <Clock className="w-4 h-4" />
                                            <span className="font-medium">{module.duration_minutes || '15'} min</span>
                                        </div>
                                        <div className="flex items-center space-x-1.5">
                                            <BookOpen className="w-4 h-4" />
                                            <span className="font-medium">
                                                {module.content_type === 'video' ? 'Vidéo' : 'Article'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* <-- AJOUT: Indicateurs quiz et audio */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {hasQuiz && (
                                            <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                <Brain className="w-3.5 h-3.5" />
                                                <span>Quiz</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center space-x-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs font-medium opacity-50">
                                            <Volume2 className="w-3.5 h-3.5" />
                                            <span>Audio</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Message pour les modules verrouillés */}
                                {!isUnlocked && previousModule && (
                                    <div className="mt-3 pt-3 border-t-2 border-gray-200">
                                        <p className="text-xs text-gray-600 font-medium">
                                            🔒 Complétez d'abord "{previousModule.title}"
                                        </p>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* No modules found */}
            {!loading && !error && modules.length === 0 && (
                <div className="text-center py-20">
                    <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-6" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Aucun module trouvé
                    </h3>
                    <p className="text-gray-500">
                        {selectedDifficulty === 'all' 
                            ? "Aucun module disponible pour le moment."
                            : `Aucun module trouvé pour le niveau "${getDifficultyLabel(selectedDifficulty)}".`
                        }
                    </p>
                </div>
            )}
        </div>
    );
}