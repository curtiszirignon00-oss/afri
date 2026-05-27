/// <reference types="node" />
// backend/scripts/insert-module2-brvm.ts
// 1. Décale tous les modules order_index >= 2 de +1
// 2. Insère le nouveau Module 2 : La BRVM en Chiffres

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_CONTENT: object[] = [
  {
    type: 'pull-quote',
    text: '🌍 <em>"Nusquam est qui ubique est."</em> (Celui qui est partout n\'est nulle part.) — <strong>Sénèque, Lettres à Lucilius</strong>',
  },
  {
    type: 'objectives',
    title: '🎯 Objectifs pédagogiques',
    subtitle: 'À la fin de ce module, vous :',
    items: [
      'Comprendrez en chiffres réels pourquoi la BRVM est l\'une des places boursières les plus dynamiques d\'Afrique',
      'Mesurerez le potentiel de croissance d\'un marché encore sous-exploité par 99,5 % de la population UEMOA',
      'Comparerez la BRVM aux alternatives d\'épargne disponibles localement',
      'Identifierez les risques réels du marché — sans angélisme ni catastrophisme',
      'Comprendrez pourquoi <strong>maintenant</strong> est un moment stratégique pour commencer',
    ],
  },
];

async function run() {
  try {
    // 1. Lister l'état actuel
    const before = await prisma.learningModule.findMany({
      select: { id: true, order_index: true, slug: true, title: true },
      orderBy: { order_index: 'asc' },
    });

    console.log('\n📋 Modules AVANT décalage :');
    before.forEach(m => console.log(`  [${m.order_index}] ${m.slug} — ${m.title}`));

    // 2. Décaler tous les modules order_index >= 2 de +1
    //    On doit le faire du plus grand au plus petit pour éviter les conflits d'unicité
    const toShift = before
      .filter(m => (m.order_index ?? 0) >= 2)
      .sort((a, b) => (b.order_index ?? 0) - (a.order_index ?? 0));

    console.log(`\n🔀 Décalage de ${toShift.length} modules…`);

    for (const mod of toShift) {
      await prisma.learningModule.update({
        where: { id: mod.id },
        data: { order_index: (mod.order_index ?? 0) + 1 },
      });
      console.log(`  ✅ [${mod.order_index}] → [${(mod.order_index ?? 0) + 1}] ${mod.slug}`);
    }

    // 3. Créer le nouveau module à order_index = 2
    console.log('\n📦 Création du nouveau Module 2 : La BRVM en Chiffres…');

    const newModule = await prisma.learningModule.create({
      data: {
        title: 'La BRVM en Chiffres — Pourquoi Investir Maintenant',
        slug: 'brvm-en-chiffres',
        description:
          'Découvrez en données concrètes pourquoi la BRVM est une opportunité unique pour l\'investisseur UEMOA d\'aujourd\'hui : performances historiques, potentiel de croissance, comparaisons avec les alternatives d\'épargne locales.',
        difficulty_level: 'debutant',
        content_type: 'article',
        order_index: 2,
        is_published: true,
        has_quiz: false,
        duration_minutes: 25,
        content_json: JSON.stringify(INITIAL_CONTENT),
      },
    });

    console.log(`\n✅ Nouveau module créé : ${newModule.id}`);
    console.log(`   Slug  : ${newModule.slug}`);
    console.log(`   Titre : ${newModule.title}`);
    console.log(`   Index : ${newModule.order_index}`);

    // 4. Afficher l'état final
    const after = await prisma.learningModule.findMany({
      select: { order_index: true, slug: true, title: true },
      orderBy: { order_index: 'asc' },
    });

    console.log('\n📋 Modules APRÈS insertion :');
    after.forEach(m => console.log(`  [${m.order_index}] ${m.slug} — ${m.title}`));

    console.log('\n🎉 Terminé ! Pense à vider le cache Redis pour que les changements soient visibles.');
  } catch (err) {
    console.error('❌ Erreur :', err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

run();
