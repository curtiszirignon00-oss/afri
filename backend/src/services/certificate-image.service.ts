// backend/src/services/certificate-image.service.ts
// Génère les images PNG du certificat Afribourse Académie via SVG → sharp

import { svgToPng } from './og-image.service';
import { LOGO_DATA_URI } from '../assets/logo-base64';

export interface CertificateImageData {
  participantName: string;
  moduleName: string;
  moduleSubtitle: string;
  webinarDate: Date;
  issuedAt: Date;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

// Génère le SVG principal du certificat — 1200×848px (format paysage A4 optimisé)
export function buildCertificateSVG(data: CertificateImageData): string {
  const W = 1200;
  const H = 848;
  const name = xmlEscape(data.participantName);
  const module = xmlEscape(data.moduleName);
  const subtitle = xmlEscape(data.moduleSubtitle);
  const dateWeb = xmlEscape(formatDate(data.webinarDate));
  const dateIssued = xmlEscape(formatDate(data.issuedAt));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F172A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E293B;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#D97706;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#F59E0B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#D97706;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="nameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FBBF24;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Fond principal -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)" />

  <!-- Bordure dorée externe -->
  <rect x="16" y="16" width="${W - 32}" height="${H - 32}" fill="none" stroke="url(#borderGrad)" stroke-width="3" rx="8" />

  <!-- Bordure interne fine -->
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#D97706" stroke-width="1" stroke-dasharray="8,4" rx="4" opacity="0.4" />

  <!-- Coins décoratifs -->
  <polygon points="40,40 80,40 40,80" fill="#D97706" opacity="0.6" />
  <polygon points="${W - 40},40 ${W - 80},40 ${W - 40},80" fill="#D97706" opacity="0.6" />
  <polygon points="40,${H - 40} 80,${H - 40} 40,${H - 80}" fill="#D97706" opacity="0.6" />
  <polygon points="${W - 40},${H - 40} ${W - 80},${H - 40} ${W - 40},${H - 80}" fill="#D97706" opacity="0.6" />

  <!-- Logo Afribourse -->
  <image href="${LOGO_DATA_URI}" x="${W / 2 - 64}" y="58" width="128" height="86" preserveAspectRatio="xMidYMid meet" />

  <!-- En-tête — Académie Afribourse -->
  <text x="${W / 2}" y="182" font-family="Georgia, serif" font-size="13" fill="#94A3B8" text-anchor="middle" letter-spacing="4">ACADÉMIE AFRIBOURSE</text>

  <!-- Trait décoratif -->
  <line x1="${W / 2 - 120}" y1="200" x2="${W / 2 + 120}" y2="200" stroke="#D97706" stroke-width="1" opacity="0.5" />
  <circle cx="${W / 2}" cy="200" r="3" fill="#D97706" opacity="0.6" />

  <!-- Titre principal -->
  <text x="${W / 2}" y="258" font-family="Georgia, serif" font-size="36" fill="#F1F5F9" text-anchor="middle" letter-spacing="2">CERTIFICAT DE PARTICIPATION</text>

  <!-- Sous-texte -->
  <text x="${W / 2}" y="298" font-family="Arial, sans-serif" font-size="15" fill="#64748B" text-anchor="middle">Ce certificat est décerné à</text>

  <!-- Nom du participant — en grand -->
  <text x="${W / 2}" y="372" font-family="Georgia, serif" font-size="52" fill="url(#nameGrad)" text-anchor="middle" font-style="italic">${name}</text>

  <!-- Ligne de séparation sous le nom -->
  <line x1="${W / 2 - 200}" y1="398" x2="${W / 2 + 200}" y2="398" stroke="url(#borderGrad)" stroke-width="1.5" />

  <!-- Texte de participation -->
  <text x="${W / 2}" y="440" font-family="Arial, sans-serif" font-size="15" fill="#94A3B8" text-anchor="middle">pour avoir participé au webinaire</text>

  <!-- Nom du module -->
  <text x="${W / 2}" y="488" font-family="Georgia, serif" font-size="28" fill="#F1F5F9" text-anchor="middle">${module}</text>

  <!-- Sous-titre du module -->
  <text x="${W / 2}" y="520" font-family="Arial, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">${subtitle}</text>

  <!-- Trait bas -->
  <line x1="${W / 2 - 280}" y1="570" x2="${W / 2 + 280}" y2="570" stroke="#334155" stroke-width="1" />

  <!-- Date du webinaire et date d'émission -->
  <text x="${W / 2 - 180}" y="612" font-family="Arial, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">DATE DU WEBINAIRE</text>
  <text x="${W / 2 - 180}" y="634" font-family="Georgia, serif" font-size="16" fill="#CBD5E1" text-anchor="middle">${dateWeb}</text>

  <line x1="${W / 2}" y1="598" x2="${W / 2}" y2="640" stroke="#334155" stroke-width="1" />

  <text x="${W / 2 + 180}" y="612" font-family="Arial, sans-serif" font-size="12" fill="#64748B" text-anchor="middle">ÉMIS LE</text>
  <text x="${W / 2 + 180}" y="634" font-family="Georgia, serif" font-size="16" fill="#CBD5E1" text-anchor="middle">${dateIssued}</text>

  <!-- Signature / validation -->
  <line x1="${W / 2 - 100}" y1="718" x2="${W / 2 + 100}" y2="718" stroke="#475569" stroke-width="1" />
  <text x="${W / 2}" y="740" font-family="Arial, sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Curtis Zirignon — Fondateur, Afribourse Académie</text>

  <!-- Logo / branding bas -->
  <text x="${W / 2}" y="800" font-family="Arial, sans-serif" font-size="11" fill="#334155" text-anchor="middle" letter-spacing="2">africbourse.com - INVESTIR MIEUX</text>
</svg>`;
}

// Génère le SVG OG (1200×630) pour les crawlers sociaux
export function buildCertificateOGSVG(data: CertificateImageData): string {
  const W = 1200;
  const H = 630;
  const name = xmlEscape(data.participantName);
  const module = xmlEscape(data.moduleName);
  const subtitle = xmlEscape(data.moduleSubtitle);
  const dateWeb = xmlEscape(formatDate(data.webinarDate));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0F172A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E293B;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="nameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F59E0B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FBBF24;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bgGrad)" />
  <rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="#D97706" stroke-width="2.5" rx="6" />

  <polygon points="28,28 60,28 28,60" fill="#D97706" opacity="0.6" />
  <polygon points="${W - 28},28 ${W - 60},28 ${W - 28},60" fill="#D97706" opacity="0.6" />
  <polygon points="28,${H - 28} 60,${H - 28} 28,${H - 60}" fill="#D97706" opacity="0.6" />
  <polygon points="${W - 28},${H - 28} ${W - 60},${H - 28} ${W - 28},${H - 60}" fill="#D97706" opacity="0.6" />

  <image href="${LOGO_DATA_URI}" x="${W / 2 - 52}" y="44" width="104" height="70" preserveAspectRatio="xMidYMid meet" />
  <text x="${W / 2}" y="135" font-family="Arial, sans-serif" font-size="12" fill="#94A3B8" text-anchor="middle" letter-spacing="4">ACADÉMIE AFRIBOURSE</text>
  <text x="${W / 2}" y="180" font-family="Georgia, serif" font-size="28" fill="#F1F5F9" text-anchor="middle" letter-spacing="1">CERTIFICAT DE PARTICIPATION</text>

  <line x1="${W / 2 - 150}" y1="200" x2="${W / 2 + 150}" y2="200" stroke="#D97706" stroke-width="1" opacity="0.5" />

  <text x="${W / 2}" y="240" font-family="Arial, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">décerné à</text>
  <text x="${W / 2}" y="305" font-family="Georgia, serif" font-size="46" fill="url(#nameGrad)" text-anchor="middle" font-style="italic">${name}</text>

  <line x1="${W / 2 - 180}" y1="325" x2="${W / 2 + 180}" y2="325" stroke="#D97706" stroke-width="1" opacity="0.4" />

  <text x="${W / 2}" y="370" font-family="Arial, sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle">pour sa participation au webinaire</text>
  <text x="${W / 2}" y="415" font-family="Georgia, serif" font-size="26" fill="#F1F5F9" text-anchor="middle">${module}</text>
  <text x="${W / 2}" y="445" font-family="Arial, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">${subtitle}</text>

  <text x="${W / 2}" y="510" font-family="Arial, sans-serif" font-size="13" fill="#64748B" text-anchor="middle">${dateWeb}</text>

  <text x="${W / 2}" y="590" font-family="Arial, sans-serif" font-size="11" fill="#334155" text-anchor="middle" letter-spacing="2">africbourse.com - INVESTIR MIEUX</text>
</svg>`;
}

// Génère le PNG 1200×848 du certificat
export async function generateCertificatePng(data: CertificateImageData): Promise<Buffer> {
  return svgToPng(buildCertificateSVG(data));
}

// Génère le PNG 1200×630 pour l'OG
export async function generateCertificateOGPng(data: CertificateImageData): Promise<Buffer> {
  return svgToPng(buildCertificateOGSVG(data));
}
