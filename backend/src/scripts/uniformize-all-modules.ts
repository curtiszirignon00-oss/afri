/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function cleanModuleContent(content: string): string {
  let cleaned = content;

  // 1. Retirer les wrappers <div class="space-y-8">
  cleaned = cleaned.replace(/<div class="space-y-8">\s*/g, '');
  cleaned = cleaned.replace(/\s*<\/div>\s*$/g, '');

  // 2. Convertir les objectifs pédagogiques (gradients bleus/violets)
  cleaned = cleaned.replace(
    /<div class="bg-gradient-to-r from-(?:indigo|blue)-\d+ to-(?:purple|indigo)-\d+ text-white p-\d+ rounded-xl">\s*<h2[^>]*>🎯[^<]*<\/h2>/g,
    '<div class="pedagogical-objective">\n<h2>🎯 Objectif pédagogique</h2>'
  );

  // 3. Convertir les analogies (encadrés jaunes/ambre)
  cleaned = cleaned.replace(
    /<div class="bg-(?:amber|orange|yellow)-50[^"]*border[^"]*border-(?:amber|orange|yellow)-\d+[^"]*">/g,
    '<div class="analogy-box">'
  );

  // 4. Convertir les exemples (encadrés oranges/roses/violets)
  cleaned = cleaned.replace(
    /<div class="bg-(?:orange|purple|pink)-50[^"]*border[^"]*border-(?:orange|purple|pink)-\d+[^"]*">/g,
    '<div class="example-box">'
  );

  // 5. Convertir les points clés (encadrés verts/bleus avec "À retenir")
  cleaned = cleaned.replace(
    /<div class="bg-(?:blue|green|emerald)-50[^"]*border-l-\d+\s+border-(?:blue|green|emerald)-\d+[^"]*">/g,
    '<div class="key-points-box">'
  );

  // 6. Retirer les divs border-l-4 qui servent de sections
  cleaned = cleaned.replace(
    /<div class="border-l-4 border-(?:blue|green|purple|orange|red)-\d+ pl-\d+ py-\d+">\s*/g,
    ''
  );

  // 7. Nettoyer les h2/h3 - retirer toutes les classes
  cleaned = cleaned.replace(/<h2 class="[^"]*">/g, '<h2>');
  cleaned = cleaned.replace(/<h3 class="[^"]*">/g, '<h3>');
  cleaned = cleaned.replace(/<h4 class="[^"]*">/g, '<h4>');

  // 8. Mettre les titres de section en gras (avec emojis de section)
  cleaned = cleaned.replace(
    /<h2>(🪶|🧩|🌍|🗺️|💥|🏛️|🔁|🚀|🧠|📊|💼|🎯|⚙️|🔍|📈|🎓|🏦|💰|📱|🔬)(\s*\d+\.\d+\s*[–—-])/g,
    '<h2><strong>$1$2'
  );
  cleaned = cleaned.replace(/([–—-][^<]+)<\/h2>/g, '$1</strong></h2>');

  // 9. Nettoyer les paragraphes - retirer les classes sauf pour citations
  cleaned = cleaned.replace(
    /<p class="(?!text-xl italic mb-12 text-center text-gray-700)[^"]*">/g,
    '<p>'
  );

  // 10. Simplifier les listes
  cleaned = cleaned.replace(/<ul class="[^"]*">/g, '<ul>');
  cleaned = cleaned.replace(/<ol class="[^"]*">/g, '<ol>');
  cleaned = cleaned.replace(/<li class="[^"]*">/g, '<li>');

  // 11. Nettoyer les tableaux
  cleaned = cleaned.replace(/<table class="[^"]*">/g, '<table>');
  cleaned = cleaned.replace(/<thead class="[^"]*">/g, '<thead>');
  cleaned = cleaned.replace(/<tbody class="[^"]*">/g, '<tbody>');
  cleaned = cleaned.replace(/<tr class="[^"]*">/g, '<tr>');
  cleaned = cleaned.replace(/<td class="[^"]*">/g, '<td>');
  cleaned = cleaned.replace(/<th class="[^"]*">/g, '<th>');

  // 12. Convertir les sections "prochaine étape" avec gradient
  cleaned = cleaned.replace(
    /<div class="bg-gradient-to-r from-(?:blue|indigo)-\d+ to-(?:blue|indigo)-\d+ text-white p-\d+ rounded-xl">\s*<h3[^>]*>🧭[^<]*<\/h3>/g,
    '<h3>🚀 Prochaine étape</h3>'
  );

  // 13. Convertir "termes à maîtriser"
  cleaned = cleaned.replace(
    /<div class="bg-gray-100 rounded-xl p-\d+">\s*<h2[^>]*>🧠 Les termes à maîtriser<\/h2>/g,
    '<h2>🧩 Les termes à maîtriser</h2>'
  );

  // 14. Retirer div overflow-x-auto
  cleaned = cleaned.replace(/<div class="overflow-x-auto">\s*<table/g, '<table');
  cleaned = cleaned.replace(/<\/table>\s*<\/div>/g, '</table>');

  // 15. Retirer les puces • au début des li (le CSS va les gérer)
  cleaned = cleaned.replace(/<li>•\s*/g, '<li>');

  // 16. Nettoyer espaces multiples
  cleaned = cleaned.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return cleaned.trim();
}

async function main() {
  console.log('🚀 Démarrage de l\'uniformisation des modules...\n');

  try {
    // Récupérer tous les modules
    const modules = await prisma.learningModule.findMany({
      orderBy: { order_index: 'asc' }
    });

    console.log(`📚 ${modules.length} modules trouvés\n`);

    for (const module of modules) {
      const originalContent = module.content || '';
      const cleanedContent = cleanModuleContent(originalContent);

      // Mettre à jour si le contenu a changé
      if (cleanedContent !== originalContent) {
        await prisma.learningModule.update({
          where: { id: module.id },
          data: { content: cleanedContent }
        });

        console.log(`✅ Module ${module.order_index}: ${module.title}`);
      } else {
        console.log(`⏭️  Module ${module.order_index}: ${module.title} (déjà propre)`);
      }
    }

    console.log('\n🎉 Uniformisation terminée avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
