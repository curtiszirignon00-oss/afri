// src/scripts/update-leaderboard-streaks.ts
// À exécuter chaque soir après la clôture du marché (ex: cron 18:00 LMT lun–ven)
// Met à jour les streaks du top 3 et invalide le cache leaderboard
import { prisma } from '../config/database';
import { calculateWeeklyRankings } from '../services/leaderboard.service';
import { cacheInvalidatePattern, cacheSet, CACHE_KEYS, CACHE_TTL } from '../services/cache.service';

async function updateLeaderboardStreaks() {
    console.log('');
    console.log('═'.repeat(60));
    console.log('  🔥 MISE À JOUR DES STREAKS LEADERBOARD');
    console.log(`  📅 ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })}`);
    console.log('═'.repeat(60));

    try {
        // 1. Calculer le classement du jour
        console.log('\n📊 Calcul du classement en cours...');
        const rankings = await calculateWeeklyRankings(100);

        if (rankings.length === 0) {
            console.log('⚠️  Classement vide, aucun streak à mettre à jour.\n');
            return;
        }

        // 2. Identifier le top 3 actuel
        const top3 = rankings.filter(r => r.rank <= 3);
        console.log('\n🏆 Top 3 du jour :');
        top3.forEach(r => {
            console.log(`   #${r.rank} — ${r.name} ${r.lastname} (${r.gainLossPercent.toFixed(2)}%)`);
        });

        // 3. Récupérer tous les participants ACTIFS pour mise à jour
        const allParticipants = await prisma.challengeParticipant.findMany({
            where: { status: 'ACTIVE' },
            select: {
                userId: true,
                top3_rank: true,
                top3_streak: true,
                streak_since: true,
            },
        });

        // 4. Mettre à jour les streaks
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streaksIncremented = 0;
        let streaksReset = 0;
        let newStreaks = 0;

        for (const participant of allParticipants) {
            const currentEntry = top3.find(r => r.userId === participant.userId);
            const currentRank = currentEntry?.rank ?? null;

            if (currentRank !== null && currentRank <= 3) {
                // Participant dans le top 3
                if (participant.top3_rank === currentRank) {
                    // Même rang qu'hier → incrémenter le streak
                    await prisma.challengeParticipant.update({
                        where: { userId: participant.userId },
                        data: {
                            top3_streak: { increment: 1 },
                            top3_rank: currentRank,
                        },
                    });
                    streaksIncremented++;
                } else {
                    // Nouveau rang dans le top 3 → démarrer un nouveau streak à 1
                    await prisma.challengeParticipant.update({
                        where: { userId: participant.userId },
                        data: {
                            top3_streak: 1,
                            top3_rank: currentRank,
                            streak_since: today,
                        },
                    });
                    if (participant.top3_rank !== null) {
                        streaksIncremented++; // Changement de rang dans le top 3
                    } else {
                        newStreaks++; // Entrée dans le top 3
                    }
                }
            } else if (participant.top3_rank !== null) {
                // Participant hors top 3 alors qu'il y était avant → reset
                await prisma.challengeParticipant.update({
                    where: { userId: participant.userId },
                    data: {
                        top3_streak: 0,
                        top3_rank: null,
                        streak_since: null,
                    },
                });
                streaksReset++;
            }
            // Si hors top 3 et n'y était pas avant → rien à faire
        }

        console.log('\n📈 Résumé des mises à jour :');
        console.log(`   Nouveaux streaks     : ${newStreaks}`);
        console.log(`   Streaks incrémentés  : ${streaksIncremented}`);
        console.log(`   Streaks réinitialisés: ${streaksReset}`);

        // 5. Invalider et réchauffer le cache
        await cacheInvalidatePattern('leaderboard:*');
        await Promise.all([
            cacheSet(CACHE_KEYS.leaderboard(20), rankings.slice(0, 20), CACHE_TTL.LEADERBOARD),
            cacheSet(CACHE_KEYS.leaderboard(50), rankings.slice(0, 50), CACHE_TTL.LEADERBOARD),
            cacheSet(CACHE_KEYS.leaderboard(100), rankings, CACHE_TTL.LEADERBOARD),
        ]);
        console.log('\n✅ Cache leaderboard mis à jour.\n');

        // 6. Afficher l'état final des streaks actifs
        const activeStreaks = await prisma.challengeParticipant.findMany({
            where: {
                status: 'ACTIVE',
                top3_rank: { not: null },
            },
            orderBy: { top3_streak: 'desc' },
            include: {
                user: { select: { name: true, lastname: true } },
            },
        });

        if (activeStreaks.length > 0) {
            console.log('🔥 Streaks actifs après mise à jour :');
            activeStreaks.forEach(p => {
                const flame = '🔥'.repeat(Math.min(p.top3_streak, 5));
                console.log(`   #${p.top3_rank} ${p.user.name} ${p.user.lastname} — ${p.top3_streak} jour(s) ${flame}`);
            });
        }

        console.log('\n' + '═'.repeat(60));
        console.log('  ✅ Mise à jour des streaks terminée !');
        console.log('═'.repeat(60) + '\n');

    } catch (error) {
        console.error('\n💥 Erreur lors de la mise à jour des streaks :', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateLeaderboardStreaks()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
