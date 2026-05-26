/// <reference types="node" />
/**
 * Envoi de tous les emails redessinés à bossbien1@gmail.com pour vérification visuelle.
 * Usage: npx tsx src/scripts/send-all-emails-preview.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import {
  sendReengagementEmail0,
  sendReengagementEmail1,
  sendReengagementEmail2,
  sendReengagementEmail3,
  sendLeaderboardCongratulationEmail,
  sendWeeklyReportEmail,
} from '../services/email.service';

const TEST_EMAIL = 'bossbien1@gmail.com';
const TEST_NAME  = 'Curtis Zirignon';
const DELAY_MS   = 2500; // throttle SMTP

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('='.repeat(65));
  console.log('📧  Envoi de tous les emails AfriBourse vers', TEST_EMAIL);
  console.log('='.repeat(65) + '\n');

  // ── 1. Email 0 — Relance confirmation ────────────────────────────────────
  console.log('1/8  Email 0 — Relance confirmation...');
  try {
    await sendReengagementEmail0({
      email: TEST_EMAIL,
      name: TEST_NAME,
      confirmationToken: 'tok_abc123def456xyz789',
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }
  await sleep(DELAY_MS);

  // ── 2. Email 1 — Réengagement J+1 ────────────────────────────────────────
  console.log('2/8  Email 1 — Réengagement J+1...');
  try {
    await sendReengagementEmail1({
      email: TEST_EMAIL,
      name: TEST_NAME,
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }
  await sleep(DELAY_MS);

  // ── 3. Email 2 — Marché BRVM J+3 (données dynamiques) ────────────────────
  console.log('3/8  Email 2 — Marché BRVM J+3...');
  try {
    await sendReengagementEmail2({
      email: TEST_EMAIL,
      name: TEST_NAME,
      stocks: [
        { symbol: 'SIVC', companyName: 'SIV Côte d\'Ivoire', weeklyChangePercent: 7.4 },
        { symbol: 'BICC', companyName: 'BICI Côte d\'Ivoire', weeklyChangePercent: 4.1 },
        { symbol: 'BOAB', companyName: 'Bank of Africa Bénin', weeklyChangePercent: -2.8 },
      ],
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }
  await sleep(DELAY_MS);

  // ── 4. Email 3 — Simulateur & Top classement J+7 ─────────────────────────
  console.log('4/8  Email 3 — Simulateur & Top classement J+7...');
  try {
    await sendReengagementEmail3({
      email: TEST_EMAIL,
      name: TEST_NAME,
      leaders: [
        { rank: 1, displayName: 'Kouassi A.',  totalValue: 1_580_000, roi: 18.4 },
        { rank: 2, displayName: 'Fatou D.',    totalValue: 1_390_000, roi: 14.2 },
        { rank: 3, displayName: 'Ibrahim S.',  totalValue: 1_210_000, roi: 10.7 },
      ],
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }
  await sleep(DELAY_MS);

  // ── 5. Email Top Classement — redesign KOFI ──────────────────────────────
  console.log('5/8  Email Félicitations Classement (avec topSignalTicker)...');
  try {
    await sendLeaderboardCongratulationEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      rank: 2,
      roi: 14.2,
      topSignalTicker: 'SIVC',
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }
  await sleep(DELAY_MS);

  // ── 6. Bilan Hebdo — Segment A (Learner + Trader) ────────────────────────
  console.log('6/8  Bilan Hebdo — Segment A (Learner + Trader)...');
  try {
    await sendWeeklyReportEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      period: 'du 28 avril au 2 mai 2025',
      segment: 'A',
      portfolioStats: {
        totalValue:           1_245_800,
        cashBalance:            320_000,
        investedValue:          925_800,
        totalGainLoss:          145_800,
        totalGainLossPercent:     13.26,
        positionsCount: 4,
        topPerformers: [
          { ticker: 'SIVC', gainLossPercent: 22.4, value: 415_000 },
          { ticker: 'BOAB', gainLossPercent: 11.8, value: 310_000 },
        ],
        topLosers: [
          { ticker: 'BICC', gainLossPercent: -4.2, value: 200_800 },
        ],
        biweeklyEvolution: {
          previousValue:  1_121_500,
          currentValue:   1_245_800,
          change:           124_300,
          changePercent:      11.08,
        },
      },
      learningStats: {
        weeklyModulesCompleted: 3,
        weeklyXpEarned:        150,
        currentStreak:           7,
        currentLevel:            4,
        totalXp:              1_240,
        completionPercent:      42,
        totalModulesCompleted:   5,
        totalModulesAvailable:  12,
        rank: 18,
        suggestedModules: [
          { title: 'Analyser un bilan financier', slug: 'bilan-financier', difficulty: 'intermediate', durationMinutes: 12 },
          { title: 'Diversification de portefeuille', slug: 'diversification', difficulty: 'intermediate', durationMinutes: 9 },
        ],
        recentAchievements: [
          { name: 'Éveillé BRVM', description: 'A complété 5 modules de formation' },
        ],
        isReminder: false,
      },
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }
  await sleep(DELAY_MS);

  // ── 7. Bilan Hebdo — Segment B (Learner only) ────────────────────────────
  console.log('7/8  Bilan Hebdo — Segment B (Learner only)...');
  try {
    await sendWeeklyReportEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      period: 'du 28 avril au 2 mai 2025',
      segment: 'B',
      learningStats: {
        weeklyModulesCompleted: 2,
        weeklyXpEarned:        100,
        currentStreak:           4,
        currentLevel:            3,
        totalXp:               740,
        completionPercent:      25,
        totalModulesCompleted:   3,
        totalModulesAvailable:  12,
        rank: 42,
        suggestedModules: [
          { title: 'Lire une cotation boursière', slug: 'cotation', difficulty: 'beginner', durationMinutes: 8 },
          { title: 'Les indices BRVM', slug: 'indices-brvm', difficulty: 'beginner', durationMinutes: 7 },
        ],
        recentAchievements: [],
        isReminder: false,
      },
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }
  await sleep(DELAY_MS);

  // ── 8. Bilan Hebdo — Segment C (Trader only) ─────────────────────────────
  console.log('8/8  Bilan Hebdo — Segment C (Trader only)...');
  try {
    await sendWeeklyReportEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      period: 'du 28 avril au 2 mai 2025',
      segment: 'C',
      portfolioStats: {
        totalValue:           980_500,
        cashBalance:          250_000,
        investedValue:        730_500,
        totalGainLoss:        -19_500,
        totalGainLossPercent:   -1.95,
        positionsCount: 3,
        topPerformers: [
          { ticker: 'NTLC', gainLossPercent: 6.1, value: 280_000 },
        ],
        topLosers: [
          { ticker: 'STAC', gainLossPercent: -8.7, value: 250_500 },
        ],
      },
      learningStats: {
        weeklyModulesCompleted: 0,
        weeklyXpEarned:          0,
        currentStreak:           1,
        currentLevel:            2,
        totalXp:               320,
        completionPercent:      16,
        totalModulesCompleted:   2,
        totalModulesAvailable:  12,
        suggestedModules: [
          { title: 'Comprendre le risque de marché', slug: 'risque-marche', difficulty: 'intermediate', durationMinutes: 11 },
        ],
        recentAchievements: [],
        isReminder: true,
      },
    });
    console.log('     ✅ Envoyé\n');
  } catch (e: any) { console.error('     ❌', e.message, '\n'); }

  console.log('='.repeat(65));
  console.log('✅  Tous les emails envoyés à', TEST_EMAIL);
  console.log('='.repeat(65) + '\n');
}

run()
  .then(() => process.exit(0))
  .catch((err) => { console.error('💥 Erreur fatale:', err); process.exit(1); });
