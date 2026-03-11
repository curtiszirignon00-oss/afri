/**
 * EMERGENCY SCRIPT — 11 mars 2026
 * - Invalide les sessions des 4 comptes avec tokens actifs détectés
 * - Envoie alert email à la nouvelle victime (sanei4152@gmail.com)
 * - Verifie les dernières activités suspectes
 * Exécuter : npx ts-node src/scripts/emergency-march11.ts
 */

import { prisma } from '../config/database';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '../services/email.service';

// Les 4 comptes avec tokens actifs détectés lors de l'audit
const COMPROMISED_ACCOUNTS = [
    'bossbien1@gmail.com',
    'essiomle.ks@gmail.com',
    'dioumdouda@gmail.com',
    'sanei4152@gmail.com', // Nouvelle victime
];

async function emergencyMarch11() {
    console.log('🔴 EMERGENCY SCRIPT — 11 mars 2026');
    console.log('=========================================\n');

    // 1. Invalider les sessions en régénérant le remember_token pour les 4 comptes
    console.log('1. Invalidation des sessions des comptes compromis...');
    for (const email of COMPROMISED_ACCOUNTS) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`  ⚠️  ${email} — compte non trouvé`);
            continue;
        }

        const newRememberToken = crypto.randomBytes(16).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: {
                remember_token: newRememberToken,
                password_reset_token: null,
                password_reset_expires: null,
            },
        });
        console.log(`  ✅ ${email} — sessions invalidées, token effacé`);
    }

    // 2. Vérifier les dernières activités dans les audit logs pour ces comptes
    console.log('\n2. Activités récentes (dernières 24h)...');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const email of COMPROMISED_ACCOUNTS) {
        const logs = await (prisma as any).auditLog.findMany({
            where: {
                userEmail: email,
                created_at: { gte: yesterday },
            },
            orderBy: { created_at: 'desc' },
            take: 5,
        });

        if (logs.length === 0) {
            console.log(`  ${email} — aucune activité récente`);
        } else {
            console.log(`  ${email}:`);
            for (const log of logs) {
                console.log(`    [${log.created_at.toISOString()}] ${log.action} — IP: ${log.ip}`);
            }
        }
    }

    // 3. Vérifier si des comptes fake-afribourse.com sont encore actifs avec des sessions
    console.log('\n3. Comptes fake-afribourse.com avec sessions actives...');
    const fakeAccounts = await prisma.user.findMany({
        where: { email: { endsWith: '@fake-afribourse.com' } },
        select: { email: true, remember_token: true, updated_at: true },
        take: 10,
    });
    console.log(`  ${fakeAccounts.length} comptes fake-afribourse.com trouvés`);
    const recentFake = fakeAccounts.filter(u => u.updated_at && u.updated_at > yesterday);
    if (recentFake.length > 0) {
        console.log('  ⚠️  Comptes fake avec connexion récente :');
        recentFake.forEach(u => console.log(`    - ${u.email} — modifié: ${u.updated_at}`));
    }

    // 4. Envoyer email d'alerte à sanei4152 via reset password
    console.log('\n4. Envoi reset password à la nouvelle victime sanei4152@gmail.com...');
    const sanei = await prisma.user.findUnique({ where: { email: 'sanei4152@gmail.com' } });
    if (sanei) {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
        await prisma.user.update({
            where: { id: sanei.id },
            data: { password_reset_token: resetToken, password_reset_expires: expiry },
        });
        try {
            await sendPasswordResetEmail({ email: sanei.email, name: sanei.name || 'Utilisateur', resetToken });
            console.log('  ✅ Email de reset envoyé à sanei4152@gmail.com');
        } catch (e) {
            console.error('  ❌ Échec envoi email:', e);
        }
    } else {
        console.log('  ⚠️  sanei4152@gmail.com non trouvé en base');
    }

    console.log('\n✅ Script terminé.');
    await prisma.$disconnect();
}

emergencyMarch11().catch((e) => {
    console.error('Erreur:', e);
    process.exit(1);
});
