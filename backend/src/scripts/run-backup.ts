/**
 * Script pour exécuter un backup manuel
 *
 * Usage: npx ts-node src/scripts/run-backup.ts
 *
 * Ce script effectue une sauvegarde complète de toutes les données
 * de la base de données vers le dossier /backups
 */

import { runFullBackup } from '../services/backup.service';

async function main() {
  console.log('═'.repeat(60));
  console.log('🔄 EXÉCUTION MANUELLE DU BACKUP');
  console.log('═'.repeat(60));
  console.log('');

  try {
    const backupPath = await runFullBackup();

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ BACKUP TERMINÉ AVEC SUCCÈS');
    console.log('═'.repeat(60));
    console.log(`📁 Fichiers sauvegardés dans: ${backupPath}`);
    console.log('');
    console.log('Vous pouvez maintenant copier ce dossier vers un stockage externe');
    console.log('(Google Drive, Dropbox, disque externe, etc.) pour plus de sécurité.');

  } catch (error: any) {
    console.error('');
    console.error('═'.repeat(60));
    console.error('❌ ERREUR LORS DU BACKUP');
    console.error('═'.repeat(60));
    console.error(error.message);
    process.exit(1);
  }
}

main();
