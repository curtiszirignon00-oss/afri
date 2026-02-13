# 🔍 Diagnostic : Emails Ne S'envoient Pas Après Configuration Render

**Date:** 05 Janvier 2026
**Problème:** Variables configurées sur Render, mais emails toujours pas envoyés

---

## 📋 Informations à Me Fournir

Pour identifier le problème exact, j'ai besoin de ces informations :

### 1. URL de Votre Backend Render

**Question:** Quelle est l'URL complète de votre service backend sur Render ?

Exemple : `https://afribourse-backend.onrender.com`

**Votre URL:** `_______________________________`

---

### 2. Logs de Render

**Comment récupérer les logs :**

1. Allez sur https://dashboard.render.com
2. Cliquez sur votre service backend
3. Cliquez sur **"Logs"** dans le menu de gauche
4. Faites une inscription test depuis le frontend
5. **Copiez les 30-50 dernières lignes** des logs

**Cherchez spécifiquement :**
- Les lignes contenant `[REGISTER]`
- Les lignes contenant `[EMAIL]`
- Les lignes contenant `SMTP`
- Toutes les lignes d'erreur (en rouge ou avec `❌` ou `Error`)

**Collez les logs ici :**
```
[Collez vos logs ici]
```

---

### 3. Variables d'Environnement Configurées

**Sur Render, dans Environment > Environment Variables**, vérifiez ces variables :

- [ ] `SMTP_HOST` existe et = `smtp-relay.brevo.com`
- [ ] `SMTP_PORT` existe et = `587`
- [ ] `SMTP_USER` existe et = `9ab467001@smtp-brevo.com`
- [ ] `SMTP_PASS` existe (valeur masquée)
- [ ] `SMTP_FROM_EMAIL` existe et = `noreply@africbourse.com`
- [ ] `SMTP_FROM_NAME` existe et = `AfriBourse`
- [ ] `FRONTEND_URL` existe et = `https://www.africbourse.com`
- [ ] `BACKEND_URL` existe et = l'URL de votre service Render

**Cochez les cases ci-dessus** pour confirmer.

**Question importante:** Avez-vous bien cliqué sur **"Save Changes"** après avoir ajouté les variables ?
- [ ] Oui
- [ ] Non
- [ ] Je ne me souviens pas

---

### 4. Test Direct de l'API

Testez votre API directement avec cette commande :

**⚠️ REMPLACEZ `VOTRE-URL-RENDER` par votre vraie URL !**

```bash
curl -X POST https://VOTRE-URL-RENDER/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TestDiag",
    "lastname": "Render",
    "email": "test.diagnostic@example.com",
    "password": "Test123456"
  }'
```

**Collez la réponse ici :**
```json
[Collez la réponse JSON ici]
```

**Cherchez dans la réponse :**
- `"emailSent": true` ou `"emailSent": false` ?
- Y a-t-il un champ `"emailError"` ? Si oui, quelle est sa valeur ?

---

## 🔍 Causes Probables (à Vérifier)

### Cause 1 : Le Service N'a Pas Redémarré

**Symptôme:** Vous avez ajouté les variables mais Render n'a pas redéployé.

**Vérification:**
1. Dans le dashboard Render, regardez en haut
2. Y a-t-il un message "Deploying..." ou un historique récent de déploiement ?
3. Le dernier déploiement date de quand ?

**Solution:**
1. Cliquez sur **"Manual Deploy"** dans le menu
2. Sélectionnez **"Deploy latest commit"**
3. Attendez 3-5 minutes
4. Retestez

---

### Cause 2 : Port 587 Bloqué par Render

**Symptôme:** Dans les logs, vous voyez :
```
Error: connect ETIMEDOUT smtp-relay.brevo.com:587
```
ou
```
Error: connect ECONNREFUSED
```

**Solution:** Render Free bloque parfois le port 587. Il faut utiliser le port 465 (SSL).

**Actions à faire :**

#### Option A : Modifier Uniquement la Variable (RAPIDE)

1. Sur Render, changez `SMTP_PORT` de `587` à `465`
2. Redéployez manuellement

**⚠️ PROBLÈME** : Le code utilise `secure: false` qui est incompatible avec le port 465.

#### Option B : Modifier le Code (RECOMMANDÉ)

Je vais créer un script qui détecte automatiquement le bon mode selon le port.

---

### Cause 3 : Variables Mal Nommées

**Symptôme:** Erreur dans les logs :
```
Environment variable SMTP_HOST is required
```

**Vérification:**
- Les noms des variables sont-ils **EXACTEMENT** comme indiqué ? (sensible à la casse)
- Pas d'espaces avant/après les noms ?
- Pas de caractères invisibles ?

**Solution:**
1. Supprimez toutes les variables SMTP
2. Recréez-les une par une en copiant-collant les noms exacts

---

### Cause 4 : Le Code Déployé est Ancien

**Symptôme:** Le code sur Render n'a pas les modifications récentes avec les logs détaillés.

**Vérification:**

Sur Render, dans **Settings** :
- Quelle branche est déployée ? (devrait être `master` ou `main`)
- Le dernier commit correspond-il à votre dernier push GitHub ?

**Solution:**
1. Sur votre machine locale, vérifiez que le code est poussé :
```bash
cd c:\Users\HP\OneDrive\Desktop\afri\backend
git status
git log -1
```

2. Si besoin, poussez :
```bash
git add .
git commit -m "Fix: Configuration email pour Render"
git push origin master
```

3. Render redéploiera automatiquement

---

### Cause 5 : SMTP_FROM_EMAIL Non Vérifié dans Brevo

**Symptôme:** Dans les logs :
```
Error: 5.7.1 Sender address rejected
```
ou
```
Error: Invalid MAIL FROM address
```

**Vérification:**
1. Allez sur https://app.brevo.com
2. **Senders, Domains & Dedicated IPs** → **Senders**
3. Est-ce que `noreply@africbourse.com` est dans la liste ?
4. Est-ce qu'il a un statut **"Verified"** ✅ ?

**Solutions:**

**Solution Temporaire (IMMÉDIATE) :**
Utilisez l'email Brevo par défaut :
- Changez `SMTP_FROM_EMAIL` sur Render en `9ab467001@smtp-brevo.com`
- Redéployez
- Testez

**Solution Définitive :**
Vérifiez le domaine `africbourse.com` dans Brevo (nécessite accès aux DNS).

---

### Cause 6 : Identifiants SMTP Incorrects

**Symptôme:** Dans les logs :
```
Error: Invalid login: 535 Authentication failed
```

**Vérification:**
1. Allez sur https://app.brevo.com
2. **Settings** → **SMTP & API**
3. Vérifiez :
   - **SMTP Login** (devrait être `9ab467001@smtp-brevo.com`)
   - **SMTP Master Password Key**

**Solution:**
Si les identifiants ont changé, régénérez une nouvelle clé :
1. Dans Brevo, cliquez sur **"Generate a new SMTP key"**
2. Copiez la nouvelle clé
3. Sur Render, mettez à jour `SMTP_PASS` avec la nouvelle clé
4. Sauvegardez et redéployez

---

## 🛠️ Actions Immédiates à Faire

### Étape 1 : Tester la Connexion SMTP Depuis Render

Je vais créer un script de test que vous pourrez exécuter directement sur Render Shell.

### Étape 2 : Vérifier les Logs en Temps Réel

1. Ouvrez les logs Render
2. Faites une inscription depuis le frontend
3. Observez en temps réel ce qui se passe

### Étape 3 : Test avec Port 465

Si le port 587 est bloqué, je vais modifier le code pour supporter automatiquement les deux ports.

---

## 📝 Formulaire de Diagnostic

Remplissez ce formulaire pour que je puisse vous aider précisément :

```
1. URL de votre backend Render : ___________________________

2. Dernier déploiement : Il y a ______ minutes/heures

3. Variables SMTP configurées sur Render : OUI ☐  NON ☐

4. Service redémarré après ajout des variables : OUI ☐  NON ☐

5. Test curl effectué : OUI ☐  NON ☐
   Si OUI, emailSent = ________ (true/false)

6. Logs contiennent "Error" : OUI ☐  NON ☐
   Si OUI, quel type d'erreur ? _________________________

7. Plan Render : Free ☐  Paid ☐

8. Branche déployée : ____________ (master, main, autre)

9. Email visible dans Brevo : OUI ☐  NON ☐

10. Avez-vous accès au Shell Render : OUI ☐  NON ☐
```

---

## 🚀 Prochaines Étapes

Une fois que vous m'aurez fourni :
1. ✅ Les logs de Render (après une inscription test)
2. ✅ La réponse du test curl
3. ✅ Le formulaire de diagnostic rempli

Je pourrai :
- 🎯 Identifier le problème exact
- 🔧 Créer une solution sur mesure
- ✅ Vérifier que les emails s'envoient

---

**En attendant, faites ceci IMMÉDIATEMENT :**

1. **Testez avec l'email Brevo par défaut** :
   - Sur Render, changez `SMTP_FROM_EMAIL` en `9ab467001@smtp-brevo.com`
   - Sauvegardez
   - Attendez le redéploiement (3-5 min)
   - Testez une inscription
   - Vérifiez si l'email arrive

2. **Vérifiez le dernier déploiement** :
   - Sur Render, regardez quand le service a été déployé pour la dernière fois
   - Si c'était avant d'ajouter les variables → Redéployez manuellement

3. **Copiez les logs** et envoyez-les moi !
