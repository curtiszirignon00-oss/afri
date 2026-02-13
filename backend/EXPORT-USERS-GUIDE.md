# Guide d'Export des Utilisateurs

## Description

Ce script permet d'extraire toutes les informations des utilisateurs de la plateforme Afribourse vers un fichier Excel (.xlsx) pour analyse et archivage.

## Utilisation

### Méthode 1: Via npm script (Recommandé)

```bash
npm run export-users
```

### Méthode 2: Avec ts-node

```bash
npx ts-node src/scripts/export-users-to-excel-direct.ts
```

### Méthode 3: Avec tsx

```bash
npx tsx src/scripts/export-users-to-excel-direct.ts
```

## Emplacement du fichier généré

Le fichier Excel sera créé dans le dossier:
```
backend/exports/users-export-YYYY-MM-DDTHH-MM-SS.xlsx
```

Le nom du fichier contient un timestamp pour éviter les écrasements.

## Contenu du fichier Excel

Le fichier Excel contient **8 feuilles** avec des données complètes:

### 📋 Feuille 1: Utilisateurs
Informations principales de chaque utilisateur:
- ID
- Prénom et Nom
- Email
- Téléphone
- Adresse
- Rôle
- Statut de vérification email
- Dates d'inscription et dernière mise à jour

### 👤 Feuille 2: Profils
Détails des profils utilisateurs:
- Username et Bio
- Pays et Date de naissance
- Niveau d'expérience
- Objectifs d'investissement
- Type de profil
- Statistiques de gamification (Niveau, XP, Streak)
- Classements (Global, Pays)
- Compteurs sociaux (Followers, Following, Succès)

### 💼 Feuille 3: Portefeuilles
Informations sur les portefeuilles:
- Nom du portefeuille
- Balance initiale et cash disponible
- Type (virtuel/réel)
- Nombre de positions et transactions
- Valeur totale des positions
- Date de création

### 📚 Feuille 4: Apprentissage
Progrès d'apprentissage:
- Modules complétés ou en cours
- Scores de quiz
- Nombre de tentatives
- Temps passé sur chaque module
- Dates d'accès et de complétion

### 🏆 Feuille 5: Succès
Achievements débloqués:
- Nom et description du succès
- Catégorie et rareté
- XP gagné
- Date de déblocage
- Visibilité sur le profil

### 🎯 Feuille 6: Défis
Progressions sur les défis hebdomadaires:
- Titre et type de défi
- Progression actuelle vs objectif
- Statut de complétion
- Récompense récupérée ou non

### 👁️ Feuille 7: Watchlist
Actions surveillées par les utilisateurs:
- Ticker
- Date d'ajout à la watchlist

### 📊 Feuille 8: Statistiques
Vue d'ensemble des métriques globales:
- Total utilisateurs
- Utilisateurs avec email vérifié
- Utilisateurs avec profil/portefeuille
- Total de portefeuilles
- Modules et succès complétés

## Données exportées

Le script exporte **toutes** les données des utilisateurs, incluant:
- ✅ Informations d'authentification (sans les mots de passe)
- ✅ Profils complets avec paramètres de confidentialité
- ✅ Portefeuilles virtuels et réels
- ✅ Positions et transactions
- ✅ Progrès d'apprentissage
- ✅ Succès et récompenses débloqués
- ✅ Défis hebdomadaires
- ✅ Watchlist personnalisées
- ✅ Relations sociales (followers/following)

## Sécurité

⚠️ **IMPORTANT**: Le fichier généré contient des données sensibles:
- Emails et informations personnelles des utilisateurs
- Données financières des portefeuilles

**Recommandations**:
- Ne pas partager le fichier publiquement
- Stocker le fichier dans un endroit sécurisé
- Supprimer les anciens exports après utilisation
- Respecter le RGPD et les lois sur la protection des données

## Dépannage

### Erreur de connexion à la base de données
Vérifiez que votre fichier `.env` contient une variable `DATABASE_URI` valide:
```env
DATABASE_URI=mongodb://...
```

### Erreur "Cannot find module 'xlsx'"
Installez les dépendances:
```bash
npm install
```

### Dossier exports non créé
Le script crée automatiquement le dossier `exports` s'il n'existe pas.

## Format de sortie

Le fichier utilise le format **XLSX** (Excel 2007+), compatible avec:
- Microsoft Excel
- Google Sheets
- LibreOffice Calc
- Numbers (macOS)

## Personnalisation

Pour personnaliser les données exportées, modifiez le fichier:
```
backend/src/scripts/export-users-to-excel-direct.ts
```

Note: Ce script utilise directement le driver MongoDB natif pour éviter les problèmes de validation Prisma avec les données existantes.

Vous pouvez:
- Ajouter/retirer des colonnes
- Créer de nouvelles feuilles
- Filtrer les utilisateurs exportés
- Modifier le format des données

## Support

Pour tout problème, consultez les logs de la console lors de l'exécution du script.
