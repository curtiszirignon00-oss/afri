// src/components/ui/buttonStyles.ts
//
// Source unique des habillages de boutons.
//
// Le header compose ses <Link> et <button> a la main (un <Link> ne peut pas
// passer par <Button>), le reste de l'app passe par <Button>. Sans ce module
// les deux derivaient : l'orange du hero n'etait pas celui du header, et les
// ombres au survol n'existaient que d'un cote.

/** Forme, graisse, transition, anneau de focus. Commun a tous les boutons. */
export const BTN_BASE =
  'inline-flex items-center justify-center font-semibold rounded-lg ' +
  'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

/**
 * Habillages.
 *
 * Les cinq premiers portent la charte. L'action principale est toujours
 * `orange`. Pour l'action secondaire, deux traitements coherents entre eux,
 * chacun decline selon la clarte du fond :
 *
 *   aplat plein   →  `navy` (fond clair)  /  `inverse` (fond sombre)
 *   contour       →  `navyOutline`        /  `inverseOutline`
 *
 * Les deux paires sont interchangeables : basculer le header et le hero d'un
 * traitement a l'autre ne demande que de changer le nom de la variante aux
 * trois points d'appel. Les suivants sont les variantes historiques.
 */
export const BTN_VARIANTS = {
  orange:
    'bg-brand-orange text-white shadow-sm hover:bg-brand-orange-hover ' +
    'hover:shadow-md hover:shadow-brand-orange/30 focus:ring-brand-orange disabled:bg-brand-orange/50',
  navy:
    'bg-brand-navy text-white shadow-sm hover:bg-brand-navy-hover ' +
    'hover:shadow-md hover:shadow-brand-navy/30 focus:ring-brand-navy disabled:bg-brand-navy/50',
  inverse:
    'bg-white text-brand-navy shadow-sm hover:bg-ink-50 ' +
    'hover:shadow-md hover:shadow-black/25 focus:ring-white disabled:bg-white/50',

  // Contours : le trait se remplit au survol. Les icones heritent de
  // currentColor, elles suivent donc l'inversion sans reglage supplementaire.
  navyOutline:
    'bg-transparent border-2 border-brand-navy text-brand-navy ' +
    'hover:bg-brand-navy hover:text-white hover:shadow-md hover:shadow-brand-navy/30 ' +
    'focus:ring-brand-navy disabled:border-brand-navy/40 disabled:text-brand-navy/40',
  inverseOutline:
    'bg-transparent border-2 border-white/80 text-white ' +
    'hover:bg-white hover:text-brand-navy hover:shadow-md hover:shadow-black/25 ' +
    'focus:ring-white disabled:border-white/40 disabled:text-white/40',

  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 disabled:bg-gray-100',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  outline:
    'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50 ' +
    'focus:ring-blue-500 disabled:border-blue-300 disabled:text-blue-300',
} as const;

export type ButtonVariant = keyof typeof BTN_VARIANTS;
