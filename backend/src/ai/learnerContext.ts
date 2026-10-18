/**
 * Lien Tuteur ↔ progression : modules terminés, quiz difficiles, questions
 * ratées au dernier essai du module en cours. Données lues côté serveur.
 */

import { prisma } from '../config/database';

export async function buildLearnerBlock(userId: string, currentModuleTitle?: string): Promise<string | null> {
  const progress = await prisma.learningProgress.findMany({
    where: { userId },
    select: {
      is_completed: true, quiz_score: true, quiz_attempts: true, missed_questions: true,
      module: { select: { title: true } },
    },
  });
  if (!progress.length) return null;

  const completed = progress.filter((p) => p.is_completed).length;
  const struggling = progress
    .filter((p) => p.quiz_score != null && (p.quiz_score < 70 || p.quiz_attempts > 1))
    .map((p) => `${p.module.title} (score ${Math.round(p.quiz_score!)} %, ${p.quiz_attempts} essai${p.quiz_attempts > 1 ? 's' : ''})`)
    .slice(0, 5);

  const current = currentModuleTitle
    ? progress.find((p) => p.module.title.trim().toLowerCase() === currentModuleTitle.trim().toLowerCase())
    : undefined;
  const missed = current?.missed_questions ?? [];

  const lines = [
    `- Modules terminés : ${completed} / ${progress.length} commencés`,
    struggling.length ? `- Quiz difficiles : ${struggling.join(' ; ')}` : null,
    missed.length
      ? `- Questions ratées au dernier quiz de « ${current!.module.title} » :\n${missed.map((q) => `  • ${q}`).join('\n')}`
      : null,
  ].filter(Boolean);

  return `## PROGRESSION DE L'APPRENANT (données Afribourse)
${lines.join('\n')}
Si la question touche une notion ratée au quiz, explique-la sous un autre angle et vérifie la compréhension. Ne cite pas la liste brute : sers-t'en pour cibler ton explication.`;
}
