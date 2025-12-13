# Configuration d'un Domaine Personnalisé - Brevo

## 🎯 Objectif

Utiliser `noreply@africbourse.com` au lieu de `9ab467001@smtp-brevo.com` comme adresse d'expéditeur.

## 📋 Prérequis

- Accès au panneau de configuration DNS de votre domaine `africbourse.com`
- Compte Brevo actif
- Droits d'administrateur sur le domaine

---

## 🚀 Étapes de Configuration

### 1. Ajouter l'expéditeur dans Brevo

1. Connectez-vous à https://app.brevo.com
2. Allez dans **Senders** → **Add a sender**
3. Entrez: `noreply@africbourse.com`
4. Entrez votre nom: `Africbourse` ou `AfriBourse`
5. Cliquez sur **Add**

### 2. Vérifier le domaine

Brevo vous demandera de vérifier le domaine. Vous aurez deux enregistrements DNS à ajouter:

#### A. Enregistrement SPF

**Type:** TXT
**Nom/Host:** @ ou africbourse.com
**Valeur:**
```
v=spf1 include:spf.sendinblue.com mx ~all
```

**TTL:** 3600 (ou valeur par défaut)

#### B. Enregistrement DKIM

Brevo vous fournira un enregistrement DKIM unique. Il ressemblera à:

**Type:** TXT
**Nom/Host:** `mail._domainkey.africbourse.com`
**Valeur:** (fournie par Brevo)

**TTL:** 3600

### 3. Attendre la propagation DNS

- La propagation DNS peut prendre de **quelques minutes à 48 heures**
- Généralement, c'est effectif en **15-30 minutes**

### 4. Vérifier dans Brevo

1. Retournez dans **Senders**
2. Cliquez sur **Verify** à côté de votre email
3. Brevo vérifiera automatiquement les enregistrements DNS

✅ Une fois vérifié, l'email aura un badge **Verified**

### 5. Mettre à jour le backend

Une fois l'email vérifié, mettez à jour votre configuration:

**Fichier: `backend/.env`**
```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=9ab467001@smtp-brevo.com  # Gardez l'identifiant SMTP
SMTP_PASS=***REMOVED***
SMTP_FROM_EMAIL=noreply@africbourse.com  # Nouvelle variable
SMTP_FROM_NAME=AfriBourse
```

**Fichier: `backend/src/config/environnement.ts`**

Ajoutez dans l'interface `IConfig`:
```typescript
email: {
  host: string | undefined,
  port: number | undefined,
  user: string | undefined,
  pass: string | undefined,
  from: string | undefined,      // NOUVEAU
  fromName: string | undefined,  // NOUVEAU
},
```

Puis dans la config:
```typescript
email: {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
  fromName: process.env.SMTP_FROM_NAME || 'AfriBourse',
},
```

**Fichier: `backend/src/services/email.service.ts`**

Modifiez la ligne 167:
```typescript
// Avant:
from: `"AfriBourse" <${config.email.user}>`,

// Après:
from: `"${config.email.fromName}" <${config.email.from}>`,
```

### 6. Tester

```bash
cd backend
npm run dev

# Dans un autre terminal
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "lastname": "User",
    "email": "votre-email@gmail.com",
    "password": "Test123"
  }'
```

Vérifiez que l'email reçu provient de `noreply@africbourse.com`

---

## 🔧 Configuration DNS - Exemples par Provider

### OVH
1. Allez dans **Web Cloud** → **Nom de domaine**
2. Sélectionnez `africbourse.com`
3. Onglet **Zone DNS**
4. Cliquez sur **Ajouter une entrée**
5. Sélectionnez **TXT**
6. Ajoutez les enregistrements SPF et DKIM

### Cloudflare
1. Sélectionnez votre domaine
2. Allez dans **DNS**
3. Cliquez sur **Add record**
4. Type: **TXT**
5. Ajoutez les enregistrements

### GoDaddy
1. **My Products** → **DNS**
2. Cliquez sur **Add** dans la section DNS Records
3. Type: **TXT**
4. Ajoutez les enregistrements

### Namecheap
1. **Domain List** → Cliquez sur **Manage**
2. **Advanced DNS**
3. Cliquez sur **Add New Record**
4. Type: **TXT Record**

---

## ✅ Vérification

### Vérifier SPF
```bash
nslookup -type=txt africbourse.com
```

Devrait retourner:
```
v=spf1 include:spf.sendinblue.com mx ~all
```

### Vérifier DKIM
```bash
nslookup -type=txt mail._domainkey.africbourse.com
```

### Outil en ligne
https://mxtoolbox.com/SuperTool.aspx
- Entrez: `africbourse.com`
- Vérifiez SPF et DKIM

---

## 🎯 Avantages

✅ **Professionnalisme** - Email de votre propre domaine
✅ **Confiance** - Les utilisateurs reconnaissent votre marque
✅ **Délivrabilité** - Meilleur taux de réception
✅ **Anti-spam** - Moins de chances d'être marqué comme spam
✅ **Tracking** - Statistiques détaillées dans Brevo

---

## 📊 Résultat Final

**Avant:**
```
De: AfriBourse <9ab467001@smtp-brevo.com>
```

**Après:**
```
De: AfriBourse <noreply@africbourse.com>
```

---

## 🚨 Note Importante

**Pour l'authentification SMTP:**
- Continuez à utiliser `9ab467001@smtp-brevo.com` comme `SMTP_USER`
- Utilisez `noreply@africbourse.com` uniquement comme `FROM` (expéditeur)

Brevo utilise l'identifiant SMTP pour l'authentification, mais permet d'envoyer depuis n'importe quelle adresse vérifiée.

---

## 📞 Support

Si vous rencontrez des problèmes:
- Support Brevo: https://help.brevo.com
- Vérification DNS: https://mxtoolbox.com

---

**Configuration recommandée pour la production!** 🚀
