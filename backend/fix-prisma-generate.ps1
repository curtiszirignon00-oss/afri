# Script pour résoudre l'erreur EPERM de Prisma Generate
# Exécuter avec: .\fix-prisma-generate.ps1

Write-Host "=== Résolution de l'erreur EPERM Prisma ===" -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter tous les processus Node.js
Write-Host "Étape 1: Arrêt des processus Node.js en cours..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Supprimer le dossier .prisma
Write-Host "Étape 2: Suppression du dossier .prisma..." -ForegroundColor Yellow
$prismaPath = ".\node_modules\.prisma"
if (Test-Path $prismaPath) {
    Remove-Item -Path $prismaPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Dossier .prisma supprimé" -ForegroundColor Green
} else {
    Write-Host "Dossier .prisma n'existe pas" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# 3. Supprimer le dossier @prisma/client
Write-Host "Étape 3: Suppression du dossier @prisma/client..." -ForegroundColor Yellow
$clientPath = ".\node_modules\@prisma\client"
if (Test-Path $clientPath) {
    Remove-Item -Path $clientPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Dossier @prisma/client supprimé" -ForegroundColor Green
} else {
    Write-Host "Dossier @prisma/client n'existe pas" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# 4. Régénérer Prisma
Write-Host ""
Write-Host "Étape 4: Génération du client Prisma..." -ForegroundColor Yellow
Write-Host ""
npx prisma generate

Write-Host ""
Write-Host "=== Terminé ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si l'erreur persiste, consultez PRISMA_EPERM_FIX.md pour d'autres solutions" -ForegroundColor Gray
