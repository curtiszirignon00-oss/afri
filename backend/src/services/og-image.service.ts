// backend/src/services/og-image.service.ts
// Génère des images PNG Open Graph (1200×630) via SVG → sharp

import sharp from 'sharp';

const W = 1200;
const H = 630;

const BRAND_GREEN = '#10B981';
const BRAND_DARK = '#0F172A';
const BRAND_CARD = '#1E293B';
const BRAND_BORDER = '#334155';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(price);
}

function rarityColor(rarity: string): string {
  switch (rarity) {
    case 'legendary': return '#F59E0B';
    case 'epic':      return '#8B5CF6';
    case 'rare':      return '#3B82F6';
    default:          return '#6B7280';
  }
}

function rarityLabel(rarity: string): string {
  switch (rarity) {
    case 'legendary': return 'Légendaire';
    case 'epic':      return 'Épique';
    case 'rare':      return 'Rare';
    default:          return 'Commun';
  }
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Stock card ──────────────────────────────────────────────────────────────

export interface StockOGData {
  symbol: string;
  companyName: string;
  currentPrice: number;
  dailyChangePercent: number;
  sector?: string | null;
}

export function buildStockSVG(data: StockOGData): string {
  const isPositive = data.dailyChangePercent >= 0;
  const changeColor = isPositive ? '#10B981' : '#EF4444';
  const changeSign  = isPositive ? '+' : '';
  const arrow       = isPositive ? '▲' : '▼';

  const priceStr  = formatPrice(data.currentPrice);
  const changeStr = `${changeSign}${data.dailyChangePercent.toFixed(2)}%`;
  const sectorStr = xmlEscape(data.sector ?? 'BRVM');
  const nameStr   = xmlEscape(data.companyName);
  const symbolStr = xmlEscape(data.symbol);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${BRAND_DARK}"/>
      <stop offset="100%" stop-color="#1E2A40"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${BRAND_GREEN}"/>
      <stop offset="100%" stop-color="#34D399"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="${H}" fill="url(#accent)"/>

  <!-- Top brand bar -->
  <rect x="0" y="0" width="${W}" height="72" fill="${BRAND_CARD}" opacity="0.6"/>

  <!-- Brand name -->
  <text x="44" y="46" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="${BRAND_GREEN}">Afri</text>
  <text x="98" y="46" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="white">Bourse</text>

  <!-- Exchange badge -->
  <rect x="${W - 140}" y="18" width="100" height="36" rx="8" fill="${BRAND_GREEN}" opacity="0.2"/>
  <text x="${W - 90}" y="42" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="${BRAND_GREEN}" text-anchor="middle">BRVM</text>

  <!-- Sector label -->
  <text x="44" y="148" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#94A3B8">${sectorStr}</text>

  <!-- Ticker symbol - large -->
  <text x="44" y="240" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="800" fill="white" letter-spacing="-2">${symbolStr}</text>

  <!-- Company name -->
  <text x="44" y="300" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#CBD5E1">${nameStr}</text>

  <!-- Separator line -->
  <rect x="44" y="340" width="${W - 88}" height="1" fill="${BRAND_BORDER}"/>

  <!-- Price block -->
  <text x="44" y="430" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700" fill="white">${priceStr}</text>
  <text x="${44 + priceStr.length * 40 + 20}" y="430" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#64748B">FCFA</text>

  <!-- Change badge -->
  <rect x="44" y="460" width="220" height="54" rx="10" fill="${changeColor}" opacity="0.15"/>
  <text x="154" y="496" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${changeColor}" text-anchor="middle">${arrow} ${changeStr}</text>

  <!-- Footer -->
  <rect x="0" y="${H - 60}" width="${W}" height="60" fill="${BRAND_CARD}" opacity="0.8"/>
  <text x="44" y="${H - 22}" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#64748B">africbourse.com — Investissez sur la BRVM</text>
  <text x="${W - 44}" y="${H - 22}" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="#334155" text-anchor="end">Données BRVM en temps réel</text>
</svg>`;
}

// ─── Badge / Achievement card ─────────────────────────────────────────────────

export interface BadgeOGData {
  name: string;
  description: string;
  icon: string;
  rarity: string;
  xpReward: number;
  category: string;
}

export function buildBadgeSVG(data: BadgeOGData): string {
  const color = rarityColor(data.rarity);
  const label = rarityLabel(data.rarity);
  const name  = xmlEscape(data.name);
  const desc  = xmlEscape(data.description);
  // Truncate description for display
  const descShort = desc.length > 70 ? desc.slice(0, 67) + '...' : desc;
  const icon  = xmlEscape(data.icon);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${BRAND_DARK}"/>
      <stop offset="100%" stop-color="#1A1F35"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="${color}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Glow behind icon -->
  <ellipse cx="${W / 2}" cy="260" rx="200" ry="180" fill="url(#glow)"/>

  <!-- Top brand bar -->
  <rect x="0" y="0" width="${W}" height="72" fill="${BRAND_CARD}" opacity="0.6"/>
  <text x="44" y="46" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="${BRAND_GREEN}">Afri</text>
  <text x="98" y="46" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="white">Bourse</text>
  <text x="${W - 44}" y="46" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#64748B" text-anchor="end">Achievements</text>

  <!-- Rarity badge -->
  <rect x="${W / 2 - 80}" y="95" width="160" height="38" rx="19" fill="${color}" opacity="0.2"/>
  <rect x="${W / 2 - 80}" y="95" width="160" height="38" rx="19" fill="none" stroke="${color}" stroke-width="1.5"/>
  <text x="${W / 2}" y="121" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="${color}" text-anchor="middle">${label}</text>

  <!-- Icon (emoji) — large -->
  <text x="${W / 2}" y="295" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif" font-size="120" text-anchor="middle">${icon}</text>

  <!-- Badge name -->
  <text x="${W / 2}" y="380" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="800" fill="white" text-anchor="middle">${name}</text>

  <!-- Description -->
  <text x="${W / 2}" y="440" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#94A3B8" text-anchor="middle">${descShort}</text>

  <!-- XP reward -->
  <rect x="${W / 2 - 90}" y="470" width="180" height="46" rx="10" fill="${BRAND_GREEN}" opacity="0.15"/>
  <text x="${W / 2}" y="502" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" fill="${BRAND_GREEN}" text-anchor="middle">⚡ +${data.xpReward} XP</text>

  <!-- Footer -->
  <rect x="0" y="${H - 60}" width="${W}" height="60" fill="${BRAND_CARD}" opacity="0.8"/>
  <text x="44" y="${H - 22}" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#64748B">africbourse.com — Badge débloqué</text>
</svg>`;
}

// ─── Portfolio card ───────────────────────────────────────────────────────────

export interface PortfolioOGData {
  displayName: string;
  totalValue: number;
  gainLossPercent: number;
  period?: string;
}

export function buildPortfolioSVG(data: PortfolioOGData): string {
  const isPositive = data.gainLossPercent >= 0;
  const changeColor = isPositive ? '#10B981' : '#EF4444';
  const changeSign  = isPositive ? '+' : '';
  const arrow       = isPositive ? '▲' : '▼';
  const valueStr    = formatPrice(data.totalValue);
  const changeStr   = `${changeSign}${data.gainLossPercent.toFixed(2)}%`;
  const name        = xmlEscape(data.displayName);
  const period      = xmlEscape(data.period ?? 'Portefeuille');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="${BRAND_DARK}"/>
      <stop offset="100%" stop-color="#1E2A40"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="${BRAND_GREEN}"/>
      <stop offset="100%" stop-color="#34D399"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="6" height="${H}" fill="url(#accent)"/>

  <!-- Top brand bar -->
  <rect x="0" y="0" width="${W}" height="72" fill="${BRAND_CARD}" opacity="0.6"/>
  <text x="44" y="46" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="${BRAND_GREEN}">Afri</text>
  <text x="98" y="46" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="white">Bourse</text>
  <text x="${W - 44}" y="46" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#64748B" text-anchor="end">📊 Portefeuille</text>

  <!-- User name & period -->
  <text x="44" y="148" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#94A3B8">${name}</text>
  <text x="44" y="195" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#64748B">${period}</text>

  <!-- Separator -->
  <rect x="44" y="225" width="${W - 88}" height="1" fill="${BRAND_BORDER}"/>

  <!-- Valeur totale label -->
  <text x="44" y="290" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#64748B">Valeur du portefeuille</text>

  <!-- Value -->
  <text x="44" y="390" font-family="Arial, Helvetica, sans-serif" font-size="86" font-weight="800" fill="white">${valueStr}</text>
  <text x="44" y="440" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#64748B">FCFA</text>

  <!-- Change badge -->
  <rect x="44" y="470" width="240" height="54" rx="10" fill="${changeColor}" opacity="0.15"/>
  <text x="164" y="507" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${changeColor}" text-anchor="middle">${arrow} ${changeStr}</text>

  <!-- Footer -->
  <rect x="0" y="${H - 60}" width="${W}" height="60" fill="${BRAND_CARD}" opacity="0.8"/>
  <text x="44" y="${H - 22}" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#64748B">africbourse.com — Simulateur d'investissement BRVM</text>
</svg>`;
}

// ─── SVG → PNG via sharp ──────────────────────────────────────────────────────

export async function svgToPng(svgString: string): Promise<Buffer> {
  const input = Buffer.from(svgString, 'utf-8');
  return sharp(input)
    .png({ compressionLevel: 6 })
    .toBuffer();
}
