/**
 * EMERGENCY SCRIPT — Efface tous les password_reset_token actifs en base
 * Invalide tous les tokens pré-injectés par le hacker via accès MongoDB direct
 * Exécuter : npx ts-node src/scripts/clear-all-reset-tokens.ts
 */

import { prisma } from '../config/database';

async function clearAllResetTokens() {
    console.log('🔴 EMERGENCY: Suppression de tous les reset tokens actifs...');

    // Compter les tokens actifs avant
    const activeTokens = await prisma.user.count({
        where: {
            password_reset_token: { not: null },
        },
    });

    console.log(`→ ${activeTokens} comptes avec un reset token trouvés`);

    if (activeTokens === 0) {
        console.log('✅ Aucun token actif trouvé. Base déjà propre.');
        await prisma.$disconnect();
        return;
    }

    // Lister les comptes affectés avant suppression
    const affected = await prisma.user.findMany({
        where: { password_reset_token: { not: null } },
        select: { id: true, email: true, password_reset_token: true, password_reset_expires: true },
    });

    console.log('\n📋 Comptes affectés :');
    for (const u of affected) {
        const expired = u.password_reset_expires ? new Date() > u.password_reset_expires : true;
        console.log(`  - ${u.email} | token: ${u.password_reset_token?.substring(0, 16)}... | expiré: ${expired}`);
    }

    // Effacer tous les tokens (y compris ceux pré-injectés par le hacker)
    const result = await prisma.user.updateMany({
        where: { password_reset_token: { not: null } },
        data: {
            password_reset_token: null,
            password_reset_expires: null,
        },
    });

    console.log(`\n✅ ${result.count} tokens effacés avec succès.`);
    console.log('Les sessions en cours ne sont pas affectées (JWT reste valide).');
    console.log('Le hacker ne peut plus utiliser les tokens pré-injectés.');

    await prisma.$disconnect();
}

clearAllResetTokens().catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
});
