/**
 * Construit les contextes utilisateur SIMBA depuis la base de données.
 * Une seule requête Prisma centralisée (fetchRawUserData) alimente les deux formats.
 */

import prisma from '../config/prisma';
import { UserContext, TutorUserContext, ExperienceLevel } from './systemPrompt';

function mapExperienceLevel(level?: string | null): ExperienceLevel {
  if (!level) return 'débutant';
  switch (level.toUpperCase().trim()) {
    case 'BEGINNER':   // valeur possible via OAuth Google
    case 'DEBUTANT':
    case 'DÉBUTANT':
      return 'débutant';
    case 'INTERMEDIAIRE':
    case 'INTERMÉDIAIRE':
    case 'INTERMEDIATE':
      return 'intermédiaire';
    case 'EXPERT':
    case 'AVANCE':
    case 'AVANCÉ':
    case 'ADVANCED':
      return 'avancé';
    default:
      return 'débutant';
  }
}

// ─── Données brutes centralisées ──────────────────────────────────────────────

interface RawUserData {
  experienceLevel: ExperienceLevel;
  hasPortfolio: boolean;
  currentModuleTitle: string | undefined;
  lastQuizScore: number | undefined;
}

async function fetchRawUserData(userId: string): Promise<RawUserData> {
  const [investorProfile, portfolio, learningProgress] = await Promise.all([
    prisma.investorProfile.findUnique({
      where: { user_id: userId },
      select: { experience_level: true },
    }).catch(() => null),

    prisma.portfolio.findFirst({
      where: { userId },
      select: { id: true },
    }).catch(() => null),

    // LearningProgress n'a pas de relation lesson dans le schéma — moduleTitle uniquement
    prisma.learningProgress.findFirst({
      where: { userId, is_completed: false },
      orderBy: { last_accessed_at: 'desc' },
      select: {
        quiz_score: true,
        module: { select: { title: true } },
      },
    }).catch(() => null),
  ]);

  return {
    experienceLevel: mapExperienceLevel(investorProfile?.experience_level),
    hasPortfolio: portfolio !== null,
    currentModuleTitle: (learningProgress?.module as Record<string, unknown> | null)?.title as string ?? undefined,
    lastQuizScore: learningProgress?.quiz_score != null
      ? Math.round(learningProgress.quiz_score)
      : undefined,
  };
}

// ─── Contexte Coach ───────────────────────────────────────────────────────────

export async function getUserContext(userId: string): Promise<UserContext> {
  const data = await fetchRawUserData(userId);
  return {
    user_level: data.experienceLevel,
    has_portfolio: data.hasPortfolio,
    current_module: data.currentModuleTitle,
    learning_progress: data.lastQuizScore != null
      ? `${data.lastQuizScore}% au dernier quiz`
      : undefined,
  };
}

// ─── Contexte Tuteur ──────────────────────────────────────────────────────────

export async function getTutorUserContext(userId: string): Promise<TutorUserContext> {
  const data = await fetchRawUserData(userId);
  return {
    level: data.experienceLevel,
    currentModule: data.currentModuleTitle,
    // currentLesson non disponible (relation absente du schéma Prisma)
    lastQuizScore: data.lastQuizScore,
  };
}

// ─── Les deux contextes en un seul aller-retour DB ───────────────────────────

export async function getAllUserContexts(userId: string): Promise<{
  coach: UserContext;
  tutor: TutorUserContext;
}> {
  const data = await fetchRawUserData(userId);
  return {
    coach: {
      user_level: data.experienceLevel,
      has_portfolio: data.hasPortfolio,
      current_module: data.currentModuleTitle,
      learning_progress: data.lastQuizScore != null
        ? `${data.lastQuizScore}% au dernier quiz`
        : undefined,
    },
    tutor: {
      level: data.experienceLevel,
      currentModule: data.currentModuleTitle,
      lastQuizScore: data.lastQuizScore,
    },
  };
}
