/// <reference types="node" />
// backend/scripts/seedStockDetails.ts
// Script pour insérer des données de test pour la page Stock Details

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding des données Stock Details...\n');

  // 1. Créer des données d'historique pour quelques actions
  const stocks = ['SLBC', 'SNTS', 'SGBC', 'BOAM'];
  const today = new Date();

  for (const ticker of stocks) {
    console.log(`📊 Création de l'historique pour ${ticker}...`);

    // Vérifier si le stock existe
    const stock = await prisma.stock.findUnique({ where: { symbol: ticker } });
    if (!stock) {
      console.log(`⚠️  Stock ${ticker} non trouvé, passage au suivant...`);
      continue;
    }

    // Générer 365 jours d'historique
    const basePrice = stock.current_price;
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Simuler des variations aléatoires
      const randomChange = (Math.random() - 0.5) * 0.05; // +/- 5%
      const open = basePrice * (1 + randomChange);
      const close = open * (1 + (Math.random() - 0.5) * 0.03); // +/- 3%
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = Math.floor(Math.random() * 50000) + 10000;

      await prisma.stockHistory.upsert({
        where: {
          stock_ticker_date: {
            stock_ticker: ticker,
            date: date
          }
        },
        update: {},
        create: {
          stockId: stock.id,
          stock_ticker: ticker,
          date: date,
          open,
          high,
          low,
          close,
          volume
        }
      });
    }

    console.log(`  ✅ ${ticker}: 365 jours d'historique créés`);
  }

  console.log('\n');

  // 2. Créer des données fondamentales
  console.log('💰 Création des données fondamentales...\n');

  const fundamentalsData = [
    {
      ticker: 'SLBC',
      data: {
        market_cap: 500_000_000_000,
        pe_ratio: 15.5,
        pb_ratio: 2.3,
        dividend_yield: 4.2,
        roe: 18.5,
        roa: 12.3,
        profit_margin: 15.0,
        debt_to_equity: 0.5,
        revenue: 150_000_000_000,
        net_income: 22_500_000_000,
        ebitda: 35_000_000_000,
        free_cash_flow: 18_000_000_000,
        shares_outstanding: 10_000_000,
        eps: 2250,
        book_value: 8_000_000_000
      }
    },
    {
      ticker: 'SNTS',
      data: {
        market_cap: 800_000_000_000,
        pe_ratio: 18.2,
        pb_ratio: 3.1,
        dividend_yield: 3.8,
        roe: 22.5,
        roa: 15.8,
        profit_margin: 18.5,
        debt_to_equity: 0.3,
        revenue: 220_000_000_000,
        net_income: 40_700_000_000,
        ebitda: 55_000_000_000,
        free_cash_flow: 32_000_000_000,
        shares_outstanding: 15_000_000,
        eps: 2713,
        book_value: 12_000_000_000
      }
    }
  ];

  for (const { ticker, data } of fundamentalsData) {
    const stock = await prisma.stock.findUnique({ where: { symbol: ticker } });
    if (!stock) {
      console.log(`⚠️  Stock ${ticker} non trouvé pour les fondamentaux`);
      continue;
    }

    await prisma.stockFundamental.upsert({
      where: { stock_ticker: ticker },
      update: data,
      create: {
        stockId: stock.id,
        stock_ticker: ticker,
        ...data
      }
    });

    console.log(`  ✅ ${ticker}: Données fondamentales créées`);
  }

  console.log('\n');

  // 3. Créer des informations sur les compagnies
  console.log('🏢 Création des informations compagnies...\n');

  const companyData = [
    {
      ticker: 'SLBC',
      info: {
        description: "SICABLE-CI (Société Ivoirienne de Cables) est une entreprise leader dans la fabrication et la distribution de câbles électriques en Côte d'Ivoire et dans la sous-région. Depuis sa création, l'entreprise s'est imposée comme un acteur majeur du secteur de l'électrification.",
        website: 'https://www.sicable-ci.com',
        employees: 850,
        founded_year: 1975,
        headquarters: 'Abidjan, Côte d\'Ivoire',
        ceo: 'Jean Koffi Kacou',
        industry: 'Distribution électrique'
      }
    },
    {
      ticker: 'SNTS',
      info: {
        description: "SONATEL Sénégal est l'opérateur historique de télécommunications du Sénégal. L'entreprise offre une gamme complète de services de téléphonie mobile, fixe, internet et data, et est un pilier du développement numérique en Afrique de l'Ouest.",
        website: 'https://www.sonatel.sn',
        employees: 1250,
        founded_year: 1985,
        headquarters: 'Dakar, Sénégal',
        ceo: 'Sékou Dramé',
        industry: 'Télécommunications'
      }
    },
    {
      ticker: 'SGBC',
      info: {
        description: "Société Générale Côte d'Ivoire est une filiale du groupe Société Générale, l'une des principales banques de la zone UEMOA. Elle offre une gamme complète de produits et services bancaires aux particuliers, professionnels et entreprises.",
        website: 'https://www.societegenerale.ci',
        employees: 620,
        founded_year: 1962,
        headquarters: 'Abidjan, Côte d\'Ivoire',
        ceo: 'Alain N\'Guessan',
        industry: 'Banque et Finance'
      }
    }
  ];

  for (const { ticker, info } of companyData) {
    await prisma.companyInfo.upsert({
      where: { stock_ticker: ticker },
      update: info,
      create: {
        stock_ticker: ticker,
        ...info
      }
    });

    console.log(`  ✅ ${ticker}: Informations compagnie créées`);
  }

  console.log('\n');

  // 4. Créer des actualités
  console.log('📰 Création des actualités...\n');

  const newsData = [
    {
      ticker: 'SLBC',
      articles: [
        {
          title: 'SICABLE-CI annonce des résultats record pour le T3 2024',
          summary: 'La société affiche une croissance de 15% de son chiffre d\'affaires, portée par une forte demande dans le secteur de la construction.',
          source: 'Agence Ecofin',
          url: 'https://www.agenceecofin.com',
          published_at: new Date('2024-11-15')
        },
        {
          title: 'Nouveau partenariat stratégique avec Orange Energie',
          summary: 'SICABLE-CI signe un contrat majeur pour la fourniture de câbles électriques dans le cadre du projet d\'électrification rurale.',
          source: 'Jeune Afrique',
          url: 'https://www.jeuneafrique.com',
          published_at: new Date('2024-11-10')
        }
      ]
    },
    {
      ticker: 'SNTS',
      articles: [
        {
          title: 'SONATEL lance la 5G dans 5 nouvelles villes',
          summary: 'Le déploiement de la 5G se poursuit avec l\'activation du réseau à Thiès, Saint-Louis, Kaolack, Ziguinchor et Tambacounda.',
          source: 'Le Soleil',
          url: 'https://www.lesoleil.sn',
          published_at: new Date('2024-11-12')
        },
        {
          title: 'Dividende en hausse de 8% pour les actionnaires',
          summary: 'Le conseil d\'administration propose une augmentation du dividende à 2500 FCFA par action pour l\'exercice 2024.',
          source: 'Agence Ecofin',
          url: 'https://www.agenceecofin.com',
          published_at: new Date('2024-11-08')
        }
      ]
    }
  ];

  for (const { ticker, articles } of newsData) {
    for (const article of articles) {
      await prisma.stockNews.create({
        data: {
          stock_ticker: ticker,
          ...article
        }
      });
    }

    console.log(`  ✅ ${ticker}: ${articles.length} actualités créées`);
  }

  console.log('\n✅ Seeding terminé avec succès!\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
