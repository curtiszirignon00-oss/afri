/// <reference types="node" />
import { importExcel } from './importExcelHistory';
import prisma from '../src/config/prisma';

importExcel('SVOC', 'C:/Users/HP/OneDrive/Desktop/actions brvm/svoc/SVOC.xlsx')
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
