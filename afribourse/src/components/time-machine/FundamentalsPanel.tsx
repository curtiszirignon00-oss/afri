import { useState } from 'react';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';

interface FundamentalData {
  cours?: number;
  per?: number | string;
  pbr?: number | string;
  bna?: number | string;
  div?: number | string;
  note?: string;
  kofiAnalysis?: string;
}

interface Props {
  tickers: string[];
  fundamentals: Record<string, FundamentalData>;
}

function fmt(v: number | string | undefined): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  return String(v);
}

function TickerRow({ ticker, data }: { ticker: string; data: FundamentalData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-gray-900">{ticker}</span>
          {data.cours !== undefined && (
            <span className="text-sm text-gray-500">
              {data.cours.toLocaleString('fr-FR')} FCFA
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            {[
              { label: 'PER', value: fmt(data.per) },
              { label: 'PBR', value: fmt(data.pbr) },
              { label: 'BNA', value: fmt(data.bna) },
              { label: 'Dividende', value: fmt(data.div) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase font-semibold">{label}</p>
                <p className="text-sm font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

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
