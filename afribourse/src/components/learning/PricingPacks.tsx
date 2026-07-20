import React from 'react';
import { CheckCircle, Landmark, Gift, Star, Trophy } from 'lucide-react';

export type PackId = 'starter' | 'parcours' | 'investisseur';

interface Pack {
  id: PackId;
  name: string;
  tagline: string;
  price: number;
  monthly: number;
  badge: string | null;
  highlight: boolean;
  includesTitle: string;
  features: string[];
  sgiTitle: string;
  sgiDesc: string;
  bonus: string;
  cta: string;
}

const PACKS: Pack[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Je comprends la BRVM et je pose mes bases',
    price: 70000,
    monthly: 25000,
    badge: null,
    highlight: false,
    includesTitle: 'Ce qui est inclus',
    features: [
      '5 webinaires live W1→W5 (fondamentaux + analyse + technique)',
      "5 plans d'action personnalisés",
      'Deal Flow hebdomadaire — 12 éditions (3 mois)',
      'Communauté Afribourse — 3 mois',
      'Replays à vie des 5 sessions',
      'Certificat Investisseur BRVM Niveau 1',
    ],
    sgiTitle: 'Ouverture de compte SGI',
    sgiDesc: 'Guide écrit complet + contact SGI partenaire + accès à la session W9 live (vous faites les démarches avec le guide).',
    bonus: '1 mois Investisseur+ offert + 10% de réduction sur la cohorte suivante',
    cta: 'Choisir Starter',
  },
  {
    id: 'parcours',
    name: 'Parcours',
    tagline: 'Je construis ma stratégie et je gère mon risque',
    price: 100000,
    monthly: 35000,
    badge: '⭐ Le plus populaire',
    highlight: true,
    includesTitle: 'Tout le Starter, plus',
    features: [
      'Webinaire W6 — Constitution de portefeuille',
      'Webinaire W7 — Gestion du risque',
      'Revue de portefeuille simulé personnalisée (semaine 6)',
      'Session Q&A live mensuelle — 1h/mois × 3 mois',
    ],
    sgiTitle: 'Ouverture de compte SGI',
    sgiDesc: 'Tout le Starter + session collective live avec le représentant SGI — tu ouvres ton compte avec le groupe, guidé étape par étape.',
    bonus: "1 mois Investisseur+ · Invitation d'un proche à -20% · Template portefeuille BRVM Excel",
    cta: 'Je rejoins le Parcours',
  },
  {
    id: 'investisseur',
    name: 'Investisseur',
    tagline: "De la simulation à l'achat réel — accompagnement premium",
    price: 150000,
    monthly: 53000,
    badge: '🏆 Expérience complète',
    highlight: false,
    includesTitle: 'Tout le Parcours, plus',
    features: [
      "Webinaire W8 — Psychologie de l'investisseur",
      'Appel 1:1 de 30 min avec Curtis (revue personnelle)',
      'Investment Policy Statement personnalisé (tes règles)',
      'Accès à vie aux replays, y compris cohortes futures',
    ],
    sgiTitle: 'Ouverture de compte SGI — Main dans la main',
    sgiDesc: 'Curtis ou un analyste vérifie ton dossier avant soumission + mise en relation directe avec un interlocuteur SGI nommé + accompagnement pour ton premier ordre réel.',
    bonus: '2 mois Investisseur+ · Accès cohortes futures à -50% permanent · Badge Membre Fondateur · Invitation à co-animer une session',
    cta: 'Rejoindre en Investisseur',
  },
];

function fmt(n: number) { return n.toLocaleString('fr-FR'); }

const PricingPacks: React.FC<{ onChoose: (id: PackId) => void }> = ({ onChoose }) => {
  return (
    <section id="packs" className="px-4 sm:px-6 py-14 bg-gray-50 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 text-center mb-3">Choisis ton parcours</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center mb-3" style={{ letterSpacing: '-0.01em' }}>
          3 niveaux d'accompagnement
        </h2>
        <p className="text-gray-500 text-center text-sm max-w-2xl mx-auto mb-1">
          Tous les packs incluent les <strong>5 webinaires fondamentaux (W1→W5)</strong>. Ce qui change : le niveau d'accompagnement et la profondeur du programme.
        </p>
        <p className="text-gray-400 text-center text-xs max-w-2xl mx-auto mb-10">
          🏦 Ouverture de compte SGI incluse dans chaque pack — guide écrit · session collective · ou main dans la main.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PACKS.map((p) => {
            const dark = p.highlight;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border flex flex-col ${p.id === 'parcours' ? 'order-first md:order-none' : ''} ${
                  dark
                    ? 'bg-gradient-to-br from-blue-800 to-indigo-900 border-blue-600/30 shadow-2xl md:-mt-3 md:mb-3'
                    : p.id === 'investisseur'
                      ? 'bg-white border-amber-300 shadow-md'
                      : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                {p.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap shadow ${
                    dark ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {p.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  {/* Header pack */}
                  <div className="flex items-center gap-2 mb-1">
                    {p.id === 'parcours' && <Star className={`w-4 h-4 ${dark ? 'text-amber-300' : 'text-blue-600'}`} />}
                    {p.id === 'investisseur' && <Trophy className="w-4 h-4 text-amber-500" />}
                    <p className={`text-xs font-extrabold uppercase tracking-widest ${dark ? 'text-amber-300' : 'text-blue-600'}`}>{p.name}</p>
                  </div>
                  <p className={`text-sm mb-4 leading-snug ${dark ? 'text-blue-100' : 'text-gray-500'}`}>« {p.tagline} »</p>

                  {/* Prix */}
                  <div className="mb-1">
                    <span className={`text-3xl font-extrabold ${dark ? 'text-white' : 'text-gray-900'}`}>{fmt(p.price)}</span>
                    <span className={`text-sm font-semibold ${dark ? 'text-blue-200' : 'text-gray-500'}`}> XOF</span>
                  </div>
                  <p className={`text-xs font-semibold mb-4 ${dark ? 'text-amber-200' : 'text-emerald-600'}`}>
                    ou dès {fmt(p.monthly)} XOF/mois (paiement en 3×)
                  </p>

                  {/* CTA */}
                  <button
                    onClick={() => onChoose(p.id)}
                    className={`w-full py-3 rounded-xl font-extrabold text-sm transition-all active:scale-95 mb-5 ${
                      dark
                        ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 hover:from-amber-300 hover:to-orange-300 shadow-lg'
                        : p.id === 'investisseur'
                          ? 'border-2 border-amber-400 text-amber-700 hover:bg-amber-50'
                          : 'border-2 border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                    }`}
                  >
                    {p.cta} →
                  </button>

                  {/* Inclusions */}
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 text-center ${dark ? 'text-blue-200' : 'text-gray-400'}`}>
                    ── {p.includesTitle} ──
                  </p>
                  <ul className="space-y-2 mb-4">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dark ? 'text-emerald-400' : 'text-emerald-500'}`} />
                        <span className={`text-xs leading-snug ${dark ? 'text-blue-50' : 'text-gray-700'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* SGI */}
                  <div className={`rounded-xl p-3 mb-3 ${dark ? 'bg-white/10 border border-white/15' : 'bg-blue-50 border border-blue-100'}`}>
                    <p className={`text-xs font-bold flex items-center gap-1.5 mb-1 ${dark ? 'text-white' : 'text-blue-800'}`}>
                      <Landmark className="w-3.5 h-3.5 flex-shrink-0" /> {p.sgiTitle}
                    </p>
                    <p className={`text-[11px] leading-snug ${dark ? 'text-blue-100' : 'text-gray-600'}`}>{p.sgiDesc}</p>
                  </div>

                  {/* Bonus */}
                  <div className={`rounded-xl p-3 mt-auto ${dark ? 'bg-amber-400/15 border border-amber-300/30' : 'bg-amber-50 border border-amber-200'}`}>
                    <p className={`text-xs font-bold flex items-start gap-1.5 ${dark ? 'text-amber-200' : 'text-amber-800'}`}>
                      <Gift className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> <span className="leading-snug">Bonus : {p.bonus}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Réassurance commune */}
        <p className="text-center text-xs text-gray-500 mt-8">
          ✓ Satisfait ou remboursé 7 jours&nbsp;&nbsp;·&nbsp;&nbsp;Paiement Mobile Money sécurisé&nbsp;&nbsp;·&nbsp;&nbsp;Places limitées à 50 par session
        </p>
      </div>
    </section>
  );
};

export default PricingPacks;
