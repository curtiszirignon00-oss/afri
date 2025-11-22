// Script pour insérer le content_json dans un module
// Usage: node scripts/insert-module-json.js

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // Lire le fichier JSON exemple
  const jsonPath = path.join(__dirname, '../../afribourse/src/data/module-example.json');
  const moduleContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Convertir en string pour stocker dans la DB
  const contentJsonString = JSON.stringify(moduleContent);

  // Mettre à jour le module 2 (index 1) - "Comprendre les Marchés Financiers"
  // Vous pouvez changer le slug selon le module que vous voulez mettre à jour
  const targetSlug = 'comprendre-les-marches-financiers'; // Ajustez selon votre module

  try {
    // D'abord, listons tous les modules pour voir les slugs disponibles
    const allModules = await prisma.learningModule.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        order_index: true
      },
      orderBy: {
        order_index: 'asc'
      }
    });

    console.log('📚 Modules disponibles:');
    allModules.forEach(m => {
      console.log(`  - [${m.order_index}] ${m.slug}: ${m.title}`);
    });

    // Trouver le module avec order_index = 1 (Module 2)
    const targetModule = allModules.find(m => m.order_index === 1);

    if (!targetModule) {
      console.log('\n❌ Module avec order_index=1 non trouvé');
      console.log('Veuillez modifier le script pour cibler le bon module');
      return;
    }

    console.log(`\n🎯 Module cible: ${targetModule.title} (${targetModule.slug})`);

    // Mettre à jour le module avec le content_json
    const updated = await prisma.learningModule.update({
      where: {
        id: targetModule.id
      },
      data: {
        content_json: contentJsonString
      }
    });

    console.log(`\n✅ Module mis à jour avec succès!`);
    console.log(`   ID: ${updated.id}`);
    console.log(`   Slug: ${updated.slug}`);
    console.log(`   content_json: ${contentJsonString.substring(0, 100)}...`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
