// backend/src/scripts/reformat-modules.ts
/**
 * Script pour reformater tous les modules avec le nouveau design professionnel
 *
 * Utilisation :
 * npx ts-node src/scripts/reformat-modules.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reformate le contenu HTML d'un module pour utiliser les nouvelles classes CSS
 */
function reformatModuleContent(oldContent: string, moduleTitle: string, orderIndex: number): string {
  // Si le contenu utilise déjà les nouvelles classes, ne rien faire
  if (oldContent.includes('pedagogical-objective')) {
    console.log(`✓ Module ${orderIndex} déjà formaté`);
    return oldContent;
  }

  // Wrapper principal
  let newContent = '<div class="space-y-8">\n\n';

  // 1. Extraire et reformater l'objectif pédagogique
  const objectiveMatch = oldContent.match(/<div[^>]*bg-gradient-to-r[^>]*>[\s\S]*?🎯[^>]*Objectif[^>]*Pédagogique[\s\S]*?<\/div>/i);

  if (objectiveMatch) {
    const objectiveContent = objectiveMatch[0];

    // Extraire les objectifs (liste ul)
    const ulMatch = objectiveContent.match(/<ul[^>]*>([\s\S]*?)<\/ul>/);
    const objectives = ulMatch ? ulMatch[0] : '';

    newContent += `  <!-- OBJECTIF PÉDAGOGIQUE -->
  <div class="pedagogical-objective">
    <div class="objective-header">
      <div class="objective-icon">🎯</div>
      <h2 class="objective-title">Objectif Pédagogique</h2>
    </div>

    <p class="objective-intro">À la fin de ce module, vous serez capable :</p>

    ${objectives}
  </div>\n\n`;
  }

  // 2. Trouver toutes les sections principales (h2 avec numéros)
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/g;
  let sectionMatch;
  let lastIndex = 0;
  let sectionNumber = 1;

  while ((sectionMatch = h2Regex.exec(oldContent)) !== null) {
    const h2Content = sectionMatch[1];
    const h2Index = sectionMatch.index;

    // Ignorer l'objectif pédagogique
    if (h2Content.includes('Objectif') && h2Content.includes('Pédagogique')) {
      continue;
    }

    // Extraire le contenu de la section (jusqu'au prochain h2 ou fin)
    const nextH2 = oldContent.indexOf('<h2', h2Index + 1);
    const sectionEnd = nextH2 > 0 ? nextH2 : oldContent.length;
    const sectionContent = oldContent.substring(h2Index, sectionEnd);

    // Nettoyer le titre
    const cleanTitle = h2Content.replace(/<[^>]*>/g, '').replace(/^[\d.]+\s*/, '').trim();

    newContent += `  <!-- SECTION ${sectionNumber} -->
  <div class="section">
    <div class="section-header">
      <span class="section-number">${orderIndex}.${sectionNumber}</span>
      <h2 class="section-title">${cleanTitle}</h2>
    </div>

${processSectionContent(sectionContent)}
  </div>\n\n`;

    sectionNumber++;
    lastIndex = sectionEnd;
  }

  newContent += '</div>';

  return newContent;
}

/**
 * Traite le contenu d'une section pour identifier et reformater les composants
 */
function processSectionContent(content: string): string {
  let processed = content;

  // 1. Reformater les analogies (bordure jaune/orange)
  processed = processed.replace(
    /<div[^>]*border-amber[^>]*>([\s\S]*?)<\/div>/g,
    (match, inner) => {
      if (match.includes('analogie') || match.includes('Analogie')) {
        return `    <div class="analogy-box">
      <div class="analogy-header">
        <span class="analogy-icon">💡</span>
        <h3 class="analogy-title">L'analogie à retenir</h3>
      </div>

      <div class="analogy-content">
        ${inner.trim()}
      </div>
    </div>`;
      }
      return match;
    }
  );

  // 2. Reformater les exemples (bordure violette)
  processed = processed.replace(
    /<div[^>]*border-purple[^>]*>([\s\S]*?)<\/div>/g,
    (match, inner) => {
      if (match.includes('Exemple') || match.includes('exemple')) {
        return `    <div class="example-box">
      <p class="example-header">Exemple :</p>
      <div class="example-content">
        ${inner.trim()}
      </div>
    </div>`;
      }
      return match;
    }
  );

  // 3. Reformater les points clés (bordure verte)
  processed = processed.replace(
    /<div[^>]*border-green[^>]*>([\s\S]*?)<\/div>/g,
    (match, inner) => {
      if (match.includes('retenir') || match.includes('Retenir')) {
        return `    <div class="key-points-box">
      <div class="key-points-header">
        <span class="key-points-icon">💎</span>
        <h3 class="key-points-title">À retenir</h3>
      </div>

      ${inner.trim()}
    </div>`;
      }
      return match;
    }
  );

  // 4. Reformater les avertissements (bordure rouge)
  processed = processed.replace(
    /<div[^>]*border-red[^>]*>([\s\S]*?)<\/div>/g,
    (match, inner) => {
      if (match.includes('Attention') || match.includes('attention')) {
        return `    <div class="warning-box">
      <div class="warning-header">
        <span class="warning-icon">⚠️</span>
        <h3 class="warning-title">Attention</h3>
      </div>
      <div class="warning-content">
        ${inner.trim()}
      </div>
    </div>`;
      }
      return match;
    }
  );

  return processed;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔄 Démarrage du reformatage des modules...\n');

  try {
    // Récupérer tous les modules
    const modules = await prisma.learningModule.findMany({
      orderBy: { order_index: 'asc' }
    });

    console.log(`📚 ${modules.length} modules trouvés\n`);

    let reformattedCount = 0;
    let skippedCount = 0;

    for (const module of modules) {
      console.log(`\n📖 Module ${module.order_index}: ${module.title}`);

      if (!module.content) {
        console.log('  ⚠️  Pas de contenu - ignoré');
        skippedCount++;
        continue;
      }

      // Reformater le contenu
      const newContent = reformatModuleContent(
        module.content,
        module.title,
        module.order_index ?? 0
      );

      // Si le contenu a changé, mettre à jour
      if (newContent !== module.content) {
        await prisma.learningModule.update({
          where: { id: module.id },
          data: { content: newContent }
        });

        console.log('  ✅ Reformaté avec succès');
        reformattedCount++;
      } else {
        console.log('  ⏭️  Déjà à jour - ignoré');
        skippedCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(50));
    console.log(`✅ Modules reformatés: ${reformattedCount}`);
    console.log(`⏭️  Modules ignorés: ${skippedCount}`);
    console.log(`📚 Total: ${modules.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Erreur lors du reformatage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
main()
  .then(() => {
    console.log('✨ Reformatage terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
