import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'sanei4152@gmail.com' },
        select: { id: true, email: true, email_verified_at: true, remember_token: true, password_reset_token: true, password_reset_expires: true, role: true }
    });

    if (!user) { console.log('USER NOT FOUND'); return; }
    console.log('USER:', JSON.stringify(user, null, 2));

    const bans = await (prisma as any).ban.findMany({
        where: { user_id: (user as any).id, lifted_at: null },
        select: { id: true, reason: true, banned_at: true, expires_at: true }
    }).catch(() => []);
    console.log('BANS:', JSON.stringify(bans, null, 2));

    const auditLogs = await (prisma as any).auditLog.findMany({
        where: { userEmail: 'sanei4152@gmail.com' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { action: true, details: true, createdAt: true, success: true, errorMsg: true }
    }).catch(() => []);
    console.log('RECENT AUDIT LOGS:', JSON.stringify(auditLogs, null, 2));

    await prisma.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
