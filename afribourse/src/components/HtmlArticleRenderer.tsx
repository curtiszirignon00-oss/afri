import { useRef, useState, useCallback } from 'react';

interface Props {
  html: string;
}

export default function HtmlArticleRenderer({ html }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(900);

  const resize = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (!doc) return;
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
        resize();
        setTimeout(resize, 600);
        setTimeout(resize, 1800);
      }}
      title="article-content"
    />
  );
}
