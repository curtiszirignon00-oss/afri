/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkQuizzes() {
  console.log('🔍 Vérification des quiz en base de données...\n');

  const modules = [
    { order: 1, slug: 'fondations-bourse-brvm', name: 'Module 1' },
    { order: 2, slug: 'acteurs-du-jeu', name: 'Module 2' },
    { order: 3, slug: 'outils-investisseur', name: 'Module 3' },
    { order: 4, slug: 'le-temps-meilleur-allie', name: 'Module 4' }
  ];

  for (const mod of modules) {
    const module = await prisma.learningModule.findFirst({
      where: { slug: mod.slug },
      include: { quizzes: true }
    });

    if (!module) {
      console.log(`❌ ${mod.name}: Module non trouvé (slug: ${mod.slug})`);
      continue;
    }

    const quiz = module.quizzes[0];
    if (!quiz) {
      console.log(`⚠️  ${mod.name}: Aucun quiz trouvé`);
      continue;
    }

    const questions = quiz.questions as any[];
    console.log(`✅ ${mod.name} (${mod.slug}): Quiz trouvé`);
    console.log(`   - ID: ${quiz.id}`);
    console.log(`   - Questions: ${questions?.length || 0}`);
    console.log(`   - Score requis: ${quiz.passing_score}%`);
    console.log(`   - has_quiz: ${module.has_quiz}\n`);
  }

  await prisma.$disconnect();
}

checkQuizzes();
