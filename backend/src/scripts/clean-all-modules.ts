/// <reference types="node" />
// backend/src/scripts/clean-all-modules.ts
/**
 * Script pour nettoyer tous les modules avec le script Python
 *
 * Supprime :
 * - Titres doublés
 * - Numéros de section (1.1, 1.2, etc.)
 * - Ajoute les bonnes classes CSS
 *
 * Utilisation :
 * npx ts-node src/scripts/clean-all-modules.ts
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma = new PrismaClient();

async function cleanAllModules() {
  console.log('🔄 Nettoyage des modules...\n');

  try {
    const modules = await prisma.learningModule.findMany({
      orderBy: { order_index: 'asc' }
    });

    console.log(`📚 ${modules.length} modules trouvés\n`);

    let cleanedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const module of modules) {
      console.log(`📖 Module ${module.order_index}: ${module.title}`);

      if (!module.content) {
        console.log('  ⚠️  Pas de contenu - ignoré\n');
        skippedCount++;
        continue;
      }

      try {
        // Créer un fichier temporaire pour le contenu
        const tmpDir = os.tmpdir();
        const tmpFile = path.join(tmpDir, `module_${module.id}.html`);

        // Écrire le contenu dans le fichier temporaire
        fs.writeFileSync(tmpFile, module.content, 'utf-8');

        // Appeler le script Python
        const pythonScript = path.join(__dirname, 'clean_modules.py');

        let cleaned: string;
        try {
          // Essayer avec python3 d'abord
          cleaned = execSync(`python3 "${pythonScript}" < "${tmpFile}"`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
          });
        } catch (e) {
          // Si python3 n'existe pas, essayer avec python
          try {
            cleaned = execSync(`python "${pythonScript}" < "${tmpFile}"`, {
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'pipe']
            });
          } catch (e2) {
            throw new Error('Python non trouvé. Installez Python 3.6+');
          }
        }

        // Nettoyer le fichier temporaire
        fs.unlinkSync(tmpFile);

        // Si le contenu a changé, mettre à jour en base
        if (cleaned.trim() !== module.content.trim()) {
          await prisma.learningModule.update({
            where: { id: module.id },
            data: { content: cleaned.trim() }
          });

          console.log('  ✅ Nettoyé et mis à jour\n');
          cleanedCount++;
        } else {
          console.log('  ⏭️  Déjà propre - ignoré\n');
          skippedCount++;
        }
      } catch (error: any) {
        console.log(`  ❌ Erreur: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('=' .repeat(50));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(50));
    console.log(`✅ Modules nettoyés: ${cleanedCount}`);
    console.log(`⏭️  Modules ignorés: ${skippedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📚 Total: ${modules.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
cleanAllModules()
  .then(() => {
    console.log('✨ Nettoyage terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
