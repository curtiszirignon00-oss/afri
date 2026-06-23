/**
 * Diagnostic API Conversions Meta — envoie un évènement de test.
 *
 * Usage :
 *   1. Récupérez le code dans Gestionnaire d'évènements > votre dataset >
 *      onglet « Évènements de test » (ex: TEST12345)
 *   2. npx tsx scripts/test-meta-capi.ts TEST12345
 *      (ou définissez META_TEST_EVENT_CODE dans .env puis lancez sans argument)
 *
 * L'évènement apparaît en temps réel dans l'onglet « Évènements de test »
 * sans impacter les rapports de production.
 */
import 'dotenv/config';
import crypto from 'crypto';

const DATASET_ID = process.env.META_DATASET_ID || '875398595570569';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || '';
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const TEST_CODE = process.argv[2] || process.env.META_TEST_EVENT_CODE || '';

function sha256(v: string) {
  return crypto.createHash('sha256').update(v.trim().toLowerCase()).digest('hex');
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.error('❌ META_CAPI_ACCESS_TOKEN manquant dans .env');
    process.exit(1);
  }
  if (!TEST_CODE) {
    console.warn('⚠️  Aucun test_event_code fourni → l\'évènement partira en PRODUCTION.');
    console.warn('   Fournissez-en un : npx tsx scripts/test-meta-capi.ts TEST12345');
  }

  const body: any = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: `test-${crypto.randomUUID()}`,
        event_source_url: 'https://www.africbourse.com/paiement/retour',
        user_data: {
          em: [sha256('test@africbourse.com')],
          ph: [sha256('22507000000')],
          country: [sha256('ci')],
        },
        custom_data: { currency: 'XOF', value: 35000 },
      },
    ],
  };
  if (TEST_CODE) body.test_event_code = TEST_CODE;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${DATASET_ID}/events?access_token=${ACCESS_TOKEN}`;
  console.log(`→ POST ${GRAPH_VERSION}/${DATASET_ID}/events  (test_event_code=${TEST_CODE || 'aucun'})`);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  console.log(`HTTP ${res.status}`);
  console.log(JSON.stringify(json, null, 2));
  if (res.ok && (json as any).events_received >= 1) {
    console.log('✅ Évènement reçu par Meta.' + (TEST_CODE ? ' Vérifiez l\'onglet « Évènements de test ».' : ''));
  } else {
    console.log('❌ Échec — vérifiez le token, le dataset ID et les permissions.');
  }
}

main().catch((e) => { console.error('ERR', e); process.exit(1); });
