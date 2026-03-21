/**
 * Analyst Tools — Définitions des 5 outils function-calling pour SIMBA Analyste
 * Compatible avec l'API Groq (format OpenAI tool_calls)
 */

export const ANALYST_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'getStockData',
      description: `Récupère les données complètes d'un titre BRVM :
cours actuel, ratios de valorisation (P/E, P/B, EPS),
rentabilité (ROE, ROA, marge), bilan (revenue, net_income,
dette), dividende. Utilise cette fonction dès que l'utilisateur
mentionne un titre spécifique.`,
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbole boursier BRVM, ex: SGBC, SNTS, ONTBF, ETIT',
          },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getHistoricalPerformance',
      description: `Analyse la performance historique d'un titre sur une
période donnée. Retourne : prix de départ/fin, performance %,
plus haut/bas, comparaison avec le BRVM Composite sur la même période.`,
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Symbole BRVM' },
          period: {
            type: 'string',
            enum: ['1W', '1M', '3M', '6M', '1Y', '3Y', '5Y'],
            description: "Période d'analyse",
          },
        },
        required: ['symbol', 'period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compareStocks',
      description: `Compare plusieurs titres BRVM côte à côte sur
leurs métriques financières. Idéal pour les questions du type
"compare X et Y", "quel est le meilleur entre...".
Retourne un tableau comparatif complet.`,
      parameters: {
        type: 'object',
        properties: {
          symbols: {
            type: 'array',
            items: { type: 'string' },
            description: 'Liste des symboles à comparer, ex: ["SGBC", "ETIT", "SNTS"]',
          },
          metrics: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'pe_ratio', 'pb_ratio', 'roe', 'roa', 'profit_margin',
                'dividend_yield', 'debt_to_equity', 'eps', 'market_cap',
              ],
            },
            description: 'Métriques à comparer. Si non spécifié, retourne toutes les métriques.',
          },
        },
        required: ['symbols'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getSectorBenchmark',
      description: `Compare un titre avec les moyennes de son secteur
et le marché BRVM global. Utile pour savoir si un titre est
sur/sous-évalué par rapport à ses pairs.`,
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Symbole du titre à analyser' },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTopPerformers',
      description: `Récupère les meilleures ou pires performances
de la BRVM sur une période, avec filtre optionnel par secteur.
Utile pour "quels sont les titres qui ont le plus monté ce mois ?".`,
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['1W', '1M', '3M', '6M', '1Y'],
            description: "Période d'analyse",
          },
          sector: {
            type: 'string',
            description: 'Filtrer par secteur BRVM (optionnel), ex: "Services Financiers"',
          },
          limit: {
            type: 'integer',
            description: 'Nombre de résultats (défaut: 5, max: 10)',
          },
          direction: {
            type: 'string',
            enum: ['top', 'bottom'],
            description: 'top = meilleures performances, bottom = pires',
          },
        },
        required: ['period'],
      },
    },
  },
] as const;

export type AnalystToolName =
  | 'getStockData'
  | 'getHistoricalPerformance'
  | 'compareStocks'
  | 'getSectorBenchmark'
  | 'getTopPerformers';
