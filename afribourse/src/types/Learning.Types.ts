// src/types/learning.types.ts - TYPES ÉTENDUS POUR QUIZ & AUDIO

// Type pour une question de quiz
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // 3 options
  correctAnswer: number; // Index de la bonne réponse (0, 1, ou 2)
  explanation?: string; // Explication optionnelle après réponse
}

// Type pour un quiz complet
export interface ModuleQuiz {
  id: string;
  moduleSlug: string;
  questions: QuizQuestion[];
  passingScore: number; // 70% par défaut
  timeLimit?: number; // Temps limite en minutes (optionnel)
}

// Type étendu pour LearningModule avec quiz et audio
export interface LearningModuleExtended {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  difficulty_level: string;
  content_type: string;
  duration_minutes: number | null;
  order_index: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  video_url: string | null;
  audio_url: string | null; // <-- AJOUT: URL de l'audio
  has_quiz: boolean; // <-- AJOUT: Indique si le module a un quiz
  quiz?: ModuleQuiz; // <-- AJOUT: Quiz optionnel
  created_at: string | null;
  updated_at: string | null;
}

// Type étendu pour LearningProgress avec tentatives de quiz
export interface LearningProgressExtended {
  id: string;
  is_completed: boolean;
  quiz_score: number | null; // <-- Score du quiz (0-100)
  quiz_attempts: number; // <-- AJOUT: Nombre de tentatives
  last_quiz_attempt_at: string | null; // <-- AJOUT: Date de la dernière tentative
  time_spent_minutes: number | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  userId: string;
  moduleId: string;
  module: {
    slug: string;
    title: string;
    order_index: number;
    difficulty_level: string;
    duration_minutes: number | null;
    has_quiz: boolean; // <-- AJOUT
  };
}

// Type pour soumettre un quiz
export interface QuizSubmission {
  moduleSlug: string;
  answers: number[]; // Tableau des indices de réponses choisies
  timeSpent?: number; // Temps passé en secondes
}

// Type pour le résultat d'un quiz
export interface QuizResult {
  score: number; // Score en pourcentage (0-100)
  passed: boolean; // true si score >= 70%
  correctAnswers: number;
  totalQuestions: number;
  attemptsRemaining: number; // Tentatives restantes sur 3
  canRetryAt: string | null; // Date/heure à laquelle l'utilisateur peut réessayer
  detailedResults: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
    explanation?: string;
  }[];
}

// Type pour vérifier si un module est déverrouillé
export interface ModuleLockStatus {
  isLocked: boolean;
  reason?: string; // Ex: "Complétez d'abord le Module 1"
  previousModuleSlug?: string; // Slug du module précédent à compléter
}