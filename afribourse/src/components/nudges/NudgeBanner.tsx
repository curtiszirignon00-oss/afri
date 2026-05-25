// src/components/nudges/NudgeBanner.tsx
// Composant d'affichage des nudges contextuels — 4 variantes : banner, toast, tooltip, modal

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Star, Bell, BarChart2, BellPlus, SlidersHorizontal, LayoutGrid, Lock, X,
} from 'lucide-react';
import { useNudgeContext } from '../../contexts/NudgeContext';
import type { NudgeConfig } from '../../data/nudges';
import { pulseElement } from '../../utils/nudgeUtils';

const AUTH_PATHS = [
  '/login', '/signup', '/survey', '/confirmer-inscription',
  '/renvoyer-confirmation', '/verifier-email',
  '/mot-de-passe-oublie', '/reinitialiser-mot-de-passe',
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Star, Bell, BarChart2, BellPlus, SlidersHorizontal, LayoutGrid, Lock,
};

function NudgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

interface Props {
  nudge: NudgeConfig;
  onAction?: (action: string) => void;
}

export default function NudgeBanner({ nudge, onAction }: Props) {
  const { dismissNudge } = useNudgeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();

  if (AUTH_PATHS.includes(location.pathname)) return null;

  function executeAction(cta_action: string) {
    dismissNudge(nudge.id);
    // Actions déléguées à la page parente (watchlist, alerte, comparateur, heatmap, screener)
    if (
      cta_action === 'OPEN_WATCHLIST' ||
      cta_action === 'OPEN_ALERT_MODAL' ||
      cta_action === 'OPEN_COMPARATOR' ||
      cta_action === 'OPEN_HEATMAP' ||
      cta_action === 'OPEN_SCREENER'
    ) {
      onAction?.(cta_action);
      return;
    }
    if (cta_action.startsWith('NAVIGATE:')) {
      navigate(cta_action.replace('NAVIGATE:', ''));
      return;
    }
    if (cta_action.startsWith('SCROLL_TO:')) {
      const id = cta_action.replace('SCROLL_TO:', '');
      // Scroll + pulse avec un léger délai pour laisser le composant se démonter
      setTimeout(() => pulseElement(id, true), 100);
      return;
    }
  }

  if (nudge.style === 'banner') return <BannerVariant nudge={nudge} onExecute={executeAction} reducedMotion={reducedMotion} />;
  if (nudge.style === 'toast') return <ToastVariant nudge={nudge} onExecute={executeAction} reducedMotion={reducedMotion} />;
  if (nudge.style === 'tooltip') return <TooltipVariant nudge={nudge} onExecute={executeAction} reducedMotion={reducedMotion} />;
  if (nudge.style === 'modal') return <ModalVariant nudge={nudge} onExecute={executeAction} reducedMotion={reducedMotion} />;
  return null;
}

// ─── Banner ──────────────────────────────────────────────────────────────────

function BannerVariant({
  nudge,
  onExecute,
  reducedMotion,
}: {
  nudge: NudgeConfig;
  onExecute: (a: string) => void;
  reducedMotion: boolean;
}) {
  const { dismissNudge } = useNudgeContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const animClass = reducedMotion
    ? 'opacity-100'
    : `transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full border-l-4 border-blue-500 bg-blue-50 px-4 py-3 flex items-center gap-3 shadow-sm ${animClass}`}
    >
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
        <NudgeIcon name={nudge.icon} className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 leading-tight">{nudge.title}</p>
        <p className="text-xs text-blue-700 leading-snug mt-0.5 sm:inline hidden">{nudge.message}</p>
      </div>
      <button
        onClick={() => onExecute(nudge.cta_action)}
        className="flex-shrink-0 text-xs font-medium bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors whitespace-nowrap"
      >
        {nudge.cta_label}
      </button>
      <button
        onClick={() => dismissNudge(nudge.id)}
        aria-label="Fermer"
        className="flex-shrink-0 text-blue-400 hover:text-blue-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

const TOAST_DURATION = 8000;

function ToastVariant({
  nudge,
  onExecute,
  reducedMotion,
}: {
  nudge: NudgeConfig;
  onExecute: (a: string) => void;
  reducedMotion: boolean;
}) {
  const { dismissNudge } = useNudgeContext();
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const pausedRef = useRef(false);
  const startRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(TOAST_DURATION);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    function tick() {
      if (pausedRef.current) {
        startRef.current = Date.now();
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - startRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      startRef.current = Date.now();
      setProgress((remainingRef.current / TOAST_DURATION) * 100);
      if (remainingRef.current <= 0) {
        dismissNudge(nudge.id);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dismissNudge, nudge.id]);

  const animClass = reducedMotion
    ? 'opacity-100'
    : `transition-all duration-300 ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; startRef.current = Date.now(); }}
      onFocus={() => { pausedRef.current = true; }}
      onBlur={() => { pausedRef.current = false; startRef.current = Date.now(); }}
      className={`fixed bottom-4 right-4 z-50 w-80 max-sm:w-[calc(100vw-2rem)] max-sm:right-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${animClass}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <NudgeIcon name={nudge.icon} className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{nudge.title}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">{nudge.message}</p>
          </div>
          <button
            onClick={() => dismissNudge(nudge.id)}
            aria-label="Fermer"
            className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => onExecute(nudge.cta_action)}
          className="mt-3 w-full text-xs font-medium bg-orange-600 text-white rounded-lg px-3 py-2 hover:bg-orange-700 transition-colors"
        >
          {nudge.cta_label}
        </button>
      </div>
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-orange-400 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function TooltipVariant({
  nudge,
  onExecute,
  reducedMotion,
}: {
  nudge: NudgeConfig;
  onExecute: (a: string) => void;
  reducedMotion: boolean;
}) {
  const { dismissNudge } = useNudgeContext();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        dismissNudge(nudge.id);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dismissNudge, nudge.id]);

  const animClass = reducedMotion
    ? 'opacity-100'
    : `transition-all duration-300 ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`;

  return (
    <div
      ref={ref}
      role="tooltip"
      className={`fixed bottom-20 right-4 z-50 w-60 bg-white rounded-xl shadow-xl border border-gray-200 p-4 ${animClass}`}
    >
      {/* Arrow */}
      <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-gray-200 rotate-45" />
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-1.5 text-purple-600">
          <NudgeIcon name={nudge.icon} className="w-4 h-4" />
          <span className="text-xs font-semibold text-gray-900">{nudge.title}</span>
        </span>
        <button onClick={() => dismissNudge(nudge.id)} aria-label="Fermer" className="text-gray-400 hover:text-gray-700">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-gray-600 leading-snug mb-3">{nudge.message}</p>
      <button
        onClick={() => onExecute(nudge.cta_action)}
        className="w-full text-xs font-medium bg-purple-600 text-white rounded-lg px-3 py-2 hover:bg-purple-700 transition-colors"
      >
        {nudge.cta_label}
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalVariant({
  nudge,
  onExecute,
  reducedMotion,
}: {
  nudge: NudgeConfig;
  onExecute: (a: string) => void;
  reducedMotion: boolean;
}) {
  const { dismissNudge } = useNudgeContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') dismissNudge(nudge.id);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismissNudge, nudge.id]);

  const overlayClass = reducedMotion
    ? 'opacity-100'
    : `transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`;

  const cardClass = reducedMotion
    ? 'opacity-100 scale-100'
    : `transition-all duration-300 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`;

  const content = (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClass}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => dismissNudge(nudge.id)} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center ${cardClass}`}
      >
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <NudgeIcon name={nudge.icon} className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{nudge.title}</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">{nudge.message}</p>
        <button
          onClick={() => onExecute(nudge.cta_action)}
          className="w-full bg-blue-600 text-white font-semibold rounded-xl py-3 hover:bg-blue-700 transition-colors mb-3"
        >
          {nudge.cta_label}
        </button>
        <button
          onClick={() => dismissNudge(nudge.id)}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Pas maintenant
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
