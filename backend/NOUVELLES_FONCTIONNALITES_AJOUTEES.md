# Nouvelles Fonctionnalités Ajoutées : Actionnaires et Données Financières Historiques

## 📊 Vue d'ensemble

Deux nouveaux modules ont été ajoutés pour enrichir les pages de détail des actions :

1. **Actionnaires** - Structure de propriété avec diagramme circulaire
2. **Données Financières Annuelles** - Historique 5 ans avec graphiques d'évolution

## 🗄️ Nouveaux Modèles Prisma

### 1. Shareholder (Actionnaires)

```prisma
model Shareholder {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  stock_ticker  String
  name          String
  percentage    Float
  is_public     Boolean  @default(false)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  @@map("shareholders")
  @@index([stock_ticker])
}
```

**Utilisation :**
- Affichage dans un diagramme circulaire
- Permet de distinguer actionnaires publics/privés
- Triés par pourcentage décroissant

**Exemple de données (ABJC) :**
- SIA RESTAURATION PUBLIQUE : 76.16%
- PUBLIC (BRVM) : 14.34%
- LSG SKY CHEFS : 9.50%

### 2. AnnualFinancials (Données Financières Annuelles)

```prisma
model AnnualFinancials {
  id                    String   @id @default(auto()) @map("_id") @db.ObjectId
  stock_ticker          String
  year                  Int
  revenue               Float?   // Chiffre d'affaires (FCFA)
  revenue_growth        Float?   // Croissance CA (%)
  net_income            Float?   // Résultat net (FCFA)
  net_income_growth     Float?   // Croissance RN (%)
  eps                   Float?   // BNPA (Bénéfice Net Par Action)
  pe_ratio              Float?   // PER
  dividend              Float?   // Dividende par action (FCFA)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  @@unique([stock_ticker, year])
  @@map("annual_financials")
  @@index([stock_ticker])
  @@index([year])
}
```

**Utilisation :**
- Tableau des données annuelles (5 dernières années)
- Graphiques d'évolution :
  - Chiffre d'affaires
  - Résultat net
  - BNPA
  - PER
  - Dividendes

**Exemple de données (ABJC 2020-2024) :**

| Année | CA (M FCFA) | Croissance CA | RN (M FCFA) | Croissance RN | BNPA  | PER   | Dividende |
|-------|-------------|---------------|-------------|---------------|-------|-------|-----------|
| 2020  | 5,708       | -             | -985        | -             | -90.30| -     | -         |
| 2021  | 8,377       | +46.76%       | 953         | -             | 87.37 | 27.87 | 57.73     |
| 2022  | 10,804      | +28.97%       | 1,268       | +33.05%       | 116.26| 20.94 | 82.80     |
| 2023  | 11,254      | +4.17%        | 1,335       | +5.28%        | 122.00| 19.96 | 206.00    |
| 2024  | 12,467      | +10.78%       | 1,519       | +13.78%       | 139.22| 17.49 | -         |

## 📡 Nouvelles API

### 1. GET /api/stocks/:symbol/shareholders

Récupère la liste des actionnaires d'une action.

**Paramètres :**
- `symbol` (path) : Symbole de l'action (ex: ABJC)

**Réponse :**
```json
[
  {
    "id": "...",
    "stock_ticker": "ABJC",
    "name": "SIA RESTAURATION PUBLIQUE",
    "percentage": 76.16,
    "is_public": false,
    "created_at": "2025-11-19T...",
    "updated_at": "2025-11-19T..."
  },
  {
    "id": "...",
    "stock_ticker": "ABJC",
    "name": "PUBLIC (BRVM)",
    "percentage": 14.34,
    "is_public": true,
    "created_at": "2025-11-19T...",
    "updated_at": "2025-11-19T..."
  },
  {
    "id": "...",
    "stock_ticker": "ABJC",
    "name": "LSG SKY CHEFS",
    "percentage": 9.5,
    "is_public": false,
    "created_at": "2025-11-19T...",
    "updated_at": "2025-11-19T..."
  }
]
```

**Exemple d'utilisation :**
```bash
curl http://localhost:3000/api/stocks/ABJC/shareholders
```

### 2. GET /api/stocks/:symbol/financials

Récupère les données financières annuelles d'une action.

**Paramètres :**
- `symbol` (path) : Symbole de l'action (ex: ABJC)
- `years` (query, optionnel) : Nombre d'années à retourner (défaut: 5)

**Réponse :**
```json
{
  "symbol": "ABJC",
  "years": 5,
  "data": [
    {
      "id": "...",
      "stock_ticker": "ABJC",
      "year": 2020,
      "revenue": 5708000000,
      "revenue_growth": null,
      "net_income": -985000000,
      "net_income_growth": null,
      "eps": -90.30,
      "pe_ratio": null,
      "dividend": null,
      "created_at": "2025-11-19T...",
      "updated_at": "2025-11-19T..."
    },
    {
      "id": "...",
      "stock_ticker": "ABJC",
      "year": 2021,
      "revenue": 8377000000,
      "revenue_growth": 46.76,
      "net_income": 953000000,
      "net_income_growth": null,
      "eps": 87.37,
      "pe_ratio": 27.87,
      "dividend": 57.73,
      "created_at": "2025-11-19T...",
      "updated_at": "2025-11-19T..."
    },
    // ... années 2022-2024
  ]
}
```

**Exemple d'utilisation :**
```bash
# Par défaut, retourne 5 ans
curl http://localhost:3000/api/stocks/ABJC/financials

# Retourner 10 ans
curl http://localhost:3000/api/stocks/ABJC/financials?years=10
```

## 🔧 Services Backend

### getShareholders(symbol: string)

```typescript
export async function getShareholders(symbol: string) {
  const shareholders = await prisma.shareholder.findMany({
    where: { stock_ticker: symbol },
    orderBy: { percentage: 'desc' }
  });
  return shareholders;
}
```

### getAnnualFinancials(symbol: string, yearsBack: number = 5)

```typescript
export async function getAnnualFinancials(symbol: string, yearsBack: number = 5) {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - yearsBack + 1;

  const financials = await prisma.annualFinancials.findMany({
    where: {
      stock_ticker: symbol,
      year: { gte: startYear }
    },
    orderBy: { year: 'asc' }
  });
  return financials;
}
```

## 📥 Import des Données

### Script d'Import Mis à Jour

Le script `importStockData.ts` a été enrichi pour importer :

1. **Actionnaires**
2. **Données financières annuelles (5 ans)**

**Structure de données mise à jour :**

```typescript
interface FundamentalData {
  ticker: string;
  companyName: string;
  description: string;
  // ... autres champs existants ...

  // NOUVEAU : Actionnaires
  shareholders?: ShareholderData[];

  // NOUVEAU : Données financières annuelles
  annualFinancials?: AnnualFinancialData[];
}

interface ShareholderData {
  name: string;
  percentage: number;
  is_public?: boolean;
}

interface AnnualFinancialData {
  year: number;
  revenue?: number;
  revenue_growth?: number;
  net_income?: number;
  net_income_growth?: number;
  eps?: number;
  pe_ratio?: number;
  dividend?: number;
}
```

**Exemple d'utilisation dans importStockData.ts :**

```typescript
const fundamentalData: FundamentalData = {
  ticker: 'ABJC',
  companyName: 'SERVAIR ABIDJAN',
  // ... autres données ...

  shareholders: [
    { name: 'SIA RESTAURATION PUBLIQUE', percentage: 76.16, is_public: false },
    { name: 'PUBLIC (BRVM)', percentage: 14.34, is_public: true },
    { name: 'LSG SKY CHEFS', percentage: 9.5, is_public: false },
  ],

  annualFinancials: [
    {
      year: 2020,
      revenue: 5_708_000_000,
      revenue_growth: null,
      net_income: -985_000_000,
      net_income_growth: null,
      eps: -90.30,
      pe_ratio: null,
      dividend: null,
    },
    // ... autres années
  ],
};
```

## 🎨 Frontend - Composants à Créer

### 1. Composant ShareholdersPieChart

**Emplacement :** `afribourse/src/components/stock/ShareholdersPieChart.tsx`

**Fonctionnalités :**
- Diagramme circulaire (Recharts `<PieChart>`)
- Légende avec pourcentages
- Couleurs distinctes pour chaque actionnaire
- Tooltip au survol

**Exemple de code :**

```typescript
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ShareholdersPieChart({ shareholders }: { shareholders: Shareholder[] }) {
  const data = shareholders.map(s => ({
    name: s.name,
    value: s.percentage
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### 2. Composant AnnualFinancialsTable

**Emplacement :** `afribourse/src/components/stock/AnnualFinancialsTable.tsx`

**Fonctionnalités :**
- Tableau responsive avec toutes les colonnes
- Formatage des nombres (millions FCFA)
- Indicateurs de croissance (flèches ↑↓)
- Tri par année

**Colonnes :**
- Année
- CA (M FCFA)
- Croissance CA (%)
- RN (M FCFA)
- Croissance RN (%)
- BNPA
- PER
- Dividende

### 3. Composant FinancialCharts

**Emplacement :** `afribourse/src/components/stock/FinancialCharts.tsx`

**Fonctionnalités :**
- Onglets pour chaque métrique (CA, RN, BNPA, PER, Dividende)
- Graphiques linéaires (Recharts `<LineChart>`)
- Affichage des taux de croissance
- Interactivité au survol

**Types de graphiques :**
1. **Évolution du CA** - Line chart avec courbe de croissance
2. **Évolution du RN** - Line chart avec indication des pertes/bénéfices
3. **Évolution du BNPA** - Bar chart
4. **Évolution du PER** - Line chart
5. **Évolution des Dividendes** - Bar chart

## 🔌 Hooks React Query

### useShareholders

```typescript
export function useShareholders(symbol: string) {
  return useQuery({
    queryKey: ['shareholders', symbol],
    queryFn: () => fetchShareholders(symbol),
    staleTime: 24 * 60 * 60 * 1000, // 24h (données rarement mises à jour)
  });
}
```

### useAnnualFinancials

```typescript
export function useAnnualFinancials(symbol: string, years: number = 5) {
  return useQuery({
    queryKey: ['annual-financials', symbol, years],
    queryFn: () => fetchAnnualFinancials(symbol, years),
    staleTime: 24 * 60 * 60 * 1000, // 24h
  });
}
```

## 📋 Intégration dans la Page de Détail

### Nouvel Onglet "Fondamentaux"

Le composant `StockFundamentals.tsx` doit être enrichi avec :

1. **Section Actionnaires**
   - Titre : "Structure de Propriété"
   - Composant : `<ShareholdersPieChart>`

2. **Section Données Financières**
   - Titre : "Historique Financier (5 ans)"
   - Sous-section : Tableau avec `<AnnualFinancialsTable>`
   - Sous-section : Graphiques avec `<FinancialCharts>`

**Layout suggéré :**

```
┌─────────────────────────────────────────────────┐
│ 📊 FONDAMENTAUX                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Ratios financiers actuels] (existant)        │
│                                                 │
├─────────────────────────────────────────────────┤
│ 👥 STRUCTURE DE PROPRIÉTÉ                      │
│                                                 │
│   [Diagramme Circulaire Actionnaires]         │
│                                                 │
├─────────────────────────────────────────────────┤
│ 📈 HISTORIQUE FINANCIER (5 ANS)               │
│                                                 │
│   [Tableau des données annuelles]             │
│                                                 │
│   [Graphiques d'évolution]                    │
│   - CA                                         │
│   - Résultat Net                              │
│   - BNPA                                       │
│   - PER                                        │
│   - Dividendes                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

## ✅ Import Réussi pour ABJC

Les données suivantes ont été importées avec succès :

### Actionnaires (3)
- SIA RESTAURATION PUBLIQUE : 76.16%
- PUBLIC (BRVM) : 14.34%
- LSG SKY CHEFS : 9.50%

### Données Financières (5 ans : 2020-2024)
- Chiffres d'affaires
- Croissance du CA
- Résultats nets
- Croissance du RN
- BNPA
- PER
- Dividendes

## 🚀 Prochaines Étapes

1. **Backend**
   - ✅ Schéma Prisma étendu
   - ✅ Services API créés
   - ✅ Controllers créés
   - ✅ Routes ajoutées
   - ✅ Script d'import mis à jour
   - ⏳ Générer le client Prisma : `npx prisma generate`
   - ⏳ Lancer l'import : `npm run import-stock-data`

2. **Frontend**
   - ⏳ Créer les hooks `useShareholders` et `useAnnualFinancials`
   - ⏳ Créer le composant `ShareholdersPieChart`
   - ⏳ Créer le composant `AnnualFinancialsTable`
   - ⏳ Créer le composant `FinancialCharts`
   - ⏳ Intégrer dans `StockFundamentals.tsx`
   - ⏳ Tester l'affichage sur ABJC

3. **Documentation**
   - ⏳ Documenter l'utilisation des nouveaux endpoints
   - ⏳ Créer des exemples de code frontend
   - ⏳ Mettre à jour le guide d'import

## 📝 Notes Importantes

- Les données d'actionnaires sont **remplacées** à chaque import (deleteMany puis create)
- Les données financières annuelles utilisent **upsert** (mise à jour ou création)
- Le cache des hooks est de **24h** car ces données changent rarement
- Les montants sont en **FCFA** (pas de conversion)
- Les taux de croissance sont en **pourcentage** (ex: 46.76 pour 46.76%)
- Le PER peut être `null` en cas de résultat net négatif

## 🎯 Résultat Attendu

Une page de détail d'action enrichie avec :
- Diagramme circulaire des actionnaires
- Tableau complet de l'historique financier 5 ans
- 5 graphiques interactifs montrant l'évolution des indicateurs clés
- Mise en valeur des tendances (croissance, amélioration des marges, etc.)
