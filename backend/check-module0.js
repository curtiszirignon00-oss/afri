// Script pour vérifier le contenu du Module 0 dans la base de données
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModule0Content() {
  try {
    const module = await prisma.learningModule.findFirst({
      where: { slug: 'pret-decollage' }
    });

    if (!module) {
      console.log('❌ Module 0 non trouvé dans la base de données');
      return;
    }

    console.log('✅ Module trouvé:', module.title);
    console.log('\n📊 Longueur du contenu:', module.content?.length || 0, 'caractères');

    // Chercher la section objectif pédagogique
    if (module.content) {
      const hasObjectif = module.content.includes('Objectif pédagogique');
      console.log('\n🔍 Section "Objectif pédagogique" présente:', hasObjectif ? '✅' : '❌');

      const hasEtatEsprit = module.content.includes('Adopterez le bon état d\'esprit');
      console.log('🔍 Contient "Adopterez le bon état d\'esprit":', hasEtatEsprit ? '✅' : '❌');

      // Afficher un extrait de la section objectif
      const index = module.content.indexOf('Objectif pédagogique');
      if (index !== -1) {
        console.log('\n📄 Extrait de la section Objectif:');
        console.log(module.content.substring(index, index + 800));
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

checkModule0Content();
