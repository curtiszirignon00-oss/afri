# 📊 GUIDE : AJOUTER DES DONNÉES DE STOCK (HISTORY & FUNDAMENTALS)

## 🚀 MÉTHODE : Utiliser Prisma Studio

### Étape 1 : Ouvrir Prisma Studio

```bash
cd c:\Users\HP\OneDrive\Desktop\afri\backend
npx prisma studio
```

👉 Une page web s'ouvre automatiquement à : **http://localhost:5555**

---

## 📈 PARTIE 1 : AJOUTER L'HISTORIQUE DES PRIX (StockHistory)

### Qu'est-ce que StockHistory ?

C'est l'historique **jour par jour** des prix d'une action (cours d'ouverture, plus haut, plus bas, clôture, volume). Cela permet de créer les graphiques de prix.

### Étape 2 : Ajouter un historique de prix

1. **Cliquez sur "StockHistory"** dans la barre de gauche
2. **Cliquez sur "Add record"** (bouton en haut à droite)
3. **Remplissez les champs** :

#### 📝 Champs à remplir :

| Champ | Description | Exemple |
|-------|-------------|---------|
| **stock_ticker** | Le symbole de l'action | `SNTS` |
| **date** | La date du cours (format ISO) | `2025-01-15T00:00:00.000Z` |
| **open** | Prix d'ouverture | `7500` |
| **high** | Prix le plus haut de la journée | `7650` |
| **low** | Prix le plus bas de la journée | `7450` |
| **close** | Prix de clôture | `7600` |
| **volume** | Volume d'actions échangées | `12500` |
| **stockId** | L'ID du stock (voir ci-dessous) | `67a1b2c3d4e5f6g7h8i9j0k1` |

#### 🔍 Comment trouver le `stockId` ?

1. Cliquez sur **"Stock"** dans la barre de gauche
2. Trouvez l'action concernée (ex: `SNTS`)
3. Cliquez dessus
4. Copiez l'**ID** (la longue chaîne en haut, ex: `67a1b2c3d4e5f6g7h8i9j0k1`)
5. Retournez dans **"StockHistory"** et collez cet ID dans le champ `stockId`

#### ⚠️ Important pour la date

Le format de date doit être **ISO 8601** :
```
2025-01-15T00:00:00.000Z
```

**Autres exemples de dates valides :**
- `2025-01-15T09:30:00.000Z` (avec heure)
- `2024-12-31T00:00:00.000Z`

4. **Cliquez sur "Save 1 change"**

### 📋 Exemple complet - Ajouter 7 jours d'historique pour SNTS

| date | open | high | low | close | volume |
|------|------|------|-----|-------|---------|
| 2025-01-13T00:00:00.000Z | 7400 | 7500 | 7350 | 7480 | 11200 |
| 2025-01-14T00:00:00.000Z | 7480 | 7550 | 7450 | 7520 | 10800 |
| 2025-01-15T00:00:00.000Z | 7520 | 7650 | 7500 | 7600 | 13500 |
| 2025-01-16T00:00:00.000Z | 7600 | 7700 | 7580 | 7650 | 14200 |
| 2025-01-17T00:00:00.000Z | 7650 | 7750 | 7620 | 7700 | 15800 |
| 2025-01-20T00:00:00.000Z | 7700 | 7800 | 7680 | 7750 | 16500 |
| 2025-01-21T00:00:00.000Z | 7750 | 7850 | 7730 | 7820 | 17200 |

👉 **Répétez** l'opération pour chaque jour en cliquant sur **"Add record"** à chaque fois.

---

## 💰 PARTIE 2 : AJOUTER LES FONDAMENTAUX (StockFundamental)

### Qu'est-ce que StockFundamental ?

Ce sont les **données financières** d'une entreprise : capitalisation boursière, ratios financiers (PER, rendement du dividende), revenus, bénéfices, etc.

### Étape 3 : Ajouter les fondamentaux d'une action

1. **Cliquez sur "StockFundamental"** dans la barre de gauche
2. **Cliquez sur "Add record"**
3. **Remplissez les champs** :

#### 📝 Champs à remplir :

| Champ | Description | Exemple | Unité |
|-------|-------------|---------|-------|
| **stock_ticker** | Symbole de l'action | `SNTS` | - |
| **stockId** | L'ID du stock | `67a1b2c3d4e5f6g7h8i9j0k1` | - |
| **year** | Année de référence | `2024` | - |
| **market_cap** | Capitalisation boursière | `245000000000` | FCFA |
| **pe_ratio** | PER (Price to Earnings) | `15.5` | - |
| **pb_ratio** | PBR (Price to Book) | `2.3` | - |
| **dividend_yield** | Rendement du dividende | `3.5` | % |
| **ex_dividend_date** | Date de détachement du dividende | `2024-06-15T00:00:00.000Z` | - |
| **roe** | Retour sur capitaux propres | `18.2` | % |
| **roa** | Retour sur actifs | `12.5` | % |
| **profit_margin** | Marge bénéficiaire | `15.8` | % |
| **debt_to_equity** | Ratio dette/capitaux propres | `0.45` | - |
| **revenue** | Chiffre d'affaires | `180000000000` | FCFA |
| **net_income** | Bénéfice net | `28000000000` | FCFA |
| **ebitda** | EBITDA | `42000000000` | FCFA |
| **free_cash_flow** | Flux de trésorerie disponible | `25000000000` | FCFA |
| **shares_outstanding** | Nombre d'actions en circulation | `32000000` | actions |
| **eps** | Bénéfice par action | `875` | FCFA |
| **book_value** | Valeur comptable | `3400` | FCFA |
| **net_profit** | Profit net | `28000000000` | FCFA |

4. **Cliquez sur "Save 1 change"**

### 📊 Exemple complet - Fondamentaux pour SNTS (2024)

```
stock_ticker: SNTS
stockId: [copié depuis la table Stock]
year: 2024
market_cap: 245000000000
pe_ratio: 15.5
pb_ratio: 2.3
dividend_yield: 3.5
roe: 18.2
roa: 12.5
profit_margin: 15.8
debt_to_equity: 0.45
revenue: 180000000000
net_income: 28000000000
ebitda: 42000000000
free_cash_flow: 25000000000
shares_outstanding: 32000000
eps: 875
book_value: 3400
net_profit: 28000000000
```

---

## 🔄 PARTIE 3 : METTRE À JOUR DES DONNÉES EXISTANTES

### Modifier un historique de prix

1. **Cliquez sur "StockHistory"**
2. **Trouvez la ligne** à modifier (utilisez la recherche si besoin)
3. **Cliquez sur la ligne**
4. **Modifiez les champs** désirés
5. **Cliquez sur "Save 1 change"**

### Modifier des fondamentaux

1. **Cliquez sur "StockFundamental"**
2. **Trouvez l'action** (par `stock_ticker` ou `year`)
3. **Cliquez sur la ligne**
4. **Modifiez les champs**
5. **Cliquez sur "Save 1 change"**

---

## 💡 ASTUCES & BONNES PRATIQUES

### Pour StockHistory :

1. **Commencez par des données récentes** (ex: les 30 derniers jours)
2. **Respectez l'ordre chronologique** (du plus ancien au plus récent)
3. **Assurez-vous que** :
   - `open` ≤ `high`
   - `low` ≤ `close`
   - `low` ≤ `high`
4. **Pas de doublons** : une seule entrée par jour et par action
5. **Le volume** doit être un nombre entier positif

### Pour StockFundamental :

1. **Une seule entrée par année** pour chaque action
2. **Les ratios** sont généralement des nombres décimaux (ex: 15.5, 2.3)
3. **Les pourcentages** sont exprimés en nombres (ex: 3.5 pour 3.5%)
4. **Les montants** sont en FCFA (pas de virgule de séparation)
5. **Laissez vide** les champs que vous ne connaissez pas (ils sont optionnels)

---

## 📅 FORMAT DES DATES

Toutes les dates doivent suivre le format **ISO 8601** :

```
2025-01-15T00:00:00.000Z
```

**Décomposition :**
- `2025-01-15` : Année-Mois-Jour
- `T` : Séparateur (obligatoire)
- `00:00:00` : Heure:Minute:Seconde
- `.000` : Millisecondes
- `Z` : Timezone UTC (obligatoire)

**Exemples valides :**
```
2024-12-31T00:00:00.000Z
2025-01-15T09:30:00.000Z
2023-06-15T14:45:30.000Z
```

---

## 🔍 VÉRIFIER QUE ÇA FONCTIONNE

### Pour StockHistory :

1. Allez sur votre site → Page d'une action (ex: `/stocks/SNTS`)
2. Vérifiez que le **graphique de prix** s'affiche
3. Les données devraient correspondre à ce que vous avez entré

### Pour StockFundamental :

1. Allez sur votre site → Page d'une action (ex: `/stocks/SNTS`)
2. Vérifiez la section **"Fondamentaux"** ou **"Ratios financiers"**
3. Les ratios et données financières devraient s'afficher

---

## 🌐 EXEMPLES DE DONNÉES RÉALISTES (BRVM)

### Actions populaires à remplir :

| Ticker | Entreprise | Secteur |
|--------|-----------|---------|
| SNTS | Sonatel | Télécommunications |
| TTLS | Total Sénégal | Énergie |
| SIVC | SICAV BIDC | Finance |
| BOAC | Bank of Africa | Banque |
| SGBC | Société Générale | Banque |

### Plage de prix typique (FCFA) :

- **Sonatel (SNTS)** : 7 000 - 8 000
- **Total Sénégal (TTLS)** : 1 500 - 2 000
- **Bank of Africa** : 4 000 - 5 000

### Ratios typiques pour une entreprise :

- **PER** : 10 - 20
- **PBR** : 1.5 - 3
- **Dividend Yield** : 2% - 6%
- **ROE** : 10% - 25%
- **Debt to Equity** : 0.2 - 1.5

---

## ⚠️ ERREURS COURANTES

### ❌ Erreur : "Unique constraint failed"

**Cause** : Vous essayez d'ajouter un doublon
- Pour **StockHistory** : même `stock_ticker` + même `date`
- Pour **StockFundamental** : même `stock_ticker`

**Solution** : Modifiez la date/ticker ou supprimez l'ancien enregistrement

### ❌ Erreur : "Foreign key constraint failed"

**Cause** : Le `stockId` est incorrect ou n'existe pas

**Solution** :
1. Allez dans **"Stock"**
2. Vérifiez que l'action existe
3. Copiez le bon **ID**

### ❌ La date ne s'enregistre pas correctement

**Cause** : Format de date incorrect

**Solution** : Utilisez toujours le format `2025-01-15T00:00:00.000Z`

---

## 🎯 WORKFLOW RECOMMANDÉ

### Pour ajouter une nouvelle action complète :

1. **Créer l'action dans "Stock"** (si elle n'existe pas)
   - `symbol`, `company_name`, `sector`, etc.

2. **Ajouter l'historique dans "StockHistory"**
   - Au moins 30 jours de données pour un graphique cohérent

3. **Ajouter les fondamentaux dans "StockFundamental"**
   - Données de l'année en cours

4. **Vérifier sur le site**
   - Page de l'action
   - Graphique
   - Fondamentaux

---

## 🔧 COMMANDES UTILES

### Réinitialiser toutes les données d'historique :

```bash
# ⚠️ ATTENTION : Supprime TOUTES les données !
cd c:\Users\HP\OneDrive\Desktop\afri\backend
npx prisma db seed
```

### Voir le nombre d'enregistrements :

Dans **Prisma Studio**, le nombre d'enregistrements s'affiche en haut de chaque table.

---

## 📚 RESSOURCES

### Où trouver les données réelles ?

1. **Site officiel BRVM** : https://www.brvm.org
2. **Rapports annuels** des entreprises
3. **Sites financiers** spécialisés en Afrique de l'Ouest

### Outils utiles :

- **Excel/Google Sheets** : Préparez vos données avant de les entrer
- **Format de date** : Utilisez la fonction `=TEXT(A1,"YYYY-MM-DD")&"T00:00:00.000Z"`

---

**Bon remplissage ! 📊💹**
