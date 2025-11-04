# Guide de Configuration MongoDB pour AfriBourse

## Problème Résolu
L'erreur `SCRAM failure: bad auth : authentication failed` était causée par l'absence du fichier `.env` dans le dossier backend.

✅ Le fichier `.env` a été créé automatiquement.

## Configuration MongoDB

Vous devez maintenant configurer votre connexion MongoDB. Vous avez deux options :

### Option 1 : MongoDB Atlas (Cloud - Recommandé)

1. **Créer un compte MongoDB Atlas** (gratuit) :
   - Allez sur https://www.mongodb.com/cloud/atlas
   - Créez un compte gratuit
   - Créez un nouveau cluster (Free tier M0 disponible)

2. **Obtenir votre chaîne de connexion** :
   - Dans Atlas, cliquez sur "Connect" sur votre cluster
   - Choisissez "Connect your application"
   - Copiez la chaîne de connexion (format: `mongodb+srv://username:password@cluster...`)

3. **Configurer le fichier .env** :
   ```env
   DATABASE_URI=mongodb+srv://votre_username:votre_password@cluster.mongodb.net/afribourse?retryWrites=true&w=majority
   ```

   ⚠️ Remplacez :
   - `votre_username` : votre nom d'utilisateur MongoDB
   - `votre_password` : votre mot de passe MongoDB
   - `afribourse` : le nom de votre base de données

4. **Autoriser l'accès réseau** :
   - Dans Atlas, allez dans "Network Access"
   - Ajoutez votre adresse IP ou utilisez `0.0.0.0/0` (toutes les IPs - développement uniquement)

### Option 2 : MongoDB Local

1. **Installer MongoDB localement** :
   - Windows : https://www.mongodb.com/try/download/community
   - Mac : `brew install mongodb-community`
   - Linux : `sudo apt-get install mongodb` ou `sudo yum install mongodb`

2. **Démarrer MongoDB** :
   ```bash
   # Windows
   net start MongoDB

   # Mac/Linux
   sudo systemctl start mongod
   # ou
   mongod
   ```

3. **Le fichier .env est déjà configuré** pour MongoDB local :
   ```env
   DATABASE_URI=mongodb://localhost:27017/afribourse
   ```

## Étapes Suivantes

1. **Modifier le fichier .env** :
   ```bash
   cd /home/user/afri/backend
   nano .env  # ou utilisez votre éditeur préféré
   ```

2. **Générer le client Prisma** :
   ```bash
   cd /home/user/afri/backend
   npx prisma generate
   ```

3. **Tester la connexion** :
   ```bash
   cd /home/user/afri/backend
   node test-mongo-conn.js
   ```

4. **Démarrer l'application** :
   ```bash
   npm run dev
   ```

## Vérification de la Configuration

Pour vérifier que tout fonctionne :

```bash
cd /home/user/afri/backend
npx prisma db push
```

Cette commande synchronisera votre schéma Prisma avec MongoDB.

## Erreurs Communes

### "MongoServerError: bad auth"
- Vérifiez que votre nom d'utilisateur et mot de passe sont corrects
- Assurez-vous qu'il n'y a pas de caractères spéciaux non encodés dans l'URL
- Si votre mot de passe contient des caractères spéciaux, encodez-les :
  - `@` → `%40`
  - `:` → `%3A`
  - `/` → `%2F`

### "MongoServerError: IP not whitelisted"
- Ajoutez votre IP dans "Network Access" sur MongoDB Atlas
- Ou utilisez `0.0.0.0/0` pour autoriser toutes les IPs (développement uniquement)

### "MongoNetworkError: connect ECONNREFUSED"
- MongoDB n'est pas démarré (pour installation locale)
- Démarrez MongoDB : `sudo systemctl start mongod`

## Support

Pour plus d'aide :
- Documentation MongoDB Atlas : https://www.mongodb.com/docs/atlas/
- Documentation Prisma MongoDB : https://www.prisma.io/docs/concepts/database-connectors/mongodb
