// src/components/markets/MarketHours.tsx
import { useEffect, useState } from 'react';

/**
 * Bande d'état du marché BRVM : phase en cours + décompte jusqu'à la suivante.
 *
 * La BRVM siège à Abidjan (fuseau GMT/UTC+0) : les horaires officiels sont donc
 * des horaires UTC, et le décompte est calculé en UTC quel que soit le fuseau
 * du visiteur. Séances du lundi au vendredi.
 *
 *   09h00–09h45  pré-ouverture (saisie des ordres, aucune transaction)
 *   09h45        fixing d'ouverture
 *   09h45–14h00  négociation en continu
 *   14h00–14h30  pré-clôture (saisie des ordres, aucune transaction)
 *   14h30        fixing de clôture
 *   14h30–15h00  négociation au dernier cours
 *   15h00        fermeture (± 60 s aléatoires)
 */

/** Minutes depuis minuit UTC. */
const at = (hours: number, minutes = 0) => hours * 60 + minutes;

/** 'live' = transactions en cours · 'auction' = saisie d'ordres sans transaction */
type Tone = 'live' | 'auction' | 'closed';

type Segment = {
  label: string;
  /** Début inclus, minutes depuis minuit UTC */
  start: number;
  /** Fin exclue, minutes depuis minuit UTC */
  end: number;
  /** Ce qui démarre à la fin de ce segment */
  next: string;
  tone: Tone;
};

const SEGMENTS: Segment[] = [
  { label: 'Pré-ouverture',                start: at(9),      end: at(9, 45),  next: "Fixing d'ouverture", tone: 'auction' },
  { label: 'Négociation en continu',       start: at(9, 45),  end: at(14),     next: 'Pré-clôture',        tone: 'live'    },
  { label: 'Pré-clôture',                  start: at(14),     end: at(14, 30), next: 'Fixing de clôture',  tone: 'auction' },
  { label: 'Négociation au dernier cours', start: at(14, 30), end: at(15),     next: 'Fermeture',          tone: 'live'    },
];

const SESSION_OPEN = at(9);

type MarketState = {
  label: string;
  next: string;
  tone: Tone;
  /** Instant de la prochaine transition */
  target: Date;
};

/** Date UTC à minuit, décalée de `offsetDays`. */
function utcMidnight(from: Date, offsetDays = 0): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + offsetDays));
}

function isWeekend(date: Date): boolean {
  const d = date.getUTCDay();
  return d === 0 || d === 6;
}

/** Prochaine ouverture de séance (09h00 UTC du prochain jour ouvré). */
function nextSessionOpen(now: Date): Date {
  // Aujourd'hui si la séance n'a pas encore commencé, sinon à partir de demain
  const startOffset = !isWeekend(now) && now.getUTCHours() * 60 + now.getUTCMinutes() < SESSION_OPEN ? 0 : 1;
  for (let i = startOffset; i < 10; i++) {
    const day = utcMidnight(now, i);
    if (!isWeekend(day)) return new Date(day.getTime() + SESSION_OPEN * 60_000);
  }
  return new Date(utcMidnight(now, 1).getTime() + SESSION_OPEN * 60_000);
}

function getMarketState(now: Date): MarketState {
  if (!isWeekend(now)) {
    const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const segment = SEGMENTS.find(s => minutes >= s.start && minutes < s.end);
    if (segment) {
      return {
        label: segment.label,
        next: segment.next,
        tone: segment.tone,
        target: new Date(utcMidnight(now).getTime() + segment.end * 60_000),
      };
    }
  }
  return {
    label: 'Marché fermé',
    next: 'Pré-ouverture',
    tone: 'closed',
    target: nextSessionOpen(now),
  };
}

/**
 * Décompte : MM:SS sous l'heure, H:MM:SS sur la journée, « 2j 17:00:00 » au-delà
 * (fermeture de week-end : lire « 65:00:00 » n'aide personne).
 */
function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const h = Math.floor((total % 86_400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (days > 0) return `${days}j ${h}:${pad(m)}:${pad(s)}`;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

const TONE_STYLES: Record<Tone, { dot: string; text: string; pulse: boolean }> = {
  live:    { dot: 'bg-emerald-400', text: 'text-emerald-300', pulse: true },
  auction: { dot: 'bg-amber-400',   text: 'text-amber-300',   pulse: true },
  closed:  { dot: 'bg-slate-500',   text: 'text-slate-400',   pulse: false },
};

export default function MarketHours() {
  const [now, setNow] = useState(() => new Date());

  // Décompte à la seconde
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const state = getMarketState(now);
  const tone = TONE_STYLES[state.tone];
  const remaining = state.target.getTime() - now.getTime();

  return (
    <div className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
        {/* État actuel */}
        <span className="flex items-center gap-2 min-w-0">
          <span className="relative flex items-center justify-center w-2 h-2 flex-shrink-0">
            {tone.pulse && (
              <span className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${tone.dot}`} />
            )}
            <span className={`relative inline-flex w-2 h-2 rounded-full ${tone.dot}`} />
          </span>
          <span className="font-semibold truncate">{state.label}</span>
          <span className="hidden sm:inline text-slate-500">· BRVM</span>
        </span>

        {/* Décompte jusqu'à la phase suivante */}
        <span className="flex items-center gap-1.5 flex-shrink-0 text-slate-400">
          <span className="hidden sm:inline">{state.next} dans</span>
          <span className="sm:hidden">{state.next}</span>
          <span className={`font-semibold tabular-nums ${tone.text}`}>
            {formatCountdown(remaining)}
          </span>
        </span>
      </div>
    </div>
  );
}
