// Script pour convertir les modules HTML en JSON structuré
// Usage: node scripts/convert-modules-to-json.js

const { PrismaClient } = require('@prisma/client');
const { JSDOM } = require('jsdom');

const prisma = new PrismaClient();

// Fonction pour extraire les analogies du HTML
function extractAnalogies(html) {
  if (!html) return [];

  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const analogies = [];

  // Chercher les blockquotes (format analogie courant)
  const blockquotes = doc.querySelectorAll('blockquote');
  blockquotes.forEach(bq => {
    const text = bq.textContent || '';
    if (text.includes('analogie') || text.includes('Imaginez') || text.includes('Comme')) {
      analogies.push({
        type: 'blockquote',
        content: bq.innerHTML
      });
    }
  });

  // Chercher les divs avec "analogie" dans le titre
  const divs = doc.querySelectorAll('div');
  divs.forEach(div => {
    const h3 = div.querySelector('h3, h4');
    if (h3 && (h3.textContent.includes('analogie') || h3.textContent.includes('Analogie'))) {
      analogies.push({
        type: 'div',
        title: h3.textContent,
        content: div.innerHTML
      });
    }
  });

  // Chercher les sections avec emoji ampoule 💡 ou Lightbulb
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const text = el.textContent || '';
    if ((text.includes('💡') || text.includes('L\'analogie à retenir')) && el.tagName !== 'BODY') {
      if (!analogies.some(a => a.content === el.innerHTML)) {
        analogies.push({
          type: 'emoji',
          content: el.innerHTML
        });
      }
    }
  });

  return analogies;
}

// Fonction pour parser une analogie et créer la structure JSON
function parseAnalogy(analogyHtml, title = '') {
  const dom = new JSDOM(`<div>${analogyHtml}</div>`);
  const doc = dom.window.document;

  // Extraire le titre
  let analogyTitle = title;
  const h3 = doc.querySelector('h3, h4, strong');
  if (h3) {
    const titleText = h3.textContent || '';
    // Extraire le titre après "L'analogie à retenir :"
    const match = titleText.match(/L'analogie à retenir\s*:\s*(.+)/i);
    if (match) {
      analogyTitle = match[1].trim();
    } else if (!analogyTitle) {
      analogyTitle = titleText.replace(/💡|🎯/g, '').trim();
    }
  }

  // Extraire l'intro et les zones
  const text = doc.body.textContent || '';
  const lines = text.split(/\n|<br\s*\/?>/i).filter(l => l.trim());

  let intro = '';
  const zones = [];
  let conclusion = '';

  // Patterns pour détecter les zones avec emojis
  const zonePatterns = [
    /^(🍍|🍊|👉|🔵|🟢|🟡|🔴|1️⃣|2️⃣|3️⃣|•)\s*(.+?)\s*:\s*(.+)$/,
    /^(Zone\s*\d+|Partie\s*\d+)\s*:\s*(.+)$/i
  ];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Vérifier si c'est une zone
    let isZone = false;
    for (const pattern of zonePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        isZone = true;
        if (match.length === 4) {
          zones.push({
            emoji: match[1],
            label: match[2].trim(),
            description: match[3].trim()
          });
        } else if (match.length === 3) {
          zones.push({
            emoji: '👉',
            label: match[1].trim(),
            description: match[2].trim()
          });
        }
        break;
      }
    }

    if (!isZone) {
      // Si pas encore de zones, c'est l'intro
      if (zones.length === 0 && !trimmed.includes('analogie')) {
        intro += (intro ? ' ' : '') + trimmed;
      } else if (zones.length > 0) {
        // Après les zones, c'est la conclusion
        conclusion += (conclusion ? ' ' : '') + trimmed;
      }
    }
  });

  return {
    title: analogyTitle || 'Analogie',
    intro: intro || 'Voici une analogie pour mieux comprendre :',
    zones: zones.length > 0 ? zones : undefined,
    conclusion: conclusion || undefined,
    // Fallback: si on n'a pas pu parser, on garde le HTML brut
    htmlContent: zones.length === 0 ? analogyHtml : undefined
  };
}

// Fonction pour créer une structure JSON de base pour un module
function createModuleStructure(module, analogies) {
  const structure = {
    header: {
      moduleNumber: (module.order_index || 0) + 1,
      lessonNumber: 1,
      title: module.title,
      objectives: [
        `Comprendre les concepts clés de "${module.title}"`,
        'Maîtriser les notions fondamentales présentées',
        'Appliquer ces connaissances dans un contexte pratique'
      ]
    },
    sections: [],
    glossary: []
  };

  // Extraire les sections du HTML
  if (module.content) {
    const dom = new JSDOM(module.content);
    const doc = dom.window.document;

    // Chercher les H2 comme sections principales
    const h2s = doc.querySelectorAll('h2');
    let sectionNumber = 1;

    h2s.forEach((h2) => {
      const sectionTitle = h2.textContent?.replace(/🎯|📊|💡|🔍|📈|💰|🏦/g, '').trim() || '';

      // Ignorer les sections d'objectifs pédagogiques
      if (sectionTitle.toLowerCase().includes('objectif')) {
        // Extraire les objectifs
        const nextElement = h2.nextElementSibling;
        if (nextElement && nextElement.tagName === 'UL') {
          const lis = nextElement.querySelectorAll('li');
          structure.header.objectives = Array.from(lis).map(li => li.textContent?.trim() || '');
        }
        return;
      }

      const section = {
        type: 'section',
        number: `${structure.header.moduleNumber}.${sectionNumber}`,
        title: sectionTitle,
        blocks: []
      };

      // Collecter le contenu jusqu'au prochain H2
      let nextEl = h2.nextElementSibling;
      while (nextEl && nextEl.tagName !== 'H2') {
        // Convertir chaque élément en block
        const block = elementToBlock(nextEl, analogies);
        if (block) {
          section.blocks.push(block);
        }
        nextEl = nextEl.nextElementSibling;
      }

      if (section.blocks.length > 0 || sectionTitle) {
        structure.sections.push(section);
        sectionNumber++;
      }
    });
  }

  return structure;
}

// Convertir un élément HTML en block JSON
function elementToBlock(element, analogies) {
  if (!element) return null;

  const tagName = element.tagName.toLowerCase();
  const text = element.textContent?.trim() || '';
  const html = element.innerHTML;

  // Ignorer les éléments vides
  if (!text && !html) return null;

  switch (tagName) {
    case 'p':
      // Vérifier si c'est une analogie
      if (text.includes('analogie') || text.includes('Imaginez')) {
        return {
          type: 'analogy',
          content: parseAnalogy(html)
        };
      }
      return {
        type: 'paragraph',
        content: html
      };

    case 'ul':
    case 'ol':
      const items = Array.from(element.querySelectorAll('li')).map(li => li.innerHTML);
      return {
        type: 'list',
        content: {
          items,
          ordered: tagName === 'ol'
        }
      };

    case 'blockquote':
      // Les blockquotes sont souvent des analogies
      return {
        type: 'analogy',
        content: parseAnalogy(html)
      };

    case 'table':
      const headers = Array.from(element.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
      const rows = Array.from(element.querySelectorAll('tbody tr')).map(tr =>
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
      );
      return {
        type: 'table',
        content: {
          headers,
          rows
        }
      };

    case 'div':
      // Vérifier si c'est une boîte spéciale
      const className = element.className || '';
      if (className.includes('bg-gradient') || className.includes('bg-blue') || className.includes('bg-amber')) {
        // C'est probablement une info-box ou une analogie
        if (text.includes('analogie') || text.includes('💡')) {
          return {
            type: 'analogy',
            content: parseAnalogy(html)
          };
        }
        return {
          type: 'info-box',
          content: {
            content: html
          }
        };
      }
      // Div générique - on la traite comme un groupe de paragraphes
      return null;

    case 'h3':
    case 'h4':
      return {
        type: 'subsection',
        content: {
          title: text,
          content: ''
        }
      };

    default:
      return null;
  }
}

async function main() {
  try {
    // Récupérer tous les modules
    const modules = await prisma.learningModule.findMany({
      orderBy: { order_index: 'asc' }
    });

    console.log(`📚 ${modules.length} modules trouvés\n`);

    for (const module of modules) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📖 Module ${module.order_index}: ${module.title}`);
      console.log(`   Slug: ${module.slug}`);

      // Extraire les analogies
      const analogies = extractAnalogies(module.content);
      console.log(`   🔍 ${analogies.length} analogie(s) trouvée(s)`);

      // Créer la structure JSON
      const jsonStructure = createModuleStructure(module, analogies);

      // Afficher un aperçu
      console.log(`   📊 ${jsonStructure.sections.length} section(s) créée(s)`);

      if (analogies.length > 0) {
        console.log(`   💡 Analogies détectées:`);
        analogies.forEach((a, i) => {
          const preview = (a.content || '').substring(0, 100).replace(/\n/g, ' ');
          console.log(`      ${i + 1}. ${preview}...`);
        });
      }

      // Sauvegarder dans la base de données
      const contentJsonString = JSON.stringify(jsonStructure);

      await prisma.learningModule.update({
        where: { id: module.id },
        data: { content_json: contentJsonString }
      });

      console.log(`   ✅ Module mis à jour avec content_json`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n✅ Conversion terminée pour ${modules.length} modules!`);
    console.log(`\n⚠️  Note: Vérifiez le rendu dans l'application et ajustez manuellement si nécessaire.`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
