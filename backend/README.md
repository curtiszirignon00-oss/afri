# 🚀 Node.js Express TypeScript Boilerplate

Un boilerplate moderne et prêt à l'emploi pour créer des APIs REST avec Node.js, Express et TypeScript. Ce projet propose une architecture modulaire avec support pour MongoDB (Mongoose) et PostgreSQL ou Mysql (Prisma).

## ✨ Fonctionnalités

- 🔐 **Authentification JWT** avec cookies sécurisés
- 🗄️ **Support multi-base de données** : MongoDB et PostgreSQL
- 🛡️ **Sécurité** : Rate limiting, CORS, validation des données
- 📧 **Envoi d'emails** avec Nodemailer
- 🔄 **Middleware personnalisés** pour l'authentification et la gestion d'erreurs
- 📝 **Validation des données** avec Zod
- 🏗️ **Architecture modulaire** : controllers, services, routes, middlewares
- 🔧 **Configuration flexible** via variables d'environnement
- 📊 **Prisma Studio** pour la gestion de base de données
- 🚀 **Hot reload** en développement avec Nodemon

## 🛠️ Technologies utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **TypeScript** - Typage statique
- **Prisma** - ORM pour PostgreSQL/MySQL
- **Mongoose** - ODM pour MongoDB

### Sécurité & Authentication
- **JWT** - JSON Web Tokens
- **bcrypt** - Hachage des mots de passe
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-Origin Resource Sharing

### Utilitaires
- **Zod** - Validation et parsing des données
- **Nodemailer** - Envoi d'emails
- **dotenv** - Gestion des variables d'environnement

## 📦 Installation

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn
- Base de données : PostgreSQL ou MongoDB

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone <url-du-repository>
cd node-express-typescript-boilerplate
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**

Créer un fichier `.env` à la racine du projet :

```env
# Configuration serveur
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Clé API
API_KEY=your-super-secret-api-key-change-in-production

# Base de données (choisir selon votre préférence)
# PostgreSQL
POSTGRESQL_URI=postgresql://username:password@localhost:5432/database_name

***REMOVED***
MONGODB_URI=mongodb://localhost:27017/database_name

# MySQL (optionnel)
MYSQL_URI=mysql://username:password@localhost:3306/database_name

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=public/uploads

# Logs
LOG_LEVEL=info

# Redis (optionnel)
REDIS_URL=redis://localhost:6379
```

4. **Configuration de la base de données**

### Pour PostgreSQL avec Prisma :
```bash
# Générer le client Prisma
npm run prisma:generate

# Créer et appliquer les migrations
npm run prisma:migrate

# (Optionnel) Ouvrir Prisma Studio
npm run prisma:studio
```

### Pour MongoDB avec Mongoose :
Assurez-vous que MongoDB est démarré et accessible via l'URI configurée.

## 🚀 Utilisation

### Démarrage en développement
```bash
npm run dev
```

### Démarrage avec ts-node
```bash
npm run dev:ts
```

### Build et démarrage en production
```bash
npm run build
npm start
```

### Autres commandes utiles
```bash
# Nettoyage du dossier dist
npm run clean

# Vérification des types TypeScript
npm run type-check

# Commandes Prisma
npm run prisma:generate    # Générer le client
npm run prisma:migrate     # Créer une migration
npm run prisma:studio      # Ouvrir Prisma Studio
npm run prisma:reset       # Reset de la base de données
npm run prisma:deploy      # Déployer les migrations
```

## 📁 Structure du projet

```
├── prisma/
│   └── schema.prisma          # Schéma Prisma
├── public/                    # Fichiers statiques
├── src/
│   ├── config/               # Configuration
│   │   ├── database.mongodb.ts
│   │   ├── database.prisma.ts
│   │   ├── environnement.ts
│   │   ├── mailer.ts
│   │   └── prisma.ts
│   ├── controllers/          # Contrôleurs
│   │   ├── auth.controller.ts
│   │   └── user.controller.ts
│   ├── html/                 # Templates HTML d'erreur
│   │   ├── 403.html
│   │   ├── 404.html
│   │   └── 500.html
│   ├── middlewares/          # Middlewares
│   │   ├── apiCheck.middleware.ts
│   │   ├── auth.middleware.ts
│   │   └── errorHandlers.ts
│   ├── models/               # Modèles MongoDB
│   │   └── user.model.ts
│   ├── routes/               # Routes
│   │   ├── auth.routes.ts
│   │   └── user.routes.ts
│   ├── services/             # Services métier
│   │   ├── users.service.mongodb.ts
│   │   └── users.service.prisma.ts
│   ├── utils/                # Utilitaires
│   │   ├── index.ts
│   │   └── validate.util.ts
│   ├── validation/           # Schémas de validation
│   │   └── auth.validation.ts
│   └── index.ts              # Point d'entrée
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

## 🔐 Authentification

Le système d'authentification utilise JWT avec les endpoints suivants :

### Endpoints d'authentification

```typescript
POST /auth/login     # Connexion utilisateur
GET  /auth/logout    # Déconnexion utilisateur  
GET  /auth/me        # Informations utilisateur connecté (protégé)
```

### Exemple d'utilisation

**Connexion :**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Accès aux ressources protégées :**
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer <votre-token-jwt>"
```

## 🗄️ Base de données

Ce boilerplate supporte deux systèmes de base de données :

### PostgreSQL avec Prisma
- ORM moderne avec génération de types TypeScript
- Migrations automatiques
- Interface graphique avec Prisma Studio

##***REMOVED*** avec Mongoose
- ODM flexible pour MongoDB
- Schémas dynamiques
- Support des requêtes MongoDB avancées

**Note :** Les services sont organisés par type de base de données. Vous pouvez choisir d'utiliser l'un ou l'autre selon vos besoins.

## 🛡️ Sécurité

### Fonctionnalités de sécurité incluses :

- **Rate Limiting** : Protection contre les attaques par déni de service
- **CORS** : Configuration des origines autorisées
- **Validation API Key** : Middleware de vérification de clé API
- **Hachage des mots de passe** : Utilisation de bcrypt
- **Cookies sécurisés** : Configuration HTTPOnly et Secure en production
- **Validation des données** : Schémas Zod pour valider les entrées

## 📧 Configuration Email

Pour utiliser l'envoi d'emails, configurez les variables SMTP dans votre fichier `.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🔧 Personnalisation

### Ajouter un nouveau module

1. **Créer le modèle** (si MongoDB) dans `src/models/`
2. **Mettre à jour le schéma Prisma** (si PostgreSQL) dans `prisma/schema.prisma`
3. **Créer le service** dans `src/services/`
4. **Créer le contrôleur** dans `src/controllers/`
5. **Définir les routes** dans `src/routes/`
6. **Ajouter la validation** dans `src/validation/`

### Exemple d'ajout d'un module "Article"

```typescript
// src/models/article.model.ts (MongoDB)
import { Schema, model } from 'mongoose';

const articleSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default model('Article', articleSchema);
```

```prisma
// prisma/schema.prisma (PostgreSQL)
model Article {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  author    String
  createdAt DateTime @default(now())
}
```

## 🐛 Gestion des erreurs

Le système de gestion d'erreurs inclut :

- **Middleware d'erreurs global** 
- **Pages d'erreur personnalisées** (403, 404, 500)
- **Logging des erreurs**
- **Réponses JSON standardisées**

## 📊 Monitoring et Logs

- **Logs structurés** avec différents niveaux (info, error, warn)
- **Monitoring des performances** avec compression
- **Métriques de rate limiting**

## 🚀 Déploiement

### Variables d'environnement production

Assurez-vous de configurer les variables suivantes pour la production :

```env
NODE_ENV=production
JWT_SECRET=<clé-très-sécurisée>
API_KEY=<clé-api-sécurisée>
DATABASE_URL=<url-base-données-production>
CORS_ORIGIN=<url-frontend-production>
```

### Docker (optionnel)

Vous pouvez ajouter un `Dockerfile` pour containeriser l'application :

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :

1. Vérifiez la [documentation](#)
2. Consultez les [issues ouvertes](https://github.com/votre-repo/issues)
3. Créez une [nouvelle issue](https://github.com/votre-repo/issues/new)

---

**Happy coding! 🎉**