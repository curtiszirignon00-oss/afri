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
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Zap,
    Share2,
    Crown,
    FileText,
    ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL, authFetch } from '../config/api';
import { useCreatePost } from '../hooks/useSocial';
import confetti from 'canvas-confetti';
import PremiumPaywall from './PremiumPaywall';
import { AITutor } from './AITutor';
import { useAnalytics, ACTION_TYPES } from '../hooks/useAnalytics';
import CertificateModal from './CertificateModal';

// Gamification imports
import { useGamificationSummary } from '../hooks/useGamification';
import { XPProgressBar, LevelBadge, StreakCounter, showXPGainToast } from './gamification';

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
    const { isLoggedIn, userProfile } = useAuth();
    const navigate = useNavigate();
    const { trackAction } = useAnalytics();
    const { mutate: createPost, isPending: isSharing } = useCreatePost();

    // Gamification data
    const { data: gamificationSummary, refetch: refetchGamification } = useGamificationSummary();

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
    const [showModulePaywall, setShowModulePaywall] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [showCertPaywall, setShowCertPaywall] = useState(false);

    const isPremiumModule = (orderIndex: number) => orderIndex === 14 || orderIndex === 15;
    const userHasPremium = ['premium', 'max', 'pro'].includes(userProfile?.subscriptionTier ?? '');
    const userHasInvestisseurPlus = ['investisseur-plus', 'premium', 'pro', 'max'].includes(userProfile?.subscriptionTier ?? '');

    const [readingProgress, setReadingProgress] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);

    // Mobile horizontal scroll for module cards
    const modulesScrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [activeCardIndex, setActiveCardIndex] = useState(0);

    const updateScrollState = useCallback(() => {
        const el = modulesScrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);

        // Calculate active card index based on scroll position
        const cardWidth = el.firstElementChild
            ? (el.firstElementChild as HTMLElement).offsetWidth + 12 // 12 = gap
            : 1;
        const idx = Math.round(el.scrollLeft / cardWidth);
        setActiveCardIndex(idx);
    }, []);

    useEffect(() => {
        const el = modulesScrollRef.current;
        if (!el) return;

        // Initial check
        updateScrollState();

        el.addEventListener('scroll', updateScrollState, { passive: true });
        window.addEventListener('resize', updateScrollState);
        return () => {
            el.removeEventListener('scroll', updateScrollState);
            window.removeEventListener('resize', updateScrollState);
        };
    }, [modules, loading, updateScrollState]);

    const scrollModules = useCallback((direction: 'left' | 'right') => {
        const el = modulesScrollRef.current;
        if (!el) return;
        const cardWidth = el.firstElementChild
            ? (el.firstElementChild as HTMLElement).offsetWidth + 12
            : 300;
        el.scrollBy({
            left: direction === 'left' ? -cardWidth : cardWidth,
            behavior: 'smooth',
        });
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
            if (response.status === 404) {
                // Pas de quiz pour ce module, pas d'erreur
                setQuizQuestions([]);
                return;
            }
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
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);

        const allModulesUrl = `${API_BASE_URL}/learning-modules`; // Charger TOUS les modules
        const progressUrl = `${API_BASE_URL}/learning-modules/progress`;

        try {
            const allModulesPromise = fetch(allModulesUrl).then(res => {
                if (!res.ok) throw new Error(`Erreur ${res.status}: Impossible de charger les modules.`);
                return res.json();
            });

            const progressPromise = authFetch(progressUrl).then(res => {
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

        // Attendre que le DOM soit mis à jour après le rendu de dangerouslySetInnerHTML
        const timeoutId = setTimeout(() => {
            const moduleContent = document.querySelector('.module-content');
            const slideElements = moduleContent?.querySelectorAll('.slide[data-slide]') || [];
            const count = slideElements.length;

            console.log('[Slides Debug] Module:', selectedModule.slug);
            console.log('[Slides Debug] Content preview:', selectedModule.content?.substring(0, 200));
            console.log('[Slides Debug] Slides found:', count);

            setTotalSlides(count > 0 ? count : 1);

            if (count > 0) {
                slideElements.forEach(slide => {
                    (slide as HTMLElement).style.display = 'none';
                });

                const currentSlideElement = moduleContent?.querySelector(`.slide[data-slide="${currentSlide}"]`);
                if (currentSlideElement) {
                    (currentSlideElement as HTMLElement).style.display = 'block';
                }
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);

        return () => clearTimeout(timeoutId);
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
            const response = await authFetch(`${API_BASE_URL}/learning-modules/${selectedModule.slug}/submit-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers: quizState.answers })
            });

            if (response.status === 401) {
                toast.dismiss(toastId);
                toast.error('Session expirée. Veuillez vous reconnecter.');
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de la soumission du quiz');
            }

            const result = await response.json();
            console.log('📊 Résultat du quiz reçu:', result);
            console.log('📝 Détails des réponses:', result.detailedResults);

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

                // Show XP gain toast
                const xpGained = result.score === 100 ? 100 : 50; // 100 XP for perfect, 50 for pass
                showXPGainToast({
                    xpGained,
                    bonusXP: result.score === 100 ? { reason: 'Quiz parfait', amount: 50 } : undefined,
                    newAchievements: result.newAchievements || [],
                    levelUp: result.levelUp || undefined
                });

                // Refresh gamification data
                refetchGamification();
            } else {
                toast.error(`Score insuffisant: ${result.score}%. Minimum requis: ${result.passingScore}%`, { id: toastId });
            }

            // Scroller vers les résultats pour que l'utilisateur puisse les voir
            setTimeout(() => {
                document.getElementById('quiz-results')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

            // Recharger les données en arrière-plan SANS perturber l'affichage des résultats
            // Cela met à jour la progression de l'utilisateur
            loadData(true);

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
            const response = await authFetch(`${API_BASE_URL}/learning-modules/${moduleSlug}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || `Erreur ${response.status}: Impossible de marquer comme complété.`);
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

            // Show XP gain toast for module completion
            showXPGainToast({
                xpGained: 200, // Standard XP for module completion
                bonusXP: undefined,
                newAchievements: [],
                levelUp: undefined
            });

            // Refresh gamification data
            refetchGamification();

            // Vérifier si tous les modules publiés sont maintenant complétés
            const updatedProgressRes = await authFetch(`${API_BASE_URL}/learning-modules/progress`).catch(() => null);
            if (updatedProgressRes && updatedProgressRes.ok) {
                const updatedProgress: import('../types').LearningProgress[] = await updatedProgressRes.json();
                const publishedModules = allModules.filter(m => m.is_published);
                const allDone = publishedModules.length > 0 &&
                    publishedModules.every(m => updatedProgress.some(p => p.module.slug === m.slug && p.is_completed));
                if (allDone) {
                    setTimeout(() => {
                        confetti({
                            particleCount: 300,
                            spread: 100,
                            origin: { y: 0.5 },
                            colors: ['#4338ca', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']
                        });
                        if (userHasInvestisseurPlus) {
                            setShowCertificate(true);
                        } else {
                            setShowCertPaywall(true);
                        }
                    }, 800);
                }
            }

        } catch (err: any) {
            console.error('Erreur complétion:', err);
            const errorMessage = err?.message || "Erreur lors du marquage du module.";
            toast.error(errorMessage, { id: toastId });
        }
    }, [isLoggedIn, loadData, selectedModule, trackAction]);

    useEffect(() => {
        if (selectedModule && (selectedModule.order_index ?? 0) >= 1 && (selectedModule.order_index ?? 0) !== 4 && (selectedModule.order_index ?? 0) !== 5 && (selectedModule.order_index ?? 0) !== 13) {
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
        const hasQuiz = (selectedModule.order_index ?? 0) >= 1 && (selectedModule.order_index ?? 0) !== 4 && (selectedModule.order_index ?? 0) !== 5 && (selectedModule.order_index ?? 0) !== 13;

        return (
            <div className="min-h-screen bg-slate-50 overflow-x-hidden">
                {/* Header immersif */}
                <div className="bg-slate-900 text-white pt-6 sm:pt-8 pb-12 sm:pb-16 px-4 relative overflow-hidden">
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

                        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
                            {selectedModule.title}
                        </h1>
                        <p className="text-slate-300 text-sm sm:text-lg leading-relaxed max-w-2xl">
                            {selectedModule.description}
                        </p>
                    </div>
                </div>

                {/* Contenu principal */}
                <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24">
                    <article className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-full">

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
                            <div className="bg-slate-50 px-4 sm:px-8 py-3 sm:py-4 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-700">Meilleur score au quiz</span>
                                    <span className={`text-lg font-bold ${moduleProgress.quiz_score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                        {moduleProgress.quiz_score}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${moduleProgress.quiz_score >= 70 ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${moduleProgress.quiz_score}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Contenu du module - Caché pendant le quiz */}
                        {!quizState.isActive && !quizState.showResults && (
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

                                {/* Ressources du module : étude de cas PDF + dashboard */}
                                {(selectedModule.attachment_url || selectedModule.dashboard_url) && (() => {
                                    const backendBase = API_BASE_URL.replace(/\/api$/, '');
                                    return (
                                        <div className="mt-8 mx-4 sm:mx-8 mb-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
                                            <h3 className="text-base font-semibold text-amber-900 mb-4 flex items-center gap-2">
                                                <Star className="w-5 h-5 text-amber-500" />
                                                Ressources exclusives – Étude de cas
                                            </h3>
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {selectedModule.attachment_url && (
                                                    <a
                                                        href={`${backendBase}${selectedModule.attachment_url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-amber-300 text-amber-800 rounded-xl font-medium hover:bg-amber-50 transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <FileText className="w-5 h-5 text-amber-600" />
                                                        Rapport d'analyse UNIWAX 2026
                                                    </a>
                                                )}
                                                {selectedModule.dashboard_url && (
                                                    <a
                                                        href={selectedModule.dashboard_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        <ExternalLink className="w-5 h-5" />
                                                        Dashboard Analytique
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Navigation Slides - Cachée pendant le quiz */}
                        {totalSlides > 1 && !quizState.isActive && !quizState.showResults && (
                            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-lg">
                                <button
                                    onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
                                    disabled={currentSlide === 1}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${currentSlide === 1
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    <span className="hidden sm:inline">Précédent</span>
                                </button>

                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-slate-600">
                                        {currentSlide} / {totalSlides}
                                    </span>
                                    <div className="hidden sm:flex items-center gap-1">
                                        {Array.from({ length: totalSlides }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentSlide(i + 1)}
                                                className={`w-2.5 h-2.5 rounded-full transition-all ${currentSlide === i + 1
                                                    ? 'bg-blue-600 w-6'
                                                    : 'bg-slate-300 hover:bg-slate-400'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
                                    disabled={currentSlide === totalSlides}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${currentSlide === totalSlides
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    <span className="hidden sm:inline">Suivant</span>
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Section Quiz */}
                        {hasQuiz && (!isCompleted || quizState.showResults) && (
                            <div className="px-4 sm:px-8 py-6 sm:py-10 bg-gradient-to-br from-indigo-50 to-purple-50 border-t-4 border-indigo-500">
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
                                            <div id="quiz-container" className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 border-2 border-indigo-200">
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

                                                {quizState.detailedResults && quizState.detailedResults.length > 0 ? (
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
                                                ) : (
                                                    <div className="bg-gray-50 p-6 rounded-xl text-center">
                                                        <p className="text-gray-600">
                                                            Les détails des réponses ne sont pas disponibles pour ce quiz.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Partager dans la communauté */}
                                            {isLoggedIn && (
                                                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                                                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                                                        <div className="flex items-center gap-2 text-indigo-700">
                                                            <Share2 className="w-5 h-5" />
                                                            <span className="font-medium text-sm">Partagez votre score avec la communauté !</span>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                const score = quizState.score;
                                                                const moduleTitle = selectedModule.title;
                                                                const passed = quizState.passed;
                                                                const correctCount = quizState.detailedResults?.filter(r => r.isCorrect).length ?? 0;
                                                                const totalCount = quizState.detailedResults?.length ?? quizQuestions.length;

                                                                const emoji = passed ? (score! >= 90 ? '🏆' : '🎉') : '💪';
                                                                const content = passed
                                                                    ? `${emoji} J'ai obtenu ${score}% au quiz "${moduleTitle}" (${correctCount}/${totalCount} bonnes réponses) ! #AfriBourse #Apprentissage`
                                                                    : `${emoji} J'ai terminé le quiz "${moduleTitle}" avec ${score}% (${correctCount}/${totalCount}). Je continue à apprendre ! #AfriBourse #Apprentissage`;

                                                                createPost({
                                                                    type: 'ACHIEVEMENT',
                                                                    content,
                                                                    tags: ['quiz', 'apprentissage', selectedModule.slug],
                                                                    metadata: {
                                                                        quizScore: score,
                                                                        moduleName: moduleTitle,
                                                                        moduleSlug: selectedModule.slug,
                                                                        passed,
                                                                        correctAnswers: correctCount,
                                                                        totalQuestions: totalCount,
                                                                    },
                                                                }, {
                                                                    onSuccess: () => {
                                                                        toast.success('Score partagé dans la communauté !');
                                                                    },
                                                                    onError: () => {
                                                                        toast.error('Erreur lors du partage. Réessayez.');
                                                                    },
                                                                });
                                                            }}
                                                            disabled={isSharing}
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg disabled:opacity-50 whitespace-nowrap"
                                                        >
                                                            <Share2 className="w-4 h-4" />
                                                            {isSharing ? 'Partage...' : 'Partager mon score'}
                                                        </button>
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
                                                                if (isPremiumModule(nextModule.order_index ?? 0) && !userHasPremium) {
                                                                    setShowPremiumPaywall(true);
                                                                    return;
                                                                }
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

                        {/* Bouton d'aide IA - Caché pendant le quiz et les résultats */}
                        {!quizState.isActive && !quizState.showResults && (
                        <div className="px-4 sm:px-8 py-3 sm:py-4 bg-blue-50 border-t border-blue-100">
                            <button
                                onClick={() => setShowPremiumPaywall(true)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                            >
                                <HelpCircle className="w-5 h-5" />
                                Je ne comprends pas quelque chose - Demander au tuteur IA
                            </button>
                        </div>
                        )}

                        {/* Footer du module - Caché pendant le quiz et les résultats */}
                        {!quizState.isActive && !quizState.showResults && (
                        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 border-t border-gray-200">
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
                                    onClick={() => {
                                        // Trouver le module suivant
                                        const currentOrder = selectedModule.order_index ?? 0;
                                        const nextModule = allModules.find(m => (m.order_index ?? 0) === currentOrder + 1);

                                        if (nextModule && isModuleUnlocked(nextModule)) {
                                            if (isPremiumModule(nextModule.order_index ?? 0) && !userHasPremium) {
                                                setShowPremiumPaywall(true);
                                            } else {
                                                setSelectedModule(nextModule);
                                                setQuizState({
                                                    isActive: false,
                                                    answers: {},
                                                    score: null,
                                                    passed: null,
                                                    showResults: false
                                                });
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }
                                        } else {
                                            // Retour à la liste si pas de module suivant
                                            setSelectedModule(null);
                                        }
                                    }}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium w-full sm:w-auto shadow-md hover:shadow-lg"
                                >
                                    Continuer l'apprentissage
                                </button>
                            </div>
                        </div>
                        )}
                    </article>

                    {/* Bouton flottant AI Tutor — masqué pendant le quiz */}
                    {!showAITutor && !quizState.isActive && !quizState.showResults && (
                        <button
                            onClick={() => userHasPremium ? setShowAITutor(true) : setShowPremiumPaywall(true)}
                            className="fixed bottom-8 right-8 bg-white p-4 rounded-full shadow-xl border border-slate-100 text-blue-600 hover:text-blue-700 transition-transform hover:scale-110 z-40 group"
                        >
                            <MessageSquarePlus className="w-6 h-6" />
                            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Tuteur IA
                            </span>
                        </button>
                    )}

                    {/* Composant AI Tutor — fermé automatiquement pendant le quiz */}
                    <AITutor
                        userContext={{
                            currentModule: selectedModule?.title,
                            currentLesson: selectedModule?.slug,
                            level: (selectedModule?.difficulty_level as any) ?? 'débutant',
                            lastQuizScore: moduleProgress?.quiz_score ?? undefined,
                        }}
                        isOpen={showAITutor && !quizState.isActive && !quizState.showResults}
                        onClose={() => setShowAITutor(false)}
                    />

                    {/* Paywall Premium pour Coach IA */}
                    <PremiumPaywall
                        isOpen={showPremiumPaywall}
                        onClose={() => setShowPremiumPaywall(false)}
                        feature="Poser vos questions au Coach IA. Passez à Investisseur+ et apprenez plus vite"
                        plan="investisseur-plus"
                    />

                    {/* Paywall Premium pour modules avancés */}
                    <PremiumPaywall
                        isOpen={showModulePaywall}
                        onClose={() => setShowModulePaywall(false)}
                        feature="Accéder aux modules avancés (Fiscalité, Portefeuille Réel). Passez à Investisseur+ pour débloquer l'intégralité de la formation."
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

    // --- Données pour le certificat ---
    const publishedModules = allModules.filter(m => m.is_published);
    const allModulesCompleted =
        isLoggedIn &&
        publishedModules.length > 0 &&
        publishedModules.every(m => progress.some(p => p.module.slug === m.slug && p.is_completed));

    const certCompletedProgress = progress.filter(p => p.is_completed);
    const scoresWithQuiz = certCompletedProgress.filter(p => p.quiz_score !== null && p.quiz_score !== undefined);
    const certAverageScore = scoresWithQuiz.length > 0
        ? Math.round(scoresWithQuiz.reduce((sum, p) => sum + (p.quiz_score ?? 0), 0) / scoresWithQuiz.length)
        : 87;

    const certDates = certCompletedProgress
        .filter(p => p.completed_at)
        .map(p => new Date(p.completed_at!).getTime());
    const certDurationDays = certDates.length >= 2
        ? Math.max(1, Math.ceil((Math.max(...certDates) - Math.min(...certDates)) / (1000 * 60 * 60 * 24)))
        : certDates.length === 1 ? 1 : 14;

    const certUserName = [userProfile?.name, userProfile?.lastname]
        .filter(Boolean)
        .join(' ') || 'Investisseur';

    const certId = (() => {
        const uid = userProfile?.id || 'anon';
        const hash = uid.split('').reduce((acc: number, c: string) => ((acc * 31 + c.charCodeAt(0)) & 0xfffff), 0);
        return `AF-${new Date().getFullYear()}-${String(Math.abs(hash)).padStart(5, '0')}`;
    })();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
            {showCertificate && (
                <CertificateModal
                    onClose={() => setShowCertificate(false)}
                    userName={certUserName}
                    modulesCompleted={certCompletedProgress.length}
                    totalModules={publishedModules.length}
                    averageScore={certAverageScore}
                    durationDays={certDurationDays}
                    certId={certId}
                />
            )}

            <PremiumPaywall
                isOpen={showCertPaywall}
                onClose={() => setShowCertPaywall(false)}
                feature="Télécharger et partager votre certificat officiel AfriBourse. Passez à Investisseur+ pour débloquer votre attestation de réussite."
                plan="investisseur-plus"
            />
            <div className="mb-8 sm:mb-12">
                <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-4">
                        Académie de l'Investissement
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-lg md:text-xl leading-relaxed">
                        Apprenez à investir intelligemment avec nos modules interactifs. Quiz, contenu progressif et audio pour une expérience d'apprentissage complète.
                    </p>
                </div>

                {isLoggedIn && (
                    <div className="max-w-4xl mx-auto mb-8">
                        {/* Gamification Stats */}
                        {gamificationSummary && (
                            <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-4 mb-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
                                {/* Level & XP */}
                                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 min-w-[220px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-start">
                                    <div className="flex items-center gap-3 mb-3">
                                        <LevelBadge level={gamificationSummary.xp.level} size="md" />
                                        <div>
                                            <p className="text-sm text-gray-500">Niveau {gamificationSummary.xp.level}</p>
                                            <p className="font-bold text-gray-900">{gamificationSummary.xp.title}</p>
                                        </div>
                                    </div>
                                    <XPProgressBar
                                        stats={gamificationSummary.xp}
                                        showDetails={false}
                                        size="sm"
                                    />
                                </div>

                                {/* Streak */}
                                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 flex items-center justify-center min-w-[180px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-start">
                                    <StreakCounter
                                        streak={gamificationSummary.streak}
                                        size="md"
                                        showFreezes={false}
                                    />
                                </div>

                                {/* Total XP */}
                                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-lg border-2 border-amber-200 p-4 flex flex-col items-center justify-center min-w-[160px] sm:min-w-0 flex-shrink-0 sm:flex-shrink snap-start">
                                    <Zap className="w-8 h-8 text-amber-600 mb-2" />
                                    <p className="text-2xl font-bold text-amber-700">{gamificationSummary.xp.total_xp.toLocaleString()}</p>
                                    <p className="text-sm text-amber-600">XP Total</p>
                                </div>
                            </div>
                        )}

                        {/* Learning Progress */}
                        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">Votre Progression</h3>
                                        <p className="text-xs sm:text-sm text-gray-600">{completedCount} / {totalModules} modules</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {allModulesCompleted && (
                                        <button
                                            onClick={() => userHasInvestisseurPlus ? setShowCertificate(true) : setShowCertPaywall(true)}
                                            className={`flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${userHasInvestisseurPlus ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 hover:bg-amber-600'}`}
                                        >
                                            {userHasInvestisseurPlus ? <Award className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                                            Certificat
                                        </button>
                                    )}
                                    <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">{progressPercentage}%</span>
                                </div>
                            </div>
                            {/* Barre de progression avec objectif certificat */}
                            <div className="relative">
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                {/* Icône certificat à la fin de la barre */}
                                <div className="absolute -right-1 -top-3.5 flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-md transition-all ${allModulesCompleted ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}>
                                        {allModulesCompleted
                                            ? <Award className="w-5 h-5 text-yellow-300" />
                                            : <Lock className="w-4 h-4 text-gray-400" />
                                        }
                                    </div>
                                    <span className={`text-xs font-semibold mt-1 whitespace-nowrap ${allModulesCompleted ? 'text-indigo-600' : 'text-gray-400'}`}>
                                        Certificat
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bandeau certificat débloqué */}
                {allModulesCompleted && (
                    <div className="max-w-4xl mx-auto mb-8">
                        {userHasInvestisseurPlus ? (
                            /* Abonné Investisseur+ → certificat disponible */
                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 sm:p-6 shadow-xl">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-14 h-14 flex-shrink-0 bg-white/20 rounded-full flex items-center justify-center">
                                        <Award className="w-8 h-8 text-yellow-300" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="text-white font-extrabold text-lg sm:text-xl mb-1">
                                            Félicitations ! Parcours complété
                                        </div>
                                        <div className="text-indigo-200 text-sm">
                                            Vous avez terminé tous les modules du Parcours Investisseur BRVM. Votre certificat est disponible.
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCertificate(true)}
                                        className="flex-shrink-0 flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:bg-indigo-50 transition-colors active:scale-95"
                                    >
                                        <Award className="w-4 h-4" />
                                        Voir mon certificat
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Non abonné → incitation à passer Investisseur+ */
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 sm:p-6 shadow-xl">
                                <div className="flex flex-col sm:flex-row items-center gap-4">
                                    <div className="w-14 h-14 flex-shrink-0 bg-white/20 rounded-full flex items-center justify-center">
                                        <Crown className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <div className="text-white font-extrabold text-lg sm:text-xl mb-1">
                                            Parcours complété — Certificat verrouillé
                                        </div>
                                        <div className="text-amber-100 text-sm">
                                            Passez à Investisseur+ pour débloquer et télécharger votre certificat officiel AfriBourse.
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowCertPaywall(true)}
                                        className="flex-shrink-0 flex items-center gap-2 bg-white text-amber-700 font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:bg-amber-50 transition-colors active:scale-95"
                                    >
                                        <Crown className="w-4 h-4" />
                                        Débloquer le certificat
                                    </button>
                                </div>
                            </div>
                        )}
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

            {/* Teaser certificat — visible tant que le parcours n'est pas complété */}
            {isLoggedIn && !allModulesCompleted && (
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 to-indigo-900 rounded-2xl px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-4 shadow-lg">
                        {/* Halo décoratif */}
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500 rounded-full opacity-10 blur-2xl pointer-events-none" />
                        <div className="absolute right-16 -bottom-8 w-28 h-28 bg-purple-500 rounded-full opacity-10 blur-2xl pointer-events-none" />

                        {/* Icône cadenas + award */}
                        <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14">
                            <div className="w-full h-full rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                                <Award className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-300" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-slate-800">
                                <Lock className="w-2.5 h-2.5 text-amber-900" />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm sm:text-base leading-snug">
                                Certificat officiel à débloquer
                            </div>
                            <div className="text-indigo-300 text-xs sm:text-sm mt-0.5">
                                Complétez les {publishedModules.length - completedCount} modules restants
                                {!userHasInvestisseurPlus && ' et passez à Investisseur+'} pour obtenir votre attestation de réussite AfriBourse.
                            </div>
                        </div>

                        {/* Mini aperçu */}
                        <div className="hidden sm:flex flex-col items-center flex-shrink-0 bg-white/10 border border-white/20 rounded-xl px-4 py-2 gap-0.5">
                            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Récompense</span>
                            <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-sm font-bold text-white">Certifié BRVM</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-10 sticky top-20 z-10">
                <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 snap-x snap-mandatory">
                    {['all', 'debutant', 'intermediaire', 'avance'].map((difficulty) => (
                        <button
                            key={difficulty}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-sm transition-all transform hover:scale-105 whitespace-nowrap flex-shrink-0 snap-start ${selectedDifficulty === difficulty
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {difficulty === 'all' ? '📚 Tous' : `${getDifficultyLabel(difficulty)}`}
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
                        onClick={() => loadData()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        Réessayer
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div className="relative">
                    {/* Fleche gauche - visible seulement sur mobile quand on peut scroller */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scrollModules('left')}
                            className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center border border-gray-200 text-gray-700 active:scale-95 transition-transform"
                            aria-label="Défiler vers la gauche"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    {/* Fleche droite - visible seulement sur mobile quand on peut scroller */}
                    {canScrollRight && (
                        <button
                            onClick={() => scrollModules('right')}
                            className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center border border-gray-200 text-gray-700 active:scale-95 transition-transform"
                            aria-label="Défiler vers la droite"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}

                    {/* Gradient de fondu gauche sur mobile */}
                    {canScrollLeft && (
                        <div className="md:hidden absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-[5] pointer-events-none" />
                    )}

                    {/* Gradient de fondu droite sur mobile */}
                    {canScrollRight && (
                        <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-[5] pointer-events-none" />
                    )}

                    {/* Module cards - horizontal scroll on mobile, grid on desktop */}
                    <div
                        ref={modulesScrollRef}
                        className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-hide pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0"
                    >
                        {modules.map((module, index) => {
                            const isCompleted = isModuleCompleted(module.slug);
                            const isUnlocked = isModuleUnlocked(module);
                            const previousModule = getPreviousIncompleteModule(module);
                            const hasQuiz = (module.order_index ?? 0) >= 1 && (module.order_index ?? 0) !== 4 && (module.order_index ?? 0) !== 5;

                            return (
                                <button
                                    key={module.id}
                                    onClick={() => {
                                        if (!isUnlocked) {
                                            toast.error(`Veuillez d'abord compléter "${previousModule?.title}"`);
                                            return;
                                        }

                                        if (isPremiumModule(module.order_index ?? 0) && !userHasPremium) {
                                            setShowModulePaywall(true);
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
                                    className={`bg-white rounded-2xl shadow-lg border-2 p-5 sm:p-6 transition-all text-left flex flex-col h-full group relative overflow-hidden w-[280px] sm:w-[320px] md:w-auto flex-shrink-0 md:flex-shrink snap-start ${isCompleted
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

                                    {isPremiumModule(module.order_index ?? 0) && !userHasPremium && isUnlocked && (
                                        <div className="absolute inset-0 bg-amber-900/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                                            <div className="bg-white rounded-full p-4 shadow-xl">
                                                <Crown className="w-8 h-8 text-amber-500" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-base sm:text-lg shadow-md">
                                            {module.order_index ?? index + 1}
                                        </div>

                                        <div className="flex flex-col items-end space-y-2">
                                            <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border-2 ${getDifficultyColor(module.difficulty_level)}`}>
                                                {getDifficultyLabel(module.difficulty_level)}
                                            </span>

                                            {isCompleted && (
                                                <div className="flex items-center space-x-1 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    <span>Terminé</span>
                                                </div>
                                            )}

                                            {!isUnlocked && (
                                                <div className="flex items-center space-x-1 bg-gray-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    <span>Verrouillé</span>
                                                </div>
                                            )}

                                            {isPremiumModule(module.order_index ?? 0) && (
                                                <div className="flex items-center space-x-1 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                                                    <Crown className="w-3.5 h-3.5" />
                                                    <span>Premium</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col flex-grow mb-4">
                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
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

                    {/* Indicateurs de position (dots) - mobile seulement */}
                    {modules.length > 1 && (
                        <div className="flex md:hidden items-center justify-center gap-1.5 mt-4">
                            {modules.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        const el = modulesScrollRef.current;
                                        if (!el || !el.firstElementChild) return;
                                        const cardWidth = (el.firstElementChild as HTMLElement).offsetWidth + 12;
                                        el.scrollTo({ left: cardWidth * idx, behavior: 'smooth' });
                                    }}
                                    className={`rounded-full transition-all duration-300 ${
                                        activeCardIndex === idx
                                            ? 'w-6 h-2 bg-blue-600'
                                            : 'w-2 h-2 bg-gray-300'
                                    }`}
                                    aria-label={`Aller au module ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
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