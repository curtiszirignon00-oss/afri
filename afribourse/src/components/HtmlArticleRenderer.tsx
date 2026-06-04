import { useEffect, useRef, useState } from 'react';

interface Props {
  html: string;
}

export default function HtmlArticleRenderer({ html }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function resize() {
      try {
        const doc = iframe!.contentWindow?.document;
        if (!doc) return;
        const h = doc.documentElement.scrollHeight || doc.body?.scrollHeight || 600;
        setHeight(h + 32);
      } catch {
        // cross-origin fallback
      }
    }

    iframe.addEventListener('load', () => {
      resize();
      // Re-check après que Chart.js ait fini de dessiner (~300ms)
      setTimeout(resize, 400);
    });
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      style={{ width: '100%', height: `${height}px`, border: 'none', display: 'block' }}
      sandbox="allow-scripts"
      title="article-content"
    />
  );
}
