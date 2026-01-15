/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script pour générer automatiquement le fichier seed-learning.ts
 * à partir du fichier texte "ALL module txt.txt"
 */

const INPUT_FILE = 'C:\\Users\\HP\\OneDrive\\Desktop\\LGC\\the little garden\\mvp\\PROGRAMME DE FORM\\ALL module txt.txt';
const OUTPUT_FILE = path.join(__dirname, '../src/seed-learning-new.ts');

interface Module {
  index: number;
  title: string;
  content: string;
}

/**
 * Convertit le texte brut en HTML stylisé avec Tailwind
 */
function textToHtml(text: string): string {
  let html = text;

  // Convertir les formules mathématiques $$...$$
  html = html.replace(/\$\$(.*?)\$\$/gs, (match, formula) => {
    return `
    <div class="my-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl overflow-x-auto">
      <div class="text-center">
        <div class="inline-block bg-white px-6 py-4 rounded-lg shadow-sm">
          <div class="font-mono text-lg text-gray-900">${formula.trim()}</div>
        </div>
      </div>
    </div>`;
  });

  // Convertir les tableaux markdown-style en HTML
  // Format: | Col1 | Col2 | Col3 |
  const lines = html.split('\n');
  let inTable = false;
  let tableHtml = '';
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Détecter les lignes de tableau
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        // Début du tableau
        inTable = true;
        tableHtml = '<div class="overflow-x-auto my-6"><table class="min-w-full border-collapse border-2 border-gray-300">';

        // Header
        const headers = line.split('|').slice(1, -1).map(h => h.trim());
        tableHtml += '<thead class="bg-gradient-to-r from-blue-100 to-indigo-100"><tr>';
        headers.forEach(h => {
          tableHtml += `<th class="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900">${h}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
      } else {
        // Ligne de données
        const cells = line.split('|').slice(1, -1).map(c => c.trim());
        // Ignorer les lignes de séparation (---)
        if (!cells[0].match(/^-+$/)) {
          tableHtml += '<tr class="hover:bg-gray-50">';
          cells.forEach(c => {
            tableHtml += `<td class="border border-gray-300 px-4 py-3 text-gray-700">${c}</td>`;
          });
          tableHtml += '</tr>';
        }
      }
    } else {
      // Fin du tableau
      if (inTable) {
        tableHtml += '</tbody></table></div>';
        processedLines.push(tableHtml);
        inTable = false;
        tableHtml = '';
      }
      processedLines.push(line);
    }
  }

  if (inTable) {
    tableHtml += '</tbody></table></div>';
    processedLines.push(tableHtml);
  }

  html = processedLines.join('\n');

  // Convertir les listes à puces •
  html = html.replace(/^•\s+(.+)$/gm, '<li class="text-base text-gray-700 leading-relaxed">$1</li>');

  // Entourer les groupes de <li> avec <ul>
  html = html.replace(/((?:<li class="text-base[^>]*>.*?<\/li>\n?)+)/gs,
    '<ul class="list-disc ml-6 mb-4 space-y-2">\n$1</ul>');

  // Convertir les paragraphes normaux
  html = html.replace(/^([^<\n].+)$/gm, '<p class="text-base mb-4 leading-relaxed text-gray-700">$1</p>');

  //  Nettoyer les lignes vides multiples
  html = html.replace(/\n\n+/g, '\n');

  return html;
}

/**
 * Extrait les modules du fichier texte
 */
function extractModules(content: string): Module[] {
  const modules: Module[] = [];

  // Regex pour détecter le début de chaque module
  const moduleRegex = /^(🚀|📘|🧭|⚙️|⏳|💭|🔍|💡|🌱|📉|⚡|🛡️|📊|🌍|🎯)\s+Module\s+(\d+)/gm;

  const matches = [...content.matchAll(moduleRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const moduleIndex = parseInt(match[2]);
    const startPos = match.index!;
    const endPos = i < matches.length - 1 ? matches[i + 1].index! : content.length;

    const moduleContent = content.substring(startPos, endPos).trim();

    // Extraire le titre
    const titleMatch = moduleContent.match(/Module\s+\d+[:\s–—-]+(.+?)(?:\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : `Module ${moduleIndex}`;

    modules.push({
      index: moduleIndex,
      title,
      content: moduleContent
    });
  }

  return modules;
}

/**
 * Génère le fichier TypeScript seed-learning.ts
 */
function generateSeedFile(modules: Module[]): string {
  let output = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOrUpdateModule(data: any) {
  const { slug, ...rest } = data;

  return await prisma.learningModule.upsert({
    where: { slug },
    update: rest,
    create: data,
  });
}

async function main() {
  console.log('✅ Base de données connectée');
  console.log(\`Démarrage de l'insertion/mise à jour des \${${modules.length}} modules d'apprentissage...\`);

`;

  modules.forEach((module, idx) => {
    const htmlContent = textToHtml(module.content);
    const slug = `module-${module.index}`;

    output += `
  // ===============================================
  // === M${module.index}: ${module.title.toUpperCase()} ===
  // ===============================================
  await createOrUpdateModule({
    title: "${module.title.replace(/"/g, '\\"')}",
    slug: '${slug}',
    description: "Description du module ${module.index}",
    difficulty_level: 'debutant',
    content_type: 'article',
    duration_minutes: ${15 + module.index * 5},
    order_index: ${module.index},
    is_published: true,
    content: \`
${htmlContent}
\`,
  });
  console.log('✅ Module ${module.index}: ${module.title.replace(/"/g, '\\"')} mis à jour.');

`;
  });

  output += `
  console.log('Traitement des modules terminé.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('✅ Base de données déconnectée');
  });
`;

  return output;
}

// Exécution
try {
  console.log(`📖 Lecture du fichier: ${INPUT_FILE}`);
  const fileContent = fs.readFileSync(INPUT_FILE, 'utf-8');

  console.log('🔍 Extraction des modules...');
  const modules = extractModules(fileContent);
  console.log(`✅ ${modules.length} modules trouvés`);

  console.log('📝 Génération du fichier seed-learning.ts...');
  const seedContent = generateSeedFile(modules);

  console.log(`💾 Écriture dans: ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, seedContent, 'utf-8');

  console.log('✅ Fichier généré avec succès!');
  console.log(`\n📁 Fichier créé: ${OUTPUT_FILE}`);

} catch (error) {
  console.error('❌ Erreur:', error);
  process.exit(1);
}
