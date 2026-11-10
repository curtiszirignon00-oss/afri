// backend/src/services/discovery-survey.service.ts
import { prisma } from '../config/database';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileType = 'apprenti' | 'decideur' | 'investisseur' | 'explorateur';
export type Urgency = 'high' | 'medium' | 'low' | 'unknown';

export interface DiscoverySurveyInput {
  q1: 'A' | 'B' | 'C' | 'D';
  q2: 'A' | 'B' | 'C' | 'D' | 'E' | null; // optionnel
  q3: 'A' | 'B' | 'C' | 'D';
}

export interface DiscoverySurveyResult {
  profile_type: ProfileType;
  urgency: Urgency;
  survey_completed: boolean;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

const Q1_TO_PROFILE: Record<string, ProfileType> = {
  A: 'apprenti',
  B: 'decideur',
  C: 'investisseur',
  D: 'explorateur',
};

const Q3_TO_URGENCY: Record<string, Urgency> = {
  A: 'high',
  B: 'medium',
  C: 'low',
  D: 'unknown',
};

// ─── Avatar color par profil ──────────────────────────────────────────────────

export const PROFILE_AVATAR_COLOR: Record<ProfileType, string> = {
  apprenti:     'from-teal-500 to-emerald-600',   // Vert teal #1D9E75
  decideur:     'from-amber-500 to-orange-600',   // Amber #BA7517
  investisseur: 'from-violet-500 to-purple-600',  // Violet #7F77DD
  explorateur:  'from-blue-500 to-cyan-600',      // Bleu #378ADD
};

// ─── Service ──────────────────────────────────────────────────────────────────

export async function saveDiscoverySurvey(
  userId: string,
  input: DiscoverySurveyInput
): Promise<DiscoverySurveyResult> {
  const profile_type = Q1_TO_PROFILE[input.q1];
  const urgency = Q3_TO_URGENCY[input.q3];

  const surveyData = {
    q1: input.q1,
    q2: input.q2 ?? null,
    q3: input.q3,
    profile_type,
    urgency,
    completed_at: new Date().toISOString(),
  };

  // Upsert UserProfile avec les données survey
  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      discovery_survey: surveyData,
      survey_completed: true,
      avatar_color: PROFILE_AVATAR_COLOR[profile_type],
    },
    update: {
      discovery_survey: surveyData,
      survey_completed: true,
      avatar_color: PROFILE_AVATAR_COLOR[profile_type],
    },
  });

  return { profile_type, urgency, survey_completed: true };
}

/**
 * L'utilisateur passe le survey : l'accès est débloqué (survey_completed = true) mais on
 * garde la trace du saut (discovery_survey.skipped) pour le lui reproposer plus tard.
 * Ne remplace jamais un survey déjà répondu.
 */
export async function skipDiscoverySurvey(userId: string): Promise<{ survey_completed: true; skipped: boolean }> {
  const existing = await prisma.userProfile.findUnique({
    where: { userId },
    select: { survey_completed: true, discovery_survey: true },
  });
  const answered = !!(existing?.discovery_survey as any)?.profile_type;
  if (existing?.survey_completed && answered) {
    return { survey_completed: true, skipped: false };
  }

  const skipData = { skipped: true, skipped_at: new Date().toISOString() };
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, discovery_survey: skipData, survey_completed: true },
    update: { discovery_survey: skipData, survey_completed: true },
  });
  return { survey_completed: true, skipped: true };
}

export async function getSurveySummary(userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { discovery_survey: true, survey_completed: true },
  });
  return profile;
}
