// Script pour vérifier le contenu du Module 1 dans la base de données
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModuleContent() {
  try {
    const module = await prisma.learningModule.findFirst({
      where: { slug: 'fondations-bourse-brvm' }
    });

    if (!module) {
      console.log('❌ Module 1 non trouvé dans la base de données');
      return;
    }

    console.log('✅ Module trouvé:', module.title);
    console.log('\n📊 Longueur du contenu:', module.content?.length || 0, 'caractères');

    // Chercher la section 1.3 dans le contenu
    if (module.content) {
      const has13Section = module.content.includes('1.3 Marché primaire');
      console.log('\n🔍 Section 1.3 présente:', has13Section ? '✅' : '❌');

      const hasTable = module.content.includes('<table');
      console.log('🔍 Contient des tableaux:', hasTable ? '✅' : '❌');

      const hasDiv = module.content.includes('<div class="overflow-x-auto">');
      console.log('🔍 Contient des divs avec classes:', hasDiv ? '✅' : '❌');

      // Afficher un extrait de la section 1.3
      const index = module.content.indexOf('1.3 Marché primaire');
      if (index !== -1) {
        console.log('\n📄 Extrait de la section 1.3:');
        console.log(module.content.substring(index, index + 500));
      }
    } else {
      console.log('❌ Le contenu est vide ou null');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkModuleContent();
