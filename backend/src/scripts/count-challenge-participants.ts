// src/scripts/count-challenge-participants.ts
import { prisma } from '../config/database';

async function countChallengeParticipants() {
    try {
        console.log('🔍 Comptage des participants au Challenge AfriBourse...\n');

        // Compter tous les participants
        const totalParticipants = await prisma.challengeParticipant.count();

        // Compter les participants actifs
        const activeParticipants = await prisma.challengeParticipant.count({
            where: { status: 'ACTIVE' }
        });

        // Compter les participants éligibles
        const eligibleParticipants = await prisma.challengeParticipant.count({
            where: { is_eligible: true }
        });

        // Compter les participants bannis
        const bannedParticipants = await prisma.challengeParticipant.count({
            where: { status: 'BANNED' }
        });

        // Compter les participants suspendus
        const suspendedParticipants = await prisma.challengeParticipant.count({
            where: { status: 'SUSPENDED' }
        });

        // Compter ceux qui ont accepté les règles
        const acceptedRulesCount = await prisma.challengeParticipant.count({
            where: { accepted_rules: true }
        });

        // Récupérer les statistiques par niveau d'expérience
        const experienceLevels = await prisma.challengeParticipant.groupBy({
            by: ['experience_level'],
            _count: true
        });

        // Récupérer les statistiques par objectif principal
        const primaryGoals = await prisma.challengeParticipant.groupBy({
            by: ['primary_goal'],
            _count: true
        });

        // Affichage des résultats
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 STATISTIQUES DU CHALLENGE AFRIBOURSE 2026');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('📈 PARTICIPANTS INSCRITS');
        console.log(`   Total:              ${totalParticipants}`);
        console.log(`   Actifs:             ${activeParticipants}`);
        console.log(`   Éligibles:          ${eligibleParticipants}`);
        console.log(`   Bannis:             ${bannedParticipants}`);
        console.log(`   Suspendus:          ${suspendedParticipants}`);
        console.log(`   Règles acceptées:   ${acceptedRulesCount}\n`);

        console.log('📚 RÉPARTITION PAR NIVEAU D\'EXPÉRIENCE');
        experienceLevels.forEach(level => {
            console.log(`   ${level.experience_level.padEnd(15)}: ${level._count}`);
        });

        console.log('\n🎯 RÉPARTITION PAR OBJECTIF PRINCIPAL');
        primaryGoals.forEach(goal => {
            console.log(`   ${goal.primary_goal.padEnd(15)}: ${goal._count}`);
        });

        console.log('\n═══════════════════════════════════════════════════════');
        console.log(`✅ Nombre total d'utilisateurs inscrits: ${totalParticipants}`);
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erreur lors du comptage des participants:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
countChallengeParticipants()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
