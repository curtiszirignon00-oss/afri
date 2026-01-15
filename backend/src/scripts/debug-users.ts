/// <reference types="node" />
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Requête 1: Comptes sans email_verified_at
  const query1 = await prisma.user.findMany({
    where: { email_verified_at: null },
    select: { email: true, email_verified_at: true, email_confirmation_token: true },
    take: 5
  });

  console.log('\n1️⃣ Comptes avec email_verified_at: null');
  console.log(JSON.stringify(query1, null, 2));

  // Requête 2: Comptes sans token
  const query2 = await prisma.user.findMany({
    where: { email_confirmation_token: null },
    select: { email: true, email_verified_at: true, email_confirmation_token: true },
    take: 5
  });

  console.log('\n2️⃣ Comptes avec email_confirmation_token: null');
  console.log(JSON.stringify(query2, null, 2));

  // Requête 3: AND condition
  const query3 = await prisma.user.findMany({
    where: {
      AND: [
        { email_verified_at: null },
        { email_confirmation_token: null }
      ]
    },
    select: { email: true, email_verified_at: true, email_confirmation_token: true },
    take: 5
  });

  console.log('\n3️⃣ Comptes avec les DEUX null (AND)');
  console.log(JSON.stringify(query3, null, 2));

  // Requête 4: Nested where
  const query4 = await prisma.user.findMany({
    where: {
      email_verified_at: null,
      email_confirmation_token: null,
    },
    select: { email: true, email_verified_at: true, email_confirmation_token: true },
    take: 5
  });

  console.log('\n4️⃣ Comptes avec les DEUX null (nested)');
  console.log(JSON.stringify(query4, null, 2));

  await prisma.$disconnect();
}

main();
