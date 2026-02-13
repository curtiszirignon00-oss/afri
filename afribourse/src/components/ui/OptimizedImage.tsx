import { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  sizes?: string;
  priority?: boolean;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fallbackSrc,
  sizes,
  priority = false,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  const handleLoad = () => setLoaded(true);

  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  const displaySrc = error && fallbackSrc ? fallbackSrc : src;

  // Determiner si l'image locale supporte le format WebP
  const isLocalImage = src.startsWith('/') && !src.startsWith('//');
  const hasImageExtension = /\.(png|jpg|jpeg)$/i.test(src);
  const webpSrc = isLocalImage && hasImageExtension
    ? src.replace(/\.(png|jpg|jpeg)$/i, '.webp')
    : null;

  const imgProps = {
    ref: imgRef,
    src: displaySrc,
    alt,
    width,
    height,
    loading: (priority ? 'eager' : 'lazy') as 'eager' | 'lazy',
    decoding: (priority ? 'sync' : 'async') as 'sync' | 'async',
    onLoad: handleLoad,
    onError: handleError,
    sizes,
    className: `transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`,
  };

  return (
    <div className="relative overflow-hidden" style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}>
      {/* Placeholder blur pendant le chargement */}
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}

      {webpSrc ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img {...imgProps} />
        </picture>
      ) : (
        <img {...imgProps} />
      )}
    </div>
  );
}

export type { OptimizedImageProps };
