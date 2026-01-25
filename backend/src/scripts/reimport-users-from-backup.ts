/**
 * Script de réimportation des utilisateurs depuis l'export Excel
 *
 * IMPORTANT: Les utilisateurs devront réinitialiser leur mot de passe
 * car les mots de passe hashés ne sont pas dans l'export.
 *
 * Usage: npx ts-node src/scripts/reimport-users-from-backup.ts
 */

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import * as path from 'path';

const prisma = new PrismaClient();

// Chemin vers le fichier d'export
const EXPORT_FILE = path.join(__dirname, '../../exports/users-export-2026-01-05T19-06-11.xlsx');

// Mot de passe temporaire (les utilisateurs devront le réinitialiser)
const TEMP_PASSWORD = 'RESET_REQUIRED_2026';

interface ExportedUser {
  ID: string;
  'Prénom': string;
  'Nom': string;
  'Email': string;
  'Téléphone': string;
  'Adresse': string;
  'Rôle': string;
  'Email vérifié': string;
  'Date de vérification': string;
  "Date d'inscription": string;
  'Dernière mise à jour': string;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'Non renseigné') return null;

  // Format: "07/11/2025 05:01:18" (DD/MM/YYYY HH:mm:ss)
  const parts = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
  if (parts) {
    const [, day, month, year, hour, min, sec] = parts;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(min),
      parseInt(sec)
    );
  }
  return null;
}

async function main() {
  console.log('='.repeat(60));
  console.log('RÉIMPORTATION DES UTILISATEURS DEPUIS LE BACKUP');
  console.log('='.repeat(60));
  console.log(`\nFichier source: ${EXPORT_FILE}\n`);

  // Lire le fichier Excel
  const workbook = XLSX.readFile(EXPORT_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const users: ExportedUser[] = XLSX.utils.sheet_to_json(sheet);

  console.log(`📊 Nombre d'utilisateurs à réimporter: ${users.length}\n`);

  // Hasher le mot de passe temporaire
  const hashedPassword = await bcrypt.hash(TEMP_PASSWORD, 10);

  let created = 0;
  let skipped = 0;
  let errors: string[] = [];

  for (const exportedUser of users) {
    const email = exportedUser['Email']?.toLowerCase().trim();

    if (!email) {
      console.log(`⚠️  Utilisateur sans email ignoré: ${exportedUser['Prénom']} ${exportedUser['Nom']}`);
      skipped++;
      continue;
    }

    // Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      console.log(`⏭️  ${email} existe déjà, ignoré`);
      skipped++;
      continue;
    }

    try {
      const telephone = exportedUser['Téléphone'] !== 'Non renseigné'
        ? exportedUser['Téléphone']
        : null;

      const address = exportedUser['Adresse'] !== 'Non renseigné'
        ? exportedUser['Adresse']
        : null;

      const emailVerifiedAt = exportedUser['Email vérifié'] === 'Oui'
        ? parseDate(exportedUser['Date de vérification']) || new Date()
        : null;

      const createdAt = parseDate(exportedUser["Date d'inscription"]);

      const newUser = await prisma.user.create({
        data: {
          name: exportedUser['Prénom'] || 'Utilisateur',
          lastname: exportedUser['Nom'] || '',
          email: email,
          password: hashedPassword,
          telephone: telephone,
          address: address,
          role: exportedUser['Rôle'] || 'user',
          email_verified_at: emailVerifiedAt,
          created_at: createdAt || new Date(),
          // Marquer le compte comme nécessitant un reset de mot de passe
          password_reset_token: 'IMPORT_RESET_REQUIRED',
        }
      });

      // Créer le profil de base
      await prisma.userProfile.create({
        data: {
          userId: newUser.id,
          first_name: exportedUser['Prénom'],
          last_name: exportedUser['Nom'],
        }
      });

      // Créer le portfolio sandbox par défaut
      await prisma.portfolio.create({
        data: {
          userId: newUser.id,
          name: 'Mon Portefeuille',
          initial_balance: 1000000,
          cash_balance: 1000000,
          is_virtual: true,
          wallet_type: 'SANDBOX',
        }
      });

      console.log(`✅ ${email} créé avec succès`);
      created++;
    } catch (error: any) {
      console.error(`❌ Erreur pour ${email}: ${error.message}`);
      errors.push(`${email}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('RÉSUMÉ DE LA RÉIMPORTATION');
  console.log('='.repeat(60));
  console.log(`✅ Utilisateurs créés: ${created}`);
  console.log(`⏭️  Utilisateurs ignorés (déjà existants ou sans email): ${skipped}`);
  console.log(`❌ Erreurs: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nDétails des erreurs:');
    errors.forEach(e => console.log(`  - ${e}`));
  }

  console.log('\n⚠️  IMPORTANT:');
  console.log('   Les utilisateurs doivent réinitialiser leur mot de passe');
  console.log('   via la fonctionnalité "Mot de passe oublié".\n');
  console.log('   Vous pouvez aussi leur envoyer un email avec le lien de reset.\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
