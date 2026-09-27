// Formatage partage des vues de valorisation. Les montants du modele sont en
// millions de FCFA, les valeurs par action en FCFA : deux echelles a ne pas melanger.

export const NAVY = '#0D2B4E';
export const ORANGE = '#E8610A';

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits).replace('.', ',')} %`;
}

/** Valeur par action, en FCFA entiers. */
export function formatPerShare(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('fr-FR')} F`;
}

/** Montant du modele, en millions de FCFA. */
export function formatMillions(value: number | null | undefined, digits = 0): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatNumber(value: number | null | undefined, digits = 4): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value.toFixed(digits).replace('.', ',');
}

/** Un potentiel vs cours : signe explicite, couleur par sens. */
export function formatUpside(value: number | null | undefined): { text: string; className: string } {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { text: '—', className: 'text-gray-400' };
  }
  const sign = value > 0 ? '+' : '';
  return {
    text: `${sign}${(value * 100).toFixed(1).replace('.', ',')} %`,
    className: value > 0 ? 'text-emerald-600' : 'text-red-600'
  };
}

export const SEVERITY_STYLES: Record<'info' | 'warning' | 'error', string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-red-50 border-red-200 text-red-900'
};
