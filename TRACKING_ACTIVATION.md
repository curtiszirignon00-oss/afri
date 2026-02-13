# Activation du Système de Tracking Analytics

## ✅ Ce qui a été fait

### 1. Tracking Automatique des Pages
- **Fichier modifié**: `afribourse/src/App.tsx`
- **Changement**: Ajout du hook `usePageTracking()` dans le composant Layout
- **Résultat**: Toutes les pages visitées sont maintenant automatiquement trackées avec :
  - Chemin de la page
  - Durée de visite
  - Informations du navigateur (device, OS, browser)

### 2. Tracking des Actions du Simulateur
- **Fichier modifié**: `afribourse/src/components/DashboardPage.tsx`
- **Actions trackées**:
  - ✅ **Achat d'actions** (`SIMULATE_BUY`) avec détails: ticker, quantité, prix, valeur totale
  - ✅ **Vente d'actions** (`SIMULATE_SELL`) avec détails: ticker, quantité, prix, valeur totale

### 3. Tracking de la Watchlist
- **Fichier modifié**: `afribourse/src/components/MarketsPageRefactored.tsx`
- **Actions trackées**:
  - ✅ **Ajout à la watchlist** (`ADD_TO_WATCHLIST`) avec ticker
  - ✅ **Retrait de la watchlist** (`REMOVE_FROM_WATCHLIST`) avec ticker
  - ✅ **Recherche d'actions** (`SEARCH_STOCK`) avec terme de recherche
  - ✅ **Filtre par secteur** (`FILTER_STOCKS`) avec secteur sélectionné

### 4. Interface Admin
- **Route ajoutée**: `/admin/analytics` pour le dashboard analytics détaillé
- **Dashboard principal**: Affiche maintenant un aperçu des analytics (7 derniers jours) avec:
  - Nombre de pages vues
  - Nombre d'actions effectuées
  - Nombre d'utilisations de fonctionnalités
  - Nombre d'utilisateurs actifs uniques
  - Bouton "Voir détails" pour accéder au dashboard complet

### 5. Menu Admin
- **Fichier modifié**: `afribourse/src/components/Header.tsx`
- **Ajout**: Lien "Analytics" dans le menu déroulant admin (accessible via "Mon Compte")

## 🧪 Comment Tester

### Test 1: Vérifier le Tracking des Pages
1. Connectez-vous avec un compte utilisateur (pas admin)
2. Naviguez sur plusieurs pages: `/markets`, `/learn`, `/dashboard`
3. Connectez-vous en tant qu'admin
4. Allez sur `/admin/dashboard` ou `/admin/analytics`
5. Vous devriez voir les pages visitées dans les statistiques

### Test 2: Vérifier le Tracking du Simulateur
1. Connectez-vous avec un compte utilisateur
2. Allez sur `/dashboard` (simulateur)
3. Effectuez un **achat** d'actions
4. Effectuez une **vente** d'actions
5. Connectez-vous en tant qu'admin
6. Allez sur `/admin/analytics`
7. Vérifiez que les actions `simulate_buy` et `simulate_sell` apparaissent dans "Top Actions"

### Test 3: Vérifier le Tracking de la Watchlist
1. Connectez-vous avec un compte utilisateur
2. Allez sur `/markets`
3. **Recherchez** une action (ex: "SIVC")
4. **Ajoutez** une action à la watchlist (cliquez sur l'étoile)
5. **Retirez** l'action de la watchlist
6. **Filtrez** par secteur (sélectionnez un secteur)
7. Connectez-vous en tant qu'admin
8. Allez sur `/admin/analytics`
9. Vérifiez que les actions apparaissent:
   - `search_stock` (recherche)
   - `add_to_watchlist` (ajout)
   - `remove_from_watchlist` (retrait)
   - `filter_stocks` (filtre)

## 📊 Où Voir les Données

### Option 1: Dashboard Principal Admin
- URL: `http://localhost:5173/admin/dashboard`
- Section: "Analytics (7 derniers jours)" - carte bleue en haut
- Affiche: Vue d'ensemble rapide avec bouton "Voir détails"

### Option 2: Dashboard Analytics Complet
- URL: `http://localhost:5173/admin/analytics`
- Accessible via:
  - Menu "Mon Compte" → "Analytics" (pour les admins)
  - Bouton "Voir détails" sur le dashboard principal
- Affiche:
  - **Pages les plus visitées** avec durée moyenne
  - **Actions les plus effectuées** avec nombre
  - **Utilisation des fonctionnalités** (quand vous ajouterez le tracking des features premium)
  - **Répartition par appareil** (mobile/tablet/desktop)
  - **Filtres par période**: 7, 14, 30 jours

## 🔍 Diagnostiquer si le Tracking ne Fonctionne Pas

### Vérification 1: Backend
```bash
# Le backend doit être démarré sur le port 3001
netstat -ano | findstr :3001
```

### Vérification 2: Console Navigateur
1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet "Network"
3. Naviguez sur une page ou effectuez une action
4. Cherchez les requêtes vers `/api/analytics/`
5. Vérifiez qu'elles retournent `200 OK` ou `201 Created`

### Vérification 3: Vérifier les Logs Backend
- Regardez les logs du serveur backend
- Vous devriez voir les requêtes POST vers `/api/analytics/page-view` et `/api/analytics/action`

### Vérification 4: Base de Données
Vérifiez directement dans MongoDB que les collections se remplissent:
```bash
# Les collections à vérifier:
- page_views
- user_action_tracking
- feature_usage
```

## 🎯 Prochaines Étapes (Optionnel)

Pour avoir encore plus de données, vous pouvez ajouter le tracking à:

1. **Création de portfolio** dans `DashboardPage.tsx`
2. **Consultation de graphiques** dans les pages de détails d'actions
3. **Modules d'apprentissage** dans `LearnPage.tsx`
4. **Interactions avec l'IA** (coach, analyste)
5. **Visites de pages de pricing** (pour savoir qui est intéressé par les abonnements)

## 📝 Notes Importantes

- **Authentification requise**: Le tracking des actions nécessite que l'utilisateur soit connecté
- **Tracking des pages**: Fonctionne même pour les visiteurs non connectés (userId sera null)
- **Session ID**: Chaque session de navigation a un ID unique stocké en sessionStorage
- **Durée des pages**: Calculée automatiquement quand l'utilisateur quitte la page

## 🔧 Configuration

Le tracking est configuré pour envoyer les données vers:
- **URL API**: `${import.meta.env.VITE_API_URL}/analytics`
- **Endpoints**:
  - `POST /api/analytics/page-view` - Track une page
  - `POST /api/analytics/action` - Track une action
  - `PUT /api/analytics/page-duration` - Met à jour la durée
  - `GET /api/analytics/stats` - Récupère les stats (admin only)

---

**Le système est maintenant prêt à collecter des données !** 🚀

Effectuez des actions en tant qu'utilisateur, puis connectez-vous en tant qu'admin pour voir les résultats dans le dashboard analytics.
