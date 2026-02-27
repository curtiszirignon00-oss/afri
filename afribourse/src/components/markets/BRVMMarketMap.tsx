// src/components/markets/BRVMMarketMap.tsx
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Stock } from '../../hooks/useApi';

// ─── Types internes ───────────────────────────────────────────────────────────
interface TreemapCell {
  stock: Stock;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TooltipProps {
  cell: TreemapCell;
  mouseX: number;
  mouseY: number;
}

// ─── Secteurs & couleurs BRVM réels ──────────────────────────────────────────
const SECTOR_COLORS: Record<string, string> = {
  'Services Financiers':         '#0ea5e9',
  'Télécommunications':          '#8b5cf6',
  'Consommation de Base':        '#10b981',
  'Consommation Discrétionnaire':'#f59e0b',
  'Energie':                     '#ef4444',
  'Industriels':                 '#ec4899',
  'Services Publics':            '#06b6d4',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getChangeColor(change: number): string {
  if (change >= 3)    return '#16a34a';
  if (change >= 1.5)  return '#22c55e';
  if (change >= 0.5)  return '#4ade80';
  if (change >= 0)    return '#86efac';
  if (change >= -0.5) return '#fca5a5';
  if (change >= -1.5) return '#f87171';
  if (change >= -3)   return '#ef4444';
  return '#b91c1c';
}

function formatChange(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function formatMarketCap(v: number): string {
  // v est en FCFA brut depuis la DB
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(1)}T`;
  if (v >= 1_000_000_000)     return `${(v / 1_000_000_000).toFixed(1)}Mds`;
  if (v >= 1_000_000)         return `${(v / 1_000_000).toFixed(0)}M`;
  return `${v.toLocaleString('fr-FR')}`;
}

function formatPrice(v: number): string {
  return new Intl.NumberFormat('fr-FR').format(v) + ' F';
}

// ─── Poids = |variation %|, minimum 0.3 pour rester visible ─────────────────
function weight(st: Stock): number {
  return Math.max(Math.abs(st.daily_change_percent), 0.3);
}

// ─── Squarified Treemap – surface ∝ |variation %| ────────────────────────────
function squarify(stocks: Stock[], x: number, y: number, W: number, H: number): TreemapCell[] {
  if (!stocks.length) return [];

  // Trier par |variation| décroissante → les plus gros mouvements en premier
  const sorted = [...stocks].sort((a, b) => weight(b) - weight(a));
  const cells: TreemapCell[] = [];

  function layout(items: Stock[], cx: number, cy: number, cw: number, ch: number) {
    if (!items.length) return;
    if (items.length === 1) {
      cells.push({ stock: items[0], x: cx, y: cy, width: cw, height: ch });
      return;
    }

    const rowTotal = items.reduce((s, st) => s + weight(st), 0);
    const horiz = cw >= ch;

    // Chercher le meilleur split (minimise le rapport d'aspect)
    let bestSplit = 1;
    let bestWorst = Infinity;

    for (let i = 1; i <= items.length; i++) {
      const row = items.slice(0, i);
      const rt = row.reduce((s, st) => s + weight(st), 0);
      const side    = horiz ? ch : cw;
      const rowSide = horiz ? cw * (rt / rowTotal) : ch * (rt / rowTotal);
      let worst = 0;
      for (const st of row) {
        const frac = weight(st) / rt;
        const cellSide = side * frac;
        const r = Math.max(rowSide / cellSide, cellSide / rowSide);
        worst = Math.max(worst, r);
      }
      if (worst < bestWorst) { bestWorst = worst; bestSplit = i; }
      else break;
    }

    const row  = items.slice(0, bestSplit);
    const rest = items.slice(bestSplit);
    const rt   = row.reduce((s, st) => s + weight(st), 0);
    const frac = rt / rowTotal;

    let off = 0;
    for (const st of row) {
      const sf = weight(st) / rt;
      if (horiz) {
        cells.push({ stock: st, x: cx, y: cy + off, width: cw * frac, height: ch * sf });
        off += ch * sf;
      } else {
        cells.push({ stock: st, x: cx + off, y: cy, width: cw * sf, height: ch * frac });
        off += cw * sf;
      }
    }

    if (rest.length) {
      if (horiz) layout(rest, cx + cw * frac, cy, cw * (1 - frac), ch);
      else       layout(rest, cx, cy + ch * frac, cw, ch * (1 - frac));
    }
  }

  layout(sorted, x, y, W, H);
  return cells;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({ cell, mouseX, mouseY }: TooltipProps) {
  const { stock } = cell;
  const sectorColor = SECTOR_COLORS[stock.sector || ''] || '#64748b';
  return (
    <div
      style={{
        position: 'fixed',
        left: mouseX + 16,
        top: mouseY - 20,
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'rgba(10,14,23,0.97)',
        border: `1px solid ${sectorColor}55`,
        borderRadius: 12,
        padding: '14px 18px',
        minWidth: 230,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 0 30px ${sectorColor}33, 0 8px 32px rgba(0,0,0,0.6)`,
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {stock.logo_url ? (
          <img
            src={stock.logo_url}
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
        )}
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>{stock.symbol}</div>
          <div style={{ color: '#64748b', fontSize: 10 }}>{stock.company_name}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        <TooltipStat label="Prix" value={formatPrice(stock.current_price)} color="#f1f5f9" />
        <TooltipStat
          label="Variation"
          value={formatChange(stock.daily_change_percent)}
          color={stock.daily_change_percent >= 0 ? '#22c55e' : '#ef4444'}
        />
        {stock.market_cap && (
          <TooltipStat label="Cap. Boursière" value={formatMarketCap(stock.market_cap)} color="#94a3b8" />
        )}
        <TooltipStat label="Volume" value={(stock.volume || 0).toLocaleString('fr-FR')} color="#94a3b8" />
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
  const [hoveredCell, setHoveredCell] = useState<TreemapCell | null>(null);
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 });
  const [colorMode, setColorMode] = useState<'change' | 'sector'>('change');

  // Secteurs disponibles extraits des vraies données
  const availableSectors = useMemo(() => {
    const set = new Set(stocks.map(s => s.sector).filter(Boolean) as string[]);
    return ['Tous', ...Array.from(set).sort()];
  }, [stocks]);

  // Filtrer & trier par |variation %| décroissant
  const filteredStocks = useMemo(() => {
    const base = selectedSector === 'Tous'
      ? [...stocks]
      : stocks.filter(s => s.sector === selectedSector);
    return base
      .filter(s => s.daily_change_percent !== undefined && s.daily_change_percent !== null)
      .sort((a, b) => Math.abs(b.daily_change_percent) - Math.abs(a.daily_change_percent));
  }, [stocks, selectedSector]);

  const W = 900;
  const H = 520;
  const GAP = 2;

  const cells = useMemo(() => squarify(filteredStocks, 0, 0, W, H), [filteredStocks]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Variation pondérée globale du marché
  const marketChange = useMemo(() => {
    const total = filteredStocks.reduce((s, st) => s + (st.market_cap || 0), 0);
    if (!total) return 0;
    return filteredStocks.reduce((sum, st) => sum + st.daily_change_percent * ((st.market_cap || 0) / total), 0);
  }, [filteredStocks]);

  if (loading) {
    return (
      <div style={{
        background: '#070b14', borderRadius: 12, padding: 40,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: '#475569',
        fontFamily: "'IBM Plex Mono', monospace", minHeight: 400
      }}>
        <div style={{ width: 40, height: 40, border: '3px solid #1e3a5f', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: 13, letterSpacing: 1 }}>CHARGEMENT DE LA CARTE…</span>
      </div>
    );
  }

  if (!filteredStocks.length) {
    return (
      <div style={{
        background: '#070b14', borderRadius: 12, padding: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569',
        fontFamily: "'IBM Plex Mono', monospace", minHeight: 300, fontSize: 13
      }}>
        Aucune donnée disponible pour ce secteur.
      </div>
    );
  }

  return (
    <div style={{ background: '#070b14', borderRadius: 12, fontFamily: "'IBM Plex Mono', 'Courier New', monospace", color: '#f1f5f9', padding: '20px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        .mm-cell { cursor: pointer; transition: filter 0.15s, opacity 0.15s; }
        .mm-cell:hover { filter: brightness(1.28); }
        .mm-filter-btn {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          padding: 4px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-family: inherit;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .mm-filter-btn:hover { border-color: rgba(255,255,255,0.25); color: #f1f5f9; }
        .mm-filter-btn.active { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); color: #f1f5f9; }
        .mm-mode-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: #64748b;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 10px;
          font-family: inherit;
          transition: all 0.2s;
        }
        .mm-mode-btn.active { border-color: #0ea5e9; color: #0ea5e9; background: rgba(14,165,233,0.08); }
      `}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: "'Bebas Neue', 'Impact', sans-serif",
              fontSize: 26,
              letterSpacing: 3,
              background: 'linear-gradient(135deg, #22c55e, #0ea5e9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              BRVM MARKET MAP
            </span>
            <span style={{
              background: marketChange >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: marketChange >= 0 ? '#22c55e' : '#ef4444',
              border: `1px solid ${marketChange >= 0 ? '#22c55e44' : '#ef444444'}`,
              borderRadius: 6,
              padding: '3px 10px',
              fontSize: 13,
              fontWeight: 600,
            }}>
              {formatChange(marketChange)}
            </span>
          </div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
            BRVM • {filteredStocks.length} TITRES •{' '}
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`mm-mode-btn${colorMode === 'change' ? ' active' : ''}`} onClick={() => setColorMode('change')}>
            % VARIATION
          </button>
          <button className={`mm-mode-btn${colorMode === 'sector' ? ' active' : ''}`} onClick={() => setColorMode('sector')}>
            SECTEUR
          </button>
        </div>
      </div>

      {/* Filtres secteurs */}
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

      {/* Treemap SVG */}
      <div
        style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}
        onMouseMove={handleMouseMove}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', background: '#0a0e17' }}
        >
          {cells.map((cell) => {
            const { stock, x, y, width: cw, height: ch } = cell;
            if (cw < 1 || ch < 1) return null;
            const bgColor = colorMode === 'sector'
              ? (SECTOR_COLORS[stock.sector || ''] || '#64748b')
              : getChangeColor(stock.daily_change_percent);
            const isHovered = hoveredCell?.stock.symbol === stock.symbol;
            const showTicker  = cw > 50  && ch > 30;
            const showChange  = cw > 60  && ch > 50;
            const showName    = cw > 110 && ch > 80;

            return (
              <g
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  className="mm-cell"
                  x={x + GAP / 2}
                  y={y + GAP / 2}
                  width={cw - GAP}
                  height={ch - GAP}
                  fill={bgColor}
                  fillOpacity={isHovered ? 0.95 : 0.75}
                  rx={3}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
                {isHovered && (
                  <rect
                    x={x + GAP / 2} y={y + GAP / 2}
                    width={cw - GAP} height={ch - GAP}
                    fill="none" stroke={bgColor}
                    strokeWidth={2} strokeOpacity={0.9} rx={3}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {showTicker && (
                  <text
                    x={x + cw / 2}
                    y={y + ch / 2 + (showChange ? 4 : 6)}
                    textAnchor="middle"
                    fill="white"
                    fontSize={Math.min(cw * 0.16, ch * 0.22, 18)}
                    fontWeight="700"
                    fontFamily="'IBM Plex Mono', monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {stock.symbol}
                  </text>
                )}
                {showChange && (
                  <text
                    x={x + cw / 2}
                    y={y + ch / 2 + Math.min(cw * 0.16, ch * 0.22, 18) + 8}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.85)"
                    fontSize={Math.min(cw * 0.11, ch * 0.15, 13)}
                    fontFamily="'IBM Plex Mono', monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {formatChange(stock.daily_change_percent)}
                  </text>
                )}
                {showName && (
                  <text
                    x={x + cw / 2}
                    y={y + ch / 2 - Math.min(cw * 0.16, ch * 0.22, 18) - 6}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.55)"
                    fontSize={Math.min(cw * 0.08, ch * 0.1, 9)}
                    fontFamily="'IBM Plex Mono', monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {stock.company_name.length > 20 ? stock.company_name.slice(0, 18) + '…' : stock.company_name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 10 }}>
        {colorMode === 'change' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#475569', letterSpacing: 1, flexWrap: 'wrap' }}>
            {[
              { color: '#16a34a', label: '>+3%' },
              { color: '#22c55e', label: '+1.5→+3%' },
              { color: '#86efac', label: '0→+1.5%' },
              { color: '#fca5a5', label: '0→-1.5%' },
              { color: '#ef4444', label: '-1.5→-3%' },
              { color: '#b91c1c', label: '<-3%' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: color }} />
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
          SURFACE ∝ |VARIATION %|
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <Tooltip cell={hoveredCell} mouseX={mousePos.x} mouseY={mousePos.y} />
      )}
    </div>
  );
}
