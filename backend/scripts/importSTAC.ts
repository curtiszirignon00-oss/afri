/// <reference types="node" />
import { importExcel } from './importExcelHistory';
import prisma from '../src/config/prisma';

importExcel('STAC', 'C:/Users/HP/OneDrive/Desktop/actions brvm/stac/STAC.xlsx')
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
