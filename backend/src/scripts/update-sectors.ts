/// <reference types="node" />
// backend/src/scripts/update-sectors.ts

import { connectPrismaDatabase, disconnectPrismaDatabase } from '../config/database.prisma';
import prisma from '../config/prisma';

/**
 * Mapping manuel des secteurs pour chaque action BRVM
 * Source: Classification officielle BRVM fournie
 * 
 * Secteurs BRVM:
 * - Consommation de Base
 * - Consommation Discrétionnaire
 * - Energie
 * - Industriels
 * - Services Financiers
 * - Services Publics
 * - Télécommunications
 */

const SECTOR_MAPPING: Record<string, string> = {
  // === CONSOMMATION DE BASE ===
  'NTLC': 'Consommation de Base', // NESTLE COTE D'IVOIRE
  'PALC': 'Consommation de Base', // PALM COTE D'IVOIRE
  'SCRC': 'Consommation de Base', // SUCRIVOIRE COTE D'IVOIRE
  'SICC': 'Consommation de Base', // SICOR COTE D'IVOIRE
  'SLBC': 'Consommation de Base', // SOLIBRA COTE D'IVOIRE
  'SOGC': 'Consommation de Base', // SOGB COTE D'IVOIRE
  'SPHC': 'Consommation de Base', // SAPH COTE D'IVOIRE
  'STBC': 'Consommation de Base', // SITAB COTE D'IVOIRE
  'UNLC': 'Consommation de Base', // UNILEVER COTE D'IVOIRE

  // === CONSOMMATION DISCRÉTIONNAIRE ===
  'ABJC': 'Consommation Discrétionnaire', // SERVAIR ABIDJAN COTE D'IVOIRE
  'BNBC': 'Consommation Discrétionnaire', // BERNABE COTE D'IVOIRE
  'CFAC': 'Consommation Discrétionnaire', // CFAO MOTORS COTE D'IVOIRE
  'LNBB': 'Consommation Discrétionnaire', // LOTERIE NATIONALE DU BENIN
  'NEIC': 'Consommation Discrétionnaire', // NEI-CEDA COTE D'IVOIRE
  'PRSC': 'Consommation Discrétionnaire', // TRACTAFRIC MOTORS COTE D'IVOIRE
  'UNXC': 'Consommation Discrétionnaire', // UNIWAX COTE D'IVOIRE

  // === ENERGIE ===
  'SHEC': 'Energie', // VIVO ENERGY COTE D'IVOIRE
  'SMBC': 'Energie', // SMB COTE D'IVOIRE
  'TTLC': 'Energie', // TOTALENERGIES MARKETING COTE D'IVOIRE
  'TTLS': 'Energie', // TOTALENERGIES MARKETING SENEGAL

  // === INDUSTRIELS ===
  'CABC': 'Industriels', // SICABLE COTE D'IVOIRE
  'FTSC': 'Industriels', // FILTISAC COTE D'IVOIRE
  'SDSC': 'Industriels', // AFRICA GLOBAL LOGISTICS COTE D'IVOIRE
  'SEMC': 'Industriels', // EVIOSYS PACKAGING SIEM COTE D'IVOIRE
  'SIVC': 'Industriels', // AIR LIQUIDE COTE D'IVOIRE
  'STAC': 'Industriels', // SETAO COTE D'IVOIRE

  // === SERVICES FINANCIERS ===
  'BICB': 'Services Financiers', // BANQUE INTERNATIONALE POUR L'INDUSTRIE ET LE COMMERCE DU BENIN
  'BICC': 'Services Financiers', // BICI COTE D'IVOIRE
  'BOAB': 'Services Financiers', // BANK OF AFRICA BENIN
  'BOABF': 'Services Financiers', // BANK OF AFRICA BURKINA FASO
  'BOAC': 'Services Financiers', // BANK OF AFRICA COTE D'IVOIRE
  'BOAM': 'Services Financiers', // BANK OF AFRICA MALI
  'BOAN': 'Services Financiers', // BANK OF AFRICA NIGER
  'BOAS': 'Services Financiers', // BANK OF AFRICA SENEGAL
  'CBIBF': 'Services Financiers', // CORIS BANK INTERNATIONAL BURKINA FASO
  'ECOC': 'Services Financiers', // ECOBANK COTE D'IVOIRE
  'ETIT': 'Services Financiers', // Ecobank Transnational Incorporated TOGO
  'NSBC': 'Services Financiers', // NSIA BANQUE COTE D'IVOIRE
  'ORGT': 'Services Financiers', // ORAGROUP TOGO
  'SAFC': 'Services Financiers', // SAFCA COTE D'IVOIRE
  'SGBC': 'Services Financiers', // SOCIETE GENERALE COTE D'IVOIRE
  'SIBC': 'Services Financiers', // SOCIETE IVOIRIENNE DE BANQUE COTE D'IVOIRE

  // === SERVICES PUBLICS ===
  'CIEC': 'Services Publics', // CIE COTE D'IVOIRE
  'SDCC': 'Services Publics', // SODE COTE D'IVOIRE

  // === TÉLÉCOMMUNICATIONS ===
  'ONTBF': 'Télécommunications', // ONATEL BURKINA FASO
  'ORAC': 'Télécommunications', // ORANGE COTE D'IVOIRE
  'SNTS': 'Télécommunications', // SONATEL SENEGAL
};

/**
 * Fonction principale pour mettre à jour les secteurs
 */
async function updateStockSectors() {
  console.log('🔄 Démarrage de la mise à jour des secteurs...\n');

  try {
    // Connexion à la base de données
    await connectPrismaDatabase();

    let updatedCount = 0;
    let notFoundCount = 0;
    const notFoundStocks: string[] = [];

    // Récupérer toutes les actions
    const allStocks = await prisma.stock.findMany({
      select: {
        id: true,
        symbol: true,
        company_name: true,
        sector: true,
      }
    });

    console.log(`📊 Total d'actions dans la base: ${allStocks.length}\n`);

    // Parcourir toutes les actions et assigner les secteurs
    for (const stock of allStocks) {
      const sector = SECTOR_MAPPING[stock.symbol];

      if (sector) {
        // Mettre à jour le secteur si trouvé dans le mapping
        await prisma.stock.update({
          where: { id: stock.id },
          data: { sector: sector }
        });

        console.log(`✅ ${stock.symbol.padEnd(8)} | ${stock.company_name.substring(0, 50).padEnd(52)} | → ${sector}`);
        updatedCount++;
      } else {
        // Stocker les actions sans mapping
        console.log(`⚠️  ${stock.symbol.padEnd(8)} | ${stock.company_name.substring(0, 50).padEnd(52)} | → NON TROUVÉ`);
        notFoundStocks.push(`${stock.symbol} (${stock.company_name})`);
        notFoundCount++;
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(100));
    console.log('📈 RÉSUMÉ DE LA MISE À JOUR DES SECTEURS');
    console.log('='.repeat(100));
    console.log(`✅ Actions mises à jour avec succès: ${updatedCount}`);
    console.log(`⚠️  Actions sans secteur trouvé: ${notFoundCount}`);

    if (notFoundStocks.length > 0) {
      console.log('\n📋 Actions sans secteur assigné:');
      notFoundStocks.forEach(stock => console.log(`   - ${stock}`));
      console.log('\n💡 Conseil: Ajoutez ces symboles au mapping SECTOR_MAPPING dans le script.');
    }

    console.log('\n✅ Mise à jour des secteurs terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des secteurs:', error);
    throw error;
  } finally {
    // Déconnexion
    await disconnectPrismaDatabase();
  }
}

// Exécution du script
updateStockSectors()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });