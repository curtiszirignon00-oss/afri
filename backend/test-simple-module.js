// Script pour créer un module de test simple
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestModule() {
  try {
    // Créer un module de test très simple
    const testModule = await prisma.learningModule.upsert({
      where: { slug: 'test-display' },
      update: {
        title: 'TEST - Module d\'affichage',
        description: 'Module de test pour vérifier l\'affichage',
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 5,
        order_index: 99,
        is_published: true,
        content: `
          <div>
            <h2>TEST: Ce titre H2 devrait être visible</h2>
            <p>TEST: Ce paragraphe devrait être visible et lisible.</p>

            <h3>TEST: Sous-titre H3</h3>
            <p>Un autre paragraphe de test avec du texte normal.</p>

            <table border="1">
              <thead>
                <tr>
                  <th>Colonne 1</th>
                  <th>Colonne 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Donnée 1</td>
                  <td>Donnée 2</td>
                </tr>
              </tbody>
            </table>

            <ul>
              <li>Item de liste 1</li>
              <li>Item de liste 2</li>
              <li>Item de liste 3</li>
            </ul>
          </div>
        `
      },
      create: {
        slug: 'test-display',
        title: 'TEST - Module d\'affichage',
        description: 'Module de test pour vérifier l\'affichage',
        difficulty_level: 'debutant',
        content_type: 'article',
        duration_minutes: 5,
        order_index: 99,
        is_published: true,
        content: `
          <div>
            <h2>TEST: Ce titre H2 devrait être visible</h2>
            <p>TEST: Ce paragraphe devrait être visible et lisible.</p>

            <h3>TEST: Sous-titre H3</h3>
            <p>Un autre paragraphe de test avec du texte normal.</p>

            <table border="1">
              <thead>
                <tr>
                  <th>Colonne 1</th>
                  <th>Colonne 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Donnée 1</td>
                  <td>Donnée 2</td>
                </tr>
              </tbody>
            </table>

            <ul>
              <li>Item de liste 1</li>
              <li>Item de liste 2</li>
              <li>Item de liste 3</li>
            </ul>
          </div>
        `
      }
    });

    console.log('✅ Module de test créé:', testModule.title);
    console.log('📍 Slug:', testModule.slug);
    console.log('\n🔍 Essayez d\'ouvrir ce module sur le site pour voir si le contenu s\'affiche.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestModule();
