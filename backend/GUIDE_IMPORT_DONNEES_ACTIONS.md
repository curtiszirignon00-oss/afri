# Guide d'Importation des Données d'Actions BRVM

## Vue d'ensemble

Ce guide explique comment importer les données historiques et fondamentales pour les 48 actions de la BRVM à partir des fichiers Excel et descriptions texte.

## Structure des Fichiers

Pour chaque action, vous devez avoir :
```
C:\Users\HP\OneDrive\Desktop\actions brvm\
├── abjc\
│   ├── abjc.xlsx           # Données historiques
│   └── abjc desc.txt       # Description et infos fondamentales
├── autre_action\
│   ├── autre_action.xlsx
│   └── autre_action desc.txt
...
```

## Format Excel Attendu

Le fichier Excel doit contenir les colonnes suivantes :
- **Date** : Date au format numérique Excel
- **Dernier** : Prix de clôture
- **Ouv.** : Prix d'ouverture
- **Plus Haut** : Prix le plus haut (note: avec un espace au début!)
- **Plus Bas** : Prix le plus bas
- **Vol.** : Volume (peut contenir "K" pour milliers, ex: "1,5K")
- **Variation %** : (optionnel, non utilisé pour l'import)

### Exemple de données :
```
Date    | Dernier | Ouv.  | Plus Haut | Plus Bas | Vol.
45980   | 2400    | 2380  | 2400      | 2380     | 987
45979   | 2440    | 2440  | 2450      | 2450     | 1617
```

## Format Fichier Description

Le fichier texte doit contenir :
- **Description de la société**
- **Coordonnées** (Téléphone, Fax, Adresse)
- **Dirigeants** (Président, Directeur Général)
- **Nombre de titres**
- **Flottant (%)**
- **Valorisation**
- **Actionnaires**
- **Données financières annuelles** (CA, RN, BNPA, PER, Dividende)
- **Indicateurs** (Beta, RSI, etc.)

## Import d'une Action

### Étape 1 : Vérifier que l'action existe dans la base

```bash
cd backend
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.stock.findUnique({ where: { symbol: 'ABJC' } })
  .then(stock => {
    if (stock) console.log('✅ Stock trouvé:', stock.company_name);
    else console.log('❌ Stock non trouvé');
    prisma.\$disconnect();
  });
"
```

### Étape 2 : Modifier le script pour votre action

Éditer `backend/scripts/importStockData.ts` et modifier la fonction `main()` :

```typescript
async function main() {
  try {
    // Import ABJC data
    await importABJCData();

    // Ajouter d'autres actions ici :
    // await importStockData('BOAC', 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\boac\\boac.xlsx', {
    //   ticker: 'BOAC',
    //   companyName: 'BANK OF AFRICA COTE D\'IVOIRE',
    //   description: '...',
    //   // ... autres données
    // });

  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
```

### Étape 3 : Exécuter l'import

```bash
cd backend
npm run import-stock-data
```

## Script d'Import Automatisé pour Toutes les Actions

Pour importer toutes les 48 actions en une fois, créez un script d'import en masse :

```typescript
// backend/scripts/importAllStocks.ts
import { importStockData } from './importStockData';

const STOCKS_DATA = [
  {
    ticker: 'ABJC',
    excelPath: 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\abjc\\abjc.xlsx',
    fundamentals: { /* ... */ }
  },
  {
    ticker: 'BOAC',
    excelPath: 'C:\\Users\\HP\\OneDrive\\Desktop\\actions brvm\\boac\\boac.xlsx',
    fundamentals: { /* ... */ }
  },
  // ... 46 autres actions
];

async function main() {
  for (const stock of STOCKS_DATA) {
    try {
      await importStockData(stock.ticker, stock.excelPath, stock.fundamentals);
    } catch (error) {
      console.error(`❌ Failed to import ${stock.ticker}:`, error);
    }
  }
}

main();
```

## Vérification de l'Import

### Vérifier le nombre d'enregistrements

```bash
cd backend
npx ts-node scripts/checkImport.ts
```

### Vérifier dans Prisma Studio

```bash
cd backend
npm run prisma:studio
```

Ouvrez votre navigateur à `http://localhost:5555` et explorez :
- **stock_history** : Historique des prix
- **stock_fundamentals** : Ratios financiers
- **company_info** : Informations sur l'entreprise

## Exemple Complet : Import de ABJC

Le script actuel importe ABJC avec :

**Données Historiques :**
- ~2739 lignes de données OHLCV
- Date la plus récente : Novembre 2024
- Date la plus ancienne : ~2014 (10 ans d'historique)

**Données Fondamentales :**
- Description de l'entreprise
- Coordonnées complètes
- Dirigeants
- Ratios financiers (PER: 17.49, Beta: 0.66, RSI: 65.24)
- Données financières 2024 :
  - CA : 12,467 milliards FCFA (+10.78%)
  - RN : 1,519 milliards FCFA (+13.78%)
  - BNPA : 139.22 FCFA
  - Dividende attendu : 206 FCFA

## Mise à Jour des Données

### Mise à jour quotidienne automatique

Les données sont mises à jour automatiquement via le scraper existant (`scraping.job.ts`) qui :
- S'exécute toutes les 2 heures
- Sauvegarde l'historique quotidien à 18h (après fermeture BRVM)

### Mise à jour manuelle des fondamentaux

Les données fondamentales changent peu souvent. Mise à jour recommandée :
- **Trimestrielle** : Après publication des résultats financiers
- **Annuelle** : Mise à jour complète des ratios

Pour mettre à jour :
1. Modifier les données dans `importStockData.ts`
2. Relancer le script : `npm run import-stock-data`
3. L'upsert remplacera les anciennes valeurs

## Performance

**Temps d'import moyen :**
- ~2700 enregistrements historiques : ~3-5 minutes
- Données fondamentales : ~1 seconde

**Optimisations possibles :**
- Utiliser `createMany()` au lieu de `upsert()` en boucle
- Batch les insertions par groupes de 100
- Désactiver les logs pendant l'import

## Dépannage

### Problème : "Stock not found in database"
**Solution :** Vérifier que l'action existe dans la table `stocks` avec le bon symbole

### Problème : "Invalid date"
**Solution :** Vérifier que la colonne "Date" contient des nombres Excel valides

### Problème : "No close price"
**Solution :** Vérifier que la colonne s'appelle "Dernier" (et non "Close" ou "Clôture")

### Problème : Volume = 0 pour toutes les données
**Solution :** Vérifier le format de la colonne "Vol." (peut contenir "K" ou virgules)

## Scripts Utiles

### Inspecter un fichier Excel

```bash
cd backend
npx ts-node scripts/inspectExcel.ts
```

### Vérifier l'import

```bash
cd backend
npx ts-node scripts/checkImport.ts
```

### Vérifier qu'une action existe

```bash
cd backend
npx ts-node scripts/checkStock.ts
```

## Prochaines Étapes

1. ✅ Import réussi de ABJC
2. ⏳ Préparer les données pour les 47 autres actions
3. ⏳ Créer un script d'import en masse
4. ⏳ Valider les données importées
5. ⏳ Tester l'affichage dans le frontend

## Notes Importantes

- Les données Excel peuvent contenir des formats variés (strings, nombres, "K", virgules)
- Le script gère automatiquement ces variations
- Les dates Excel sont converties en dates JavaScript
- L'upsert évite les doublons (basé sur `stock_ticker` + `date`)
- Les logs montrent la progression en temps réel

## Support

En cas de problème :
1. Vérifier les logs dans la console
2. Vérifier le format du fichier Excel avec `inspectExcel.ts`
3. Vérifier que l'action existe dans la DB
4. Consulter les erreurs TypeScript/Prisma
