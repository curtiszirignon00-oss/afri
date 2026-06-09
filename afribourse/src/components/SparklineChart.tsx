import { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts-line-tools';

interface Props {
  data: { time: string; value: number }[];
  isUp: boolean;
  height?: number;
}

export default function SparklineChart({ data, isUp, height = 120 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || data.length < 2) return;

    const color = isUp ? '#10b981' : '#ef4444';

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: 'transparent',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: { horzLine: { visible: false }, vertLine: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, borderVisible: false },
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
  }, [data, isUp, height]);

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
