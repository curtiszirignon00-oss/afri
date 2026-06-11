/// <reference types="node" />
import { importExcel } from './importExcelHistory';
import prisma from '../src/config/prisma';

importExcel('SOGC', 'C:/Users/HP/OneDrive/Desktop/actions brvm/sogc/SOGC.xlsx')
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
