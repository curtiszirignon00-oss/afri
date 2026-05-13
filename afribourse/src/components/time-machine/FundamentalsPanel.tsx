import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain, Info, TrendingUp, TrendingDown } from 'lucide-react';

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
  fundamentals: Record<string, FundamentalData>;        // current year (DB + seed)
  historicalFundamentals: Record<string, Record<string, FundamentalData>>; // year→ticker→data (seed)
  years: number[];         // all years up to current  e.g. [2010, 2013, 2016]
  currentYear: number;
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

function fmtNum(v: number | string | undefined): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  return String(v);
}

function delta(prev: number | string | undefined, curr: number | string | undefined): number | null {
  if (typeof prev !== 'number' || typeof curr !== 'number' || prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function DeltaBadge({ pct }: { pct: number }) {
  const pos = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 rounded-full ${
      pos ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
    }`}>
      {pos ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
      {pos ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
}

function CoursTimeline({ ticker, years, historicalFundamentals, currentFundamentals, currentYear }: {
  ticker: string;
  years: number[];
  historicalFundamentals: Record<string, Record<string, FundamentalData>>;
  currentFundamentals: FundamentalData;
  currentYear: number;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center gap-1 min-w-0">
        {years.map((yr, i) => {
          const isCurr = yr === currentYear;
          const data = isCurr ? currentFundamentals : (historicalFundamentals[String(yr)]?.[ticker] ?? {});
          const cours = data.cours;
          const prevYr = i > 0 ? years[i - 1] : null;
          const prevData = prevYr
            ? (prevYr === currentYear ? currentFundamentals : (historicalFundamentals[String(prevYr)]?.[ticker] ?? {}))
            : null;
          const pct = prevData ? delta(prevData.cours, cours) : null;

          return (
            <div key={yr} className="flex items-center gap-1 shrink-0">
              {/* Delta from previous year */}
              {pct !== null && (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-6 h-px bg-gray-300" />
                  <DeltaBadge pct={pct} />
                  <div className="w-6 h-px bg-gray-300" />
                </div>
              )}
              {/* Year box */}
              <div className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl border text-center min-w-[72px] ${
                isCurr
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isCurr ? 'text-amber-600' : 'text-gray-400'}`}>
                  {yr}{isCurr ? ' ★' : ''}
                </span>
                <span className={`text-xs font-bold tabular-nums mt-0.5 ${isCurr ? 'text-amber-700' : 'text-gray-700'}`}>
                  {cours !== undefined ? cours.toLocaleString('fr-FR') : '—'}
                </span>
                <span className="text-[8px] text-gray-400">FCFA</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const METRICS: Array<{
  key: keyof FundamentalData;
  label: string;
  fullName: string;
  explanation: string;
  numeric: boolean;
  suffix?: string;
}> = [
  { key: 'per',  label: 'PER',       fullName: 'Price-to-Earnings Ratio',        explanation: 'Combien tu paies pour 1 FCFA de bénéfice annuel. PER 9× = 9 FCFA investis pour chaque FCFA de profit. Inférieur à la moyenne BRVM (~11×) = potentiellement sous-valorisé.', numeric: false },
  { key: 'pbr',  label: 'P/B',       fullName: 'Price-to-Book Ratio',            explanation: 'Compare le cours à la valeur comptable des actifs (actifs − dettes). P/B < 1 = tu achètes moins cher que ce que valent les actifs sur le papier — signal rare.', numeric: false },
  { key: 'bna',  label: 'BNA',       fullName: 'Bénéfice Net par Action (croissance)', explanation: 'Variation du bénéfice net par action vs l\'année précédente. Une hausse signale une société qui devient plus profitable. Comparer sa croissance au PER (ratio PEG).', numeric: false },
  { key: 'div',  label: 'Dividende', fullName: 'Dividende distribué (FCFA/action)', explanation: 'Montant versé en FCFA à chaque actionnaire. Divisé par le cours, il donne le rendement dividende. Ex: 700 FCFA / 14 000 FCFA = 5% de rendement annuel.', numeric: true, suffix: 'F' },
];

function MetricEvolutionRow({ metricKey, label, fullName, explanation, numeric, suffix, ticker, years, historicalFundamentals, currentFundamentals, currentYear }: {
  metricKey: keyof FundamentalData;
  label: string;
  fullName: string;
  explanation: string;
  numeric: boolean;
  suffix?: string;
  ticker: string;
  years: number[];
  historicalFundamentals: Record<string, Record<string, FundamentalData>>;
  currentFundamentals: FundamentalData;
  currentYear: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const values = years.map(yr => {
    const isCurr = yr === currentYear;
    const data = isCurr ? currentFundamentals : (historicalFundamentals[String(yr)]?.[ticker] ?? {});
    return data[metricKey];
  });

  const hasAny = values.some(v => v !== undefined && v !== null && v !== '');
  if (!hasAny) return null;

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
      {/* Metric label with tooltip */}
      <div className="relative shrink-0 w-20">
        <button
          className="flex items-center gap-1 text-left group"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</span>
          <Info className="w-2.5 h-2.5 text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" />
        </button>
        {showTooltip && (
          <div className="absolute z-50 bottom-full left-0 mb-2 w-56 bg-gray-900 border border-gray-700 text-white text-xs rounded-xl p-3 shadow-2xl text-left leading-relaxed">
            <p className="font-bold text-amber-400 mb-1">{label} — {fullName}</p>
            <p className="text-gray-300">{explanation}</p>
            <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>

      {/* Values per year */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {years.map((yr, i) => {
          const isCurr = yr === currentYear;
          const val = values[i];
          const prevVal = i > 0 ? values[i - 1] : undefined;
          const pct = numeric && typeof val === 'number' && typeof prevVal === 'number'
            ? delta(prevVal, val)
            : null;

          const display = val !== undefined && val !== null && val !== ''
            ? (typeof val === 'number' ? val.toLocaleString('fr-FR') + (suffix ? ' ' + suffix : '') : String(val))
            : '—';

          return (
            <div key={yr} className="flex items-center gap-1.5 shrink-0">
              {/* Delta */}
              {i > 0 && pct !== null && (
                <DeltaBadge pct={pct} />
              )}
              {/* Value */}
              <span className={`text-xs tabular-nums font-semibold px-1.5 py-0.5 rounded-lg ${
                isCurr
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {display}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TickerRow({ ticker, currentFundamentals, historicalFundamentals, years, currentYear }: {
  ticker: string;
  currentFundamentals: FundamentalData;
  historicalFundamentals: Record<string, Record<string, FundamentalData>>;
  years: number[];
  currentYear: number;
}) {
  const [open, setOpen] = useState(false);
  const meta = TICKER_NAMES[ticker];
  const cours = currentFundamentals.cours;
  const showHistory = years.length > 1;

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-visible">
      <button
        className={`w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left ${
          open ? 'rounded-t-xl border-b border-gray-100' : 'rounded-xl'
        }`}
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-gray-900">{ticker}</span>
              {meta && (
                <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold shrink-0">
                  {meta.sector}
                </span>
              )}
            </div>
            {meta && <p className="text-xs text-gray-400 mt-0.5">{meta.name}</p>}
          </div>
          {cours !== undefined && (
            <span className="text-xs text-gray-500 shrink-0 tabular-nums font-medium">
              {cours.toLocaleString('fr-FR')} FCFA
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 bg-gray-50 space-y-4 rounded-b-xl">

          {/* Cours timeline — only if multiple years */}
          {showHistory && (
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Évolution du cours</p>
              <CoursTimeline
                ticker={ticker}
                years={years}
                historicalFundamentals={historicalFundamentals}
                currentFundamentals={currentFundamentals}
                currentYear={currentYear}
              />
            </div>
          )}

          {/* Metrics evolution table */}
          <div>
            {showHistory && (
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Fondamentaux</p>
                <div className="flex gap-1">
                  {years.map(yr => (
                    <span key={yr} className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                      yr === currentYear ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'
                    }`}>{yr}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-100 px-3 py-1">
              {METRICS.map(m => (
                <MetricEvolutionRow
                  key={m.key}
                  metricKey={m.key}
                  label={m.label}
                  fullName={m.fullName}
                  explanation={m.explanation}
                  numeric={m.numeric}
                  suffix={m.suffix}
                  ticker={ticker}
                  years={years}
                  historicalFundamentals={historicalFundamentals}
                  currentFundamentals={currentFundamentals}
                  currentYear={currentYear}
                />
              ))}
            </div>
          </div>

          {/* Note */}
          {currentFundamentals.note && (
            <p className="text-xs text-gray-500 leading-relaxed">{currentFundamentals.note}</p>
          )}

          {/* Simba analysis */}
          {currentFundamentals.kofiAnalysis && (
            <div className="flex gap-2 bg-violet-50 border border-violet-200 rounded-xl p-3">
              <Brain className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-0.5">Analyse Simba</p>
                <p className="text-xs text-violet-800 leading-relaxed">{currentFundamentals.kofiAnalysis}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FundamentalsPanel({ tickers, fundamentals, historicalFundamentals, years, currentYear }: Props) {
  return (
    <div className="space-y-2">
      {tickers.map(ticker => (
        <TickerRow
          key={ticker}
          ticker={ticker}
          currentFundamentals={fundamentals[ticker] ?? {}}
          historicalFundamentals={historicalFundamentals}
          years={years}
          currentYear={currentYear}
        />
      ))}
    </div>
  );
}
