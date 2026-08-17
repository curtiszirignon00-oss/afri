import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts-line-tools';

interface Props {
  data: { time: string; value: number }[];
  isUp: boolean;
  height?: number;
  /**
   * Affiche l'echelle des prix a droite, l'axe des dates en bas et une grille
   * horizontale. Par defaut la courbe reste nue : sans reperes, elle ne donne
   * qu'une tendance.
   */
  showAxes?: boolean;
}

export default function SparklineChart({ data, isUp, height = 120, showAxes = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    const color = isUp ? '#10b981' : '#ef4444';
    // Axes et grille en gris tres clair : ce sont des reperes, ils ne doivent
    // jamais concurrencer la courbe.
    const AXIS_LINE = '#E9EBED';
    const AXIS_TEXT = '#7C95AB';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: showAxes ? AXIS_TEXT : 'transparent',
        fontSize: 10,
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: showAxes ? { visible: true, color: AXIS_LINE, style: 2 } : { visible: false },
      },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      rightPriceScale: showAxes
        ? { visible: true, borderColor: AXIS_LINE, scaleMargins: { top: 0.15, bottom: 0.1 }, entireTextOnly: true }
        : { visible: false },
      leftPriceScale: { visible: false },
      timeScale: showAxes
        ? { visible: true, borderColor: AXIS_LINE, timeVisible: false, fixLeftEdge: true, fixRightEdge: true }
        : { visible: false, borderVisible: false },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      topColor: color + '40',
      bottomColor: color + '00',
      lineColor: color,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    series.setData(data as any);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [data, isUp, height, showAxes]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
