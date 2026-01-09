// src/components/LearnPage.tsx - VERSION CORRIGÉE
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Lock,
  Volume2,
  Brain,
  Target,
  TrendingUp,
  Star,
  XCircle,
  MessageSquarePlus,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import confetti from 'canvas-confetti';
import { AITutor } from './AITutor';
import PremiumPaywall from './PremiumPaywall';
import { useAnalytics, ACTION_TYPES } from '../hooks/useAnalytics';

// --- Types ---
import { LearningModule, LearningProgress } from '../types';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizState {
  isActive: boolean;
  answers: { [questionId: string]: number };
  score: number | null;
  passed: boolean | null;
  showResults: boolean;
  detailedResults?: any[];
}

export default function LearnPage() {
    const { isLoggedIn } = useAuth();
    const { trackAction } = useAnalytics();
    const [modules, setModules] = useState<LearningModule[]>([]);
    const [allModules, setAllModules] = useState<LearningModule[]>([]); // Tous les modules pour vérification
    const [progress, setProgress] = useState<LearningProgress[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
    
    const [quizState, setQuizState] = useState<QuizState>({
      isActive: false,
      answers: {},
      score: null,
      passed: null,
      showResults: false
    });

    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

    const [currentSlide, setCurrentSlide] = useState(1);
    const [totalSlides, setTotalSlides] = useState(1);

    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
    const [quizLoading, setQuizLoading] = useState(false);
    const [quizPassingScore, setQuizPassingScore] = useState(70);

    const [showAITutor, setShowAITutor] = useState(false);
    const [showPremiumPaywall, setShowPremiumPaywall] = useState(false);

    const [readingProgress, setReadingProgress] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

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

    const isModuleUnlocked = useCallback((module: LearningModule): boolean => {
      if (!module.order_index || module.order_index <= 1) {
        return true;
      }

      // Utiliser allModules au lieu de modules pour trouver le module précédent
      const previousModule = allModules.find(m => m.order_index === (module.order_index! - 1));
      if (!previousModule) return true;

      return isModuleCompleted(previousModule.slug);
    }, [allModules, isModuleCompleted]);

    const getPreviousIncompleteModule = useCallback((module: LearningModule): LearningModule | null => {
      if (!module.order_index || module.order_index <= 1) return null;

      // Utiliser allModules au lieu de modules pour trouver le module précédent
      const previousModule = allModules.find(m => m.order_index === (module.order_index! - 1));
      if (!previousModule) return null;

      return isModuleCompleted(previousModule.slug) ? null : previousModule;
    }, [allModules, isModuleCompleted]);

    const loadModuleQuiz = useCallback(async (moduleSlug: string) => {
      setQuizLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/learning-modules/${moduleSlug}/quiz`);
        if (!response.ok) {
          throw new Error('Impossible de charger le quiz');
        }
        const quizData = await response.json();

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

    // --- Logique de Chargement (Modules + Progression) ---
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);

        const allModulesUrl = `${API_BASE_URL}/learning-modules`; // Charger TOUS les modules
        const progressUrl = `${API_BASE_URL}/learning-modules/progress`;

        try {
            const allModulesPromise = fetch(allModulesUrl).then(res => {
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

            const [allModulesData, progressData] = await Promise.all([allModulesPromise, progressPromise]);

            // Stocker tous les modules pour la vérification de déverrouillage
            setAllModules(allModulesData || []);

            // Filtrer les modules pour l'affichage selon la difficulté sélectionnée
            const filteredModules = selectedDifficulty === 'all'
                ? allModulesData
                : (allModulesData || []).filter((m: LearningModule) => m.difficulty_level === selectedDifficulty);

            setModules(filteredModules || []);
            setProgress(progressData || []);

        } catch (err: any) {
            console.error('Erreur chargement données:', err);
            setError(err.message || "Une erreur est survenue.");
            setModules([]);
            setAllModules([]);
            setProgress([]);
        } finally {
            setLoading(false);
        }
    }, [selectedDifficulty]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (!selectedModule) return;

        const slideElements = document.querySelectorAll('.slide[data-slide]');
        const count = slideElements.length;
        setTotalSlides(count > 0 ? count : 1);

        slideElements.forEach(slide => {
            (slide as HTMLElement).style.display = 'none';
        });

        const currentSlideElement = document.querySelector(`.slide[data-slide="${currentSlide}"]`);
        if (currentSlideElement) {
            (currentSlideElement as HTMLElement).style.display = 'block';
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [selectedModule, currentSlide]);

    useEffect(() => {
        setCurrentSlide(1);
    }, [selectedModule?.slug]);

    useEffect(() => {
        if (!selectedModule) {
            setReadingProgress(0);
            return;
        }

        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;
            const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
            setReadingProgress(Math.min(Math.max(scrollPercent, 0), 100));
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [selectedModule]);

    const startQuiz = useCallback(() => {
      if (!isLoggedIn) {
        toast.error("Connectez-vous pour passer le quiz.");
        return;
      }

      // Track le début du quiz
      if (selectedModule) {
        trackAction(ACTION_TYPES.TAKE_QUIZ, 'Début du quiz', {
          moduleSlug: selectedModule.slug,
          moduleTitle: selectedModule.title,
          moduleLevel: selectedModule.difficulty_level
        });
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
    }, [isLoggedIn, selectedModule, trackAction]);

    const answerQuestion = useCallback((answerIndex: number) => {
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

    const submitQuiz = useCallback(async () => {
      if (!selectedModule) return;

      const toastId = toast.loading('Validation du quiz en cours...');

      try {
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

        // Afficher les résultats d'abord
        setQuizState(prev => ({
          ...prev,
          score: result.score,
          passed: result.passed,
          showResults: true,
          isActive: false,
          detailedResults: result.detailedResults || []
        }));

        if (result.passed) {
          toast.success(`🎉 Quiz réussi ! Score: ${result.score}%`, { id: toastId });
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4ADE80', '#22C55E', '#3B82F6', '#8B5CF6']
          });
        } else {
          toast.error(`Score insuffisant: ${result.score}%. Minimum requis: ${result.passingScore}%`, { id: toastId });
        }

        // Scroller vers les résultats pour que l'utilisateur puisse les voir
        setTimeout(() => {
          document.getElementById('quiz-results')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);

        // Recharger les données en arrière-plan SANS perturber l'affichage des résultats
        // Cela met à jour la progression de l'utilisateur
        loadData();

      } catch (error: any) {
        console.error('Erreur lors de la soumission du quiz:', error);
        toast.error(error.message || 'Erreur lors de la soumission du quiz', { id: toastId });
      }
    }, [selectedModule, quizState.answers, loadData]);

    const retryQuiz = useCallback(() => {
      if (selectedModule) {
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

    const toggleAudio = useCallback(() => {
      if (!audioElement) {
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

    useEffect(() => {
      return () => {
        if (audioElement) {
          audioElement.pause();
          audioElement.src = '';
        }
      };
    }, [audioElement]);

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

        // Track la complétion du module
        if (selectedModule) {
          trackAction(ACTION_TYPES.COMPLETE_MODULE, 'Module complété', {
            moduleSlug: selectedModule.slug,
            moduleTitle: selectedModule.title,
            moduleLevel: selectedModule.difficulty_level
          });
        }

        await loadData();
        toast.success('Module terminé avec succès ! 🎉', { id: toastId });

      } catch (err) {
        console.error('Erreur complétion:', err);
        toast.error("Erreur lors du marquage du module.", { id: toastId });
      }
    }, [isLoggedIn, loadData, selectedModule, trackAction]);

    useEffect(() => {
        if (selectedModule && (selectedModule.order_index ?? 0) >= 1 && (selectedModule.order_index ?? 0) <= 4) {
            // Réinitialiser l'état du quiz quand on ouvre un nouveau module
            setQuizState({
                isActive: false,
                answers: {},
                score: null,
                passed: null,
                showResults: false,
                detailedResults: []
            });
            loadModuleQuiz(selectedModule.slug);
        }
    }, [selectedModule, loadModuleQuiz]);

    // --- AFFICHAGE DU MODULE SÉLECTIONNÉ ---
    if (selectedModule) {
        const isCompleted = isModuleCompleted(selectedModule.slug);
        const moduleProgress = progress.find(p => p.module.slug === selectedModule.slug);
        const hasQuiz = (selectedModule.order_index ?? 0) >= 1 && (selectedModule.order_index ?? 0) <= 4;

        return (
            <div className="min-h-screen bg-slate-50">
                {/* Header immersif */}
                <div className="bg-slate-900 text-white pt-8 pb-16 px-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2" />

                    <div className="max-w-4xl mx-auto relative z-10">
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
                              setShowAITutor(false);
                              if (audioElement) {
                                audioElement.pause();
                                setIsAudioPlaying(false);
                              }
                            }}
                            className="flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors text-sm font-medium group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Retour aux modules
                        </button>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="bg-blue-500/20 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                                Module {selectedModule.order_index ?? 0}
                            </span>
                            <span className="text-slate-400 text-sm">•</span>
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {selectedModule.duration_minutes || '15'} min
                            </span>
                            <span className="text-slate-400 text-sm">•</span>
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" />
                                {getDifficultyLabel(selectedModule.difficulty_level)}
                            </span>
                            {hasQuiz && (
                                <>
                                    <span className="text-slate-400 text-sm">•</span>
                                    <span className="text-slate-400 text-sm flex items-center gap-1">
                                        <Brain className="w-4 h-4" />
                                        Quiz inclus
                                    </span>
                                </>
                            )}
                            {isCompleted && (
                                <>
                                    <span className="text-slate-400 text-sm">•</span>
                                    <span className="text-green-400 text-sm flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" />
                                        Terminé
                                    </span>
                                </>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                            {selectedModule.title}
                        </h1>
                        <p className="text-slate-300 text-lg leading-relaxed max-w-2xl">
                            {selectedModule.description}
                        </p>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24">
                    <article className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

                        {/* Progress bar de lecture */}
                        <div className="sticky top-0 z-30 bg-white">
                            <div className="h-1.5 w-full bg-slate-100">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                                    style={{ width: `${readingProgress}%` }}
                                />
                            </div>
                        </div>

                        {/* Barre de progression quiz */}
                        {moduleProgress?.quiz_score !== null && moduleProgress?.quiz_score !== undefined && (
                            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">Meilleur score au quiz</span>
                                    <span className={`text-lg font-bold ${moduleProgress.quiz_score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                        {moduleProgress.quiz_score}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${
                                            moduleProgress.quiz_score >= 70 ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${moduleProgress.quiz_score}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Contenu du module - CORRECTION ICI */}
                        <div ref={contentRef}>
                            {selectedModule.content ? (
                                <div
                                    className="module-content"
                                    dangerouslySetInnerHTML={{ __html: selectedModule.content }}
                                />
                            ) : (
                                <div className="text-center py-12 px-6">
                                    <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                    <p className="text-slate-500 text-lg">Contenu du module en préparation...</p>
                                </div>
                            )}
                        </div>

                        {/* Section Quiz */}
                        {hasQuiz && !isCompleted && (
                            <div className="px-8 py-10 bg-gradient-to-br from-indigo-50 to-purple-50 border-t-4 border-indigo-500">
                                <div className="max-w-3xl mx-auto">
                                    {!quizState.isActive && !quizState.showResults && (
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

                                    {/* Bouton soumettre */}
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
                                                <div className="mb-6">
                                                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0">
                                                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                            <div className="ml-3">
                                                                <p className="text-sm font-medium text-blue-800">
                                                                    📚 Consultez vos réponses ci-dessous pour apprendre de vos erreurs !
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <h4 className="text-xl font-bold text-gray-900 mb-4">📝 Détails de vos réponses</h4>
                                                    <div className="space-y-4">
                                                        {quizState.detailedResults.map((result, index) => {
                                                            const isCorrect = result.isCorrect;

                                                            return (
                                                                <div key={result.questionId || index} className={`p-5 rounded-xl border-2 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                                                                    <div className="flex items-start space-x-3">
                                                                        {isCorrect ? (
                                                                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                                                        ) : (
                                                                            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                                                                        )}
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <p className="font-semibold text-gray-900">
                                                                                    Question {index + 1}
                                                                                </p>
                                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                                                                    {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-gray-900 mb-3">
                                                                                {result.question}
                                                                            </p>
                                                                            {result.explanation && (
                                                                                <div className="mt-3 pt-3 border-t border-gray-300">
                                                                                    <p className="text-sm font-semibold text-gray-700 mb-1">💡 Explication :</p>
                                                                                    <p className="text-sm text-gray-600">
                                                                                        {result.explanation}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
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
                                                    const currentOrder = selectedModule.order_index ?? 0;
                                                    const nextModule = modules.find(m => (m.order_index ?? 0) === currentOrder + 1);

                                                    return nextModule ? (
                                                        <button
                                                            onClick={() => {
                                                                // Réinitialiser le quiz seulement après que l'utilisateur a décidé de continuer
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
                                                            <span>Passer au Module suivant</span>
                                                            <ArrowLeft className="w-5 h-5 rotate-180" />
                                                        </button>
                                                    ) : null;
                                                })()}

                                                <button
                                                    onClick={() => {
                                                        // Réinitialiser le quiz seulement après que l'utilisateur a décidé de retourner
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

                        {/* Bouton d'aide IA */}
                        <div className="px-8 py-4 bg-blue-50 border-t border-blue-100">
                            <button
                                onClick={() => setShowPremiumPaywall(true)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                            >
                                <HelpCircle className="w-5 h-5" />
                                Je ne comprends pas quelque chose - Demander au tuteur IA
                            </button>
                        </div>

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

                    {/* Bouton flottant AI Tutor */}
                    {!showAITutor && (
                        <button
                            onClick={() => setShowPremiumPaywall(true)}
                            className="fixed bottom-8 right-8 bg-white p-4 rounded-full shadow-xl border border-slate-100 text-blue-600 hover:text-blue-700 transition-transform hover:scale-110 z-40 group"
                        >
                            <MessageSquarePlus className="w-6 h-6" />
                            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Tuteur IA
                            </span>
                        </button>
                    )}

                    {/* Composant AI Tutor - Désactivé, remplacé par paywall */}
                    {/* <AITutor
                        context={selectedModule.description || selectedModule.title}
                        isOpen={showAITutor}
                        onClose={() => setShowAITutor(false)}
                    /> */}

                    {/* Paywall Premium pour Coach IA */}
                    <PremiumPaywall
                        isOpen={showPremiumPaywall}
                        onClose={() => setShowPremiumPaywall(false)}
                        feature="Poser vos questions au Coach IA. Passez à Investisseur+ et apprenez plus vite"
                        plan="investisseur-plus"
                    />
                </div>
            </div>
        );
    }

    // --- AFFICHAGE LISTE DES MODULES ---
    const completedCount = progress.filter(p => p.is_completed).length;
    const totalModules = modules.length;
    const progressPercentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-12">
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                        Académie de l'Investissement
                    </h1>
                    <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                        Apprenez à investir intelligemment avec nos modules interactifs. Quiz, contenu progressif et audio pour une expérience d'apprentissage complète.
                    </p>
                </div>

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

            {/* Filtres */}
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

            {loading && (
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-600 font-medium">Chargement des modules...</p>
                </div>
            )}

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

                                  // Track l'ouverture du module
                                  trackAction(ACTION_TYPES.START_MODULE, 'Ouverture de module', {
                                    moduleSlug: module.slug,
                                    moduleTitle: module.title,
                                    moduleLevel: module.difficulty_level
                                  });

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
                                {!isUnlocked && (
                                    <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[2px] flex items-center justify-center z-10">
                                        <div className="bg-white rounded-full p-4 shadow-xl">
                                            <Lock className="w-8 h-8 text-gray-600" />
                                        </div>
                                    </div>
                                )}

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