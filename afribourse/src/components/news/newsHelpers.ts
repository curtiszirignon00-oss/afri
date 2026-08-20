// Helpers partagés pour l'affichage des news (cards, teasers, related)

export function getCategoryLabel(cat: string | null): string {
  if (!cat) return 'Non classé';
  const map: Record<string, string> = {
    marches:    'Marchés',
    analyse:    'Analyse',
    startup:    'Startup',
    economie:   'Économie',
    interview:  'Interview',
    resultats:  'Résultats 2025',
    dividendes: 'Dividendes',
  };
  const k = cat.toLowerCase();
  return map[k] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}

/**
 * Pastille de categorie. Une seule teinte, celle du logo, comme dans le bloc
 * « Actualités du Jour » de l'accueil : les six couleurs pastel d'avant (bleu,
 * vert, violet, orange, rose, turquoise) n'appartenaient a aucune palette du
 * site et laissaient croire a une hierarchie entre les rubriques.
 */
export function getCategoryColor(_cat: string | null): string {
  return 'bg-brand-navy text-white';
}

export function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'Date inconnue';
  try {
    const now  = new Date();
    const date = new Date(dateString);
    const diffH = Math.floor((now.getTime() - date.getTime()) / 3600000);
    if (diffH < 1)  return "moins d'une heure";
    if (diffH < 24) return `${diffH} heure${diffH > 1 ? 's' : ''}`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7)  return `${diffD} jour${diffD > 1 ? 's' : ''}`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return 'Date invalide'; }
}

export function calcReadTime(content: string | null): number {
  return Math.ceil((content ? content.split(/\s+/).length : 0) / 200) || 3;
}

// Récent : publié il y a moins de 48 h
export function isNewArticle(dateString: string | null): boolean {
  if (!dateString) return false;
  const diffH = (Date.now() - new Date(dateString).getTime()) / 3600000;
  return diffH >= 0 && diffH < 48;
}

// Retire les balises HTML et tronque — fallback de teaser quand summary est vide
export function stripHtml(html: string | null, max = 150): string {
  if (!html) return '';
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

export type ArticleCounts = { likes: number; comments: number; views: number };

// Score d'engagement (vues + likes*3 + commentaires*5)
export function engagementScore(c?: ArticleCounts): number {
  if (!c) return 0;
  return c.views + c.likes * 3 + c.comments * 5;
}
