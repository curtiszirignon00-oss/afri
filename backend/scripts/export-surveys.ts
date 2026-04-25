/**
 * Script d'exportation des réponses aux surveys et questionnaires
 * Exporte:
 *   1. Survey de découverte (3 questions post-inscription)
 *   2. Questionnaire ADN Investisseur (onboarding)
 *
 * Usage: npx ts-node scripts/export-surveys.ts
 */

import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// ─── Traductions ───────────────────────────────────────────────────────────────

// Q1 — "Quel est votre objectif principal ?"
const Q1_LABELS: Record<string, string> = {
  A: 'Apprendre les bases de la bourse',
  B: "Prendre des décisions d'investissement éclairées",
  C: 'Investir et faire fructifier mon capital',
  D: 'Explorer les marchés africains',
};

// Q2 — "Votre niveau en bourse ?" (optionnel)
const Q2_LABELS: Record<string, string> = {
  A: 'Aucune expérience',
  B: 'Quelques notions de base',
  C: 'Expérience intermédiaire',
  D: 'Expérimenté(e)',
  E: 'Expert(e) / Professionnel(le)',
};

// Q3 — "Quand comptez-vous utiliser ces fonds ?"
const Q3_LABELS: Record<string, string> = {
  A: "Dans moins d'un an (court terme)",
  B: 'Dans 1 à 3 ans (moyen terme)',
  C: 'Dans plus de 3 ans (long terme)',
  D: 'Je ne sais pas encore',
};

const PROFILE_TYPE_FR: Record<string, string> = {
  apprenti: 'Apprenti',
  decideur: 'Décideur',
  investisseur: 'Investisseur',
  explorateur: 'Explorateur',
};

const URGENCY_FR: Record<string, string> = {
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
  unknown: 'Inconnue',
};

// ─── Helpers de style ─────────────────────────────────────────────────────────

function styleHeader(ws: ExcelJS.Worksheet, color: string) {
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color },
  };
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function exportSurveys() {
  console.log('📊 Exportation des surveys et questionnaires...\n');

  const exportsDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(exportsDir, `surveys_${timestamp}.xlsx`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AfriBourse';
  workbook.created = new Date();

  // ══════════════════════════════════════════════════════════════════════════
  // FEUILLE 1 — SURVEY DÉCOUVERTE
  // ══════════════════════════════════════════════════════════════════════════
  console.log('🔍 Export du survey de découverte...');

  const profiles = await prisma.userProfile.findMany({
    where: { survey_completed: true },
    select: {
      userId: true,
      survey_completed: true,
      discovery_survey: true,
      user: {
        select: {
          name: true,
          lastname: true,
          email: true,
          created_at: true,
          subscriptionTier: true,
        },
      },
    },
    orderBy: { userId: 'asc' },
  });

  const wsDisc = workbook.addWorksheet('Survey Découverte');
  wsDisc.columns = [
    { header: 'Prénom', key: 'name', width: 18 },
    { header: 'Nom', key: 'lastname', width: 18 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Abonnement', key: 'subscription', width: 14 },
    { header: 'Inscription', key: 'created_at', width: 20 },
    { header: 'Survey complété', key: 'survey_completed', width: 16 },
    { header: 'Q1 – Quel est votre objectif principal ?', key: 'q1', width: 45 },
    { header: 'Q2 – Votre niveau en bourse ? (optionnel)', key: 'q2', width: 35 },
    { header: 'Q3 – Quand comptez-vous utiliser ces fonds ?', key: 'q3', width: 40 },
    { header: 'Type de profil', key: 'profile_type', width: 18 },
    { header: 'Urgence', key: 'urgency', width: 14 },
    { header: 'Complété le', key: 'completed_at', width: 20 },
  ];

  for (const p of profiles) {
    const survey = p.discovery_survey as Record<string, string> | null;
    wsDisc.addRow({
      name: p.user.name,
      lastname: p.user.lastname,
      email: p.user.email,
      subscription: p.user.subscriptionTier,
      created_at: p.user.created_at,
      survey_completed: p.survey_completed ? 'Oui' : 'Non',
      q1: survey ? (Q1_LABELS[survey.q1] ?? survey.q1) : '',
      q2: survey?.q2 ? (Q2_LABELS[survey.q2] ?? survey.q2) : 'Non renseigné',
      profile_type: survey ? (PROFILE_TYPE_FR[survey.profile_type] ?? survey.profile_type) : '',
      urgency: survey ? (URGENCY_FR[survey.urgency] ?? survey.urgency) : '',
      q3: survey ? (Q3_LABELS[survey.q3] ?? survey.q3) : '',
      completed_at: survey?.completed_at ? new Date(survey.completed_at) : '',
    });
  }

  styleHeader(wsDisc, 'FF1D9E75'); // vert teal AfriBourse

  // Aussi compter ceux qui n'ont PAS complété le survey
  const totalUsers = await prisma.user.count();
  const notCompleted = totalUsers - profiles.length;

  // ligne de résumé
  wsDisc.addRow({});
  const summaryRow = wsDisc.addRow({
    name: `TOTAL: ${profiles.length} complétés / ${notCompleted} non complétés / ${totalUsers} inscrits`,
  });
  summaryRow.font = { bold: true, italic: true };

  console.log(`   ✅ ${profiles.length} surveys de découverte exportés\n`);

  // ══════════════════════════════════════════════════════════════════════════
  // FEUILLE 2 — ADN INVESTISSEUR (onboarding questionnaire)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('🧬 Export du questionnaire ADN Investisseur...');

  const investorProfiles = await prisma.investorProfile.findMany({
    select: {
      user_id: true,
      onboarding_completed: true,
      onboarding_date: true,
      quiz_score: true,
      risk_profile: true,
      investment_horizon: true,
      favorite_sectors: true,
      investment_style: true,
      monthly_investment: true,
      investment_goals: true,
      experience_level: true,
      preferred_analysis: true,
      trading_frequency: true,
      life_goal: true,
      income_source: true,
      monthly_budget: true,
      investor_score: true,
      score_breakdown: true,
      disclaimer_accepted_at: true,
      created_at: true,
      updated_at: true,
      user: {
        select: {
          name: true,
          lastname: true,
          email: true,
          subscriptionTier: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const wsADN = workbook.addWorksheet('ADN Investisseur');
  wsADN.columns = [
    { header: 'Prénom', key: 'name', width: 18 },
    { header: 'Nom', key: 'lastname', width: 18 },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Abonnement', key: 'subscription', width: 14 },
    { header: 'Onboarding complété', key: 'onboarding_completed', width: 20 },
    { header: 'Date onboarding', key: 'onboarding_date', width: 20 },
    { header: 'Score Quiz', key: 'quiz_score', width: 12 },
    { header: 'Score IA Investisseur', key: 'investor_score', width: 20 },
    { header: 'Profil de risque', key: 'risk_profile', width: 18 },
    { header: 'Horizon investissement', key: 'investment_horizon', width: 22 },
    { header: 'Secteurs favoris', key: 'favorite_sectors', width: 35 },
    { header: 'Style investissement', key: 'investment_style', width: 22 },
    { header: 'Investissement mensuel (FCFA)', key: 'monthly_investment', width: 28 },
    { header: 'Objectifs', key: 'investment_goals', width: 40 },
    { header: "Niveau d'expérience", key: 'experience_level', width: 20 },
    { header: "Analyses préférées", key: 'preferred_analysis', width: 30 },
    { header: 'Fréquence trading', key: 'trading_frequency', width: 20 },
    { header: 'Objectif de vie', key: 'life_goal', width: 20 },
    { header: 'Source de revenus', key: 'income_source', width: 20 },
    { header: 'Budget mensuel (FCFA)', key: 'monthly_budget', width: 22 },
    { header: 'Disclaimer accepté le', key: 'disclaimer_accepted_at', width: 22 },
    { header: 'Créé le', key: 'created_at', width: 20 },
    { header: 'Mis à jour le', key: 'updated_at', width: 20 },
  ];

  for (const ip of investorProfiles) {
    wsADN.addRow({
      name: ip.user.name,
      lastname: ip.user.lastname,
      email: ip.user.email,
      subscription: ip.user.subscriptionTier,
      onboarding_completed: ip.onboarding_completed ? 'Oui' : 'Non',
      onboarding_date: ip.onboarding_date,
      quiz_score: ip.quiz_score,
      investor_score: ip.investor_score,
      risk_profile: ip.risk_profile ?? '',
      investment_horizon: ip.investment_horizon ?? '',
      favorite_sectors: ip.favorite_sectors.join(', '),
      investment_style: ip.investment_style ?? '',
      monthly_investment: ip.monthly_investment,
      investment_goals: ip.investment_goals.join(', '),
      experience_level: ip.experience_level ?? '',
      preferred_analysis: ip.preferred_analysis.join(', '),
      trading_frequency: ip.trading_frequency ?? '',
      life_goal: ip.life_goal ?? '',
      income_source: ip.income_source ?? '',
      monthly_budget: ip.monthly_budget,
      disclaimer_accepted_at: ip.disclaimer_accepted_at,
      created_at: ip.created_at,
      updated_at: ip.updated_at,
    });
  }

  styleHeader(wsADN, 'FF7F77DD'); // violet AfriBourse

  // Format monétaire
  wsADN.getColumn('monthly_investment').numFmt = '#,##0 FCFA';
  wsADN.getColumn('monthly_budget').numFmt = '#,##0 FCFA';

  const completedOnboarding = investorProfiles.filter(p => p.onboarding_completed).length;
  wsADN.addRow({});
  const summaryADN = wsADN.addRow({
    name: `TOTAL: ${investorProfiles.length} profils / ${completedOnboarding} onboarding complétés`,
  });
  summaryADN.font = { bold: true, italic: true };

  console.log(`   ✅ ${investorProfiles.length} profils investisseur exportés\n`);

  // ══════════════════════════════════════════════════════════════════════════
  // FEUILLE 3 — DISTRIBUTION DES PROFILS (synthèse)
  // ══════════════════════════════════════════════════════════════════════════
  console.log('📈 Génération de la synthèse...');

  const wsStats = workbook.addWorksheet('Synthèse');
  wsStats.columns = [
    { header: 'Catégorie', key: 'category', width: 30 },
    { header: 'Valeur', key: 'value', width: 20 },
    { header: 'Nombre', key: 'count', width: 14 },
    { header: '% du total', key: 'pct', width: 14 },
  ];
  styleHeader(wsStats, 'FF378ADD'); // bleu AfriBourse

  const total = await prisma.user.count();

  // Survey découverte — distribution profils
  const profileDist: Record<string, number> = {};
  for (const p of profiles) {
    const survey = p.discovery_survey as Record<string, string> | null;
    const pt = survey?.profile_type ?? 'inconnu';
    profileDist[pt] = (profileDist[pt] ?? 0) + 1;
  }

  wsStats.addRow({ category: '── Survey Découverte ──', value: '', count: '', pct: '' });
  wsStats.lastRow!.font = { bold: true };

  wsStats.addRow({ category: 'Utilisateurs inscrits', value: '', count: total, pct: '100%' });
  wsStats.addRow({ category: 'Survey complété', value: 'Oui', count: profiles.length, pct: `${((profiles.length / total) * 100).toFixed(1)}%` });
  wsStats.addRow({ category: 'Survey complété', value: 'Non', count: total - profiles.length, pct: `${(((total - profiles.length) / total) * 100).toFixed(1)}%` });

  wsStats.addRow({});
  wsStats.addRow({ category: 'Distribution des profils', value: '', count: '', pct: '' });
  wsStats.lastRow!.font = { bold: true };

  for (const [pt, cnt] of Object.entries(profileDist)) {
    wsStats.addRow({
      category: 'Profil',
      value: PROFILE_TYPE_FR[pt] ?? pt,
      count: cnt,
      pct: `${((cnt / profiles.length) * 100).toFixed(1)}%`,
    });
  }

  // ADN Investisseur — distribution risque
  wsStats.addRow({});
  wsStats.addRow({ category: '── ADN Investisseur ──', value: '', count: '', pct: '' });
  wsStats.lastRow!.font = { bold: true };

  const riskDist: Record<string, number> = {};
  for (const ip of investorProfiles) {
    const rp = ip.risk_profile ?? 'Non renseigné';
    riskDist[rp] = (riskDist[rp] ?? 0) + 1;
  }
  for (const [rp, cnt] of Object.entries(riskDist)) {
    wsStats.addRow({
      category: 'Profil de risque',
      value: rp,
      count: cnt,
      pct: investorProfiles.length > 0 ? `${((cnt / investorProfiles.length) * 100).toFixed(1)}%` : '0%',
    });
  }

  const horizonDist: Record<string, number> = {};
  for (const ip of investorProfiles) {
    const h = ip.investment_horizon ?? 'Non renseigné';
    horizonDist[h] = (horizonDist[h] ?? 0) + 1;
  }
  wsStats.addRow({});
  for (const [h, cnt] of Object.entries(horizonDist)) {
    wsStats.addRow({
      category: "Horizon d'investissement",
      value: h,
      count: cnt,
      pct: investorProfiles.length > 0 ? `${((cnt / investorProfiles.length) * 100).toFixed(1)}%` : '0%',
    });
  }

  console.log('   ✅ Synthèse générée\n');

  // ══════════════════════════════════════════════════════════════════════════
  // SAUVEGARDE
  // ══════════════════════════════════════════════════════════════════════════
  await workbook.xlsx.writeFile(filePath);

  console.log('🎉 Export terminé avec succès!');
  console.log(`📁 Fichier: ${filePath}`);
  console.log('\n📊 Résumé:');
  console.log(`   - ${profiles.length} surveys de découverte`);
  console.log(`   - ${investorProfiles.length} profils ADN Investisseur`);
  console.log(`   - ${completedOnboarding} onboardings complets`);
}

exportSurveys()
  .then(() => {
    console.log('\n✅ Script terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
