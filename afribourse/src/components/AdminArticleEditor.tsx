import React, { useState, useCallback } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  Save, X, FileText, Tag, Star, AlertCircle, Check,
} from 'lucide-react';
import { ContentBlock, ImpactType, TickerImpact } from '../data/brvm2026News';
import { BlockRenderer } from './BlockRenderer';
import { authFetch } from '../config/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Types ────────────────────────────────────────────────────────────────────

interface ArticleForm {
  title: string;
  summary: string;
  category: string;
  author: string;
  source: string;
  is_featured: boolean;
  image_url: string;
  tickers: TickerImpact[];
  blocks: ContentBlock[];
}

const EMPTY_FORM: ArticleForm = {
  title: '',
  summary: '',
  category: 'Analyse Fondamentale',
  author: 'AfriBourse',
  source: 'AfriBourse Research',
  is_featured: false,
  image_url: '',
  tickers: [],
  blocks: [],
};

const CATEGORIES = [
  'Analyse Fondamentale',
  'Marché',
  'Macro',
  'Dividendes',
  'Actualités',
  'Secteur',
  'Stratégie',
];

const IMPACTS: ImpactType[] = ['Positif', 'Négatif', 'Neutre', 'Mixte'];

const BLOCK_MENU = [
  { type: 'paragraph',   label: 'Paragraphe',   icon: '¶' },
  { type: 'heading',     label: 'Titre',         icon: 'H' },
  { type: 'callout',     label: 'Encadré',       icon: '⬜' },
  { type: 'key-stats',   label: 'Stats clés',    icon: '📊' },
  { type: 'table',       label: 'Tableau',       icon: '⊞' },
  { type: 'list',        label: 'Liste',         icon: '•' },
  { type: 'highlight',   label: 'Mise en avant', icon: '★' },
  { type: 'pull-quote',  label: 'Citation',      icon: '"' },
  { type: 'verdict',     label: 'Verdict',       icon: '✔' },
  { type: 'disclaimer',  label: 'Disclaimer',    icon: '⚠' },
  { type: 'chart',       label: 'Graphique',     icon: '📈' },
];

function defaultBlock(type: string): ContentBlock {
  switch (type) {
    case 'heading':    return { type: 'heading', level: 1, text: '' };
    case 'callout':    return { type: 'callout', variant: 'info', title: '', paragraphs: [''] };
    case 'key-stats':  return { type: 'key-stats', items: [{ label: '', value: '' }] };
    case 'table':      return { type: 'table', caption: '', headers: ['Colonne 1', 'Colonne 2'], rows: [['', '']] };
    case 'list':       return { type: 'list', items: [''] };
    case 'highlight':  return { type: 'highlight', text: '' };
    case 'pull-quote': return { type: 'pull-quote', text: '' };
    case 'verdict':    return { type: 'verdict', title: '', items: [{ label: '', text: '' }] };
    case 'disclaimer': return { type: 'disclaimer', text: '' };
    case 'chart':      return { type: 'chart', chartId: '' };
    default:           return { type: 'paragraph', text: '' };
  }
}

// ── Block Editor ─────────────────────────────────────────────────────────────

function BlockEditor({ block, onChange }: { block: ContentBlock; onChange: (b: ContentBlock) => void }) {
  switch (block.type) {
    case 'paragraph':
    case 'highlight':
    case 'pull-quote':
    case 'disclaimer':
      return (
        <textarea
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[80px]"
          value={block.text}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Texte..."
        />
      );

    case 'heading':
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {([1, 2] as const).map(lvl => (
              <button key={lvl}
                className={`px-3 py-1 rounded text-xs font-bold border ${block.level === lvl ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}
                onClick={() => onChange({ ...block, level: lvl })}
              >
                H{lvl}
              </button>
            ))}
          </div>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            placeholder="Texte du titre..."
          />
        </div>
      );

    case 'callout': {
      const variants = ['info', 'warn', 'ok', 'note'] as const;
      const variantColors = { info: 'text-blue-600 bg-blue-50 border-blue-300', warn: 'text-amber-600 bg-amber-50 border-amber-300', ok: 'text-emerald-600 bg-emerald-50 border-emerald-300', note: 'text-slate-600 bg-slate-100 border-slate-300' };
      return (
        <div className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            {variants.map(v => (
              <button key={v}
                className={`px-2 py-0.5 rounded text-xs font-semibold border ${block.variant === v ? variantColors[v] + ' ring-2 ring-offset-1' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                onClick={() => onChange({ ...block, variant: v })}
              >
                {v}
              </button>
            ))}
          </div>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="Titre de l'encadré..."
          />
          {block.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[60px]"
                value={p}
                onChange={e => {
                  const ps = [...block.paragraphs];
                  ps[i] = e.target.value;
                  onChange({ ...block, paragraphs: ps });
                }}
                placeholder={`Paragraphe ${i + 1}...`}
              />
              <button onClick={() => onChange({ ...block, paragraphs: block.paragraphs.filter((_, j) => j !== i) })}
                className="mt-1 text-red-400 hover:text-red-600 p-1">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, paragraphs: [...block.paragraphs, ''] })}
            className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1">
            <Plus size={12} /> Ajouter un paragraphe
          </button>
        </div>
      );
    }

    case 'key-stats':
      return (
        <div className="space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={item.label}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = { ...items[i], label: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Libellé..."
              />
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={item.value}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = { ...items[i], value: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Valeur..."
              />
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                className="text-red-400 hover:text-red-600 p-1">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, items: [...block.items, { label: '', value: '' }] })}
            className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1">
            <Plus size={12} /> Ajouter une stat
          </button>
        </div>
      );

    case 'table': {
      const cols = block.headers?.length ?? 2;
      return (
        <div className="space-y-2">
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={block.caption ?? ''}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Légende du tableau..."
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {(block.headers ?? []).map((h, j) => (
                    <th key={j} className="border border-slate-200 p-1">
                      <input
                        className="w-full bg-slate-50 px-2 py-1 font-semibold text-center focus:outline-none"
                        value={h}
                        onChange={e => {
                          const headers = [...(block.headers ?? [])];
                          headers[j] = e.target.value;
                          onChange({ ...block, headers });
                        }}
                      />
                    </th>
                  ))}
                  <th className="border border-slate-100 w-8">
                    <button onClick={() => {
                      onChange({
                        ...block,
                        headers: [...(block.headers ?? []), `Col ${cols + 1}`],
                        rows: block.rows.map(r => [...r, '']),
                      });
                    }} className="text-teal-500 hover:text-teal-700 p-1"><Plus size={12} /></button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-slate-200 p-1">
                        <input
                          className="w-full px-2 py-1 focus:outline-none text-xs"
                          value={cell}
                          onChange={e => {
                            const rows = block.rows.map((r, rr) =>
                              rr === ri ? r.map((c, cc) => cc === ci ? e.target.value : c) : r
                            );
                            onChange({ ...block, rows });
                          }}
                        />
                      </td>
                    ))}
                    <td className="border border-slate-100 w-8 text-center">
                      <button onClick={() => onChange({ ...block, rows: block.rows.filter((_, j) => j !== ri) })}
                        className="text-red-400 hover:text-red-600 p-1"><X size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => onChange({ ...block, rows: [...block.rows, Array(cols).fill('')] })}
            className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1">
            <Plus size={12} /> Ajouter une ligne
          </button>
        </div>
      );
    }

    case 'list':
      return (
        <div className="space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-[#00D4A8] text-lg leading-none">•</span>
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={item}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = e.target.value;
                  onChange({ ...block, items });
                }}
                placeholder={`Élément ${i + 1}...`}
              />
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, items: [...block.items, ''] })}
            className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1">
            <Plus size={12} /> Ajouter un élément
          </button>
        </div>
      );

    case 'verdict':
      return (
        <div className="space-y-2">
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="Titre du verdict..."
          />
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={item.label}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = { ...items[i], label: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Libellé..."
              />
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={item.text}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = { ...items[i], text: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Texte..."
              />
              <button onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                className="text-red-400 hover:text-red-600 p-1"><X size={14} /></button>
            </div>
          ))}
          <button onClick={() => onChange({ ...block, items: [...block.items, { label: '', text: '' }] })}
            className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1">
            <Plus size={12} /> Ajouter un item
          </button>
        </div>
      );

    case 'chart':
      return (
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          value={block.chartId}
          onChange={e => onChange({ ...block, chartId: e.target.value })}
          placeholder="ID du graphique (ex: sgbc-pnb, orgt-rentabilite)..."
        />
      );

    default:
      return null;
  }
}

// ── Single Block Row ──────────────────────────────────────────────────────────

function BlockRow({
  block, index, total,
  onMove, onDelete, onChange,
}: {
  block: ContentBlock;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onChange: (b: ContentBlock) => void;
}) {
  const [open, setOpen] = useState(true);
  const meta = BLOCK_MENU.find(m => m.type === block.type);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
        <span className="text-base w-6 text-center">{meta?.icon ?? '◻'}</span>
        <span className="text-xs font-semibold text-slate-600 flex-1">{meta?.label ?? block.type}</span>
        <button onClick={() => onMove(-1)} disabled={index === 0}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
          <ChevronUp size={14} />
        </button>
        <button onClick={() => onMove(1)} disabled={index === total - 1}
          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">
          <ChevronDown size={14} />
        </button>
        <button onClick={() => setOpen(o => !o)}
          className="p-1 text-slate-400 hover:text-slate-700 text-xs">
          {open ? '▲' : '▼'}
        </button>
        <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600">
          <Trash2 size={14} />
        </button>
      </div>
      {open && (
        <div className="p-3">
          <BlockEditor block={block} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  articleId?: string;
  initialData?: Partial<ArticleForm> & { id?: string };
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}

export default function AdminArticleEditor({ articleId, initialData, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<ArticleForm>({
    ...EMPTY_FORM,
    ...initialData,
    blocks: (initialData as any)?.rich_content
      ? (() => { try { return JSON.parse((initialData as any).rich_content); } catch { return []; } })()
      : initialData?.blocks ?? [],
  });

  const [newTicker, setNewTicker] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const update = useCallback(<K extends keyof ArticleForm>(key: K, val: ArticleForm[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    setSaved(false);
  }, []);

  const addTicker = () => {
    const t = newTicker.trim().toUpperCase();
    if (!t || form.tickers.some(x => x.ticker === t)) return;
    update('tickers', [...form.tickers, { ticker: t, impact: 'Neutre', note: '' }]);
    setNewTicker('');
  };

  const removeTicker = (ticker: string) => {
    update('tickers', form.tickers.filter(t => t.ticker !== ticker));
  };

  const updateTicker = (ticker: string, field: 'impact' | 'note', val: string) => {
    update('tickers', form.tickers.map(t =>
      t.ticker === ticker ? { ...t, [field]: val } : t
    ));
  };

  const addBlock = (type: string) => {
    update('blocks', [...form.blocks, defaultBlock(type)]);
    setShowAddBlock(false);
  };

  const moveBlock = (i: number, dir: -1 | 1) => {
    const blocks = [...form.blocks];
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    update('blocks', blocks);
  };

  const deleteBlock = (i: number) => {
    update('blocks', form.blocks.filter((_, j) => j !== i));
  };

  const updateBlock = (i: number, b: ContentBlock) => {
    const blocks = [...form.blocks];
    blocks[i] = b;
    update('blocks', blocks);
  };

  const save = async () => {
    if (!form.title.trim()) {
      setSaveError('Le titre est requis.');
      return;
    }
    setSaving(true);
    setSaveError(null);

    const payload = {
      title: form.title,
      summary: form.summary,
      category: form.category,
      author: form.author,
      source: form.source,
      is_featured: form.is_featured,
      image_url: form.image_url,
      tickers: form.tickers,
      rich_content: form.blocks,
    };

    try {
      const url = articleId
        ? `${API}/admin/articles/${articleId}`
        : `${API}/admin/articles`;
      const method = articleId ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Erreur ${res.status}`);
      }
      const saved = await res.json();
      setSaved(true);
      onSaved?.(saved.id);
    } catch (err: any) {
      setSaveError(err.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const impactColor: Record<ImpactType, string> = {
    Positif: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Négatif: 'bg-red-100 text-red-800 border-red-300',
    Neutre:  'bg-slate-100 text-slate-600 border-slate-300',
    Mixte:   'bg-amber-100 text-amber-800 border-amber-300',
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-teal-600" />
          <h2 className="font-bold text-slate-900 text-lg">
            {articleId ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${preview ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
          >
            {preview ? <EyeOff size={14} /> : <Eye size={14} />}
            {preview ? 'Éditer' : 'Aperçu'}
          </button>
          {onCancel && (
            <button onClick={onCancel} className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 border border-slate-200">
              Annuler
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {saveError}
        </div>
      )}

      {preview ? (
        /* ── Preview pane ── */
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="mb-6">
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">{form.category}</span>
              <h1 className="text-2xl font-bold text-slate-900 mt-1 mb-3 leading-tight">{form.title || 'Titre de l\'article'}</h1>
              {form.summary && <p className="text-slate-500 leading-relaxed">{form.summary}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {form.tickers.map(t => (
                  <span key={t.ticker} className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${impactColor[t.impact]}`}>
                    {t.ticker} · {t.impact}
                  </span>
                ))}
              </div>
            </div>
            <BlockRenderer blocks={form.blocks} variant="news" />
          </div>
        </div>
      ) : (
        /* ── Edit pane ── */
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <FileText size={14} /> Informations générales
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Titre *</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                placeholder="Titre de l'article..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Résumé</label>
              <textarea
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[70px]"
                value={form.summary}
                onChange={e => update('summary', e.target.value)}
                placeholder="Court résumé de l'article..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Catégorie</label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                  value={form.category}
                  onChange={e => update('category', e.target.value)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Auteur</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.author}
                  onChange={e => update('author', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Source</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.source}
                  onChange={e => update('source', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Image URL (optionnel)</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  value={form.image_url}
                  onChange={e => update('image_url', e.target.value)}
                  placeholder="/images/..."
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => update('is_featured', !form.is_featured)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_featured ? 'bg-teal-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? 'translate-x-5' : ''}`} />
              </div>
              <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                <Star size={14} className={form.is_featured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                Article à la une
              </span>
            </label>
          </section>

          {/* Tickers */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <Tag size={14} /> Tickers associés
            </h3>
            <p className="text-xs text-slate-500">
              Identifiez les tickers concernés pour que l'article apparaisse dans les sections analyse de chaque action.
            </p>

            <div className="flex gap-2">
              <input
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 font-mono uppercase"
                value={newTicker}
                onChange={e => setNewTicker(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && addTicker()}
                placeholder="Ex: SGBC, ETIT, ORGT..."
                maxLength={8}
              />
              <button onClick={addTicker}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700">
                Ajouter
              </button>
            </div>

            {form.tickers.length > 0 && (
              <div className="space-y-3">
                {form.tickers.map(t => (
                  <div key={t.ticker} className="border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{t.ticker}</span>
                      <button onClick={() => removeTicker(t.ticker)} className="text-red-400 hover:text-red-600 p-1">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {IMPACTS.map(impact => (
                        <button key={impact}
                          onClick={() => updateTicker(t.ticker, 'impact', impact)}
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${t.impact === impact ? impactColor[impact] : 'bg-white text-slate-400 border-slate-200'}`}
                        >
                          {impact}
                        </button>
                      ))}
                    </div>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                      value={t.note}
                      onChange={e => updateTicker(t.ticker, 'note', e.target.value)}
                      placeholder="Note analytique sur ce ticker..."
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Content blocks */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
              <FileText size={14} /> Blocs de contenu
              <span className="ml-auto text-xs text-slate-400 font-normal">{form.blocks.length} bloc(s)</span>
            </h3>

            {form.blocks.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                Aucun bloc. Ajoutez des blocs de contenu ci-dessous.
              </div>
            )}

            <div className="space-y-3">
              {form.blocks.map((block, i) => (
                <BlockRow
                  key={i}
                  block={block}
                  index={i}
                  total={form.blocks.length}
                  onMove={dir => moveBlock(i, dir)}
                  onDelete={() => deleteBlock(i)}
                  onChange={b => updateBlock(i, b)}
                />
              ))}
            </div>

            {/* Add block menu */}
            <div className="relative">
              <button
                onClick={() => setShowAddBlock(s => !s)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 text-sm font-semibold hover:border-teal-500 hover:bg-teal-50 transition-colors"
              >
                <Plus size={16} /> Ajouter un bloc
              </button>
              {showAddBlock && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-2 grid grid-cols-4 gap-1 z-20">
                  {BLOCK_MENU.map(m => (
                    <button key={m.type} onClick={() => addBlock(m.type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-teal-50 text-slate-600 hover:text-teal-700 text-xs font-medium transition-colors">
                      <span className="text-lg">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
