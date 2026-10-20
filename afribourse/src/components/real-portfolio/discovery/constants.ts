// src/components/real-portfolio/discovery/constants.ts
/** Attribut posé sur la racine du guide (ignoré par la détection d'overlays). */
export const GUIDE_ROOT_ATTR = 'data-rp-guide';
export const GUIDE_ROOT_SELECTOR = `[${GUIDE_ROOT_ATTR}]`;
/** Garde-fou session : un seul lancement automatique par session, même si l'API échoue. */
export const GUIDE_SESSION_KEY = 'rp_guide_autoshown';
