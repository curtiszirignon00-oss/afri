# Formules du Tableau de Bord - Documentation de Référence

## Vue d'ensemble

Ce document décrit toutes les formules utilisées pour calculer les métriques affichées dans le tableau de bord du portefeuille. Toutes les formules sont cohérentes entre elles et garantissent que la somme des parties égale le tout.

---

## 1. Métriques Principales

### 1.1 Valeur Totale du Portefeuille
```
Valeur Totale = Liquidités + Valeur des Positions

Où:
- Liquidités = portfolio.cash_balance
- Valeur des Positions = Σ(quantity × prix_actuel) pour chaque position
```

**Calcul détaillé:**
```typescript
const stocksValue = portfolio.positions.reduce((acc, pos) => {
  const stock = stocksData[pos.stock_ticker];
  return stock ? acc + (pos.quantity * stock.current_price) : acc;
}, 0);

const totalValue = portfolio.cash_balance + stocksValue;
```

**Fichier:** `afribourse/src/hooks/usePortfolio.ts` (ligne 114-123)

---

### 1.2 Liquidités (Cash Balance)
```
Liquidités = portfolio.cash_balance

Mise à jour:
- Sur ACHAT: cash_balance = cash_balance - (quantity × pricePerShare)
- Sur VENTE: cash_balance = cash_balance + (quantity × pricePerShare)
```

**Fichier:** `backend/src/services/portfolio.service.prisma.ts`

---

### 1.3 Valeur des Actions
```
Valeur des Actions = Valeur Totale - Liquidités
                   = Σ(quantity × prix_actuel)
```

**Calcul:**
```typescript
const stocksValue = totalValue - portfolio.cash_balance;
```

**Fichier:** `afribourse/src/components/DashboardPage.tsx` (ligne ~340)

---

## 2. Performance et Gains/Pertes

### 2.1 Gain/Perte Total
```
Gain/Perte Total = Valeur Totale - Solde Initial
                  = (Liquidités + Valeur Actions) - initial_balance
```

**Calcul:**
```typescript
const totalValue = calculateTotalValue();
const initialBalance = portfolio.initial_balance || 0;
const totalGainLoss = totalValue - initialBalance;
```

**Fichier:** `afribourse/src/components/DashboardPage.tsx` (ligne ~340)

---

### 2.2 Gain/Perte en Pourcentage
```
Gain/Perte % = (Gain/Perte Total / Solde Initial) × 100
```

**Calcul:**
```typescript
const totalGainLossPercent = initialBalance > 0
  ? (totalGainLoss / initialBalance) * 100
  : 0;
```

**Validation:** Si le portefeuille double de valeur, on doit avoir +100%

---

### 2.3 Performance du Jour
```
Performance Jour = Valeur Aujourd'hui - Valeur Hier
Performance Jour % = (Performance Jour / Valeur Hier) × 100
```

**Calcul amélioré:**
```typescript
// Cherche le dernier point avant aujourd'hui (pas forcément hier)
const today = portfolioHistory[portfolioHistory.length - 1];
const previousPoint = // Dernier point avec date < aujourd'hui

const dailyChange = today.value - previousPoint.value;
const dailyChangePercent = previousPoint.value > 0
  ? (dailyChange / previousPoint.value) * 100
  : 0;
```

**Fichier:** `afribourse/src/components/DashboardPage.tsx` (ligne 209-235)

**Amélioration:** Robuste même si pas de données hier (weekend, jours fériés)

---

### 2.4 Meilleure et Pire Performance Journalière
```
Pour chaque jour i dans l'historique:
  Performance_i = (Valeur_i - Valeur_{i-1}) / Valeur_{i-1} × 100

Meilleure = max(Performance_i)
Pire = min(Performance_i)
```

**Calcul:**
```typescript
const dailyChanges = [];
for (let i = 1; i < portfolioHistory.length; i++) {
  const change = portfolioHistory[i].value - portfolioHistory[i-1].value;
  const percent = (change / portfolioHistory[i-1].value) * 100;
  dailyChanges.push({ date: portfolioHistory[i].date, percent });
}

const best = dailyChanges.reduce((max, curr) =>
  curr.percent > max.percent ? curr : max
);
const worst = dailyChanges.reduce((min, curr) =>
  curr.percent < min.percent ? curr : min
);
```

**Fichier:** `afribourse/src/components/DashboardPage.tsx` (ligne 237-273)

---

## 3. Allocation du Portefeuille

### 3.1 Pourcentage par Position
```
% Position X = (Valeur Position X / Valeur Totale) × 100

Où:
- Valeur Position X = quantity_X × prix_actuel_X
```

**Validation:** Σ(% toutes positions) + % Liquidités = 100%

**Calcul:**
```typescript
const data = [];
portfolio.positions.forEach(position => {
  const value = position.quantity * stock.current_price;
  data.push({
    name: position.stock_ticker,
    value: value,
    percent: (value / totalValue) * 100
  });
});

// Ajouter les liquidités
data.push({
  name: 'Liquidités',
  value: portfolio.cash_balance,
  percent: (portfolio.cash_balance / totalValue) * 100
});
```

**Fichier:** `afribourse/src/components/DashboardPage.tsx` (ligne 275-310)

---

## 4. Performance par Position

### 4.1 Valeur Actuelle d'une Position
```
Valeur Actuelle = Quantity × Prix Actuel
```

### 4.2 Coût de Base (Cost Basis)
```
Coût Base = Quantity × Prix Moyen d'Achat

Où:
- Prix Moyen d'Achat = Coût moyen pondéré calculé à chaque achat
```

**Calcul du prix moyen à l'achat:**
```typescript
const currentTotalValue = position.average_buy_price * position.quantity;
const newTotalQuantity = position.quantity + newQuantity;
const newAveragePrice = (currentTotalValue + totalCost) / newTotalQuantity;
```

**Fichier:** `backend/src/services/portfolio.service.prisma.ts` (ligne 73-85)

### 4.3 Gain/Perte par Position
```
Gain/Perte Position = Valeur Actuelle - Coût Base
                    = (Quantity × Prix Actuel) - (Quantity × Prix Moyen)
                    = Quantity × (Prix Actuel - Prix Moyen)
```

**Calcul:**
```typescript
const currentValue = position.quantity * stockData.current_price;
const costBasis = position.quantity * position.average_buy_price;
const gainLoss = currentValue - costBasis;
```

**Fichier:** `afribourse/src/components/DashboardPage.tsx` (ligne ~540)

### 4.4 Gain/Perte % par Position
```
Gain/Perte % = (Gain/Perte / Coût Base) × 100
             = ((Prix Actuel - Prix Moyen) / Prix Moyen) × 100
```

**Calcul:**
```typescript
const gainLossPercent = costBasis > 0
  ? (gainLoss / costBasis) * 100
  : 0;
```

---

## 5. Évolution Historique du Portefeuille

### 5.1 Valeur à une Date Donnée
```
Pour chaque jour depuis la création du portefeuille:
  1. Appliquer toutes les transactions jusqu'à ce jour
  2. Calculer cash_balance = initial_balance - Σ(achats) + Σ(ventes)
  3. Pour chaque position:
     - Récupérer le prix historique de l'action à cette date
     - Calculer valeur_position = quantity × prix_historique
  4. Valeur Totale = cash_balance + Σ(valeur_positions)
```

**Algorithme:**
```typescript
// Pour chaque jour
let cashBalance = portfolio.initial_balance;
const positionsByTicker = new Map();

// Appliquer les transactions
for (const tx of transactions) {
  if (tx.type === 'BUY') {
    cashBalance -= tx.quantity * tx.price_per_share;
    positionsByTicker[tx.ticker].quantity += tx.quantity;
  } else if (tx.type === 'SELL') {
    cashBalance += tx.quantity * tx.price_per_share;
    positionsByTicker[tx.ticker].quantity -= tx.quantity;
  }
}

// Calculer valeur des positions
let stocksValue = 0;
for (const [ticker, position] of positionsByTicker) {
  const price = getHistoricalPrice(ticker, date) || getCurrentPrice(ticker);
  stocksValue += position.quantity * price;
}

const totalValue = cashBalance + stocksValue;
```

**Fichier:** `backend/src/services/portfolio.service.prisma.ts` (ligne 191-383)

---

## 6. Validation de Cohérence

### 6.1 Tests de Cohérence Automatiques

**Test 1: Valeur Totale**
```
Valeur Totale Calculée = Liquidités + Σ(Valeur Positions)
Doit être égal à: calculateTotalValue()

Tolérance: ±0.01 (erreurs d'arrondi)
```

**Test 2: Allocation Totale**
```
Σ(% toutes positions) + % Liquidités = 100%

Tolérance: ±0.01%
```

**Test 3: Gain/Perte**
```
Gain/Perte = Valeur Totale - Solde Initial
           = (Liquidités + Valeur Actions) - initial_balance

Les deux formules doivent donner le même résultat
```

**Implémentation:**
```typescript
function validateCalculations() {
  // Test 1
  const calculatedTotal = cashBalance + stocksValue;
  if (Math.abs(calculatedTotal - totalValue) > 0.01) {
    console.warn('⚠️ Incohérence: Valeur totale');
  }

  // Test 2
  const totalAllocation = allocationData.reduce((sum, item) =>
    sum + item.percent, 0
  );
  if (Math.abs(totalAllocation - 100) > 0.01) {
    console.warn('⚠️ Incohérence: Allocation totale');
  }

  // Test 3
  const totalGainLoss = totalValue - initialBalance;
  const calculatedGainLoss = cashBalance + stocksValue - initialBalance;
  if (Math.abs(totalGainLoss - calculatedGainLoss) > 0.01) {
    console.warn('⚠️ Incohérence: Gain/Perte');
  }
}
```

**Fichier:** `afribourse/src/components/DashboardPage.tsx` (ligne 275-326)

---

## 7. Relations entre les Métriques

```
                    Solde Initial
                         |
        ┌────────────────┴────────────────┐
        │                                  │
    Liquidités                    Valeur Positions
        │                                  │
        └────────────┬─────────────────────┘
                     │
              Valeur Totale
                     │
     ┌───────────────┼───────────────┐
     │               │               │
Gain/Perte    Allocation %    Performance
```

**Garanties mathématiques:**
1. `Valeur Totale = Liquidités + Valeur Positions` (par définition)
2. `Σ(Allocation %) = 100%` (par construction)
3. `Gain/Perte = Valeur Totale - Solde Initial` (par définition)

---

## 8. Cas Limites et Gestion d'Erreurs

### 8.1 Portfolio Vide
- `Valeur Totale = initial_balance`
- `Liquidités = initial_balance`
- `Valeur Positions = 0`
- `Gain/Perte = 0`
- `Allocation = 100% Liquidités`

### 8.2 Portfolio Nouveau (1 jour)
- `Performance Jour = 0` (pas de point précédent)
- `Meilleure/Pire Performance = null`
- `Historique = 1 point`

### 8.3 Division par Zéro
Tous les calculs de pourcentage vérifient que le dénominateur > 0:
```typescript
const percent = denominator > 0 ? (numerator / denominator) * 100 : 0;
```

### 8.4 Prix Historique Manquant
Si pas de prix historique pour une date:
1. Chercher le dernier prix connu avant cette date
2. Sinon, utiliser le prix actuel
3. En dernier recours, utiliser 0 (ne devrait jamais arriver)

---

## 9. Références des Fichiers

| Métrique | Frontend | Backend |
|----------|----------|---------|
| Valeur Totale | `usePortfolio.ts:114-123` | `portfolio.service.prisma.ts:191-383` (historique) |
| Liquidités | `DashboardPage.tsx` | `portfolio.service.prisma.ts` |
| Performance Jour | `DashboardPage.tsx:209-235` | - |
| Meilleure/Pire Perf | `DashboardPage.tsx:237-273` | - |
| Allocation | `DashboardPage.tsx:275-310` | - |
| Gain/Perte Position | `DashboardPage.tsx:~540` | - |
| Validation | `DashboardPage.tsx:275-326` | - |

---

## 10. Notes Importantes

1. **Prix Actuel vs Prix Historique:**
   - Frontend utilise `stock.current_price` (dernière MAJ)
   - Backend utilise prix historiques pour reconstruire l'évolution
   - Cohérent si `current_price` est le prix du jour en cours

2. **Prix Moyen d'Achat:**
   - Calculé comme coût moyen pondéré à chaque achat
   - **NON modifié lors d'une vente** (correct selon la logique FIFO/WAC)
   - Stocké dans `Position.average_buy_price`

3. **Précision des Calculs:**
   - Utiliser des nombres à virgule flottante (Float)
   - Tolérance d'arrondi: ±0.01 pour les montants
   - Tolérance d'arrondi: ±0.01% pour les pourcentages

4. **Mises à Jour:**
   - Lors d'un achat/vente, le backend met à jour:
     * `cash_balance`
     * `Position.quantity`
     * `Position.average_buy_price` (uniquement sur achat)
   - Le frontend recalcule automatiquement toutes les métriques

---

**Dernière mise à jour:** 2026-01-08
**Version:** 1.0
