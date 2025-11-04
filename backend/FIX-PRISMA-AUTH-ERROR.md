# Fix : Erreur d'Authentification Prisma MongoDB

## ❌ Problème Identifié

Vous rencontriez l'erreur suivante :
```
ConnectorError(ConnectorError {
  user_facing_error: None,
  kind: AuthenticationFailed {
    user: "SCRAM failure: bad auth : authentication failed"
  },
  transient: false
})
```

### Cause Racine
Le fichier `.env` n'existait pas dans le dossier `backend/`, donc Prisma ne pouvait pas se connecter à MongoDB car la variable `DATABASE_URI` n'était pas définie.

## ✅ Solution Appliquée

1. **Création du fichier `.env`** avec une configuration par défaut
2. **Création d'un guide de configuration MongoDB** (`GUIDE-MONGODB-SETUP.md`)
3. **Création d'un script de test de connexion** (`test-db-connection.js`)

## 🚀 Étapes pour Résoudre Complètement

### Étape 1 : Configurer votre connexion MongoDB

Vous avez **deux options** :

#### Option A : MongoDB Atlas (Recommandé - Gratuit)

1. Créez un compte sur https://www.mongodb.com/cloud/atlas
2. Créez un cluster gratuit (M0)
3. Obtenez votre chaîne de connexion
4. Éditez `/home/user/afri/backend/.env` :
   ```env
   DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/afribourse?retryWrites=true&w=majority
   ```

#### Option B : MongoDB Local

1. Installez MongoDB sur votre machine
2. Démarrez le service MongoDB
3. La configuration par défaut dans `.env` devrait fonctionner :
   ```env
   DATABASE_URI=mongodb://localhost:27017/afribourse
   ```

### Étape 2 : Tester la connexion

```bash
cd /home/user/afri/backend
node test-db-connection.js
```

Si la connexion réussit, vous verrez :
```
✅ Connexion réussie à MongoDB!
🎉 Tous les tests de connexion ont réussi!
```

### Étape 3 : Générer le client Prisma

```bash
cd /home/user/afri/backend
npx prisma generate
```

### Étape 4 : Synchroniser le schéma avec MongoDB

```bash
cd /home/user/afri/backend
npx prisma db push
```

### Étape 5 : Démarrer l'application

```bash
cd /home/user/afri/backend
npm run dev
```

## 📁 Fichiers Créés/Modifiés

- ✅ `/home/user/afri/backend/.env` - Fichier de configuration créé
- ✅ `/home/user/afri/backend/GUIDE-MONGODB-SETUP.md` - Guide détaillé
- ✅ `/home/user/afri/backend/test-db-connection.js` - Script de test
- ✅ `/home/user/afri/backend/FIX-PRISMA-AUTH-ERROR.md` - Ce fichier

## 🔧 Dépannage

### Si vous obtenez "bad auth"
- Vérifiez votre nom d'utilisateur et mot de passe
- Encodez les caractères spéciaux dans l'URL

### Si vous obtenez "ECONNREFUSED"
- MongoDB n'est pas démarré (local)
- Ou l'URL de connexion est incorrecte

### Si vous obtenez "IP not whitelisted"
- Ajoutez votre IP dans Network Access (MongoDB Atlas)

## 📚 Documentation

- [Guide complet de configuration MongoDB](./GUIDE-MONGODB-SETUP.md)
- [Documentation Prisma MongoDB](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
- [Documentation MongoDB Atlas](https://www.mongodb.com/docs/atlas/)

## 💡 Note Importante

Le fichier `.env` contient des informations sensibles (mots de passe, clés API).
**Il ne doit JAMAIS être commité dans Git.**

Il est déjà ajouté au `.gitignore` pour votre sécurité.
