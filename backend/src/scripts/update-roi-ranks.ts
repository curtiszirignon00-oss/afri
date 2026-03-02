// src/scripts/update-roi-ranks.ts
// Initialise / met à jour roi_rank et roi_rank_held_since pour le top 3 ROI (SANDBOX)
// À exécuter une fois manuellement, puis automatiquement via le cron 02h00
import { updateROITopRanks } from '../services/gamification-leaderboard.service';
import { prisma } from '../config/database';

async function main() {
    console.log('');
    console.log('═'.repeat(55));
    console.log('  📊 MISE À JOUR DU STREAK ROI TOP 3');
    console.log(`  📅 ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })}`);
    console.log('═'.repeat(55));

    const result = await updateROITopRanks();

    console.log('\n📈 Résumé :');
    console.log(`   Rangs mis à jour   : ${result.updated}`);
    console.log(`   Rangs réinitialisés: ${result.reset}`);

    // Afficher l'état actuel du top 3
    const top3Profiles = await prisma.userProfile.findMany({
        where: { roi_rank: { not: null } },
        orderBy: { roi_rank: 'asc' },
        select: {
            userId: true,
            roi_rank: true,
            roi_rank_held_since: true,
            user: { select: { name: true, lastname: true } },
        },
    });

    if (top3Profiles.length > 0) {
        console.log('\n🏆 Top 3 ROI actuel :');
        for (const p of top3Profiles) {
            const days = p.roi_rank_held_since
                ? Math.floor((Date.now() - new Date(p.roi_rank_held_since).getTime()) / 86400000) + 1
                : 1;
            console.log(`   #${p.roi_rank} ${p.user.name} ${p.user.lastname} — ${days}j streak (depuis ${p.roi_rank_held_since?.toLocaleDateString('fr-FR') ?? 'aujourd\'hui'})`);
        }
    } else {
        console.log('\n⚠️  Aucun profil dans le top 3 ROI.');
    }

    console.log('\n' + '═'.repeat(55) + '\n');
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
