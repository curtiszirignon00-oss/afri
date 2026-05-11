import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Info } from 'lucide-react';

interface FundamentalData {
  cours?: number;
  per?: number | string;
  pbr?: number | string;
  bna?: number | string;
  div?: number | string;
  roe?: number | string;
  note?: string;
  kofiAnalysis?: string;
}

interface Props {
  tickers: string[];
  fundamentals: Record<string, FundamentalData>;
}

const TICKER_NAMES: Record<string, { name: string; sector: string }> = {
  SNTS: { name: 'Sonatel', sector: 'Télécoms' },
  SGBC: { name: 'SGBCI', sector: 'Banque' },
  PALC: { name: 'PALM CI', sector: 'Agro-industrie' },
  SLBC: { name: 'SOLIBRA', sector: 'Brasserie' },
  SIBC: { name: 'SIB', sector: 'Banque' },
  CIEC: { name: 'CIE', sector: 'Utilities' },
  ORCI: { name: 'Orange CI', sector: 'Télécoms' },
  ETIT: { name: 'Ecobank Transnational', sector: 'Banque pan-africaine' },
  BICC: { name: 'BICI CI', sector: 'Banque' },
  ECOC: { name: 'Ecobank CI', sector: 'Banque' },
  CFAC: { name: 'CF Assurance', sector: 'Assurance' },
  BOABF: { name: 'Bank of Africa BF', sector: 'Banque' },
  BOAC: { name: 'Bank of Africa CI', sector: 'Banque' },
  BOAS: { name: 'Bank of Africa SN', sector: 'Banque' },
  SAPH: { name: 'SAPH', sector: 'Hévéa' },
  SOGB: { name: 'SOGB', sector: 'Caoutchouc' },
  FTSC: { name: 'Filtisac', sector: 'Emballage' },
};

const METRICS: Array<{
  key: keyof FundamentalData;
  label: string;
  fullName: string;
  explanation: string;
}> = [
  {
    key: 'per',
    label: 'PER',
    fullName: 'Price-to-Earnings Ratio',
    explanation: 'Combien tu paies pour 1 FCFA de bénéfice annuel. PER 9× = 9 FCFA investis pour chaque FCFA de profit. Inférieur à la moyenne BRVM (~11×) = potentiellement sous-valorisé.',
  },
  {
    key: 'pbr',
    label: 'P/B',
    fullName: 'Price-to-Book Ratio',
    explanation: 'Compare le cours de bourse à la valeur comptable des actifs (actifs − dettes). P/B < 1 = tu achètes moins cher que ce que valent les actifs sur le papier — signal rare.',
  },
  {
    key: 'bna',
    label: 'BNA',
    fullName: 'Bénéfice Net par Action',
    explanation: 'Part du bénéfice annuel de la société attribuable à chaque action. Une hausse du BNA = la société devient plus profitable. Comparer la croissance BNA au PER (ratio PEG).',
  },
  {
    key: 'div',
    label: 'Dividende',
    fullName: 'Dividende distribué (FCFA/action)',
    explanation: 'Montant versé en FCFA à chaque actionnaire par action. Divisé par le cours, il donne le rendement dividende. Ex: 700 FCFA / 14 000 FCFA = 5% de rendement annuel.',
  },
  {
    key: 'roe',
    label: 'ROE',
    fullName: 'Return on Equity (Rentabilité des fonds propres)',
    explanation: 'Mesure combien la société génère de bénéfices par rapport aux fonds propres investis. ROE > 15% = bonne rentabilité. Un ROE élevé et stable indique un avantage concurrentiel durable.',
  },
];

function fmt(v: number | string | undefined): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return String(v);
}

function MetricCard({
  label,
  fullName,
  explanation,
  value,
}: {
  label: string;
  fullName: string;
  explanation: string;
  value: string;
}) {
  if (value === '—') return null;
  return (
    <div className="relative group bg-white rounded-lg p-2 text-center border border-gray-100 cursor-help">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">{label}</p>
        <Info className="w-3 h-3 text-gray-300 group-hover:text-blue-400 transition-colors shrink-0" />
      </div>
      <p className="text-sm font-bold text-gray-900">{value}</p>

      {/* Tooltip */}
      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 text-left leading-relaxed">
        <p className="font-bold text-blue-300 mb-1">{label} — {fullName}</p>
        <p className="text-gray-200">{explanation}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

function TickerRow({ ticker, data }: { ticker: string; data: FundamentalData }) {
  const [open, setOpen] = useState(false);
  const meta = TICKER_NAMES[ticker];

  const visibleMetrics = METRICS.filter(m => fmt(data[m.key]) !== '—');

  return (
    <div className="border border-gray-100 rounded-xl">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left rounded-t-xl"
        onClick={() => setOpen(v => !v)}
        style={{ borderRadius: open ? '0.75rem 0.75rem 0 0' : '0.75rem' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">{ticker}</span>
              {meta && (
                <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium shrink-0">
                  {meta.sector}
                </span>
              )}
            </div>
            {meta && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{meta.name}</p>
            )}
          </div>
          {data.cours !== undefined && (
            <span className="text-sm text-gray-500 shrink-0 ml-2">
              {data.cours.toLocaleString('fr-FR')} FCFA
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3 rounded-b-xl">
          {/* Metrics grid — overflow-visible to allow tooltips */}
          {visibleMetrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
              {visibleMetrics.map(m => (
                <MetricCard
                  key={m.key}
                  label={m.label}
                  fullName={m.fullName}
                  explanation={m.explanation}
                  value={fmt(data[m.key])}
                />
              ))}
            </div>
          )}

          {data.note && (
            <p className="text-xs text-gray-600 leading-relaxed">{data.note}</p>
          )}

          {data.kofiAnalysis && (
            <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <Brain className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Analyse Simba</p>
                <p className="text-xs text-blue-800 leading-relaxed">{data.kofiAnalysis}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FundamentalsPanel({ tickers, fundamentals }: Props) {
  return (
    <div className="space-y-2">
      {tickers.map(ticker => (
        <TickerRow
          key={ticker}
          ticker={ticker}
          data={fundamentals[ticker] ?? {}}
        />
      ))}
    </div>
  );
}
