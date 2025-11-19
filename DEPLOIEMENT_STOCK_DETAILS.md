# 🚀 Guide de Déploiement - Stock Details Amélioré

Ce guide vous accompagne pas à pas pour déployer les nouvelles fonctionnalités Stock Details.

---

## 📋 Prérequis

- ✅ Backend Node.js fonctionnel
- ✅ Frontend React fonctionnel
- ✅ Base de données MongoDB configurée
- ✅ Prisma Client installé
- ✅ React Query configuré dans le frontend

---

## 🔧 Étape 1 : Backend - Base de données

### 1.1 Générer le client Prisma

```bash
cd backend
npx prisma generate
```

### 1.2 Pousser les changements vers la base

**Option A : Développement (sans migrations)**
```bash
npx prisma db push
```

**Option B : Production (avec migrations)**
```bash
npx prisma migrate dev --name add_stock_details_features
```

### 1.3 Vérifier les nouveaux modèles

```bash
npx prisma studio
```

Vous devriez voir les nouveaux modèles :
- ✅ `StockHistory` (mis à jour)
- ✅ `StockFundamental` (mis à jour)
- ✅ `CompanyInfo` (nouveau)
- ✅ `StockNews` (nouveau)

---

## 📊 Étape 2 : Données de test

### 2.1 Exécuter le script de seeding

```bash
cd backend
npx ts-node scripts/seedStockDetails.ts
```

Ou si vous avez ajouté le script npm :
```bash
npm run seed:stock-details
```

### 2.2 Vérifier les données insérées

Dans Prisma Studio ou MongoDB Compass, vérifiez :
- `stock_history` : ~1460 documents (365 jours × 4 actions)
- `stock_fundamentals` : 2 documents (SLBC, SNTS)
- `company_info` : 3 documents (SLBC, SNTS, SGBC)
- `stock_news` : 4 documents

---

## 🖥️ Étape 3 : Backend - Compilation

### 3.1 Compiler le code TypeScript

```bash
cd backend
npm run build
# ou
npx tsc
```

### 3.2 Vérifier les fichiers compilés

Les nouveaux fichiers compilés devraient être dans `backend/dist/` :
- `dist/services/stock.service.prisma.js`
- `dist/controllers/stock.controller.js`
- `dist/routes/stock.routes.js`

### 3.3 Tester les nouvelles routes

Démarrez le serveur :
```bash
npm run dev
```

Testez les endpoints (avec Postman, curl ou navigateur) :

```bash
# Historique
curl http://localhost:5000/api/stocks/SLBC/history?period=1Y

# Fondamentaux
curl http://localhost:5000/api/stocks/SLBC/fundamentals

# Infos compagnie
curl http://localhost:5000/api/stocks/SLBC/company

# Actualités
curl http://localhost:5000/api/stocks/SLBC/news?limit=10
```

Réponses attendues :
- ✅ Code 200 avec données JSON
- ✅ Ou code 404 si données non disponibles (normal pour certaines actions)

---

## 🎨 Étape 4 : Frontend - Installation

### 4.1 Vérifier Recharts

```bash
cd afribourse
npm list recharts
```

Si non installé :
```bash
npm install recharts
```

### 4.2 Vérifier React Query

```bash
npm list @tanstack/react-query
```

Si non installé :
```bash
npm install @tanstack/react-query
```

---

## 🔌 Étape 5 : Frontend - Intégration

### 5.1 Mettre à jour le système de navigation

Dans votre composant principal (ex: `App.tsx` ou router) :

```typescript
import StockDetailPageEnhanced from './components/StockDetailPageEnhanced';

// Dans votre logique de navigation/routing
case 'stock-detail':
  return <StockDetailPageEnhanced stock={selectedStock} onNavigate={handleNavigate} />;
```

### 5.2 Option : Migration progressive

Si vous voulez tester d'abord, gardez les deux versions :

```typescript
import StockDetailPage from './components/StockDetailPage'; // Ancienne
import StockDetailPageEnhanced from './components/StockDetailPageEnhanced'; // Nouvelle

// Toggle pour basculer
const useEnhancedVersion = true;

return useEnhancedVersion
  ? <StockDetailPageEnhanced stock={selectedStock} onNavigate={handleNavigate} />
  : <StockDetailPage stock={selectedStock} onNavigate={handleNavigate} />;
```

---

## ✅ Étape 6 : Tests

### 6.1 Tests fonctionnels

Lancez le frontend :
```bash
cd afribourse
npm run dev
```

Naviguez vers une action (ex: SLBC) et vérifiez :

**Graphique** :
- ✅ Affiche l'historique de prix
- ✅ Les périodes (1M, 3M, 6M, 1A, Max) fonctionnent
- ✅ Le tooltip affiche toutes les données

**Onglets** :
- ✅ Tous les onglets sont cliquables
- ✅ Le contenu change selon l'onglet actif
- ✅ L'onglet actif est bien mis en évidence

**Vue d'ensemble** :
- ✅ Affiche les informations clés
- ✅ Affiche la description de l'entreprise
- ✅ Les liens vers le site web fonctionnent

**Fondamentaux** :
- ✅ Affiche tous les ratios financiers
- ✅ Les valeurs sont formatées correctement
- ✅ Message élégant si pas de données

**Actualités** :
- ✅ Affiche la liste des news
- ✅ Les liens externes fonctionnent
- ✅ Les dates sont bien formatées

**Panel d'ordre** :
- ✅ Reste fixe en scroll
- ✅ Le calcul du coût total fonctionne
- ✅ L'achat fonctionne toujours

### 6.2 Tests responsive

Testez sur différentes tailles d'écran :
- 📱 Mobile (375px)
- 📱 Tablet (768px)
- 💻 Desktop (1024px, 1440px)

Vérifiez :
- ✅ Le layout s'adapte
- ✅ Les onglets sont scrollables sur mobile
- ✅ Le graphique est lisible
- ✅ Le texte ne déborde pas

### 6.3 Tests de performance

Ouvrez les DevTools (F12) :

**Network** :
- ✅ Les requêtes API sont rapides (<500ms)
- ✅ Pas de requêtes en doublon (grâce au cache)
- ✅ Les images se chargent

**Performance** :
- ✅ Pas de lag lors du changement d'onglet
- ✅ Le graphique se render rapidement
- ✅ Le scroll est fluide

**Console** :
- ✅ Pas d'erreurs JavaScript
- ✅ Pas de warnings React

---

## 🐛 Résolution de problèmes courants

### Problème : "Cannot find module '@prisma/client'"

**Solution** :
```bash
cd backend
npx prisma generate
npm run build
```

### Problème : "404 Not Found" sur les routes API

**Vérifications** :
1. Le backend est bien démarré ?
2. Les routes sont bien importées dans le router principal ?
3. L'URL de base API est correcte dans `config/api.ts` ?

### Problème : Graphique vide

**Vérifications** :
1. Les données d'historique existent dans la DB ?
2. La route API `/stocks/:symbol/history` retourne des données ?
3. Vérifiez la console pour les erreurs React Query

### Problème : "StockChart is not defined"

**Solution** :
Vérifiez l'import dans `StockDetailPageEnhanced.tsx` :
```typescript
import { StockChart, StockTabs, ... } from './stock';
```

Et que le fichier `stock/index.ts` exporte bien tout :
```typescript
export { default as StockChart } from './StockChart';
```

### Problème : Recharts crash

**Solution** :
Vérifiez que les données du graphique sont valides :
- `data` doit être un array
- Chaque élément doit avoir les champs `date`, `close`, etc.
- Les valeurs doivent être des nombres, pas des strings

---

## 📝 Checklist finale de déploiement

### Backend
- [ ] Prisma client généré
- [ ] Migrations appliquées
- [ ] Nouveaux modèles créés dans la DB
- [ ] Données de test insérées
- [ ] Code TypeScript compilé
- [ ] Routes API testées et fonctionnelles
- [ ] Pas d'erreurs dans les logs serveur

### Frontend
- [ ] Recharts installé
- [ ] React Query configuré
- [ ] Tous les composants créés
- [ ] Hooks personnalisés créés
- [ ] Services API créés
- [ ] StockDetailPageEnhanced intégré
- [ ] Navigation fonctionne
- [ ] Pas d'erreurs dans la console

### Tests
- [ ] Graphique s'affiche et fonctionne
- [ ] Tous les onglets fonctionnent
- [ ] Données fondamentales s'affichent
- [ ] Actualités s'affichent
- [ ] Panel d'ordre fonctionne
- [ ] Responsive sur mobile/tablet/desktop
- [ ] Performance acceptable
- [ ] Pas d'erreurs en console

---

## 🎉 Après le déploiement

### Surveillance

Surveillez dans les premiers jours :
- Les erreurs 500 sur les nouvelles routes
- Les erreurs React dans Sentry (si configuré)
- La performance des requêtes (temps de réponse)
- Le feedback utilisateur

### Améliorations futures

Une fois stabilisé, vous pouvez ajouter :
- 📊 Indicateurs techniques avancés (RSI, MACD)
- 📈 Comparaison avec l'indice BRVM
- 📉 Support et résistance
- 📋 Carnet d'ordres
- 📅 Calendrier des événements
- 🔔 Système d'alertes de prix

### Optimisations

- Mettre en place le prefetching des données
- Ajouter la pagination pour les news
- Implémenter le lazy loading des onglets
- Optimiser les requêtes Prisma avec `select`

---

## 📞 Support

En cas de problème :
1. Consultez `IMPLEMENTATION_STOCK_DETAILS.md` pour les détails techniques
2. Relisez `PLAN_AMELIORATION_STOCK_DETAILS.md` pour le plan original
3. Vérifiez les logs backend et la console frontend
4. Testez les routes API directement avec curl/Postman

---

**Bonne chance pour le déploiement ! 🚀**

---

**Créé le** : 19 Novembre 2024
**Testé sur** : Node.js 18+, React 18, Prisma 6, MongoDB 6+
