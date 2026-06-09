import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, Eye, EyeOff, Save, X, FileText, Tag, Star,
  AlertCircle, Check, Code2, ImagePlus, Trash2,
} from 'lucide-react';
import { ImpactType, TickerImpact } from '../data/brvm2026News';
import { authFetch } from '../config/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ArticleForm {
  title: string;
  summary: string;
  category: string;
  author: string;
  source: string;
  is_featured: boolean;
  image_url: string;
  tickers: TickerImpact[];
  html_content: string;
}

const EMPTY_FORM: ArticleForm = {
  title: '',
  summary: '',
  category: 'analyse',
  author: 'AfriBourse',
  source: 'AfriBourse Research',
  is_featured: false,
  image_url: '',
  tickers: [],
  html_content: '',
};

// Catégories alignées sur les onglets de la page news
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'analyse',    label: 'Analyse' },
  { value: 'marches',   label: 'Marchés' },
  { value: 'economie',  label: 'Économie' },
  { value: 'dividendes', label: 'Dividendes' },
  { value: 'resultats', label: 'Résultats' },
  { value: 'interview', label: 'Interview' },
];

const IMPACTS: ImpactType[] = ['Positif', 'Négatif', 'Neutre', 'Mixte'];

const IMPACT_COLORS: Record<ImpactType, string> = {
  Positif: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Négatif: 'bg-red-100 text-red-800 border-red-300',
  Neutre:  'bg-slate-100 text-slate-600 border-slate-300',
  Mixte:   'bg-amber-100 text-amber-800 border-amber-300',
};

interface Props {
  articleId?: string;
  initialData?: any;
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}

export default function AdminArticleEditor({ articleId, initialData, onSaved, onCancel }: Props) {
  // Normalise la catégorie des anciens articles vers les nouveaux slugs
  function normalizeCategory(cat: string | null | undefined): string {
    if (!cat) return 'analyse';
    const map: Record<string, string> = {
      'analyse fondamentale': 'analyse', 'fondamentale': 'analyse',
      'secteur': 'analyse', 'stratégie': 'analyse', 'strategie': 'analyse',
      'marché': 'marches', 'marche': 'marches', 'marchés': 'marches',
      'macro': 'economie', 'macroéconomie': 'economie',
      'actualités': 'analyse', 'actualites': 'analyse',
    };
    return map[cat.toLowerCase()] ?? cat;
  }

  const [form, setForm] = useState<ArticleForm>({
    ...EMPTY_FORM,
    ...(initialData ? {
      title:        initialData.title ?? '',
      summary:      initialData.summary ?? '',
      category:     normalizeCategory(initialData.category),
      author:       initialData.author ?? 'AfriBourse',
      source:       initialData.source ?? 'AfriBourse Research',
      is_featured:  initialData.is_featured ?? false,
      image_url:    initialData.image_url ?? '',
      tickers:      (initialData.tickers ?? []).map((t: string | TickerImpact) =>
        typeof t === 'string' ? { ticker: t, impact: 'Neutre' as ImpactType, note: '' } : t
      ),
      html_content: initialData.content ?? '',
    } : {}),
  });

  const [newTicker, setNewTicker]     = useState('');
  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [savedOk, setSavedOk]         = useState(false);
  const [preview, setPreview]         = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgDragOver, setImgDragOver] = useState(false);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const imageInputRef  = useRef<HTMLInputElement>(null);

  const update = useCallback(<K extends keyof ArticleForm>(key: K, val: ArticleForm[K]) => {
    setForm(f => ({ ...f, [key]: val }));
    setSavedOk(false);
  }, []);

  // ── Upload image de couverture ────────────────────────────────────────────

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSaveError('Fichier non supporté. Utilisez une image (JPG, PNG, WebP).');
      return;
    }
    setImgUploading(true);
    setSaveError(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await authFetch(`${API}/admin/articles/upload-cover`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const { url } = await res.json();
      update('image_url', url);
    } catch (err: any) {
      setSaveError('Erreur upload image : ' + (err.message ?? 'inconnue'));
    } finally {
      setImgUploading(false);
    }
  };

  const handleImageFile = (file: File | undefined) => { if (file) uploadCover(file); };

  // ── File HTML drag-drop ───────────────────────────────────────────────────

  const readHtmlFile = (file: File) => {
    if (!file.name.match(/\.(html|htm|txt)$/i) && file.type !== 'text/html' && file.type !== 'text/plain') {
      setSaveError('Fichier non supporté. Utilisez un fichier .html ou .htm');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      update('html_content', e.target?.result as string);
      setSaveError(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleHtmlDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    readHtmlFile(e.dataTransfer.files?.[0]);
  };

  // ── Tickers ───────────────────────────────────────────────────────────────

  const addTicker = () => {
    const t = newTicker.trim().toUpperCase();
    if (!t || form.tickers.some(x => x.ticker === t)) return;
    update('tickers', [...form.tickers, { ticker: t, impact: 'Neutre', note: '' }]);
    setNewTicker('');
  };

  const removeTicker = (ticker: string) =>
    update('tickers', form.tickers.filter(t => t.ticker !== ticker));

  const updateTicker = (ticker: string, field: 'impact' | 'note', val: string) =>
    update('tickers', form.tickers.map(t =>
      t.ticker === ticker ? { ...t, [field]: val } : t
    ));

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!form.title.trim()) { setSaveError('Le titre est requis.'); return; }
    setSaving(true);
    setSaveError(null);

    const payload = {
      title:        form.title,
      summary:      form.summary,
      category:     form.category,
      author:       form.author,
      source:       form.source,
      is_featured:  form.is_featured,
      image_url:    form.image_url,
      tickers:      form.tickers,
      content:      form.html_content,
      rich_content: null,
    };

    try {
      const url    = articleId ? `${API}/admin/articles/${articleId}` : `${API}/admin/articles`;
      const method = articleId ? 'PUT' : 'POST';
      const res    = await authFetch(url, {
        method,
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Erreur ${res.status}`);
      }
      const saved = await res.json();
      setSavedOk(true);
      onSaved?.(saved.id);
    } catch (err: any) {
      setSaveError(err.message ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-teal-600" />
          <h2 className="font-bold text-slate-900 text-lg">
            {articleId ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {form.html_content && (
            <button
              onClick={() => setPreview(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                preview
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {preview ? <EyeOff size={14} /> : <Eye size={14} />}
              {preview ? 'Éditer' : 'Aperçu'}
            </button>
          )}
          {onCancel && (
            <button onClick={onCancel}
              className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 border border-slate-200">
              Annuler
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold hover:bg-teal-700 disabled:opacity-60 transition-colors"
          >
            {saving
              ? <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full inline-block" />
              : savedOk ? <Check size={14} /> : <Save size={14} />}
            {saving ? 'Sauvegarde...' : savedOk ? 'Sauvegardé !' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {saveError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── Métadonnées ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <FileText size={13} /> Informations
          </h3>

          {/* Titre */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Titre *</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="Titre de l'article..."
            />
          </div>

          {/* Résumé */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-600">Résumé <span className="text-slate-400 font-normal">(teaser des cards)</span></label>
              <span className={`text-[11px] font-medium ${
                form.summary.length > 200 ? 'text-red-500'
                : form.summary.length > 160 ? 'text-amber-500'
                : 'text-slate-400'
              }`}>
                {form.summary.length}/160
              </span>
            </div>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[60px]"
              value={form.summary}
              onChange={e => update('summary', e.target.value)}
              placeholder="Accroche courte (120-160 caractères) avec un chiffre fort — affichée sur les cards."
            />
            <p className="text-[10px] text-slate-400 mt-1">Idéal : 120-160 caractères, une accroche + un chiffre clé. Au-delà de 160, le texte est tronqué sur les cards.</p>
          </div>

          {/* Catégorie + Auteur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Catégorie</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={form.category}
                onChange={e => update('category', e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Auteur</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={form.author}
                onChange={e => update('author', e.target.value)}
              />
            </div>
          </div>

          {/* Source + À la une */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-600 block mb-1">Source</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                value={form.source}
                onChange={e => update('source', e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <div
                onClick={() => update('is_featured', !form.is_featured)}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.is_featured ? 'bg-teal-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_featured ? 'translate-x-5' : ''}`} />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-slate-700 whitespace-nowrap">
                <Star size={13} className={form.is_featured ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                À la une
              </span>
            </label>
          </div>
        </section>

        {/* ── Image de couverture ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <ImagePlus size={13} /> Image de couverture
          </h3>

          {form.image_url ? (
            /* Prévisualisation */
            <div className="relative rounded-xl overflow-hidden bg-slate-100 h-44">
              <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-1.5 bg-white text-slate-800 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-100"
                >
                  <Upload size={13} /> Changer
                </button>
                <button
                  onClick={() => update('image_url', '')}
                  className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-600"
                >
                  <Trash2 size={13} /> Supprimer
                </button>
              </div>
            </div>
          ) : (
            /* Zone d'upload */
            <div
              onDragOver={e => { e.preventDefault(); setImgDragOver(true); }}
              onDragLeave={() => setImgDragOver(false)}
              onDrop={e => { e.preventDefault(); setImgDragOver(false); handleImageFile(e.dataTransfer.files?.[0]); }}
              onClick={() => imageInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 px-4 cursor-pointer transition-colors ${
                imgDragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
              }`}
            >
              {imgUploading ? (
                <span className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
              ) : (
                <>
                  <ImagePlus size={28} className={imgDragOver ? 'text-teal-500' : 'text-slate-300'} />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">
                      Glisser une image <span className="text-teal-600">JPG / PNG / WebP</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">ou cliquer pour sélectionner</p>
                  </div>
                </>
              )}
            </div>
          )}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={e => handleImageFile(e.target.files?.[0])}
          />
        </section>

        {/* ── Tickers ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Tag size={13} /> Tickers associés
          </h3>
          <p className="text-xs text-slate-400">
            L'article apparaîtra dans la section analyse de chaque ticker ajouté.
          </p>

          <div className="flex gap-2">
            <input
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={newTicker}
              onChange={e => setNewTicker(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && addTicker()}
              placeholder="Ex: SGBC, ORGT..."
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
                    <button onClick={() => removeTicker(t.ticker)} className="text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {IMPACTS.map(impact => (
                      <button key={impact}
                        onClick={() => updateTicker(t.ticker, 'impact', impact)}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                          t.impact === impact ? IMPACT_COLORS[impact] : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {impact}
                      </button>
                    ))}
                  </div>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400"
                    value={t.note}
                    onChange={e => updateTicker(t.ticker, 'note', e.target.value)}
                    placeholder="Note analytique (optionnel)..."
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Contenu HTML ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <Code2 size={13} /> Contenu HTML
          </h3>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleHtmlDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-8 px-4 cursor-pointer transition-colors ${
              dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
            }`}
          >
            <Upload size={28} className={dragOver ? 'text-teal-500' : 'text-slate-300'} />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">
                Glisser un fichier <span className="text-teal-600">.html</span> ici
              </p>
              <p className="text-xs text-slate-400 mt-0.5">ou cliquer pour sélectionner</p>
            </div>
            {form.html_content && (
              <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-medium">
                {(form.html_content.length / 1024).toFixed(1)} Ko chargés
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,.txt"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) readHtmlFile(f); e.target.value = ''; }}
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">ou coller directement</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <textarea
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[200px] bg-slate-50"
            value={form.html_content}
            onChange={e => update('html_content', e.target.value)}
            placeholder="<h1>Titre</h1>&#10;<p>Contenu HTML...</p>"
            spellCheck={false}
          />

          {form.html_content && (
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{form.html_content.split(/\s+/).length.toLocaleString()} mots environ</span>
              <button onClick={() => update('html_content', '')} className="text-red-400 hover:text-red-600 font-medium">
                Effacer le contenu
              </button>
            </div>
          )}
        </section>

        {/* ── Aperçu ── */}
        {preview && form.html_content && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
              <Eye size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Aperçu du rendu</span>
            </div>
            <div className="px-8 py-6 max-w-2xl mx-auto">
              <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">{form.title || 'Titre'}</h1>
              {form.summary && <p className="text-slate-500 mb-6 text-sm leading-relaxed">{form.summary}</p>}
              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: form.html_content }} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
