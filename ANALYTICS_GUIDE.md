# Guide du système Analytics AfriBourse

## 📊 Vue d'ensemble

Le système d'analytics permet de tracker en détail le comportement des utilisateurs sur la plateforme pour comprendre :
- Quelles pages sont les plus visitées
- Quelles actions sont effectuées
- Quelles fonctionnalités sont utilisées (ou bloquées par les paywalls)
- Le parcours utilisateur
- Les devices utilisés

## 🗄️ Modèles de données

### PageView
Track toutes les pages visitées avec :
- Chemin de la page
- Temps passé sur la page
- Device type (mobile/tablet/desktop)
- Browser & OS
- Session ID pour regrouper les vues

### UserActionTracking
Track les actions spécifiques comme :
- `search_stock` : Recherche d'actions
- `add_to_watchlist` : Ajout à la watchlist
- `create_portfolio` : Création de portfolio
- `simulate_buy/sell` : Transactions simulées
- `use_ai_coach` : Utilisation du coach IA
- `view_chart` : Consultation des graphiques
- etc.

### FeatureUsage
Track l'utilisation des fonctionnalités :
- Nom de la feature
- Type (free/premium/pro)
- Accès accordé ou bloqué
- Bloqué par paywall

## 🔧 Utilisation Frontend

### 1. Tracking automatique des pages

Ajoutez le hook `usePageTracking` dans votre composant App.tsx :

```tsx
import { usePageTracking } from './hooks/useAnalytics';

function App() {
  usePageTracking(); // Track automatiquement les changements de page

  return (
    // ... votre app
  );
}
```

### 2. Tracking manuel d'actions

```tsx
import { useAnalytics, ACTION_TYPES } from './hooks/useAnalytics';

function MyComponent() {
  const { trackAction } = useAnalytics();

  const handleAddToWatchlist = (ticker: string) => {
    // Votre logique
    addToWatchlist(ticker);

    // Track l'action
    trackAction(
      ACTION_TYPES.ADD_TO_WATCHLIST,
      'Ajout à la watchlist',
      { ticker }
    );
  };
}
```

### 3. Tracking de features (paywall)

```tsx
import { analytics, FEATURES } from '../services/analytics';

function PremiumFeature() {
  const handleUseCoachIA = () => {
    const hasAccess = userHasPremiumSubscription();

    // Track la tentative d'utilisation
    analytics.trackFeatureUsage(
      FEATURES.AI_COACH.name,
      FEATURES.AI_COACH.type,
      hasAccess,
      !hasAccess // blockedByPaywall
    );

    if (!hasAccess) {
      // Afficher paywall
    }
  };
}
```

## 📈 Dashboard Analytics Admin

Accédez au dashboard admin pour voir :

1. **Vue d'ensemble**
   - Nombre total de vues
   - Actions effectuées
   - Utilisateurs actifs
   - Utilisations de features

2. **Pages les plus visitées**
   - Classement par nombre de vues
   - Temps moyen passé sur chaque page

3. **Actions les plus effectuées**
   - Comprendre ce que les utilisateurs font vraiment
   - Identifier les fonctionnalités populaires

4. **Utilisation des fonctionnalités**
   - **TRÈS IMPORTANT** : Voir quelles features bloquent les utilisateurs
   - Taux de blocage par paywall
   - Identifier les features qui génèrent de l'intérêt mais sont bloquées

5. **Répartition par device**
   - Mobile vs Desktop vs Tablet
   - Optimiser l'expérience selon les devices

## 🎯 Cas d'usage clés

### Découvrir pourquoi le simulateur n'est pas utilisé

1. Allez sur le dashboard analytics
2. Consultez "Actions les plus effectuées"
3. Cherchez les actions liées au simulateur :
   - `simulate_buy`
   - `simulate_sell`
   - `view_transaction_history`

4. Si ces actions sont absentes ou très peu présentes :
   - Vérifiez les "Pages les plus visitées" - la page du simulateur apparaît-elle ?
   - Consultez le "Feature Usage" pour voir si la feature est bloquée
   - Regardez si les utilisateurs arrivent jusqu'à la page mais n'effectuent pas d'actions

### Identifier les opportunités de conversion

1. Consultez "Utilisation des fonctionnalités"
2. Regardez la colonne "Bloqués" et "Taux blocage"
3. Les features avec un fort taux de blocage = fort intérêt mais besoin de payer
4. Priorisez la conversion sur ces features

## 🔌 API Endpoints

### Tracking (POST)
- `POST /api/analytics/page-view` - Track une page vue
- `POST /api/analytics/action` - Track une action (auth requis)
- `POST /api/analytics/feature` - Track utilisation feature (auth requis)
- `PUT /api/analytics/page-duration` - Met à jour la durée

### Consultation (GET)
- `GET /api/analytics/stats?days=7` - Récupère les stats (admin only)
  - `days=7` : 7 derniers jours
  - `days=14` : 14 derniers jours
  - `days=30` : 30 derniers jours

## 📝 Actions disponibles

Voici la liste complète des types d'actions trackables :

### Navigation
- `navigate`

### Recherche
- `search_stock`
- `filter_stocks`

### Watchlist
- `add_to_watchlist`
- `remove_from_watchlist`

### Portfolio
- `create_portfolio`
- `delete_portfolio`
- `switch_portfolio`

### Trading/Simulateur
- `simulate_buy` ⚠️ **Important pour votre cas**
- `simulate_sell` ⚠️ **Important pour votre cas**
- `view_transaction_history`

### Graphiques
- `view_chart`
- `change_chart_timeframe`
- `toggle_chart_indicator`

### Learning
- `start_learning_module`
- `complete_learning_module`
- `watch_video`
- `take_quiz`

### IA
- `use_ai_coach`
- `use_ai_analyst`

### Social
- `follow_user`
- `unfollow_user`
- `view_user_profile`
- `view_leaderboard`

### Subscriptions
- `view_pricing`
- `start_checkout`
- `blocked_by_paywall`

## 🚀 Prochaines étapes

1. Ajoutez le tracking dans toute votre application
2. Concentrez-vous particulièrement sur le simulateur
3. Consultez régulièrement le dashboard pour ajuster votre stratégie
4. Utilisez les données pour prioriser les développements

## 💡 Conseils

- **Trackez beaucoup** : Plus vous trackez, plus vous comprenez
- **Analysez régulièrement** : Consultez le dashboard 1-2 fois par semaine
- **Agissez sur les insights** : Si une feature est peu utilisée, demandez-vous pourquoi
- **Testez vos hypothèses** : Faites des changements et mesurez l'impact
