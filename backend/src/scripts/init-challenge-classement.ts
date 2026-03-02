// src/scripts/init-challenge-classement.ts
// Script d'initialisation du classement Challenge AfriBourse 2026
// À exécuter le jour du lancement : 2 mars 2026
import { prisma } from '../config/database';
import { calculateWeeklyRankings, getChallengeStatistics } from '../services/leaderboard.service';
import { cacheInvalidatePattern, cacheSet, CACHE_KEYS, CACHE_TTL } from '../services/cache.service';

const CHALLENGE_COMMUNITY_SLUG = '-challenge-afribourse-le-hub-de-lelite';
const INITIAL_CHALLENGE_BALANCE = 1_000_000;

// ============= ETAPE 1 : DIAGNOSTIQUE =============

async function diagnostiqueParticipants() {
    console.log('\n🔍 ÉTAPE 1 — Diagnostique des participants...\n');

    const participants = await prisma.challengeParticipant.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    lastname: true,
                    email: true,
                    portfolios: {
                        where: { wallet_type: 'CONCOURS' },
                        select: { id: true, cash_balance: true, status: true },
                    },
                },
            },
        },
    });

    const total = participants.length;
    const actifs = participants.filter(p => p.status === 'ACTIVE').length;
    const bannis = participants.filter(p => p.status === 'BANNED').length;
    const sansWallet = participants.filter(p => p.user.portfolios.length === 0);
    const avecRegles = participants.filter(p => p.accepted_rules).length;

    console.log(`   Total inscrits       : ${total}`);
    console.log(`   Actifs               : ${actifs}`);
    console.log(`   Bannis               : ${bannis}`);
    console.log(`   Règles acceptées     : ${avecRegles} / ${total}`);
    console.log(`   Sans wallet CONCOURS : ${sansWallet.length}`);

    if (sansWallet.length > 0) {
        console.log('\n   ⚠️  Participants sans wallet :');
        sansWallet.forEach(p => {
            console.log(`      - ${p.user.name} ${p.user.lastname} (${p.user.email})`);
        });
    }

    return { participants, sansWallet };
}

// ============= ETAPE 2 : CRÉATION DES WALLETS MANQUANTS =============

async function creerWalletsManquants(sansWallet: any[]) {
    if (sansWallet.length === 0) {
        console.log('\n✅ ÉTAPE 2 — Tous les participants ont un wallet CONCOURS.\n');
        return 0;
    }

    console.log(`\n🛠️  ÉTAPE 2 — Création de ${sansWallet.length} wallet(s) manquant(s)...\n`);

    let crees = 0;
    let erreurs = 0;

    for (const participant of sansWallet) {
        try {
            await prisma.portfolio.create({
                data: {
                    userId: participant.userId,
                    name: 'Challenge AfriBourse 2026',
                    wallet_type: 'CONCOURS',
                    status: 'ACTIVE',
                    initial_balance: INITIAL_CHALLENGE_BALANCE,
                    cash_balance: INITIAL_CHALLENGE_BALANCE,
                    is_virtual: true,
                    contest_metadata: {
                        createdByInitScript: true,
                        createdAt: new Date().toISOString(),
                    },
                },
            });
            console.log(`   ✅ Wallet créé pour ${participant.user.name} ${participant.user.lastname}`);
            crees++;
        } catch (error: any) {
            console.error(`   ❌ Erreur pour ${participant.user.email}: ${error.message}`);
            erreurs++;
        }
    }

    console.log(`\n   Wallets créés : ${crees} | Erreurs : ${erreurs}`);
    return crees;
}

// ============= ETAPE 3 : VÉRIFICATION COMMUNAUTÉ =============

async function verifierMembersCommunity(participants: any[]) {
    console.log('\n🏘️  ÉTAPE 3 — Vérification des membres de la communauté...\n');

    const community = await prisma.community.findUnique({
        where: { slug: CHALLENGE_COMMUNITY_SLUG },
        select: { id: true, name: true, members_count: true },
    });

    if (!community) {
        console.log('   ⚠️  Communauté challenge introuvable (slug:', CHALLENGE_COMMUNITY_SLUG, ')');
        return;
    }

    console.log(`   Communauté : "${community.name}"`);
    console.log(`   Membres (compteur) : ${community.members_count}`);

    // Vérifier les participants non membres
    const userIds = participants
        .filter(p => p.status === 'ACTIVE')
        .map(p => p.userId);

    const membresExistants = await prisma.communityMember.findMany({
        where: {
            community_id: community.id,
            user_id: { in: userIds },
        },
        select: { user_id: true },
    });

    const membresSet = new Set(membresExistants.map(m => m.user_id));
    const nonMembres = userIds.filter(id => !membresSet.has(id));

    if (nonMembres.length === 0) {
        console.log('   ✅ Tous les participants actifs sont membres de la communauté.');
    } else {
        console.log(`   ⚠️  ${nonMembres.length} participant(s) actif(s) non membres — ajout en cours...`);

        let ajoutes = 0;
        for (const userId of nonMembres) {
            try {
                await prisma.communityMember.create({
                    data: {
                        community_id: community.id,
                        user_id: userId,
                        role: 'MEMBER',
                    },
                });
                ajoutes++;
            } catch (_) {
                // Doublon possible, on ignore
            }
        }

        if (ajoutes > 0) {
            await prisma.community.update({
                where: { id: community.id },
                data: { members_count: { increment: ajoutes } },
            });
        }

        console.log(`   ✅ ${ajoutes} membre(s) ajouté(s) à la communauté.`);
    }
}

// ============= ETAPE 4 : CALCUL DU CLASSEMENT INITIAL =============

async function initialiserClassement() {
    console.log('\n🏆 ÉTAPE 4 — Calcul du classement initial...\n');

    try {
        // Vider le cache leaderboard pour forcer un recalcul frais
        await cacheInvalidatePattern('leaderboard:*');
        console.log('   🗑️  Cache leaderboard vidé.');

        const rankings = await calculateWeeklyRankings(100);

        if (rankings.length === 0) {
            console.log('   ℹ️  Classement vide — aucun participant actif trouvé.');
            console.log('   Le classement sera disponible dès les premières transactions.');
        } else {
            // Réchauffer le cache pour les tailles courantes
            await Promise.all([
                cacheSet(CACHE_KEYS.leaderboard(20), rankings.slice(0, 20), CACHE_TTL.LEADERBOARD),
                cacheSet(CACHE_KEYS.leaderboard(50), rankings.slice(0, 50), CACHE_TTL.LEADERBOARD),
                cacheSet(CACHE_KEYS.leaderboard(100), rankings, CACHE_TTL.LEADERBOARD),
            ]);
            console.log(`   ✅ Classement calculé et mis en cache pour ${rankings.length} participant(s).`);
            console.log('\n   📊 TOP 10 initial :');
            console.log('   ' + '─'.repeat(70));

            rankings.slice(0, 10).forEach(entry => {
                const perf = entry.gainLossPercent >= 0
                    ? `+${entry.gainLossPercent.toFixed(2)}%`
                    : `${entry.gainLossPercent.toFixed(2)}%`;
                const eligible = entry.isEligible ? '✓' : ' ';
                const name = `${entry.name} ${entry.lastname}`.padEnd(25);
                console.log(`   #${String(entry.rank).padEnd(3)} ${eligible} ${name} ${perf.padStart(8)}  (${entry.totalValue.toLocaleString('fr-FR')} FCFA)`);
            });

            if (rankings.length > 10) {
                console.log(`   ... et ${rankings.length - 10} autres participants.`);
            }
        }

        return rankings;
    } catch (error: any) {
        console.error('   ❌ Erreur lors du calcul du classement :', error.message);
        return [];
    }
}

// ============= ETAPE 5 : RAPPORT FINAL =============

async function rapportFinal() {
    console.log('\n📈 ÉTAPE 5 — Rapport final des statistiques...\n');

    try {
        const stats = await getChallengeStatistics();

        console.log('   ┌─────────────────────────────────────────────┐');
        console.log('   │     CHALLENGE AFRIBOURSE 2026 — J+0         │');
        console.log('   ├─────────────────────────────────────────────┤');
        console.log(`   │  Total participants     : ${String(stats.totalParticipants).padStart(6)}             │`);
        console.log(`   │  Participants actifs    : ${String(stats.activeParticipants).padStart(6)}             │`);
        console.log(`   │  Participants éligibles : ${String(stats.eligibleParticipants).padStart(6)}             │`);
        console.log(`   │  Participants bannis    : ${String(stats.bannedParticipants).padStart(6)}             │`);
        console.log(`   │  Transactions totales   : ${String(stats.totalTransactions).padStart(6)}             │`);
        console.log('   └─────────────────────────────────────────────┘');
    } catch (error: any) {
        console.error('   ❌ Erreur lors du rapport :', error.message);
    }
}

// ============= MAIN =============

async function main() {
    console.log('');
    console.log('═'.repeat(65));
    console.log('  🚀 INITIALISATION DU CHALLENGE AFRIBOURSE 2026');
    console.log(`  📅 ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Abidjan' })}`);
    console.log('═'.repeat(65));

    try {
        // Étape 1 : diagnostique
        const { participants, sansWallet } = await diagnostiqueParticipants();

        // Étape 2 : wallets manquants
        await creerWalletsManquants(sansWallet);

        // Étape 3 : vérification communauté
        await verifierMembersCommunity(participants);

        // Étape 4 : classement initial
        await initialiserClassement();

        // Étape 5 : rapport final
        await rapportFinal();

        console.log('\n' + '═'.repeat(65));
        console.log('  ✅ INITIALISATION TERMINÉE — Le challenge est lancé !');
        console.log('  🌐 https://www.africbourse.com/communities/-challenge-afribourse-le-hub-de-lelite');
        console.log('═'.repeat(65) + '\n');

    } catch (error) {
        console.error('\n💥 Erreur fatale :', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
