/// <reference types="node" />
import prisma from '../src/config/prisma';

async function deactivateSVOC() {
  const result = await prisma.stock.update({
    where: { symbol: 'SVOC' },
    data: { is_active: false },
  });
  console.log(`✅ SVOC (${result.company_name}) désactivé — is_active: false`);
}

deactivateSVOC()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
