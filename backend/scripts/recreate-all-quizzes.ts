/// <reference types="node" />
// backend/scripts/recreate-all-quizzes.ts
// Script pour recréer tous les quiz avec les IDs corrects

import { execSync } from 'child_process';
import * as path from 'path';

const quizScripts = [
  'create-module1-quiz.ts',
  'create-module2-quiz.ts',
  'create-module3-quiz.ts',
  'create-module6-quiz.ts',
  'create-module7-quiz.ts',
  'create-module8-quiz.ts',
  'create-module9-quiz.ts',
  'create-module10-quiz.ts',
  'create-module11-quiz.ts',
  'create-module12-quiz.ts',
  'create-module13-quiz.ts',
  'create-module14-quiz.ts',
  'create-module15-quiz.ts',
];

async function recreateAllQuizzes() {
  console.log('🚀 Recréation de tous les quiz...\n');

  const scriptsDir = __dirname;

  for (const script of quizScripts) {
    const scriptPath = path.join(scriptsDir, script);
    console.log(`\n📝 Exécution de ${script}...`);
    console.log('='.repeat(50));

    try {
      execSync(`npx ts-node "${scriptPath}"`, {
        cwd: path.join(scriptsDir, '..'),
        stdio: 'inherit'
      });
      console.log(`✅ ${script} terminé avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de ${script}:`, error);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 Recréation de tous les quiz terminée !');
}

recreateAllQuizzes();
