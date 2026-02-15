/// <reference types="node" />
import { importAllFundamentals } from './import-fundamentals-generic';
import prisma from '../config/prisma';
import path from 'path';

const BASE_DIR = path.join('C:', 'Users', 'HP', 'OneDrive', 'Desktop', 'actions brvm');

// All 48 stocks with their .txt file paths
const stocks = [
  { ticker: 'ABJC', txtPath: path.join(BASE_DIR, 'abjc', 'abjc.txt') },
  { ticker: 'BICB', txtPath: path.join(BASE_DIR, 'bicb', 'bicb.txt') },
  { ticker: 'BICC', txtPath: path.join(BASE_DIR, 'bicc', 'bicc.txt') },
  { ticker: 'BNBC', txtPath: path.join(BASE_DIR, 'bnbc', 'bnbc.txt') },
  { ticker: 'BOAB', txtPath: path.join(BASE_DIR, 'Boab', 'boab.txt') },
  { ticker: 'BOABF', txtPath: path.join(BASE_DIR, 'Boabf', 'boabf.txt') },
  { ticker: 'BOAC', txtPath: path.join(BASE_DIR, 'BOAC', 'boac.txt') },
  { ticker: 'BOAM', txtPath: path.join(BASE_DIR, 'BOAM', 'boam.txt') },
  { ticker: 'BOAN', txtPath: path.join(BASE_DIR, 'boan', 'boan.txt') },
  { ticker: 'BOAS', txtPath: path.join(BASE_DIR, 'boas', 'boas.txt') },
  { ticker: 'CABC', txtPath: path.join(BASE_DIR, 'cabc', 'cabc.txt') },
  { ticker: 'CBIBF', txtPath: path.join(BASE_DIR, 'cbibf', 'cbibf.txt') },
  { ticker: 'CFAC', txtPath: path.join(BASE_DIR, 'cfac', 'cfac.txt') },
  { ticker: 'CIEC', txtPath: path.join(BASE_DIR, 'ciec', 'ciec.txt') },
  { ticker: 'ECOC', txtPath: path.join(BASE_DIR, 'ecoc', 'ecoc.txt') },
  { ticker: 'ETIT', txtPath: path.join(BASE_DIR, 'etit', 'etit.txt') },
  { ticker: 'FTSC', txtPath: path.join(BASE_DIR, 'ftsc', 'ftsc.txt') },
  { ticker: 'LNBB', txtPath: path.join(BASE_DIR, 'lnbb', 'lnbb.txt') },
  { ticker: 'NEIC', txtPath: path.join(BASE_DIR, 'neic', 'neic.txt') },
  { ticker: 'NSBC', txtPath: path.join(BASE_DIR, 'nsbc', 'nsbc.txt') },
  { ticker: 'NTLC', txtPath: path.join(BASE_DIR, 'ntlc', 'ntlc.txt') },
  { ticker: 'ONTBF', txtPath: path.join(BASE_DIR, 'ontbf', 'ontbf.txt') },
  { ticker: 'ORAC', txtPath: path.join(BASE_DIR, 'orac', 'orac.txt') },
  { ticker: 'ORGT', txtPath: path.join(BASE_DIR, 'orgt', 'orgt.txt') },
  { ticker: 'PALC', txtPath: path.join(BASE_DIR, 'palc', 'palc.txt') },
  { ticker: 'PRSC', txtPath: path.join(BASE_DIR, 'prsc', 'prsc.txt') },
  { ticker: 'SAFC', txtPath: path.join(BASE_DIR, 'safc', 'safc.txt') },
  { ticker: 'SCRC', txtPath: path.join(BASE_DIR, 'scrc', 'scrc.txt') },
  { ticker: 'SDCC', txtPath: path.join(BASE_DIR, 'sdcc', 'sdcc.txt') },
  { ticker: 'SDSC', txtPath: path.join(BASE_DIR, 'sdsc', 'sdsc.txt') },
  { ticker: 'SEMC', txtPath: path.join(BASE_DIR, 'semc', 'semc.txt') },
  { ticker: 'SGBC', txtPath: path.join(BASE_DIR, 'sgbc', 'sgbc.txt') },
  { ticker: 'SHEC', txtPath: path.join(BASE_DIR, 'shec', 'shec.txt') },
  { ticker: 'SIBC', txtPath: path.join(BASE_DIR, 'sibc', 'sibc.txt') },
  { ticker: 'SICC', txtPath: path.join(BASE_DIR, 'sicc', 'sicc.txt') },
  { ticker: 'SIVC', txtPath: path.join(BASE_DIR, 'sivc', 'sivc.txt') },
  { ticker: 'SLBC', txtPath: path.join(BASE_DIR, 'slbc', 'slbc.txt') },
  { ticker: 'SMBC', txtPath: path.join(BASE_DIR, 'smbc', 'smbc.txt') },
  { ticker: 'SNTS', txtPath: path.join(BASE_DIR, 'snts', 'snts.txt') },
  { ticker: 'SOGC', txtPath: path.join(BASE_DIR, 'sogc', 'sogc.txt') },
  { ticker: 'SPHC', txtPath: path.join(BASE_DIR, 'sphc', 'sphc.txt') },
  { ticker: 'STAC', txtPath: path.join(BASE_DIR, 'stac', 'stac.txt') },
  { ticker: 'STBC', txtPath: path.join(BASE_DIR, 'stbc', 'stbc.txt') },
  { ticker: 'SVOC', txtPath: path.join(BASE_DIR, 'svoc', 'svoc.txt') },
  { ticker: 'TTLC', txtPath: path.join(BASE_DIR, 'ttlc', 'ttlc.txt') },
  { ticker: 'TTLS', txtPath: path.join(BASE_DIR, 'ttls', 'ttls.txt') },
  { ticker: 'UNLC', txtPath: path.join(BASE_DIR, 'unlc', 'unlc.txt') },
  { ticker: 'UNXC', txtPath: path.join(BASE_DIR, 'unxc', 'unxc.txt') },
];

async function main() {
  console.log(`\nImport fondamentaux pour ${stocks.length} actions\n`);
  await importAllFundamentals(stocks, { verbose: true });
  await prisma.$disconnect();
}

main()
  .then(() => {
    console.log('\nTous les imports fondamentaux sont termines !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nErreur fatale:', error);
    process.exit(1);
  });
