import React from 'react';
import { ContentBlock } from '../data/brvm2026News';
import { ChartById } from './charts/SGBCICharts';

// variant 'news' = panneau latéral compact (texte xs/sm)
// variant 'module' = lecture pleine page (texte sm/base, espacement généreux)
type Variant = 'news' | 'module';

interface Props {
  blocks: ContentBlock[];
  variant?: Variant;
}

export function BlockRenderer({ blocks, variant = 'news' }: Props) {
  return (
    <div className={`space-y-${variant === 'module' ? '5' : '3'}`}>
      {blocks.map((block, i) => renderBlock(block, i, variant))}
    </div>
  );
}

function renderBlock(block: ContentBlock, i: number, v: Variant): React.ReactNode {
  const isModule = v === 'module';

  switch (block.type) {

    case 'disclaimer':
      return (
        <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 italic leading-relaxed">
          {block.text}
        </div>
      );

    case 'heading':
      return block.level === 1
        ? (
          <h2 key={i} className={`font-bold text-slate-900 border-b border-slate-100 pb-1 ${isModule ? 'text-base mt-7 mb-2' : 'text-sm mt-5 mb-1'}`}
              dangerouslySetInnerHTML={{ __html: block.text }} />
        )
        : (
          <h3 key={i} className={`font-bold text-slate-700 ${isModule ? 'text-sm mt-5 mb-1.5' : 'text-xs mt-3 mb-1'}`}
              dangerouslySetInnerHTML={{ __html: block.text }} />
        );

    case 'section-title': {
      const colorMap = {
        blue:   'bg-blue-50 border-blue-300 text-blue-900',
        green:  'bg-emerald-50 border-emerald-300 text-emerald-900',
        purple: 'bg-violet-50 border-violet-300 text-violet-900',
        orange: 'bg-orange-50 border-orange-300 text-orange-900',
      };
      const cls = colorMap[block.color ?? 'blue'];
      return (
        <div key={i} className={`border-l-4 px-4 py-2 rounded-r-lg ${cls} ${isModule ? 'mt-7 mb-2' : 'mt-5 mb-1'}`}>
          <p className={`font-bold ${isModule ? 'text-sm' : 'text-xs'}`} dangerouslySetInnerHTML={{ __html: block.text }} />
        </div>
      );
    }

    case 'paragraph':
      return (
        <p key={i} className={`text-slate-600 leading-relaxed ${isModule ? 'text-sm' : 'text-sm'}`}
           dangerouslySetInnerHTML={{ __html: block.text }} />
      );

    case 'image':
      return (
        <div key={i} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <img src={block.src} alt={block.caption ?? ''} className="w-full h-auto object-contain" />
          {block.caption && (
            <p className="text-[10px] text-slate-400 italic text-center px-3 py-2 bg-slate-50 border-t border-slate-100">
              {block.caption}
            </p>
          )}
        </div>
      );

    case 'table':
      return (
        <div key={i} className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          {block.caption && (
            <p className={`font-semibold text-slate-600 bg-slate-50 px-4 py-2 border-b border-slate-200 ${isModule ? 'text-xs' : 'text-[11px]'}`}>
              {block.caption}
            </p>
          )}
          <table className="w-full text-xs">
            {block.headers && (
              <thead>
                <tr className="bg-slate-800 text-white">
                  {block.headers.map((h, j) => (
                    <th key={j} className="text-left px-4 py-2.5 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, j) => (
                <tr key={j} className={j % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {row.map((cell, k) => (
                    <td key={k} className={`px-4 py-2.5 text-slate-700 ${k === 0 ? 'font-medium' : ''} ${isModule ? 'text-xs' : 'text-xs'}`}
                        dangerouslySetInnerHTML={{ __html: cell }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'key-stats':
      return (
        <div key={i} className={`grid gap-3 ${block.items.length <= 2 ? 'grid-cols-2' : block.items.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {block.items.map((item, j) => (
            <div key={j} className="bg-slate-900 rounded-lg p-3 text-center">
              <p className={`font-bold text-[#00D4A8] ${isModule ? 'text-base' : 'text-sm'}`}>{item.value}</p>
              <p className={`text-slate-400 mt-0.5 ${isModule ? 'text-xs' : 'text-[10px]'}`}>{item.label}</p>
            </div>
          ))}
        </div>
      );

    case 'highlight':
      return (
        <div key={i} className={`bg-[#00D4A8]/10 border-l-4 border-[#00D4A8] rounded-r-lg px-4 py-3 text-slate-700 leading-relaxed ${isModule ? 'text-sm' : 'text-xs'}`}
             dangerouslySetInnerHTML={{ __html: block.text }} />
      );

    case 'list':
      return (
        <ul key={i} className={`space-y-${isModule ? '2.5' : '2'}`}>
          {block.items.map((item, j) => (
            <li key={j} className={`text-slate-600 flex items-start gap-2 ${isModule ? 'text-sm' : 'text-sm'}`}>
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#00D4A8] shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ul>
      );

    case 'ordered-list':
      return (
        <ol key={i} className={`space-y-${isModule ? '2.5' : '2'} list-decimal list-inside`}>
          {block.items.map((item, j) => (
            <li key={j} className={`text-slate-600 ${isModule ? 'text-sm' : 'text-sm'}`}>
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </li>
          ))}
        </ol>
      );

    case 'callout': {
      const calloutStyles = {
        info: 'bg-blue-50 border-blue-300 text-blue-900',
        warn: 'bg-amber-50 border-amber-300 text-amber-900',
        ok:   'bg-emerald-50 border-emerald-300 text-emerald-900',
        note: 'bg-slate-100 border-slate-300 text-slate-700',
      };
      const titleStyles = {
        info: 'text-blue-700',
        warn: 'text-amber-700',
        ok:   'text-emerald-700',
        note: 'text-slate-600',
      };
      return (
        <div key={i} className={`border-l-4 rounded-r-lg px-4 py-3 space-y-1.5 ${calloutStyles[block.variant]}`}>
          <p className={`font-bold uppercase tracking-wide ${titleStyles[block.variant]} ${isModule ? 'text-xs' : 'text-xs'}`}
             dangerouslySetInnerHTML={{ __html: block.title }} />
          {block.paragraphs.map((p, j) => (
            <p key={j} className={`leading-relaxed ${isModule ? 'text-sm' : 'text-sm'}`}
               dangerouslySetInnerHTML={{ __html: p }} />
          ))}
        </div>
      );
    }

    case 'pull-quote':
      return (
        <blockquote key={i} className={`border-l-4 border-[#00D4A8] pl-4 py-2 italic text-slate-700 leading-relaxed bg-[#00D4A8]/5 rounded-r-lg ${isModule ? 'text-sm' : 'text-sm'}`}
                   dangerouslySetInnerHTML={{ __html: block.text }} />
      );

    case 'verdict':
      return (
        <div key={i} className="bg-slate-900 rounded-xl px-5 py-4 space-y-3">
          <p className={`font-bold text-[#00D4A8] uppercase tracking-widest ${isModule ? 'text-xs' : 'text-xs'}`}
             dangerouslySetInnerHTML={{ __html: block.title }} />
          {block.items.map((item, j) => (
            <div key={j} className="flex flex-col gap-0.5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
                 dangerouslySetInnerHTML={{ __html: item.label }} />
              <p className={`text-white leading-snug ${isModule ? 'text-sm' : 'text-sm'}`}
                 dangerouslySetInnerHTML={{ __html: item.text }} />
            </div>
          ))}
        </div>
      );

    case 'chart':
      return <ChartById key={i} chartId={block.chartId} />;

    case 'glossary':
      return (
        <div key={i} className={`${isModule ? 'mt-4' : 'mt-2'}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest px-2">Glossaire</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="divide-y divide-slate-100">
            {block.items.map((item, j) => (
              <div key={j} className="py-2.5">
                <p className="text-[11px] font-mono font-semibold text-slate-800 mb-0.5"
                   dangerouslySetInnerHTML={{ __html: item.term }} />
                <p className="text-xs text-slate-500 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: item.definition }} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'objectives':
      return (
        <div key={i} className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl px-5 py-4 text-white shadow-md">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3"
             dangerouslySetInnerHTML={{ __html: block.title ?? '🎯 Objectifs pédagogiques' }} />
          <p className="text-sm text-white/80 mb-2 italic"
             dangerouslySetInnerHTML={{ __html: block.subtitle ?? 'À la fin de ce module, vous :' }} />
          <ul className="space-y-2">
            {block.items.map((item, j) => (
              <li key={j} className={`flex items-start gap-2 ${isModule ? 'text-sm' : 'text-xs'}`}>
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#00D4A8] shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>
      );

    case 'analogy':
      return (
        <div key={i} className="bg-slate-800 rounded-xl px-5 py-4 space-y-2 shadow-md">
          <p className="text-xs font-bold text-[#00D4A8] uppercase tracking-widest"
             dangerouslySetInnerHTML={{ __html: block.title }} />
          <ul className="space-y-2">
            {block.items.map((item, j) => (
              <li key={j} className={`text-slate-300 flex items-start gap-2 ${isModule ? 'text-sm' : 'text-xs'}`}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
          {block.conclusion && (
            <p className={`text-slate-400 italic pt-1 border-t border-slate-700 ${isModule ? 'text-sm' : 'text-xs'}`}
               dangerouslySetInnerHTML={{ __html: block.conclusion }} />
          )}
        </div>
      );

    default:
      return null;
  }
}
