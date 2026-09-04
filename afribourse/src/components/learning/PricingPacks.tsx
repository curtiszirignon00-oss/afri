import React from 'react';
import { Check, Gift, Landmark } from 'lucide-react';
import { applyPromo, promoPercent, isPromoActive } from '../../utils/promo';
import { usePromoCountdown } from '../../hooks/usePromoCountdown';

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
    badge: 'populaire',
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
    badge: 'complet',
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
            <span>Choisis ton parcours</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">3 niveaux d'accompagnement</h2>
          <p className="text-gray-600 max-w-2xl">
            Tous les packs incluent les <strong className="font-semibold text-gray-900">5 webinaires fondamentaux (W1→W5)</strong>.
            Ce qui change : le niveau d'accompagnement et la profondeur du programme. L'ouverture de
            compte SGI est comprise dans chacun : guide écrit, session collective, ou main dans la main.
          </p>
        </div>

        {/* Cartes — meme gabarit que le choix de formule de la page de paiement :
            carte blanche, bordure navy doublee sur le pack mis en avant, prix en
            chiffres tabulaires, coches navy et bouton ancre en pied. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PACKS.map((p) => {
            const featured = p.highlight;
            const promoOn = isPromoActive();
            const pct = promoPercent(p.id);
            const price = applyPromo(p.id, p.price);
            const monthly = applyPromo(p.id, p.monthly);

            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl bg-white p-5 transition-all duration-300 ${
                  p.id === 'parcours' ? 'order-first md:order-none' : ''
                } ${
                  featured
                    ? 'border-2 border-brand-navy shadow-md'
                    : 'border border-gray-200 shadow-sm hover:border-brand-navy/40 hover:shadow-md'
                }`}
              >
                {/* Nom + badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-gray-900">{p.name}</h3>
                  {p.badge && (
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                        featured
                          ? 'bg-brand-orange/10 text-brand-orange-dark border border-brand-orange/30'
                          : 'bg-ink-50 text-brand-navy border border-ink-200'
                      }`}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Prix */}
                <p className="text-2xl font-extrabold text-gray-900 font-mono tabular-nums leading-none">
                  {fmt(price)}
                  <span className="text-sm font-semibold text-gray-400 ml-1.5">FCFA</span>
                </p>
                {promoOn && pct > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    <span className="line-through font-mono">{fmt(p.price)}</span>
                    <span className="ml-2 font-semibold text-green-600">-{pct}%</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {promoOn ? 'Offre flash : paiement en une fois' : `ou dès ${fmt(monthly)} FCFA/mois en 3×`}
                </p>
                <p className="text-sm text-gray-500 leading-snug mt-3">{p.tagline}</p>

                {/* Inclusions */}
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-5 mb-2.5">
                  {p.includesTitle}
                </p>
                <ul className="space-y-2 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                      <Check className="w-3.5 h-3.5 text-brand-navy shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* SGI et bonus — deux rangees strictement identiques : meme
                    tuile d'icone, meme micro-titre, meme gouttiere. La symetrie
                    tient meme quand les deux textes n'ont pas la meme longueur. */}
                <div className="mt-5 rounded-xl overflow-hidden bg-gray-50 divide-y divide-gray-200/70">
                  {[
                    { icon: Landmark, label: 'Compte SGI', text: p.sgiDesc, minH: 'min-h-[3.6rem]' },
                    { icon: Gift, label: 'Bonus', text: p.bonus, minH: 'min-h-[2.4rem]' },
                  ].map(({ icon: Icon, label, text, minH }) => (
                    <div key={label} className="flex gap-3 p-4">
                      <span className="shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 text-brand-navy flex items-center justify-center">
                        <Icon className="w-4 h-4" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                        <p className={`text-xs leading-relaxed text-gray-600 ${minH}`}>{text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA — plein navy sur le pack mis en avant, contour ailleurs. */}
                <button
                  type="button"
                  onClick={() => onChoose(p.id)}
                  className={`mt-6 w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold transition-colors ${
                    featured
                      ? 'bg-brand-navy text-white hover:bg-brand-navy-hover'
                      : 'border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default PricingPacks;
