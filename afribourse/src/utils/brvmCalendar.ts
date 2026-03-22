import type { OHLCVData } from '../types/chart.types';

/**
 * Jours fériés BRVM fixes (communs à toute la zone UEMOA)
 * Format: "MM-DD"
 */
const BRVM_FIXED_HOLIDAYS = new Set([
  '01-01', // Nouvel An
  '04-07', // Journée BRVM (fermeture annuelle)
  '05-01', // Fête du Travail
  '08-15', // Assomption
  '11-01', // Toussaint
  '12-25', // Noël
]);

/**
 * Jours fériés variables YYYY-MM-DD
 * (Pâques, Lundi de Pâques, Ascension, Lundi de Pentecôte)
 */
const BRVM_VARIABLE_HOLIDAYS = new Set([
  // Pâques
  '2022-04-17', '2023-04-09', '2024-03-31', '2025-04-20', '2026-04-05',
  // Lundi de Pâques
  '2022-04-18', '2023-04-10', '2024-04-01', '2025-04-21', '2026-04-06',
  // Ascension (39j après Pâques)
  '2022-05-26', '2023-05-18', '2024-05-09', '2025-05-29', '2026-05-14',
  // Lundi de Pentecôte (50j après Pâques)
  '2022-06-06', '2023-05-29', '2024-05-20', '2025-06-09', '2026-05-25',
]);

/**
 * Vérifie si un jour est un jour de bourse BRVM valide
 * (ni weekend, ni jour férié UEMOA fixe ou variable)
 */
export const isValidTradingDay = (dateStr: string): boolean => {
  const date = new Date(dateStr + 'T12:00:00Z'); // midi UTC évite les décalages DST
  const dow = date.getUTCDay(); // 0=dim, 6=sam

  if (dow === 0 || dow === 6) return false;

  const mmdd = dateStr.slice(5); // "2024-05-01" → "05-01"
  if (BRVM_FIXED_HOLIDAYS.has(mmdd)) return false;
  if (BRVM_VARIABLE_HOLIDAYS.has(dateStr)) return false;

  return true;
};

/**
 * Filtre un tableau de données OHLCV :
 * - Retire les weekends et jours fériés BRVM
 * - Retire les bougies fantômes (OHLC identiques + volume nul = titre non coté ce jour)
 */
export const filterTradingDays = (data: OHLCVData[]): OHLCVData[] => {
  return data.filter(d => {
    if (!isValidTradingDay(d.date)) return false;

    // Bougie fantôme : pas de cotation réelle ce jour
    const noActivity =
      d.open === d.close &&
      d.high === d.low &&
      d.volume === 0;
    return !noActivity;
  });
};
