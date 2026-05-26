import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const mod = await prisma.learningModule.findFirst({
        where: { slug: 'outils-investisseur' },
        select: { id: true, content: true, content_json: true },
    });
    if (!mod) { console.error('❌ Module introuvable'); process.exit(1); }

    const NEW = 'Module 5 — Passer un Ordre & Délais – Entrer sur le Marché';

    // ── JSON : modifier les objets parsés directement ────────────────────────
    const blocks: any[] = JSON.parse(mod.content_json!);
    let jsonChanged = false;

    for (const block of blocks) {
        if (block.type === 'callout' && Array.isArray(block.paragraphs)) {
            block.paragraphs = block.paragraphs.map((p: string) => {
                if (p.includes('Module 4') && p.includes('Produits')) {
                    jsonChanged = true;
                    return NEW;
                }
                return p;
            });
        }
    }

    if (jsonChanged) console.log('✅ JSON : next lesson mis à jour');
    else console.log('ℹ️  JSON : aucun changement');

    // ── HTML : simple replace de chaîne ──────────────────────────────────────
    let content = mod.content ?? '';
    const OLD_HTML = `Prochaine étape : Module 4 — "Produits Avancés : Explorer les Nouvelles Frontières de l’Investissement"`;
    const OLD_HTML2 = `Prochaine étape : Module 4 — "Produits Avancés : Explorer les Nouvelles Frontières de l’Investissement"`;
    const OLD_HTML3 = `Prochaine étape : Module 4 — "Produits Avancés : Explorer les Nouvelles Frontières de l'Investissement"`;

    const newHTML = `Prochaine étape : Module 5 — Passer un Ordre & Délais – Entrer sur le Marché`;
    let htmlChanged = false;

    for (const old of [OLD_HTML, OLD_HTML2, OLD_HTML3]) {
        if (content.includes(old)) {
            content = content.replaceAll(old, newHTML);
            htmlChanged = true;
            break;
        }
    }

    if (htmlChanged) console.log('✅ HTML : next lesson mis à jour');
    else {
        // Fallback regex
        const before = content;
        content = content.replace(/Prochaine\s+étape\s*:\s*Module\s+4[^<"]*Produits[^<"]*/g, newHTML);
        if (content !== before) { htmlChanged = true; console.log('✅ HTML : mis à jour via regex'); }
        else console.log('ℹ️  HTML : aucun changement (text déjà à jour ?)');
    }

    await prisma.learningModule.update({
        where: { id: mod.id },
        data: {
            content_json: jsonChanged ? JSON.stringify(blocks) : mod.content_json,
            content: htmlChanged ? content : mod.content,
        },
    });
    console.log('✨ Terminé.');
}

main().finally(() => prisma.$disconnect());
