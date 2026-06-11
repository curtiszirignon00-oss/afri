/// <reference types="node" />
import { importExcel } from './importExcelHistory';
import prisma from '../src/config/prisma';

importExcel('CBIBF', 'C:/Users/HP/OneDrive/Desktop/actions brvm/cbibf/CBIBF.xlsx')
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
