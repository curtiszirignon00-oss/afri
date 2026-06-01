#!/usr/bin/env node
/**
 * scripts/generate-seo-pages.mjs
 *
 * Génère des pages HTML statiques légères pour chaque route publique.
 * Ces pages contiennent tous les meta tags + du vrai texte lisible par Google
 * SANS avoir besoin d'exécuter JavaScript.
 *
 * Le fichier HTML est dans dist/<route>/index.html après le build Vite.
 * Vite génère déjà dist/index.html (le SPA). Ce script REMPLACE ce fichier
 * pour les routes importantes par un HTML enrichi qui a le même JS mais avec
 * le bon <head> et un contenu texte visible dans un <noscript>.
 *
 * Usage : node scripts/generate-seo-pages.mjs  (après vite build)
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SITE_URL = 'https://africbourse.com';
const API_OG = 'https://afribourse-api.onrender.com/api/og/image/page';

const PAGES = [
  {
    path: '/',
    dir: '',
    slug: 'home',
    title: 'AfriBourse — BRVM : Cours des Actions, Simulateur & Formation',
    description: 'AfriBourse — la plateforme brvm pour suivre les cours des actions brvm, simuler votre portefeuille et apprendre à investir sur la Bourse Régionale des Valeurs Mobilières (UEMOA).',
    h1: 'Investissez sur la BRVM, la Bourse d\'Afrique de l\'Ouest',
    intro: 'AfriBourse est la plateforme d\'investissement dédiée à la BRVM (Bourse Régionale des Valeurs Mobilières). Simulateur de portefeuille gratuit, cours des actions brvm en temps réel, formations et analyses pour tous les investisseurs d\'Afrique de l\'Ouest (UEMOA).',
    keywords: 'brvm, brvm action, cours brvm, brvm bourse, brvm aujourd\'hui, brvm composite, action brvm, investir brvm, bourse afrique, UEMOA, AfriBourse',
  },
  {
    path: '/markets',
    dir: 'markets',
    slug: 'markets',
    title: 'Marchés BRVM — Cours des Actions en Temps Réel | AfriBourse',
    description: 'Cours en temps réel de toutes les actions BRVM. Consultez le cours de chaque action brvm, filtres par secteur, heatmap du marché BRVM et comparaison de valeurs cotées sur la Bourse Régionale des Valeurs Mobilières.',
    h1: 'Marchés BRVM — Cours des Actions',
    intro: 'Retrouvez le cours en temps réel de toutes les actions cotées sur la BRVM (Bourse Régionale des Valeurs Mobilières). Filtrez par secteur, comparez les valeurs, suivez les volumes et les variations quotidiennes. Données officielles BRVM pour les 8 pays de l\'UEMOA.',
    keywords: 'brvm, brvm action, cours brvm, action brvm, brvm bourse, brvm cours, brvm aujourd\'hui, brvm composite, cours actions brvm, bourse brvm',
  },
  {
    path: '/indices',
    dir: 'indices',
    slug: 'indices',
    title: 'Indices BRVM — BRVM Composite & BRVM 10 en Temps Réel | AfriBourse',
    description: 'BRVM Composite et BRVM 10 en temps réel. Suivez les indices brvm aujourd\'hui avec leurs graphiques historiques. La bourse BRVM d\'Afrique de l\'Ouest (UEMOA).',
    h1: 'Indices BRVM — BRVM Composite & BRVM 10',
    intro: 'Suivez les indices phares de la BRVM en temps réel : le BRVM Composite (toutes les actions) et le BRVM 10 (les 10 plus grandes capitalisations). Graphiques d\'évolution historique et données de performance du marché boursier d\'Afrique de l\'Ouest.',
    keywords: 'brvm, brvm composite, brvm 10, indice brvm, brvm composite aujourd\'hui, brvm 10 aujourd\'hui, cours brvm, bourse afrique ouest',
  },
  {
    path: '/learn',
    dir: 'learn',
    slug: 'learn',
    title: 'Formation BRVM Gratuite — 20 Modules d\'Investissement | AfriBourse',
    description: 'Apprenez à investir sur la BRVM avec 20 modules gratuits. Quiz, tuteur IA et certificats. Formation complète en investissement boursier pour l\'Afrique de l\'Ouest.',
    h1: 'Formation Investissement BRVM — Gratuite',
    intro: 'Apprenez à investir sur la BRVM avec notre formation structurée en 20 modules progressifs. De l\'introduction aux marchés financiers africains jusqu\'aux stratégies d\'investissement avancées. Quiz interactifs, tuteur IA et certification à la clé. 100% gratuit pour les modules de base.',
    keywords: 'brvm, formation brvm, apprendre brvm, investir brvm, brvm formation gratuite, cours brvm gratuit, comment investir brvm',
  },
  {
    path: '/news',
    dir: 'news',
    slug: 'news',
    title: 'Actualités BRVM & Marchés Financiers Afrique | AfriBourse',
    description: 'Toute l\'actualité boursière de la BRVM et de l\'UEMOA : résultats d\'entreprises, dividendes, analyses sectorielles et nouvelles macroéconomiques.',
    h1: 'Actualités Financières BRVM',
    intro: 'Suivez toute l\'actualité de la BRVM (Bourse Régionale des Valeurs Mobilières) : résultats semestriels et annuels des entreprises cotées, annonces de dividendes, analyses sectorielles, événements macroéconomiques de l\'UEMOA et informations sur les marchés financiers d\'Afrique de l\'Ouest.',
    keywords: 'brvm, brvm actualités, brvm news, brvm aujourd\'hui, actualités brvm, brvm dividende, résultats brvm, brvm marché',
  },
  {
    path: '/glossary',
    dir: 'glossary',
    slug: 'glossary',
    title: 'Glossaire BRVM — Termes Boursiers Expliqués | AfriBourse',
    description: 'Le dictionnaire des termes financiers de la BRVM : action, dividende, SGI, P/E ratio, capitalisation boursière et 15 autres concepts expliqués simplement.',
    h1: 'Glossaire de l\'Investisseur BRVM',
    intro: 'Comprenez tous les termes financiers de la BRVM grâce à notre glossaire complet. Action, dividende, SGI (Société de Gestion et d\'Intermédiation), BRVM Composite, P/E ratio, capitalisation boursière, volatilité, liquidité… Chaque terme est expliqué en français simple avec des exemples concrets tirés du marché BRVM.',
    keywords: 'brvm, brvm action définition, brvm glossaire, action brvm explication, brvm SGI, brvm dividende, brvm composite définition',
  },
  {
    path: '/about',
    dir: 'about',
    slug: 'about',
    title: 'À propos d\'AfriBourse — La Plateforme BRVM | AfriBourse',
    description: 'AfriBourse démocratise l\'investissement sur la BRVM pour les Africains francophones. Notre mission, notre équipe et notre impact sur l\'éducation financière.',
    h1: 'À propos d\'AfriBourse',
    intro: 'AfriBourse est la plateforme d\'éducation financière dédiée à la BRVM (Bourse Régionale des Valeurs Mobilières). Notre mission est de démocratiser l\'investissement boursier pour les 8 pays de l\'UEMOA. Simulateur de portefeuille, formations, cours en temps réel et communauté d\'investisseurs.',
    keywords: 'brvm, afribourse brvm, brvm plateforme, brvm investissement, afribourse, plateforme brvm, bourse afrique de l\'ouest',
  },
];

function buildHtml(page, spaHtml) {
  const ogImage = `${API_OG}/${page.slug}`;
  const canonical = `${SITE_URL}${page.path}`;

  // Remplace le <title> et les meta dans le HTML du SPA
  let html = spaHtml;

  const headInject = `
  <title>${page.title}</title>
  <meta name="description" content="${page.description}" />
  <meta name="keywords" content="${page.keywords}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="AfriBourse" />
  <meta property="og:title" content="${page.title}" />
  <meta property="og:description" content="${page.description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@AfriBourse" />
  <meta name="twitter:title" content="${page.title}" />
  <meta name="twitter:description" content="${page.description}" />
  <meta name="twitter:image" content="${ogImage}" />`;

  // Remplace le title existant et injecte les metas avant </head>
  html = html.replace(/<title>[^<]*<\/title>/, '');
  html = html.replace('</head>', `${headInject}\n</head>`);

  // Ajoute du contenu textuel visible pour Google dans un <noscript>
  // (les crawlers qui ne font pas de JS voient ce contenu)
  const noscript = `
<noscript>
  <div style="max-width:900px;margin:40px auto;padding:0 20px;font-family:sans-serif">
    <h1>${page.h1}</h1>
    <p>${page.intro}</p>
    <p>
      <a href="${SITE_URL}/">Accueil</a> |
      <a href="${SITE_URL}/markets">Marchés BRVM</a> |
      <a href="${SITE_URL}/learn">Formation</a> |
      <a href="${SITE_URL}/news">Actualités</a> |
      <a href="${SITE_URL}/indices">Indices BRVM</a> |
      <a href="${SITE_URL}/glossary">Glossaire</a>
    </p>
  </div>
</noscript>`;

  html = html.replace('<div id="root"></div>', `<div id="root"></div>${noscript}`);

  return html;
}

async function main() {
  const spaIndexPath = join(DIST, 'index.html');

  if (!existsSync(spaIndexPath)) {
    console.error('[seo-pages] dist/index.html introuvable — lancez vite build d\'abord.');
    process.exit(1);
  }

  const spaHtml = readFileSync(spaIndexPath, 'utf8');
  let count = 0;

  for (const page of PAGES) {
    const dir = page.dir ? join(DIST, page.dir) : DIST;
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const outputPath = join(dir, 'index.html');
    const html = buildHtml(page, spaHtml);
    writeFileSync(outputPath, html, 'utf8');
    count++;
    console.log(`[seo-pages] ✓ dist/${page.dir || ''}/index.html`);
  }

  console.log(`[seo-pages] ${count} pages statiques générées avec meta tags et contenu textuel.`);
}

main();
