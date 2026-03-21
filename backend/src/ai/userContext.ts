/**
 * Construit le UserContext SIMBA depuis la base de données.
 * Centralise la récupération du niveau, de la progression et du portefeuille.
 */

import prisma from '../config/prisma';
import { UserContext } from './systemPrompt';

function mapExperienceLevel(level?: string | null): UserContext['user_level'] {
  if (!level) return 'débutant';
  const normalized = level.toUpperCase();
  if (normalized === 'INTERMEDIAIRE' || normalized === 'INTERMEDIATE') return 'intermédiaire';
  if (normalized === 'EXPERT' || normalized === 'AVANCE' || normalized === 'AVANCÉ') return 'avancé';
  return 'débutant';
}

export async function getUserContext(userId: string): Promise<UserContext> {
  const [investorProfile, portfolios, learningProgress] = await Promise.all([
    // Profil investisseur → niveau d'expérience
    prisma.investorProfile.findUnique({
      where: { userId },
      select: { experience_level: true },
    }).catch(() => null),

    // Portefeuilles → a-t-il un portefeuille simulé ?
    prisma.portfolio.findFirst({
      where: { userId },
      select: { id: true },
    }).catch(() => null),

    // Dernière progression d'apprentissage → module en cours
    prisma.learningProgress.findFirst({
      where: { userId, is_completed: false },
      orderBy: { last_accessed_at: 'desc' },
      select: { module: { select: { title: true } }, quiz_score: true },
    }).catch(() => null),
  ]);

  // Calcul du pourcentage de progression global
  let progressStr: string | undefined;
  if (learningProgress?.quiz_score != null) {
    progressStr = `${Math.round(learningProgress.quiz_score)}% au dernier quiz`;
  }

  return {
    user_level: mapExperienceLevel(investorProfile?.experience_level),
    has_portfolio: portfolios !== null,
    current_module: (learningProgress?.module as any)?.title ?? undefined,
    learning_progress: progressStr,
  };
}
