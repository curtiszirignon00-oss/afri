import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const EMAILS = ['sanei4152@gmail.com', 'bossbien1@gmail.com', 'dioumdouda@gmail.com', 'essiomle.ks@gmail.com'];

async function main() {
    for (const email of EMAILS) {
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
        if (!user) { console.log(`[${email}] NOT FOUND`); continue; }

        const profile = await (prisma as any).investorProfile.findUnique({
            where: { userId: (user as any).id },
            select: { id: true, onboarding_completed: true, risk_profile: true, created_at: true }
        }).catch(() => null);

        console.log(`[${email}] InvestorProfile:`, JSON.stringify(profile));
    }
    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
