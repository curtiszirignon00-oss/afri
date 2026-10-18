import React, { useEffect, useState } from 'react';
import { CheckCircle, Flame, Users, FileSearch, LineChart, Scale, Gavel } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';
import { formatCountdown } from '../../utils/promo';
import {
  ANALYSIS_PACKS, ANALYSIS_DELIVERABLES, ANALYSIS_DEADLINE_LABEL,
  analysisOfferOpen, analysisRemainingMs, analysisDisplayPrice, type AnalysisPackId,
} from '../../config/analysisPacks';

type SeatInfo = { reserved: number; limit: number; soldOut: boolean };

const DELIVERABLE_ICONS = [FileSearch, LineChart, Scale, Gavel];

function fmt(n: number) { return n.toLocaleString('fr-FR'); }

/** ÉTAGÈRE 2 · « J'accède aux analyses » — 3 packs, places limitées + tarif de lancement daté. */
const AnalysisPacks: React.FC<{ onChoose: (id: AnalysisPackId) => void }> = ({ onChoose }) => {
  const [seats, setSeats] = useState<Record<string, SeatInfo> | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetch(`${API_BASE_URL}/webinars/cohort-seats`)
      .then((r) => r.json())
      .then((d) => setSeats(d.data ?? null))
      .catch(() => { /* silencieux */ });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const open = analysisOfferOpen(now);

  return (
    <section id="analyses" className="px-4 sm:px-6 py-14 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        {/* Bandeau tarif de lancement */}
        {open ? (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-600 px-5 py-4 text-white text-center shadow-lg">
            <p className="text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 flex-wrap">
              <Flame className="w-5 h-5" /> Tarif lancement <span className="underline">-50 %</span> jusqu'au <span className="underline">{ANALYSIS_DEADLINE_LABEL}</span> · places limitées par pack
            </p>
            <p className="text-xs sm:text-sm font-semibold mt-1 text-emerald-100">Se termine dans <span className="font-mono font-extrabold text-white">{formatCountdown(analysisRemainingMs(now))}</span></p>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl bg-gray-700 px-5 py-4 text-white text-center shadow-lg">
            <p className="text-sm sm:text-base font-extrabold">Le tarif de lancement est terminé</p>
            <p className="text-xs sm:text-sm font-semibold mt-1 text-gray-300">Les packs restent disponibles au plein tarif, dans la limite des places.</p>
          </div>
        )}

        {/* En-tête étagère */}
        <p className="text-xs font-bold uppercase tracking-widest text-teal-700 text-center mb-3">
          Étagère 2 · <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full">Nouveau</span>
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-3" style={{ letterSpacing: '-0.01em' }}>
          J'accède aux analyses
        </h2>
        <p className="text-gray-500 text-center text-sm max-w-2xl mx-auto mb-10">
          Les analyses livrées, décortiquées avec toi en session live, plus les templates de valorisation que tu apprends à mettre à jour toi-même.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {ANALYSIS_PACKS.map((p) => {
            const dark = p.highlight;
            const s = seats?.[`analyses-${p.id}`];
            const soldOut = !!s?.soldOut;
            const price = analysisDisplayPrice(p, now);
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border flex flex-col ${dark ? 'order-first md:order-none bg-gradient-to-br from-teal-800 to-emerald-900 border-teal-600/30 shadow-2xl md:-mt-3 md:mb-3' : 'bg-white border-gray-200 shadow-sm'}`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap shadow bg-amber-400 text-amber-950">
                    {p.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${dark ? 'text-teal-200' : 'text-gray-400'}`}>{p.scope}</p>
                  <p className={`text-lg font-extrabold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{p.name}</p>
                  <p className={`text-sm mb-4 leading-snug ${dark ? 'text-teal-50' : 'text-gray-500'}`}>{p.tagline}</p>

                  {/* Prix */}
                  <div className="mb-1 flex items-baseline gap-2 flex-wrap">
                    <span className={`text-3xl font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>{fmt(price)}</span>
                    <span className={`text-sm font-semibold ${dark ? 'text-teal-200' : 'text-gray-500'}`}>XOF</span>
                    {open && (
                      <>
                        <span className={`text-base line-through font-semibold ${dark ? 'text-teal-300/70' : 'text-gray-400'}`}>{fmt(p.full)}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500 text-white">-50 %</span>
                      </>
                    )}
                  </div>
                  <p className={`text-xs font-semibold mb-4 ${dark ? 'text-amber-200' : 'text-emerald-600'}`}>
                    {open ? `${p.perShare} · tarif lancement` : 'Plein tarif'}
                  </p>

                  {/* Places restantes */}
                  {s && (() => {
                    const remaining = Math.max(0, s.limit - s.reserved);
                    const ratio = Math.min(100, Math.round((s.reserved / s.limit) * 100));
                    return (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span className={`flex items-center gap-1 ${dark ? 'text-teal-100' : 'text-gray-500'}`}><Users className="w-3 h-3" /> {s.reserved}/{s.limit} places réservées</span>
                          <span className={soldOut ? 'text-red-500' : (dark ? 'text-emerald-300' : 'text-emerald-600')}>{soldOut ? 'Complet' : `${remaining} restante${remaining > 1 ? 's' : ''}`}</span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${dark ? 'bg-white/15' : 'bg-gray-100'}`}>
                          <div className={`h-full rounded-full ${soldOut ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => onChoose(p.id)}
                    disabled={soldOut}
                    className={`w-full py-3 rounded-xl font-extrabold text-sm transition-all active:scale-95 mb-5 disabled:opacity-50 disabled:cursor-not-allowed ${dark
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 hover:from-amber-300 hover:to-orange-300 shadow-lg'
                      : 'border-2 border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-700'}`}
                  >
                    {soldOut ? 'Pack complet' : `${p.cta} →`}
                  </button>

                  <ul className="space-y-2 mt-auto">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dark ? 'text-emerald-300' : 'text-emerald-500'}`} />
                        <span className={`text-xs leading-snug ${dark ? 'text-teal-50' : 'text-gray-700'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ce que contient chaque action analysée */}
        <div className="mt-14">
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 text-center mb-2">Ce que contient chaque action analysée</h3>
          <p className="text-gray-500 text-center text-sm mb-8">Le même standard de livraison sur chaque valeur, quel que soit le pack.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ANALYSIS_DELIVERABLES.map((d, i) => {
              const Icon = DELIVERABLE_ICONS[i];
              return (
                <div key={d.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <Icon className="w-5 h-5 text-teal-600 mb-3" />
                  <p className="font-bold text-gray-900 text-sm mb-1">{d.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{d.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          ✓ Réservation gratuite ou paiement immédiat&nbsp;&nbsp;·&nbsp;&nbsp;Paiement Mobile Money sécurisé&nbsp;&nbsp;·&nbsp;&nbsp;Analyses fournies à titre informatif, pas un conseil en investissement
        </p>
      </div>
    </section>
  );
};

export default AnalysisPacks;
