import { PrismaClient } from '@prisma/client';
import { sendInstallmentProgressEmail } from '../services/email.service';

const prisma = new PrismaClient();

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://www.africbourse.com';
const REMIND_WINDOW_DAYS = 2;          // relancer si échéance ≤ now + 2j (ou en retard)
const REMIND_THROTTLE_MS = 20 * 60 * 60 * 1000; // une relance / ~jour
const DRY_RUN = process.argv.includes('--dry-run');

interface Line { index: number; amount: number; status: string; dueAt: string }

async function main() {
  const now = Date.now();
  const horizon = new Date(now + REMIND_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const plans = await prisma.installmentPlan.findMany({
    where: { status: 'active', nextDueAt: { lte: horizon } },
  });

  console.log(`${plans.length} plan(s) actif(s) avec échéance ≤ ${horizon.toISOString()}${DRY_RUN ? ' [DRY RUN]' : ''}`);

  let sent = 0;
  for (const plan of plans) {
    // Throttle : pas plus d'une relance par ~jour
    if (plan.lastReminderAt && now - new Date(plan.lastReminderAt).getTime() < REMIND_THROTTLE_MS) {
      continue;
    }

    const schedule = (plan.schedule as unknown as Line[]) ?? [];
    const next = schedule.find((l) => l.status === 'pending');
    if (!next) continue;

    const reg = await prisma.webinarRegistration.findFirst({ where: { webinarId: plan.planId, email: plan.email } });
    const firstName = reg?.firstName ?? '';
    const payUrl = `${FRONTEND_URL}/echelonner/${plan.payToken}`;

    console.log(`→ ${plan.email} · mensualité ${plan.installmentsPaid + 1}/${plan.installmentsTotal} · ${next.amount} XOF · échéance ${next.dueAt}`);

    if (!DRY_RUN) {
      await sendInstallmentProgressEmail({
        email: plan.email,
        firstName,
        paidIndex: plan.installmentsPaid,
        total: plan.installmentsTotal,
        amountPaid: plan.amountPaid,
        nextAmount: next.amount,
        nextDueAt: new Date(next.dueAt),
        payUrl,
      });
      await prisma.installmentPlan.update({
        where: { id: plan.id },
        data: { lastReminderAt: new Date() },
      });
    }
    sent++;
  }

  console.log(`✅ ${sent} relance(s) ${DRY_RUN ? 'simulée(s)' : 'envoyée(s)'}.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
