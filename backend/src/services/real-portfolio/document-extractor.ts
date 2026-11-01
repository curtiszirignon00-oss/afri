// backend/src/services/real-portfolio/document-extractor.ts
// Lecture d'une capture d'écran, photo ou PDF de relevé SGI par l'IA (Groq).
//  - Image : lue directement par le modèle multimodal (Qwen).
//  - PDF   : texte extrait localement (unpdf), puis structuré par le même modèle.
//            Un PDF scanné (sans texte) est refusé : l'utilisateur envoie une capture.
// L'IA ne fait que transcrire le tableau : le résultat repasse par le moteur de
// validation, comme un CSV. Le document n'est pas conservé.

import Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';
import { extractText, getDocumentProxy } from 'unpdf';
import { SIMBA_COACH_MODEL, reasoningParams, stripReasoning, trackedCompletion } from '../../ai/models';
import { parseDate, parseNumber, MAX_IMPORT_ROWS, type ParsedTable } from './parsers';

const MODEL = process.env.REAL_PORTFOLIO_EXTRACT_MODEL || SIMBA_COACH_MODEL;
/** Groq refuse les images de plus de 4 Mo encodées en base64 (le front les compresse avant envoi). */
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_PDF_TEXT = 60_000;

export const DOCUMENT_MIME = /^(image\/(png|jpe?g|webp)|application\/pdf)$/i;

let groq: Groq | null = null;
const client = () => (groq ??= new Groq({ apiKey: process.env.GROQ_API_KEY ?? '', timeout: 60_000, maxRetries: 1 }));

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

Réponds par un seul objet JSON, sans texte autour :
{"kind": "positions" | "transactions" | "none", "dateReleve": "AAAA-MM-JJ" | null, "liquidites": nombre | null,
 "lignes": [{"titre": texte, "quantite": nombre | null, "prix": nombre | null, "montant": nombre | null, "date": "AAAA-MM-JJ" | null, "sens": "achat" | "vente" | null, "frais": nombre | null}]}

- kind = "positions" si le document liste des titres détenus (quantité, PRU ou cours, valorisation) ; "transactions" s'il liste des achats/ventes datés ; "none" s'il ne contient aucune ligne d'actions.
- Une ligne par titre (positions) ou par opération (transactions). Ignore les obligations, OPCVM, lignes de total, sous-totaux, en-têtes répétés, mouvements d'espèces, droits de garde et dividendes.
- titre : le symbole BRVM s'il apparaît (ex. SNTS, SGBC, ORAC), sinon le nom de la société tel qu'écrit.
- quantite : nombre de titres.
- prix : PRU (prix de revient unitaire) pour des positions, cours d'exécution pour une transaction. Pas le cours du jour si un PRU est présent.
- montant : montant de la ligne s'il est indiqué (utile si le prix manque).
- date et sens : transactions uniquement.
- frais : commissions et frais de l'opération si indiqués.
- dateReleve : date d'arrêté du relevé si indiquée.
- liquidites : solde espèces disponible sur le compte si indiqué.
Les nombres sont écrits à la française (espace pour les milliers, virgule décimale) : renvoie-les en nombres JSON.`;

type Num = number | string | null | undefined;
interface Extracted {
  kind?: 'positions' | 'transactions' | 'none';
  dateReleve?: string | null;
  liquidites?: Num;
  lignes?: { titre?: string; quantite?: Num; prix?: Num; montant?: Num; date?: string | null; sens?: string | null; frais?: Num }[];
}

export class DocumentExtractionError extends Error {}

async function pdfText(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return (Array.isArray(text) ? text.join('\n') : text).replace(/[ \t]+/g, ' ').trim();
}

async function readDocument(mimeType: string, buffer: Buffer): Promise<Extracted> {
  let content: Groq.Chat.ChatCompletionUserMessageParam['content'];
  if (/pdf/i.test(mimeType)) {
    const text = await pdfText(buffer).catch(() => '');
    if (text.length < 30) {
      throw new DocumentExtractionError("Ce PDF ne contient pas de texte lisible (document scanné ?). Envoyez plutôt une capture d'écran ou une photo du relevé.");
    }
    content = `${PROMPT}\n\nTexte extrait du PDF :\n"""\n${text.slice(0, MAX_PDF_TEXT)}\n"""`;
  } else {
    if (buffer.length > MAX_IMAGE_BYTES) throw new DocumentExtractionError("Image trop lourde (3 Mo max). Réduisez-la ou envoyez une capture d'écran.");
    content = [
      { type: 'text', text: PROMPT },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${buffer.toString('base64')}` } },
    ];
  }

  const completion = await trackedCompletion(client(), {
    model: MODEL,
    temperature: 0,
    max_completion_tokens: 8000,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content }],
    ...reasoningParams(MODEL),
  } as ChatCompletionCreateParamsNonStreaming, 'real-portfolio-extract');

  const raw = stripReasoning(completion.choices[0]?.message?.content ?? '').replace(/^```(?:json)?\s*|\s*```$/g, '');
  try {
    return JSON.parse(raw);
  } catch {
    throw new DocumentExtractionError("Le document n'a pas pu être lu. Essayez une capture plus nette ou un autre format.");
  }
}

export async function extractFromDocument(mimeType: string, buffer: Buffer): Promise<ParsedTable & { detectedDate: string | null; detectedCash: number | null }> {
  if (!process.env.GROQ_API_KEY) throw new DocumentExtractionError("La lecture de documents n'est pas disponible pour le moment. Utilisez un fichier CSV/Excel ou la saisie manuelle.");

  const data = await readDocument(mimeType, buffer);
  const lignes = (data.lignes ?? []).filter(l => l?.titre && String(l.titre).trim());
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
    parserId: `groq:${MODEL}`,
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
