/// <reference types="node" />
// backend/scripts/reorder-modules.ts
// Réorganise l'ordre des modules selon le nouveau parcours pédagogique :
//   M0 Mindset           → reste M0
//   M1 La BRVM           → reste M1
//   M2 Les Acteurs       → devient M3
//   M3 Les Outils        → devient M4 (Les Instruments)
//   M4 Produits Avancés  → dépublié
//   M5 Le Temps/Objectifs→ devient M2 (Objectifs & Profil)
//   M6 Psychologie       → reste M6 (renommé Psychologie & Biais)
//   Nouveau M5           → créé (placeholder Passer un Ordre & Délais)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reorderModules() {
    console.log('🔄 Réorganisation des modules...\n');

    // ── 1. Lecture de l'état actuel ───────────────────────────────────────────
    const allModules = await prisma.learningModule.findMany({
        select: { id: true, slug: true, title: true, order_index: true, is_published: true },
        orderBy: { order_index: 'asc' },
    });

    console.log('📋 État actuel :');
    allModules.forEach(m =>
        console.log(`  M${m.order_index} — "${m.title}" (${m.slug}) — publié: ${m.is_published}`)
    );
    console.log('');

    const findBySlug = (slug: string) => allModules.find(m => m.slug === slug);

    // ── 2. Réassignation des order_index ─────────────────────────────────────
    // On passe d'abord par des index temporaires (100+) pour éviter les conflits
    // de contrainte UNIQUE si active sur order_index.

    // Étape A : indices temporaires pour éviter tout conflit
    const slugsToReorder = [
        'mental-du-gagnant',  // M5 → M2
        'acteurs-du-jeu',     // M2 → M3
        'outils-investisseur',// M3 → M4
    ];

    for (const slug of slugsToReorder) {
        const mod = findBySlug(slug);
        if (!mod) { console.warn(`⚠️  Module introuvable : ${slug}`); continue; }
        await prisma.learningModule.update({
            where: { id: mod.id },
            data: { order_index: mod.order_index! + 100 },
        });
    }

    // Étape B : indices définitifs
    const updates: Array<{ slug: string; order_index: number; title?: string; description?: string }> = [
        {
            slug: 'mental-du-gagnant',
            order_index: 2,
            title: 'Objectifs & Profil — Définir ses Objectifs et son Horizon',
            description: "Identifiez vos objectifs financiers, définissez votre horizon de placement et construisez le profil d'investisseur qui vous correspond.",
        },
        {
            slug: 'acteurs-du-jeu',
            order_index: 3,
            // titre inchangé
        },
        {
            slug: 'outils-investisseur',
            order_index: 4,
            title: 'Les Instruments : Actions, Obligations & OPCVM',
            description: "Maîtrisez les trois grandes familles d'instruments financiers cotés sur la BRVM : actions, obligations et OPCVM. Comprenez leurs caractéristiques, leurs risques et comment les utiliser selon votre profil.",
        },
    ];

    for (const upd of updates) {
        const mod = findBySlug(upd.slug);
        if (!mod) { console.warn(`⚠️  Module introuvable : ${upd.slug}`); continue; }
        await prisma.learningModule.update({
            where: { id: mod.id },
            data: {
                order_index: upd.order_index,
                ...(upd.title ? { title: upd.title } : {}),
                ...(upd.description ? { description: upd.description } : {}),
            },
        });
        console.log(`✅ "${upd.slug}" → M${upd.order_index}`);
    }

    // ── 3. Dépublier M4 Produits Avancés ─────────────────────────────────────
    const produitsAvances = findBySlug('le-temps-meilleur-allie');
    if (produitsAvances) {
        await prisma.learningModule.update({
            where: { id: produitsAvances.id },
            data: { is_published: false, order_index: 99 },
        });
        console.log('🚫 "Produits Avancés" dépublié (order_index → 99)');
    } else {
        console.warn('⚠️  Module "le-temps-meilleur-allie" introuvable (Produits Avancés)');
    }

    // ── 4. Renommer M6 Psychologie ────────────────────────────────────────────
    const psycho = findBySlug('analyse-fondamentale');
    if (psycho) {
        await prisma.learningModule.update({
            where: { id: psycho.id },
            data: {
                title: 'Psychologie & Biais – Le Mental du Gagnant',
                description: "Découvrez les biais cognitifs et émotionnels qui sabotent les investisseurs. Apprenez à maîtriser vos réactions pour prendre de meilleures décisions sur le marché.",
            },
        });
        console.log('✅ M6 "Psychologie & Biais" renommé');
    } else {
        console.warn('⚠️  Module "analyse-fondamentale" introuvable');
    }

    // ── 5. Créer le placeholder M5 ────────────────────────────────────────────
    const existingM5 = await prisma.learningModule.findFirst({
        where: { slug: 'passer-un-ordre-delais' },
    });

    if (!existingM5) {
        await prisma.learningModule.create({
            data: {
                slug: 'passer-un-ordre-delais',
                title: 'Passer un Ordre & Délais – Entrer sur le Marché',
                description: "Apprenez à passer vos premiers ordres d'achat et de vente sur la BRVM : types d'ordres, délais de règlement-livraison, règles de la séance de cotation et erreurs à éviter.",
                difficulty_level: 'debutant',
                content_type: 'article',
                duration_minutes: 20,
                order_index: 5,
                is_published: true,
                has_quiz: false,
                content: `
<div class="objectif-hero">
  <h2>🎯 Objectif pédagogique</h2>
  <p>Ce module est en cours de préparation. Il vous apprendra :</p>
  <ul>
    <li>Les différents types d'ordres de Bourse (au marché, à cours limité…)</li>
    <li>Les délais de règlement-livraison sur la BRVM</li>
    <li>Le déroulement d'une séance de cotation</li>
    <li>Les erreurs classiques à éviter lors de votre premier ordre</li>
  </ul>
</div>

<div class="section-blue">
  <h2>🚧 Contenu en préparation</h2>
  <p>Ce module sera disponible très prochainement. Restez connecté pour ne pas le manquer !</p>
</div>
`,
            },
        });
        console.log('✅ Placeholder M5 "Passer un Ordre & Délais" créé');
    } else {
        // Mettre à jour l'order_index au cas où il aurait changé
        await prisma.learningModule.update({
            where: { id: existingM5.id },
            data: { order_index: 5 },
        });
        console.log('ℹ️  Placeholder M5 existait déjà → order_index mis à jour');
    }

    // ── 6. Vérification finale ────────────────────────────────────────────────
    const finalModules = await prisma.learningModule.findMany({
        where: { is_published: true },
        select: { slug: true, title: true, order_index: true, has_quiz: true },
        orderBy: { order_index: 'asc' },
    });

    console.log('\n📋 Nouvel ordre des modules publiés :');
    finalModules.forEach(m =>
        console.log(`  M${m.order_index} — "${m.title}" | quiz: ${m.has_quiz}`)
    );
    console.log('\n✨ Réorganisation terminée !');
}

reorderModules()
    .catch(err => {
        console.error('❌ Erreur :', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
