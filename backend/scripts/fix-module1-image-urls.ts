/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BACKEND_BASE = 'https://afribourse-api.onrender.com';

async function main() {
    const module = await prisma.learningModule.findFirst({
        where: { slug: 'fondations-bourse-brvm' },
        select: { id: true, content_json: true },
    });

    if (!module?.content_json) { console.error('❌ Module introuvable'); process.exit(1); }

    let json = module.content_json;

    // Remplacer les paths relatifs par des URLs absolues pour les images du module 1
    const replacements: [string, string][] = [
        ['/images/module1-marche-financier.png',        `${BACKEND_BASE}/images/module1-marche-financier.png`],
        ['/images/module1-marche-primaire-secondaire.png', `${BACKEND_BASE}/images/module1-marche-primaire-secondaire.png`],
        ['/images/module1-carte-uemoa.jpg',             `${BACKEND_BASE}/images/module1-carte-uemoa.jpg`],
    ];

    for (const [from, to] of replacements) {
        if (json.includes(from)) {
            json = json.replaceAll(from, to);
            console.log(`✅ ${from} → URL absolue`);
        }
    }

    await prisma.learningModule.update({
        where: { id: module.id },
        data: { content_json: json },
    });

    console.log('✨ URLs mises à jour en base.');
}

main()
    .catch(err => { console.error('❌', err); process.exit(1); })
    .finally(() => prisma.$disconnect());
