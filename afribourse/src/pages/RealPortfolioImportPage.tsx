// src/pages/RealPortfolioImportPage.tsx
// Import du portefeuille réel : démarrage rapide (une ligne) ou choix du mode
// (snapshot / relevé complet, réversible) → photo/PDF lu par l'IA, fichier +
// mapping de colonnes, ou saisie manuelle → tableau de validation →
// enregistrement (impossible tant qu'une ligne est bloquante).
// Brouillon conservé dans le navigateur ; chaque étape est suivie dans Amplitude.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Camera, ListOrdered, Upload, PencilLine, FileSpreadsheet, ShieldCheck, Loader2, Info, ScanText, History, Sparkles,
} from 'lucide-react';
import ValidationTable from '../components/real-portfolio/ValidationTable';
import QuickStartCard, { type QuickStartValues } from '../components/real-portfolio/QuickStartCard';
import { emptyRow, newRowId, useDraftValidation } from '../components/real-portfolio/draft';
import { clearImportDraft, hasContent, loadImportDraft, saveImportDraft, type ImportDraft } from '../components/real-portfolio/importDraft';
import {
  realPortfolioApi, RealPortfolioApiError,
  type ColumnMapping, type DraftRow, type ImportMode, type ImportSource, type MappedField, type ParsedTable,
} from '../services/realPortfolioApi';
import { useInvalidateRealPortfolio, useRealDashboard } from '../hooks/useRealPortfolio';
import { useAuth } from '../contexts/AuthContext';
import { trackRealPortfolioImport } from '../lib/amplitude';

const today = () => new Date().toISOString().slice(0, 10);
const DEFAULT_NAME = 'Mon portefeuille BRVM';

const FIELD_LABELS: Record<MappedField, string> = {
  ticker: 'Titre (symbole ou nom)',
  date: 'Date',
  side: 'Sens (achat / vente)',
  quantity: 'Quantité',
  price: 'Cours / PRU',
  fees: 'Frais (facultatif)',
  amount: 'Montant (si pas de cours)',
};

function fieldsFor(mode: ImportMode): MappedField[] {
  return mode === 'SNAPSHOT' ? ['ticker', 'quantity', 'price', 'amount'] : ['date', 'side', 'ticker', 'quantity', 'price', 'fees', 'amount'];
}

type Step = 'mode' | 'source' | 'mapping' | 'review';

export default function RealPortfolioImportPage() {
  const navigate = useNavigate();
  const invalidate = useInvalidateRealPortfolio();
  const { data: existing, isLoading: loadingExisting } = useRealDashboard();
  const { userProfile } = useAuth();
  const userId = userProfile?.id;

  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<ImportMode>('SNAPSHOT');
  const [snapshotDate, setSnapshotDate] = useState(today());
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [source, setSource] = useState<ImportSource>('MANUAL');
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [cash, setCash] = useState<string>('');
  const [declared, setDeclared] = useState<string>('');
  const [name, setName] = useState(DEFAULT_NAME);
  const [broker, setBroker] = useState('');
  const [replaceOpenings, setReplaceOpenings] = useState(true);
  const [draftOffer, setDraftOffer] = useState<ImportDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const hasOpenings = existing?.portfolio.importMode === 'SNAPSHOT' && (existing?.transactionsCount ?? 0) > 0;
  const switchingToTransactions = mode === 'TRANSACTIONS' && hasOpenings;

  useEffect(() => {
    if (existing) setCash(String(Math.round(existing.cash.amount)));
  }, [existing]);

  // ─── Suivi de l'entonnoir ────────────────────────────────────────────────
  const committedRef = useRef(false);
  const funnelRef = useRef({ step, rows: 0, source });
  funnelRef.current = { step, rows: rows.length, source };

  useEffect(() => {
    trackRealPortfolioImport('page_viewed');
    // Départ sans enregistrer (navigation interne ou fermeture de l'onglet) : on note l'étape atteinte.
    let sent = false;
    const abandon = () => {
      if (sent || committedRef.current) return;
      sent = true;
      const f = funnelRef.current;
      trackRealPortfolioImport('abandoned', { step: f.step, rows: f.rows, source: f.source });
    };
    window.addEventListener('pagehide', abandon);
    return () => { window.removeEventListener('pagehide', abandon); abandon(); };
  }, []);

  useEffect(() => {
    if (step === 'review') trackRealPortfolioImport('review_shown', { rows: rows.length, source, mode });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Brouillon ───────────────────────────────────────────────────────────
  useEffect(() => {
    setDraftOffer(loadImportDraft(userId));
  }, [userId]);

  useEffect(() => {
    if (step !== 'review' || !hasContent(rows)) return;
    saveImportDraft(userId, { mode, snapshotDate, source, fileName, rows, cash, declared, name, broker });
  }, [userId, step, mode, snapshotDate, source, fileName, rows, cash, declared, name, broker]);

  const restoreDraft = (d: ImportDraft) => {
    setMode(d.mode);
    setSnapshotDate(d.snapshotDate);
    setSource(d.source);
    setFileName(d.fileName);
    setRows(d.rows);
    setCash(d.cash);
    setDeclared(d.declared);
    setName(d.name || DEFAULT_NAME);
    setBroker(d.broker);
    setTable(null);
    setDraftOffer(null);
    setStep('review');
    trackRealPortfolioImport('draft_restored', { rows: d.rows.length, source: d.source });
  };
  const discardDraft = () => {
    clearImportDraft(userId);
    setDraftOffer(null);
    trackRealPortfolioImport('draft_discarded');
  };

  // ─── Validation ──────────────────────────────────────────────────────────
  const parsedCash = cash.trim() === '' ? null : Number(cash.replace(/\s/g, ''));
  const parsedDeclared = declared.trim() === '' ? null : Number(declared.replace(/\s/g, ''));
  const validationOpts = useMemo(() => ({
    mode,
    cash: parsedCash,
    declaredCapital: parsedDeclared,
    replaceOpenings: switchingToTransactions && replaceOpenings,
  }), [mode, parsedCash, parsedDeclared, switchingToTransactions, replaceOpenings]);
  const { report, validating, canCommit, setReport, error } = useDraftValidation(rows, validationOpts, step === 'review');

  // Changer de mode reste possible à toute étape.
  const changeMode = (m: ImportMode) => {
    setMode(m);
    trackRealPortfolioImport('mode_selected', { mode: m });
    if (table) {
      setStep('mapping');
    } else if (rows.length) {
      setRows(rows.map(r => ({ ...r, side: m === 'SNAPSHOT' ? 'OPENING' : r.side === 'OPENING' ? 'BUY' : r.side, date: m === 'SNAPSHOT' ? snapshotDate : r.date })));
    }
  };

  const startManual = () => {
    trackRealPortfolioImport('source_selected', { source: 'MANUAL', mode });
    setTable(null);
    setSource('MANUAL');
    setFileName(null);
    setRows([emptyRow(mode, mode === 'SNAPSHOT' ? snapshotDate : today()), emptyRow(mode, mode === 'SNAPSHOT' ? snapshotDate : today())]);
    setStep('review');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    trackRealPortfolioImport('source_selected', { source: 'FILE', mode });
    setBusy(true);
    try {
      const t = await realPortfolioApi.parseFile(file);
      setTable(t);
      setSource(t.source);
      setFileName(t.fileName);
      setMapping(t.suggestedMapping);
      trackRealPortfolioImport('file_parsed', { rows: t.rows.length, source: t.source, suggestedMode: t.suggestedMode });
      if (t.suggestedMode !== mode) toast(`Ce fichier ressemble à ${t.suggestedMode === 'SNAPSHOT' ? 'un snapshot de positions' : 'un relevé de transactions'} : vous pouvez changer de mode en haut.`, { icon: 'ℹ️' });
      setStep('mapping');
    } catch (e) {
      trackRealPortfolioImport('file_failed', { message: (e as Error).message?.slice(0, 120) });
      toast.error((e as Error).message || 'Fichier illisible.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Photo / capture / PDF : l'IA transcrit le tableau, colonnes déjà reconnues → directement à la vérification.
  const onDocument = async (file: File | undefined) => {
    if (!file) return;
    trackRealPortfolioImport('source_selected', { source: 'DOCUMENT', mode, fileType: file.type });
    setReading(true);
    try {
      const t = await realPortfolioApi.extractDocument(file);
      const docMode = t.suggestedMode;
      const docDate = docMode === 'SNAPSHOT' && t.detectedDate && t.detectedDate <= today() ? t.detectedDate : snapshotDate;
      if (docMode !== mode) {
        setMode(docMode);
        toast(`Document lu comme ${docMode === 'SNAPSHOT' ? 'un relevé de positions' : 'un relevé de transactions'}.`, { icon: 'ℹ️' });
      }
      setSnapshotDate(docDate);
      if (t.detectedCash != null && !existing) setCash(String(Math.round(t.detectedCash)));
      setTable(t);
      setSource('DOCUMENT');
      setFileName(t.fileName);
      setMapping(t.suggestedMapping);
      const res = await realPortfolioApi.mapRows({ rows: t.rows, mapping: t.suggestedMapping, mode: docMode, snapshotDate: docDate });
      setRows(res.rows);
      setReport(res.report);
      trackRealPortfolioImport('document_extracted', { rows: t.rows.length, mode: docMode, cashDetected: t.detectedCash != null, blocking: res.report.summary.blocking });
      setStep('review');
    } catch (e) {
      trackRealPortfolioImport('document_failed', { status: e instanceof RealPortfolioApiError ? e.status : null });
      toast.error((e as Error).message || 'Document illisible.');
    } finally {
      setReading(false);
      if (docRef.current) docRef.current.value = '';
    }
  };

  const applyMapping = async () => {
    if (!table) return;
    setBusy(true);
    try {
      const res = await realPortfolioApi.mapRows({ rows: table.rows, mapping, mode, snapshotDate });
      setRows(res.rows);
      setReport(res.report);
      trackRealPortfolioImport('mapping_applied', { rows: res.rows.length, blocking: res.report.summary.blocking });
      setStep('review');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const finish = async (count: number) => {
    committedRef.current = true;
    clearImportDraft(userId);
    await invalidate();
    toast.success(`${count} ligne(s) enregistrée(s).`);
    navigate('/portefeuille-reel');
  };

  const commit = async () => {
    if (!canCommit) return;
    trackRealPortfolioImport('commit_clicked', { rows: rows.length, source, mode });
    setBusy(true);
    try {
      await realPortfolioApi.commit({
        rows, mode, source, fileName,
        cash: parsedCash, declaredCapital: parsedDeclared,
        replaceOpenings: switchingToTransactions && replaceOpenings,
        name: existing ? undefined : name, broker: existing ? undefined : broker || null,
      });
      trackRealPortfolioImport('commit_succeeded', { rows: rows.length, source, mode, firstPortfolio: !existing });
      await finish(rows.length);
    } catch (e) {
      if (e instanceof RealPortfolioApiError && e.report) {
        setReport(e.report);
        trackRealPortfolioImport('commit_blocked', { blocking: e.report.summary.blocking });
        toast.error('Des lignes bloquantes subsistent.');
      } else {
        trackRealPortfolioImport('commit_failed', { status: e instanceof RealPortfolioApiError ? e.status : null });
        toast.error((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  };

  // Démarrage rapide : une ligne de snapshot datée du jour. Enregistrée d'office si
  // le moteur la valide, sinon on passe au tableau pour corriger.
  const quickStart = async ({ ticker, quantity, price }: QuickStartValues) => {
    trackRealPortfolioImport('quick_start_submitted');
    const row: DraftRow = { rowId: newRowId(), ticker, side: 'OPENING', date: today(), quantity, price, fees: null };
    setBusy(true);
    try {
      const rep = await realPortfolioApi.validate({ rows: [row], mode: 'SNAPSHOT' });
      if (rep.canCommit) {
        await realPortfolioApi.commit({ rows: [row], mode: 'SNAPSHOT', source: 'MANUAL', name: DEFAULT_NAME });
        trackRealPortfolioImport('commit_succeeded', { rows: 1, source: 'MANUAL', mode: 'SNAPSHOT', firstPortfolio: true, quickStart: true });
        await finish(1);
        return;
      }
      setMode('SNAPSHOT');
      setSnapshotDate(today());
      setSource('MANUAL');
      setTable(null);
      setRows([row]);
      setReport(rep);
      setStep('review');
      toast('Vérifiez la ligne signalée avant d’enregistrer.', { icon: '⚠️' });
    } catch (e) {
      trackRealPortfolioImport('commit_failed', { status: e instanceof RealPortfolioApiError ? e.status : null, quickStart: true });
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const mappingReady = !!mapping.ticker && !!mapping.quantity && (!!mapping.price || !!mapping.amount) && (mode === 'SNAPSHOT' || !!mapping.date);
  const showQuickStart = step === 'mode' && !existing && !loadingExisting;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6">
        <button onClick={() => navigate(existing ? '/portefeuille-reel' : '/dashboard')} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>

        <header>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{existing ? 'Importer des lignes' : 'Importer mon portefeuille réel'}</h1>
          <p className="mt-1 text-gray-600">
            Chaque ligne est contrôlée contre l'historique BRVM (cotation à la date, fourchette du jour, splits). Rien n'est enregistré tant qu'une ligne ⛔ subsiste.
          </p>
        </header>

        {draftOffer && step !== 'review' && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <History className="w-5 h-5 text-indigo-600 shrink-0" />
            <p className="flex-1 text-sm text-indigo-900">
              Vous avez un import en cours : <strong>{draftOffer.rows.length} ligne(s)</strong>, enregistré le {new Date(draftOffer.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.
            </p>
            <div className="flex gap-2">
              <button onClick={discardDraft} className="px-3 py-1.5 rounded-lg text-sm text-indigo-700 hover:bg-indigo-100">Effacer</button>
              <button onClick={() => restoreDraft(draftOffer)} className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Reprendre</button>
            </div>
          </div>
        )}

        {showQuickStart && (
          <>
            <QuickStartCard busy={busy} onSubmit={quickStart} />
            <p className="text-sm font-medium text-gray-500 text-center">— ou importez tout votre portefeuille —</p>
          </>
        )}

        {/* Choix du mode — deux cartes, réversible */}
        <section className="grid sm:grid-cols-2 gap-3">
          {([
            { m: 'SNAPSHOT' as const, icon: Camera, title: 'Snapshot', text: 'Mes lignes actuelles : titre, quantité, PRU. Rapide, idéal pour démarrer.' },
            { m: 'TRANSACTIONS' as const, icon: ListOrdered, title: 'Relevé complet', text: 'Mes transactions datées : date, sens, quantité, cours. Historique et performance exacts.' },
          ]).map(({ m, icon: Icon, title, text }) => (
            <button
              key={m}
              onClick={() => { changeMode(m); if (step === 'mode') setStep('source'); }}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${mode === m && step !== 'mode' ? 'border-indigo-600 bg-indigo-50/60 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`p-2 rounded-xl ${mode === m && step !== 'mode' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}><Icon className="w-5 h-5" /></span>
                <span className="text-lg font-semibold text-gray-900">{title}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{text}</p>
            </button>
          ))}
        </section>
        {step !== 'mode' && (
          <p className="text-xs text-gray-500 -mt-3">
            Vous pourrez passer du snapshot au relevé complet plus tard sans tout réimporter : chaque ligne de snapshot devient une transaction d'ouverture datée.
          </p>
        )}

        {switchingToTransactions && step !== 'mode' && (
          <label className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 p-3 text-sm text-blue-900">
            <input type="checkbox" checked={replaceOpenings} onChange={e => setReplaceOpenings(e.target.checked)} className="mt-0.5" />
            <span>Remplacer mes lignes d'ouverture (snapshot) par ce relevé. Décochez pour seulement compléter l'historique.</span>
          </label>
        )}

        {/* Source */}
        {step === 'source' && (
          <section className="grid sm:grid-cols-3 gap-3">
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); onDocument(e.dataTransfer.files?.[0]); }}
              className="relative sm:col-span-3 lg:col-span-1 rounded-2xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-white p-6 text-center"
            >
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wide">
                <Sparkles className="w-3 h-3" /> Le plus simple
              </span>
              <ScanText className="w-8 h-8 mx-auto text-indigo-600" />
              <p className="mt-2 font-semibold text-gray-900">Photo, capture ou PDF</p>
              <p className="text-sm text-gray-600">Votre relevé SGI ou une capture de votre appli : le tableau est lu automatiquement, puis vérifié ligne par ligne.</p>
              <input ref={docRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf" className="hidden" onChange={e => onDocument(e.target.files?.[0])} />
              <button disabled={reading} onClick={() => docRef.current?.click()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60">
                {reading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {reading ? 'Lecture en cours…' : 'Choisir une image ou un PDF'}
              </button>
              <p className="mt-3 text-[11px] text-gray-500">Lecture par une IA (Google Gemini). AfriBourse ne conserve pas le document. 10 Mo max.</p>
            </div>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
              className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-6 text-center"
            >
              <FileSpreadsheet className="w-8 h-8 mx-auto text-indigo-600" />
              <p className="mt-2 font-semibold text-gray-900">Fichier CSV ou Excel</p>
              <p className="text-sm text-gray-600">Export de votre SGI ou tableur personnel (2 Mo max). Colonnes reconnues automatiquement.</p>
              <input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls,.ods" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
              <button disabled={busy} onClick={() => fileRef.current?.click()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Choisir un fichier
              </button>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <PencilLine className="w-8 h-8 mx-auto text-indigo-600" />
              <p className="mt-2 font-semibold text-gray-900">Saisie manuelle</p>
              <p className="text-sm text-gray-600">Quelques lignes ? Saisissez-les directement, la vérification se fait au fil de la frappe.</p>
              <button onClick={startManual} className="mt-4 px-4 py-2 rounded-lg border border-gray-300 font-medium text-gray-800 hover:bg-gray-50">Saisir mes lignes</button>
            </div>
            {mode === 'SNAPSHOT' && (
              <label className="sm:col-span-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                Positions arrêtées au
                <input type="date" value={snapshotDate} max={today()} onChange={e => setSnapshotDate(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1" />
                <span className="text-gray-500">(date de votre relevé de positions)</span>
              </label>
            )}
          </section>
        )}

        {/* Mapping de colonnes */}
        {step === 'mapping' && table && (
          <section className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Correspondance des colonnes — {table.fileName}</h2>
              <span className="text-sm text-gray-500">{table.rows.length} lignes détectées</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {fieldsFor(mode).map(f => (
                <label key={f} className="text-sm">
                  <span className="block text-gray-700 mb-1">{FIELD_LABELS[f]}{['ticker', 'quantity'].includes(f) || (f === 'date' && mode === 'TRANSACTIONS') ? ' *' : ''}</span>
                  <select
                    value={mapping[f] ?? ''}
                    onChange={e => setMapping({ ...mapping, [f]: e.target.value || undefined })}
                    className="w-full rounded-md border border-gray-200 px-2 py-1.5 bg-white"
                  >
                    <option value="">— Aucune —</option>
                    {table.headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              ))}
              {mode === 'SNAPSHOT' && (
                <label className="text-sm">
                  <span className="block text-gray-700 mb-1">Positions arrêtées au</span>
                  <input type="date" value={snapshotDate} max={today()} onChange={e => setSnapshotDate(e.target.value)} className="w-full rounded-md border border-gray-200 px-2 py-1.5" />
                </label>
              )}
            </div>
            {mode === 'TRANSACTIONS' && !mapping.side && (
              <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">Sans colonne « sens », toutes les lignes seront lues comme des achats (modifiable ensuite).</p>
            )}
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50"><tr>{table.headers.map(h => <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {table.rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-gray-100">{table.headers.map(h => <td key={h} className="px-2 py-1 whitespace-nowrap text-gray-700">{String(r[h] ?? '')}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={() => { setTable(null); setStep('source'); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700">Autre fichier</button>
              <button disabled={!mappingReady || busy} onClick={applyMapping} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} Vérifier les lignes
              </button>
            </div>
          </section>
        )}

        {/* Validation */}
        {step === 'review' && (
          <section className="space-y-4">
            {source === 'DOCUMENT' && (
              <p className="flex items-start gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-sm text-indigo-900">
                <ScanText className="w-4 h-4 mt-0.5 shrink-0" />
                Lignes lues dans {fileName ?? 'votre document'}. Comparez-les avec votre relevé : l'IA peut se tromper sur un chiffre.
              </p>
            )}
            <div className="rounded-2xl bg-white border border-gray-200 p-4 md:p-5">
              <ValidationTable
                rows={rows}
                onChange={setRows}
                report={report}
                validating={validating}
                mode={mode}
                defaultDate={mode === 'SNAPSHOT' ? snapshotDate : today()}
              />
              {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            </div>

            <div className="rounded-2xl bg-white border border-gray-200 p-4 md:p-5 grid sm:grid-cols-2 gap-3">
              {!existing && (
                <>
                  <label className="text-sm">
                    <span className="block text-gray-700 mb-1">Nom du portefeuille</span>
                    <input value={name} maxLength={80} onChange={e => setName(e.target.value)} className="w-full rounded-md border border-gray-200 px-2 py-1.5" />
                  </label>
                  <label className="text-sm">
                    <span className="block text-gray-700 mb-1">SGI (facultatif)</span>
                    <input value={broker} maxLength={80} onChange={e => setBroker(e.target.value)} placeholder="ex. votre société de gestion et d'intermédiation" className="w-full rounded-md border border-gray-200 px-2 py-1.5" />
                  </label>
                </>
              )}
              <label className="text-sm">
                <span className="block text-gray-700 mb-1">Liquidité disponible sur le compte (F CFA)</span>
                <input inputMode="numeric" value={cash} onChange={e => setCash(e.target.value)} placeholder="0" className="w-full rounded-md border border-gray-200 px-2 py-1.5" />
              </label>
              <label className="text-sm">
                <span className="block text-gray-700 mb-1">Valeur totale indiquée par votre SGI (facultatif)</span>
                <input inputMode="numeric" value={declared} onChange={e => setDeclared(e.target.value)} placeholder="Contrôle Σ lignes + liquidité" className="w-full rounded-md border border-gray-200 px-2 py-1.5" />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-start gap-2 text-xs text-gray-500 max-w-xl">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                Vos données restent privées : elles ne sont visibles que par vous, n'apparaissent dans aucun classement et ne génèrent pas d'XP.
                Votre saisie est gardée sur cet appareil si vous quittez la page.
              </p>
              <button
                disabled={!canCommit || busy}
                onClick={commit}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title={!canCommit ? 'Corrigez les lignes ⛔ pour enregistrer' : undefined}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Enregistrer {rows.length} ligne(s)
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
