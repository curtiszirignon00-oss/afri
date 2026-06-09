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

export function getCategoryColor(cat: string | null): string {
  if (!cat) return 'bg-slate-100 text-slate-700';
  const map: Record<string, string> = {
    marches:    'bg-blue-50 text-blue-600 border-blue-100',
    analyse:    'bg-green-50 text-green-600 border-green-100',
    startup:    'bg-purple-50 text-purple-600 border-purple-100',
    economie:   'bg-orange-50 text-orange-600 border-orange-100',
    interview:  'bg-pink-50 text-pink-600 border-pink-100',
    dividendes: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return map[cat.toLowerCase()] ?? 'bg-slate-50 text-slate-600 border-slate-100';
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
