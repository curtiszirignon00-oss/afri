// src/components/markets/BRVMMarketMap.tsx
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Share2, Check, Copy } from 'lucide-react';
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
  'Services Financiers':          '#0ea5e9',
  'Télécommunications':           '#8b5cf6',
  'Consommation de Base':         '#10b981',
  'Consommation Discrétionnaire': '#f59e0b',
  'Energie':                      '#ef4444',
  'Industriels':                  '#ec4899',
  'Services Publics':             '#06b6d4',
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

    let bestSplit = 1;
    let bestWorst = Infinity;

    for (let i = 1; i <= items.length; i++) {
      const row = items.slice(0, i);
      const rt = row.reduce((s, st) => s + weight(st), 0);
      const side    = horiz ? ch : cw;
      const rowSide = horiz ? cw * (rt / rowTotal) : ch * (rt / rowTotal);
      let worst = 0;
      for (const st of row) {
        const frac     = weight(st) / rt;
        const cellSide = side * frac;
        const r        = Math.max(rowSide / cellSide, cellSide / rowSide);
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
        <TooltipStat label="Prix"        value={formatPrice(stock.current_price)}        color="#f1f5f9" />
        <TooltipStat
          label="Variation"
          value={formatChange(stock.daily_change_percent)}
          color={stock.daily_change_percent >= 0 ? '#22c55e' : '#ef4444'}
        />
        {stock.market_cap ? (
          <TooltipStat label="Cap. Boursière" value={formatMarketCap(stock.market_cap)} color="#94a3b8" />
        ) : null}
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
  const [hoveredCell,    setHoveredCell]    = useState<TreemapCell | null>(null);
  const [mousePos,       setMousePos]       = useState({ x: 0, y: 0 });
  const [colorMode,      setColorMode]      = useState<'change' | 'sector'>('change');

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

  // ── Données filtrées ──────────────────────────────────────────────────────
  const availableSectors = useMemo(() => {
    const set = new Set(stocks.map(s => s.sector).filter(Boolean) as string[]);
    return ['Tous', ...Array.from(set).sort()];
  }, [stocks]);

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

  const marketChange = useMemo(() => {
    const total = filteredStocks.reduce((s, st) => s + (st.market_cap || 0), 0);
    if (!total) return 0;
    return filteredStocks.reduce(
      (sum, st) => sum + st.daily_change_percent * ((st.market_cap || 0) / total), 0
    );
  }, [filteredStocks]);

  // ── Capture SVG → PNG canvas ──────────────────────────────────────────────
  async function captureToBlob(): Promise<Blob | null> {
    const svgEl = svgRef.current;
    if (!svgEl) return null;

    return new Promise((resolve) => {
      const CW = 960;   // largeur canvas export
      const CH = 590;   // hauteur = 520 treemap + 70 footer branding

      // Cloner et fixer les dimensions
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('width',   String(CW));
      clone.setAttribute('height',  String(CH - 70));
      clone.setAttribute('viewBox', `0 0 ${W} ${H}`);

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
        ctx.fillText('BRVM Market Map • afribourse.com', 36, CH - 13);

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
      a.download = `brvm-market-map-${new Date().toISOString().slice(0, 10)}.png`;
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
    const shareText = `📊 BRVM Market Map – ${formatChange(marketChange)} aujourd'hui\nSuivez le marché sur AfriBourse`;

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
    const text = `📊 BRVM Market Map – ${formatChange(marketChange)} aujourd'hui\n#BRVM #Finance #AfriBourse\n${window.location.origin}/markets`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,width=600,height=400');
  }

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  function handleWhatsApp() {
    setShowShare(false);
    const text = `📊 *BRVM Market Map* – ${formatChange(marketChange)} aujourd'hui\nSuivez le marché africain sur AfriBourse 👉 ${window.location.origin}/markets`;
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

  // ── Loading / Empty states ────────────────────────────────────────────────
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

  if (!filteredStocks.length) {
    return (
      <div style={{
        background: '#070b14', borderRadius: 12, padding: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#475569', fontFamily: "'IBM Plex Mono', monospace", minHeight: 300, fontSize: 13,
      }}>
        Aucune donnée disponible pour ce secteur.
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#070b14', borderRadius: 12, fontFamily: "'IBM Plex Mono','Courier New',monospace", color: '#f1f5f9', padding: '20px 16px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Bebas+Neue&display=swap');
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
            <span style={{
              background: marketChange >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              color: marketChange >= 0 ? '#22c55e' : '#ef4444',
              border: `1px solid ${marketChange >= 0 ? '#22c55e44' : '#ef444444'}`,
              borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 600,
            }}>
              {formatChange(marketChange)}
            </span>
          </div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 4, letterSpacing: 1 }}>
            BRVM • {filteredStocks.length} TITRES •{' '}
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
          </div>
        </div>

        {/* Contrôles droite */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Mode couleur */}
          <div style={{ display: 'flex', gap: 5 }}>
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
            disabled={isCapturing}
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
                {(navigator.share || navigator.canShare) && (
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

      {/* ── Treemap SVG ── */}
      <div
        style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}
        onMouseMove={handleMouseMove}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          style={{ display: 'block', background: '#0a0e17' }}
        >
          {cells.map((cell) => {
            const { stock, x, y, width: cw, height: ch } = cell;
            if (cw < 1 || ch < 1) return null;
            const bgColor   = colorMode === 'sector'
              ? (SECTOR_COLORS[stock.sector || ''] || '#64748b')
              : getChangeColor(stock.daily_change_percent);
            const isHovered  = hoveredCell?.stock.symbol === stock.symbol;
            const showTicker = cw > 50  && ch > 30;
            const showChange = cw > 60  && ch > 50;
            const showName   = cw > 110 && ch > 80;

            return (
              <g key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)} style={{ cursor: 'pointer' }}>
                <rect
                  className="mm-cell"
                  x={x + GAP / 2}   y={y + GAP / 2}
                  width={cw - GAP}  height={ch - GAP}
                  fill={bgColor}    fillOpacity={isHovered ? 0.95 : 0.75}
                  rx={3}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                />
                {isHovered && (
                  <rect
                    x={x + GAP / 2} y={y + GAP / 2}
                    width={cw - GAP} height={ch - GAP}
                    fill="none" stroke={bgColor} strokeWidth={2} strokeOpacity={0.9} rx={3}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
                {showTicker && (
                  <text
                    x={x + cw / 2} y={y + ch / 2 + (showChange ? 4 : 6)}
                    textAnchor="middle" fill="white"
                    fontSize={Math.min(cw * 0.16, ch * 0.22, 18)} fontWeight="700"
                    fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
                  >
                    {stock.symbol}
                  </text>
                )}
                {showChange && (
                  <text
                    x={x + cw / 2} y={y + ch / 2 + Math.min(cw * 0.16, ch * 0.22, 18) + 8}
                    textAnchor="middle" fill="rgba(255,255,255,0.85)"
                    fontSize={Math.min(cw * 0.11, ch * 0.15, 13)}
                    fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
                  >
                    {formatChange(stock.daily_change_percent)}
                  </text>
                )}
                {showName && (
                  <text
                    x={x + cw / 2} y={y + ch / 2 - Math.min(cw * 0.16, ch * 0.22, 18) - 6}
                    textAnchor="middle" fill="rgba(255,255,255,0.55)"
                    fontSize={Math.min(cw * 0.08, ch * 0.1, 9)}
                    fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
                  >
                    {stock.company_name.length > 20 ? stock.company_name.slice(0, 18) + '…' : stock.company_name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Légende ── */}
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

      {/* ── Tooltip ── */}
      {hoveredCell && (
        <Tooltip cell={hoveredCell} mouseX={mousePos.x} mouseY={mousePos.y} />
      )}
    </div>
  );
}
