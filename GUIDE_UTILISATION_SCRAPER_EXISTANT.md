# 📊 Guide d'utilisation - Intégration Scraper Existant

## ✅ Ce qui a été fait

J'ai adapté votre scraper existant pour qu'il alimente aussi l'historique boursier nécessaire à la nouvelle page Stock Details Enhanced.

---

## 🔄 Changements apportés

### 1. **Nouveau service** : `stockHistory.service.ts`

**Fichier** : `backend/src/services/stockHistory.service.ts`

**Fonctions** :
- `saveCurrentDayHistory()` - Sauvegarde l'historique du jour à partir du scraper existant
- `saveStockHistory()` - Sauvegarde manuel pour une action spécifique
- `getStockHistoryData()` - Récupère l'historique (wrapper)

**Utilisation** : Réutilise directement votre `scrapeStock()` existant !

### 2. **Job mis à jour** : `scraping.job.ts`

**Modification** : Le job existant qui tourne toutes les 2 heures sauvegarde maintenant AUSSI l'historique

**Comportement** :
- Toutes les 2h : Met à jour les prix actuels (comme avant)
- À 18h uniquement : Sauvegarde aussi dans `StockHistory` (nouveau)

**Pourquoi 18h ?** : Après la clôture de la BRVM (18h GMT)

### 3. **Nouveau script** : `backfillStockHistory.ts`

**Fichier** : `backend/scripts/backfillStockHistory.ts`

**But** : Créer un historique de 365 jours avec des données simulées (variations légères autour du prix actuel)

**Utilisation** : Pour avoir un graphique fonctionnel immédiatement

---

## 🚀 Comment utiliser

### Option 1 : Backfill immédiat (Recommandé pour tester)

**Pour avoir un graphique qui fonctionne MAINTENANT** :

```bash
cd backend

# 1. Générer le client Prisma (si pas déjà fait)
npx prisma generate

# 2. Appliquer les changements DB (si pas déjà fait)
npx prisma db push

# 3. Créer 365 jours d'historique simulé
npx ts-node scripts/backfillStockHistory.ts

# Ou spécifier le nombre de jours
npx ts-node scripts/backfillStockHistory.ts 90  # 3 mois
npx ts-node scripts/backfillStockHistory.ts 30  # 1 mois
```

**Résultat attendu** :
```
📊 Démarrage du backfill de l'historique (365 jours)...
📈 50 actions trouvées

⏳ Traitement de SLBC (SICABLE-CI)...
  ✅ 365 jours créés pour SLBC
⏳ Traitement de SNTS (SONATEL)...
  ✅ 365 jours créés pour SNTS
...

🎉 Backfill terminé !
  📊 Total: 18250 entrées créées
  📅 Période: 365 jours
  📈 Actions: 50
```

**Temps d'exécution** : ~2-5 minutes pour 50 actions × 365 jours

### Option 2 : Attendre le job automatique

**Le job existant va maintenant sauvegarder l'historique automatiquement** :

1. Votre job tourne toutes les 2h (déjà configuré)
2. À 18h, il sauvegarde aussi l'historique du jour
3. Après 30 jours, vous aurez 30 jours d'historique réel
4. Après 365 jours, graphique complet !

**Patience requise** : 1 an pour avoir un graphique 1 an complet

### Option 3 : Sauvegarder manuellement l'historique d'aujourd'hui

**Pour forcer la sauvegarde maintenant** :

```typescript
// Dans votre code backend ou un script
import { saveCurrentDayHistory } from './services/stockHistory.service';

await saveCurrentDayHistory();
```

Ou créez un script rapide :

```bash
# backend/scripts/saveHistoryNow.ts
import { saveCurrentDayHistory } from '../services/stockHistory.service';

saveCurrentDayHistory()
  .then(() => console.log('✅ Historique sauvegardé'))
  .catch(err => console.error('❌ Erreur:', err))
  .finally(() => process.exit());
```

Puis exécutez :
```bash
npx ts-node scripts/saveHistoryNow.ts
```

---

## 📊 Vérifier que ça fonctionne

### 1. Vérifier dans la base de données

**Avec Prisma Studio** :
```bash
cd backend
npx prisma studio
```
- Ouvrir le modèle `StockHistory`
- Vous devriez voir des entrées avec des dates

**Avec une requête directe** :
```typescript
// Compter les entrées
await prisma.stockHistory.count();

// Voir quelques entrées pour SLBC
await prisma.stockHistory.findMany({
  where: { stock_ticker: 'SLBC' },
  orderBy: { date: 'desc' },
  take: 10
});
```

### 2. Tester l'API

**Démarrer le backend** :
```bash
cd backend
npm run dev
```

**Tester la route** :
```bash
curl http://localhost:5000/api/stocks/SLBC/history?period=1Y
```

**Résultat attendu** :
```json
{
  "symbol": "SLBC",
  "period": "1Y",
  "data": [
    {
      "id": "...",
      "stock_ticker": "SLBC",
      "date": "2024-01-01T00:00:00.000Z",
      "open": 28100,
      "high": 28500,
      "low": 27800,
      "close": 28200,
      "volume": 12000
    },
    // ... 364 autres jours
  ]
}
```

### 3. Vérifier dans le frontend

1. Démarrer le frontend : `cd afribourse && npm run dev`
2. Naviguer vers une action (ex: SLBC)
3. Vous devriez voir :
   - ✅ Le graphique affiché avec les données
   - ✅ Les boutons de période (1M, 3M, 6M, 1A, Max) fonctionnels
   - ✅ Le tooltip avec OHLCV au survol

---

## 🔧 Configuration avancée

### Changer l'heure de sauvegarde de l'historique

**Éditer** : `backend/src/jobs/scraping.job.ts`

```typescript
// Ligne 23 : Changer 18 pour une autre heure
if (currentHour === 20) { // Sauvegarder à 20h au lieu de 18h
    await saveCurrentDayHistory();
}
```

### Sauvegarder l'historique à chaque scraping

**Si vous voulez sauvegarder l'historique toutes les 2h** (pas recommandé, ça va créer beaucoup de doublons) :

```typescript
// Supprimer la condition d'heure
await saveStocks(stocks);
await saveIndices(indices);
await saveCurrentDayHistory(); // Toujours sauvegarder
```

### Ajuster les variations dans le backfill

**Éditer** : `backend/scripts/backfillStockHistory.ts`

```typescript
// Ligne 59 : Changer le max de variation
const maxVariation = 0.05; // 5% au lieu de 2%

// Ligne 66-67 : Changer les variations journalières
const openVariation = (Math.random() - 0.5) * 0.03; // 3% au lieu de 1%
const closeVariation = (Math.random() - 0.5) * 0.03;
```

---

## 📈 Évolution vers des vraies données

### Phase actuelle : Données simulées

**Avantages** :
- ✅ Graphique fonctionne immédiatement
- ✅ Permet de tester toute la page
- ✅ Utilisateurs peuvent voir le design

**Inconvénients** :
- ⚠️ Données pas réelles
- ⚠️ Variations aléatoires pas crédibles

### Phase future : Vraies données historiques

**Quand vous aurez accès aux vraies données BRVM** :

1. **Source possible** : API BRVM officielle (si disponible)
2. **Alternative** : Scraper les pages d'historique BRVM
3. **Alternative 2** : Utiliser un fournisseur tiers (Bloomberg, Yahoo Finance)

**Pour remplacer les données simulées** :

```typescript
// Nouveau script : scrapeRealHistory.ts
import axios from 'axios';

async function scrapeRealHistory(symbol: string, startDate: Date, endDate: Date) {
  // URL hypothétique BRVM
  const url = `https://www.brvm.org/api/history/${symbol}?from=${startDate}&to=${endDate}`;

  const response = await axios.get(url);
  const realData = response.data;

  // Sauvegarder les vraies données
  for (const day of realData) {
    await saveStockHistory(symbol, day.date, {
      open: day.open,
      high: day.high,
      low: day.low,
      close: day.close,
      volume: day.volume
    });
  }
}
```

---

## 🐛 Résolution de problèmes

### Problème : "Cannot find module stockHistory.service"

**Solution** :
```bash
cd backend
npm run build
# Ou
npx tsc
```

### Problème : Le backfill ne crée rien

**Vérifications** :
1. Les actions existent dans la table `stocks` ?
   ```bash
   npx prisma studio
   # Vérifier la table stocks
   ```

2. Les actions ont un `current_price` ?
   ```sql
   SELECT symbol, current_price FROM stocks WHERE current_price IS NULL;
   ```

3. Lancer le scraper d'abord :
   ```bash
   # Assurer que les prix actuels sont à jour
   cd backend
   # Déclencher le scraper manuellement (si vous avez un endpoint)
   ```

### Problème : "Unique constraint failed"

**Cause** : Vous essayez de créer deux fois le même jour

**Solution** : C'est normal ! Le script utilise `upsert` donc ça devrait passer. Si erreur persiste :
```bash
# Supprimer l'historique et recommencer
npx prisma studio
# Supprimer toutes les entrées de stock_history
# Relancer le backfill
```

### Problème : Le graphique est toujours vide

**Vérifications** :

1. L'API retourne des données ?
   ```bash
   curl http://localhost:5000/api/stocks/SLBC/history?period=1Y
   ```

2. Le frontend fait bien la requête ?
   - Ouvrir DevTools (F12)
   - Onglet Network
   - Filtrer par "history"
   - Voir la réponse

3. React Query a bien les données ?
   - Installer React Query DevTools
   - Voir l'état du cache `['stock-history', 'SLBC', '1Y']`

---

## ✅ Checklist de mise en prod

- [ ] Prisma client généré (`npx prisma generate`)
- [ ] Changements DB appliqués (`npx prisma db push`)
- [ ] Backfill exécuté (`npx ts-node scripts/backfillStockHistory.ts`)
- [ ] Historique visible dans Prisma Studio
- [ ] API retourne des données (`curl .../history`)
- [ ] Graphique s'affiche dans le frontend
- [ ] Job automatique fonctionne (vérifier logs toutes les 2h)
- [ ] Backend redémarré pour charger le nouveau service

---

## 📞 Résumé

### Ce qui fonctionne MAINTENANT

✅ **Scraper existant** : Continue de tourner toutes les 2h (inchangé)
✅ **Historique automatique** : Sauvegardé à 18h chaque jour (nouveau)
✅ **Backfill script** : Créer 365 jours immédiatement (nouveau)
✅ **API complète** : Routes `/history`, `/fundamentals`, etc. (déjà fait)
✅ **Frontend** : Graphique fonctionnel avec données (déjà fait)

### Ce qui reste à faire

🔜 **Scraping fondamentaux** : P/E, ROE, etc. (optionnel, voir TODO)
🔜 **Scraping actualités** : News feed (optionnel, voir TODO)
🔜 **Vraies données historiques** : Remplacer simulation par vraies données BRVM (futur)

---

**Créé le** : 19 Novembre 2024
**But** : Intégrer le scraper existant avec la nouvelle page Stock Details
**Statut** : ✅ Prêt à utiliser
