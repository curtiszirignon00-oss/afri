/// <reference types="node" />
// backend/src/scripts/restore-modules.ts
/**
 * Script pour restaurer les modules à partir d'une ancienne version Git
 *
 * Utilisation :
 * npx ts-node src/scripts/restore-modules.ts [commit-hash]
 *
 * Exemple :
 * npx ts-node src/scripts/restore-modules.ts 921e260
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restoreModulesFromGit(commitHash: string) {
  console.log(`🔄 Restauration des modules depuis le commit ${commitHash}...\n`);

  try {
    // 1. Extraire l'ancien fichier seed-learning.ts depuis Git
    const gitCommand = `git show ${commitHash}:backend/src/seed-learning.ts`;

    let oldContent: string;
    try {
      oldContent = execSync(gitCommand, {
        encoding: 'utf-8',
        cwd: path.join(__dirname, '..', '..', '..')
      });
    } catch (error) {
      console.error(`❌ Erreur : Impossible de trouver le commit ${commitHash}`);
      console.log('\n💡 Commits disponibles (10 derniers) :');
      const commits = execSync('git log --oneline -10', {
        encoding: 'utf-8',
        cwd: path.join(__dirname, '..', '..', '..')
      });
      console.log(commits);
      process.exit(1);
    }

    // 2. Sauvegarder le fichier temporairement
    const tempFile = path.join(__dirname, 'seed-learning-temp.ts');
    fs.writeFileSync(tempFile, oldContent, 'utf-8');

    console.log(`✅ Ancien contenu extrait depuis Git\n`);

    // 3. Afficher un aperçu
    console.log('📋 Aperçu du contenu restauré :');
    console.log('=' .repeat(50));
    const preview = oldContent.substring(0, 500);
    console.log(preview);
    console.log('...\n');
    console.log('=' .repeat(50));

    console.log('\n⚠️  ATTENTION :');
    console.log('Pour restaurer complètement les modules, vous devez :');
    console.log('\n1. Remplacer le fichier seed-learning.ts actuel :');
    console.log(`   copy "${tempFile}" "backend\\src\\seed-learning.ts"`);
    console.log('\n2. Ré-exécuter le seed :');
    console.log('   cd backend');
    console.log('   npx ts-node src/seed-learning.ts');
    console.log('\n3. Supprimer le fichier temporaire :');
    console.log(`   del "${tempFile}"\n`);

    console.log(`✅ Fichier temporaire sauvegardé : ${tempFile}\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
const commitHash = process.argv[2] || '921e260'; // Par défaut : 2 commits en arrière

console.log('🚀 Script de restauration des modules\n');
console.log(`📌 Commit cible : ${commitHash}\n`);

restoreModulesFromGit(commitHash)
  .then(() => {
    console.log('✨ Extraction terminée !');
    console.log('\n💡 Suivez les instructions ci-dessus pour finaliser la restauration.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
