/// <reference types="node" />
// Met à jour les références de numéros de modules dans content_json ET content (HTML)
// suite au réordonnancement M2↔M5, M3→M4, M4 dépublié

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const UPDATES: Array<{
    slug: string;
    label: string;
    replacements: Array<[string, string]>;
}> = [
    {
        slug: 'fondations-bourse-brvm',
        label: 'M1 → next lesson',
        replacements: [
            [
                'Module 2 — Les Acteurs du Jeu : Qui fait quoi sur le marché ?',
                'Module 2 — Objectifs & Profil – Définir ses Objectifs et son Horizon',
            ],
        ],
    },
    {
        slug: 'mental-du-gagnant',
        label: 'M2 (ex-M5) → titre + next lesson',
        replacements: [
            ['⏳ Module 5 : Le Temps, Votre Meilleur Allié', '⏳ Module 2 : Objectifs & Profil'],
            // HTML
            ['<h2 style="color: #000000;">⏳ Module 5 : Le Temps, Votre Meilleur Allié</h2>',
             '<h2 style="color: #000000;">⏳ Module 2 : Objectifs & Profil</h2>'],
            ['Prochaine leçon : Module 6 — Le Mental du Gagnant',
             'Prochaine leçon : Module 3 — Les Acteurs du Jeu – Qui fait quoi sur le marché ?'],
        ],
    },
    {
        slug: 'acteurs-du-jeu',
        label: 'M3 (ex-M2) → next lesson',
        replacements: [
            ["Prochaine leçon : Module 3 — Les Outils de l'Investisseur : Actions, Obligations et OPCVM",
             'Prochaine leçon : Module 4 — Les Instruments : Actions, Obligations & OPCVM'],
            // variante avec apostrophe droite
            ["Prochaine leçon : Module 3 — Les Outils de l\\'Investisseur : Actions, Obligations et OPCVM",
             'Prochaine leçon : Module 4 — Les Instruments : Actions, Obligations & OPCVM'],
        ],
    },
    {
        slug: 'outils-investisseur',
        label: 'M4 (ex-M3) → next lesson',
        replacements: [
            // JSON callout
            ['Module 4 — "Produits Avancés : Explorer les Nouvelles Frontières de l\'Investissement"',
             'Module 5 — Passer un Ordre & Délais – Entrer sur le Marché'],
            // variante echappée dans JSON stringifié
            ['Module 4 \\u2014 \\"Produits Avanc\\u00e9s',
             'Module 5 — Passer un Ordre'],
            // HTML
            ['Prochaine étape : Module 4 — "Produits Avancés : Explorer les Nouvelles Frontières de l\'Investissement"',
             'Prochaine étape : Module 5 — Passer un Ordre & Délais – Entrer sur le Marché'],
        ],
    },
];

async function main() {
    for (const { slug, label, replacements } of UPDATES) {
        const mod = await prisma.learningModule.findFirst({
            where: { slug },
            select: { id: true, content: true, content_json: true },
        });

        if (!mod) { console.warn(`⚠️  Module "${slug}" introuvable`); continue; }

        let content = mod.content ?? '';
        let contentJson = mod.content_json ?? '';
        let changed = false;

        for (const [from, to] of replacements) {
            if (content.includes(from)) {
                content = content.replaceAll(from, to);
                changed = true;
                console.log(`  ✅ [${label}] HTML: "${from.slice(0, 60)}..."`);
            }
            if (contentJson.includes(from)) {
                contentJson = contentJson.replaceAll(from, to);
                changed = true;
                console.log(`  ✅ [${label}] JSON: "${from.slice(0, 60)}..."`);
            }
        }

        if (changed) {
            await prisma.learningModule.update({
                where: { id: mod.id },
                data: { content, content_json: contentJson },
            });
            console.log(`  💾 Module "${slug}" mis à jour\n`);
        } else {
            console.log(`  ℹ️  Module "${slug}" — aucun remplacement trouvé (déjà à jour ?)\n`);
        }
    }

    console.log('✨ Mise à jour des références terminée.');
}

main()
    .catch(err => { console.error('❌', err); process.exit(1); })
    .finally(() => prisma.$disconnect());
