// src/components/real-portfolio/discovery/RealPortfolioGuide.tsx
// Guide de découverte du portefeuille réel (4 étapes). Ton factuel : on
// présente l'outil de suivi, jamais d'incitation à investir (CREPMG).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  X, ArrowRight, ArrowLeft, Wallet, GraduationCap, Camera, ListOrdered, FileSpreadsheet, PencilLine,
  CheckCircle2, AlertTriangle, XOctagon, Lock, PieChart, Upload,
} from 'lucide-react';
import { GUIDE_ROOT_ATTR } from './constants';


interface Step {
  kicker: string;
  title: string;
  text: string;
  visual: ReactNode;
}

const ACCENT = '#00D4A8';

function Tile({ icon, title, lines, highlight }: { icon: ReactNode; title: string; lines: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 text-left ${highlight ? 'border-emerald-300 bg-emerald-50/70' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">{icon}{title}</div>
      <ul className="mt-1.5 space-y-0.5 text-xs text-gray-600">
        {lines.map(l => <li key={l}>· {l}</li>)}
      </ul>
    </div>
  );
}

const STEPS: Step[] = [
  {
    kicker: 'Nouveau',
    title: 'Suivez votre vrai portefeuille BRVM',
    text: "En plus du simulateur, vous pouvez désormais suivre les actions que vous détenez réellement via votre SGI. Les deux espaces sont séparés : votre simulation ne change pas.",
    visual: (
      <div className="grid grid-cols-2 gap-2">
        <Tile icon={<GraduationCap className="w-4 h-4 text-blue-600" />} title="Simulateur" lines={["S'entraîner sans risque", 'XP, défis, classement']} />
        <Tile icon={<Wallet className="w-4 h-4 text-emerald-600" />} title="Portefeuille réel" lines={['Vos vraies lignes', 'Privé, hors classement']} highlight />
      </div>
    ),
  },
  {
    kicker: 'Étape 1 · Importer',
    title: 'Deux façons de démarrer',
    text: "Le snapshot suffit pour commencer ; vous pourrez ajouter votre relevé de transactions plus tard, sans tout ressaisir.",
    visual: (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Tile icon={<Camera className="w-4 h-4 text-indigo-600" />} title="Snapshot" lines={['Titre, quantité, PRU', 'Prêt en 2 minutes']} />
          <Tile icon={<ListOrdered className="w-4 h-4 text-indigo-600" />} title="Relevé complet" lines={['Achats et ventes datés', 'Historique exact']} />
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5" /> CSV / Excel de votre SGI</span>
          <span className="inline-flex items-center gap-1"><PencilLine className="w-3.5 h-3.5" /> ou saisie manuelle</span>
        </div>
      </div>
    ),
  },
  {
    kicker: 'Étape 2 · Vérifier',
    title: 'Chaque ligne est contrôlée',
    text: "Titre coté à la date indiquée, cours plausible ce jour-là, splits détectés avec correction en un clic. Rien n'est enregistré tant qu'une ligne bloquante subsiste.",
    visual: (
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 text-xs text-left">
        <p className="px-3 py-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span><b>SNTS</b> · 10 titres · cours dans la fourchette du jour</span></p>
        <p className="px-3 py-2 flex items-center gap-2 bg-amber-50/60"><AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /><span><b>Ligne ajustée</b> · cours saisi après un split → <span className="text-indigo-700 font-medium">Ajuster</span></span></p>
        <p className="px-3 py-2 flex items-center gap-2 bg-red-50/60"><XOctagon className="w-4 h-4 text-red-600 shrink-0" /><span><b>ORAC</b> en 2020 · titre pas encore coté à cette date</span></p>
        <p className="px-3 py-1.5 text-[11px] text-gray-400">Exemple illustratif</p>
      </div>
    ),
  },
  {
    kicker: 'Étape 3 · Suivre',
    title: 'Performance et exposition, au dernier cours',
    text: "Valorisation au dernier cours BRVM, plus-value latente et réalisée, allocation par titre et par secteur, reporting SIMBA.",
    visual: (
      <div className="space-y-2">
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-indigo-800 text-white p-3 text-left">
          <p className="text-[11px] text-indigo-200">Valeur totale</p>
          <div className="mt-1.5 flex h-2 rounded-full overflow-hidden">
            <span className="bg-indigo-400" style={{ width: '42%' }} />
            <span className="bg-emerald-400" style={{ width: '26%' }} />
            <span className="bg-amber-400" style={{ width: '18%' }} />
            <span className="bg-slate-400" style={{ width: '14%' }} />
          </div>
          <p className="mt-1.5 text-[11px] text-indigo-200 flex items-center gap-1"><PieChart className="w-3 h-3" /> Allocation par secteur</p>
        </div>
        <p className="flex items-start gap-2 text-xs text-gray-600 text-left">
          <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-500" />
          Données visibles par vous seul, aucun classement, aucune XP. AfriBourse fournit un reporting factuel, sans recommandation d'achat ou de vente.
        </p>
      </div>
    ),
  },
];

interface Props {
  open: boolean;
  onStep?: (step: number) => void;
  /** CTA final : ouvrir l'import. */
  onImport: () => void;
  /** Fermeture (croix, Échap, fond, « Plus tard »). */
  onClose: (reason: 'later' | 'closed') => void;
}

export default function RealPortfolioGuide({ open, onStep, onImport, onClose }: Props) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const last = step === STEPS.length - 1;
  const s = STEPS[step];

  useEffect(() => { if (open) setStep(0); }, [open]);
  useEffect(() => { if (open) onStep?.(step); }, [open, step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current('closed');
      if (e.key === 'ArrowRight') setStep(v => Math.min(v + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep(v => Math.max(v - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      {...{ [GUIDE_ROOT_ATTR]: '' }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(10,22,40,0.65)', animation: 'rp-guide-fade 0.25s ease-out' }}
      onClick={() => onClose('closed')}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rp-guide-title"
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden outline-none max-h-[92vh] overflow-y-auto"
        style={{ animation: 'rp-guide-rise 0.25s ease-out' }}
      >
        {/* En-tête */}
        <div className="relative px-6 pt-6 pb-5 text-center" style={{ background: 'linear-gradient(135deg, #0A1628 0%, #1a3a5c 100%)' }}>
          <button onClick={() => onClose('closed')} className="absolute top-3 right-3 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full" aria-label="Fermer le guide">
            <X className="w-4 h-4" />
          </button>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: 'rgba(0,212,168,0.15)', color: ACCENT, border: '1px solid rgba(0,212,168,0.4)' }}
          >
            {s.kicker}
          </span>
          <h2 id="rp-guide-title" className="mt-3 text-xl font-bold text-white">{s.title}</h2>
        </div>

        {/* Contenu */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-sm text-gray-600 text-center">{s.text}</p>
          <div className="mt-4">{s.visual}</div>
          {last && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              Accessible à tout moment depuis le menu de votre compte → <b>Portefeuille réel</b>.
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6">
          <div className="flex justify-center gap-1.5 mb-4" aria-label={`Étape ${step + 1} sur ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Aller à l'étape ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{ width: i === step ? 22 : 8, backgroundColor: i === step ? ACCENT : '#e5e7eb' }}
              />
            ))}
          </div>

          {last ? (
            <div className="space-y-2">
              <button
                onClick={onImport}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white"
                style={{ backgroundColor: '#0A1628' }}
              >
                <Upload className="w-4 h-4" /> Importer mon portefeuille
              </button>
              <button onClick={() => onClose('later')} className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Plus tard
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50" aria-label="Étape précédente">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => onClose('later')} className="px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Passer
                </button>
              )}
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white"
                style={{ backgroundColor: '#0A1628' }}
              >
                Suivant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes rp-guide-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes rp-guide-rise { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { [${GUIDE_ROOT_ATTR}], [${GUIDE_ROOT_ATTR}] * { animation: none !important } }
      `}</style>
    </div>,
    document.body,
  );
}
