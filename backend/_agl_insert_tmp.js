require('dotenv').config();
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const content = fs.readFileSync('C:/Users/HP/Downloads/agl_ci_dashboard_analytique_v1 (1).html', 'utf8');
prisma.newsArticle.create({
  data: {
    title: "AGL Côte d'Ivoire (SDSC) : le bénéfice qui cache une perte",
    slug: 'agl-ci-sdsc-benefice-qui-cache-une-perte',
    summary: "Le résultat net 2025 d'Africa Global Logistics CI reste positif (0,78 Md). Pourtant, lu étage par étage, le compte de résultat raconte une entreprise devenue déficitaire sur son métier (résultat d'exploitation -2,27 Md) — sauvée par une finance qui s'épuise, et une trésorerie gonflée par le crédit fournisseur (+82% de dettes d'exploitation). Lecture analytique en 7 mouvements : la cascade, les ratios certifiés, et la méthode pour lire des états financiers comme un pro.",
    content, category: 'analyse', tickers: ['SDSC'],
    author: 'AfriBourse Research', source: 'AfriBourse Research',
    is_featured: false, published_at: new Date(),
  }
}).then(a => { console.log('OK|' + a.id + '|' + a.slug + '|' + a.tickers); process.exit(0); })
  .catch(e => { console.error('ERR:', (e.message || String(e)).split('\n').filter(Boolean).slice(-1)[0]); process.exit(1); });
