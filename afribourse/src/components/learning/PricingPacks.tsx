import React from 'react';
import { BookOpen, Check, Flame, Gift, Landmark } from 'lucide-react';
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
      'Deal Flow hebdomadaire : 12 éditions (3 mois)',
      'Communauté Afribourse : 3 mois',
      'Replays à vie des 5 sessions',
      'Certificat Investisseur BRVM Niveau 1',
    ],
    sgiTitle: 'Ouverture de compte SGI',
    sgiDesc: 'Guide écrit complet, contact SGI partenaire et accès à la session W9 live : tu fais les démarches toi-même.',
    bonus: '1 mois Investisseur+ offert · -10% sur la cohorte suivante',
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
      'Webinaire W6 : constitution de portefeuille',
      'Webinaire W7 : gestion du risque',
      'Revue de portefeuille simulé personnalisée (semaine 6)',
      'Session Q&A live mensuelle : 1h/mois × 3 mois',
    ],
    sgiTitle: 'Ouverture de compte SGI',
    sgiDesc: 'Tout le Starter, plus une session collective live avec le représentant SGI pour ouvrir ton compte en groupe.',
    bonus: "1 mois Investisseur+ · Proche invité à -20% · Template portefeuille Excel",
    cta: 'Je rejoins le Parcours',
  },
  {
    id: 'investisseur',
    name: 'Investisseur',
    tagline: "J'investis comme un pro et je maximise mes profits",
    price: 150000,
    monthly: 53000,
    badge: 'Expérience complète',
    highlight: false,
    includesTitle: 'Tout le Parcours, plus',
    features: [
      "Webinaire W8 : psychologie de l'investisseur",
      'Webinaire W9 : IA et finance',
      'Appel 1:1 de 30 min avec votre coach (revue personnelle)',
      'Investment Policy Statement personnalisé (tes règles)',
      'Accès à vie aux replays, y compris cohortes futures',
    ],
    sgiTitle: 'Ouverture de compte SGI, main dans la main',
    sgiDesc: 'Dossier vérifié par un analyste, interlocuteur SGI nommé et accompagnement sur ton premier ordre réel.',
    bonus: '2 mois Investisseur+ · -50% à vie · Badge Fondateur · Co-animer une session',
    cta: 'Rejoindre en Investisseur',
  },
];

function fmt(n: number) { return n.toLocaleString('fr-FR'); }

const PricingPacks: React.FC<{ onChoose: (id: PackId) => void }> = ({ onChoose }) => {
  const countdown = usePromoCountdown();

  return (
    <section id="packs" className="bg-gray-50 pt-10 pb-8 md:pt-14 md:pb-12 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Bandeau promo 24h — orange de marque : c'est la couleur d'attention
            du site, elle evite un rouge qui n'appartient a aucune charte. */}
        {countdown.active && (
          <div className="mb-10 rounded-xl bg-brand-orange px-5 py-4 text-white text-center shadow-sm">
            <p className="font-bold flex items-center justify-center gap-2 flex-wrap">
              <Flame className="w-5 h-5 shrink-0" />
              Offre flash 24h · Starter <span className="underline">-50%</span> · Parcours &amp; Investisseur <span className="underline">-30%</span>
            </p>
            <p className="text-sm font-semibold mt-1 text-white/80">
              Se termine dans <span className="font-mono font-bold text-white">{countdown.label}</span>
            </p>
          </div>
        )}

        {/* En-tête — aligne a gauche, meme gabarit que les titres de section de
            l'accueil : pastille qui bat, titre, chapeau borne en largeur. */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-brand-navy/10 text-brand-navy px-3 py-1.5 rounded-full text-xs font-bold mb-4">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>Choisis ton parcours</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">3 niveaux d'accompagnement</h2>
          <p className="text-gray-600 max-w-2xl">
            Tous les packs incluent les <strong className="font-semibold text-gray-900">5 webinaires fondamentaux (W1→W5)</strong>.
            Ce qui change : le niveau d'accompagnement et la profondeur du programme. L'ouverture de
            compte SGI est comprise dans chacun : guide écrit, session collective, ou main dans la main.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PACKS.map((p) => {
            // Le pack mis en avant reprend l'aplat navy des encarts de l'accueil.
            const dark = p.highlight;

            // Une seule echelle de tons par carte : le reste du markup s'y
            // reporte au lieu de re-tester `dark` a chaque ligne.
            const tone = dark
              ? { title: 'text-white', body: 'text-white/80', muted: 'text-white/55', accent: 'text-brand-orange-light' }
              : { title: 'text-gray-900', body: 'text-gray-700', muted: 'text-gray-500', accent: 'text-brand-navy' };

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border flex flex-col transition-all duration-300 ${
                  p.id === 'parcours' ? 'order-first md:order-none' : ''
                } ${
                  dark
                    ? 'bg-brand-navy border-brand-navy text-white shadow-md shadow-brand-navy/20'
                    : 'bg-white border-gray-200 shadow-sm hover:border-brand-navy/25 hover:shadow-md'
                }`}
              >
                {p.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${
                      dark ? 'bg-brand-orange text-white' : 'bg-white text-brand-navy border border-brand-navy/25'
                    }`}
                  >
                    {p.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col h-full">
                  {/* Nom + promesse. Les icones Star et Trophy ne distinguaient
                      que deux cartes sur trois : le badge suffit a hierarchiser. */}
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${tone.accent}`}>
                    {p.name}
                  </p>
                  <p className={`text-sm mb-5 leading-snug ${tone.muted}`}>{p.tagline}</p>

                  {/* Prix */}
                  {(() => {
                    const promoOn = isPromoActive();
                    const pct = promoPercent(p.id);
                    const price = applyPromo(p.id, p.price);
                    const monthly = applyPromo(p.id, p.monthly);
                    return (
                      <>
                        <div className="mb-1 flex items-baseline gap-2 flex-wrap">
                          <span className={`text-3xl font-bold ${tone.title}`}>{fmt(price)}</span>
                          <span className={`text-sm font-semibold ${tone.muted}`}>XOF</span>
                          {promoOn && pct > 0 && (
                            <>
                              <span className={`text-base line-through font-semibold ${tone.muted}`}>{fmt(p.price)}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-orange text-white">
                                -{pct}%
                              </span>
                            </>
                          )}
                        </div>
                        <p className={`text-sm mb-6 ${tone.muted}`}>
                          {promoOn ? 'Offre flash : paiement en une fois' : `ou dès ${fmt(monthly)} XOF/mois en 3×`}
                        </p>
                      </>
                    );
                  })()}

                  {/* CTA — orange sur le pack mis en avant, contour navy ailleurs.
                      Meme paire que le hero et le bandeau de l'accueil. */}
                  <Button
                    variant={dark ? 'orange' : 'navyOutline'}
                    size="md"
                    className="w-full h-12 mb-6"
                    onClick={() => onChoose(p.id)}
                  >
                    {p.cta}
                  </Button>

                  {/* Inclusions */}
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${tone.muted}`}>
                    {p.includesTitle}
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tone.accent}`} strokeWidth={2.5} />
                        <span className={`text-sm leading-snug ${tone.body}`}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {/* SGI et bonus — panneau a deux rangees strictement
                      identiques : meme tuile d'icone, meme micro-titre, meme
                      gouttiere. La symetrie tient meme quand les deux textes
                      n'ont pas la meme longueur. */}
                  <div className={`mt-auto rounded-xl overflow-hidden divide-y ${
                    dark ? 'bg-white/[0.06] divide-white/10' : 'bg-gray-50 divide-gray-200/70'
                  }`}>
                    {[
                      { icon: Landmark, label: 'Compte SGI', text: p.sgiDesc, minH: 'min-h-[3.6rem]' },
                      { icon: Gift, label: 'Bonus', text: p.bonus, minH: 'min-h-[2.4rem]' },
                    ].map(({ icon: Icon, label, text, minH }) => (
                      <div key={label} className="flex gap-3 p-4">
                        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                          dark
                            ? 'bg-white/10 ring-1 ring-white/15 text-brand-orange-light'
                            : 'bg-white border border-gray-200 text-brand-navy'
                        }`}>
                          <Icon className="w-4 h-4" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${tone.muted}`}>
                            {label}
                          </p>
                          <p className={`text-sm leading-snug ${minH} ${tone.body}`}>{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default PricingPacks;