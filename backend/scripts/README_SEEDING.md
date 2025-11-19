# 🌱 Guide de Seeding - Stock Details

Ce script permet d'insérer des données de test pour tester la nouvelle page Stock Details.

## 📦 Ce qui sera créé

Le script `seedStockDetails.ts` va créer :

1. **Historique de prix** (365 jours) pour : SLBC, SNTS, SGBC, BOAM
2. **Données fondamentales** complètes pour : SLBC, SNTS
3. **Informations compagnie** pour : SLBC, SNTS, SGBC
4. **Actualités** (2 par action) pour : SLBC, SNTS

## 🚀 Comment exécuter

### Option 1 : Avec ts-node (recommandé)

```bash
cd backend
npx ts-node scripts/seedStockDetails.ts
```

### Option 2 : Compiler puis exécuter

```bash
cd backend
npx tsc scripts/seedStockDetails.ts
node scripts/seedStockDetails.js
```

### Option 3 : Ajouter au package.json

Ajoutez ce script dans `backend/package.json` :

```json
{
  "scripts": {
    "seed:stock-details": "ts-node scripts/seedStockDetails.ts"
  }
}
```

Puis exécutez :
```bash
npm run seed:stock-details
```

## ✅ Vérification

Après l'exécution, vous devriez voir :

```
🌱 Début du seeding des données Stock Details...

📊 Création de l'historique pour SLBC...
  ✅ SLBC: 365 jours d'historique créés
📊 Création de l'historique pour SNTS...
  ✅ SNTS: 365 jours d'historique créés
...

💰 Création des données fondamentales...
  ✅ SLBC: Données fondamentales créées
  ✅ SNTS: Données fondamentales créées

🏢 Création des informations compagnies...
  ✅ SLBC: Informations compagnie créées
  ✅ SNTS: Informations compagnie créées
  ✅ SGBC: Informations compagnie créées

📰 Création des actualités...
  ✅ SLBC: 2 actualités créées
  ✅ SNTS: 2 actualités créées

✅ Seeding terminé avec succès!
```

## 🔍 Vérifier les données dans MongoDB

### Avec MongoDB Compass

1. Connectez-vous à votre base de données
2. Vérifiez ces collections :
   - `stock_history` - Doit contenir ~1460 documents (365 jours × 4 actions)
   - `stock_fundamentals` - Doit contenir 2 documents
   - `company_info` - Doit contenir 3 documents
   - `stock_news` - Doit contenir 4 documents

### Avec Prisma Studio

```bash
cd backend
npx prisma studio
```

Puis naviguez vers les modèles : StockHistory, StockFundamental, CompanyInfo, StockNews

## 🎯 Tester la page

Une fois les données insérées :

1. Lancez le backend : `npm run dev` (dans `/backend`)
2. Lancez le frontend : `npm run dev` (dans `/afribourse`)
3. Naviguez vers une action (ex: SLBC)
4. Vous devriez voir :
   - ✅ Un graphique avec 365 jours de données
   - ✅ Des données fondamentales complètes
   - ✅ Les informations de la compagnie
   - ✅ 2 actualités récentes

## 🔧 Personnalisation

Pour ajouter vos propres données, modifiez le fichier `seedStockDetails.ts` :

### Ajouter une action à l'historique

```typescript
const stocks = ['SLBC', 'SNTS', 'SGBC', 'BOAM', 'VOTRE_TICKER'];
```

### Ajouter des fondamentaux

```typescript
const fundamentalsData = [
  // ... existing data
  {
    ticker: 'VOTRE_TICKER',
    data: {
      market_cap: 123456789,
      pe_ratio: 12.5,
      // ... autres champs
    }
  }
];
```

### Ajouter des infos compagnie

```typescript
const companyData = [
  // ... existing data
  {
    ticker: 'VOTRE_TICKER',
    info: {
      description: 'Description de votre compagnie...',
      website: 'https://...',
      // ... autres champs
    }
  }
];
```

### Ajouter des actualités

```typescript
const newsData = [
  // ... existing data
  {
    ticker: 'VOTRE_TICKER',
    articles: [
      {
        title: 'Titre de l\'article',
        summary: 'Résumé...',
        source: 'Source',
        url: 'https://...',
        published_at: new Date('2024-11-19')
      }
    ]
  }
];
```

## ⚠️ Notes importantes

1. **Idempotence** : Le script utilise `upsert` donc vous pouvez l'exécuter plusieurs fois sans créer de doublons
2. **Dépendances** : Les stocks doivent exister dans la table `stocks` avant d'exécuter ce script
3. **Données aléatoires** : L'historique de prix est généré aléatoirement autour du prix actuel du stock
4. **Performance** : L'insertion de 365 jours × 4 actions peut prendre 30-60 secondes

## 🐛 Résolution de problèmes

### Erreur "Stock not found"

Assurez-vous que les actions existent dans votre base :

```bash
npx prisma studio
# Vérifiez que SLBC, SNTS, SGBC, BOAM existent dans la table 'stocks'
```

### Erreur de connexion à la base

Vérifiez votre `.env` :

```bash
DATABASE_URI="mongodb://..."
```

### Erreur TypeScript

Assurez-vous que le client Prisma est généré :

```bash
npx prisma generate
```

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs/)
- [Guide de seeding Prisma](https://www.prisma.io/docs/guides/database/seed-database)
