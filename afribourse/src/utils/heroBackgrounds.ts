// Fonds des hero : la charte du bloc simulateur (degrade navy + halo bleu
// clair), declinee en quatre variantes qui se succedent. Seuls l'angle du
// degrade et la position du halo changent — les teintes restent celles du logo,
// pour que la rotation se lise comme une respiration et non comme un changement
// de page.
//
// Partage entre l'accueil et la page webinaire : les deux hero doivent rester
// identiques, et deux copies auraient derive a la premiere retouche.

export interface HeroBackground {
  gradient: string;
  halo: string;
}

export const HERO_BACKGROUNDS: HeroBackground[] = [
  {
    gradient: 'linear-gradient(135deg, #12395E 0%, #173F66 45%, #09121B 100%)',
    halo: 'radial-gradient(circle at 85% 12%, rgba(124,149,171,0.34) 0%, transparent 55%)',
  },
  {
    gradient: 'linear-gradient(115deg, #09121B 0%, #12395E 55%, #1B4E7D 100%)',
    halo: 'radial-gradient(circle at 15% 85%, rgba(83,117,147,0.40) 0%, transparent 55%)',
  },
  {
    gradient: 'linear-gradient(160deg, #1B4E7D 0%, #12395E 45%, #09121B 100%)',
    halo: 'radial-gradient(circle at 92% 78%, rgba(124,149,171,0.30) 0%, transparent 52%)',
  },
  {
    gradient: 'linear-gradient(200deg, #12395E 0%, #09121B 60%, #173F66 100%)',
    halo: 'radial-gradient(circle at 30% 18%, rgba(27,78,125,0.55) 0%, transparent 55%)',
  },
];

/** Trame quadrillee blanche, commune a toutes les variantes. */
export const HERO_GRID_STYLE = {
  backgroundImage:
    'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
  backgroundSize: '44px 44px',
} as const;
