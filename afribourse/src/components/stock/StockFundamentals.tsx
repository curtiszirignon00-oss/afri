import { useState } from 'react';
import { TrendingUp, DollarSign, PieChart, Activity, Users, BarChart3, Info } from 'lucide-react';
import { useShareholders, useAnnualFinancials } from '../../hooks/useStockDetails';
import { ShareholdersPieChart } from './ShareholdersPieChart';
import { AnnualFinancialsTable } from './AnnualFinancialsTable';
import { FinancialCharts } from './FinancialCharts';

type FundamentalData = {
  stock_ticker: string;
  market_cap?: number | null;
  pe_ratio?: number | null;
  pb_ratio?: number | null;
  dividend_yield?: number | null;
  ex_dividend_date?: Date | string | null;
  roe?: number | null;
  roa?: number | null;
  profit_margin?: number | null;
  debt_to_equity?: number | null;
  revenue?: number | null;
  net_income?: number | null;
  ebitda?: number | null;
  free_cash_flow?: number | null;
  shares_outstanding?: number | null;
  eps?: number | null;
  book_value?: number | null;
};

type StockFundamentalsProps = {
  fundamentals?: FundamentalData | null;
  isLoading?: boolean;
  symbol?: string;
};

// Tooltip pour expliquer les ratios au survol
function RatioTooltip({ tooltip, children }: { tooltip: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <Info className="w-3.5 h-3.5 text-gray-400 absolute top-2 right-2 cursor-help" />
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg leading-relaxed pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

// Descriptions des ratios
const RATIO_TOOLTIPS: Record<string, string> = {
  market_cap:
    "Capitalisation boursière = Prix de l'action x Nombre d'actions en circulation. Elle représente la valeur totale de l'entreprise sur le marché.",
  pe_ratio:
    "Price-to-Earnings (PER) = Prix de l'action / Bénéfice par action. Il indique combien les investisseurs paient pour 1 FCFA de bénéfice. Un PER élevé peut signifier que l'action est chère ou que le marché anticipe une forte croissance.",
  pb_ratio:
    "Price-to-Book = Prix de l'action / Valeur comptable par action. Il compare le prix de marché à la valeur nette de l'entreprise. Un P/B < 1 peut indiquer une action sous-évaluée.",
  eps:
    "Bénéfice Par Action (BPA) = Bénéfice net / Nombre d'actions en circulation. C'est la part de bénéfice attribuable à chaque action. Plus il est élevé, plus l'entreprise est rentable par action.",
  dividend_yield:
    "Rendement du dividende = (Dividende annuel par action / Prix de l'action) x 100. Il mesure le revenu annuel reçu par rapport au prix payé. Un rendement élevé est attractif pour les investisseurs cherchant des revenus réguliers.",
  shares_outstanding:
    "Nombre total d'actions émises par l'entreprise et détenues par les actionnaires. Ce chiffre sert au calcul de nombreux ratios comme le BPA et la capitalisation boursière.",
  roe:
    "Return on Equity = (Bénéfice net / Capitaux propres) x 100. Il mesure la rentabilité des fonds investis par les actionnaires. Un ROE > 15% est généralement considéré comme bon.",
  roa:
    "Return on Assets = (Bénéfice net / Total des actifs) x 100. Il mesure l'efficacité avec laquelle l'entreprise utilise ses actifs pour générer des bénéfices. Plus il est élevé, plus l'entreprise est efficace.",
  profit_margin:
    "Marge bénéficiaire = (Bénéfice net / Chiffre d'affaires) x 100. Elle indique quelle proportion du chiffre d'affaires se transforme en bénéfice net. Une marge élevée reflète une bonne maîtrise des coûts.",
  debt_to_equity:
    "Dette/Capitaux propres = Total des dettes / Capitaux propres. Il mesure le niveau d'endettement de l'entreprise par rapport aux fonds propres. Un ratio > 1 signifie que l'entreprise a plus de dettes que de capitaux propres.",
  revenue:
    "Chiffre d'affaires = Total des ventes de biens et services de l'entreprise sur une période donnée (généralement un an). C'est le premier indicateur de la taille et de l'activité de l'entreprise.",
  net_income:
    "Bénéfice net = Chiffre d'affaires - Toutes les charges (exploitation, intérêts, impôts). C'est le résultat final de l'entreprise, ce qui reste après avoir payé toutes les dépenses.",
  ebitda:
    "Earnings Before Interest, Taxes, Depreciation and Amortization. Il mesure la rentabilité opérationnelle avant éléments financiers et comptables. Utile pour comparer des entreprises de secteurs différents.",
  free_cash_flow:
    "Flux de trésorerie disponible = Cash généré par les opérations - Dépenses d'investissement. C'est l'argent réellement disponible pour rembourser les dettes, verser des dividendes ou investir.",
  book_value:
    "Valeur comptable = Total des actifs - Total des passifs. Elle représente la valeur nette de l'entreprise selon ses états financiers. C'est ce que vaudraient théoriquement les actifs si l'entreprise était liquidée.",
};

export default function StockFundamentals({ fundamentals, isLoading = false, symbol }: StockFundamentalsProps) {
  // Fetch shareholders and annual financials
  const { data: shareholders } = useShareholders(symbol || '');
  const { data: annualFinancials } = useAnnualFinancials(symbol || '', 5);
  const formatNumber = (num?: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatCurrency = (num?: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)} Mds FCFA`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)} M FCFA`;
    return `${formatNumber(num)} FCFA`;
  };

  const formatPercent = (num?: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    return `${num.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-8 py-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <div key={j} className="bg-gray-100 rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!fundamentals) {
    return (
      <div className="py-16 text-center">
        <div className="flex flex-col items-center justify-center text-gray-400">
          <PieChart className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium text-gray-600">Données fondamentales non disponibles</p>
          <p className="text-sm text-gray-500 mt-2">
            Les données financières de cette action ne sont pas encore disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {/* Ratios de Valorisation */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Ratios de Valorisation</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <RatioTooltip tooltip={RATIO_TOOLTIPS.market_cap}>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-1">Capitalisation</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(fundamentals.market_cap)}</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.pe_ratio}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">P/E Ratio</p>
              <p className="text-xl font-bold text-gray-900">{fundamentals.pe_ratio?.toFixed(2) ?? 'N/A'}</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.pb_ratio}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">P/B Ratio</p>
              <p className="text-xl font-bold text-gray-900">{fundamentals.pb_ratio?.toFixed(2) ?? 'N/A'}</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.eps}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">BPA (EPS)</p>
              <p className="text-xl font-bold text-gray-900">{fundamentals.eps ? `${formatNumber(fundamentals.eps)} F` : 'N/A'}</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.dividend_yield}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Rendement Div.</p>
              <p className="text-xl font-bold text-gray-900">{formatPercent(fundamentals.dividend_yield)}</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.shares_outstanding}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Actions en circulation</p>
              <p className="text-xl font-bold text-gray-900">{formatNumber(fundamentals.shares_outstanding)}</p>
            </div>
          </RatioTooltip>
        </div>
      </section>

      {/* Ratios de Rentabilité */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-xl font-bold text-gray-900">Ratios de Rentabilité</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <RatioTooltip tooltip={RATIO_TOOLTIPS.roe}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">ROE</p>
              <p className="text-xl font-bold text-gray-900">{formatPercent(fundamentals.roe)}</p>
              <p className="text-xs text-gray-500 mt-1">Return on Equity</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.roa}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">ROA</p>
              <p className="text-xl font-bold text-gray-900">{formatPercent(fundamentals.roa)}</p>
              <p className="text-xs text-gray-500 mt-1">Return on Assets</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.profit_margin}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Marge bénéf.</p>
              <p className="text-xl font-bold text-gray-900">{formatPercent(fundamentals.profit_margin)}</p>
              <p className="text-xs text-gray-500 mt-1">Profit Margin</p>
            </div>
          </RatioTooltip>

          <RatioTooltip tooltip={RATIO_TOOLTIPS.debt_to_equity}>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Dette/Capitaux</p>
              <p className="text-xl font-bold text-gray-900">{fundamentals.debt_to_equity?.toFixed(2) ?? 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">Debt to Equity</p>
            </div>
          </RatioTooltip>
        </div>
      </section>

      {/* Données Financières */}
      <section>
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">Données Financières</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <RatioTooltip tooltip={RATIO_TOOLTIPS.revenue}>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Chiffre d'affaires</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(fundamentals.revenue)}</span>
                </div>
              </RatioTooltip>

              <RatioTooltip tooltip={RATIO_TOOLTIPS.net_income}>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Bénéfice net</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(fundamentals.net_income)}</span>
                </div>
              </RatioTooltip>

              <RatioTooltip tooltip={RATIO_TOOLTIPS.ebitda}>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">EBITDA</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(fundamentals.ebitda)}</span>
                </div>
              </RatioTooltip>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="space-y-4">
              <RatioTooltip tooltip={RATIO_TOOLTIPS.free_cash_flow}>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Free Cash Flow</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(fundamentals.free_cash_flow)}</span>
                </div>
              </RatioTooltip>

              <RatioTooltip tooltip={RATIO_TOOLTIPS.book_value}>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Valeur comptable</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(fundamentals.book_value)}</span>
                </div>
              </RatioTooltip>

              {fundamentals.ex_dividend_date && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date ex-dividende</span>
                  <span className="text-lg font-bold text-gray-900">
                    {new Date(fundamentals.ex_dividend_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Structure de Propriété (Actionnaires) */}
      {shareholders && shareholders.length > 0 && (
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900">Actionnaires</h3>
          </div>
          <ShareholdersPieChart shareholders={shareholders} />
        </section>
      )}

      {/* Historique Financier (Tableau + Graphiques) */}
      {annualFinancials && annualFinancials.data && annualFinancials.data.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">Historique Financier</h3>
            </div>
          </div>

          {/* Tableau */}
          <div className="mb-6">
            <AnnualFinancialsTable financials={annualFinancials.data} />
          </div>

          {/* Graphiques */}
          <div>
            <FinancialCharts financials={annualFinancials.data} />
          </div>
        </section>
      )}

      {/* Avertissement */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
        <p className="text-sm text-yellow-800">
          <strong>Note :</strong> Les données financières sont mises à jour périodiquement et peuvent ne pas refléter les résultats les plus récents. Ces informations ne constituent pas un conseil en investissement.
        </p>
      </div>
    </div>
  );
}
