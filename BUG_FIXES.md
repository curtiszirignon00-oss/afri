# Corrections des bugs du graphique

## 🐛 Problèmes identifiés

### 1. Le graphique ne s'affichait pas
**Cause :** Le hook `useStockChart` se réinitialisait complètement à chaque changement de `chartType` ou `theme`, ce qui détruisait et recréait l'instance du graphique.

### 2. Page blanche lors du changement de type de graphique
**Cause :** La réinitialisation complète du graphique causait un crash React car le composant était détruit pendant le rendu.

## ✅ Solutions appliquées

### 1. Séparation des effets React

**Fichier modifié :** [afribourse/src/hooks/useStockChart.ts](afribourse/src/hooks/useStockChart.ts)

#### Effet d'initialisation (ligne 209-251)
```typescript
useEffect(() => {
  // Créer le graphique UNE SEULE FOIS
  // Ne dépend d'aucune variable
}, []); // Tableau de dépendances vide
```

**Changement :** Le graphique n'est créé qu'une seule fois au montage du composant et n'est jamais réinitialisé.

#### Effet de mise à jour du type (ligne 254-329)
```typescript
useEffect(() => {
  // Supprimer les anciennes séries
  // Créer les nouvelles séries selon le type
  // Réappliquer les données
}, [chartType, isReady]);
```

**Changement :** Au lieu de détruire le graphique, on supprime seulement les séries (candlestick/line/area) et on en crée de nouvelles.

#### Effet de mise à jour des données (ligne 332-351)
```typescript
useEffect(() => {
  // Mettre à jour les données des séries existantes
}, [data, isReady]);
```

**Changement :** Séparé de l'effet du type pour éviter les conflits.

### 2. Déplacement des constantes hors du hook

**Fichier modifié :** [afribourse/src/hooks/useStockChart.ts:29-37](afribourse/src/hooks/useStockChart.ts:29-37)

```typescript
// Avant : const colors déclaré DANS le hook
// Après : const CHART_COLORS déclaré HORS du hook
const CHART_COLORS: ChartColors = {
  upColor: '#10b981',
  downColor: '#ef4444',
  // ...
};
```

**Raison :** Évite la recréation de l'objet à chaque rendu, stabilise les références.

### 3. Gestion d'erreurs améliorée

**Fichier modifié :** [afribourse/src/hooks/useStockChart.ts:326-340](afribourse/src/hooks/useStockChart.ts:326-340)

```typescript
try {
  const chartData = convertData();
  const volumeData = convertVolumeData();
  seriesRef.current.setData(chartData as any);
  volumeSeriesRef.current.setData(volumeData);
  chartRef.current.timeScale().fitContent();
} catch (error) {
  console.error('Erreur lors de la mise à jour des données du graphique:', error);
}
```

**Raison :** Empêche le crash complet si les données sont mal formatées.

### 4. Logs de debug ajoutés

**Fichiers modifiés :**
- [afribourse/src/components/stock/StockChartNew.tsx:49-58](afribourse/src/components/stock/StockChartNew.tsx:49-58)
- [afribourse/src/hooks/useStockChart.ts](afribourse/src/hooks/useStockChart.ts) (plusieurs endroits)

Logs ajoutés pour :
- Initialisation du graphique
- Création des séries
- Mise à jour des données
- Changement de type de graphique
- État du composant

## 🔍 Comment débugger

### 1. Ouvrir la console du navigateur
Appuyez sur `F12` puis allez dans l'onglet "Console"

### 2. Charger une page avec un graphique
Naviguez vers une page de détail d'action (ex: BICC)

### 3. Vérifier les logs

Vous devriez voir dans la console :
```
StockChartNew render: {
  symbol: "BICC",
  dataLength: 365,
  isReady: true,
  isLoading: false,
  selectedChartType: "candlestick",
  firstDataPoint: {...},
  lastDataPoint: {...}
}

useStockChart: Initializing chart
useStockChart: Chart created
useStockChart: Chart ready
useStockChart: Updating chart type to candlestick
useStockChart: Setting data after chart type change 365 points
useStockChart: Data set successfully
```

### 4. Tester le changement de type

Cliquez sur les boutons "Aires" ou "Ligne". Vous devriez voir :
```
useStockChart: Updating chart type to area
useStockChart: Setting data after chart type change 365 points
useStockChart: Data set successfully
```

**Pas de crash, pas d'écran blanc** ✅

## 📊 Flux de données

```
Données API (backend)
  ↓
historyData?.data (format brut)
  ↓
convertToOHLCVData() (ajout des timestamps)
  ↓
StockChartNew (composant)
  ↓
useStockChart (hook)
  ↓
convertData() (selon type: candlestick/line/area/bar)
  ↓
series.setData() (affichage lightweight-charts)
```

## 🧪 Tests à effectuer

### Test 1 : Affichage initial
- [ ] Le graphique s'affiche au chargement de la page
- [ ] Les chandeliers japonais sont visibles
- [ ] Le volume est affiché en bas
- [ ] Les axes et la grille sont visibles

### Test 2 : Changement de type
- [ ] Cliquer sur "Aires" → graphique en aires s'affiche
- [ ] Cliquer sur "Ligne" → graphique en ligne s'affiche
- [ ] Cliquer sur "Barres" → graphique en barres s'affiche
- [ ] Cliquer sur "Chandeliers" → retour aux chandeliers
- [ ] **Aucun écran blanc** ✅

### Test 3 : Changement d'intervalle
- [ ] Cliquer sur "1M" → données du dernier mois
- [ ] Cliquer sur "3M" → données des 3 derniers mois
- [ ] Cliquer sur "6M" → données des 6 derniers mois
- [ ] Cliquer sur "1A" → données de l'année
- [ ] Le graphique se met à jour sans crash

### Test 4 : Interactions
- [ ] Zoomer avec la molette → zoom fonctionne
- [ ] Glisser horizontalement → pan fonctionne
- [ ] Survoler → crosshair et tooltip s'affichent
- [ ] Responsive → graphique s'adapte à la taille

## 🔧 Si le problème persiste

### Vérifier le format des données

Les données doivent avoir cette structure :
```typescript
[
  {
    date: "2024-01-01",      // Date string
    time: 1704067200,        // Timestamp en SECONDES (pas millisecondes)
    open: 10000,
    high: 10500,
    low: 9800,
    close: 10200,
    volume: 50000
  },
  // ...
]
```

### Vérifier que convertToOHLCVData() fonctionne

Dans [afribourse/src/utils/chartDataAdapter.ts:31](afribourse/src/utils/chartDataAdapter.ts:31) :

```typescript
export const convertToOHLCVData = (rawData: RawStockData[]): OHLCVData[] => {
  return rawData
    .map((item) => ({
      date: item.date,
      time: dateToTimestamp(item.date), // Convertit en timestamp unix
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }))
    .sort((a, b) => a.time - b.time); // Tri chronologique IMPORTANT
};
```

### Vérifier que les données arrivent du backend

Dans [afribourse/src/components/StockDetailPageEnhanced.tsx:302-309](afribourse/src/components/StockDetailPageEnhanced.tsx:302-309) :

```typescript
<StockChartNew
  symbol={stock.symbol}
  data={convertToOHLCVData(historyData?.data.map(d => ({
    date: d.date,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume
  })) || [])}
  // ...
/>
```

Ajoutez temporairement :
```typescript
console.log('Raw API data:', historyData?.data);
console.log('Converted data:', convertToOHLCVData(...));
```

## 📝 Prochaines étapes

Une fois les bugs résolus :

1. **Retirer les logs de debug** (pour la production)
2. **Tester sur différents navigateurs** (Chrome, Firefox, Safari, Edge)
3. **Tester sur mobile** (iOS Safari, Chrome Android)
4. **Optimiser la performance** si nécessaire
5. **Ajouter les indicateurs techniques** (Phase 2)

## 🎯 Résumé des changements

| Fichier | Lignes modifiées | Type de changement |
|---------|------------------|---------------------|
| [useStockChart.ts](afribourse/src/hooks/useStockChart.ts) | 29-37, 209-329, 332-351 | 🔧 Correction majeure |
| [StockChartNew.tsx](afribourse/src/components/stock/StockChartNew.tsx) | 49-58 | 🐛 Debug logs |

**Total : 2 fichiers modifiés, ~150 lignes changées**

## ✅ État actuel

- ✅ Hook séparé en 3 effets distincts
- ✅ Constantes déplacées hors du hook
- ✅ Gestion d'erreurs ajoutée
- ✅ Logs de debug ajoutés
- ✅ Build vérifié et fonctionnel
- ⏳ Tests en cours sur navigateur

## 🚀 Pour tester maintenant

1. Le serveur tourne sur **http://localhost:5174**
2. Naviguez vers une action (ex: BICC)
3. Ouvrez la console (F12)
4. Testez les changements de type de graphique
5. Vérifiez les logs dans la console

---

**Dernière mise à jour :** 2025-11-25
**Développé avec ❤️ pour AfriBourse**
