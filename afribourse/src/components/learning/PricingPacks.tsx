import React from 'react';
import { CheckCircle, Landmark, Gift, Star, Trophy, Flame, ChevronRight } from 'lucide-react';
import { applyPromo, promoPercent, isPromoActive } from '../../utils/promo';
import { usePromoCountdown } from '../../hooks/usePromoCountdown';
import { Button } from '../ui';

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
    badge: 'Le plus populaire',
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
    tagline: "J'investis comme un pro — je maximise mes profits",
    price: 150000,
    monthly: 53000,
    badge: 'Expérience complète',
    highlight: false,
    includesTitle: 'Tout le Parcours, plus',
    features: [
      "Webinaire W8 — Psychologie de l'investisseur",
      'Webinaire W9 — IA et Finance',
      'Appel 1:1 de 30 min avec votre coach (revue personnelle)',
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
  const countdown = usePromoCountdown();

  return (
    <section id="packs" className="bg-gray-50 py-16 md:py-24 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Bandeau promo 24h — orange de marque : c'est la couleur d'attention
            du site, elle evite un rouge qui n'appartient a aucune charte. */}
        {countdown.active && (
          <div className="mb-10 rounded-xl bg-brand-orange px-5 py-4 text-white text-center shadow-sm">
            <p className="font-bold flex items-center justify-center gap-2 flex-wrap">
              <Flame className="w-5 h-5 shrink-0" />
              Offre flash 24h — Starter <span className="underline">-50%</span> · Parcours &amp; Investisseur <span className="underline">-30%</span>
            </p>
            <p className="text-sm font-semibold mt-1 text-white/80">
              Se termine dans <span className="font-mono font-bold text-white">{countdown.label}</span>
            </p>
          </div>
        )}

        {/* En-tête — meme gabarit que les titres de section de l'accueil */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-navy mb-3">Choisis ton parcours</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">3 niveaux d'accompagnement</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tous les packs incluent les <strong className="font-semibold text-gray-900">5 webinaires fondamentaux (W1→W5)</strong>.
            Ce qui change : le niveau d'accompagnement et la profondeur du programme. L'ouverture de
            compte SGI est comprise dans chacun — guide écrit, session collective, ou main dans la main.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PACKS.map((p) => {
            // Le pack mis en avant reprend l'aplat navy des encarts de l'accueil.
            const dark = p.highlight;
            return (
              <div
                key={p.id}
                className={`relative rounded-xl border flex flex-col transition-all duration-300 ${
                  p.id === 'parcours' ? 'order-first md:order-none' : ''
                } ${
                  dark
                    ? 'bg-brand-navy border-brand-navy text-white shadow-md shadow-brand-navy/20 md:-mt-3 md:mb-3'
                    : 'bg-white border-gray-200 shadow-sm hover:border-brand-navy/25 hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${
                      dark
                        ? 'bg-brand-orange text-white'
                        : 'bg-white text-brand-navy border border-brand-navy/25'
                    }`}
                  >
                    {p.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  {/* Header pack */}
                  <div className="flex items-center gap-2 mb-1">
                    {p.id === 'parcours' && <Star className="w-4 h-4 text-brand-orange-light" />}
                    {p.id === 'investisseur' && <Trophy className="w-4 h-4 text-brand-navy" />}
                    <p className={`text-xs font-bold uppercase tracking-widest ${dark ? 'text-brand-orange-light' : 'text-brand-navy'}`}>
                      {p.name}
                    </p>
                  </div>
                  <p className={`text-sm mb-5 leading-snug ${dark ? 'text-white/70' : 'text-gray-500'}`}>
                    « {p.tagline} »
                  </p>

                  {/* Prix */}
                  {(() => {
                    const promoOn = isPromoActive();
                    const pct = promoPercent(p.id);
                    const price = applyPromo(p.id, p.price);
                    const monthly = applyPromo(p.id, p.monthly);
                    return (
                      <>
                        <div className="mb-1 flex items-baseline gap-2 flex-wrap">
                          <span className={`text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{fmt(price)}</span>
                          <span className={`text-sm font-semibold ${dark ? 'text-white/60' : 'text-gray-500'}`}>XOF</span>
                          {promoOn && pct > 0 && (
                            <>
                              <span className={`text-base line-through font-semibold ${dark ? 'text-white/50' : 'text-gray-400'}`}>
                                {fmt(p.price)}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange text-white">
                                -{pct}%
                              </span>
                            </>
                          )}
                        </div>
                        <p className={`text-sm font-semibold mb-5 ${dark ? 'text-brand-orange-light' : 'text-brand-navy'}`}>
                          {promoOn ? 'Offre flash — paiement en une fois' : `ou dès ${fmt(monthly)} XOF/mois (paiement en 3×)`}
                        </p>
                      </>
                    );
                  })()}

                  {/* CTA — orange sur le pack mis en avant, contour navy ailleurs.
                      Meme paire que le hero et le bandeau de l'accueil. */}
                  <Button
                    variant={dark ? 'orange' : 'navyOutline'}
                    size="md"
                    className="w-full h-12 gap-2 mb-6"
                    onClick={() => onChoose(p.id)}
                  >
                    {p.cta}
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </Button>

                  {/* Inclusions */}
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${dark ? 'text-white/50' : 'text-gray-400'}`}>
                    {p.includesTitle}
                  </p>
                  <ul className="space-y-2 mb-5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${dark ? 'text-brand-orange-light' : 'text-brand-navy'}`} />
                        <span className={`text-sm leading-snug ${dark ? 'text-white/80' : 'text-gray-700'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* SGI */}
                  <div className={`rounded-lg p-4 mb-3 ${dark ? 'bg-white/10 border border-white/15' : 'bg-gray-50 border border-gray-200'}`}>
                    <p className={`text-sm font-bold flex items-center gap-1.5 mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>
                      <Landmark className="w-4 h-4 flex-shrink-0" /> {p.sgiTitle}
                    </p>
                    <p className={`text-sm leading-snug ${dark ? 'text-white/70' : 'text-gray-600'}`}>{p.sgiDesc}</p>
                  </div>

                  {/* Bonus */}
                  <div className={`rounded-lg p-4 mt-auto ${dark ? 'bg-brand-orange/20 border border-brand-orange/40' : 'bg-brand-orange/5 border border-brand-orange/25'}`}>
                    <p className={`text-sm font-semibold flex items-start gap-1.5 ${dark ? 'text-brand-orange-light' : 'text-brand-orange-dark'}`}>
                      <Gift className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">Bonus : {p.bonus}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Réassurance commune */}
        <p className="text-center text-sm text-gray-500 mt-10">
          Satisfait ou remboursé 7 jours&nbsp;&nbsp;·&nbsp;&nbsp;Paiement Mobile Money sécurisé&nbsp;&nbsp;·&nbsp;&nbsp;Places limitées à 50 par session
        </p>

      </div>
    </section>
  );
};

export default PricingPacks;