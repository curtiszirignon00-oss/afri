// src/components/home/HeroIndexChart.tsx
import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { apiFetch } from '../../hooks/useApi';
import type { MarketIndexHistory } from '../../types';

const INDEX_NAME = 'BRVM-C';
const PERIOD = '1Y';

// Trace en coordonnees de viewBox : le SVG l'etire ensuite a la largeur reelle.
// Aucun recalcul au redimensionnement, aucun ResizeObserver.
const VB_W = 600;
const VB_H = 200;

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/**
 * Courbe du BRVM Composite pour le hero.
 *
 * Dessinee en SVG plutot qu'avec lightweight-charts : cette librairie pese
 * ~150 Ko et le reste de l'app la charge en lazy pour cette raison meme
 * (cf. IndicesPage). Dans le hero, au-dessus de la ligne de flottaison, elle
 * retarderait le premier rendu. Un trace statique suffit ici — la lecture fine
 * se fait sur la page Marches.
 */
export default function HeroIndexChart() {
  const [history, setHistory] = useState<MarketIndexHistory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: MarketIndexHistory[] }>(`/indices/history/${INDEX_NAME}?period=${PERIOD}`)
      .then((res) => {
        if (cancelled) return;
        const points = res?.data ?? [];
        setHistory(points);
        setStatus(points.length >= 2 ? 'ready' : 'error');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  const chart = useMemo(() => {
    if (history.length < 2) return null;

    const values = history.map((h) => h.close);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1; // evite la division par zero sur une serie plate

    const x = (i: number) => (i / (values.length - 1)) * VB_W;
    const y = (v: number) => VB_H - ((v - min) / span) * VB_H;

    const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${VB_W},${VB_H} L0,${VB_H} Z`;

    const last = values[values.length - 1];
    const prev = values[values.length - 2];
    const change = last - prev;

    return { line, area, last, percent: (change / prev) * 100, isUp: change >= 0 };
  }, [history]);

  // Vert / rouge : la couleur porte le sens (hausse / baisse), elle n'est pas
  // decorative. C'est la seule entorse assumee a la palette navy/orange/ink.
  const accent = chart?.isUp === false ? '#dc2626' : '#059669';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-navy">BRVM Composite</p>
          <p className="text-sm text-gray-500 mt-0.5">Sur un an</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          En direct
        </span>
      </div>

      {status === 'loading' && (
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded bg-gray-100" />
          <div className="mt-4 h-[200px] rounded-lg bg-gray-100" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex h-[248px] items-center justify-center text-center">
          <p className="text-sm text-gray-500">
            Cotations momentanément indisponibles.<br />
            <span className="text-gray-400">Réessayez dans un instant.</span>
          </p>
        </div>
      )}

      {status === 'ready' && chart && (
        <>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold text-gray-900 font-mono">{fmt(chart.last)}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold ${
                chart.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {chart.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {chart.isUp ? '+' : ''}{chart.percent.toFixed(2)}%
            </span>
          </div>

          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            className="mt-4 h-[200px] w-full"
            role="img"
            aria-label={`Évolution du BRVM Composite sur un an. Dernier point : ${fmt(chart.last)}.`}
          >
            <defs>
              <linearGradient id="heroIndexFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
                <stop offset="100%" stopColor={accent} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.area} fill="url(#heroIndexFill)" />
            {/* vector-effect : l'epaisseur du trait reste constante malgre
                l'etirement non uniforme impose par preserveAspectRatio="none". */}
            <path
              d={chart.line}
              fill="none"
              stroke={accent}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </>
      )}
    </div>
  );
}
