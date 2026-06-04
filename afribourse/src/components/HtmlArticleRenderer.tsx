import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  html: string;
}

export default function HtmlArticleRenderer({ html }: Props) {
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const [src, setSrc]       = useState('');
  const [height, setHeight] = useState(800);

  // Blob URL — même origine que la page parente, scripts exécutés nativement
  useEffect(() => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);

  const resize = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      if (!doc) return;
      const h = doc.documentElement.scrollHeight || doc.body?.scrollHeight || 0;
      if (h > 100) setHeight(h + 40);
    } catch { /* cross-origin — hauteur fixe */ }
  }, []);

  const handleLoad = useCallback(() => {
    resize();
    // Chart.js dessine en asynchrone — on re-mesure après rendu
    setTimeout(resize, 300);
    setTimeout(resize, 1000);
  }, [resize]);

  if (!src) {
    return (
      <div className="w-full animate-pulse bg-slate-100 rounded-xl" style={{ height: 800 }} />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={src}
      style={{ width: '100%', height: `${height}px`, border: 'none', display: 'block' }}
      onLoad={handleLoad}
      title="article-content"
    />
  );
}
