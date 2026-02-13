const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyEmail() {
    const email = 'azizthiaw@gmail.com';

    try {
        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
            return;
        }

        console.log(`✓ Utilisateur trouvé: ${user.name} ${user.lastname}`);

        // Mettre à jour email_verified_at
        const updatedUser = await prisma.user.update({
            where: { email },
            data: {
                email_verified_at: new Date(),
                email_confirmation_token: null,
                email_confirmation_expires: null,
            },
        });

        console.log(`✅ Email marqué comme vérifié pour: ${email}`);
        console.log(`   Date de vérification: ${updatedUser.email_verified_at}`);
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyEmail();
