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
  SNTS:  { name: 'Sonatel',               sector: 'Télécoms' },
  SGBC:  { name: 'SGBCI',                 sector: 'Banque' },
  PALC:  { name: 'PALM CI',               sector: 'Agro-industrie' },
  SLBC:  { name: 'SOLIBRA',               sector: 'Brasserie' },
  SIBC:  { name: 'SIB',                   sector: 'Banque' },
  CIEC:  { name: 'CIE',                   sector: 'Utilities' },
  ORCI:  { name: 'Orange CI',             sector: 'Télécoms' },
  ETIT:  { name: 'Ecobank Transnational', sector: 'Banque pan-africaine' },
  BICC:  { name: 'BICI CI',               sector: 'Banque' },
  ECOC:  { name: 'Ecobank CI',            sector: 'Banque' },
  CFAC:  { name: 'CF Assurance',          sector: 'Assurance' },
  BOABF: { name: 'Bank of Africa BF',     sector: 'Banque' },
  BOAC:  { name: 'Bank of Africa CI',     sector: 'Banque' },
  BOAS:  { name: 'Bank of Africa SN',     sector: 'Banque' },
  SAPH:  { name: 'SAPH',                  sector: 'Hévéa' },
  SOGB:  { name: 'SOGB',                  sector: 'Caoutchouc' },
  FTSC:  { name: 'Filtisac',              sector: 'Emballage' },
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
    explanation: 'Compare le cours à la valeur comptable des actifs (actifs − dettes). P/B < 1 = tu achètes moins cher que ce que valent les actifs sur le papier — signal rare.',
  },
  {
    key: 'bna',
    label: 'BNA',
    fullName: 'Bénéfice Net par Action',
    explanation: 'Part du bénéfice annuel attribuable à chaque action. Une hausse du BNA signale que la société devient plus profitable. Comparer sa croissance au PER (ratio PEG).',
  },
  {
    key: 'div',
    label: 'Dividende',
    fullName: 'Dividende distribué (FCFA/action)',
    explanation: 'Montant versé en FCFA à chaque actionnaire. Divisé par le cours, il donne le rendement dividende. Ex: 700 FCFA / 14 000 FCFA = 5% de rendement annuel.',
  },
  {
    key: 'roe',
    label: 'ROE',
    fullName: 'Return on Equity',
    explanation: 'Mesure combien la société génère de bénéfices par rapport aux fonds propres investis. ROE > 15% = bonne rentabilité. Un ROE élevé et stable indique un avantage concurrentiel durable.',
  },
];

function fmt(v: number | string | undefined): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return String(v);
}

function MetricCard({ label, fullName, explanation, value }: { label: string; fullName: string; explanation: string; value: string }) {
  if (value === '—') return null;
  return (
    <div className="relative group bg-white/8 hover:bg-white/12 rounded-lg p-2 text-center border border-white/10 cursor-help transition-colors">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wide">{label}</p>
        <Info className="w-3 h-3 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
      </div>
      <p className="text-sm font-bold text-white">{value}</p>

      {/* Tooltip */}
      <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-slate-900 border border-amber-500/30 text-white text-xs rounded-xl p-3 shadow-2xl shadow-black/50
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 text-left leading-relaxed">
        <p className="font-bold text-amber-400 mb-1">{label} — {fullName}</p>
        <p className="text-slate-300">{explanation}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}

function TickerRow({ ticker, data }: { ticker: string; data: FundamentalData }) {
  const [open, setOpen] = useState(false);
  const meta = TICKER_NAMES[ticker];
  const visibleMetrics = METRICS.filter(m => fmt(data[m.key]) !== '—');

  return (
    <div className="border border-white/10 rounded-xl overflow-visible">
      <button
        className={`w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/8 transition-colors text-left ${open ? 'rounded-t-xl border-b border-white/10' : 'rounded-xl'}`}
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-white">{ticker}</span>
              {meta && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-semibold shrink-0">
                  {meta.sector}
                </span>
              )}
            </div>
            {meta && (
              <p className="text-xs text-slate-500 mt-0.5">{meta.name}</p>
            )}
          </div>
          {data.cours !== undefined && (
            <span className="text-xs text-slate-400 shrink-0 tabular-nums">
              {data.cours.toLocaleString('fr-FR')} FCFA
            </span>
          )}
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
          : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 bg-white/3 space-y-3 rounded-b-xl">
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
            <p className="text-xs text-slate-400 leading-relaxed">{data.note}</p>
          )}

          {data.kofiAnalysis && (
            <div className="flex gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
              <Brain className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-0.5">Analyse Simba</p>
                <p className="text-xs text-violet-200 leading-relaxed">{data.kofiAnalysis}</p>
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
