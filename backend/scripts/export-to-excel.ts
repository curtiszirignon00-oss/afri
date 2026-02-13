/**
 * Script d'exportation des données en Excel
 * Exporte les tables: users, transactions, learning_progress
 * 
 * Usage: npx ts-node scripts/export-to-excel.ts
 */

import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportToExcel() {
    try {
        console.log('📊 Démarrage de l\'exportation des données...\n');

        // Créer le dossier exports s'il n'existe pas
        const exportsDir = path.join(__dirname, '..', 'exports');
        if (!fs.existsSync(exportsDir)) {
            fs.mkdirSync(exportsDir, { recursive: true });
        }

        // Date pour nommer les fichiers
        const timestamp = new Date().toISOString().split('T')[0];

        // ========================================
        // 1. EXPORT USERS
        // ========================================
        console.log('👥 Export des utilisateurs...');
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                lastname: true,
                email: true,
                telephone: true,
                address: true,
                role: true,
                subscriptionTier: true,
                email_verified_at: true,
                created_at: true,
                updated_at: true,
                posts_count: true,
            },
        });

        const workbookUsers = new ExcelJS.Workbook();
        const worksheetUsers = workbookUsers.addWorksheet('Users');

        // Définir les colonnes
        worksheetUsers.columns = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'Prénom', key: 'name', width: 20 },
            { header: 'Nom', key: 'lastname', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Téléphone', key: 'telephone', width: 15 },
            { header: 'Adresse', key: 'address', width: 30 },
            { header: 'Rôle', key: 'role', width: 15 },
            { header: 'Abonnement', key: 'subscriptionTier', width: 15 },
            { header: 'Email Vérifié', key: 'email_verified_at', width: 20 },
            { header: 'Date Création', key: 'created_at', width: 20 },
            { header: 'Date Modification', key: 'updated_at', width: 20 },
            { header: 'Nombre Posts', key: 'posts_count', width: 15 },
        ];

        // Ajouter les données
        worksheetUsers.addRows(users);

        // Style pour l'en-tête
        worksheetUsers.getRow(1).font = { bold: true };
        worksheetUsers.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4CAF50' },
        };

        const usersFilePath = path.join(exportsDir, `users_${timestamp}.xlsx`);
        await workbookUsers.xlsx.writeFile(usersFilePath);
        console.log(`✅ ${users.length} utilisateurs exportés vers: ${usersFilePath}\n`);

        // ========================================
        // 2. EXPORT TRANSACTIONS
        // ========================================
        console.log('💰 Export des transactions...');
        const transactions = await prisma.transaction.findMany({
            select: {
                id: true,
                stock_ticker: true,
                type: true,
                quantity: true,
                price_per_share: true,
                created_at: true,
                execution_day: true,
                was_weekend: true,
                portfolioId: true,
            },
            orderBy: {
                created_at: 'desc',
            },
        });

        const workbookTransactions = new ExcelJS.Workbook();
        const worksheetTransactions = workbookTransactions.addWorksheet('Transactions');

        // Définir les colonnes
        worksheetTransactions.columns = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'Ticker', key: 'stock_ticker', width: 15 },
            { header: 'Type', key: 'type', width: 10 },
            { header: 'Quantité', key: 'quantity', width: 15 },
            { header: 'Prix Unitaire', key: 'price_per_share', width: 15 },
            { header: 'Montant Total', key: 'total_amount', width: 20 },
            { header: 'Date', key: 'created_at', width: 20 },
            { header: 'Jour Exécution', key: 'execution_day', width: 15 },
            { header: 'Weekend?', key: 'was_weekend', width: 12 },
            { header: 'Portfolio ID', key: 'portfolioId', width: 30 },
        ];

        // Ajouter les données avec calcul du montant total
        const transactionsData = transactions.map(t => ({
            ...t,
            total_amount: t.quantity * t.price_per_share,
        }));
        worksheetTransactions.addRows(transactionsData);

        // Style pour l'en-tête
        worksheetTransactions.getRow(1).font = { bold: true };
        worksheetTransactions.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2196F3' },
        };

        // Formater les colonnes de prix en monétaire
        worksheetTransactions.getColumn('price_per_share').numFmt = '#,##0.00 FCFA';
        worksheetTransactions.getColumn('total_amount').numFmt = '#,##0.00 FCFA';

        const transactionsFilePath = path.join(exportsDir, `transactions_${timestamp}.xlsx`);
        await workbookTransactions.xlsx.writeFile(transactionsFilePath);
        console.log(`✅ ${transactions.length} transactions exportées vers: ${transactionsFilePath}\n`);

        // ========================================
        // 3. EXPORT LEARNING PROGRESS
        // ========================================
        console.log('📚 Export des progrès d\'apprentissage...');
        const learningProgress = await prisma.learningProgress.findMany({
            select: {
                id: true,
                userId: true,
                moduleId: true,
                is_completed: true,
                quiz_score: true,
                quiz_attempts: true,
                last_quiz_attempt_at: true,
                time_spent_minutes: true,
                last_accessed_at: true,
                completed_at: true,
                user: {
                    select: {
                        name: true,
                        lastname: true,
                        email: true,
                    },
                },
                module: {
                    select: {
                        title: true,
                        slug: true,
                        difficulty_level: true,
                    },
                },
            },
            orderBy: {
                last_accessed_at: 'desc',
            },
        });

        const workbookLearning = new ExcelJS.Workbook();
        const worksheetLearning = workbookLearning.addWorksheet('Learning Progress');

        // Définir les colonnes
        worksheetLearning.columns = [
            { header: 'ID', key: 'id', width: 30 },
            { header: 'User ID', key: 'userId', width: 30 },
            { header: 'Nom Utilisateur', key: 'user_name', width: 20 },
            { header: 'Email', key: 'user_email', width: 30 },
            { header: 'Module ID', key: 'moduleId', width: 30 },
            { header: 'Titre Module', key: 'module_title', width: 40 },
            { header: 'Niveau Difficulté', key: 'difficulty_level', width: 15 },
            { header: 'Complété?', key: 'is_completed', width: 12 },
            { header: 'Score Quiz (%)', key: 'quiz_score', width: 15 },
            { header: 'Tentatives Quiz', key: 'quiz_attempts', width: 15 },
            { header: 'Temps Passé (min)', key: 'time_spent_minutes', width: 18 },
            { header: 'Dernier Accès', key: 'last_accessed_at', width: 20 },
            { header: 'Date Complétion', key: 'completed_at', width: 20 },
            { header: 'Dernière Tentative Quiz', key: 'last_quiz_attempt_at', width: 25 },
        ];

        // Ajouter les données avec aplatissement des relations
        const learningData = learningProgress.map(lp => ({
            id: lp.id,
            userId: lp.userId,
            user_name: `${lp.user.name} ${lp.user.lastname}`,
            user_email: lp.user.email,
            moduleId: lp.moduleId,
            module_title: lp.module.title,
            difficulty_level: lp.module.difficulty_level,
            is_completed: lp.is_completed ? 'Oui' : 'Non',
            quiz_score: lp.quiz_score,
            quiz_attempts: lp.quiz_attempts,
            time_spent_minutes: lp.time_spent_minutes,
            last_accessed_at: lp.last_accessed_at,
            completed_at: lp.completed_at,
            last_quiz_attempt_at: lp.last_quiz_attempt_at,
        }));
        worksheetLearning.addRows(learningData);

        // Style pour l'en-tête
        worksheetLearning.getRow(1).font = { bold: true };
        worksheetLearning.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF9800' },
        };

        const learningFilePath = path.join(exportsDir, `learning_progress_${timestamp}.xlsx`);
        await workbookLearning.xlsx.writeFile(learningFilePath);
        console.log(`✅ ${learningProgress.length} progrès d'apprentissage exportés vers: ${learningFilePath}\n`);

        // ========================================
        // RÉSUMÉ
        // ========================================
        console.log('🎉 Exportation terminée avec succès!');
        console.log('\n📁 Fichiers générés:');
        console.log(`   - ${usersFilePath}`);
        console.log(`   - ${transactionsFilePath}`);
        console.log(`   - ${learningFilePath}`);
        console.log('\n📊 Statistiques:');
        console.log(`   - ${users.length} utilisateurs`);
        console.log(`   - ${transactions.length} transactions`);
        console.log(`   - ${learningProgress.length} progrès d'apprentissage`);

    } catch (error) {
        console.error('❌ Erreur lors de l\'exportation:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Exécution du script
exportToExcel()
    .then(() => {
        console.log('\n✅ Script terminé.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    });
