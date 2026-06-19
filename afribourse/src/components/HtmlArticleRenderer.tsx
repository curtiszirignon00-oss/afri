import { useRef, useState, useCallback } from 'react';

interface Props {
  html: string;
}

// CSS injecté dans l'iframe pour éviter le « grand vide » : les articles ont
// souvent un hero en min-height:Nvh. Comme l'iframe est auto-dimensionnée à la
// hauteur totale du contenu, les unités vh se calculent sur cette hauteur
// énorme → hero démesuré. On neutralise les vh sur les sections d'en-tête et
// on force html/body en hauteur auto.
const NORMALIZE_CSS = `
  html, body { height: auto !important; min-height: 0 !important; }
  .hero, .masthead, .site-header, .cover, header[class],
  [class*="hero"], [class*="masthead"], [class*="cover"] {
    min-height: 0 !important;
  }
`;

export default function HtmlArticleRenderer({ html }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);

  const normalizeAndResize = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (!doc) return;

      // Injecte la feuille de normalisation une seule fois
      if (doc.head && !doc.getElementById('__afb_normalize')) {
        const style = doc.createElement('style');
        style.id = '__afb_normalize';
        style.textContent = NORMALIZE_CSS;
        doc.head.appendChild(style);
      }

      const h = Math.max(
        doc.documentElement.scrollHeight ?? 0,
        doc.body?.scrollHeight ?? 0,
      );
      if (h > 200) setHeight(h + 60);
    } catch {
      // cross-origin fallback — hauteur initiale
    }
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      style={{ width: '100%', height: `${height}px`, border: 'none', display: 'block' }}
      onLoad={() => {
        normalizeAndResize();
        setTimeout(normalizeAndResize, 600);
        setTimeout(normalizeAndResize, 1800);
      }}
      title="article-content"
    />
  );
}
