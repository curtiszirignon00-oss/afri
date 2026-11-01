// backend/src/services/real-portfolio/document-extractor.ts
// Lecture d'une capture d'écran, photo ou PDF de relevé SGI par Gemini.
// L'IA ne fait que transcrire le tableau : le résultat repasse par l'étape de
// correspondance des colonnes puis par le moteur de validation, comme un CSV.
// Le document n'est pas conservé.

import config from '../../config/environnement';
import { parseDate, parseNumber, MAX_IMPORT_ROWS, type ParsedTable } from './parsers';

const MODEL = process.env.GEMINI_EXTRACT_MODEL || 'gemini-3.5-flash';
const TIMEOUT_MS = 60_000;

export const DOCUMENT_MIME = /^(image\/(png|jpe?g|webp|heic|heif)|application\/pdf)$/i;

const H = {
  ticker: 'Titre',
  quantity: 'Quantité',
  price: 'Cours / PRU',
  amount: 'Montant',
  date: 'Date',
  side: 'Sens',
  fees: 'Frais',
} as const;

const PROMPT = `Tu lis un document financier d'un investisseur de la BRVM (Bourse régionale des valeurs mobilières, zone UEMOA) : relevé de portefeuille, avis d'opéré, relevé de compte titres, ou capture d'écran d'une application de SGI.

Transcris UNIQUEMENT ce qui est écrit. N'invente, ne complète et ne corrige aucune valeur. Si une information est absente ou illisible, mets null.

- kind = "positions" si le document liste des titres détenus (quantité, PRU ou cours, valorisation) ; "transactions" s'il liste des achats/ventes datés ; "none" s'il ne contient aucune ligne d'actions.
- Une ligne par titre (positions) ou par opération (transactions). Ignore les obligations, OPCVM, lignes de total, sous-totaux, en-têtes répétés, mouvements d'espèces, droits de garde et dividendes.
- titre : le symbole BRVM s'il apparaît (ex. SNTS, SGBC, ORAC), sinon le nom de la société tel qu'écrit.
- quantite : nombre de titres.
- prix : PRU (prix de revient unitaire) pour des positions, cours d'exécution pour une transaction. Pas le cours du jour si un PRU est présent.
- montant : montant de la ligne s'il est indiqué (utile si le prix manque).
- date : date de l'opération au format AAAA-MM-JJ (transactions uniquement).
- sens : "achat" ou "vente" (transactions uniquement).
- frais : commissions et frais de l'opération si indiqués.
- dateReleve : date d'arrêté du relevé au format AAAA-MM-JJ si indiquée.
- liquidites : solde espèces disponible sur le compte si indiqué.
Les nombres sont écrits à la française (espace pour les milliers, virgule décimale) : renvoie-les en nombres JSON.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    kind: { type: 'STRING', enum: ['positions', 'transactions', 'none'] },
    dateReleve: { type: 'STRING', nullable: true },
    liquidites: { type: 'NUMBER', nullable: true },
    lignes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          titre: { type: 'STRING' },
          quantite: { type: 'NUMBER', nullable: true },
          prix: { type: 'NUMBER', nullable: true },
          montant: { type: 'NUMBER', nullable: true },
          date: { type: 'STRING', nullable: true },
          sens: { type: 'STRING', nullable: true },
          frais: { type: 'NUMBER', nullable: true },
        },
        required: ['titre'],
      },
    },
  },
  required: ['kind', 'lignes'],
};

interface Extracted {
  kind: 'positions' | 'transactions' | 'none';
  dateReleve?: string | null;
  liquidites?: number | null;
  lignes: { titre: string; quantite?: number | null; prix?: number | null; montant?: number | null; date?: string | null; sens?: string | null; frais?: number | null }[];
}

export class DocumentExtractionError extends Error {}

export async function extractFromDocument(mimeType: string, buffer: Buffer): Promise<ParsedTable & { detectedDate: string | null; detectedCash: number | null }> {
  if (!config.geminiApiKey) throw new DocumentExtractionError("La lecture de documents n'est pas disponible pour le moment. Utilisez un fichier CSV/Excel ou la saisie manuelle.");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiApiKey },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mimeType, data: buffer.toString('base64') } }, { text: PROMPT }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA, thinkingConfig: { thinkingLevel: 'low' } },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
  }
  const body: any = await res.json();
  const text: string | undefined = body?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('');
  let data: Extracted;
  try {
    data = JSON.parse(text ?? '');
  } catch {
    throw new DocumentExtractionError("Le document n'a pas pu être lu. Essayez une capture plus nette ou un autre format.");
  }

  const lignes = (data.lignes ?? []).filter(l => l.titre && String(l.titre).trim());
  if (data.kind === 'none' || lignes.length === 0) {
    throw new DocumentExtractionError("Aucune ligne d'actions trouvée dans ce document. Vérifiez qu'il s'agit bien d'un relevé de portefeuille ou d'opérations.");
  }
  if (lignes.length > MAX_IMPORT_ROWS) throw new DocumentExtractionError(`Document trop volumineux (max ${MAX_IMPORT_ROWS} lignes).`);

  const isTx = data.kind === 'transactions';
  const headers: string[] = isTx ? [H.date, H.side, H.ticker, H.quantity, H.price, H.fees, H.amount] : [H.ticker, H.quantity, H.price, H.amount];
  const rows = lignes.map(l => {
    const r: Record<string, unknown> = { [H.ticker]: String(l.titre).trim(), [H.quantity]: l.quantite ?? '', [H.price]: l.prix ?? '', [H.amount]: l.montant ?? '' };
    if (isTx) Object.assign(r, { [H.date]: l.date ?? '', [H.side]: l.sens ?? '', [H.fees]: l.frais ?? '' });
    return r;
  });

  const date = data.dateReleve ? parseDate(data.dateReleve) : '';
  const cash = parseNumber(data.liquidites);
  return {
    parserId: `gemini:${MODEL}`,
    source: 'DOCUMENT',
    headers,
    rows,
    suggestedMapping: isTx
      ? { ticker: H.ticker, quantity: H.quantity, price: H.price, amount: H.amount, date: H.date, side: H.side, fees: H.fees }
      : { ticker: H.ticker, quantity: H.quantity, price: H.price, amount: H.amount },
    suggestedMode: isTx ? 'TRANSACTIONS' : 'SNAPSHOT',
    detectedDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    detectedCash: cash != null && cash >= 0 ? cash : null,
  };
}
