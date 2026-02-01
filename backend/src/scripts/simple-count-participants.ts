// src/scripts/simple-count-participants.ts
import { prisma } from '../config/database';

async function simpleCount() {
    const count = await prisma.challengeParticipant.count();
    console.log(`Nombre total d'utilisateurs inscrits au challenge: ${count}`);

    const active = await prisma.challengeParticipant.count({ where: { status: 'ACTIVE' } });
    console.log(`Participants actifs: ${active}`);

    const eligible = await prisma.challengeParticipant.count({ where: { is_eligible: true } });
    console.log(`Participants éligibles: ${eligible}`);

    await prisma.$disconnect();
}

simpleCount();
