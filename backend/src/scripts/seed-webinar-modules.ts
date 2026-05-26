// backend/src/scripts/seed-webinar-modules.ts
// Initialise les 5 modules webinaires de la spec Afribourse Académie
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MODULES = [
  { moduleId: 'fondamentaux-bourse',    name: 'Fondamentaux de la Bourse',  subtitle: 'Académie BRVM · 3 heures · Niveau débutant',       order: 1 },
  { moduleId: 'analyse-fondamentale',   name: 'Analyse Fondamentale',        subtitle: 'Académie BRVM · 3 heures · Niveau intermédiaire',  order: 2 },
  { moduleId: 'construire-portefeuille',name: 'Construire son Portefeuille', subtitle: 'Académie BRVM · 3 heures · Niveau intermédiaire',  order: 3 },
  { moduleId: 'gerer-risque',           name: 'Gérer le Risque',             subtitle: 'Académie BRVM · 3 heures · Niveau avancé',         order: 4 },
  { moduleId: 'lire-etats-financiers',  name: 'Lire les États Financiers',   subtitle: 'Académie BRVM · 3 heures · Niveau intermédiaire',  order: 5 },
];

async function main() {
  console.log('Seeding webinar modules...');
  for (const mod of MODULES) {
    const result = await prisma.webinarModule.upsert({
      where: { moduleId: mod.moduleId },
      update: { name: mod.name, subtitle: mod.subtitle, order: mod.order, isActive: true },
      create: { ...mod, isActive: true },
    });
    console.log(`  ✓ ${result.name}`);
  }
  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
