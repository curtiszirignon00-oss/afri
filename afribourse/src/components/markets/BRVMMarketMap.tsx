// src/components/markets/BRVMMarketMap.tsx
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Share2, Check, Copy } from 'lucide-react';
import { apiFetch, type Stock } from '../../hooks/useApi';
import { getStockLogo } from '../../utils/stockLogos';

// ─── Périodes ─────────────────────────────────────────────────────────────────
type Period = '1D' | '1W' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '3Y' | '5Y';
type Steps = [number, number, number];

interface PeriodDef {
  key: Period;
  short: string;   // bouton
  label: string;   // en-tête
  phrase: string;  // textes de partage
  steps: Steps;    // seuils de couleur : une variation de 3 % est forte sur un jour, banale sur un an
}

const PERIODS: PeriodDef[] = [
  { key: '1D',  short: '1J',  label: 'JOUR',                  phrase: "aujourd'hui",           steps: [0.5, 1.5, 3] },
  { key: '1W',  short: '1S',  label: '1 SEMAINE',             phrase: 'sur 1 semaine',         steps: [1, 3, 6] },
  { key: '1M',  short: '1M',  label: '1 MOIS',                phrase: 'sur 1 mois',            steps: [2, 5, 10] },
  { key: '3M',  short: '3M',  label: '3 MOIS',                phrase: 'sur 3 mois',            steps: [3, 8, 15] },
  { key: '6M',  short: '6M',  label: '6 MOIS',                phrase: 'sur 6 mois',            steps: [5, 12, 25] },
  { key: 'YTD', short: 'YTD', label: 'DEPUIS LE 1ER JANVIER', phrase: 'depuis le 1er janvier', steps: [5, 12, 25] },
  { key: '1Y',  short: '1A',  label: '1 AN',                  phrase: 'sur 1 an',              steps: [8, 20, 40] },
  { key: '3Y',  short: '3A',  label: '3 ANS',                 phrase: 'sur 3 ans',             steps: [15, 35, 70] },
  { key: '5Y',  short: '5A',  label: '5 ANS',                 phrase: 'sur 5 ans',             steps: [20, 50, 100] },
];
const PERIOD_BY_KEY = Object.fromEntries(PERIODS.map(p => [p.key, p])) as Record<Period, PeriodDef>;

/** YTD : l'échelle suit le nombre de jours écoulés depuis le 1er janvier. */
function stepsFor(period: Period): Steps {
  if (period !== 'YTD') return PERIOD_BY_KEY[period].steps;
  const now = new Date();
  const days = (now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86_400_000;
  const ref: Period = days <= 10 ? '1W' : days <= 45 ? '1M' : days <= 120 ? '3M' : days <= 240 ? '6M' : '1Y';
  return PERIOD_BY_KEY[ref].steps;
}

type SizeMode  = 'change' | 'cap';
type ColorMode = 'change' | 'sector';

// ─── Données serveur (GET /stocks/market-map) ────────────────────────────────
interface MarketMapItem {
  symbol: string;
  change_percent: number | null;
  base_price: number | null;
  base_date: string | null;
  current_price: number;
  market_cap: number | null;
  adjusted: boolean;
  suspect: boolean;
}

interface MarketMapResponse {
  period: Period;
  reference_date: string | null;
  as_of: string | null;
  items: MarketMapItem[];
}

// ─── Types internes ───────────────────────────────────────────────────────────
type MapStock = Stock & {
  change: number | null;    // variation sur la période ; null = historique insuffisant
  cap: number | null;       // capitalisation FCFA (cours × titres), null = inconnue
  basePrice: number | null;
  baseDate: string | null;
  adjusted: boolean;
  suspect: boolean;
};

interface Rect { x: number; y: number; width: number; height: number }

interface TreemapCell extends Rect {
  stock: MapStock;
}

interface SectorBlock extends Rect {
  name: string;
  change: number | null;
  header: number;
}

interface TooltipProps {
  cell: TreemapCell;
  mouseX: number;
  mouseY: number;
  period: Period;
  totalCap: number;
  changesReady: boolean;
}

// ─── Secteurs & couleurs BRVM réels ──────────────────────────────────────────
const SECTOR_COLORS: Record<string, string> = {
  'Services Financiers':          '#0ea5e9',
  'Télécommunications':           '#8b5cf6',
  'Consommation de Base':         '#10b981',
  'Consommation Discrétionnaire': '#f59e0b',
  'Energie':                      '#ef4444',
  'Industriels':                  '#ec4899',
  'Services Publics':             '#06b6d4',
};
const NO_SECTOR = 'Autres';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const GREENS  = ['#86efac', '#4ade80', '#22c55e', '#16a34a']; // faible → fort
const REDS    = ['#fca5a5', '#f87171', '#ef4444', '#b91c1c'];
const NEUTRAL = '#475569'; // inchangé : fréquent à la BRVM (titres peu liquides)
const NO_DATA = '#1e293b';

function getChangeColor(change: number | null, [s1, s2, s3]: Steps): string {
  if (change === null) return NO_DATA;
  if (Math.abs(change) < 0.005) return NEUTRAL;
  const a = Math.abs(change);
  const i = a >= s3 ? 3 : a >= s2 ? 2 : a >= s1 ? 1 : 0;
  return change > 0 ? GREENS[i] : REDS[i];
}

function formatChange(v: number | null): string {
  if (v === null) return 'N/D';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function formatMarketCap(v: number): string {
  const nf = (n: number, d: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
  if (v >= 1e9) return `${nf(v / 1e9, v >= 1e11 ? 0 : 1)} Mds F`;
  if (v >= 1e6) return `${nf(v / 1e6, 0)} M F`;
  return `${v.toLocaleString('fr-FR')} F`;
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(v) + ' F';
}

function formatDay(iso: string, opts: Intl.DateTimeFormatOptions): string {
  // Dates de référence au format YYYY-MM-DD (UTC) : midi UTC évite tout décalage de jour
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return d.toLocaleDateString('fr-FR', { ...opts, timeZone: 'UTC' });
}

/**
 * Capitalisation en FCFA depuis le flux /stocks : cours × nombre de titres, à défaut
 * capitalisation des fondamentaux normalisée (< 1e9 ⇒ exprimée en millions). Même règle
 * que marketCapFCFA côté serveur ; stock.market_cap n'est pas fiable. Ne dépend pas de la
 * période : en mode capitalisation la disposition reste identique quelle que soit la durée.
 */
function stockCap(s: Stock): number | null {
  const fund   = s.fundamentals?.[0];
  const shares = fund?.shares_outstanding ?? s.shares_outstanding;
  if (s.current_price > 0 && shares && shares > 0) return s.current_price * shares;
  const fundCap = fund?.market_cap;
  if (fundCap && fundCap > 0) return fundCap < 1e9 ? fundCap * 1e6 : fundCap;
  return null;
}

/**
 * Variation agrégée pondérée par la capitalisation, comme un indice :
 * Σ cap actuelle / Σ cap en début de période − 1, avec cap début = cap / (1 + r).
 * Pondérer par la cap actuelle surpondérerait les titres qui ont monté.
 * Repli sur la moyenne simple si aucune capitalisation n'est connue.
 */
function aggregateChange(list: MapStock[]): { value: number | null; weighted: boolean } {
  let now = 0;
  let before = 0;
  for (const s of list) {
    if (s.change === null || !s.cap || s.change <= -100) continue;
    now    += s.cap;
    before += s.cap / (1 + s.change / 100);
  }
  if (before > 0) return { value: (now / before - 1) * 100, weighted: true };
  const known = list.filter(s => s.change !== null);
  if (!known.length) return { value: null, weighted: false };
  return { value: known.reduce((sum, s) => sum + (s.change as number), 0) / known.length, weighted: false };
}

// ─── Squarified treemap générique ────────────────────────────────────────────
function squarify<T>(items: T[], weightOf: (t: T) => number, rect: Rect): Array<Rect & { item: T }> {
  const nodes = items
    .map(item => ({ item, w: weightOf(item) }))
    .filter(n => n.w > 0 && Number.isFinite(n.w))
    .sort((a, b) => b.w - a.w);
  const out: Array<Rect & { item: T }> = [];

  function layout(list: typeof nodes, x: number, y: number, w: number, h: number) {
    if (!list.length) return;
    if (list.length === 1) {
      out.push({ item: list[0].item, x, y, width: w, height: h });
      return;
    }

    const total = list.reduce((s, n) => s + n.w, 0);
    const horiz = w >= h;          // plus large que haut → bande verticale à gauche
    const side  = horiz ? h : w;

    let split = 1;
    let bestWorst = Infinity;
    let rowSum = 0;
    for (let i = 0; i < list.length; i++) {
      rowSum += list[i].w;
      const rowSide = (horiz ? w : h) * (rowSum / total);
      let worst = 0;
      for (let j = 0; j <= i; j++) {
        const cellSide = side * (list[j].w / rowSum);
        worst = Math.max(worst, rowSide / cellSide, cellSide / rowSide);
      }
      if (worst < bestWorst) { bestWorst = worst; split = i + 1; }
      else break;
    }

    const row  = list.slice(0, split);
    const rt   = row.reduce((s, n) => s + n.w, 0);
    const frac = rt / total;

    let off = 0;
    for (const n of row) {
      const sf = n.w / rt;
      if (horiz) {
        out.push({ item: n.item, x, y: y + off, width: w * frac, height: h * sf });
        off += h * sf;
      } else {
        out.push({ item: n.item, x: x + off, y, width: w * sf, height: h * frac });
        off += w * sf;
      }
    }

    if (horiz) layout(list.slice(split), x + w * frac, y, w * (1 - frac), h);
    else       layout(list.slice(split), x, y + h * frac, w, h * (1 - frac));
  }

  layout(nodes, rect.x, rect.y, rect.width, rect.height);
  return out;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({ cell, mouseX, mouseY, period, totalCap, changesReady }: TooltipProps) {
  const { stock } = cell;
  const sectorColor = SECTOR_COLORS[stock.sector || ''] || '#64748b';
  const def = PERIOD_BY_KEY[period];
  const left = Math.min(mouseX + 16, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 260);
  return (
    <div
      style={{
        position: 'fixed',
        left: Math.max(8, left),
        top: mouseY - 20,
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'rgba(10,14,23,0.97)',
        border: `1px solid ${sectorColor}55`,
        borderRadius: 12,
        padding: '14px 18px',
        minWidth: 230,
        maxWidth: 260,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 0 30px ${sectorColor}33, 0 8px 32px rgba(0,0,0,0.6)`,
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {(() => {
          const logo = getStockLogo(stock.symbol, stock.logo_url);
          return logo ? (
            <img
              src={logo}
              alt={stock.symbol}
              style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'contain', background: 'rgba(255,255,255,0.08)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: 38, height: 38, borderRadius: 8,
              background: sectorColor + '22',
              border: `1px solid ${sectorColor}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: sectorColor,
            }}>
              {stock.symbol.slice(0, 4)}
            </div>
          );
        })()}
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{stock.symbol}</div>
          <div style={{ color: '#64748b', fontSize: 10 }}>{stock.company_name}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        <TooltipStat label="Prix" value={formatPrice(stock.current_price)} color="#f1f5f9" />
        <TooltipStat
          label={`Var. ${def.short}`}
          value={changesReady ? formatChange(stock.change) : '—'}
          color={stock.change === null ? '#64748b' : stock.change >= 0 ? '#22c55e' : '#ef4444'}
        />
        {stock.basePrice ? (
          <TooltipStat
            label={period === '1D' ? 'Clôture veille' : stock.baseDate ? `Réf. ${formatDay(stock.baseDate, { day: '2-digit', month: '2-digit', year: '2-digit' })}` : 'Référence'}
            value={formatPrice(stock.basePrice)}
            color="#94a3b8"
          />
        ) : null}
        {stock.cap ? (
          <TooltipStat
            label="Cap. Boursière"
            value={totalCap > 0 ? `${formatMarketCap(stock.cap)} · ${((stock.cap / totalCap) * 100).toFixed(1)}%` : formatMarketCap(stock.cap)}
            color="#94a3b8"
          />
        ) : null}
        {period === '1D' && (
          <TooltipStat label="Volume" value={(stock.volume || 0).toLocaleString('fr-FR')} color="#94a3b8" />
        )}
        {changesReady && stock.change === null && (
          <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: 10 }}>
            Historique insuffisant sur la période.
          </div>
        )}
        {stock.adjusted && (
          <div style={{ gridColumn: '1 / -1', color: '#94a3b8', fontSize: 10 }}>
            Cours de référence ajusté d'une opération sur titres.
          </div>
        )}
        {stock.suspect && (
          <div style={{ gridColumn: '1 / -1', color: '#f59e0b', fontSize: 10 }}>
            ⚠ Écart inhabituel : possible split non référencé.
          </div>
        )}
        {stock.sector && (
          <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
            <span style={{
              display: 'inline-block',
              background: sectorColor + '22',
              color: sectorColor,
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 10,
              border: `1px solid ${sectorColor}44`,
            }}>
              {stock.sector}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TooltipStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 13, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BRVMMarketMapProps {
  stocks: Stock[];
  loading?: boolean;
}

// ─── Composant Principal ──────────────────────────────────────────────────────
export default function BRVMMarketMap({ stocks, loading = false }: BRVMMarketMapProps) {
  const navigate = useNavigate();

  const [selectedSector, setSelectedSector] = useState('Tous');
  const [hoveredCell,    setHoveredCell]    = useState<TreemapCell | null>(null);
  const [mousePos,       setMousePos]       = useState({ x: 0, y: 0 });
  const [colorMode,      setColorMode]      = useState<ColorMode>('change');
  const [sizeMode,       setSizeMode]       = useState<SizeMode>('change');
  const [period,         setPeriod]         = useState<Period>('1D');

  const def   = PERIOD_BY_KEY[period];
  const steps = useMemo(() => stepsFor(period), [period]);

  // Variations de période + capitalisations fiables. Pas de placeholderData :
  // afficher les chiffres de la période précédente sous le nouveau libellé serait faux.
  const mapQuery = useQuery({
    queryKey: ['market-map', period],
    queryFn: () => apiFetch<MarketMapResponse>('/stocks/market-map', { params: { period } }),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const mapData = mapQuery.data;

  // ── export / partage ──
  const svgRef          = useRef<SVGSVGElement>(null);
  const shareMenuRef    = useRef<HTMLDivElement>(null);
  const [isCapturing,   setIsCapturing]   = useState(false);
  const [showShare,     setShowShare]     = useState(false);
  const [copied,        setCopied]        = useState(false);

  // Fermer le menu partage si clic en dehors
  useEffect(() => {
    if (!showShare) return;
    function onOutside(e: MouseEvent) {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showShare]);

  // ── Données ───────────────────────────────────────────────────────────────
  const availableSectors = useMemo(() => {
    const set = new Set(stocks.map(s => s.sector).filter(Boolean) as string[]);
    return ['Tous', ...Array.from(set).sort()];
  }, [stocks]);

  const mapStocks = useMemo((): MapStock[] => {
    const items = new Map((mapData?.items ?? []).map(i => [i.symbol, i]));
    return stocks.map(s => {
      const it = items.get(s.symbol);
      // 1D : variation du flux /stocks (rafraîchi toutes les 30 s), le serveur ne sert ici que la cap
      const change = period === '1D'
        ? (Number.isFinite(s.daily_change_percent) ? s.daily_change_percent : null)
        : (it?.change_percent ?? null);
      return {
        ...s,
        change,
        cap: stockCap(s) ?? (it?.market_cap && it.market_cap > 0 ? it.market_cap : null),
        basePrice: period === '1D' ? (s.previous_close > 0 ? s.previous_close : null) : (it?.base_price ?? null),
        baseDate: it?.base_date ?? null,
        adjusted: !!it?.adjusted,
        suspect: !!it?.suspect,
      };
    });
  }, [stocks, mapData, period]);

  const sectorStocks = useMemo(
    () => (selectedSector === 'Tous' ? mapStocks : mapStocks.filter(s => s.sector === selectedSector)),
    [mapStocks, selectedSector],
  );

  // Titres affichés : en mode variation, il faut une variation ; en mode cap, une capitalisation
  const shownStocks = useMemo(
    () => sectorStocks.filter(s => (sizeMode === 'cap' ? s.cap !== null : s.change !== null)),
    [sectorStocks, sizeMode],
  );
  const missingCount = sectorStocks.length - shownStocks.length;
  const noChangeCount = shownStocks.filter(s => s.change === null).length;

  const W = 900;
  const H = 520;
  const GAP = 2;

  const totalCap = useMemo(() => shownStocks.reduce((s, st) => s + (st.cap ?? 0), 0), [shownStocks]);

  const { cells, sectorBlocks } = useMemo((): { cells: TreemapCell[]; sectorBlocks: SectorBlock[] } => {
    const toCells = (list: Array<Rect & { item: MapStock }>): TreemapCell[] =>
      list.map(({ item, ...r }) => ({ stock: item, ...r }));

    if (sizeMode === 'change') {
      // Surface ∝ |variation| ; plancher pour que les titres inchangés restent visibles
      const floor = steps[0] * 0.6;
      return {
        cells: toCells(squarify(shownStocks, s => Math.max(Math.abs(s.change ?? 0), floor), { x: 0, y: 0, width: W, height: H })),
        sectorBlocks: [],
      };
    }

    if (selectedSector !== 'Tous') {
      return { cells: toCells(squarify(shownStocks, s => s.cap ?? 0, { x: 0, y: 0, width: W, height: H })), sectorBlocks: [] };
    }

    // Surface ∝ capitalisation, regroupée par secteur (blocs secteur puis titres à l'intérieur)
    const groups = new Map<string, MapStock[]>();
    for (const s of shownStocks) {
      const key = s.sector || NO_SECTOR;
      groups.set(key, [...(groups.get(key) ?? []), s]);
    }
    const sectorList = Array.from(groups, ([name, list]) => ({
      name, list, cap: list.reduce((sum, s) => sum + (s.cap ?? 0), 0),
    }));

    const blocks: SectorBlock[] = [];
    const allCells: TreemapCell[] = [];
    for (const { item, ...r } of squarify(sectorList, g => g.cap, { x: 0, y: 0, width: W, height: H })) {
      const header = r.height > 44 && r.width > 70 ? 16 : 0;
      blocks.push({ ...r, name: item.name, change: aggregateChange(item.list).value, header });
      allCells.push(...toCells(squarify(item.list, s => s.cap ?? 0, {
        x: r.x + 1, y: r.y + header, width: Math.max(r.width - 2, 0), height: Math.max(r.height - header - 1, 0),
      })));
    }
    return { cells: allCells, sectorBlocks: blocks };
  }, [shownStocks, sizeMode, selectedSector, steps]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const aggregate    = useMemo(() => aggregateChange(sectorStocks), [sectorStocks]);
  const marketChange = aggregate.value ?? 0;

  // Seules les variations hors 1D viennent du serveur. La capitalisation (taille en mode
  // capitalisation) vient de /stocks : la carte par capitalisation s'affiche toujours,
  // seules ses couleurs attendent les variations de la période.
  const changesPending = period !== '1D' && !mapData && !mapQuery.isError;
  const changesFailed  = period !== '1D' && !mapData && mapQuery.isError;
  const changesReady   = !changesPending && !changesFailed;
  const sizePending    = sizeMode === 'change' && !changesReady;
  const errorDetail    = mapQuery.error instanceof Error ? mapQuery.error.message : '';

  const subtitleDate = period === '1D'
    ? `SÉANCE DU ${formatDay(mapData?.as_of ?? new Date().toISOString(), { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}`
    : mapData?.reference_date
      ? `VARIATION ${def.phrase.toUpperCase()} • RÉF. CLÔTURE DU ${formatDay(mapData.reference_date, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}`
      : `VARIATION ${def.phrase.toUpperCase()}`;

  const shareLabel = `${formatChange(marketChange)} ${def.phrase}`;

  // ── Inline images → base64 pour l'export (logos bloqués par CORS sinon) ──
  async function inlineSvgImages(svgEl: SVGSVGElement): Promise<void> {
    const images = Array.from(svgEl.querySelectorAll('image'));
    await Promise.all(images.map(async (imgEl) => {
      const href = imgEl.getAttribute('href') ?? imgEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href || href.startsWith('data:')) return;
      try {
        const res  = await fetch(href, { mode: 'cors' });
        const blob = await res.blob();
        const b64  = await new Promise<string>((ok) => {
          const reader = new FileReader();
          reader.onload = () => ok(reader.result as string);
          reader.readAsDataURL(blob);
        });
        imgEl.setAttribute('href', b64);
        imgEl.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      } catch {
        // logo inaccessible → on laisse le SVG sans ce logo
      }
    }));
  }

  // ── Capture SVG → PNG canvas ──────────────────────────────────────────────
  async function captureToBlob(): Promise<Blob | null> {
    const svgEl = svgRef.current;
    if (!svgEl) return null;

    const CW = 960;   // largeur canvas export
    const CH = 590;   // hauteur = 520 treemap + 70 footer branding

    // Cloner et fixer les dimensions
    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('width',   String(CW));
    clone.setAttribute('height',  String(CH - 70));
    clone.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Convertir tous les logos en base64 avant sérialisation
    await inlineSvgImages(clone);

    return new Promise((resolve) => {
      const svgStr  = new XMLSerializer().serializeToString(clone);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl  = URL.createObjectURL(svgBlob);

      const canvas  = document.createElement('canvas');
      canvas.width  = CW;
      canvas.height = CH;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(svgUrl); resolve(null); return; }

      // Fond global
      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, CW, CH);

      const img = new Image();
      img.onload = () => {
        // Dessiner le treemap
        ctx.drawImage(img, 0, 0, CW, CH - 70);
        URL.revokeObjectURL(svgUrl);

        // ─ Footer branding ─
        ctx.fillStyle = '#0d1220';
        ctx.fillRect(0, CH - 70, CW, 70);

        // Séparateur
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(0, CH - 70, CW, 1);

        // Logo AfriBourse (point vert + texte)
        ctx.beginPath();
        ctx.arc(24, CH - 35, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e';
        ctx.fill();

        ctx.font      = 'bold 14px monospace';
        ctx.fillStyle = '#f1f5f9';
        ctx.textAlign = 'left';
        ctx.fillText('AfriBourse', 36, CH - 29);

        ctx.font      = '11px monospace';
        ctx.fillStyle = '#475569';
        ctx.fillText(
          `BRVM Market Map • ${def.label}${sizeMode === 'cap' ? ' • PAR CAPITALISATION' : ''} • afribourse.com`,
          36, CH - 13,
        );

        // Badge variation à droite
        const badge   = `${marketChange >= 0 ? '+' : ''}${marketChange.toFixed(2)}%`;
        ctx.font      = 'bold 15px monospace';
        ctx.fillStyle = marketChange >= 0 ? '#22c55e' : '#ef4444';
        ctx.textAlign = 'right';
        ctx.fillText(badge, CW - 20, CH - 29);

        ctx.font      = '10px monospace';
        ctx.fillStyle = '#334155';
        ctx.fillText(
          new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
          CW - 20, CH - 13
        );

        canvas.toBlob(resolve, 'image/png', 0.95);
      };
      img.onerror = () => { URL.revokeObjectURL(svgUrl); resolve(null); };
      img.src = svgUrl;
    });
  }

  // ── Télécharger ───────────────────────────────────────────────────────────
  async function handleDownload() {
    setIsCapturing(true);
    const blob = await captureToBlob();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `brvm-market-map-${period.toLowerCase()}${sizeMode === 'cap' ? '-cap' : ''}-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsCapturing(false);
  }

  // ── Web Share API (mobile) ────────────────────────────────────────────────
  async function handleNativeShare() {
    setShowShare(false);
    setIsCapturing(true);
    const blob = await captureToBlob();
    if (!blob) { setIsCapturing(false); return; }

    const file = new File([blob], 'brvm-market-map.png', { type: 'image/png' });
    const shareText = `📊 BRVM Market Map – ${shareLabel}\nSuivez le marché sur AfriBourse`;

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: 'BRVM Market Map – AfriBourse', text: shareText, files: [file] })
        .catch(() => {/* annulé */});
    } else if (navigator.share) {
      await navigator.share({ title: 'BRVM Market Map – AfriBourse', text: shareText, url: window.location.href })
        .catch(() => {});
    }
    setIsCapturing(false);
  }

  // ── Twitter / X ───────────────────────────────────────────────────────────
  function handleTwitter() {
    setShowShare(false);
    const text = `📊 BRVM Market Map – ${shareLabel}\n#BRVM #Finance #AfriBourse\n${window.location.origin}/markets`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,width=600,height=400');
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  function handleWhatsApp() {
    setShowShare(false);
    const text = `📊 *BRVM Market Map* – ${shareLabel}\nSuivez le marché africain sur AfriBourse 👉 ${window.location.origin}/markets`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }

  // ── LinkedIn ──────────────────────────────────────────────────────────────
  function handleLinkedIn() {
    setShowShare(false);
    const url = `${window.location.origin}/markets`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'noopener,width=600,height=500');
  }

  // ── Copier le lien ────────────────────────────────────────────────────────
  async function handleCopyLink() {
    setShowShare(false);
    await navigator.clipboard.writeText(`${window.location.origin}/markets`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Loading state (liste des actions) ─────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        background: '#070b14', borderRadius: 12, padding: 40,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        color: '#475569', fontFamily: "'IBM Plex Mono', monospace", minHeight: 400,
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #1e3a5f', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 13, letterSpacing: 1 }}>CHARGEMENT DE LA CARTE…</span>
      </div>
    );
  }

  // ── Rendu d'une case titre ────────────────────────────────────────────────
  function renderCell(cell: TreemapCell) {
    const { stock, x, y, width: cw, height: ch } = cell;
    if (cw < 1 || ch < 1) return null;

    const bgColor = colorMode === 'sector'
      ? (SECTOR_COLORS[stock.sector || ''] || '#64748b')
      : getChangeColor(stock.change, steps);
    const isHovered  = hoveredCell?.stock.symbol === stock.symbol;
    const showTicker = cw > 50  && ch > 30;
    const showChange = cw > 60  && ch > 50;
    const wantName   = cw > 110 && ch > 80;
    // Petites cases (fréquentes en mode capitalisation) : ticker seul, taille ajustée
    const compact    = !showTicker && cw > 24 && ch > 13;

    // Logo proportionnel
    const logoPath   = getStockLogo(stock.symbol, stock.logo_url);
    const showLogo   = !!logoPath && cw > 55 && ch > 55;
    const logoSize   = showLogo ? Math.min(cw * 0.38, ch * 0.42, 48) : 0;
    const clipId     = `clip-${stock.symbol}`;

    // Calcul du bloc texte + logo centré verticalement
    const tickerFS   = Math.min(cw * 0.15, ch * 0.2, 16);
    const changeFS   = Math.min(cw * 0.1, ch * 0.13, 12);
    const gap        = 3;
    const blockH     = showLogo
      ? logoSize + (showTicker ? gap + tickerFS : 0) + (showChange ? gap + changeFS : 0)
      : (showTicker ? tickerFS : 0) + (showChange ? gap + changeFS : 0);
    const blockTop   = y + (ch - blockH) / 2;

    const logoX      = x + (cw - logoSize) / 2;
    const logoY      = blockTop;
    const tickerY    = showLogo
      ? blockTop + logoSize + gap + tickerFS
      : blockTop + tickerFS;
    const changeY    = tickerY + gap + changeFS;
    const nameY      = showLogo ? logoY - 5 : tickerY - tickerFS - 5;
    const nameFS     = Math.min(cw * 0.07, ch * 0.09, 9);
    // Le nom ne doit pas déborder au-dessus de la case (il passerait sous le bandeau secteur)
    const showName   = wantName && nameY - nameFS >= y + GAP;
    const compactFS  = Math.min((cw - 4) / (stock.symbol.length * 0.62), ch * 0.6, 10);

    return (
      <g key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)} style={{ cursor: 'pointer' }}>
        {/* Fond */}
        <rect
          className="mm-cell"
          x={x + GAP / 2}   y={y + GAP / 2}
          width={Math.max(cw - GAP, 0)}  height={Math.max(ch - GAP, 0)}
          fill={bgColor}    fillOpacity={isHovered ? 0.95 : 0.75}
          rx={3}
          onMouseEnter={() => setHoveredCell(cell)}
          onMouseLeave={() => setHoveredCell(null)}
        />
        {/* Bordure hover */}
        {isHovered && (
          <rect
            x={x + GAP / 2} y={y + GAP / 2}
            width={Math.max(cw - GAP, 0)} height={Math.max(ch - GAP, 0)}
            fill="none" stroke={bgColor === NO_DATA ? '#64748b' : bgColor} strokeWidth={2} strokeOpacity={0.9} rx={3}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Logo proportionnel */}
        {showLogo && logoPath && (
          <>
            <defs>
              <clipPath id={clipId}>
                <rect x={logoX} y={logoY} width={logoSize} height={logoSize} rx={logoSize * 0.15} />
              </clipPath>
            </defs>
            {/* Fond blanc semi-transparent derrière le logo */}
            <rect
              x={logoX} y={logoY} width={logoSize} height={logoSize}
              rx={logoSize * 0.15} fill="rgba(255,255,255,0.9)"
              style={{ pointerEvents: 'none' }}
            />
            <image
              href={logoPath}
              x={logoX} y={logoY}
              width={logoSize} height={logoSize}
              clipPath={`url(#${clipId})`}
              preserveAspectRatio="xMidYMid meet"
              style={{ pointerEvents: 'none' }}
            />
          </>
        )}

        {/* Nom entreprise (grandes cases) */}
        {showName && (
          <text
            x={x + cw / 2} y={nameY}
            textAnchor="middle" fill="rgba(255,255,255,0.5)"
            fontSize={nameFS}
            fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
          >
            {stock.company_name.length > 20 ? stock.company_name.slice(0, 18) + '…' : stock.company_name}
          </text>
        )}

        {/* Symbole */}
        {showTicker && (
          <text
            x={x + cw / 2} y={tickerY}
            textAnchor="middle" fill="white"
            fontSize={tickerFS} fontWeight="700"
            fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
          >
            {stock.symbol}
          </text>
        )}
        {compact && compactFS >= 5 && (
          <text
            x={x + cw / 2} y={y + ch / 2 + compactFS * 0.35}
            textAnchor="middle" fill="white"
            fontSize={compactFS} fontWeight="700"
            fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
          >
            {stock.symbol}
          </text>
        )}

        {/* Variation */}
        {showChange && (
          <text
            x={x + cw / 2} y={changeY}
            textAnchor="middle" fill="rgba(255,255,255,0.85)"
            fontSize={changeFS}
            fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
          >
            {changesReady ? formatChange(stock.change) : '—'}
          </text>
        )}
      </g>
    );
  }

  // ── Rendu d'un bloc secteur (mode capitalisation) ─────────────────────────
  function renderSectorBlock(b: SectorBlock) {
    const color   = SECTOR_COLORS[b.name] || '#94a3b8';
    const chg     = changesReady ? formatChange(b.change) : '';
    const roomFor = (b.width - 12) / 5.6; // ~5,6 px par caractère à 9 px (monospace)
    const showChg = chg !== '' && roomFor >= chg.length + 6;
    const maxName = Math.floor(roomFor - (showChg ? chg.length + 2 : 0));
    const name    = b.name.toUpperCase();
    return (
      <g key={`sector-${b.name}`} style={{ pointerEvents: 'none' }}>
        <rect x={b.x + 0.5} y={b.y + 0.5} width={Math.max(b.width - 1, 0)} height={Math.max(b.height - 1, 0)}
          fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
        {b.header > 0 && maxName >= 3 && (
          <>
            <rect x={b.x + 1} y={b.y + 1} width={Math.max(b.width - 2, 0)} height={b.header - 1} fill="#0d1220" />
            <text x={b.x + 6} y={b.y + 11.5} fontSize={9} fontWeight={700} letterSpacing={0.5} fill={color}
              fontFamily="'IBM Plex Mono',monospace">
              {name.length > maxName ? name.slice(0, Math.max(maxName - 1, 1)) + '…' : name}
            </text>
            {showChg && (
              <text x={b.x + b.width - 6} y={b.y + 11.5} fontSize={9} fontWeight={600} textAnchor="end"
                fill={b.change === null ? '#64748b' : b.change >= 0 ? '#22c55e' : '#ef4444'}
                fontFamily="'IBM Plex Mono',monospace">
                {chg}
              </text>
            )}
          </>
        )}
      </g>
    );
  }

  const [s1, s2, s3] = steps;
  const fmtStep = (v: number) => v.toLocaleString('fr-FR');
  const legendChange = [
    { color: REDS[3],   label: `<-${fmtStep(s3)}%` },
    { color: REDS[2],   label: `-${fmtStep(s2)}→-${fmtStep(s3)}` },
    { color: REDS[1],   label: `-${fmtStep(s1)}→-${fmtStep(s2)}` },
    { color: REDS[0],   label: `0→-${fmtStep(s1)}` },
    { color: NEUTRAL,   label: '0%' },
    { color: GREENS[0], label: `0→+${fmtStep(s1)}` },
    { color: GREENS[1], label: `+${fmtStep(s1)}→+${fmtStep(s2)}` },
    { color: GREENS[2], label: `+${fmtStep(s2)}→+${fmtStep(s3)}` },
    { color: GREENS[3], label: `>+${fmtStep(s3)}%` },
    ...(noChangeCount > 0 ? [{ color: NO_DATA, label: 'N/D' }] : []),
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#070b14', borderRadius: 12, fontFamily: "'IBM Plex Mono','Courier New',monospace", color: '#f1f5f9', padding: '20px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .mm-cell { cursor: pointer; }
        .mm-cell:hover { filter: brightness(1.28); }
        .mm-filter-btn {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; padding: 4px 12px; border-radius: 6px; cursor: pointer;
          font-size: 11px; font-family: inherit; transition: all 0.2s; white-space: nowrap;
        }
        .mm-filter-btn:hover { border-color: rgba(255,255,255,0.25); color: #f1f5f9; }
        .mm-filter-btn.active { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); color: #f1f5f9; }
        .mm-mode-btn {
          background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #64748b;
          padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 10px;
          font-family: inherit; transition: all 0.2s;
        }
        .mm-mode-btn.active { border-color: #0ea5e9; color: #0ea5e9; background: rgba(14,165,233,0.08); }
        .mm-period-btn { padding: 4px 8px; }
        .mm-group-label { color: #334155; font-size: 9px; letter-spacing: 1px; margin-right: 2px; }
        .mm-action-btn {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8; padding: 4px 11px; border-radius: 5px; cursor: pointer;
          font-size: 10px; font-family: inherit; transition: all 0.2s; white-space: nowrap;
        }
        .mm-action-btn:hover { border-color: rgba(255,255,255,0.22); color: #e2e8f0; background: rgba(255,255,255,0.08); }
        .mm-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .mm-share-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 9px 14px; background: transparent; border: none; color: #cbd5e1;
          font-size: 12px; font-family: inherit; cursor: pointer; transition: background 0.15s;
          text-align: left; border-radius: 6px;
        }
        .mm-share-item:hover { background: rgba(255,255,255,0.06); color: #f1f5f9; }
        .mm-share-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
      `}</style>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: "'Bebas Neue','Impact',sans-serif", fontSize: 26, letterSpacing: 3,
              background: 'linear-gradient(135deg,#22c55e,#0ea5e9)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              BRVM MARKET MAP
            </span>
            {changesReady && aggregate.value !== null && (
              <span
                title={aggregate.weighted
                  ? 'Variation pondérée par la capitalisation boursière'
                  : 'Moyenne simple (capitalisations indisponibles)'}
                style={{
                  background: marketChange >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: marketChange >= 0 ? '#22c55e' : '#ef4444',
                  border: `1px solid ${marketChange >= 0 ? '#22c55e44' : '#ef444444'}`,
                  borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 600,
                }}
              >
                {formatChange(marketChange)}
              </span>
            )}
          </div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
            BRVM • {sizePending ? '…' : shownStocks.length} TITRES • {subtitleDate}
            {!sizePending && missingCount > 0 && (
              <span style={{ color: '#334155' }}>
                {' '}• {missingCount} {sizeMode === 'cap' ? 'SANS CAPITALISATION' : 'SANS HISTORIQUE'}
              </span>
            )}
            {sizeMode === 'cap' && changesPending && (
              <span style={{ color: '#0ea5e9' }}>{' '}• CALCUL DES VARIATIONS…</span>
            )}
          </div>
        </div>

        {/* Contrôles droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Sélecteur de période */}
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                className={`mm-mode-btn mm-period-btn${period === p.key ? ' active' : ''}`}
                onClick={() => setPeriod(p.key)}
                title={p.label.charAt(0) + p.label.slice(1).toLowerCase()}
              >
                {p.short}
              </button>
            ))}
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

          {/* Taille des cases */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span className="mm-group-label">TAILLE</span>
            <button className={`mm-mode-btn${sizeMode === 'change' ? ' active' : ''}`} onClick={() => setSizeMode('change')}>
              |VARIATION|
            </button>
            <button className={`mm-mode-btn${sizeMode === 'cap' ? ' active' : ''}`} onClick={() => setSizeMode('cap')}>
              CAPITALISATION
            </button>
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

          {/* Mode couleur */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <span className="mm-group-label">COULEUR</span>
            <button className={`mm-mode-btn${colorMode === 'change' ? ' active' : ''}`} onClick={() => setColorMode('change')}>
              % VARIATION
            </button>
            <button className={`mm-mode-btn${colorMode === 'sector' ? ' active' : ''}`} onClick={() => setColorMode('sector')}>
              SECTEUR
            </button>
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

          {/* Télécharger */}
          <button
            className="mm-action-btn"
            onClick={handleDownload}
            disabled={isCapturing || !changesReady || !cells.length}
            title="Télécharger en PNG"
          >
            <Download style={{ width: 12, height: 12 }} />
            {isCapturing ? '…' : 'PNG'}
          </button>

          {/* Partager */}
          <div style={{ position: 'relative' }} ref={shareMenuRef}>
            <button
              className="mm-action-btn"
              onClick={() => setShowShare(v => !v)}
              disabled={!changesReady}
              title="Partager"
              style={copied ? { borderColor: '#22c55e44', color: '#22c55e' } : {}}
            >
              {copied ? <Check style={{ width: 12, height: 12 }} /> : <Share2 style={{ width: 12, height: 12 }} />}
              {copied ? 'Copié !' : 'Partager'}
            </button>

            {/* Dropdown partage */}
            {showShare && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: 6, minWidth: 210, zIndex: 1000,
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              }}>
                {/* Flèche */}
                <div style={{
                  position: 'absolute', top: -5, right: 14, width: 10, height: 10,
                  background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)',
                  borderRight: 'none', borderBottom: 'none',
                  transform: 'rotate(45deg)',
                }} />

                {/* Web Share API (mobile/navigateur compatible) */}
                {(typeof navigator.share === 'function' || typeof navigator.canShare === 'function') && (
                  <button className="mm-share-item" onClick={handleNativeShare}>
                    <span className="mm-share-icon" style={{ background: 'rgba(14,165,233,0.15)' }}>📤</span>
                    <span>Partager via…</span>
                  </button>
                )}

                {/* Twitter / X */}
                <button className="mm-share-item" onClick={handleTwitter}>
                  <span className="mm-share-icon" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                    </svg>
                  </span>
                  <span>Partager sur X</span>
                </button>

                {/* WhatsApp */}
                <button className="mm-share-item" onClick={handleWhatsApp}>
                  <span className="mm-share-icon" style={{ background: 'rgba(37,211,102,0.15)' }}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="#25d366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </span>
                  <span>Partager sur WhatsApp</span>
                </button>

                {/* LinkedIn */}
                <button className="mm-share-item" onClick={handleLinkedIn}>
                  <span className="mm-share-icon" style={{ background: 'rgba(10,102,194,0.2)' }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#0a66c2">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </span>
                  <span>Partager sur LinkedIn</span>
                </button>

                {/* Séparateur */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />

                {/* Copier le lien */}
                <button className="mm-share-item" onClick={handleCopyLink}>
                  <span className="mm-share-icon" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Copy style={{ width: 13, height: 13, color: '#94a3b8' }} />
                  </span>
                  <span>Copier le lien</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filtres secteurs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {availableSectors.map((s) => (
          <button
            key={s}
            className={`mm-filter-btn${selectedSector === s ? ' active' : ''}`}
            onClick={() => setSelectedSector(s)}
            style={s !== 'Tous' && selectedSector === s
              ? { borderColor: (SECTOR_COLORS[s] || '#64748b') + '88', color: SECTOR_COLORS[s] || '#64748b' }
              : {}}
          >
            {s !== 'Tous' && (
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: SECTOR_COLORS[s] || '#64748b', marginRight: 5 }} />
            )}
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── Variations indisponibles en mode capitalisation : la carte reste affichée ── */}
      {sizeMode === 'cap' && changesFailed && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
          marginBottom: 8, padding: '8px 12px', borderRadius: 8, fontSize: 11,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b',
        }}>
          <span>
            Variations {def.phrase} indisponibles{errorDetail ? ` (${errorDetail})` : ''} — taille = capitalisation, couleurs grisées.
          </span>
          <button className="mm-action-btn" onClick={() => mapQuery.refetch()}>Réessayer</button>
        </div>
      )}

      {/* ── Treemap SVG ── */}
      <div
        style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}
        onMouseMove={handleMouseMove}
      >
        {sizePending ? (
          <div style={{
            aspectRatio: `${W} / ${H}`, background: '#0a0e17',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14,
            color: '#475569', fontSize: 12, letterSpacing: 1, padding: 16, textAlign: 'center',
          }}>
            {changesFailed ? (
              <>
                <span>IMPOSSIBLE DE CALCULER LES VARIATIONS {def.phrase.toUpperCase()}.</span>
                {errorDetail && <span style={{ fontSize: 10, color: '#334155' }}>{errorDetail}</span>}
                <button className="mm-action-btn" onClick={() => mapQuery.refetch()}>Réessayer</button>
              </>
            ) : (
              <>
                <div style={{ width: 32, height: 32, border: '3px solid #1e3a5f', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>CALCUL DES VARIATIONS…</span>
              </>
            )}
          </div>
        ) : !cells.length ? (
          <div style={{
            aspectRatio: `${W} / ${H}`, background: '#0a0e17',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#475569', fontSize: 13, padding: 16, textAlign: 'center',
          }}>
            {sizeMode === 'cap'
              ? 'Aucune capitalisation disponible pour cette sélection.'
              : 'Aucune donnée disponible pour cette période et ce secteur.'}
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            style={{ display: 'block', background: '#0a0e17' }}
          >
            {cells.map(renderCell)}
            {sectorBlocks.map(renderSectorBlock)}
          </svg>
        )}
      </div>

      {/* ── Légende ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>
        {colorMode === 'change' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#475569', letterSpacing: 1, flexWrap: 'wrap' }}>
            {legendChange.map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: color, opacity: 0.85 }} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 9, color: '#475569' }}>
            {Object.entries(SECTOR_COLORS).map(([s, c]) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c }} />
                <span>{s.toUpperCase()}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 9, color: '#334155' }}>
          {sizeMode === 'cap' ? 'SURFACE ∝ CAPITALISATION BOURSIÈRE' : 'SURFACE ∝ |VARIATION %|'}
        </div>
      </div>

      {/* ── Tooltip ── */}
      {hoveredCell && (
        <Tooltip
          cell={hoveredCell}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          period={period}
          totalCap={sizeMode === 'cap' ? totalCap : 0}
          changesReady={changesReady}
        />
      )}
    </div>
  );
}
