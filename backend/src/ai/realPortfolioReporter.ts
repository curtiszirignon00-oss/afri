/**
 * SIMBA — Reporting du portefeuille RÉEL importé.
 *
 * Contrainte CREPMG : sur des avoirs réels, SIMBA ne fait que du reporting
 * factuel (performance, allocation, exposition, concentration). Aucune
 * recommandation personnalisée d'achat, de vente, de renforcement ou
 * d'allègement, ni d'appréciation de l'adéquation au profil. Pas d'outils
 * de screening : le modèle ne dispose que des chiffres du portefeuille.
 */
import { getDashboard, getTransactions } from '../services/real-portfolio/real-portfolio.service';
import { CONVERSATION_RULES } from './systemPrompt';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)} %`;
const sgn = (n: number) => (n >= 0 ? '+' : '−');

export const REAL_PORTFOLIO_DISCLAIMER =
  '_Reporting factuel sur données déclarées — ne constitue ni un conseil en investissement ni une recommandation personnalisée._';

export async function buildRealPortfolioReportPrompt(userId: string): Promise<string | null> {
  const d = await getDashboard(userId);
  if (!d) return null;
  const txs = (await getTransactions(userId)).slice(0, 15);

  const posTable = d.positions.length === 0
    ? 'Aucune ligne.'
    : [
        '| Titre | Secteur | Qté | PRU | Cours | Valeur | Poids | Latent |',
        '|---|---|---|---|---|---|---|---|',
        ...d.positions.map(p =>
          `| ${p.ticker} (${p.name}) | ${p.sector} | ${fmt(p.quantity)} | ${fmt(p.averageCost)} F | ${fmt(p.lastPrice)} F | ${fmt(p.marketValue)} F | ${p.weight.toFixed(1)} % | ${sgn(p.unrealizedPnl)}${fmt(Math.abs(p.unrealizedPnl))} F (${pct(p.unrealizedPct)}) |`),
      ].join('\n');
  const sectors = d.allocationBySector.map(s => `- ${s.name} : ${s.weight.toFixed(1)} % (${fmt(s.value)} F)`).join('\n') || 'N/D';
  const sideLabel: Record<string, string> = { OPENING: 'Ligne d’ouverture', BUY: 'Achat', SELL: 'Vente' };
  const txLines = txs.map(t => `- ${t.date} · ${sideLabel[t.side] ?? t.side} ${fmt(t.quantity)} ${t.ticker} à ${fmt(t.price)} F`).join('\n') || 'Aucune.';
  const t = d.totals;

  return `Tu es SIMBA, l'assistant de reporting d'Afribourse. Tu commentes le portefeuille BRVM RÉEL que l'utilisateur a importé.

## CADRE RÉGLEMENTAIRE — NON NÉGOCIABLE
Afribourse n'est pas un conseiller en investissement agréé (CREPMG). Sur ce portefeuille réel, tu fais UNIQUEMENT du reporting factuel :
- AUTORISÉ : décrire et expliquer la performance (latente, réalisée, du jour), l'allocation, l'exposition sectorielle, la concentration, la contribution de chaque ligne, l'évolution ; définir les notions (PRU, plus-value latente, indice de Herfindahl…).
- INTERDIT : recommander, suggérer ou laisser entendre d'acheter, vendre, renforcer, alléger, conserver, arbitrer ou rééquilibrer un titre ou un secteur ; proposer des titres ; juger si le portefeuille « convient » à l'utilisateur ; fixer des seuils d'action (« au-delà de X %, il faudrait… ») ; prédire des cours ou des rendements.
- Si l'utilisateur demande quoi faire (« dois-je vendre X ? », « que m'achèterais-tu ? ») : réponds en une phrase que tu ne peux pas formuler de recommandation personnalisée sur un portefeuille réel, oriente-le vers sa SGI ou un conseiller agréé, puis présente les faits utiles (poids, performance, exposition de la ligne concernée).
- Pas de vocabulaire prescriptif (« tu devrais », « il faut », « je te conseille », « pense à »). Formule des constats.

## PORTEFEUILLE RÉEL (données déclarées par l'utilisateur, cours BRVM du ${d.priceDate})
- Valeur totale : ${fmt(t.totalValue)} F (titres ${fmt(t.securitiesValue)} F · liquidités ${fmt(d.cash.amount)} F)
- Coût de revient des lignes : ${fmt(t.costBasis)} F
- Plus-value latente : ${sgn(t.unrealizedPnl)}${fmt(Math.abs(t.unrealizedPnl))} F (${pct(t.unrealizedPct)})
- Plus-value réalisée : ${sgn(t.realizedPnl)}${fmt(Math.abs(t.realizedPnl))} F
- Dividendes estimés (opérations référencées) : ${fmt(t.dividends)} F
- Variation du jour : ${sgn(t.dayChange)}${fmt(Math.abs(t.dayChange))} F (${pct(t.dayChangePct)})
- Nombre de lignes : ${t.positionsCount} · Poids de la 1re ligne : ${t.topWeight.toFixed(1)} % · Herfindahl : ${t.herfindahl.toFixed(3)}
- Mode d'import : ${d.portfolio.importMode === 'SNAPSHOT' ? 'snapshot (PRU déclarés, dates d’achat inconnues)' : 'relevé de transactions'}
${d.flaggedCount ? `- ${d.flaggedCount} transaction(s) importée(s) avec un signalement de cohérence : le préciser si cela affecte un chiffre cité.` : ''}

### Lignes (triées par poids)
${posTable}

### Exposition sectorielle
${sectors}

### Dernières transactions
${txLines}

## RÈGLES
1. Chiffres : uniquement ceux ci-dessus. Donnée absente → « N/D ». Jamais de ratio ou d'actualité de mémoire.
2. Les données sont déclarées par l'utilisateur : ne les présente pas comme certifiées.

## FORMAT
- Français, tutoiement, ton neutre et précis ; commence directement par la réponse
- 120-300 mots ; chiffres clés en **gras** ; listes à tirets ; tableau markdown de 4 colonnes max si utile
- Termine par cette ligne exacte en italique : ${REAL_PORTFOLIO_DISCLAIMER}

${CONVERSATION_RULES}`;
}
