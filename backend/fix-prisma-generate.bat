@echo off
REM Script pour résoudre l'erreur EPERM de Prisma Generate
REM Exécuter avec: .\fix-prisma-generate.bat

echo ================================================
echo === Resolution de l'erreur EPERM Prisma ===
echo ================================================
echo.

REM 1. Arrêter tous les processus Node.js
echo Etape 1: Arret des processus Node.js en cours...
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

REM 2. Supprimer le dossier .prisma
echo Etape 2: Suppression du dossier .prisma...
if exist "node_modules\.prisma" (
    rmdir /S /Q "node_modules\.prisma"
    echo Dossier .prisma supprime
) else (
    echo Dossier .prisma n'existe pas
)
timeout /t 2 >nul

REM 3. Supprimer le dossier @prisma/client
echo Etape 3: Suppression du dossier @prisma/client...
if exist "node_modules\@prisma\client" (
    rmdir /S /Q "node_modules\@prisma\client"
    echo Dossier @prisma/client supprime
) else (
    echo Dossier @prisma/client n'existe pas
)
timeout /t 2 >nul

REM 4. Régénérer Prisma
echo.
echo Etape 4: Generation du client Prisma...
echo.
call npx prisma generate

echo.
echo ================================================
echo === Termine ===
echo ================================================
echo.
echo Si l'erreur persiste, consultez PRISMA_EPERM_FIX.md
pause
