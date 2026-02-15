/// <reference types="node" />
import { importMultipleStocks } from './import-stock-history-generic';
import prisma from '../config/prisma';
import path from 'path';

const BASE_DIR = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'actions brvm');

// All 48 stocks with their Excel file paths
const stocks = [
  { ticker: 'ABJC', excelPath: path.join(BASE_DIR, 'abjc', 'abjc.xlsx') },
  { ticker: 'BICB', excelPath: path.join(BASE_DIR, 'bicb', 'bicb.xlsx') },
  { ticker: 'BICC', excelPath: path.join(BASE_DIR, 'bicc', 'bicc.xlsx') },
  { ticker: 'BNBC', excelPath: path.join(BASE_DIR, 'bnbc', 'bnbc.xlsx') },
  { ticker: 'BOAB', excelPath: path.join(BASE_DIR, 'Boab', 'BOAB.xlsx') },
  { ticker: 'BOABF', excelPath: path.join(BASE_DIR, 'Boabf', 'BOABF.xlsx') },
  { ticker: 'BOAC', excelPath: path.join(BASE_DIR, 'BOAC', 'BOAC.xlsx') },
  { ticker: 'BOAM', excelPath: path.join(BASE_DIR, 'BOAM', 'BOAM.xlsx') },
  { ticker: 'BOAN', excelPath: path.join(BASE_DIR, 'boan', 'BOAN.xlsx') },
  { ticker: 'BOAS', excelPath: path.join(BASE_DIR, 'boas', 'BOAS.xlsx') },
  { ticker: 'CABC', excelPath: path.join(BASE_DIR, 'cabc', 'CABC.xlsx') },
  { ticker: 'CBIBF', excelPath: path.join(BASE_DIR, 'cbibf', 'CBIBF.xlsx') },
  { ticker: 'CFAC', excelPath: path.join(BASE_DIR, 'cfac', 'CFAC.xlsx') },
  { ticker: 'CIEC', excelPath: path.join(BASE_DIR, 'ciec', 'CIEC.xlsx') },
  { ticker: 'ECOC', excelPath: path.join(BASE_DIR, 'ecoc', 'ECOC.xlsx') },
  { ticker: 'ETIT', excelPath: path.join(BASE_DIR, 'etit', 'ETIT.xlsx') },
  { ticker: 'FTSC', excelPath: path.join(BASE_DIR, 'ftsc', 'FTSC.xlsx') },
  { ticker: 'LNBB', excelPath: path.join(BASE_DIR, 'lnbb', 'lnbb.xlsx') },
  { ticker: 'NEIC', excelPath: path.join(BASE_DIR, 'neic', 'NEIC.xlsx') },
  { ticker: 'NSBC', excelPath: path.join(BASE_DIR, 'nsbc', 'NSBC.xlsx') },
  { ticker: 'NTLC', excelPath: path.join(BASE_DIR, 'ntlc', 'NTLC.xlsx') },
  { ticker: 'ONTBF', excelPath: path.join(BASE_DIR, 'ontbf', 'ONTBF.xlsx') },
  { ticker: 'ORAC', excelPath: path.join(BASE_DIR, 'orac', 'ORAC.xlsx') },
  { ticker: 'ORGT', excelPath: path.join(BASE_DIR, 'orgt', 'orgt.xlsx') },
  { ticker: 'PALC', excelPath: path.join(BASE_DIR, 'palc', 'palc.xlsx') },
  { ticker: 'PRSC', excelPath: path.join(BASE_DIR, 'prsc', 'prsc.xlsx') },
  { ticker: 'SAFC', excelPath: path.join(BASE_DIR, 'safc', 'safc.xlsx') },
  { ticker: 'SCRC', excelPath: path.join(BASE_DIR, 'scrc', 'scrc.xlsx') },
  { ticker: 'SDCC', excelPath: path.join(BASE_DIR, 'sdcc', 'sdcc.xlsx') },
  { ticker: 'SDSC', excelPath: path.join(BASE_DIR, 'sdsc', 'sdsc.xlsx') },
  { ticker: 'SEMC', excelPath: path.join(BASE_DIR, 'semc', 'semc.xlsx') },
  { ticker: 'SGBC', excelPath: path.join(BASE_DIR, 'sgbc', 'sgbc.xlsx') },
  { ticker: 'SHEC', excelPath: path.join(BASE_DIR, 'shec', 'shec.xlsx') },
  { ticker: 'SIBC', excelPath: path.join(BASE_DIR, 'sibc', 'sibc.xlsx') },
  { ticker: 'SICC', excelPath: path.join(BASE_DIR, 'sicc', 'sicc.xlsx') },
  { ticker: 'SIVC', excelPath: path.join(BASE_DIR, 'sivc', 'sivc.xlsx') },
  { ticker: 'SLBC', excelPath: path.join(BASE_DIR, 'slbc', 'SLBC.xlsx') },
  { ticker: 'SMBC', excelPath: path.join(BASE_DIR, 'smbc', 'SMBC.xlsx') },
  { ticker: 'SNTS', excelPath: path.join(BASE_DIR, 'snts', 'SNTS.xlsx') },
  { ticker: 'SOGC', excelPath: path.join(BASE_DIR, 'sogc', 'SOGC.xlsx') },
  { ticker: 'SPHC', excelPath: path.join(BASE_DIR, 'sphc', 'SPHC.xlsx') },
  { ticker: 'STAC', excelPath: path.join(BASE_DIR, 'stac', 'STAC.xlsx') },
  { ticker: 'STBC', excelPath: path.join(BASE_DIR, 'stbc', 'STBC.xlsx') },
  { ticker: 'SVOC', excelPath: path.join(BASE_DIR, 'svoc', 'SVOC.xlsx') },
  { ticker: 'TTLC', excelPath: path.join(BASE_DIR, 'ttlc', 'TTLC.xlsx') },
  { ticker: 'TTLS', excelPath: path.join(BASE_DIR, 'ttls', 'TTLS.xlsx') },
  { ticker: 'UNLC', excelPath: path.join(BASE_DIR, 'unlc', 'UNLC.xlsx') },
  { ticker: 'UNXC', excelPath: path.join(BASE_DIR, 'unxc', 'UNXC.xlsx') },
];

async function main() {
  console.log(`\n🚀 Import de ${stocks.length} actions historiques\n`);
  await importMultipleStocks(stocks, { skipExisting: true, verbose: true });
  await prisma.$disconnect();
}

main()
  .then(() => {
    console.log('\n🎉 Tous les imports sont termines !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
