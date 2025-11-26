# Guide de débogage du graphique

## 🎯 Problème résolu : Page blanche lors du changement de type

✅ **Le bug de crash est corrigé !** La page ne devient plus blanche lors du clic sur les boutons.

## 🐛 Problème actuel : Le graphique ne s'affiche pas (zone blanche)

Le graphique devrait s'afficher mais la zone reste blanche/vide.

### 🔍 Étapes de diagnostic

#### 1. Ouvrir la console du navigateur

1. Appuyez sur **F12**
2. Allez dans l'onglet **Console**
3. Rechargez la page d'une action (ex: BICC)

#### 2. Vérifier les logs dans l'ordre

Vous devriez voir cette séquence de logs :

```javascript
// 1. Données de l'API
StockDetailPageEnhanced - Raw API data: {
  hasData: true,
  dataLength: 365,
  firstItem: { date: "2024-01-01", open: 10000, ... },
  lastItem: { date: "2025-01-01", open: 10500, ... }
}

// 2. Données converties
StockDetailPageEnhanced - Converted data: {
  length: 365,
  first: { date: "2024-01-01", time: 1704067200, open: 10000, ... },
  last: { date: "2025-01-01", time: 1735689600, open: 10500, ... }
}

// 3. Rendu du composant
StockChartNew render: {
  symbol: "BICC",
  dataLength: 365,
  isReady: false, // puis true
  isLoading: false,
  selectedChartType: "candlestick"
}

// 4. Initialisation du graphique
useStockChart: chartContainerRef not ready  // peut apparaître
useStockChart: Initializing chart
useStockChart: Chart created
useStockChart: Chart ready

// 5. Création de la série
useStockChart: Chart not ready for series update { isReady: false, hasChart: true }
useStockChart: Updating chart type to candlestick
useStockChart: Setting data after chart type change 365 points
useStockChart: Chart data sample: { time: 1704067200, open: 10000, ... }
useStockChart: Data set successfully

// 6. Mise à jour finale
useStockChart: Updating data 365 points
useStockChart: Data update - chart data: 365 volume data: 365
useStockChart: Data update complete
```

### ⚠️ Problèmes possibles et solutions

#### Problème A : `dataLength: 0` (pas de données)

**Symptôme :**
```javascript
StockDetailPageEnhanced - Raw API data: {
  hasData: false,  // ou true avec dataLength: 0
  dataLength: 0
}
```

**Solutions :**
1. Vérifiez que l'API backend retourne bien des données
2. Vérifiez l'URL de l'API dans la console Network (F12 → Network)
3. Testez l'API directement : `GET /api/stocks/BICC/history?period=1Y`

#### Problème B : `time` est `undefined` ou `NaN`

**Symptôme :**
```javascript
StockDetailPageEnhanced - Converted data: {
  first: { time: NaN, ... }  // ou time: undefined
}
```

**Cause :** La fonction `dateToTimestamp()` ne peut pas parser la date

**Solutions :**
1. Vérifiez le format de date dans les données brutes
2. Format attendu : `"2024-01-01"` ou `"2024-01-01T00:00:00Z"`
3. Vérifiez le fichier [chartDataAdapter.ts](afribourse/src/utils/chartDataAdapter.ts:13-16)

#### Problème C : Erreur lors de `setData()`

**Symptôme :**
```javascript
Erreur lors de la mise à jour des données du graphique: [Error message]
```

**Causes possibles :**
- Timestamps pas en ordre chronologique
- Timestamps en millisecondes au lieu de secondes
- Valeurs OHLC invalides (NaN, null, undefined)

**Solutions :**
1. Vérifiez que les timestamps sont en **secondes** pas millisecondes
2. Vérifiez le tri chronologique dans `convertToOHLCVData()`
3. Vérifiez que toutes les valeurs (open, high, low, close, volume) sont des nombres valides

#### Problème D : Le graphique ne se monte jamais

**Symptôme :**
```javascript
useStockChart: chartContainerRef not ready
// Répété indéfiniment, jamais "Initializing chart"
```

**Cause :** Le conteneur DOM n'existe pas ou n'est pas visible

**Solutions :**
1. Vérifiez que le composant `StockChartNew` est bien rendu
2. Vérifiez qu'il n'y a pas de `display: none` ou `visibility: hidden`
3. Regardez dans l'inspecteur (F12 → Elements) si le `<div ref={chartContainerRef}>` existe
4. Vérifiez qu'il a bien une hauteur : `style="height: 500px"`

#### Problème E : `isReady` reste `false`

**Symptôme :**
```javascript
StockChartNew render: { isReady: false }
// isReady ne passe jamais à true
```

**Cause :** L'initialisation du graphique échoue silencieusement

**Solutions :**
1. Vérifiez qu'il n'y a pas d'erreurs avant "Chart ready"
2. Vérifiez que lightweight-charts est bien installé : `npm list lightweight-charts`
3. Réinstallez si nécessaire : `npm install lightweight-charts`

### 🔧 Tests manuels

#### Test 1 : Vérifier le conteneur

Ouvrez la console et tapez :
```javascript
// Vérifier que le conteneur existe et a une taille
const container = document.querySelector('[style*="height: 500px"]');
console.log('Container:', container);
console.log('Width:', container?.clientWidth);
console.log('Height:', container?.clientHeight);
```

**Résultat attendu :**
```
Container: <div style="height: 500px; ...">
Width: 800 (ou autre valeur > 0)
Height: 500
```

#### Test 2 : Vérifier les données dans localStorage

```javascript
// Si React Query met en cache
const cache = JSON.parse(localStorage.getItem('REACT_QUERY_OFFLINE_CACHE') || '{}');
console.log('React Query cache:', cache);
```

#### Test 3 : Forcer un rechargement complet

1. Ouvrez la console
2. Clic droit sur le bouton de rafraîchissement
3. Choisir "Vider le cache et actualiser"
4. Vérifiez les logs à nouveau

### 📋 Checklist de vérification

Cochez ce qui fonctionne :

- [ ] L'API retourne des données (dataLength > 0)
- [ ] Les timestamps sont valides (pas NaN)
- [ ] Les timestamps sont en secondes (pas millisecondes)
- [ ] Le conteneur du graphique existe dans le DOM
- [ ] Le conteneur a une hauteur de 500px
- [ ] `isReady` passe à `true`
- [ ] "Chart created" apparaît dans les logs
- [ ] "Data set successfully" apparaît dans les logs
- [ ] Pas d'erreurs dans la console

### 🚀 Si tout est coché mais ça ne marche toujours pas

#### Solution 1 : Vérifier l'instance de lightweight-charts

Ajoutez temporairement dans [useStockChart.ts](afribourse/src/hooks/useStockChart.ts:224) après `chartRef.current = chart;` :

```typescript
// Debug: exposer le graphique globalement
(window as any).chartDebug = {
  chart: chartRef.current,
  container: chartContainerRef.current,
  series: seriesRef.current,
  data: data
};
console.log('Chart instance:', (window as any).chartDebug);
```

Puis dans la console :
```javascript
console.log(window.chartDebug);
// Vérifiez que tout existe
```

#### Solution 2 : Créer un graphique test minimal

Créez un fichier de test [TestChart.tsx](afribourse/src/components/TestChart.tsx) :

```typescript
import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function TestChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: 800,
      height: 500,
    });

    const series = chart.addCandlestickSeries();

    // Données de test FIXES
    series.setData([
      { time: 1704067200, open: 100, high: 110, low: 90, close: 105 },
      { time: 1704153600, open: 105, high: 115, low: 95, close: 110 },
      { time: 1704240000, open: 110, high: 120, low: 100, close: 115 },
    ]);

    console.log('Test chart created successfully!');

    return () => chart.remove();
  }, []);

  return (
    <div>
      <h2>Test Chart</h2>
      <div ref={containerRef} style={{ width: '800px', height: '500px', border: '1px solid red' }} />
    </div>
  );
}
```

Utilisez ce composant à la place de `StockChartNew` temporairement. Si ça marche, le problème est dans les données ou la configuration.

### 📞 Informations à fournir pour le support

Si rien ne fonctionne, fournissez :

1. **Logs complets de la console** (copier-coller tout)
2. **Screenshot de l'inspecteur** montrant le DOM du conteneur
3. **Réponse de l'API** : dans Network (F12), cliquez sur la requête `/api/stocks/BICC/history`, copiez la réponse JSON
4. **Version de lightweight-charts** : `npm list lightweight-charts`
5. **Version de React** : `npm list react`
6. **Navigateur utilisé** : Chrome, Firefox, Safari, Edge ?

### 🎯 Prochaines étapes

Une fois que le graphique s'affiche :

1. **Retirer tous les logs de debug** dans :
   - [StockChartNew.tsx](afribourse/src/components/stock/StockChartNew.tsx:49-58)
   - [useStockChart.ts](afribourse/src/hooks/useStockChart.ts) (tous les `console.log`)
   - [StockDetailPageEnhanced.tsx](afribourse/src/components/StockDetailPageEnhanced.tsx:326-361)

2. **Tester sur différents navigateurs**

3. **Tester sur mobile**

4. **Optimiser les performances** si nécessaire

5. **Passer à la Phase 2** : Indicateurs techniques

---

## 🔄 Rappel des modifications faites

### Corrections du crash (✅ FAIT)
- Séparation des effets React (initialisation / type / données)
- Utilisation de `useCallback` pour stabiliser les fonctions
- Gestion d'erreurs avec try/catch
- Nettoyage approprié des références

### Améliorations du diagnostic (✅ FAIT)
- Logs détaillés à chaque étape
- Vérification des données avant/après conversion
- Affichage de l'état de préparation (`isReady`)
- Conteneur visible avec background color

### Fichiers modifiés
- ✅ [useStockChart.ts](afribourse/src/hooks/useStockChart.ts) - Hook corrigé avec useCallback
- ✅ [StockChartNew.tsx](afribourse/src/components/stock/StockChartNew.tsx) - Logs et conteneur visible
- ✅ [StockDetailPageEnhanced.tsx](afribourse/src/components/StockDetailPageEnhanced.tsx) - Logs de conversion

---

**Le serveur de développement tourne sur :** http://localhost:5174

**Testez maintenant et regardez les logs de la console !**
