/// <reference types="node" />
import { importExcel } from './importExcelHistory';
import prisma from '../src/config/prisma';

importExcel('ABJC', 'C:/Users/HP/OneDrive/Desktop/actions brvm/abjc/abjc.xlsx')
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
