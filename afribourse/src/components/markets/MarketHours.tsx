// src/components/markets/MarketHours.tsx
import { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * Horaires d'ouverture de la BRVM (Bourse Régionale des Valeurs Mobilières).
 * La BRVM est basée à Abidjan (fuseau GMT/UTC+0), donc les horaires locaux = UTC.
 * Séances du lundi au vendredi uniquement.
 */

type Phase = {
  key: string;
  label: string;
  /** Minute de début depuis minuit (GMT) */
  start: number;
  /** Minute de fin depuis minuit (GMT) */
  end: number;
  /** Horaire affiché */
  display: string;
  /** Fixing = moment ponctuel de calcul de cours */
  isFixing?: boolean;
};

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

const PHASES: Phase[] = [
  { key: 'pre-open',   label: 'Pré-ouverture',               start: h(9),          end: h(9, 45),  display: '09h00 – 09h45' },
  { key: 'fix-open',   label: "Fixing d'ouverture",          start: h(9, 45),      end: h(9, 45),  display: '09h45', isFixing: true },
  { key: 'continuous', label: 'Négociation en continu',      start: h(9, 45),      end: h(14),     display: '09h45 – 14h00' },
  { key: 'pre-close',  label: 'Pré-clôture',                 start: h(14),         end: h(14, 30), display: '14h00 – 14h30' },
  { key: 'fix-close',  label: 'Fixing de clôture',           start: h(14, 30),     end: h(14, 30), display: '14h30', isFixing: true },
  { key: 'last-price', label: 'Négociation au dernier cours', start: h(14, 30),    end: h(15),     display: '14h30 – 15h00' },
];

const OPEN_MIN = h(9);
const CLOSE_MIN = h(15);

function getGmtNow() {
  const now = new Date();
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const day = now.getUTCDay(); // 0 = dimanche, 6 = samedi
  return { minutes, day, isWeekday: day >= 1 && day <= 5 };
}

export default function MarketHours() {
  const [tick, setTick] = useState(0);

  // Rafraîchit le statut chaque minute
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const { minutes, isWeekday } = useMemo(getGmtNow, [tick]);

  // Détermine la phase active (hors fixings ponctuels)
  const activePhaseKey = useMemo(() => {
    if (!isWeekday) return null;
    const active = PHASES.find(
      (p) => !p.isFixing && minutes >= p.start && minutes < p.end
    );
    return active?.key ?? null;
  }, [minutes, isWeekday]);

  const isOpen = isWeekday && minutes >= OPEN_MIN && minutes < CLOSE_MIN;

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* En-tête avec statut live */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm sm:text-base font-semibold text-gray-800">
            Horaires de la BRVM
          </h2>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOpen ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          {isOpen ? 'Marché ouvert' : 'Marché fermé'}
        </span>
      </div>

      {/* Liste des phases */}
      <ul className="divide-y divide-gray-100">
        {PHASES.map((phase) => {
          const active = phase.key === activePhaseKey;
          return (
            <li
              key={phase.key}
              className={`flex items-center justify-between px-4 sm:px-5 py-2.5 text-sm transition-colors ${
                active ? 'bg-green-50' : ''
              }`}
            >
              <span className="flex items-center gap-2 text-gray-700">
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                )}
                <span className={active ? 'font-semibold text-green-800' : ''}>
                  {phase.label}
                  {phase.isFixing && (
                    <span className="ml-2 text-xs text-gray-400">(fixing)</span>
                  )}
                </span>
              </span>
              <span
                className={`font-medium tabular-nums ${
                  active ? 'text-green-800' : 'text-gray-500'
                }`}
              >
                {phase.display}
              </span>
            </li>
          );
        })}
        {/* Fermeture */}
        <li className="flex items-center justify-between px-4 sm:px-5 py-2.5 text-sm">
          <span className="text-gray-700">Fermeture du marché</span>
          <span className="font-medium tabular-nums text-gray-500">
            15h00 <span className="text-xs text-gray-400">(± 60s)</span>
          </span>
        </li>
      </ul>

      {/* Note fuseau horaire */}
      <p className="px-4 sm:px-5 py-2.5 text-xs text-gray-400 border-t border-gray-100 bg-gray-50/40">
        Heures en GMT/UTC (heure d'Abidjan) · du lundi au vendredi
      </p>
    </div>
  );
}
