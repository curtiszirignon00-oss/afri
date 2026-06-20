// backend/src/services/passport-score.service.ts
// Score Investisseur composite (Passeport) — 5 composantes pondérées.
// Le score valorise les bons comportements, pas les gains rapides.
// Pondération dynamique : si une composante n'est pas encore calculable,
// on normalise sur les composantes disponibles.

import { prisma } from '../config/database';
import { getPortfolioSummary } from './portfolio.service.prisma';
import { LearningServicePrisma } from './learning.service.prisma';

const learningService = new LearningServicePrisma();

export interface ScoreComponent {
  key: 'pedagogy' | 'discipline' | 'performance' | 'contribution' | 'constance';
  label: string;
  weight: number;      // pondération nominale (somme = 1)
  score: number;       // 0-100 pour cette composante
  available: boolean;  // calculable pour cet utilisateur ?
  action: string;      // action concrète pour progresser
}

export interface PassportScore {
  total: number;       // 0-100 (normalisé sur les composantes disponibles)
  percentile: number | null; // "Top X%"
  summary: string;
  components: ScoreComponent[];
}

const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export async function computePassportScore(userId: string): Promise<PassportScore> {
  // --- Récupération des données en parallèle ---
  const [userProfile, learning, postsCount] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { userId },
      select: { current_streak: true, longest_streak: true, total_xp: true },
    }),
    learningService.getProgressSummary(userId).catch(() => null),
    prisma.post.count({ where: { author_id: userId, is_hidden: false } }).catch(() => 0),
  ]);

  let portfolio: Awaited<ReturnType<typeof getPortfolioSummary>> = null;
  try {
    portfolio = await getPortfolioSummary(userId);
  } catch { /* ignore */ }

  // --- 1. Progression pédagogique (30%) ---
  const pedagogyAvailable = !!learning && learning.totalModules > 0;
  const pedagogyScore = pedagogyAvailable
    ? clamp(0.7 * learning!.progressPercent + 0.3 * learning!.averageScore)
    : 0;

  // --- 2. Discipline (25%) — diversification (drawdown à instrumenter) ---
  const positionsCount = portfolio?.positionsCount ?? 0;
  const disciplineAvailable = !!portfolio && positionsCount > 0;
  // 5+ positions = bien diversifié ; concentration excessive pénalisée légèrement
  const disciplineScore = disciplineAvailable
    ? clamp(Math.min(positionsCount, 5) / 5 * 100)
    : 0;

  // --- 3. Performance simulée (20%) — ROI du portefeuille virtuel ---
  const performanceAvailable = !!portfolio;
  // Mappe le ROI [-20%, +30%] vers [0, 100], 0% ROI ≈ 40 pts
  const roi = portfolio?.gainLossPercent ?? 0;
  const performanceScore = performanceAvailable
    ? clamp(((roi + 20) / 50) * 100)
    : 0;

  // --- 4. Contribution communautaire (15%) — publications (commentaires/likes à venir) ---
  const contributionAvailable = postsCount > 0;
  const contributionScore = contributionAvailable
    ? clamp(Math.min(postsCount, 10) / 10 * 100)
    : 0;

  // --- 5. Constance (10%) — streak / présence ---
  const constanceAvailable = !!userProfile;
  const currentStreak = userProfile?.current_streak ?? 0;
  const constanceScore = constanceAvailable
    ? clamp(Math.min(currentStreak, 30) / 30 * 100)
    : 0;

  const components: ScoreComponent[] = [
    {
      key: 'pedagogy', label: 'Progression pédagogique', weight: 0.30,
      score: Math.round(pedagogyScore), available: pedagogyAvailable,
      action: pedagogyAvailable && learning!.progressPercent < 100
        ? 'Termine un module pour gagner des points'
        : 'Continue le parcours BRVM',
    },
    {
      key: 'discipline', label: 'Discipline', weight: 0.25,
      score: Math.round(disciplineScore), available: disciplineAvailable,
      action: disciplineAvailable
        ? 'Diversifie ton portefeuille virtuel sur plusieurs secteurs'
        : 'Construis ton portefeuille virtuel pour activer cette composante',
    },
    {
      key: 'performance', label: 'Performance simulée', weight: 0.20,
      score: Math.round(performanceScore), available: performanceAvailable,
      action: 'Améliore la stabilité de ton portefeuille virtuel',
    },
    {
      key: 'contribution', label: 'Contribution communautaire', weight: 0.15,
      score: Math.round(contributionScore), available: contributionAvailable,
      action: contributionAvailable
        ? 'Publie une analyse utile à la communauté'
        : 'Publie ta première analyse pour activer cette composante',
    },
    {
      key: 'constance', label: 'Constance', weight: 0.10,
      score: Math.round(constanceScore), available: constanceAvailable,
      action: 'Reviens chaque jour pour entretenir ton streak',
    },
  ];

  // --- Pondération dynamique : normaliser sur les composantes disponibles ---
  const availableWeight = components.filter(c => c.available).reduce((s, c) => s + c.weight, 0);
  const weightedSum = components
    .filter(c => c.available)
    .reduce((s, c) => s + c.score * c.weight, 0);
  const total = availableWeight > 0 ? Math.round(weightedSum / availableWeight) : 0;

  // --- Percentile (proxy XP, peu coûteux) ---
  let percentile: number | null = null;
  try {
    const userXp = userProfile?.total_xp ?? 0;
    const [totalUsers, better] = await Promise.all([
      prisma.userProfile.count(),
      prisma.userProfile.count({ where: { total_xp: { gt: userXp } } }),
    ]);
    if (totalUsers > 0) percentile = Math.max(1, Math.round((better / totalUsers) * 100));
  } catch { /* ignore */ }

  // --- Résumé ---
  const badgesCount = await prisma.userAchievement.count({ where: { userId } }).catch(() => 0);
  const summaryParts = [
    `${badgesCount} badge${badgesCount > 1 ? 's' : ''}`,
    `${postsCount} analyse${postsCount > 1 ? 's' : ''} publiée${postsCount > 1 ? 's' : ''}`,
  ];
  if (learning && learning.totalModules > 0) summaryParts.push(`${learning.progressPercent}% du parcours`);
  const summary = summaryParts.join(' · ');

  return { total, percentile, summary, components };
}
