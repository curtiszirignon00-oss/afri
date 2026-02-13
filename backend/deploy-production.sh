#!/bin/bash
# Script de déploiement et correction pour la production
# Usage: Copier ce script sur le serveur et l'exécuter

echo "🚀 Déploiement et Correction - Production AfriBourse"
echo "===================================================="

# 1. Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    echo "   Assurez-vous d'être dans le dossier backend"
    exit 1
fi

echo "✅ Dossier backend détecté"

# 2. Sauvegarder l'ancien .env
echo ""
echo "📦 Sauvegarde de la configuration actuelle..."
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ .env sauvegardé"
else
    echo "⚠️  Aucun .env trouvé (sera créé)"
fi

# 3. Vérifier les variables SMTP
echo ""
echo "🔍 Vérification de la configuration SMTP..."
if [ -f ".env" ]; then
    if grep -q "SMTP_HOST=smtp-relay.brevo.com" .env; then
        echo "✅ SMTP_HOST configuré"
    else
        echo "❌ SMTP_HOST manquant ou incorrect"
    fi

    if grep -q "SMTP_PORT=587" .env; then
        echo "✅ SMTP_PORT configuré"
    else
        echo "❌ SMTP_PORT manquant"
    fi

    if grep -q "SMTP_USER=" .env && ! grep -q "SMTP_USER=$" .env; then
        echo "✅ SMTP_USER configuré"
    else
        echo "❌ SMTP_USER manquant"
    fi

    if grep -q "SMTP_PASS=" .env && ! grep -q "SMTP_PASS=$" .env; then
        echo "✅ SMTP_PASS configuré"
    else
        echo "❌ SMTP_PASS manquant"
    fi
else
    echo "❌ Fichier .env non trouvé"
fi

# 4. Tester la connexion SMTP
echo ""
echo "🔌 Test de connectivité SMTP..."
if command -v nc &> /dev/null; then
    if nc -zv smtp-relay.brevo.com 587 2>&1 | grep -q "succeeded"; then
        echo "✅ Connexion au serveur SMTP réussie"
    else
        echo "❌ Impossible de se connecter à smtp-relay.brevo.com:587"
        echo "   Le firewall bloque peut-être le port 587"
    fi
elif command -v telnet &> /dev/null; then
    timeout 3 telnet smtp-relay.brevo.com 587 2>&1 | grep -q "Connected" && \
        echo "✅ Connexion au serveur SMTP réussie" || \
        echo "❌ Impossible de se connecter à smtp-relay.brevo.com:587"
else
    echo "⚠️  nc ou telnet non disponible, impossible de tester"
fi

# 5. Installer/Mettre à jour les dépendances
echo ""
echo "📦 Installation des dépendances..."
if command -v npm &> /dev/null; then
    npm install
    echo "✅ Dépendances installées"
else
    echo "❌ npm non trouvé"
    exit 1
fi

# 6. Compiler TypeScript (si nécessaire)
echo ""
echo "🔨 Compilation TypeScript..."
if [ -f "tsconfig.json" ]; then
    if command -v npx &> /dev/null; then
        npx tsc --noEmit && echo "✅ TypeScript compilé sans erreurs" || echo "⚠️  Erreurs de compilation détectées"
    fi
fi

# 7. Tester SMTP avec le script
echo ""
echo "📧 Test d'envoi d'email..."
if [ -f "src/scripts/test-smtp.ts" ]; then
    echo "Exécution du test SMTP (cela peut prendre quelques secondes)..."
    npx tsx src/scripts/test-smtp.ts
    if [ $? -eq 0 ]; then
        echo "✅ Test SMTP réussi"
    else
        echo "❌ Test SMTP échoué - Vérifiez la configuration"
    fi
else
    echo "⚠️  Script test-smtp.ts non trouvé"
fi

# 8. Déterminer le gestionnaire de processus
echo ""
echo "🔄 Redémarrage du serveur..."

if command -v pm2 &> /dev/null; then
    echo "Utilisation de PM2..."
    pm2 restart afribourse-backend || pm2 restart all
    echo "✅ Serveur redémarré avec PM2"
    echo ""
    echo "📋 Logs (15 dernières lignes):"
    pm2 logs afribourse-backend --lines 15 --nostream

elif command -v docker-compose &> /dev/null; then
    echo "Utilisation de Docker Compose..."
    docker-compose restart backend
    echo "✅ Container backend redémarré"
    echo ""
    echo "📋 Logs (15 dernières lignes):"
    docker-compose logs backend --tail 15

elif command -v systemctl &> /dev/null; then
    echo "Utilisation de systemd..."
    sudo systemctl restart afribourse
    echo "✅ Service redémarré"
    echo ""
    echo "📋 Logs (15 dernières lignes):"
    sudo journalctl -u afribourse -n 15

else
    echo "⚠️  Aucun gestionnaire de processus détecté"
    echo "   Vous devrez redémarrer manuellement"
fi

# 9. Résumé
echo ""
echo "===================================================="
echo "✅ Déploiement terminé"
echo "===================================================="
echo ""
echo "📋 Prochaines étapes:"
echo "1. Vérifiez les logs ci-dessus pour détecter des erreurs"
echo "2. Testez une inscription sur le frontend"
echo "3. Surveillez les logs en temps réel:"
echo ""
if command -v pm2 &> /dev/null; then
    echo "   pm2 logs afribourse-backend"
elif command -v docker-compose &> /dev/null; then
    echo "   docker-compose logs -f backend"
elif command -v systemctl &> /dev/null; then
    echo "   sudo journalctl -u afribourse -f"
fi
echo ""
echo "4. Si problème persiste, envoyez les logs à l'équipe de support"
echo ""
