# 📋 TODO - Stock Details avec Vraies Données

Ce document liste **toutes les tâches restantes** pour que la page Stock Details fonctionne avec de vraies données au lieu de données de test.

---

## ✅ Déjà Implémenté (Fonctionnel)

- ✅ Modèles de base de données (Prisma schema)
- ✅ Routes API backend complètes
- ✅ Services backend fonctionnels
- ✅ Composants frontend React
- ✅ Hooks React Query avec cache
- ✅ Page StockDetailPageEnhanced intégrée
- ✅ Documentation complète
- ✅ Script de seeding pour données de test

---

## 🔴 PRIORITÉ CRITIQUE - Pour Production

### 1. 📊 Scraping des Données Historiques

**Objectif** : Récupérer l'historique de prix quotidien depuis la BRVM

**Fichier à créer** : `backend/jobs/scrapeStockHistory.job.ts`

**Tâches** :
- [ ] Analyser la structure HTML de la page historique BRVM
- [ ] Créer un scraper pour extraire les données OHLCV (Open, High, Low, Close, Volume)
- [ ] Implémenter la logique de parsing et validation
- [ ] Sauvegarder dans la table `stock_history` via Prisma
- [ ] Gérer les doublons (upsert sur `stock_ticker` + `date`)
- [ ] Planifier l'exécution quotidienne (ex: tous les jours à 18h30 après clôture)

**Technologies** :
```typescript
import * as cheerio from 'cheerio';
import axios from 'axios';
import cron from 'node-cron';

// Exemple de structure
async function scrapeStockHistory(ticker: string, startDate: Date, endDate: Date) {
  const url = `https://www.brvm.org/...`; // URL à déterminer
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // Parser les données
  const historyData = [];
  $('table tr').each((i, row) => {
    // Extraire date, open, high, low, close, volume
  });

  // Sauvegarder dans DB
  for (const data of historyData) {
    await prisma.stockHistory.upsert({
      where: { stock_ticker_date: { stock_ticker: ticker, date: data.date } },
      update: { ...data },
      create: { ...data, stockId: stock.id }
    });
  }
}

// Planifier: tous les jours à 18:30
cron.schedule('30 18 * * *', async () => {
  // Scraper l'historique du jour pour toutes les actions
});
```

**Endpoints BRVM à investiguer** :
- Page historique BRVM : https://www.brvm.org/fr/cours-actions
- API si disponible
- Alternative : Écofin, Bloomberg, Yahoo Finance

**Estimation** : 2-3 jours de développement

---

### 2. 💰 Scraping des Données Fondamentales

**Objectif** : Récupérer les ratios financiers et données fondamentales

**Fichier à créer** : `backend/jobs/scrapeFundamentals.job.ts`

**Tâches** :
- [ ] Identifier les sources de données fondamentales :
  - [ ] Rapports annuels des entreprises (PDFs sur sites web)
  - [ ] BRVM (si disponible)
  - [ ] Agence Écofin
  - [ ] Sites web des entreprises cotées
- [ ] Créer un scraper pour chaque source
- [ ] Parser et normaliser les données (P/E, ROE, ROA, etc.)
- [ ] Valider et convertir les montants (millions, milliards)
- [ ] Sauvegarder dans `stock_fundamentals` et `company_info`
- [ ] Planifier l'exécution hebdomadaire (ex: chaque dimanche)

**Données à collecter** :

**Pour StockFundamental** :
```typescript
{
  market_cap: number,        // Capitalisation boursière
  pe_ratio: number,          // Price to Earnings
  pb_ratio: number,          // Price to Book
  dividend_yield: number,    // Rendement dividende (%)
  roe: number,              // Return on Equity (%)
  roa: number,              // Return on Assets (%)
  profit_margin: number,     // Marge bénéficiaire (%)
  debt_to_equity: number,    // Dette / Capitaux propres
  revenue: number,           // Chiffre d'affaires
  net_income: number,        // Bénéfice net
  ebitda: number,           // EBITDA
  free_cash_flow: number,   // Free Cash Flow
  shares_outstanding: number, // Actions en circulation
  eps: number               // Bénéfice par action
}
```

**Pour CompanyInfo** :
```typescript
{
  description: string,       // Description de l'entreprise
  website: string,          // Site web officiel
  employees: number,        // Nombre d'employés
  founded_year: number,     // Année de création
  headquarters: string,     // Siège social
  ceo: string,             // PDG actuel
  industry: string         // Industrie/secteur
}
```

**Sources recommandées** :
1. **Sites web des entreprises** (à scraper manuellement d'abord) :
   - SLBC : https://www.sicable-ci.com
   - SNTS : https://www.sonatel.sn
   - SGBC : https://www.societegenerale.ci
   - etc.

2. **Agence Écofin** (articles financiers) :
   - https://www.agenceecofin.com

3. **BRVM** (si données disponibles) :
   - https://www.brvm.org

**Planification** :
```typescript
// Tous les dimanches à 10h
cron.schedule('0 10 * * 0', async () => {
  await scrapeFundamentals();
});
```

**Estimation** : 3-5 jours (beaucoup de sources différentes)

---

### 3. 📰 Scraping des Actualités

**Objectif** : Récupérer automatiquement les actualités liées aux actions

**Fichier à créer** : `backend/jobs/scrapeStockNews.job.ts`

**Tâches** :
- [ ] Identifier les sources d'actualités fiables :
  - [ ] Agence Écofin (principale source)
  - [ ] Jeune Afrique (section finance)
  - [ ] Le Soleil (Sénégal)
  - [ ] Fraternité Matin (Côte d'Ivoire)
  - [ ] Sites des bourses (BRVM)
- [ ] Créer des scrapers pour chaque source
- [ ] Implémenter la détection automatique du ticker dans l'article
- [ ] Extraire : titre, résumé, source, URL, date de publication
- [ ] Éviter les doublons (vérifier URL ou hash du titre)
- [ ] Sauvegarder dans `stock_news`
- [ ] Planifier l'exécution toutes les 2 heures (actualités fréquentes)

**Exemple de scraper Écofin** :
```typescript
async function scrapeEcofinNews() {
  const url = 'https://www.agenceecofin.com/secteur-financier';
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const articles = [];
  $('.article-item').each((i, el) => {
    const title = $(el).find('h2').text().trim();
    const url = $(el).find('a').attr('href');
    const summary = $(el).find('.summary').text().trim();
    const date = $(el).find('.date').text().trim();

    // Détecter le ticker dans le titre
    const tickers = detectTickers(title + ' ' + summary);

    for (const ticker of tickers) {
      articles.push({
        stock_ticker: ticker,
        title,
        summary,
        source: 'Agence Ecofin',
        url,
        published_at: parseDate(date)
      });
    }
  });

  return articles;
}

function detectTickers(text: string): string[] {
  const knownTickers = ['SLBC', 'SNTS', 'SGBC', 'BOAM', ...];
  const found = [];

  for (const ticker of knownTickers) {
    if (text.includes(ticker) || text.includes(getCompanyName(ticker))) {
      found.push(ticker);
    }
  }

  return found;
}
```

**Planification** :
```typescript
// Toutes les 2 heures
cron.schedule('0 */2 * * *', async () => {
  await scrapeAllNews();
});
```

**Estimation** : 2-3 jours

---

### 4. 🔧 Configuration des Jobs Cron

**Objectif** : Automatiser l'exécution des scrapers

**Fichier à créer** : `backend/jobs/scheduler.ts`

**Tâches** :
- [ ] Installer `node-cron` : `npm install node-cron @types/node-cron`
- [ ] Créer un scheduler central
- [ ] Configurer les horaires optimaux :
  - Historique : après clôture BRVM (18h30 GMT)
  - Actualités : toutes les 2h
  - Fondamentaux : une fois par semaine (dimanche)
- [ ] Ajouter des logs pour monitoring
- [ ] Gérer les erreurs et retry
- [ ] Créer un endpoint admin pour déclencher manuellement

```typescript
// backend/jobs/scheduler.ts
import cron from 'node-cron';
import { scrapeStockHistory } from './scrapeStockHistory.job';
import { scrapeFundamentals } from './scrapeFundamentals.job';
import { scrapeStockNews } from './scrapeStockNews.job';

export function startScheduler() {
  console.log('📅 Démarrage du scheduler...');

  // Historique quotidien - 18h30 GMT (après clôture BRVM)
  cron.schedule('30 18 * * 1-5', async () => {
    console.log('📊 Scraping historique quotidien...');
    try {
      await scrapeStockHistory();
      console.log('✅ Historique scraped');
    } catch (error) {
      console.error('❌ Erreur scraping historique:', error);
    }
  });

  // Actualités - toutes les 2 heures
  cron.schedule('0 */2 * * *', async () => {
    console.log('📰 Scraping actualités...');
    try {
      await scrapeStockNews();
      console.log('✅ Actualités scraped');
    } catch (error) {
      console.error('❌ Erreur scraping news:', error);
    }
  });

  // Fondamentaux - chaque dimanche à 10h
  cron.schedule('0 10 * * 0', async () => {
    console.log('💰 Scraping données fondamentales...');
    try {
      await scrapeFundamentals();
      console.log('✅ Fondamentaux scraped');
    } catch (error) {
      console.error('❌ Erreur scraping fondamentaux:', error);
    }
  });

  console.log('✅ Scheduler démarré avec succès');
}

// Dans server.ts
import { startScheduler } from './jobs/scheduler';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startScheduler(); // Démarrer les jobs
});
```

**Estimation** : 1 jour

---

## 🟡 PRIORITÉ MOYENNE - Améliorations

### 5. 📈 Indicateurs Techniques Avancés

**Objectif** : Ajouter RSI, MACD, Bandes de Bollinger au graphique

**Fichier à créer** : `afribourse/src/utils/technicalIndicators.ts`

**Tâches** :
- [ ] Implémenter le calcul du RSI (Relative Strength Index)
- [ ] Implémenter le calcul du MACD (Moving Average Convergence Divergence)
- [ ] Implémenter les Bandes de Bollinger
- [ ] Implémenter les Moyennes Mobiles (20, 50, 200 jours)
- [ ] Ajouter un toggle dans StockChart pour afficher/masquer ces indicateurs
- [ ] Créer des lignes supplémentaires dans Recharts

**Exemple RSI** :
```typescript
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsiValues: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    rsiValues.push(rsi);
  }

  return rsiValues;
}
```

**Estimation** : 2-3 jours

---

### 6. 📊 Comparaison avec l'indice BRVM

**Objectif** : Comparer la performance de l'action avec l'indice BRVM

**Tâches** :
- [ ] Scraper les valeurs quotidiennes de l'indice BRVM (déjà modèle `MarketIndex`)
- [ ] Créer une route API `/api/market-index/brvm/history`
- [ ] Ajouter un toggle dans le graphique "Comparer avec BRVM"
- [ ] Afficher 2 lignes sur le même graphique (normalisées en %)
- [ ] Calculer la performance relative (alpha, beta)

**Estimation** : 2 jours

---

### 7. 🎯 Support et Résistance Automatiques

**Objectif** : Calculer et afficher les niveaux de support et résistance

**Tâches** :
- [ ] Implémenter l'algorithme de détection des pivots
- [ ] Calculer les niveaux de support (plus bas locaux)
- [ ] Calculer les niveaux de résistance (plus hauts locaux)
- [ ] Afficher des lignes horizontales sur le graphique
- [ ] Ajouter des labels avec les prix

**Estimation** : 2 jours

---

## 🟢 PRIORITÉ BASSE - Nice to Have

### 8. 📋 Carnet d'Ordres (Order Book)

**Objectif** : Afficher les meilleurs ordres d'achat et de vente

**Conditions** : Nécessite que la BRVM expose ces données

**Tâches** :
- [ ] Vérifier si la BRVM fournit le carnet d'ordres
- [ ] Créer le modèle `OrderBook` dans Prisma
- [ ] Scraper ou récupérer via API
- [ ] Créer le composant `OrderBookDisplay.tsx`
- [ ] Afficher bid/ask spread

**Estimation** : 3 jours (si données disponibles)

---

### 9. 📅 Calendrier des Événements

**Objectif** : Afficher les événements importants (AG, résultats trimestriels, dividendes)

**Tâches** :
- [ ] Créer le modèle `StockEvent` dans Prisma
- [ ] Scraper les calendriers des entreprises
- [ ] Créer le composant `EventCalendar.tsx`
- [ ] Afficher dans l'onglet "Vue d'ensemble"

**Estimation** : 2-3 jours

---

### 10. 💹 Historique des Dividendes

**Objectif** : Afficher l'historique complet des dividendes versés

**Tâches** :
- [ ] Créer le modèle `DividendHistory` dans Prisma
- [ ] Scraper l'historique depuis les rapports annuels
- [ ] Créer le composant `DividendHistory.tsx`
- [ ] Afficher un graphique de l'évolution des dividendes

**Estimation** : 2 jours

---

## 🔧 Infrastructure & DevOps

### 11. 🐳 Dockerisation des Jobs

**Objectif** : Conteneuriser les jobs de scraping pour faciliter le déploiement

**Tâches** :
- [ ] Créer un `Dockerfile.jobs`
- [ ] Configurer les variables d'environnement
- [ ] Tester en local
- [ ] Déployer sur serveur (ou service cloud)

**Estimation** : 1 jour

---

### 12. 📊 Monitoring & Alertes

**Objectif** : Surveiller les jobs et être alerté en cas d'échec

**Tâches** :
- [ ] Installer un système de monitoring (ex: PM2, Winston logs)
- [ ] Configurer des alertes email/Slack en cas d'erreur
- [ ] Créer un dashboard admin pour voir l'état des jobs
- [ ] Logger les métriques : nombre d'actions scraped, erreurs, durée

**Estimation** : 2 jours

---

### 13. ⚡ Optimisation des Performances

**Objectif** : Améliorer les temps de réponse et réduire la charge serveur

**Tâches** :
- [ ] Ajouter un cache Redis pour les données fréquemment demandées
- [ ] Optimiser les requêtes Prisma (utiliser `select` au lieu de tout récupérer)
- [ ] Implémenter la pagination pour les actualités
- [ ] Lazy loading des onglets (charger seulement quand activé)
- [ ] Prefetching intelligent des données

**Estimation** : 2-3 jours

---

## 📝 Documentation & Tests

### 14. 🧪 Tests Automatisés

**Objectif** : Assurer la fiabilité du code

**Tâches** :
- [ ] Tests unitaires pour les services backend
- [ ] Tests d'intégration pour les routes API
- [ ] Tests des scrapers (avec mocks)
- [ ] Tests des composants React (React Testing Library)
- [ ] Tests E2E (Playwright ou Cypress)

**Estimation** : 5 jours

---

### 15. 📚 Documentation Technique

**Objectif** : Documenter pour la maintenance future

**Tâches** :
- [ ] Documenter chaque scraper (sources, structure HTML)
- [ ] Créer un guide de contribution
- [ ] Documenter l'architecture complète
- [ ] Créer un runbook pour le troubleshooting

**Estimation** : 2 jours

---

## 📊 Récapitulatif des Estimations

| Priorité | Tâche | Estimation | Statut |
|----------|-------|------------|--------|
| 🔴 **CRITIQUE** | Scraping Historique | 2-3 jours | ⏳ À faire |
| 🔴 **CRITIQUE** | Scraping Fondamentaux | 3-5 jours | ⏳ À faire |
| 🔴 **CRITIQUE** | Scraping Actualités | 2-3 jours | ⏳ À faire |
| 🔴 **CRITIQUE** | Configuration Jobs Cron | 1 jour | ⏳ À faire |
| 🟡 **MOYENNE** | Indicateurs Techniques | 2-3 jours | ⏳ À faire |
| 🟡 **MOYENNE** | Comparaison BRVM | 2 jours | ⏳ À faire |
| 🟡 **MOYENNE** | Support/Résistance | 2 jours | ⏳ À faire |
| 🟢 **BASSE** | Carnet d'Ordres | 3 jours | ⏳ À faire |
| 🟢 **BASSE** | Calendrier Événements | 2-3 jours | ⏳ À faire |
| 🟢 **BASSE** | Historique Dividendes | 2 jours | ⏳ À faire |
| 🔧 **INFRA** | Dockerisation | 1 jour | ⏳ À faire |
| 🔧 **INFRA** | Monitoring | 2 jours | ⏳ À faire |
| 🔧 **INFRA** | Optimisations | 2-3 jours | ⏳ À faire |
| 📝 **DOC** | Tests | 5 jours | ⏳ À faire |
| 📝 **DOC** | Documentation | 2 jours | ⏳ À faire |

**Total Priorité CRITIQUE** : ~10-15 jours
**Total Priorité MOYENNE** : ~6-8 jours
**Total Priorité BASSE** : ~7-8 jours
**Total Infrastructure** : ~5-7 jours
**Total Documentation** : ~7 jours

**TOTAL GÉNÉRAL** : ~35-45 jours (7-9 semaines)

---

## 🎯 Plan de Sprint Recommandé

### Sprint 1 (2 semaines) - MVP Production
- ✅ Scraping Historique
- ✅ Scraping Actualités
- ✅ Configuration Jobs Cron
- ✅ Tests de base
- **Objectif** : Page fonctionnelle avec données réelles

### Sprint 2 (2 semaines) - Fondamentaux & Optimisation
- ✅ Scraping Fondamentaux
- ✅ Optimisation des performances
- ✅ Monitoring de base
- **Objectif** : Données complètes et système stable

### Sprint 3 (2 semaines) - Analyse Avancée
- ✅ Indicateurs techniques
- ✅ Comparaison BRVM
- ✅ Support/Résistance
- **Objectif** : Outils d'analyse pro

### Sprint 4+ (Au besoin) - Features Avancées
- Carnet d'ordres
- Calendrier événements
- Historique dividendes
- Tests complets
- Documentation finale

---

## 🚀 Démarrer Immédiatement

Pour commencer dès maintenant avec les données de test :

```bash
# 1. Générer le client Prisma
cd backend && npx prisma generate

# 2. Appliquer les changements DB
npx prisma db push

# 3. Insérer des données de test
npx ts-node scripts/seedStockDetails.ts

# 4. Lancer l'application
npm run dev
```

Puis dans le frontend :
```bash
cd afribourse
npm run dev
```

Naviguez vers une action (ex: SLBC) pour voir la page en action avec les données de test !

---

## 📞 Support & Questions

Pour toute question sur l'implémentation :
1. Consultez `IMPLEMENTATION_STOCK_DETAILS.md` pour les détails techniques
2. Consultez `DEPLOIEMENT_STOCK_DETAILS.md` pour le déploiement
3. Consultez `PLAN_AMELIORATION_STOCK_DETAILS.md` pour le plan original

**Bon courage pour la suite ! 🚀**

---

**Créé le** : 19 Novembre 2024
**Dernière mise à jour** : 19 Novembre 2024
